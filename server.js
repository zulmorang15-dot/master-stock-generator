require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { execSync } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPO = process.env.GITHUB_REPO;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 1. Fungsi Scraping Adobe Stock (Live Data)
async function scrapAdobeStock(keyword) {
  try {
    const searchUrl = `https://stock.adobe.com/id/search/video?k=${encodeURIComponent(keyword)}`;
    console.log(`🔍 Mengorek data Adobe Stock untuk: ${keyword}`);
    
    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    const $ = cheerio.load(data);
    let referensi = [];

    $(".search-result-cell, .thumb-frame").each((index, element) => {
      if (index >= 4) return false;
      const judul = $(element).find("img").attr("alt") || $(element).find(".js-search-result-title").text().trim();
      if (judul) referensi.push(`- Referensi ${index + 1}: ${judul}`);
    });

    return referensi.length > 0 ? referensi.join("\n") : `- Referensi 1: ${keyword} abstract motion background loop`;
  } catch (error) {
    return `- Referensi 1: ${keyword} tech abstract neon background loop`;
  }
}

// JALUR 1: CARI IDE, ATM SEO, & GENERATE KODE TSX UTUH
app.post("/api/generate", async (req, res) => {
  const { keyword } = req.body;
  const dataScrap = await scrapAdobeStock(keyword);

const prompt = `
    Kamu adalah pakar Creative Director Microstock USA dan Senior Animation Developer React/Remotion.
    Berdasarkan data referensi video teratas di Adobe Stock ini:
    ${dataScrap}

    Lakukan strategi ATM untuk pasar USA. Buat 5 variasi ide video yang LUAR BIASA KREATIF, visualnya mewah, kompleks, futuristik, dan bernilai jual tinggi (High-Utility Assets).
    
    Keluarkan hasil dalam format JSON murni berbentuk Array of Object tanpa teks pengantar/penutup.
    Struktur objek wajib persis seperti ini:
    {
      "id": "nama_file_unik_tanpa_spasi",
      "deskripsi": "Deskripsi detail visual bahasa Inggris untuk Adobe Stock (minimal 15 kata)",
      "judul": "Rekomendasi judul video SEO bahasa Inggris (maksimal 12 words)",
      "keywords": "35-50 kata kunci bahasa Inggris dipisah koma",
      "kategori": "Kategori Adobe Stock (Technology/Abstract/Business)",
      "durationInFrames": 150, // WAJIB ISI: Tentukan durasi (150 untuk 5 detik, 300 untuk 10 detik, sesuai kebutuhan visual)
      "promptCode": "Tulis satu file kode React Remotion (.tsx) UTUH untuk komponen 'MyComposition'. WAJIB memenuhi syarat: 1. Jika tema abstrak/techno, buat sistem looping sempurna (seamless loop) memanfaatkan frame/fps agar frame awal dan akhir menyatu. 2. JANGAN beri warna background solid pada tag container terluar, biarkan background-nya TRANSPARAN (tanpa backgroundColor) agar pembeli bisa menggunakannya sebagai overlay video. 3. Buat ornamen visual berlapis (kombinasi fungsi Math.sin/Math.cos untuk pergerakan partikel acak, transformasi CSS 3D, atau efek wave). Teks utama harus memiliki animasi masuk dan keluar yang halus. Langsung keluarkan teks kodenya murni dari baris import sampai export murni tanpa markdown."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json|```/g, "").trim();
    }

    const dataObjek = JSON.parse(jsonText);
    res.json(dataObjek);
    console.log("✅ Sukses mengirimkan data dan skrip kode AI ke dashboard!");
  } catch (error) {
    console.error("❌ Gagal memproses AI:", error.message);
    res.status(500).json({ error: "Server AI sedang sibuk." });
  }
});

// JALUR 2: TIMPA FILE LOKAL -> AUTO PUSH GITHUB -> TRIGGER CLOUD RENDER
app.post("/api/render", async (req, res) => {
  const { item } = req.body;
  console.log(`🚀 Memproses Antrean Kreatif untuk: ${item.id}`);

  try {
    // 1. Eksekusi TIMPA file src/Composition.tsx lokal dengan kode bebas kreasi Gemini
    fs.writeFileSync("src/Composition.tsx", item.promptCode);
    console.log(`📝 File src/Composition.tsx berhasil ditimpa dengan kode baru!`);

    // 2. Jalankan Auto Push ke GitHub Anda secara sinkronus agar server cloud mendapat pasokan kode baru
    console.log("📤 Menyingkronkan kode baru ke GitHub...");
    execSync("git add src/Composition.tsx", { stdio: "inherit" });
    execSync(`git commit -m "Auto-generate visual untuk ${item.id}"`, { stdio: "inherit" });
    execSync("git push origin main", { stdio: "inherit" });
    console.log("✅ Kode berhasil mendarat di GitHub!");

    // 3. Tembak API GitHub Actions untuk memicu render di cloud
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/dispatches`;
    await axios.post(
      url,
      {
        event_type: "target-render-cloud",
client_payload: { 
          item: { 
            id: item.id,
            durationInFrames: item.durationInFrames || 150 // Ikut mengirim durasi dari AI
          } 
        }
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    console.log(`☁️ Cloud GitHub Actions berhasil terpicu untuk merender ${item.id}!`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Gagal di jalur pipa otomatisasi:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(5000, () => {
  console.log("Server Jembatan Kode Bebas aktif di port 5000");
});