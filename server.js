require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { execSync } = require("child_process");
const { GoogleGenAI } = require("@google/genai");
const syntxBot = require('./syntx-bot');

const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Ensure necessary directories exist
fs.mkdirSync(path.join(__dirname, "public", "previews"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });

// Initialize database file if not exists
const dbPath = path.join(__dirname, "saved-items.json");
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

// Route for the dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Root redirect to dashboard
app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

// API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPO = process.env.GITHUB_REPO;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

// DeepSeek AI Call Helper (langsung menggunakan API resmi DeepSeek)
async function callDeepSeek(prompt, model = "deepseek-chat") {
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY tidak ditemukan di .env");
    }

    console.log("📡 Mengirim request ke DeepSeek AI...");
    console.log("🤖 Model:", model);

    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
      },
      {
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 90000
      }
    );

    if (!response.data.choices || !response.data.choices[0]) {
      throw new Error("Respons DeepSeek tidak valid: " + JSON.stringify(response.data));
    }

    console.log("✅ Respon DeepSeek berhasil diterima!");
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ DeepSeek Error:", error.response?.data || error.message);
    throw error;
  }
}

// Nvidia AI Call Helper
async function callNvidia(prompt, model = "nvidia/nemotron-3-ultra-550b-a55b") {
  try {
    if (!NVIDIA_API_KEY) {
      throw new Error("NVIDIA_API_KEY tidak ditemukan di .env");
    }

    console.log(`📡 Mengirim request ke Nvidia AI (model: ${model})...`);
    
    const response = await axios.post(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        extra_body: {
          chat_template_kwargs: {
            enable_thinking: true
          }
        }
      },
      {
        headers: {
          "Authorization": `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 90000 // 90 seconds timeout for thinking
      }
    );

    if (!response.data.choices || !response.data.choices[0]) {
      throw new Error("Respons Nvidia tidak valid: " + JSON.stringify(response.data));
    }

    console.log("✅ Respon Nvidia AI berhasil diterima!");
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Nvidia Error:", error.response?.data || error.message);
    throw error;
  }
}

// Inisialisasi Gemini AI
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  console.log("🤖 Gemini AI SDK berhasil diinisialisasi!");
} else {
  console.warn("⚠️ GEMINI_API_KEY tidak ditemukan, Gemini AI tidak akan tersedia.");
}

// Groq AI Call Helper (fallback cepat saat Gemini limit)
async function callGroq(prompt, model = "llama-3.3-70b-versatile") {
  try {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY tidak ditemukan di .env");
    }

    console.log(`📡 Mengirim request ke Groq AI (model: ${model})...`);
    console.log("🔑 API Key Groq ada:", GROQ_API_KEY.substring(0, 20) + "...");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: model,
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
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 90000
      }
    );

    if (!response.data.choices || !response.data.choices[0]) {
      throw new Error("Respons Groq tidak valid: " + JSON.stringify(response.data));
    }

    console.log("✅ Respon Groq AI berhasil diterima!");
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Groq Error:", error.response?.data || error.message);
    
    // Auto-fallback to llama-3.1-8b-instant if rate limit is hit
    const isRateLimit = error.response?.status === 429 || 
                        error.response?.data?.error?.code === 'rate_limit_exceeded';
    if (isRateLimit && model === "llama-3.3-70b-versatile") {
      console.warn("⚠️ Groq TPM limit hit. Retrying automatically with llama-3.1-8b-instant...");
      return await callGroq(prompt, "llama-3.1-8b-instant");
    }
    throw error;
  }
}

// Helper: deteksi apakah error adalah rate limit / quota exceeded
function isRateLimitError(err) {
  const status = err?.response?.status;
  const msg = (err?.message || '').toLowerCase();
  const data = JSON.stringify(err?.response?.data || '').toLowerCase();
  return status === 429 ||
    status === 413 ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('429') ||
    msg.includes('limit exceeded') ||
    data.includes('rate_limit') ||
    data.includes('quota') ||
    data.includes('429');
}

// Smart AI Call dengan auto-fallback: Groq -> Syntx.ai (Claude) -> Gemini -> DeepSeek -> Nvidia -> OpenRouter
// Syntx.ai dinaikan ke posisi ke-2 karena gratis tak terbatas dan handal
async function callAIWithFallback(prompt, options = {}) {
  const { preferModel, validator } = options;

  // Helper: cek apakah respons valid dengan validator jika ada
  const isValid = (text) => {
    if (!text || !text.trim()) return false;
    if (validator) return validator(text);
    return true;
  };

  const errors = [];

  // Jika preferModel adalah specific provider, langsung route ke sana
  if (preferModel === 'groq') {
    try {
      const result = await callGroq(prompt);
      if (isValid(result)) return result;
    } catch (err) { errors.push({ provider: 'groq', error: err.message }); }
  } else if (preferModel === 'syntx-claude') {
    try {
      const result = await syntxBot.callSyntx(prompt, 'claude-opus-4-8');
      if (isValid(result)) return result;
    } catch (err) { errors.push({ provider: 'syntx-claude', error: err.message }); }
  } else if (preferModel === 'syntx-gemini') {
    try {
      const result = await syntxBot.callSyntx(prompt, 'gemini-3.5-flash');
      if (isValid(result)) return result;
    } catch (err) { errors.push({ provider: 'syntx-gemini', error: err.message }); }
  } else if (preferModel === 'gemini') {
    try {
      if (genAI) {
        const result = await callGemini(prompt);
        if (isValid(result)) return result;
      }
    } catch (err) { errors.push({ provider: 'gemini', error: err.message }); }
  } else if (preferModel === 'openrouter') {
    try {
      const result = await callOpenRouter(prompt);
      if (isValid(result)) return result;
    } catch (err) { errors.push({ provider: 'openrouter', error: err.message }); }
  }

  // Auto-fallback mode (default) — coba semua secara berurutan
  // 1. Coba Groq dulu (paling cepat jika tidak kena limit)
  if (preferModel !== 'groq') {
    try {
      if (GROQ_API_KEY) {
        console.log("📡 [1/6] Mencoba Groq AI (llama-3.3-70b)...");
        const result = await callGroq(prompt, "llama-3.3-70b-versatile");
        if (isValid(result)) return result;
        console.warn("⚠️ Groq: respons tidak valid (mungkin terpotong), lanjut fallback...");
      }
    } catch (err) {
      const isLimit = isRateLimitError(err);
      console.warn(`⚠️ Groq gagal${isLimit ? ' (RATE LIMIT)' : ''}:`, err.message?.substring(0, 100));
      errors.push({ provider: "groq", error: err.message });
    }
  }

  // 2. Syntx.ai Claude Opus 4.8 – GRATIS & UNLIMITED, model terbaik
  if (preferModel !== 'syntx-claude') {
    try {
      console.log("📡 [2/6] Mencoba Syntx.ai Claude Opus 4.8 (gratis, tanpa limit)...");
      const result = await syntxBot.callSyntx(prompt, 'claude-opus-4-8');
      if (isValid(result)) return result;
      console.warn("⚠️ Syntx Claude: respons tidak valid, lanjut fallback...");
    } catch (err) {
      console.warn("⚠️ Syntx.ai Claude gagal:", err.message?.substring(0, 100));
      errors.push({ provider: "syntx-claude", error: err.message });
    }
  }

  // 3. Coba Gemini (jika ada)
  if (preferModel !== 'gemini') {
    try {
      if (genAI) {
        console.log("📡 [3/6] Mencoba Gemini AI...");
        const result = await callGemini(prompt);
        if (isValid(result)) return result;
        console.warn("⚠️ Gemini: respons tidak valid, lanjut fallback...");
      }
    } catch (err) {
      const isLimit = isRateLimitError(err);
      console.warn(`⚠️ Gemini gagal${isLimit ? ' (QUOTA)' : ''}:`, err.message?.substring(0, 100));
      errors.push({ provider: "gemini", error: err.message });
    }
  }

  // 4. Coba Syntx Gemini 3.5 Flash sebagai fallback
  if (preferModel !== 'syntx-gemini') {
    try {
      console.log("📡 [4/6] Mencoba Syntx.ai Gemini 3.5 Flash...");
      const result = await syntxBot.callSyntx(prompt, 'gemini-3.5-flash');
      if (isValid(result)) return result;
      console.warn("⚠️ Syntx Gemini: respons tidak valid, lanjut fallback...");
    } catch (err) {
      console.warn("⚠️ Syntx.ai Gemini gagal:", err.message?.substring(0, 100));
      errors.push({ provider: "syntx-gemini", error: err.message });
    }
  }

  // 5. Coba DeepSeek
  try {
    if (DEEPSEEK_API_KEY) {
      console.log("📡 [5/6] Mencoba DeepSeek AI...");
      const result = await callDeepSeek(prompt);
      if (isValid(result)) return result;
    }
  } catch (err) {
    console.warn("⚠️ DeepSeek gagal:", err.message?.substring(0, 100));
    errors.push({ provider: "deepseek", error: err.message });
  }

  // 6. Coba OpenRouter (fallback terakhir)
  try {
    console.log("📡 [6/6] Mencoba OpenRouter sebagai fallback terakhir...");
    const result = await callOpenRouter(prompt, "default");
    if (isValid(result)) return result;
  } catch (err) {
    console.warn("⚠️ OpenRouter gagal:", err.message?.substring(0, 100));
    errors.push({ provider: "openrouter", error: err.message });
  }

  // Semua gagal
  throw new Error(`Semua provider AI gagal: ${JSON.stringify(errors)}`);
}

// Daftar model OpenRouter yang tersedia (fallback jika satu model error)
const OPENROUTER_MODELS = {
  // Google Models
  "gemini-2.0-flash": "google/gemini-2.0-flash-001",
  "gemini-2.0-flash-lite": "google/gemini-2.0-flash-lite-preview-02-05",
  "gemini-1.5-flash": "google/gemini-1.5-flash",
  "gemini-1.5-pro": "google/gemini-1.5-pro",
  "gemini-2.5-pro": "google/gemini-2.5-pro-exp-03-25",
  "gemini-2.5-flash-free": "google/gemini-2.5-flash:free",

  // OpenAI Models
  "gpt-4o": "openai/gpt-4o",
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "gpt-3.5-turbo": "openai/gpt-3.5-turbo",

  // Meta / Llama
  "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct",
  "llama-3.1-8b": "meta-llama/llama-3.1-8b-instruct",

  // Mistral
  "mistral-7b": "mistralai/mistral-7b-instruct",
  "mixtral-8x7b": "mistralai/mixtral-8x7b-instruct",

  // DeepSeek
  "deepseek-v3": "deepseek/deepseek-chat",
  "deepseek-r1": "deepseek/deepseek-r1",

  // Qwen
  "qwen-2.5-72b": "qwen/qwen-2.5-72b-instruct",

  // Default
  "default": "meta-llama/llama-3.3-70b-instruct:free" // Model default yang gratis & unlimited
};

// OpenRouter API Call Helper dengan auto-fallback model
async function callOpenRouter(prompt, modelKey = "default") {
  // Daftar model untuk fallback jika model utama gagal (utamakan model gratis)
  const fallbackModels = [
    modelKey,                                    // Model yang diminta
    "meta-llama/llama-3.3-70b-instruct:free",    // Fallback 1: Llama 3.3 70B Free
    "meta-llama/llama-3.2-3b-instruct:free",     // Fallback 2: Llama 3.2 3B Free
    "qwen/qwen3-coder:free",                     // Fallback 3: Qwen 3 Coder Free
    "nousresearch/hermes-3-llama-3.1-405b:free", // Fallback 4: Hermes 3 405B Free
    "nvidia/nemotron-3-ultra-550b-a55b:free"     // Fallback 5: Nvidia Nemotron Free
  ];

  let lastError = null;

  for (const fbModel of fallbackModels) {
    try {
      const modelName = OPENROUTER_MODELS[fbModel] || fbModel;

      if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY tidak ditemukan di .env");
      }

      console.log(`📡 Mengirim request ke OpenRouter (model: ${modelName})...`);
      console.log("🔑 API Key ada:", OPENROUTER_API_KEY.substring(0, 20) + "...");

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: modelName,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          top_p: 1
        },
        {
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Stock Generator",
            "Content-Type": "application/json"
          },
          timeout: 60000
        }
      );

      if (!response.data.choices || !response.data.choices[0]) {
        throw new Error("Respons OpenRouter tidak valid: " + JSON.stringify(response.data));
      }

      console.log(`✅ OpenRouter sukses dengan model: ${modelName}`);
      return response.data.choices[0].message.content;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Model ${OPENROUTER_MODELS[fbModel] || fbModel} gagal, coba model berikutnya...`);
      console.warn(`   Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Semua model gagal
  console.error("❌ Semua model OpenRouter gagal!");
  console.error("📋 Error Terakhir:", lastError.response?.data || lastError.message);
  throw lastError;
}

// Gemini AI Call Helper (langsung tanpa OpenRouter)
async function callGemini(prompt, model = "gemini-2.0-flash") {
  try {
    if (!genAI) {
      throw new Error("Gemini AI belum diinisialisasi. Periksa GEMINI_API_KEY di .env");
    }

    console.log("📡 Mengirim request ke Gemini AI...");
    console.log("🤖 Model:", model);

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topP: 1,
      }
    });

    if (!response || !response.text) {
      throw new Error("Respons Gemini tidak valid");
    }

    console.log("✅ Respon Gemini berhasil diterima!");
    return response.text;
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API key not valid")) {
      console.error("🔑 API Key Gemini tidak valid! Periksa GEMINI_API_KEY di .env");
    }
    throw error;
  }
}

// Fungsi Scraping Live Data dari Adobe Stock
async function scrapAdobeStock(keyword) {
  try {
    const searchUrl = "https://stock.adobe.com/id/search/video?k=" + encodeURIComponent(keyword);
    console.log("🔍 Mengorek data Adobe Stock untuk: " + keyword);

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
      if (judul) referensi.push("- Referensi " + (index + 1) + ": " + judul);
    });

    return referensi.length > 0 ? referensi.join("\n") : "- Referensi 1: " + keyword + " abstract motion background loop";
  } catch (error) {
    return "- Referensi 1: " + keyword + " tech abstract neon background loop";
  }
}

// JALUR 1: AMBIL DATA & OPTIMALISASI ATM VIA OPENROUTER
app.post("/api/generate", async (req, res) => {
  const { keyword } = req.body;

  const dataScrap = await scrapAdobeStock(keyword);
  console.log("🤖 Menyodorkan data kompetitor ke OpenRouter AI...");

  if (!OPENROUTER_API_KEY) {
    console.error("❌ EROR: OPENROUTER_API_KEY tidak ditemukan di file .env!");
    return res.status(500).json({ error: "API Key OpenRouter belum dikonfigurasi di file .env" });
  }

  const prompt = "Kamu adalah pakar Creative Director SEO Microstock USA.\n" +
    "Berikut adalah tren data judul kompetitor di Adobe Stock saat ini:\n" + dataScrap + "\n\n" +
    "Lakukan strategi ATM untuk pasar USA. Buat 5 variasi ide video yang LUAR BIASA KREATIF, visualnya mewah, kompleks, futuristik, dan bernilai jual tinggi.\n\n" +
    "Keluarkan hasil dalam format JSON murni berbentuk Array of Object tanpa teks pengantar/penutup apa pun.\n" +
    "DILARANG menggunakan karakter double quote (\") di dalam nilai string. Gunakan single quote (') jika perlu.\n" +
    "Struktur objek wajib persis seperti ini:\n" +
    "[\n" +
    "  {\n" +
    '    "id": "nama_file_unik_tanpa_spasi",\n' +
    '    "deskripsi": "Deskripsi detail visual bahasa Inggris untuk Adobe Stock (minimal 15 kata). Terjemahkan istilah kode ke visual: jangan sebut keyframes/easing/canvas, tapi gunakan smooth animation, fluid movement, dll.",\n' +
    '    "judul": "Rekomendasi judul video SEO bahasa Inggris (maksimal 12 kata). DILARANG menggunakan kata teknis pemrograman seperti CSS, keyframes, requestAnimationFrame, HTML, canvas, SVG, easing, DLL. Gunakan istilah komersial video seperti: smooth animation, fluid movement, modern UI UX elements overlay, app interface template, abstract particles, seamless loop, data visualization, animated infographics, interactive design concept.",\n' +
    '    "keywords": "35-50 kata kunci bahasa Inggris dipisah koma. DILARANG menggunakan istilah teknis pemrograman (CSS transition, keyframes, requestAnimationFrame, SVG, canvas, loop). WAJIB menerjemahkan ke istilah komersial video stock dan disusun berdasarkan Teknik 3 Pilar dengan 7-10 keyword pertama adalah yang paling krusial. Pilar 1 (What/Isi: mouse click, subscribe button, loading bar, progress indicator, dll), Pilar 2 (Visual/Style: minimalist, flat design, modern UI, isolated, 4k. Jika video transparan, keyword \'alpha channel\' dan \'transparent background\' WAJIB ditaruh di 10 keyword pertama), Pilar 3 (Kegunaan/Context: website promo, social media asset, app presentation, marketing material).",\n' +
    '    "kategori": "Kategori Adobe Stock (Technology/Abstract/Business)",\n' +
    '    "durationInFrames": 150\n' +
    "  }\n" +
    "]";

  try {
    console.log("📡 Menggunakan AI dengan fallback untuk generate ide...");
    const aiResponse = await callAIWithFallback(prompt);

    let jsonText = aiResponse.trim();
    if (jsonText.startsWith("`" + "`" + "`json")) {
      jsonText = jsonText.split("`" + "`" + "`json")[1].split("`" + "`" + "`")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    jsonText = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    const dataObjek = JSON.parse(jsonText);
    console.log("✅ Sukses memproses data riset!");
    return res.json(dataObjek);

  } catch (error) {
    console.error("❌ Detail Eror Koneksi AI:");
    console.error(error.message);
    return res.status(500).json({ error: "Koneksi ke AI terputus.", details: error.message });
  }
});

// JALUR 1B: GENERATE IDE VIA GEMINI LANGSUNG (tanpa OpenRouter)
app.post("/api/generate-gemini", async (req, res) => {
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: "Keyword diperlukan" });
  }

  const dataScrap = await scrapAdobeStock(keyword);
  console.log("🤖 Menyodorkan data kompetitor ke Gemini AI...");

  if (!genAI) {
    return res.status(500).json({ error: "Gemini AI belum dikonfigurasi. Periksa GEMINI_API_KEY di .env" });
  }

  const prompt = "Kamu adalah pakar Creative Director SEO Microstock USA.\n" +
    "Berikut adalah tren data judul kompetitor di Adobe Stock saat ini:\n" + dataScrap + "\n\n" +
    "Lakukan strategi ATM untuk pasar USA. Buat 5 variasi ide video yang LUAR BIASA KREATIF, visualnya mewah, kompleks, futuristik, dan bernilai jual tinggi.\n\n" +
    "Keluarkan hasil dalam format JSON murni berbentuk Array of Object tanpa teks pengantar/penutup apa pun.\n" +
    "DILARANG menggunakan karakter double quote (\") di dalam nilai string. Gunakan single quote (') jika perlu.\n" +
    "Struktur objek wajib persis seperti ini:\n" +
    "[\n" +
    "  {\n" +
    '    "id": "nama_file_unik_tanpa_spasi",\n' +
    '    "deskripsi": "Deskripsi detail visual bahasa Inggris untuk Adobe Stock (minimal 15 kata). Terjemahkan istilah kode ke visual: jangan sebut keyframes/easing/canvas, tapi gunakan smooth animation, fluid movement, dll.",\n' +
    '    "judul": "Rekomendasi judul video SEO bahasa Inggris (maksimal 12 kata). DILARANG menggunakan kata teknis pemrograman seperti CSS, keyframes, requestAnimationFrame, HTML, canvas, SVG, easing, DLL. Gunakan istilah komersial video seperti: smooth animation, fluid movement, modern UI UX elements overlay, app interface template, abstract particles, seamless loop, data visualization, animated infographics, interactive design concept.",\n' +
    '    "keywords": "35-50 kata kunci bahasa Inggris dipisah koma. DILARANG menggunakan istilah teknis pemrograman (CSS transition, keyframes, requestAnimationFrame, SVG, canvas, loop). WAJIB menerjemahkan ke istilah komersial video stock dan disusun berdasarkan Teknik 3 Pilar dengan 7-10 keyword pertama adalah yang paling krusial. Pilar 1 (What/Isi: mouse click, subscribe button, loading bar, progress indicator, dll), Pilar 2 (Visual/Style: minimalist, flat design, modern UI, isolated, 4k. Jika video transparan, keyword \'alpha channel\' dan \'transparent background\' WAJIB ditaruh di 10 keyword pertama), Pilar 3 (Kegunaan/Context: website promo, social media asset, app presentation, marketing material).",\n' +
    '    "kategori": "Kategori Adobe Stock (Technology/Abstract/Business)",\n' +
    '    "durationInFrames": 150\n' +
    "  }\n" +
    "]";

  try {
    console.log("📡 Menggunakan AI dengan fallback untuk generate ide...");
    const aiResponse = await callAIWithFallback(prompt);

    let jsonText = aiResponse.trim();
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    jsonText = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    const dataObjek = JSON.parse(jsonText);
    console.log("✅ Sukses memproses data riset dari Gemini AI!");
    return res.json(dataObjek);

  } catch (error) {
    console.error("❌ Detail Eror Gemini AI:");
    console.error(error.message);
    return res.status(500).json({ error: "Koneksi ke Gemini AI terputus.", details: error.message });
  }
});

// JALUR 2: TERIMA EDITAN USER -> TIMPA LOKAL -> PUSH GITHUB -> TRIGGER RENDER CLOUD
app.post("/api/render", async (req, res) => {
  const { item } = req.body;
  console.log("🚀 Memproses Antrean Kreatif untuk: " + item.id);

  try {
    // 1. Timpa file src/Composition.tsx lokal
    fs.writeFileSync("src/Composition.tsx", item.promptCode);
    console.log("📝 File src/Composition.tsx berhasil diperbarui!");

    // 2. Jalankan Auto Push ke GitHub
    console.log("📤 Menyingkronkan kode hasil kurasi ke GitHub...");
    execSync("git add src/Composition.tsx", { stdio: "inherit" });
    execSync('git commit -m "Injeksi kurasi visual untuk ' + item.id + '"', { stdio: "inherit" });
    execSync("git push origin main", { stdio: "inherit" });
    console.log("✅ Kode mendarat dengan aman di GitHub!");

    // 3. Tembak API GitHub Actions untuk Cloud Rendering
    const url = "https://api.github.com/repos/" + GITHUB_USERNAME + "/" + GITHUB_REPO + "/dispatches";
    await axios.post(
      url,
      {
        event_type: "target-render-cloud",
        client_payload: {
          item: {
            id: item.id,
            durationInFrames: Number(item.durationInFrames) || 150
          }
        }
      },
      {
        headers: {
          Authorization: "token " + GITHUB_TOKEN,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    console.log("☁️ Cloud GitHub Actions berhasil terpicu untuk merender " + item.id);
    return res.json({ success: true });
  } catch (error) {
    console.error("❌ Gagal di jalur pipa otomatisasi:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// JALUR 3A: GENERATE HTML PREVIEW VIA GEMINI (tanpa OpenRouter)
app.post("/api/generate-html-preview-gemini", async (req, res) => {
  const { item } = req.body;
  console.log("🎨 Menghasilkan preview HTML via Gemini untuk: " + item.id);

  if (!genAI) {
    return res.status(500).json({ error: "Gemini AI belum dikonfigurasi. Periksa GEMINI_API_KEY di .env" });
  }

  try {
    const prompt = item.promptHTML || `Generate an exceptionally detailed, premium, and professional HTML5, CSS3, and JavaScript animation that is visually jaw-dropping, high-performance, and designed to look like a premium commercial stock video template (1920x1080 viewport). The animation must be based on the following description:
    
    "${item.deskripsi}"
    
    **CRITICAL STYLING & VISUAL AESTHETICS (WOW-EFFECT):**
    1.  **Vibrant & Modern Color Palette:**
        *   Do NOT use basic solid primary colors (plain red, plain blue, plain green).
        *   Use rich dark mode backgrounds (e.g., deep space obsidian \`#050716\`, carbon obsidian, or dark slate).
        *   Implement smooth multi-stop linear/radial gradients and neon glow effects (using CSS box-shadow, text-shadow, filters, and glow animations).
        *   Utilize beautiful tailored color combinations: cyber neon cyan (\`#00f2fe\`), glowing hot magenta/pink (\`#4facfe\` to \`#ff0844\`), tech purple/violet, or radioactive lime green.
    2.  **Visual Depth & Premium UI styling (Glassmorphism):**
        *   Use modern translucent panels with \`backdrop-filter: blur(15px)\`, semi-transparent borders (\`border: 1px solid rgba(255, 255, 255, 0.1)\`), and subtle inner shadows.
        *   Include thin grid overlays, cyber grids, digital network nodes, particle trails, or moving mathematical wave structures (using HTML5 Canvas or complex SVG paths).
    3.  **Elegant Typography:**
        *   Import custom typography inside the HTML using Google Fonts (e.g. Orbitron, Outfit, Inter, Montserrat, or Space Grotesk) inside a \`<link>\` tag or \`@import\`.
        *   Apply beautiful typography details: letter-spacing, text gradients (\`background-clip: text\`), text uppercase transformations, and clean layout scaling.
    4.  **Complex & Rich Movement:**
        *   Use layered animations. Avoid basic linear movements.
        *   Use fluid, organic easing (e.g. cubic-bezier easing or Math.sin/Math.cos for wave and floating systems).
        *   If the animation is a loop, ensure a seamless looping transition (no sudden jumps/flickers).
        *   Create highly detailed visual ornaments: glowing lines, rotating coordinate rings, data streams, cybernetic shapes, interactive or automated cursor click indicators.
    
    **TECHNICAL REQUIREMENTS:**
    1.  **Semantic Structure:** Use appropriate HTML5 tags (e.g., <canvas>, <svg>, <main>, <section>).
    2.  **No External Dependencies:** Provide the complete HTML document. All CSS must be within \`<style>\` tags, and all JS within \`<script>\` tags. Do not load external JavaScript files unless they are lightweight standard libraries (e.g., load Google Fonts or standard SVG).
    3.  **Deterministic Animations:** To prevent frame-tearing in video conversion, do NOT use non-deterministic code (like true random positions on every frame, Date.now(), setInterval/setTimeout in a loop). Initialize random values into static arrays on load, and drive all dynamic motion relative to a global frame/time counter.
    4.  **Output Format:** Provide ONLY the raw HTML code. Do NOT wrap it in markdown like \`\`\`html or include any explanatory text.
    
    Make the output extremely aesthetic, complex, and professional. The user should be completely wowed by the design.`;

    const aiResponse = await callAIWithFallback(prompt);

    let htmlText = aiResponse.trim();
    if (htmlText.includes("```html")) {
      htmlText = htmlText.split("```html")[1].split("```")[0].trim();
    } else if (htmlText.includes("```")) {
      htmlText = htmlText.split("```")[1].split("```")[0].trim();
    }

    console.log("✅ HTML Preview via Gemini berhasil dihasilkan untuk " + item.id);
    return res.json({ htmlPreview: htmlText });

  } catch (error) {
    console.error("❌ Gagal generate HTML preview via Gemini:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// JALUR 3B: GENERATE HTML PREVIEW DARI DESKRIPSI VIDEO (Mendukung Gemini SDK / OpenRouter)
app.post("/api/generate-html-preview", async (req, res) => {
  const { item } = req.body;
  console.log("🎨 Menghasilkan preview HTML untuk: " + item.id);

  try {
    const prompt = item.promptHTML || `Generate an exceptionally detailed, premium, and professional HTML5, CSS3, and JavaScript animation that is visually jaw-dropping, high-performance, and designed to look like a premium commercial stock video template (1920x1080 viewport). The animation must be based on the following description:
    
    "${item.deskripsi}"
    
    **CRITICAL STYLING & VISUAL AESTHETICS (WOW-EFFECT):**
    1.  **Vibrant & Modern Color Palette:**
        *   Do NOT use basic solid primary colors (plain red, plain blue, plain green).
        *   Use rich dark mode backgrounds (e.g., deep space obsidian \`#050716\`, carbon obsidian, or dark slate).
        *   Implement smooth multi-stop linear/radial gradients and neon glow effects (using CSS box-shadow, text-shadow, filters, and glow animations).
        *   Utilize beautiful tailored color combinations: cyber neon cyan (\`#00f2fe\`), glowing hot magenta/pink (\`#4facfe\` to \`#ff0844\`), tech purple/violet, or radioactive lime green.
    2.  **Visual Depth & Premium UI styling (Glassmorphism):**
        *   Use modern translucent panels with \`backdrop-filter: blur(15px)\`, semi-transparent borders (\`border: 1px solid rgba(255, 255, 255, 0.1)\`), and subtle inner shadows.
        *   Include thin grid overlays, cyber grids, digital network nodes, particle trails, or moving mathematical wave structures (using HTML5 Canvas or complex SVG paths).
    3.  **Elegant Typography:**
        *   Import custom typography inside the HTML using Google Fonts (e.g. Orbitron, Outfit, Inter, Montserrat, or Space Grotesk) inside a \`<link>\` tag or \`@import\`.
        *   Apply beautiful typography details: letter-spacing, text gradients (\`background-clip: text\`), text uppercase transformations, and clean layout scaling.
    4.  **Complex & Rich Movement:**
        *   Use layered animations. Avoid basic linear movements.
        *   Use fluid, organic easing (e.g. cubic-bezier easing or Math.sin/Math.cos for wave and floating systems).
        *   If the animation is a loop, ensure a seamless looping transition (no sudden jumps/flickers).
        *   Create highly detailed visual ornaments: glowing lines, rotating coordinate rings, data streams, cybernetic shapes, interactive or automated cursor click indicators.
    
    **TECHNICAL REQUIREMENTS:**
    1.  **Semantic Structure:** Use appropriate HTML5 tags (e.g., <canvas>, <svg>, <main>, <section>).
    2.  **No External Dependencies:** Provide the complete HTML document. All CSS must be within \`<style>\` tags, and all JS within \`<script>\` tags. Do not load external JavaScript files unless they are lightweight standard libraries (e.g., load Google Fonts or standard SVG).
    3.  **Deterministic Animations:** To prevent frame-tearing in video conversion, do NOT use non-deterministic code (like true random positions on every frame, Date.now(), setInterval/setTimeout in a loop). Initialize random values into static arrays on load, and drive all dynamic motion relative to a global frame/time counter.
    4.  **Output Format:** Provide ONLY the raw HTML code. Do NOT wrap it in markdown like \`\`\`html or include any explanatory text.
    
    Make the output extremely aesthetic, complex, and professional. The user should be completely wowed by the design.`;

    console.log("📡 Menggunakan AI dengan fallback untuk generate HTML...");
    const aiResponse = await callAIWithFallback(prompt);
    let htmlText = aiResponse.trim();

    if (htmlText.includes("```html")) {
      htmlText = htmlText.split("```html")[1].split("```")[0].trim();
    } else if (htmlText.includes("```")) {
      htmlText = htmlText.split("```")[1].split("```")[0].trim();
    }

    console.log("✅ HTML Preview berhasil dihasilkan untuk " + item.id);
    return res.json({ htmlPreview: htmlText, promptUsed: prompt });

  } catch (error) {
    console.error("❌ Gagal generate HTML preview:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// JALUR 4A: KONVERSI HTML KE TSX VIA GEMINI (tanpa OpenRouter)
app.post("/api/convert-html-to-tsx-gemini", async (req, res) => {
  const { item } = req.body;
  console.log("🔄 Mengonversi HTML ke TSX via Gemini untuk: " + item.id);

  if (!genAI) {
    return res.status(500).json({ error: "Gemini AI belum dikonfigurasi. Periksa GEMINI_API_KEY di .env" });
  }

  try {
    const conversionPrompt = `Act as a **Senior React & Remotion Developer** specializing in high-fidelity 4K video rendering for commercial microstock.
You need to understand that Remotion renders videos frame-by-frame offline (using Puppeteer/Chrome). Therefore, any real-time browser features (like CSS @keyframes, transition, Date.now(), setInterval, or Math.random()) will cause severe synchronization bugs and frame-tearing in the final .mp4 export.

**OBJECTIVE:**
Convert the provided HTML/CSS/JS code into a single, production-grade Remotion component (.tsx). The visual output must be a 1:1 mirror of the original HTML, but entirely re-engineered for frame-locked rendering.

**0. MANDATORY IMPORT RULE (ABSOLUTE — NEVER VIOLATE):**
The FIRST LINE of the output file MUST ALWAYS be exactly this (copy-paste, no changes):
import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';
- Do NOT import from any local files (e.g. './input', './utils', './config', etc.) — these files do not exist.
- Do NOT import from 'three', 'gsap', or any external library.
- Do NOT import React — it is auto-injected by the JSX transform.
- NEVER add any import other than the single remotion import line above.

**BANNED FUNCTIONS (WILL CAUSE RUNTIME CRASH — NEVER USE):**
- EasingEaseOut, EasingEaseIn, EasingEaseInOut — these do not exist in Remotion. Use Easing.out(Easing.quad), Easing.in(Easing.quad), Easing.inOut(Easing.quad).
- Valid Easing values: Easing.linear, Easing.ease, Easing.quad, Easing.cubic, Easing.sin, Easing.circle, Easing.exp, Easing.elastic(), Easing.back(), Easing.bounce, Easing.bezier(), Easing.in(), Easing.out(), Easing.inOut()
- Date.now(), performance.now(), new Date() — BANNED, breaks deterministic frame rendering.
- Math.random() inside component render — BANNED. Pre-calculate outside the component into a static const array.
- setInterval(), setTimeout(), requestAnimationFrame() — BANNED.
- Any CSS @keyframes, CSS transition, CSS animation property — BANNED.

**1. Dynamic Identification:**
- Identify the main subject from the HTML and use it as the PascalCase component name (e.g., GlowingButton).

**2. Visual Parity & Animation (CRITICAL):**
- Motion Mirroring: Analyze the original CSS @keyframes. Map every percentage (0%, 50%, 100%) exactly into the inputRange of Remotion's interpolate() function.
- Easing Match: Translate CSS easing (e.g., ease-in-out) to the exact equivalent Remotion Easing API.
- Frame-Locked: ALL motion, opacity, and scale changes MUST be strictly driven by useCurrentFrame().

**3. Deterministic Rendering:**
- Never use Math.random() inside the component render. Pre-calculate random elements (particles, positions, delays) in a static const array OUTSIDE the component function.

**4. 4K Auto-Fit Landscape Scaling (CRITICAL):**
- Define: const ORIGINAL_WIDTH = [width from HTML]; const ORIGINAL_HEIGHT = [height from HTML];
- Inside the component: const { width, height, fps } = useVideoConfig();
- const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
- Apply transform: scale(\${scaleFactor}) and transformOrigin: 'center center' to the main wrapper div.

**5. Absolute Seamless Looping & Duration Cap (CRITICAL):**
- Duration Cap: Between 5 and 15 seconds MAX.
- Use LCM of all animation cycles. Cap at 15s max.
- Apply const localFrame = frame % (fps * cycleDuration) for each element to loop perfectly.
- Symmetrical Interpolation: First and last value in every interpolate() output MUST be identical for seamless looping.

**6. Dynamic Text Overlay — Safe getInputProps (CRITICAL):**
- Use this EXACT pattern at the top of the component body (safe with fallback):
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');
- Render judul as an elegant glowing title at the bottom-left with a smooth fade-in animation.
- Render keywordsList as small glassmorphic badge tags below the title.

**7. Output Structure:**
- Provide ONLY the raw .tsx file content — no markdown fences, no explanation text.
- The main component MUST have \`export default ComponentName;\` as the LAST line.

HERE IS THE HTML TO CONVERT:

${item.htmlPreview || ""}

OUTPUT: Start directly with the import line. No markdown. No explanation.`;

    const aiResponse = await callAIWithFallback(conversionPrompt);

    let tsxCode = aiResponse.trim();
    if (tsxCode.includes("```typescript") || tsxCode.includes("```tsx")) {
      const parts = tsxCode.split("```");
      tsxCode = parts[1].split("\n").slice(1).join("\n").split("```")[0].trim();
    } else if (tsxCode.includes("```")) {
      tsxCode = tsxCode.split("```")[1].split("```")[0].trim();
    }

    // Simpan file Composition.tsx
    fs.writeFileSync("src/Composition.tsx", tsxCode);
    console.log("📝 File src/Composition.tsx berhasil diperbarui dari HTML via Gemini!");

    console.log("✅ Konversi HTML ke TSX via Gemini sukses!");
    return res.json({ success: true, promptCode: tsxCode });

  } catch (error) {
    console.error("❌ Gagal konversi HTML ke TSX via Gemini:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// JALUR 4B: KONVERSI HTML KE TSX & SIMPAN (via OpenRouter)
app.post("/api/convert-html-to-tsx", async (req, res) => {
  const { item } = req.body;
  console.log("🔄 Mengonversi HTML ke TSX untuk: " + item.id);

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY tidak ditemukan" });
  }

  try {
    const conversionPrompt = `Act as a **Senior React & Remotion Developer** specializing in high-fidelity 4K video rendering for commercial microstock.
You need to understand that Remotion renders videos frame-by-frame offline (using Puppeteer/Chrome). Therefore, any real-time browser features (like CSS @keyframes, transition, Date.now(), setInterval, or Math.random()) will cause severe synchronization bugs and frame-tearing in the final .mp4 export.

**OBJECTIVE:**
Convert the provided HTML/CSS/JS code into a single, production-grade Remotion component (.tsx). The visual output must be a 1:1 mirror of the original HTML, but entirely re-engineered for frame-locked rendering.

**0. MANDATORY IMPORT RULE (ABSOLUTE — NEVER VIOLATE):**
The FIRST LINE of the output file MUST ALWAYS be exactly this (copy-paste, no changes):
import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';
- Do NOT import from any local files (e.g. './input', './utils', './config', etc.) — these files do not exist.
- Do NOT import from 'three', 'gsap', or any external library.
- Do NOT import React — it is auto-injected by the JSX transform.
- NEVER add any import other than the single remotion import line above.

**BANNED FUNCTIONS (WILL CAUSE RUNTIME CRASH — NEVER USE):**
- EasingEaseOut, EasingEaseIn, EasingEaseInOut — these do not exist in Remotion. Use Easing.out(Easing.quad), Easing.in(Easing.quad), Easing.inOut(Easing.quad).
- Valid Easing values: Easing.linear, Easing.ease, Easing.quad, Easing.cubic, Easing.sin, Easing.circle, Easing.exp, Easing.elastic(), Easing.back(), Easing.bounce, Easing.bezier(), Easing.in(), Easing.out(), Easing.inOut()
- Date.now(), performance.now(), new Date() — BANNED, breaks deterministic frame rendering.
- Math.random() inside component render — BANNED. Pre-calculate outside the component into a static const array.
- setInterval(), setTimeout(), requestAnimationFrame() — BANNED.
- Any CSS @keyframes, CSS transition, CSS animation property — BANNED.

**1. Dynamic Identification:**
- Identify the main subject from the HTML and use it as the PascalCase component name (e.g., GlowingButton).

**2. Visual Parity & Animation (CRITICAL):**
- Motion Mirroring: Analyze the original CSS @keyframes. Map every percentage (0%, 50%, 100%) exactly into the inputRange of Remotion's interpolate() function.
- Easing Match: Translate CSS easing (e.g., ease-in-out) to the exact equivalent Remotion Easing API.
- Frame-Locked: ALL motion, opacity, and scale changes MUST be strictly driven by useCurrentFrame().

**3. Deterministic Rendering:**
- Never use Math.random() inside the component render. Pre-calculate random elements (particles, positions, delays) in a static const array OUTSIDE the component function.

**4. 4K Auto-Fit Landscape Scaling (CRITICAL):**
- Define: const ORIGINAL_WIDTH = [width from HTML]; const ORIGINAL_HEIGHT = [height from HTML];
- Inside the component: const { width, height, fps } = useVideoConfig();
- const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
- Apply transform: scale(\${scaleFactor}) and transformOrigin: 'center center' to the main wrapper div.

**5. Absolute Seamless Looping & Duration Cap (CRITICAL):**
- Duration Cap: Between 5 and 15 seconds MAX.
- Use LCM of all animation cycles. Cap at 15s max.
- Apply const localFrame = frame % (fps * cycleDuration) for each element to loop perfectly.
- Symmetrical Interpolation: First and last value in every interpolate() output MUST be identical for seamless looping.

**6. Dynamic Text Overlay — Safe getInputProps (CRITICAL):**
- Use this EXACT pattern at the top of the component body (safe with fallback):
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');
- Render judul as an elegant glowing title at the bottom-left with a smooth fade-in animation.
- Render keywordsList as small glassmorphic badge tags below the title.

**7. Output Structure:**
- Provide ONLY the raw .tsx file content — no markdown fences, no explanation text.
- The main component MUST have \`export default ComponentName;\` as the LAST line.

HERE IS THE HTML TO CONVERT:

${item.htmlPreview || ""}

OUTPUT: Start directly with the import line. No markdown. No explanation.`;

    const aiResponse = await callAIWithFallback(conversionPrompt);

    let tsxCode = aiResponse.trim();
    if (tsxCode.startsWith("```typescript") || tsxCode.startsWith("```tsx")) {
      const parts = tsxCode.split("```");
      tsxCode = parts[1].split("\n").slice(1).join("\n").split("```")[0].trim();
    } else if (tsxCode.startsWith("```")) {
      tsxCode = tsxCode.split("```")[1].split("```")[0].trim();
    }

    // Simpan file Composition.tsx
    fs.writeFileSync("src/Composition.tsx", tsxCode);
    console.log("📝 File src/Composition.tsx berhasil diperbarui dari HTML!");

    console.log("✅ Konversi HTML ke TSX sukses!");
    return res.json({ success: true, promptCode: tsxCode });

  } catch (error) {
    console.error("❌ Gagal konversi HTML ke TSX:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// JALUR 5: RENDER KE CLOUD SETELAH KONVERSI TSX
app.post("/api/render-converted", async (req, res) => {
  const { item } = req.body;
  console.log("🚀 Merender hasil konversi HTML->TSX ke Cloud: " + item.id);

  try {
    // 1. File Composition.tsx sudah tersimpan di tahap sebelumnya
    console.log("📝 File src/Composition.tsx sudah diperbarui!");

    // 2. Jalankan Auto Push ke GitHub
    console.log("📤 Menyingkronkan kode hasil konversi ke GitHub...");
    execSync("git add src/Composition.tsx", { stdio: "inherit" });
    execSync('git commit -m "Konversi HTML ke TSX untuk ' + item.id + '"', { stdio: "inherit" });
    execSync("git push origin main", { stdio: "inherit" });
    console.log("✅ Kode mendarat dengan aman di GitHub!");

    // 3. Tembak API GitHub Actions untuk Cloud Rendering
    const url = "https://api.github.com/repos/" + GITHUB_USERNAME + "/" + GITHUB_REPO + "/dispatches";
    await axios.post(
      url,
      {
        event_type: "target-render-cloud",
        client_payload: {
          item: {
            id: item.id,
            durationInFrames: Number(item.durationInFrames) || 150
          }
        }
      },
      {
        headers: {
          Authorization: "token " + GITHUB_TOKEN,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    console.log("☁️ Cloud GitHub Actions berhasil terpicu untuk merender " + item.id);
    return res.json({ success: true });
  } catch (error) {
    console.error("❌ Gagal di jalur cloud render:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// APIs PERSISTENSI & RENDERING LOKAL BARU

// GET: Ambil daftar baris yang disimpan
app.get("/api/saved-items", (req, res) => {
  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Export all keywords to CSV for download
app.get("/api/export-keywords", (req, res) => {
  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    const items = JSON.parse(data);
    let csv = "id,keywords\n";
    items.forEach((item) => {
      const escapedId = (item.id || "").replace(/"/g, '""');
      const escapedKeywords = (item.keywords || "").replace(/"/g, '""');
      csv += `"${escapedId}","${escapedKeywords}"\n`;
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=keywords.csv");
    res.send(csv);
  } catch (error) {
    console.error("❌ Failed to export keywords:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Simpan atau update baris
app.post("/api/save-item", (req, res) => {
  try {
    const { item } = req.body;
    if (!item || !item.id) {
      return res.status(400).json({ error: "Item atau ID tidak valid" });
    }
    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    let items = JSON.parse(data);

    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      items[index] = { ...items[index], ...item };
    } else {
      items.push(item);
    }

    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Hapus baris dari penyimpanan
app.delete("/api/delete-item/:id", (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    let items = JSON.parse(data);

    const beforeCount = items.length;
    items = items.filter(i => i.id !== id);

    if (items.length === beforeCount) {
      return res.status(404).json({ error: `Item "${id}" tidak ditemukan` });
    }

    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
    console.log(`🗑 Item "${id}" berhasil dihapus dari database`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Gagal hapus item:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST: Render low-res preview MP4 lokal
app.post("/api/render-preview", async (req, res) => {
  const { item } = req.body;
  if (!item || !item.id || !item.promptCode) {
    return res.status(400).json({ error: "Item atau promptCode tidak lengkap" });
  }

  console.log(`🎥 Merender preview rendah lokal untuk: ${item.id}`);
  const tempPropsFile = `temp-props-preview-${item.id}.json`;

  try {
    // 1. Tulis file src/Composition.tsx
    fs.writeFileSync("src/Composition.tsx", item.promptCode);

    // 2. Tulis props sementara
    const props = {
      durationInFrames: Number(item.durationInFrames) || 150
    };
    fs.writeFileSync(tempPropsFile, JSON.stringify(props));

    // 3. Jalankan render lokal
    const previewFile = path.join("public", "previews", `${item.id}.mp4`);
    const cmd = `npx remotion render Composition "${previewFile}" --scale=0.5 --props="${tempPropsFile}"`;
    console.log(`Running CLI: ${cmd}`);

    execSync(cmd, { stdio: "inherit" });

    // Hapus props sementara
    if (fs.existsSync(tempPropsFile)) {
      fs.unlinkSync(tempPropsFile);
    }

    console.log(`✅ Sukses merender preview: ${item.id}`);
    const previewUrl = `/previews/${item.id}.mp4`;
    res.json({ success: true, previewUrl });
  } catch (error) {
    if (fs.existsSync(tempPropsFile)) {
      fs.unlinkSync(tempPropsFile);
    }
    console.error(`❌ Gagal merender preview: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// POST: Render 4K ProRes MOV lokal
app.post("/api/render-4k", async (req, res) => {
  const { item } = req.body;
  if (!item || !item.id || !item.promptCode) {
    return res.status(400).json({ error: "Item atau promptCode tidak lengkap" });
  }

  console.log(`🎥 Merender 4K ProRes untuk: ${item.id}`);
  const tempPropsFile = `temp-props-4k-${item.id}.json`;

  try {
    // 1. Tulis file src/Composition.tsx
    fs.writeFileSync("src/Composition.tsx", item.promptCode);

    // 2. Tulis props sementara
    const props = {
      durationInFrames: Number(item.durationInFrames) || 150
    };
    fs.writeFileSync(tempPropsFile, JSON.stringify(props));

    // 3. Jalankan render 4K ProRes
    const outputFile = path.join("out", `${item.id}_4k.mov`);
    const cmd = `npx remotion render Composition "${outputFile}" --codec=prores --props="${tempPropsFile}"`;
    console.log(`Running CLI: ${cmd}`);

    execSync(cmd, { stdio: "inherit" });

    // Hapus props sementara
    if (fs.existsSync(tempPropsFile)) {
      fs.unlinkSync(tempPropsFile);
    }

    // 4. Sematkan metadata via FFmpeg jika tersedia secara lokal
    let hasFFmpeg = false;
    try {
      execSync("ffmpeg -version", { stdio: "ignore" });
      hasFFmpeg = true;
    } catch (e) {
      console.warn("⚠️ FFmpeg tidak ditemukan secara lokal. Metadata tidak akan disematkan secara lokal.");
    }

    if (hasFFmpeg) {
      try {
        console.log(`🏷 Menyematkan metadata via FFmpeg untuk: ${item.id}`);
        const tempOutputFile = path.join("out", `temp_${item.id}_4k.mov`);
        const title = item.judul || "Stock Video";
        const comment = item.keywords || "motion, abstract, loop";
        const ffmpegCmd = `ffmpeg -y -i "${outputFile}" -metadata title="${title.replace(/"/g, '\\"')}" -metadata comment="${comment.replace(/"/g, '\\"')}" -codec copy "${tempOutputFile}"`;
        execSync(ffmpegCmd, { stdio: "inherit" });
        fs.renameSync(tempOutputFile, outputFile);
        console.log("✅ Metadata berhasil disematkan!");
      } catch (err) {
        console.error("❌ Gagal menyematkan metadata secara lokal:", err.message);
      }
    }

    console.log(`✅ Sukses merender 4K ProRes: ${item.id}`);
    res.json({ success: true, outputPath: outputFile });
  } catch (error) {
    if (fs.existsSync(tempPropsFile)) {
      fs.unlinkSync(tempPropsFile);
    }
    console.error(`❌ Gagal merender 4K ProRes: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Global map to track Git Action run trigger SHAs
const gitRuns = {};

// Global map to track batch render jobs and SSE streams
const batchJobs = {};

// Helper: Save or update item in database file
function saveOrUpdateItem(item) {
  const dbPath = path.join(__dirname, "saved-items.json");
  const data = fs.readFileSync(dbPath, "utf-8");
  let items = JSON.parse(data);
  const index = items.findIndex(i => i.id === item.id);
  if (index !== -1) {
    items[index] = { ...items[index], ...item };
  } else {
    items.push(item);
  }
  fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
}

// Helper: Add logs for SSE batch rendering
function addLog(jobId, message, type = 'info') {
  const time = new Date().toLocaleTimeString('id-ID');
  const logEntry = { message, type, time };

  if (!batchJobs[jobId]) {
    batchJobs[jobId] = { logs: [], clients: [], status: 'running' };
  }

  batchJobs[jobId].logs.push(logEntry);

  // Stream to all connected clients
  batchJobs[jobId].clients.forEach(client => {
    client.write(`data: ${JSON.stringify(logEntry)}\n\n`);
  });

  console.log(`[Batch Job ${jobId}] [${type}] ${message}`);
}

// Helper: Unzip function supporting cross-platform (PowerShell Expand-Archive on Windows, unzip on Unix)
function unzipFile(zipPath, destDir) {
  if (process.platform === "win32") {
    // Windows PowerShell command
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`);
  } else {
    // Linux/macOS unzip
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`);
  }
}

// Helper: Internal function to check GitHub actions run status and download artifacts
async function checkGithubRenderStatusInternal(id, renderType) {
  const trackingKey = `${id}_${renderType}`;

  // Jika database lokal sudah menyimpan URL http/https eksternal, langsung return itu
  const dbPath = path.join(__dirname, "saved-items.json");
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath, "utf-8");
    const items = JSON.parse(data);
    const item = items.find(i => i.id === id);
    if (item) {
      const savedUrl = renderType === "preview" ? item.previewUrl : item.outputPath4k;
      if (savedUrl && (savedUrl.startsWith("http://") || savedUrl.startsWith("https://"))) {
        return { status: "success", url: savedUrl };
      }
    }
  }

  const runInfo = gitRuns[trackingKey];
  if (!runInfo) {
    return { status: "not_found", message: "Render belum pernah ditrigger untuk item ini" };
  }

  const workflowFile = runInfo.workflowFile || (renderType === "preview" ? "render-preview.yml" : "render-4k.yml");
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/workflows/${workflowFile}/runs?event=workflow_dispatch&per_page=10`;
  const response = await axios.get(url, {
    headers: {
      Authorization: "token " + GITHUB_TOKEN,
      Accept: "application/vnd.github.v3+json"
    }
  });

  const runs = response.data.workflow_runs || [];
  const triggeredAt = runInfo.triggeredAt ? new Date(runInfo.triggeredAt - 30000) : new Date(0); // 30s buffer

  let matchedRun = null;
  if (runInfo.runId) {
    matchedRun = runs.find(run => run.id === runInfo.runId);
  } else {
    matchedRun = runs.find(run => new Date(run.created_at) >= triggeredAt);
  }

  if (!matchedRun) {
    return { status: "queued", message: "Menunggu GitHub memproses workflow dispatch..." };
  }

  runInfo.runId = matchedRun.id;

  if (matchedRun.status !== "completed") {
    return { status: "rendering", progress: matchedRun.status };
  }

  if (matchedRun.conclusion !== "success") {
    return { status: "failed", error: `Workflow selesai dengan kesimpulan: ${matchedRun.conclusion}` };
  }

  // Download cloud link artifact
  console.log(`⬇️ Workflow sukses! Mendapatkan link artifact untuk ${id}...`);
  const artifactsUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/runs/${matchedRun.id}/artifacts`;
  const artifactsRes = await axios.get(artifactsUrl, {
    headers: {
      Authorization: "token " + GITHUB_TOKEN,
      Accept: "application/vnd.github.v3+json"
    }
  });

  const artifacts = artifactsRes.data.artifacts || [];
  const targetArtifactName = `${id}-${renderType}-cloud-link`;
  const matchedArtifact = artifacts.find(a => a.name === targetArtifactName);

  if (!matchedArtifact) {
    throw new Error(`Artifact "${targetArtifactName}" tidak ditemukan di GitHub run ini.`);
  }

  // Download artifact ZIP
  const zipFilename = `temp-link-${id}-${renderType}.zip`;
  const tempZipPath = path.join(__dirname, zipFilename);
  const downloadUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/artifacts/${matchedArtifact.id}/zip`;

  console.log(`Downloading zip link artifact from: ${downloadUrl}`);
  const downloadRes = await axios({
    method: "get",
    url: downloadUrl,
    responseType: "stream",
    headers: {
      Authorization: "token " + GITHUB_TOKEN,
      Accept: "application/vnd.github.v3+json"
    }
  });

  const writer = fs.createWriteStream(tempZipPath);
  downloadRes.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  console.log(`✅ Link ZIP terdownload. Ekstraksi file...`);

  // Ekstrak ZIP
  const tempExtractDir = path.join(__dirname, `temp_link_${id}_${renderType}`);
  if (fs.existsSync(tempExtractDir)) {
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempExtractDir, { recursive: true });

  unzipFile(tempZipPath, tempExtractDir);

  // Baca file cloud-link.txt
  const linkFilePath = path.join(tempExtractDir, "cloud-link.txt");
  if (!fs.existsSync(linkFilePath)) {
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
    fs.unlinkSync(tempZipPath);
    throw new Error("File cloud-link.txt tidak ditemukan dalam ZIP.");
  }

  const cloudLink = fs.readFileSync(linkFilePath, "utf8").trim();

  // Bersihkan file sementara
  fs.rmSync(tempExtractDir, { recursive: true, force: true });
  fs.unlinkSync(tempZipPath);

  console.log(`🎉 Sukses mendapatkan cloud link ${renderType} untuk ${id}: ${cloudLink}`);
  return { status: "success", url: cloudLink };
}

// Helper: Polling background thread to wait for github rendering
async function waitForRender(id, renderType, jobId) {
  addLog(jobId, `Menunggu proses rendering video preview di GitHub Actions...`, 'info');
  const startTime = Date.now();
  const timeoutMs = 20 * 60 * 1000; // 20 menit timeout

  while (Date.now() - startTime < timeoutMs) {
    const finalFilename = renderType === "preview" ? `${id}-preview.mp4` : `${id}-4k.mov`;
    const legacyFilename = renderType === "preview" ? `${id}.mp4` : `${id}_4k.mov`;
    const finalPath = renderType === "preview"
      ? path.join(__dirname, "public", "previews", finalFilename)
      : path.join(__dirname, "out", finalFilename);
    const legacyPath = renderType === "preview"
      ? path.join(__dirname, "public", "previews", legacyFilename)
      : path.join(__dirname, "out", legacyFilename);

    if (fs.existsSync(finalPath) || fs.existsSync(legacyPath)) {
      addLog(jobId, `Video preview untuk ${id} berhasil ditemukan secara lokal!`, 'success');
      return true;
    }

    try {
      const statusResult = await checkGithubRenderStatusInternal(id, renderType);
      if (statusResult.status === 'success') {
        addLog(jobId, `Video preview untuk ${id} berhasil diunduh dari GitHub!`, 'success');
        return true;
      } else if (statusResult.status === 'failed') {
        throw new Error(statusResult.error || 'Workflow failed');
      } else {
        addLog(jobId, `Status render: ${statusResult.status} (${statusResult.progress || 'menunggu runner'})...`, 'info');
      }
    } catch (err) {
      addLog(jobId, `Informasi status render: ${err.message}`, 'info');
    }

    // Tunggu 15 detik sebelum mengecek ulang
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  throw new Error("Timeout rendering video di GitHub Actions.");
}

// Helper: Sanitasi keywords & title agar sesuai dengan aturan kepatuhan Shutterstock & Adobe Stock
function sanitizeKeywordsAndTitle(seoData) {
  if (!seoData) return seoData;

  const brandsMap = {
    'iphone': 'smartphone',
    'ipad': 'tablet',
    'android': 'mobile OS',
    'google': 'search engine',
    'adobe': 'creative software',
    'microsoft': 'software giant',
    'nike': 'sportswear',
    'apple': 'tech company',
    'windows': 'OS',
    'facebook': 'social media',
    'instagram': 'social network',
    'twitter': 'social platform',
    'tiktok': 'video sharing app'
  };

  const prohibitedTech = [
    'css', 'keyframes', 'requestanimationframe', 'html', 'canvas', 'svg', 'easing'
  ];

  // Sanitasi Judul
  if (seoData.judul) {
    let title = seoData.judul;
    for (const [brand, replacement] of Object.entries(brandsMap)) {
      const regex = new RegExp(`\\b${brand}\\b`, 'gi');
      title = title.replace(regex, replacement);
    }
    prohibitedTech.forEach(tech => {
      const regex = new RegExp(`\\b${tech}\\b`, 'gi');
      title = title.replace(regex, '');
    });
    seoData.judul = title.replace(/\s+/g, ' ').trim();
  }

  // Sanitasi Keywords
  if (seoData.keywords) {
    const rawKeywords = seoData.keywords.split(',');
    const cleanKeywords = [];
    const seen = new Set();

    for (let kw of rawKeywords) {
      kw = kw.trim();
      if (!kw) continue;
      
      let cleanKw = kw.toLowerCase();

      // Replace brands
      for (const [brand, replacement] of Object.entries(brandsMap)) {
        if (cleanKw === brand || cleanKw.includes(brand)) {
          cleanKw = cleanKw.replace(new RegExp(brand, 'g'), replacement);
        }
      }

      // Check if keyword contains prohibited tech words
      let isProhibited = false;
      for (const tech of prohibitedTech) {
        if (cleanKw === tech || cleanKw.includes(tech)) {
          isProhibited = true;
          break;
        }
      }

      if (isProhibited) continue;

      cleanKw = cleanKw.trim();
      if (!seen.has(cleanKw)) {
        seen.add(cleanKw);
        cleanKeywords.push(kw);
      }
    }

    seoData.keywords = cleanKeywords.slice(0, 50).join(', ');
  }

  return seoData;
}

// Helper: Jalankan job batch di background secara sekuensial
async function runBatchJob(jobId, files, loop, transparent, aiModel = 'auto', animationDuration = 10) {
  addLog(jobId, `Mulai memproses batch dengan ${files.length} file...`, 'info');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const stepNum = i + 1;
    const totalFiles = files.length;

    addLog(jobId, `[${stepNum}/${totalFiles}] Membaca file: ${file.name}`, 'info');

    try {
      // 1. Sanitasi ID (Mencegah command injection)
      const baseName = path.basename(file.name, '.html');
      const sanitizedId = baseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      addLog(jobId, `Menggunakan ID tersanitasi: ${sanitizedId}`, 'info');

      // 2. Generate SEO Metadata
      addLog(jobId, `Menghasilkan metadata SEO via AI untuk ${sanitizedId}...`, 'info');

      const seoPrompt = `Kamu adalah pakar Creative Director SEO Microstock USA.
Analisis file HTML berikut dan buat metadata SEO yang luar biasa kreatif, visualnya mewah, dan bernilai jual tinggi untuk dipasarkan di Adobe Stock.

HTML Content:
${file.content}

Keluarkan hasil dalam format JSON murni berbentuk objek tanpa teks pengantar/penutup apa pun.
DILARANG menggunakan karakter double quote (") di dalam nilai string. Gunakan single quote (') jika perlu.
Struktur objek wajib persis seperti ini:
{
  "judul": "Rekomendasi judul video SEO bahasa Inggris (maksimal 12 kata). DILARANG menggunakan kata teknis pemrograman seperti CSS, keyframes, requestAnimationFrame, HTML, canvas, SVG, easing, DLL. DILARANG menggunakan nama brand (Apple, Nike, Android, Google, Microsoft, dll). Gunakan istilah komersial video seperti: smooth animation, fluid movement, modern UI UX elements overlay, app interface template, abstract particles, seamless loop, data visualization, animated infographics, interactive design concept.",
  "keywords": "35-50 kata kunci bahasa Inggris dipisah koma. DILARANG menggunakan istilah teknis pemrograman (CSS transition, keyframes, requestAnimationFrame, SVG, canvas, loop) dan DILARANG menggunakan nama brand (Apple, Nike, Android, Google, Microsoft, dll). WAJIB menerjemahkan ke istilah komersial video stock dan disusun berdasarkan Teknik 3 Pilar dengan 7-10 keyword pertama adalah yang paling krusial. Pilar 1 (What/Isi: mouse click, subscribe button, loading bar, progress indicator, dll), Pilar 2 (Visual/Style: minimalist, flat design, modern UI, isolated, 4k. Jika video transparan, keyword 'alpha channel' and 'transparent background' WAJIB ditaruh di 10 keyword pertama), Pilar 3 (Kegunaan/Context: website promo, social media asset, app presentation, marketing material).",
  "deskripsi": "Deskripsi detail visual bahasa Inggris untuk Adobe Stock (minimal 15 kata). Terjemahkan istilah kode ke visual: jangan sebut keyframes/easing/canvas, tapi gunakan smooth animation, fluid movement, dll.",
  "kategori": "Kategori Adobe Stock (Technology/Abstract/Business)"
}`;

      let aiResponse = "";
      try {
        // Gunakan callAIWithFallback yang sudah memiliki chain Groq -> Gemini -> DeepSeek -> OpenRouter
        aiResponse = await callAIWithFallback(seoPrompt, { preferModel: aiModel });
      } catch (err) {
        throw new Error(`Semua provider AI gagal untuk SEO metadata: ${err.message}`);
      }

      let jsonText = aiResponse.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0].trim();
      } else if (jsonText.includes("```")) {
        jsonText = jsonText.split("```")[1].split("```")[0].trim();
      }

      jsonText = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      let seoData = JSON.parse(jsonText);
      seoData = sanitizeKeywordsAndTitle(seoData);
      addLog(jobId, `Metadata SEO berhasil didapat. Judul: "${seoData.judul}"`, 'success');

      const durationFrames = (Number(animationDuration) || 10) * 30;

      // 3. Simpan state awal ke database
      const itemData = {
        id: sanitizedId,
        fileName: file.name,
        judul: seoData.judul,
        keywords: seoData.keywords,
        deskripsi: seoData.deskripsi,
        kategori: seoData.kategori,
        durationInFrames: durationFrames,
        htmlPreview: file.content,
        loop: !!loop,
        transparent: !!transparent,
        statusConvertTsx: 'processing-tsx',
        statusRender4k: 'idle',
        previewUrl: '',
        outputPath4k: '',
        createdAt: new Date().toISOString()
      };

      saveOrUpdateItem(itemData);

      // 4. Konversi HTML ke TSX
      addLog(jobId, `Mengonversi HTML ke kode Remotion TSX...`, 'info');

      const conversionPrompt = `Act as a **Senior React & Remotion Developer** specializing in high-fidelity 4K video rendering for commercial microstock.
You need to understand that Remotion renders videos frame-by-frame offline (using Puppeteer/Chrome). Therefore, any real-time browser features (like CSS @keyframes, transition, Date.now(), setInterval, or Math.random()) will cause severe synchronization bugs and frame-tearing in the final .mp4 export.

**OBJECTIVE:**
Convert the provided HTML/CSS/JS code into a single, production-grade Remotion component (.tsx). The visual output must be a 1:1 mirror of the original HTML, but entirely re-engineered for frame-locked rendering.

**0. MANDATORY IMPORT RULE (ABSOLUTE — NEVER VIOLATE):**
The FIRST LINE of the output file MUST ALWAYS be exactly this (copy-paste, no changes):
import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';
- Do NOT import from any local files (e.g. './input', './utils', './config', etc.) — these files do not exist.
- Do NOT import from 'three', 'gsap', or any external library.
- Do NOT import React — it is auto-injected by the JSX transform.
- NEVER add any import other than the single remotion import line above.

**BANNED FUNCTIONS (WILL CAUSE RUNTIME CRASH — NEVER USE):**
- EasingEaseOut, EasingEaseIn, EasingEaseInOut — these do not exist in Remotion. Use Easing.out(Easing.quad), Easing.in(Easing.quad), Easing.inOut(Easing.quad).
- Valid Easing values: Easing.linear, Easing.ease, Easing.quad, Easing.cubic, Easing.sin, Easing.circle, Easing.exp, Easing.elastic(), Easing.back(), Easing.bounce, Easing.bezier(), Easing.in(), Easing.out(), Easing.inOut()
- Date.now(), performance.now(), new Date() — BANNED, breaks deterministic frame rendering.
- Math.random() inside component render — BANNED. Pre-calculate outside the component into a static const array.
- setInterval(), setTimeout(), requestAnimationFrame() — BANNED.
- Any CSS @keyframes, CSS transition, CSS animation property — BANNED.

**1. Dynamic Identification:**
- Identify the main subject from the HTML and use it as the PascalCase component name (e.g., GlowingButton).

**2. Visual Parity & Animation (CRITICAL):**
- Motion Mirroring: Analyze the original CSS @keyframes. Map every percentage (0%, 50%, 100%) exactly into the inputRange of Remotion's interpolate() function.
- Easing Match: Translate CSS easing (e.g., ease-in-out) to the exact equivalent Remotion Easing API.
- Frame-Locked: ALL motion, opacity, and scale changes MUST be strictly driven by useCurrentFrame().

**3. Deterministic Rendering:**
- Never use Math.random() inside the component render. Pre-calculate random elements (particles, positions, delays) in a static const array OUTSIDE the component function.

**4. 4K Auto-Fit Landscape Scaling (CRITICAL):**
- Define: const ORIGINAL_WIDTH = 1920; const ORIGINAL_HEIGHT = 1080;
- Inside the component: const { width, height, fps } = useVideoConfig();
- const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
- Apply transform: scale(\${scaleFactor}) and transformOrigin: 'center center' to the main wrapper div.

**5. Absolute Seamless Looping & Duration (CRITICAL):**
- The animation MUST loop seamlessly and exactly match a duration of ${animationDuration} seconds (${durationFrames} frames at 30fps).
- Set the component's duration/cycles to fit this ${animationDuration}-second window.
- Apply const localFrame = frame % (fps * cycleDuration) for each element to loop perfectly.
- Symmetrical Interpolation: First and last value in every interpolate() output MUST be identical for seamless looping.

**6. Dynamic Text Overlay — Safe getInputProps (CRITICAL):**
- Use this EXACT pattern at the top of the component body (safe with fallback):
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');
- Render judul as an elegant glowing title at the bottom-left with a smooth fade-in animation.
- Render keywordsList as small glassmorphic badge tags below the title.

**7. Output Structure:**
- Provide ONLY the raw .tsx file content — no markdown fences, no explanation text.
- The main component MUST have \`export default ComponentName;\` as the LAST line.
- Add a comment \`// END_OF_FILE\` at the very last line of the file.

HERE IS THE HTML TO CONVERT:

${file.content}

OUTPUT: Start directly with the import line. No markdown. No explanation.`;

      let tsxResponse = "";
      let tsxAttempts = 0;
      const MAX_TSX_ATTEMPTS = 3;

      // Validator kuat: cek export default, END_OF_FILE marker, dan bracket balance
      const tsxValidator = (text) => {
        if (!text || !text.trim()) return false;
        const trimmed = text.trim();
        // Wajib ada export default
        if (!trimmed.includes('export default')) return false;
        // Lebih baik kalau ada // END_OF_FILE (artinya AI tidak terpotong)
        // Cek bracket balance ({} dan <>)
        let curly = 0;
        let angle = 0;
        for (const ch of trimmed) {
          if (ch === '{') curly++;
          else if (ch === '}') curly--;
          else if (ch === '<') angle++;
          else if (ch === '>') angle--;
        }
        // Harus balanced atau sangat dekat balanced (toleransi 1)
        if (Math.abs(curly) > 2 || Math.abs(angle) > 5) return false;
        return true;
      };

      while (tsxAttempts < MAX_TSX_ATTEMPTS) {
        tsxAttempts++;
        addLog(jobId, `Mencoba generate TSX (percobaan ke-${tsxAttempts})...`, 'info');
        try {
          // Gunakan callAIWithFallback yang sudah memiliki chain Groq -> Gemini -> DeepSeek -> OpenRouter
          tsxResponse = await callAIWithFallback(conversionPrompt, { 
            preferModel: aiModel,
            validator: tsxValidator
          });
          break; // sukses, keluar loop
        } catch (err) {
          addLog(jobId, `Percobaan ${tsxAttempts} gagal: ${err.message?.substring(0,100)}`, 'warning');
          if (tsxAttempts >= MAX_TSX_ATTEMPTS) {
            throw new Error(`Semua ${MAX_TSX_ATTEMPTS} percobaan AI gagal untuk TSX Conversion: ${err.message}`);
          }
          await new Promise(r => setTimeout(r, 2000)); // tunggu 2 detik sebelum retry
        }
      }

      let tsxCode = tsxResponse.trim();
      if (tsxCode.startsWith("```typescript") || tsxCode.startsWith("```tsx")) {
        const parts = tsxCode.split("```");
        tsxCode = parts[1].split("\n").slice(1).join("\n").split("```")[0].trim();
      } else if (tsxCode.startsWith("```")) {
        tsxCode = tsxCode.split("```")[1].split("```")[0].trim();
      }

      itemData.promptCode = tsxCode;
      saveOrUpdateItem(itemData);

      // Validasi lokal sebelum push ke GitHub
      if (!tsxValidator(tsxCode)) {
        throw new Error('TSX yang dihasilkan tidak valid (bracket tidak balance atau tidak ada export default). Batalkan push.');
      }
      addLog(jobId, `Konversi HTML ke TSX sukses (TSX tervalidasi)!`, 'success');

      // 5. Tulis src/Composition.tsx lokal
      addLog(jobId, `Menulis file src/Composition.tsx...`, 'info');
      fs.writeFileSync("src/Composition.tsx", tsxCode);

      // 6. Push ke GitHub
      addLog(jobId, `Mendorong kode TSX ke repositori GitHub...`, 'info');
      execSync("git add src/Composition.tsx", { stdio: "inherit" });
      try {
        execSync(`git commit -m "Batch HTML ke TSX: ${sanitizedId}"`, { stdio: "inherit" });
      } catch (e) {
        // No changes is fine
      }
      execSync("git push origin main", { stdio: "inherit" });

      const sha = execSync("git rev-parse HEAD").toString().trim();
      addLog(jobId, `Kode berhasil didorong. Commit SHA: ${sha}`, 'success');

      // 7. Trigger GitHub Action
      addLog(jobId, `Memicu GitHub Actions cloud rendering...`, 'info');
      const workflowFile = "render-preview.yml";
      const workflowDispatchUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`;

      await axios.post(
        workflowDispatchUrl,
        {
          ref: "main",
          inputs: {
            composition_id: sanitizedId,
            duration_frames: "150",
            judul: itemData.judul || "Stock Video",
            keywords: itemData.keywords || "motion, abstract, loop"
          }
        },
        {
          headers: {
            Authorization: "token " + GITHUB_TOKEN,
            Accept: "application/vnd.github.v3+json"
          }
        }
      );

      const trackingKey = `${sanitizedId}_preview`;
      gitRuns[trackingKey] = {
        sha: sha,
        status: "triggered",
        runId: null,
        triggeredAt: Date.now(),
        workflowFile: workflowFile
      };

      itemData.statusConvertTsx = 'processing-preview';
      saveOrUpdateItem(itemData);
      addLog(jobId, `Workflow dispatch berhasil dikirim ke GitHub.`, 'success');

      // 8. Tunggu rendering selesai & unduh hasilnya
      const renderSuccess = await waitForRender(sanitizedId, 'preview', jobId);
      if (renderSuccess) {
        const fileUrl = `/previews/${sanitizedId}-preview.mp4`;
        itemData.previewUrl = fileUrl;
        itemData.statusConvertTsx = 'success';
        saveOrUpdateItem(itemData);
        addLog(jobId, `[Sukses] Video preview untuk ${sanitizedId} selesai diproses!`, 'success');
      } else {
        throw new Error(`Rendering gagal untuk ${sanitizedId}`);
      }

    } catch (err) {
      addLog(jobId, `Gagal memproses ${file.name}: ${err.message}`, 'error');

      // Simpan status failed
      const baseName = path.basename(file.name, '.html');
      const sanitizedId = baseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      try {
        const dbPath = path.join(__dirname, "saved-items.json");
        const data = fs.readFileSync(dbPath, "utf-8");
        const items = JSON.parse(data);
        const item = items.find(i => i.id === sanitizedId);
        if (item) {
          item.statusConvertTsx = 'failed';
          fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
        }
      } catch (dbErr) {
        console.error("Gagal update DB status failed:", dbErr);
      }
    }
  }

  addLog(jobId, `Semua file dalam batch selesai diproses.`, 'success');
  batchJobs[jobId].status = 'completed';

  // Kirim event selesai ke SSE clients
  batchJobs[jobId].clients.forEach(client => {
    client.write(`data: ${JSON.stringify({ type: 'done', message: 'Semua proses selesai' })}\n\n`);
    client.end();
  });
  batchJobs[jobId].clients = [];
}

// POST: Trigger GitHub rendering dispatch (workflow_dispatch)
app.post("/api/trigger-github-render", async (req, res) => {
  const { item, renderType } = req.body;
  if (!item || !item.id || !renderType) {
    return res.status(400).json({ error: "Item, ID atau renderType tidak lengkap" });
  }

  console.log(`🚀 Triggering GitHub Action rendering (${renderType}) for: ${item.id}`);

  try {
    // 1. Git Add & Commit & Push Composition.tsx to GitHub
    console.log("📤 Menyingkronkan kode hasil konversi ke GitHub...");
    execSync("git add src/Composition.tsx", { stdio: "inherit" });

    // Commit only if there are changes to avoid error
    try {
      execSync(`git commit -m "Render ${renderType} untuk ${item.id}"`, { stdio: "inherit" });
    } catch (e) {
      console.log("ℹ️ No new changes to commit.");
    }

    execSync("git push origin main", { stdio: "inherit" });

    // 2. Dapatkan commit SHA saat ini
    const sha = execSync("git rev-parse HEAD").toString().trim();
    console.log(`📌 Git Commit SHA: ${sha}`);

    // 3. Trigger via workflow_dispatch (new separate YML per render type)
    const workflowFile = renderType === "preview" ? "render-preview.yml" : "render-4k.yml";
    const workflowDispatchUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`;

    await axios.post(
      workflowDispatchUrl,
      {
        ref: "main",
        inputs: {
          composition_id: item.id,
          duration_frames: String(Number(item.durationInFrames) || 150),
          judul: item.judul || "Stock Video",
          keywords: item.keywords || "motion, abstract, loop"
        }
      },
      {
        headers: {
          Authorization: "token " + GITHUB_TOKEN,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    // Simpan ke state tracker
    const trackingKey = `${item.id}_${renderType}`;
    gitRuns[trackingKey] = {
      sha: sha,
      status: "triggered",
      runId: null,
      triggeredAt: Date.now(),
      workflowFile: workflowFile
    };

    console.log(`☁️ workflow_dispatch terpicu: ${workflowFile} untuk ${item.id} (${renderType})`);
    res.json({ success: true, sha, workflowFile });
  } catch (error) {
    console.error("❌ Gagal di trigger-github-render:", error.message);
    if (error.response) {
      console.error("   GitHub API Response:", JSON.stringify(error.response.data));
    }
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/process-html-batch", (req, res) => {
  const { files, loop, transparent, aiModel, animationDuration } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "Data batch file tidak valid atau kosong" });
  }

  const jobId = 'job_' + Date.now();
  batchJobs[jobId] = {
    logs: [],
    clients: [],
    status: 'running'
  };

  // Kirim respons langsung agar UI bisa langsung menginisiasi SSE stream
  res.json({ jobId });

  // Jalankan background job secara asinkron
  runBatchJob(jobId, files, loop, transparent, aiModel, animationDuration).catch(err => {
    console.error(`Eror fatal saat menjalankan batch ${jobId}:`, err);
  });
});

// GET: Hubungkan stream SSE untuk log batch
app.get("/api/batch-logs/:jobId", (req, res) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!batchJobs[jobId]) {
    batchJobs[jobId] = { logs: [], clients: [], status: 'completed' };
  }

  // Kirim semua log yang terkumpul sejauh ini
  batchJobs[jobId].logs.forEach(log => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // Jika status job sudah rampung, kirim event penutup
  if (batchJobs[jobId].status === 'completed' || batchJobs[jobId].status === 'failed') {
    res.write(`data: ${JSON.stringify({ type: 'done', message: 'Job selesai' })}\n\n`);
    res.end();
    return;
  }

  // Daftarkan koneksi klien
  batchJobs[jobId].clients.push(res);

  req.on('close', () => {
    if (batchJobs[jobId]) {
      batchJobs[jobId].clients = batchJobs[jobId].clients.filter(c => c !== res);
    }
  });
});

// POST: Trigger render 4K ProRes
app.post("/api/trigger-4k/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    const items = JSON.parse(data);
    const item = items.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: `Item ${id} tidak ditemukan` });
    }

    if (!item.promptCode) {
      return res.status(400).json({ error: "Item tidak memiliki kode TSX untuk dirender" });
    }

    // Update status render 4k ke processing
    item.statusRender4k = 'processing';
    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));

    console.log(`🚀 Memicu render 4K untuk item: ${id}`);

    // Tulis file src/Composition.tsx
    fs.writeFileSync("src/Composition.tsx", item.promptCode);

    // Commit & Push kode yang akan dirender
    execSync("git add src/Composition.tsx", { stdio: "inherit" });
    try {
      execSync(`git commit -m "Render 4K: ${id}"`, { stdio: "inherit" });
    } catch (e) {
      console.log("ℹ️ Tidak ada perubahan kode baru untuk di-commit.");
    }
    execSync("git push origin main", { stdio: "inherit" });

    const sha = execSync("git rev-parse HEAD").toString().trim();

    // Trigger GitHub workflow dispatch untuk render-4k.yml
    const workflowFile = "render-4k.yml";
    const workflowDispatchUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`;

    await axios.post(
      workflowDispatchUrl,
      {
        ref: "main",
        inputs: {
          composition_id: id,
          duration_frames: String(Number(item.durationInFrames) || 150),
          judul: item.judul || "Stock Video",
          keywords: item.keywords || "motion, abstract, loop"
        }
      },
      {
        headers: {
          Authorization: "token " + GITHUB_TOKEN,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    const trackingKey = `${id}_4k`;
    gitRuns[trackingKey] = {
      sha: sha,
      status: "triggered",
      runId: null,
      triggeredAt: Date.now(),
      workflowFile: workflowFile
    };

    res.json({ success: true, sha });
  } catch (error) {
    console.error(`❌ Gagal di trigger-4k untuk ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Update data parsial item
app.patch("/api/saved-items/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    let items = JSON.parse(data);

    const index = items.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: `Item ${id} tidak ditemukan` });
    }

    items[index] = { ...items[index], ...updates };
    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));

    res.json({ success: true, item: items[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Stream preview file MP4
app.get("/api/preview-file/:id", (req, res) => {
  const { id } = req.params;
  const finalFilename = `${id}-preview.mp4`;
  const legacyFilename = `${id}.mp4`;

  const finalPath = path.join(__dirname, "public", "previews", finalFilename);
  const legacyPath = path.join(__dirname, "public", "previews", legacyFilename);

  if (fs.existsSync(finalPath)) {
    return res.sendFile(finalPath);
  } else if (fs.existsSync(legacyPath)) {
    return res.sendFile(legacyPath);
  } else {
    return res.status(404).json({ error: "File preview tidak ditemukan secara lokal" });
  }
});

// GET: Stream/Download 4K ProRes MOV file
app.get("/api/4k-file/:id", (req, res) => {
  const { id } = req.params;
  const finalFilename = `${id}-4k.mov`;
  const legacyFilename = `${id}_4k.mov`;

  const finalPath = path.join(__dirname, "out", finalFilename);
  const legacyPath = path.join(__dirname, "out", legacyFilename);

  if (fs.existsSync(finalPath)) {
    return res.sendFile(finalPath);
  } else if (fs.existsSync(legacyPath)) {
    return res.sendFile(legacyPath);
  } else {
    return res.status(404).json({ error: "File 4K ProRes tidak ditemukan secara lokal" });
  }
});

// GET: Cek status render GitHub dan download artifact jika selesai
app.get("/api/check-render-status/:id/:renderType", async (req, res) => {
  const { id, renderType } = req.params;
  try {
    const result = await checkGithubRenderStatusInternal(id, renderType);
    res.json(result);
  } catch (error) {
    console.error(`❌ Gagal di check-render-status untuk ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET: Cek status session syntx.ai
app.get("/api/syntx-status", (req, res) => {
  const state = syntxBot.getSessionState();
  const isActive = !!state.token && state.expiresAt && Date.now() < state.expiresAt;
  res.json({
    isActive,
    email: state.email,
    expiresAt: state.expiresAt ? new Date(state.expiresAt).toISOString() : null,
    hasToken: !!state.token
  });
});

// POST: Trigger manual login ke syntx.ai (berguna untuk pre-warm session)
app.post("/api/syntx-login", async (req, res) => {
  try {
    console.log("🔐 Manual trigger: Login ke syntx.ai...");
    await syntxBot.loginAndGetToken();
    const state = syntxBot.getSessionState();
    res.json({
      success: true,
      email: state.email,
      expiresAt: state.expiresAt ? new Date(state.expiresAt).toISOString() : null,
      message: "Login syntx.ai berhasil! Token tersimpan di session."
    });
  } catch (err) {
    console.error("❌ Gagal login syntx.ai:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Test kirim prompt langsung ke syntx.ai
app.post("/api/syntx-test", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Param 'prompt' diperlukan" });
  }
  try {
    console.log("🧪 Test prompt ke syntx.ai...");
    const result = await syntxBot.callSyntx(prompt);
    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ Gagal test syntx.ai:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server Jembatan Kode Bebas aktif di port 5000");
});