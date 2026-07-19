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

- ⚡ **Live HTML Thumbnail Preview** — Setiap karya ditampilkan sebagai thumbnail live iframe 84×47px dari HTML source asli (tanpa CSS override), posisi animasi terjaga persis
- 📄 **HTML Preview Popup** — Klik thumbnail untuk membuka popup fullscreen yang menjalankan HTML animasi secara langsung
- 🎬 **Remotion Studio Live Modal** — Embedded Remotion Studio (`http://localhost:3000`) modal player untuk interactive TSX scrubbing
- 🎥 **ProRes 4K Profile Selection** — Pilih **Apple ProRes 422 HQ (No. 3)** atau **Apple ProRes 4444 (No. 2)** untuk Alpha channel transparency
- 📊 **Status-Colored Project Cards** — Background karya berubah warna sesuai status (hijau=selesai, biru=siap, ungu=proses, kuning=antrean, merah=gagal) — dark & light mode
- 🗂️ **Dual View Mode** — Toggle antara **📋 Detail** (lengkap) dan **⚡ Ramping** (compact, thumbnail + judul saja)
- 📈 **Slim Progress Tracker** — Rail horizontal ikon `📄→⚙️→🎬→✨→🚀` dengan dot berwarna dan connector line, terlihat di kedua mode
- 🎛️ **Icon-Only Quick Actions** — Tombol aksi cepat per karya: ⚙️ Regen TSX · ✨ Regen SEO · 🎬 Studio · 🚀 Render 4K · 🎥 MOV · 📦 ZIP (ikon saja, hemat ruang)
- 📱 **Mobile Responsive** — Header, card, dan floating batch bar dioptimalkan untuk layar kecil
- 🔑 **API Keys Modal** — Pengaturan API key via popup modal, bukan panel inline
- ☁️ **Litterbox Cloud Upload** — Link download publik otomatis untuk render 4K MOV hingga 1GB
- 🤖 **AI Fallback Chain** — Syntx Claude → Syntx Gemini → 9Router untuk generate HTML, TSX, & SEO metadata
- 📝 **SEO Auto-Generate** — Generate judul & keywords sesuai standar microstock (Adobe Stock, Shutterstock)

---

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Configure Environment

Buat file `.env`:
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

- Server: `http://localhost:5000`
- Dashboard: `http://localhost:5000/dashboard`
- AI Chat: `http://localhost:5000/chat`

---

## 🎯 Pipeline Workflow

```
Keyword → Market Research → HTML Generation → SEO Metadata →
TSX Conversion → Studio Live Preview → 4K ProRes (422 HQ / 4444) → CSV Export
```

### Tahapan Produksi (Progress Tracker)

| # | Tahap | Ikon | Keterangan |
|---|-------|------|------------|
| 1 | HTML  | 📄 | Source HTML animation tersedia |
| 2 | TSX   | ⚙️ | Konversi ke Remotion TSX component |
| 3 | Preview | 🎬 | Render preview video via Remotion |
| 4 | Metadata | ✨ | Generate judul & keywords SEO via AI |
| 5 | 4K    | 🚀 | Render final 4K ProRes MOV |

---

## 🖥️ Dashboard UI

### Mode Tampilan
| Mode | Deskripsi |
|------|-----------|
| 📋 **Detail** | Semua info: thumbnail, judul file, judul SEO, status, tombol aksi, dropdown kategori |
| ⚡ **Ramping** | Hanya thumbnail + judul SEO + status + tombol ikon. Lebih rapat, cocok untuk banyak proyek |

### Warna Status Card
| Status | Warna Dark | Warna Light |
|--------|-----------|------------|
| ✅ Selesai | Emerald gradient | Hijau muda |
| 🔵 Siap | Biru cyan | Biru muda |
| ⚙️ Proses | Ungu neon | Lavender |
| ⏳ Antrean | Amber | Kuning muda |
| ❌ Gagal | Merah | Rose |

### Tombol Aksi Cepat (Ikon Only)
| Ikon | Aksi | Muncul Saat |
|------|------|------------|
| ⚙️ | Generate / Regen TSX | Ada HTML source |
| ✨ | Generate / Regen AI Metadata SEO | Ada HTML source |
| 🎬 | Buka Remotion Live Studio | TSX tersedia |
| 🚀 | Render 4K ProRes | TSX tersedia |
| 🎥 | Download MOV 4K | 4K render selesai |
| 📦 | Download ZIP ProRes | 4K render selesai |

---

## 📡 Key API Endpoints

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `POST` | `/api/paste-html` | Enqueue custom HTML animation |
| `POST` | `/api/preview-studio` | Inject TSX & sync studio-props.json |
| `POST` | `/api/trigger-4k/:id` | Trigger 4K ProRes render |
| `GET`  | `/api/4k-file/:id` | Proxy download MOV |
| `GET`  | `/api/download-4k-zip/:id` | Proxy download ZIP |
| `GET`  | `/api/health` | System health & queue status |
| `POST` | `/api/regenerate-seo/:id` | Regenerate SEO metadata single item |
| `POST` | `/api/regenerate-seo-batch` | Batch regenerate SEO metadata |

---

## 📦 Project Structure

```
master-stock-generator/
├── server.js              # Main Express server
├── syntx-bot.js           # Syntx.ai integration
├── prompts.json           # AI prompt templates
├── saved-items.json       # Video database (JSON)
├── public/
│   ├── dashboard.html     # Main dashboard UI
│   ├── chat.html          # AI chat interface
│   └── saved-code/        # Generated HTML/TSX files
├── src/
│   ├── Composition.tsx    # Active Remotion composition
│   ├── Root.tsx           # Remotion root entry
│   └── studio-props.json  # Auto-synced Studio properties
└── .github/workflows/     # CI/CD pipelines
```

---

## 📄 Documentation

- **[CLAUDE.md](CLAUDE.md)** — Architecture guide & API documentation
- **[SETUP_RDP_SERVER.md](SETUP_RDP_SERVER.md)** — Server deployment & RDP setup guide

---

**Project Status**: ✅ Production Ready | Last updated: July 2026
