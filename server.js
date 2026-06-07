const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const axios = require("axios"); // Menggunakan axios untuk menembak API GitHub

const app = express();
app.use(cors());
app.use(express.json());

// 🔴 1. PENGATURAN KUNCI RAHASIA (GANTI DENGAN DATA ANDA)
const GEMINI_API_KEY = "AQ.Ab8RN6LfUul0L7Bstt4xUutVRJ9Z2TENvV17Qt0TOEvo4nWmvw";
const GITHUB_TOKEN = "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"; 
const GITHUB_USERNAME = "zulmorang15-dot"; 
const GITHUB_REPO = "master-stock-generator"; // Ganti jika nama repositori Anda di GitHub berbeda

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// JALUR 1: PENCARIAN IDE GEMINI (Tetap aman seperti kemarin)
app.post("/api/generate", async (req, res) => {
  const { keyword } = req.body;
  
  const prompt = `
    Kamu adalah seorang pakar riset pasar microstock global fokus pasar USA.
    Tolong riset kata kunci: "${keyword}".
    Berikan 5 ide variasi video motion graphic yang paling laku di USA.
    Setiap ide harus memiliki parameter visual yang cocok untuk template Remotion teks neon saya.
    
    Keluarkan hasil riset dalam format JSON murni berbentuk Array of Object tanpa teks pengantar atau penutup apa pun.
    Setiap objek wajib memiliki struktur persis seperti ini:
    {
      "id": "nama_file_tanpa_spasi_unik",
      "textInput": "KATA_KUNCI_SINGKAT_UNTUK_TEKS_DI_VIDEO",
      "color1": "#kode_hex_warna_1",
      "color2": "#kode_hex_warna_2",
      "speed": 1.2
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
  } catch (error) {
    res.status(500).json({ error: "Server AI sedang sibuk." });
  }
});

// JALUR 2: TOMBOL RENDER CLOUD (Sekarang mengirim tugas berat ke server GitHub)
app.post("/api/render", async (req, res) => {
  const { item } = req.body;
  console.log(`☁️ Mengirimkan data "${item.textInput}" ke Cloud GitHub Actions...`);

  try {
    // Menembak endpoint khusus GitHub Repository Dispatch
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/dispatches`;
    
    const response = await axios.post(
      url,
      {
        event_type: "target-render-cloud", // Harus klop dengan isi yml tadi
        client_payload: { item: item }     // Data lemparan warna & teks dikirim ke server GitHub
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    console.log(`🚀 Tugas render [${item.id}] sukses masuk antrean GitHub Actions!`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Gagal menembak API GitHub:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: "Gagal terhubung ke antrean awan GitHub." });
  }
});

app.listen(5000, () => {
  console.log("Server Jembatan Awan aktif di port 5000");
});