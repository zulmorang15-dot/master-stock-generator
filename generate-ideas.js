const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

// 🔴 PASTIKAN API KEY GEMINI ANDA SUDAH BENAR DI SINI
const GEMINI_API_KEY = "AQ.Ab8RN6LfUul0L7Bstt4xUutVRJ9Z2TENvV17Qt0TOEvo4nWmvw";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const KEYWORD_TARGET = "Neon Motion Background for Tech Video";
const JUMLAH_BARIS = 5;

// Fungsi pembantu untuk membuat jeda waktu (delay)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function mintaIdeKeGemini(retries = 3) {
  console.log(`🤖 Menghubungi Gemini AI untuk riset keyword: "${KEYWORD_TARGET}"...`);

  const prompt = `
    Kamu adalah seorang pakar riset pasar microstock global (Adobe Stock dan Shutterstock) fokus pasar USA.
    Tolong riset kata kunci: "${KEYWORD_TARGET}".
    
    Berikan ${JUMLAH_BARIS} ide variasi video motion graphic yang paling laku dan dicari oleh editor video di USA.
    Setiap ide harus memiliki parameter visual yang cocok untuk template Remotion teks neon saya.
    
    Keluarkan hasil riset dalam format JSON murni berbentuk Array of Object tanpa teks pengantar atau penutup apa pun.
    Setiap objek wajib memiliki struktur persis seperti ini:
    {
      "id": "nama_file_tanpa_spasi_unik",
      "textInput": "KATA_KUNCI_SINGKAT_UNTUK_TEKS_DI_VIDEO",
      "color1": "#kode_hex_warna_1",
      "color2": "#kode_hex_warna_2",
      "speed": angka_kecepatan_antara_0.5_sampai_2.0
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Anda juga bisa ganti ke "gemini-1.5-flash" jika versi 2.5 terus-menerus penuh
      contents: prompt,
    });

    let jsonText = response.text.trim();
    
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json|```/g, "").trim();
    }

    // Validasi apakah hasil benar-benar JSON yang valid
    JSON.parse(jsonText);

    fs.writeFileSync("ideas.json", jsonText);
    console.log(`\n✅ Sukses! Gemini berhasil membuat ${JUMLAH_BARIS} ide video baru di 'ideas.json'.`);

  } catch (error) {
    // Jika eror karena server sibuk (503) dan jatah percobaan masih ada
    if (retries > 0) {
      console.log(`⚠️ Server Gemini sedang sibuk (503). Mencoba lagi dalam 5 detik... (Sisa percobaan: ${retries})`);
      await delay(5000); // Tunggu 5 detik
      return mintaIdeKeGemini(retries - 1); // Panggil fungsi ini lagi
    } else {
      console.error("\n❌ Gagal total setelah beberapa kali mencoba. Server Google benar-benar sedang overload.");
      console.error("Detail Eror:", error.message);
    }
  }
}

mintaIdeKeGemini();