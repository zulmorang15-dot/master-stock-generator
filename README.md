# Master Stock Generator

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

**Automated stock video generator** powered by AI and Remotion. Generate premium 4K ProRes motion graphics for Adobe Stock and Shutterstock from keywords.

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)](.)
[![Performance](https://img.shields.io/badge/performance-optimized-blue)](PERFORMANCE_OPTIMIZATION.md)
[![Documentation](https://img.shields.io/badge/docs-complete-success)](IMPLEMENTATION_SUMMARY.md)

---

## ✨ Features

- 🔍 **Market Research** - Scrape Adobe Stock & Shutterstock for competitive analysis
- 🤖 **AI Generation** - Generate HTML5 animations from descriptions (9Router + Syntx.ai)
- 📝 **SEO Optimization** - Auto-generate compliant titles & keywords for microstock
- 🎬 **TSX Conversion** - Convert HTML to Remotion components with frame-locked animations
- ☁️ **Cloud Rendering** - GitHub Actions for preview & 4K ProRes rendering
- 📊 **Queue System** - Background processing with real-time progress tracking
- 💾 **Smart Caching** - AI response cache with 30-40% hit rate
- 🛡️ **Production-Grade** - Retry logic, error recovery, health monitoring

## 🚀 Quick Start

**Install Dependencies**

```console
npm i
```

**Configure Environment**

Create `.env` file:
```bash
GITHUB_TOKEN=your_token
GITHUB_USERNAME=your_username
GITHUB_REPO=your_repo
NINEROUTER_API_KEY=your_9router_key
NINEROUTER_BASE_URL=http://localhost:20128/v1
SYNTX_BASE_EMAIL=your_email@gmail.com
```

**Start Server**

```console
npm start
```

Server runs on `http://localhost:5000`

**Open Dashboard**

Navigate to `http://localhost:5000/dashboard` in your browser.

## 📖 Documentation

- **[PROGRESS_FINAL.md](PROGRESS_FINAL.md)** - Complete project status & progress summary
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Implementation details & architecture
- **[PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md)** - Performance strategies & metrics
- **[scratch/README.md](scratch/README.md)** - Development tools & test scripts

## 🎯 Workflow Pipeline

```
Keyword → Market Research → HTML Generation → SEO Metadata → 
TSX Conversion → Preview Render → 4K ProRes → CSV Export → Upload
```

### API Endpoints

- `POST /api/research-market` - Market research from Adobe/Shutterstock
- `POST /api/generate-html-preview` - Generate HTML animation
- `POST /api/start-task/:id` - Queue TSX conversion & rendering
- `GET /api/health` - System health & performance metrics
- `GET /api/export-csv?platform=adobe|shutterstock` - Export metadata CSV

## 📊 Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| AI Cache Hit Rate | 30-40% | ✅ Optimized |
| Database I/O | 1 write/sec | ✅ Throttled |
| SEO Batch Speed | 2x concurrent | ✅ Parallelized |
| Network Resilience | 2 retries + backoff | ✅ Production-grade |
| System Monitoring | `/api/health` | ✅ Real-time |

## 🔧 Development

**Run Preview (Remotion Studio)**

```console
npm run dev
```

**Run E2E Tests**

```console
node test-e2e-workflow.js
```

**Check Health**

```console
curl http://localhost:5000/api/health
```

**Monitor Cache Performance**

```console
tail -f server.log | grep "Cache HIT"
```

## 🏗️ Tech Stack

- **Backend**: Node.js, Express
- **Rendering**: Remotion 4.0
- **AI Providers**: 9Router, Syntx.ai (Claude, Gemini, GPT)
- **CI/CD**: GitHub Actions
- **Video Export**: FFmpeg, ProRes 4K
- **Frontend**: Vanilla HTML/CSS/JS (Dashboard)

## 📝 Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start Remotion Studio |
| `npm run build` | Bundle Remotion project |
| `npm run upgrade` | Upgrade Remotion |
| `npm run lint` | Run ESLint & TypeScript check |

## 🎬 Rendering

### Local Preview (Low-res)
```bash
npx remotion render Composition output.mp4 --scale=0.5
```

### 4K ProRes (Production)
```bash
npx remotion render Composition output.mov --codec=prores
```

### Cloud (GitHub Actions)
Automatically triggered when code is pushed. Renders on Ubuntu runners with xvfb for headless WebGL support.

## 📦 Project Structure

```
master-stock-generator/
├── server.js              # Main Express server (4,886 lines)
├── syntx-bot.js           # Syntx.ai integration
├── prompts.json           # AI prompt templates
├── saved-items.json       # Video database
├── public/
│   ├── dashboard.html     # Main UI
│   ├── chat.html          # AI chat interface
│   ├── saved-code/        # Generated HTML/TSX files
│   └── previews/          # Rendered preview videos
├── src/
│   ├── Composition.tsx    # Dynamic composition (auto-updated)
│   ├── Root.tsx           # Remotion root
│   └── Dashboard.tsx      # Remotion dashboard
├── out/                   # 4K rendered videos
└── .github/workflows/     # CI/CD pipelines
```

## 🔒 Security Notes

- API keys stored in `.env` (gitignored)
- Santization applied to keywords & titles (brand names removed)
- Input validation on all API endpoints
- AbortController for task cancellation
- File cleanup after processing

## 🤝 Contributing

This is a private project. For questions or suggestions, contact the maintainer.

## 📄 License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

---

**Project Status**: ✅ Production Ready | Last Updated: 2026-06-14 | [View Progress](PROGRESS_FINAL.md)
