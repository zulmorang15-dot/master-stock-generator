# 📋 Progress Proyek: Master Stock Generator

> Terakhir diperbarui: 2026-06-08

---

## 🎯 Tujuan Proyek

Sebuah dashboard fullstack untuk mengotomatisasi proses produksi video stock footage, mulai dari:
1. **Riset keyword** (scraping Adobe Stock real-time)
2. **Generate ide video** menggunakan AI (Gemini / OpenRouter)
3. **Upload HTML animasi** milik sendiri
4. **Konversi HTML → TSX** via AI (Gemini / OpenRouter)
5. **Render preview MP4** via GitHub Actions (cloud rendering)
6. **Download hasil** ke lokal & tampilkan di dashboard
7. **Render 4K ProRes MOV** via GitHub Actions dengan metadata (judul + keyword) tertanam di dalam video
8. **Simpan & kelola** semua komposisi di database lokal (`saved-items.json`)

---

## ✅ Status Fitur (Sudah Selesai)

| Fitur | Status |
|---|---|
| Scraping Adobe Stock real-time | ✅ Selesai |
| Generate ide via OpenRouter | ✅ Selesai |
| Generate ide via Gemini langsung | ✅ Selesai |
| Generate HTML preview via AI | ✅ Selesai |
| Upload HTML file dari lokal | ✅ Selesai |
| Konversi HTML → TSX via Gemini | ✅ Selesai |
| Konversi HTML → TSX via OpenRouter | ✅ Selesai |
| Trigger render preview (MP4) via GitHub Actions | ✅ Selesai |
| Polling status render dari GitHub API | ✅ Selesai |
| Download artifact ZIP dari GitHub & ekstrak | ✅ Selesai |
| Tampilkan link download preview di dashboard | ✅ Selesai |
| Render 4K ProRes MOV via GitHub Actions | ✅ Selesai |
| Metadata judul + keyword tertanam di video (getInputProps) | ✅ Selesai |
| Simpan item ke `saved-items.json` | ✅ Selesai |
| Hapus item dari database | ✅ Selesai |
| Sidebar Keyword Tab UI (tab interface + search box) | ✅ Selesai |
| Keyword badges klik-per-tag (copy satu keyword saja) | ✅ Selesai |
| Filter pencarian di sidebar keyword | ✅ Selesai |
| Tombol quick toggle "Menu Keyword" (buka langsung ke tab keyword) | ✅ Selesai |
| Exclude `src/Composition.tsx` dari TypeScript checks | ✅ Selesai |
| Validasi nama artifact render.yml ↔ server.js | ✅ Selesai |

---

## 🐛 Bug / Error yang Sudah Diperbaiki

| Error | Solusi |
|---|---|
| `JSON parse error at position 1374` | Prompt diperketat: DILARANG gunakan `"` dalam string JSON, gunakan `'` |
| `undefined was passed to component prop` di Remotion | Prompt AI diwajibkan selalu menulis `export default ComponentName;` sebagai default export |
| TSX compilation error karena `three` (Three.js) | `src/Composition.tsx` dikecualikan dari `tsconfig.json` via array `"exclude"` |
| Arrow `->` di JSX menyebabkan parse error | Di-escape sebagai string literal `{"⏳ Convert HTML -> TSX..."}` |
| Stale state di dalam polling `setInterval` | Menggunakan closure-safe updater `setSavedItems(prevList => ...)` |

---

## 🗂️ Struktur Kode

```
master-stock-generator/
│
├── server.js                  ← Backend Express (port 5000)
├── public/
│   ├── dashboard.html         ← Dashboard versi HTML+Babel (diakses via browser di localhost:5000)
│   └── previews/              ← Folder output preview MP4
├── src/
│   ├── Dashboard.tsx          ← Dashboard versi React/TSX (dipakai Remotion Studio)
│   ├── Root.tsx               ← Root Remotion - mendaftarkan komposisi
│   ├── index.ts               ← Entry point registerRoot
│   └── Composition.tsx        ← File TSX hasil konversi dari HTML (di-generate AI, BUKAN diedit manual)
├── .github/
│   └── workflows/
│       └── render.yml         ← GitHub Actions untuk cloud render (preview MP4 + 4K ProRes)
├── saved-items.json           ← Database lokal (daftar komposisi tersimpan + metadata)
├── props.json                 ← Props default Remotion
├── tsconfig.json              ← Dikonfigurasi agar src/Composition.tsx TIDAK dicek TypeScript
└── .env                       ← API keys (GEMINI_API_KEY, OPENROUTER_API_KEY, GITHUB_TOKEN, dll)
```

### Alur Kerja Utama (Flowchart Singkat)

```
[User input keyword]
        ↓
[GET /api/generate] → OpenRouter AI → 5 ide video (JSON)
        ↓
[User upload HTML file]
        ↓
[POST /api/convert-html-to-tsx] → AI (Gemini/OpenRouter) → simpan ke src/Composition.tsx
        ↓
[POST /api/trigger-github-render?type=preview]
  → git add, commit, push → GitHub
  → repository_dispatch ke GitHub Actions
        ↓
[GET /api/check-render-status/:id/preview] (polling tiap 5 detik)
  → Cek GitHub Actions API
  → Jika selesai: download ZIP artifact → ekstrak → simpan ke public/previews/
  → Return URL ke dashboard
        ↓
[Tampil link Download Preview + Tombol Render 4K]
        ↓
[POST /api/trigger-github-render?type=4k]
  → Sama seperti preview, tapi GitHub Actions render 4K ProRes MOV
  → Hasil disimpan ke folder out/
```

---

## ⚙️ Konfigurasi Wajib (.env)

```env
GEMINI_API_KEY=...          # Untuk generate AI via Gemini langsung
OPENROUTER_API_KEY=...      # Untuk generate AI via OpenRouter (GPT, Llama, DeepSeek, dll)
GITHUB_TOKEN=...            # Personal Access Token GitHub (scope: repo, workflow)
GITHUB_USERNAME=...         # Username GitHub pemilik repo
GITHUB_REPO=...             # Nama repository GitHub (contoh: master-stock-generator)
```

---

## 📌 API Endpoints (server.js)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/dashboard` | Tampilkan `public/dashboard.html` |
| POST | `/api/generate` | Generate 5 ide video via OpenRouter |
| POST | `/api/generate-gemini` | Generate 5 ide via Gemini langsung |
| POST | `/api/generate-html-preview` | Generate animasi HTML dari deskripsi (Gemini/OpenRouter) |
| POST | `/api/generate-html-preview-gemini` | Generate animasi HTML via Gemini |
| POST | `/api/convert-html-to-tsx` | Konversi HTML → TSX via OpenRouter |
| POST | `/api/convert-html-to-tsx-gemini` | Konversi HTML → TSX via Gemini |
| POST | `/api/trigger-github-render` | Push ke GitHub & trigger render via Actions |
| GET | `/api/check-render-status/:id/:type` | Poll status render & download artifact |
| GET | `/api/saved-items` | Ambil semua item tersimpan |
| POST | `/api/save-item` | Simpan atau update item |
| DELETE | `/api/delete-item/:id` | Hapus item dari database |
| POST | `/api/render-preview` | (Legacy) Render preview lokal |
| POST | `/api/render-4k` | (Legacy) Render 4K lokal |
| POST | `/api/render` | (Legacy) Render via GitHub tanpa polling |

---

## 🚧 Yang Harus Dilakukan Selanjutnya

### Prioritas Tinggi

- [x] **Validasi end-to-end GitHub Actions workflow** — Nama artifact di `render.yml` sudah cocok dengan format `{id}-{renderType}-video` yang dicari di `server.js` ✅
- [x] **Sidebar Tab UI (Menu Keyword)** — Tab interface dua-panel, search box filter, dan keyword badges per tag sudah diimplementasikan di `src/Dashboard.tsx` dan `public/dashboard.html` ✅
- [x] **Tombol Quick Toggle "Menu Keyword"** — Tombol hijau di pojok kanan atas yang langsung buka sidebar di tab keyword ✅

### Prioritas Menengah

- [ ] **Notifikasi visual saat copy keyword** — Badge ✓ sudah muncul 2 detik saat klik tag (sudah termasuk di implementasi badge), *DONE via copiedBadge state* ✅
- [ ] **Tombol "Refresh" manual** di bagian Saved Keywords sidebar untuk me-reload data dari server tanpa reload halaman penuh
- [ ] **Export keywords ke CSV** — Tombol untuk mengunduh seluruh keyword dari `saved-items.json` ke file CSV, siap upload ke Adobe Stock

### Prioritas Rendah / Nice to Have

- [ ] **Auto-detect render progress di Saved Section** — Saat membuka halaman, jika `statusConvertTsx` masih `processing-preview`, otomatis mulai polling lagi
- [ ] **Preview thumbnail** dari frame pertama video di dalam tabel saved items
- [ ] **Batch render** — Pilih beberapa item sekaligus untuk dirender dalam satu klik
- [ ] **Dark/Light mode toggle**

---

## 🖥️ Cara Menjalankan

```bash
# Terminal 1: Jalankan backend server
node server.js
# → Server aktif di http://localhost:5000
# → Buka dashboard di http://localhost:5000/dashboard

# Terminal 2: Jalankan Remotion Studio (opsional, untuk development TSX)
npm run dev
# → Studio aktif di http://localhost:3000
```

---

## ⚠️ Catatan Penting

1. **`src/Composition.tsx` adalah file GENERATED** — Jangan diedit manual. File ini selalu ditimpa setiap kali user menekan tombol Generate.
2. **Jangan rename component** di dalam `Composition.tsx` — Remotion di `Root.tsx` mengimpor sebagai `default import`, jadi harus selalu ada `export default NamaComponent;`
3. **GitHub Actions perlu GITHUB_TOKEN** di repository Secrets dengan nama `GH_PAT` atau sesuai konfigurasi di `render.yml`
4. **Windows path** — Ekstraksi ZIP menggunakan PowerShell `Expand-Archive`. Pastikan PowerShell tersedia di sistem.
