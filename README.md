# Master Stock Generator

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

**Automated stock video generator** powered by AI and Remotion. Generate premium 4K ProRes motion graphics for Adobe Stock and Shutterstock from keywords or custom HTML animations.

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen)](.)
[![Documentation](https://img.shields.io/badge/docs-complete-success)](CLAUDE.md)

---

## ✨ Key Features

- ⚡ **Instant Live Preview** - Real-time HTML5 60fps canvas preview in Dashboard (0s wait time)
- 🎬 **Remotion Studio Live Modal** - Embedded Remotion Studio (`http://localhost:3000`) modal player in Dashboard for interactive TSX scrubbing and frame control
- 🎥 **ProRes 4K Profile Selection** - Choose between **Apple ProRes 422 HQ (No. 3)** for solid backgrounds and **Apple ProRes 4444 (No. 2)** for Alpha channel transparency
- ☁️ **Litterbox Temporary Cloud Upload** - Automatic public download links for 4K MOV renders up to 1GB
- 📦 **Direct Proxy Downloads** - Download MOV or ZIP artifacts directly from Dashboard without logging into GitHub
- 🔍 **Market Research** - Scrape Adobe Stock & Shutterstock for competitive analysis
- 🤖 **AI Generation** - Generate HTML5 animations and convert to TSX via AI (Syntx.ai Claude/Gemini & 9Router)
- 💬 **AI Chat System** - Multi-model chat interface with 42 AI models
- 📝 **SEO Optimization** - Auto-generate compliant titles & keywords for microstock platforms

---

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create `.env` file:
```bash
GITHUB_TOKEN=your_token
GITHUB_USERNAME=your_username
GITHUB_REPO=your_repo
NINEROUTER_API_KEY=your_9router_key
NINEROUTER_BASE_URL=http://localhost:20128/v1
SYNTX_BASE_EMAIL=your_email@gmail.com
SYNTX_EMAIL_INDEX=9
```

### Start Server

```bash
npm start
```

* Server runs on `http://localhost:5000`
* Dashboard: `http://localhost:5000/dashboard`
* AI Chat Interface: `http://localhost:5000/chat`

---

## 🎯 Pipeline Workflow

```
Keyword → Market Research → HTML Generation → SEO Metadata →
TSX Conversion → Studio Live Preview → 4K ProRes (422 HQ / 4444) → CSV Export
```

### Key API Endpoints

- `POST /api/paste-html` - Enqueue custom HTML animation
- `POST /api/preview-studio` - Inject TSX & sync `src/studio-props.json` for Studio Live preview
- `POST /api/trigger-4k/:id` - Trigger 4K ProRes rendering (`proresProfile`: `422hq` / `4444`)
- `GET /api/4k-file/:id` - Proxy download MOV video file
- `GET /api/download-4k-zip/:id` - Proxy download ZIP artifact file
- `GET /api/health` - System health & queue monitoring

---

## 📦 Project Structure

```
master-stock-generator/
├── server.js              # Main Express server (5,594 lines)
├── syntx-bot.js           # Syntx.ai integration (1,044 lines)
├── prompts.json           # AI prompt templates
├── saved-items.json       # Video database
├── public/
│   ├── dashboard.html     # Main UI with Studio Live & ProRes selector
│   ├── chat.html          # AI chat interface
│   └── saved-code/        # Generated HTML/TSX files
├── src/
│   ├── Composition.tsx    # Active Remotion composition
│   ├── Root.tsx           # Remotion root entry
│   └── studio-props.json  # Auto-synced Studio properties
└── .github/workflows/     # CI/CD pipelines (Litterbox cloud upload)
```

---

## 📄 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Architecture guide & API documentation
- **[SETUP_RDP_SERVER.md](SETUP_RDP_SERVER.md)** - Server deployment & RDP setup guide

---

**Project Status**: ✅ Production Ready
