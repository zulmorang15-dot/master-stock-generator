# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Automated stock video generator that produces 4K ProRes motion graphics for Adobe Stock and Shutterstock. Uses AI to generate HTML animations, convert them to Remotion TSX components, render in the cloud via GitHub Actions, and export metadata CSVs.

**Pipeline**: `Keyword → Market Research → HTML Generation → SEO Metadata → TSX Conversion → Remotion Studio Preview / Cloud Render → 4K ProRes (422 HQ / 4444) → CSV Export`

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start production server (port 5000) |
| `npm run dev` | Start Remotion Studio for local preview (port 3000) |
| `npm run build` | Bundle Remotion project |
| `npm run lint` | Run ESLint + TypeScript check (`tsc`) |
| `node scratch/stress_test_5.js` | Run 5-item batch queue stress test |
| `curl http://localhost:5000/api/health` | Check system health |

## Key Architecture

### `server.js` (5,594 lines) — Main Express server

Key sections:

- **AI Pipeline**: Multi-provider AI with fallback chain: `callAIWithFallback()` → tries Syntx.ai Claude → Syntx.ai Gemini → 9Router. Wrapped by `callAIWithRetry()` with exponential backoff. Includes an in-memory AI response cache (MD5 keyed, 1-hour TTL, 100-entry LRU).

- **Market Research**: Scrapers for Adobe Stock (`scrapAdobeStock`) and Shutterstock (`scrapShutterstock`) using axios + cheerio, with fallback data on failure.

- **API Routes**: Core pipeline & studio endpoints:
  - `POST /api/research-market` — Scrape both platforms
  - `POST /api/generate` — Full pipeline: research → HTML → SEO
  - `POST /api/preview-studio` — Inject TSX & sync `src/studio-props.json` for instant Remotion Studio Live preview
  - `POST /api/render-preview` / `POST /api/render-4k` — Queue renders
  - `POST /api/trigger-4k/:id` — Trigger 4K ProRes rendering with variant selection (`proresProfile`: `422hq` / `4444`)
  - `POST /api/trigger-github-render` — Push code + trigger GitHub Actions
  - `GET /api/4k-file/:id` — Proxy download rendered MOV file directly from GitHub artifact
  - `GET /api/download-4k-zip/:id` — Proxy download 4K artifact ZIP directly from GitHub
  - `GET /api/health` — System health with queue stats

- **Queue System**: In-memory task queue (`taskQueue[]`) with SSE-based real-time progress logging. Supports abort controllers (`abortControllers{}`), concurrent task limiting (`MAX_CONCURRENT_TASKS = 1`), parallel SEO generation (`MAX_CONCURRENT_SEO = 2`), and separate 4K render queue.

- **Chat AI System**: Multi-model chat with 42 AI models across 7 provider groups (Claude, GPT, Gemini, Grok, DeepSeek, Qwen, Perplexity). Routes through Syntx.ai backend. Sessions stored in `chat-history.json`.

### `syntx-bot.js` (1,044 lines) — Syntx.ai Integration

Automates syntx.ai account management:
- Creates temp emails via OpenInbox / mail.tm API
- Registers accounts, requests & verifies OTPs
- Maintains an account pool with token rotation and message limits

### `src/` — Remotion Components

- `src/index.ts` — Entry point, calls `registerRoot(RemotionRoot)`
- `src/Root.tsx` — Registers Composition with dynamic duration/fps from `studio-props.json` and `getInputProps()`
- `src/studio-props.json` — Auto-updated properties file (`durationInFrames`, `fps`, `addTransparentScene`)
- `src/Composition.tsx` — The rendered composition (auto-overwritten during pipeline)

### `public/` — Frontend

- `public/dashboard.html` (4,865 lines) — Main production dashboard with Remotion Studio Live modal preview, ProRes 4K 422 HQ vs 4444 selector, saved items table, queue management, and trend analysis
- `public/chat.html` (2,129 lines) — AI chat interface with model selector and image upload support

### `.github/workflows/` — CI/CD Cloud Render

- `render-4k.yml` — Manual `workflow_dispatch` for 4K ProRes MOV rendering (`prores_profile`: `422hq` or `4444`). Uploads to Litterbox Cloud temporary storage (`litterbox.catbox.moe`) for public download links
- `render-preview.yml` — Fast preview render workflow with Litterbox Cloud upload integration

### Git Ownership & PM2 Deployment

- **Git Safe Directory**: Ensure global safe directory is configured to prevent `dubious ownership` errors:
  ```bash
  git config --global --add safe.directory "*"
  ```

### Environment Variables (`.env`)

```
GITHUB_TOKEN=          # GitHub personal access token
GITHUB_USERNAME=       # GitHub username
GITHUB_REPO=           # Repository name
NINEROUTER_API_KEY=    # 9Router API key
NINEROUTER_BASE_URL=   # 9Router endpoint (default: http://localhost:20128/v1)
NINEROUTER_MODEL=      # 9Router model name
SYNTX_BASE_EMAIL=      # Base email for Syntx.ai account generation
SYNTX_EMAIL_INDEX=     # Max Syntx accounts in pool
```
