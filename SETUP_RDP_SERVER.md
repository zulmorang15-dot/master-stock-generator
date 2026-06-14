# 🖥️ Panduan Setup Master Stock Generator di Server RDP

Panduan ini menjelaskan langkah-demi-langkah cara memasang dan menjalankan aplikasi **Master Stock Generator** di server RDP (Windows Server maupun Linux) agar dapat berjalan terus-menerus di latar belakang (*always-on*).

---

## 📋 Prasyarat Sistem

Pastikan server RDP Anda sudah terpasang perangkat lunak berikut:

### 1. Node.js (v18 atau v20 LTS)
- **Windows**: Unduh installer `.msi` dari [nodejs.org](https://nodejs.org/) dan pasang seperti biasa.
- **Linux (Ubuntu/Debian)**:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### 2. Git
- **Windows**: Unduh dari [git-scm.com](https://git-scm.com/). Saat instalasi, pastikan opsi *"Add to PATH"* dicentang.
- **Linux**:
  ```bash
  sudo apt-get update
  sudo apt-get install -y git
  ```

### 3. FFmpeg (Penting untuk Render Video Remotion)
Remotion memerlukan FFmpeg yang terdaftar di System PATH untuk menggabungkan frame video dan audio.
- **Windows**:
  1. Buka PowerShell sebagai Administrator, lalu jalankan perintah berikut untuk menginstal via Windows Package Manager:
     ```powershell
     winget install --id Gnu.FFmpeg
     ```
  2. Restart server RDP Anda setelah selesai agar PATH diperbarui.
- **Linux**:
  ```bash
  sudo apt-get install -y ffmpeg
  ```

---

## 🔑 Langkah 1: Autentikasi Git Non-Interaktif (Sangat Penting!)

Aplikasi ini melakukan operasi `git pull`, `git commit`, dan `git push origin main` secara otomatis di latar belakang. Jika Git meminta input *username* atau *password* secara interaktif di terminal, proses server akan **terkunci (hang)**.

Anda harus mengonfigurasi autentikasi otomatis menggunakan **Personal Access Token (PAT)** atau **SSH Key**:

### Cara Tercepat (Menggunakan Personal Access Token):
1. Buat token di akun GitHub Anda: **Settings -> Developer Settings -> Personal Access Tokens (Classic)**. Berikan izin centang pada cakupan `repo`.
2. Saat pertama kali melakukan clone di RDP, gunakan URL repositori yang menyertakan token Anda:
   ```bash
   git clone https://x-access-token:YOUR_GITHUB_TOKEN@github.com/USERNAME/REPO_NAME.git
   ```
   *Contoh untuk repositori Anda:*
   ```bash
   git clone https://x-access-token:ghp_YOUR_TOKEN_HERE@github.com/zulmorang15-dot/master-stock-generator.git
   ```
3. Konfigurasikan identitas Git di server:
   ```bash
   git config --global user.email "email-anda@example.com"
   git config --global user.name "Nama Anda"
   ```

---

## ⚙️ Langkah 2: Konfigurasi Project & Environment

1. Masuk ke direktori project yang sudah di-clone:
   ```bash
   cd master-stock-generator
   ```
2. Instal semua dependensi Node.js:
   ```bash
   npm install
   ```
3. Buat file bernama `.env` di folder root project, lalu isi dengan konfigurasi Anda:
   ```env
   GITHUB_TOKEN=ghp_YOUR_GITHUB_TOKEN_HERE
   GITHUB_USERNAME=zulmorang15-dot
   GITHUB_REPO=master-stock-generator
   SYNTX_BASE_EMAIL=l.imh.en.c.e@gmail.com
   SYNTX_EMAIL_INDEX=9
   NINEROUTER_API_KEY=sk-58855e86be5b47cc-vpjqco-9f60aa28
   NINEROUTER_BASE_URL=http://localhost:20128/v1
   NINEROUTER_MODEL=gratisan
   ```

---

## 🚀 Langkah 3: Menjalankan Server di Latar Belakang (PM2)

Untuk memastikan server terus berjalan dan otomatis menyala kembali jika terjadi error atau server RDP dimulai ulang, gunakan **PM2** (Process Manager).

1. Instal PM2 secara global:
   ```bash
   npm install pm2 -g
   ```
2. Jalankan server menggunakan PM2:
   ```bash
   pm2 start server.js --name "stock-generator"
   ```
3. **Konfigurasi Autostart (Opsional tapi Direkomendasikan)**:
   Agar aplikasi otomatis berjalan saat Windows Server / RDP dinyalakan ulang:
   - **Windows**: Gunakan modul `pm2-windows-service` atau buat startup task di *Task Scheduler* untuk menjalankan perintah `pm2 resurrect`.
   - **Linux**:
     ```bash
     pm2 startup
     pm2 save
     ```

### 📊 Perintah Berguna PM2:
- **Melihat status server**: `pm2 status`
- **Melihat log real-time**: `pm2 logs stock-generator`
- **Merestart server**: `pm2 restart stock-generator`
- **Menghentikan server**: `pm2 stop stock-generator`

---

## 🛡️ Langkah 4: Buka Firewall (Agar Bisa Diakses Dari Luar RDP)

Secara default, aplikasi berjalan di port `5000`. Jika Anda ingin membuka dashboard lewat browser PC/HP pribadi tanpa masuk RDP:

### Windows Firewall (Windows Server):
1. Buka **Windows Defender Firewall with Advanced Security**.
2. Klik **Inbound Rules** -> **New Rule...**
3. Pilih **Port**, lalu klik Next.
4. Pilih **TCP** dan masukkan Specific local ports: `5000`. Klik Next.
5. Pilih **Allow the connection**. Klik Next.
6. Centang Domain, Private, dan Public. Klik Next.
7. Beri nama (misal: `Stock Generator Dashboard`) dan klik Finish.

### Jika Menggunakan Cloud (AWS / Azure / GCP / Alibaba Cloud):
Pastikan Anda juga menambahkan aturan inbound (Inbound Port Rule) pada *Security Group* atau *Firewall Control Panel* layanan cloud Anda untuk mengizinkan trafik masuk ke port `5000`.

Akses dashboard Anda di browser melalui: `http://IP_RDP_ANDA:5000/dashboard`
