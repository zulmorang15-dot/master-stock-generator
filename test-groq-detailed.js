require('dotenv').config();
const axios = require('axios');

async function testGroq() {
  const prompt = `Kamu adalah pakar Creative Director SEO Microstock USA.
Analisis file HTML berikut dan buat metadata SEO yang luar biasa kreatif, visualnya mewah, dan bernilai jual tinggi untuk dipasarkan di Adobe Stock.

HTML Content:
<html><body><h1>Test</h1></body></html>

Keluarkan hasil dalam format JSON murni berbentuk objek tanpa teks pengantar/penutup apa pun.
DILARANG menggunakan karakter double quote (") di dalam nilai string. Gunakan single quote (') jika perlu.
Struktur objek wajib persis seperti ini:
{
  "judul": "Rekomendasi judul video SEO bahasa Inggris (maksimal 12 kata).",
  "keywords": "35-50 kata kunci bahasa Inggris dipisah koma.",
  "deskripsi": "Deskripsi detail visual bahasa Inggris.",
  "kategori": "Technology"
}`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 1
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 90000
      }
    );
    console.log("SUCCESS!");
    console.log(response.data.choices[0].message.content);
  } catch (error) {
    console.error("FAILED!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

testGroq();
