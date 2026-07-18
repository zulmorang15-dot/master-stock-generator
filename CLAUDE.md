# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Automated stock video generator that produces 4K ProRes motion graphics for Adobe Stock and Shutterstock. Uses AI to generate HTML animations, convert them to Remotion TSX components, render in the cloud via GitHub Actions, and export metadata CSVs.

**Pipeline**: `Keyword → Market Research → HTML Generation → SEO Metadata → TSX Conversion → Preview Render → 4K ProRes → CSV Export`

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start production server (port 5000) |
| `npm run dev` | Start Remotion Studio for local preview |
| `npm run build` | Bundle Remotion project |
| `npm run lint` | Run ESLint + TypeScript check |
| `node test-e2e-workflow.js` | Run end-to-end pipeline test |
| `curl http://localhost:5000/api/health` | Check system health |

## Key Architecture

### `server.js` (5,397 lines) — Main Express server

The entire backend is a single monolithic file. Key sections:

- **AI Pipeline** (lines ~316–620): Multi-provider AI with fallback chain: `callAIWithFallback()` → tries Syntx.ai Claude → Syntx.ai Gemini → 9Router. Wrapped by `callAIWithRetry()` with exponential backoff. Includes an in-memory AI response cache (MD5 keyed, 1-hour TTL, 100-entry LRU).

- **Market Research** (lines ~626–780): Scrapers for Adobe Stock (`scrapAdobeStock`) and Shutterstock (`scrapShutterstock`) using axios + cheerio, with fallback data on failure.

- **API Routes** (lines ~781–1460): Core pipeline endpoints:
  - `POST /api/research-market` — Scrape both platforms
  - `POST /api/generate` — Full pipeline: research → HTML → SEO
  - `POST /api/render` — Convert HTML → TSX + trigger preview render
  - `POST /api/render-preview` / `POST /api/render-4k` — Queue renders
  - `POST /api/trigger-github-render` — Push code + trigger GitHub Actions
  - `GET /api/check-render-status/:id/:renderType` — Poll cloud render progress
  - `GET /api/health` — System health with queue stats

- **Queue System** (lines ~1440–2000): In-memory task queue (`taskQueue[]`) with SSE-based real-time progress logging. Supports abort controllers (`abortControllers{}`), concurrent task limiting (`MAX_CONCURRENT_TASKS = 1`), parallel SEO generation (`MAX_CONCURRENT_SEO = 2`), and separate 4K render queue.

- **Chat AI System** (lines ~4555–5000): Multi-model chat with 42 AI models across 7 provider groups (Claude, GPT, Gemini, Grok, DeepSeek, Qwen, Perplexity). Routes through Syntx.ai backend. Sessions stored in `chat-history.json`. Image upload support via multer.

- **Trends & Analytics** (lines ~5036–5237): Google Trends RSS scraping, international events from daysoftheyear.com, AI-powered trend analysis.

- **CSV Export** (lines ~5240–5355): Adobe Stock & Shutterstock metadata CSV generation with RFC 4180 escaping.

### `syntx-bot.js` (1,044 lines) — Syntx.ai Integration

Automates syntx.ai account management:
- Creates temp emails via mail.tm API
- Registers accounts, requests & verifies OTPs
- Maintains an account pool with token rotation and message limits
- Routes AI requests through the pool (Claude, GPT, Gemini, Grok, DeepSeek, Qwen, Perplexity — 42 models total)

### `prompts.json` — AI Prompt Templates

Two prompts:
- `seoPrompt`: Generates stock-video SEO metadata (title, keywords, description, categories, loop/transparent flags, duration, fps). Uses `{{HTML_CONTENT}}` as placeholder.
- `conversionPrompt`: Converts HTML animations to Remotion TSX components. Extensive rules for frame-locked animation, Three.js/WebGL/Canvas 2D conversion, React inline styles, TypeScript strict typing, banned functions, and seamless looping. Uses `{{HTML_CONTENT}}`, `{{ANIMATION_DURATION}}`, `{{DURATION_FRAMES}}`, `{{FPS}}` as placeholders.

### `src/` — Remotion Components

- `src/index.ts` — Entry point, calls `registerRoot(RemotionRoot)`
- `src/Root.tsx` — Registers Composition with dynamic duration/fps from `getInputProps()`, includes `<Dashboard />` component
- `src/Composition.tsx` — The rendered composition (auto-overwritten during pipeline). Currently a 3D Cyberpunk/cybersecurity scene using Three.js (particles, grid floor, rotating rings, light streaks)
- `src/Dashboard.tsx` — React component for Remotion Studio's dashboard UI

### `public/` — Frontend

- `public/dashboard.html` (4,476 lines) — Main production dashboard with queue management, saved items table, Syntx.ai account controls, trends panel, render controls
- `public/chat.html` (2,129 lines) — AI chat interface with model selector, session management, image upload
- `public/chat-widget.js` / `public/chat-widget.css` — Floating chat widget embeddable on any page

### `.github/workflows/` — CI/CD

- `render.yml` — Triggered by `repository_dispatch`, renders preview (MP4, 0.3 scale) or production (4K ProRes MOV). Installs xvfb for headless WebGL, injects metadata via FFmpeg
- `render-4k.yml` — Manual `workflow_dispatch` with inputs for composition parameters
- `render-preview.yml` — Similar to render-4k but optimized for fast preview

### Data Storage

All databases are JSON files (gitignored):
- `saved-items.json` — Video items with all pipeline states, logs, metadata
- `chat-history.json` — Chat sessions and messages
- `syntx-accounts.json` — Syntx.ai account pool with tokens and message counts

### Key Patterns

- **AI Fallback Chain**: Syntx.ai Claude → Syntx.ai Gemini → 9Router (OpenAI-compatible local proxy)
- **Startup Recovery**: `performStartupCleanup()` resets stale queue states on restart
- **Database Write Throttling**: Debounced writes at 1s max frequency via `saveOrUpdateItem()`
- **Git Mutex**: `runGitTask()` ensures sequential git operations to prevent push conflicts
- **TSX Repair**: `repairGeneratedTsx()` fixes common AI-generated Remotion mistakes (Easing name corrections, camelCase style keys, banned function removal)

### Environment Variables (`.env`)

```
GITHUB_TOKEN=          # GitHub personal access token
GITHUB_USERNAME=       # GitHub username
GITHUB_REPO=           # Repository name
NINEROUTER_API_KEY=    # 9Router API key (OpenAI-compatible)
NINEROUTER_BASE_URL=   # 9Router endpoint (default: http://localhost:20128/v1)
NINEROUTER_MODEL=      # 9Router model name
SYNTX_BASE_EMAIL=      # Base email for Syntx.ai account generation
SYNTX_EMAIL_INDEX=     # Max Syntx accounts in pool
```
