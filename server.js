require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { execSync } = require("child_process");
const { GoogleGenAI } = require("@google/genai");

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

// Inisialisasi Gemini AI
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  console.log("🤖 Gemini AI SDK berhasil diinisialisasi!");
} else {
  console.warn("⚠️ GEMINI_API_KEY tidak ditemukan, Gemini AI tidak akan tersedia.");
}

// Daftar model OpenRouter yang tersedia (fallback jika satu model error)
const OPENROUTER_MODELS = {
  // Google Models
  "gemini-2.0-flash": "google/gemini-2.0-flash-001",
  "gemini-2.0-flash-lite": "google/gemini-2.0-flash-lite-preview-02-05",
  "gemini-1.5-flash": "google/gemini-1.5-flash",
  "gemini-1.5-pro": "google/gemini-1.5-pro",
  "gemini-2.5-pro": "google/gemini-2.5-pro-exp-03-25",
  
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
  "default": "openai/gpt-4o-mini" // Model default yang paling stabil
};

// OpenRouter API Call Helper dengan auto-fallback model
async function callOpenRouter(prompt, modelKey = "default") {
  // Daftar model untuk fallback jika model utama gagal
  const fallbackModels = [
    modelKey,                                    // Model yang diminta
    "gpt-4o-mini",                               // Fallback 1: GPT-4o-mini (stabil)
    "gemini-2.0-flash",                          // Fallback 2: Gemini via OpenRouter
    "llama-3.3-70b",                             // Fallback 3: Llama
    "deepseek-v3",                               // Fallback 4: DeepSeek
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
    const aiResponse = await callOpenRouter(prompt);
    
    let jsonText = aiResponse.trim();
    if (jsonText.startsWith("`" + "`" + "`json")) {
      jsonText = jsonText.split("`" + "`" + "`json")[1].split("`" + "`" + "`")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    jsonText = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    const dataObjek = JSON.parse(jsonText);
    console.log("✅ Sukses memproses data riset dari OpenRouter!");
    return res.json(dataObjek);

  } catch (error) {
    console.error("❌ Detail Eror Koneksi AI:");
    console.error(error.message);
    return res.status(500).json({ error: "Koneksi ke OpenRouter terputus.", details: error.message });
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
    const aiResponse = await callGemini(prompt);
    
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

    const aiResponse = await callGemini(prompt);

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

    let htmlText = "";
    if (genAI) {
      console.log("📡 Menggunakan Gemini SDK langsung...");
      const aiResponse = await callGemini(prompt);
      htmlText = aiResponse.trim();
    } else {
      console.log("📡 Gemini SDK tidak aktif, menggunakan OpenRouter...");
      const aiResponse = await callOpenRouter(prompt);
      htmlText = aiResponse.trim();
    }

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

    const aiResponse = await callGemini(conversionPrompt);

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

    const aiResponse = await callOpenRouter(conversionPrompt);

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
    const { id } = req.params;
    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    let items = JSON.parse(data);
    
    items = items.filter(i => i.id !== id);
    
    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
    res.json({ success: true });
  } catch (error) {
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

// GET: Cek status render GitHub dan download artifact jika selesai
app.get("/api/check-render-status/:id/:renderType", async (req, res) => {
  const { id, renderType } = req.params;
  const trackingKey = `${id}_${renderType}`;
  
  // 1. Cek apakah file output sudah ada secara lokal
  // New naming: {id}-preview.mp4 / {id}-4k.mov (matches new YML artifact naming)
  const finalFilename = renderType === "preview" ? `${id}-preview.mp4` : `${id}-4k.mov`;
  const legacyFilename = renderType === "preview" ? `${id}.mp4` : `${id}_4k.mov`;
  const finalPath = renderType === "preview" 
    ? path.join(__dirname, "public", "previews", finalFilename)
    : path.join(__dirname, "out", finalFilename);
  // Also check legacy path for backward compatibility
  const legacyPath = renderType === "preview"
    ? path.join(__dirname, "public", "previews", legacyFilename)
    : path.join(__dirname, "out", legacyFilename);
    
  if (fs.existsSync(finalPath)) {
    const fileUrl = renderType === "preview" ? `/previews/${finalFilename}` : `/out/${finalFilename}`;
    return res.json({ status: "success", url: fileUrl, localPath: finalPath });
  }
  if (fs.existsSync(legacyPath)) {
    const fileUrl = renderType === "preview" ? `/previews/${legacyFilename}` : `/out/${legacyFilename}`;
    return res.json({ status: "success", url: fileUrl, localPath: legacyPath });
  }

  // 2. Ambil run info dari tracking map
  const runInfo = gitRuns[trackingKey];
  if (!runInfo) {
    return res.json({ status: "not_found", message: "Render belum pernah ditrigger untuk item ini" });
  }

  try {
    // 3. Query GitHub Actions runs — check workflow_dispatch runs from the correct workflow file
    const workflowFile = runInfo.workflowFile || (renderType === "preview" ? "render-preview.yml" : "render-4k.yml");
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/workflows/${workflowFile}/runs?event=workflow_dispatch&per_page=10`;
    const response = await axios.get(url, {
      headers: {
        Authorization: "token " + GITHUB_TOKEN,
        Accept: "application/vnd.github.v3+json"
      }
    });

    const runs = response.data.workflow_runs || [];

    // For workflow_dispatch: find the most recent run created AFTER we triggered it
    // (triggeredAt is stored in ms, GitHub's created_at is an ISO string)
    const triggeredAt = runInfo.triggeredAt ? new Date(runInfo.triggeredAt - 30000) : new Date(0); // 30s buffer
    
    let matchedRun = null;
    // If we already have a runId, use it directly
    if (runInfo.runId) {
      matchedRun = runs.find(run => run.id === runInfo.runId);
    } else {
      // Find the most recent run created after our trigger time
      matchedRun = runs.find(run => new Date(run.created_at) >= triggeredAt);
    }

    if (!matchedRun) {
      return res.json({ status: "queued", message: "Menunggu GitHub memproses workflow dispatch..." });
    }

    runInfo.runId = matchedRun.id;

    // 4. Jika statusnya belum selesai
    if (matchedRun.status !== "completed") {
      return res.json({ status: "rendering", progress: matchedRun.status });
    }

    // 5. Jika status selesai tapi gagal
    if (matchedRun.conclusion !== "success") {
      return res.json({ status: "failed", error: `Workflow selesai dengan kesimpulan: ${matchedRun.conclusion}` });
    }

    // 6. Jika sukses, download artifact
    console.log(`⬇️ Workflow sukses! Mendapatkan link artifact untuk ${id}...`);
    const artifactsUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/runs/${matchedRun.id}/artifacts`;
    const artifactsRes = await axios.get(artifactsUrl, {
      headers: {
        Authorization: "token " + GITHUB_TOKEN,
        Accept: "application/vnd.github.v3+json"
      }
    });

    const artifacts = artifactsRes.data.artifacts || [];
    const targetArtifactName = `${id}-${renderType}-video`;
    const matchedArtifact = artifacts.find(a => a.name === targetArtifactName);

    if (!matchedArtifact) {
      return res.status(404).json({ status: "failed", error: `Artifact "${targetArtifactName}" tidak ditemukan di GitHub run ini.` });
    }

    // Download artifact ZIP
    const zipFilename = `temp-artifact-${id}-${renderType}.zip`;
    const tempZipPath = path.join(__dirname, zipFilename);
    const downloadUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/artifacts/${matchedArtifact.id}/zip`;
    
    console.log(`Downloading zip artifact from: ${downloadUrl}`);
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

    console.log(`✅ Artifact ZIP terdownload. Ekstraksi file...`);

    // Ekstrak ZIP
    const tempExtractDir = path.join(__dirname, `temp_extracted_${id}_${renderType}`);
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempExtractDir, { recursive: true });

    unzipFile(tempZipPath, tempExtractDir);

    // Cari file video hasil render di dalam folder ekstraksi
    const files = fs.readdirSync(tempExtractDir);
    const videoFile = files.find(f => f.endsWith(".mp4") || f.endsWith(".mov"));

    if (!videoFile) {
      // Clean up
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
      fs.unlinkSync(tempZipPath);
      throw new Error("Tidak ada file video di dalam zip artifact.");
    }

    const sourceFilePath = path.join(tempExtractDir, videoFile);
    
    // Pindahkan ke folder tujuan yang sesuai
    fs.renameSync(sourceFilePath, finalPath);

    // Bersihkan file sementara
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
    fs.unlinkSync(tempZipPath);

    console.log(`🎉 Sukses mengunduh dan mengekstrak ${renderType} video untuk ${id}!`);
    const fileUrl = renderType === "preview" ? `/previews/${finalFilename}` : `/out/${finalFilename}`;
    res.json({ status: "success", url: fileUrl, localPath: finalPath });

  } catch (error) {
    console.error(`❌ Gagal di check-render-status:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log("Server Jembatan Kode Bebas aktif di port 5000");
});