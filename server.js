require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { execSync } = require("child_process");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const syntxBot = require('./syntx-bot');
const multer = require('multer');

const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the public directory with cache disabled
app.use(express.static(path.join(__dirname, "public"), {
  etag: false,
  maxAge: 0,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
}));

// Ensure necessary directories exist
fs.mkdirSync(path.join(__dirname, "public", "previews"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "public", "saved-code"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "public", "chat-uploads"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });

// Multer setup for image uploads
const chatUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'chat-uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `img_${Date.now()}${ext}`);
  }
});
const chatUpload = multer({
  storage: chatUploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// Initialize database file if not exists
const dbPath = path.join(__dirname, "saved-items.json");
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

function performStartupCleanup() {
  // Scan and fix stale states on startup
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    let items = JSON.parse(data);
    let changed = false;
    items.forEach(item => {
      if (item.statusConvertTsx === 'queued' || item.statusConvertTsx === 'processing-tsx' || item.statusConvertTsx === 'processing-preview') {
        item.statusConvertTsx = 'failed';
        item.lastLogMessage = 'Server terhenti tak terduga (di-restart).';
        if (!item.logs) item.logs = [];
        item.logs.push({ message: 'Server terhenti tak terduga (di-restart).', type: 'error', time: new Date().toLocaleTimeString('id-ID') });
        changed = true;
      }
      if (item.statusRender4k === 'queued' || item.statusRender4k === 'processing') {
        item.statusRender4k = 'queued';
        item.lastLogMessage = 'Server di-restart. Antrean render 4K dimasukkan kembali.';
        if (!item.logs) item.logs = [];
        item.logs.push({ message: 'Server di-restart. Antrean render 4K dimasukkan kembali.', type: 'info', time: new Date().toLocaleTimeString('id-ID') });
        render4kQueue.push(item.id);
        changed = true;
      }
    });
    if (changed) {
      fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
      console.log("🧹 Berhasil membersihkan status gantung dari sesi sebelumnya.");
    }
    if (render4kQueue.length > 0) {
      console.log(`🔌 Memulihkan ${render4kQueue.length} task render 4K ke dalam antrean.`);
      processRender4kQueue();
    }
  } catch (e) {
    console.error("Gagal melakukan startup database cleanup:", e);
  }
}

// Route for the dashboard (prevent caching)
app.get("/dashboard", (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Root redirect to dashboard
app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

let GITHUB_TOKEN = process.env.GITHUB_TOKEN;
let GITHUB_USERNAME = process.env.GITHUB_USERNAME;
let GITHUB_REPO = process.env.GITHUB_REPO;
let SYNTX_BASE_EMAIL = process.env.SYNTX_BASE_EMAIL || "";
let SYNTX_EMAIL_INDEX = process.env.SYNTX_EMAIL_INDEX || "0";
let NINEROUTER_API_KEY = process.env.NINEROUTER_API_KEY || "";
let NINEROUTER_BASE_URL = process.env.NINEROUTER_BASE_URL || "http://localhost:20128/v1";
let NINEROUTER_MODEL = process.env.NINEROUTER_MODEL || "9router";

// ══════════════════════════════════════════════════════════════
// PRODUCTION ENHANCEMENTS: AI Response Cache & Retry Logic
// ══════════════════════════════════════════════════════════════

// Simple in-memory cache for AI responses (TTL: 1 hour)
const aiResponseCache = new Map();
const AI_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(prompt, model) {
  const hash = require('crypto').createHash('md5').update(prompt + model).digest('hex');
  return `${model}:${hash.substring(0, 16)}`;
}

function getCachedResponse(prompt, model) {
  const key = getCacheKey(prompt, model);
  const cached = aiResponseCache.get(key);
  if (cached && Date.now() - cached.timestamp < AI_CACHE_TTL) {
    console.log(`💾 Cache HIT for ${model}: ${key}`);
    return cached.response;
  }
  if (cached) {
    aiResponseCache.delete(key); // expired
  }
  return null;
}

function setCachedResponse(prompt, model, response) {
  const key = getCacheKey(prompt, model);
  aiResponseCache.set(key, {
    response,
    timestamp: Date.now()
  });
  // Limit cache size to 100 entries (LRU-style)
  if (aiResponseCache.size > 100) {
    const firstKey = aiResponseCache.keys().next().value;
    aiResponseCache.delete(firstKey);
  }
}

// Repair common AI-generated Remotion/TypeScript mistakes before compile.
function repairGeneratedTsx(code) {
  if (!code) return code;
  let repaired = code;

  // Remotion interpolate() option is `easing`, not `ease`.
  repaired = repaired.replace(/([,{]\s*)ease\s*:/g, '$1easing:');

  // Some models hallucinate CSS-like option casing or invalid aliases.
  repaired = repaired.replace(/EasingEaseOut/g, 'Easing.out(Easing.quad)');
  repaired = repaired.replace(/EasingEaseIn/g, 'Easing.in(Easing.quad)');
  repaired = repaired.replace(/EasingEaseInOut/g, 'Easing.inOut(Easing.quad)');

  return repaired;
}

// Generic retry helper with exponential backoff
async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = (error) => true,
    onRetry = (error, attempt) => {}
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
      onRetry(error, attempt + 1);
      console.log(`⚠️ Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${error.message?.substring(0, 100)}`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
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
  const { preferModel, validator, taskId, skipCache = false } = options;

  // Check cache first (unless skipCache is true)
  if (!skipCache && !validator) { // Don't cache validated responses (e.g. TSX) as they're unique
    const cached = getCachedResponse(prompt, preferModel || 'auto');
    if (cached) {
      return cached;
    }
  }

  // Helper local untuk logging detail
  const log = (msg, type = 'info') => {
    if (options.logger) {
      options.logger(msg, type);
    } else if (taskId) {
      addTaskLog(taskId, msg, type);
    } else {
      console.log(`[AI-Fallback] [${type}] ${msg}`);
    }
  };

  // Helper: cek apakah respons valid dengan validator jika ada
  const isValid = (text, providerName) => {
    if (!text || !text.trim()) {
      log(`   ⚠️ Respons dari ${providerName} kosong`, "warning");
      return false;
    }
    if (validator) {
      const valid = validator(text);
      if (!valid) {
        log(`   ⚠️ Respons dari ${providerName} tidak lolos validasi format TSX`, "warning");
      }
      return valid;
    }
    return true;
  };

  const errors = [];

  // Pass logger down to syntx bot
  const syntxOptions = {
    taskId: options.taskId,
    logger: options.logger || (taskId ? (msg, type) => addTaskLog(taskId, msg, type) : null),
    onEmailGenerated: (nextIndex) => {
      updateEnvKeys({ syntxEmailIndex: String(nextIndex) });
    }
  };

  // Jika preferModel adalah specific provider, langsung route ke sana
  if (preferModel && preferModel !== 'auto') {

    log(`Mencoba model spesifik pilihan: ${preferModel}...`, 'info');
    if (preferModel === '9router') {
      const result = await callNineRouter(prompt);
      if (isValid(result, '9Router')) {
        log(`✅ Sukses menggunakan 9Router!`, 'success');
        return result;
      }
      throw new Error("9Router returned invalid response");
    } else if (preferModel === 'syntx-claude') {
      const result = await syntxBot.callSyntx(prompt, 'claude-sonnet-4-6', syntxOptions);
      if (isValid(result, 'Syntx Claude')) {
        log(`✅ Sukses menggunakan Syntx Claude!`, 'success');
        return result;
      }
      throw new Error("Syntx Claude returned invalid response");
    } else if (preferModel === 'syntx-chatgpt') {
      const result = await syntxBot.callSyntx(prompt, 'gpt-5.5', syntxOptions);
      if (isValid(result, 'Syntx ChatGPT')) {
        log(`✅ Sukses menggunakan Syntx ChatGPT!`, 'success');
        return result;
      }
      throw new Error("Syntx ChatGPT returned invalid response");
    } else if (preferModel === 'syntx-gemini') {
      const result = await syntxBot.callSyntx(prompt, 'gemini-3.5-flash', syntxOptions);
      if (isValid(result, 'Syntx Gemini')) {
        log(`✅ Sukses menggunakan Syntx Gemini!`, 'success');
        return result;
      }
      throw new Error("Syntx Gemini returned invalid response");
    } else if (preferModel === 'syntx-grok') {
      const result = await syntxBot.callSyntx(prompt, 'grok-4.3', syntxOptions);
      if (isValid(result, 'Syntx Grok')) {
        log(`✅ Sukses menggunakan Syntx Grok!`, 'success');
        return result;
      }
      throw new Error("Syntx Grok returned invalid response");
    } else if (preferModel === 'syntx-deepseek') {
      const result = await syntxBot.callSyntx(prompt, 'deepseek-r1', syntxOptions);
      if (isValid(result, 'Syntx DeepSeek')) {
        log(`✅ Sukses menggunakan Syntx DeepSeek!`, 'success');
        return result;
      }
      throw new Error("Syntx DeepSeek returned invalid response");
    } else if (preferModel === 'syntx-qwen') {
      const result = await syntxBot.callSyntx(prompt, 'qwen3.7-max', syntxOptions);
      if (isValid(result, 'Syntx Qwen')) {
        log(`✅ Sukses menggunakan Syntx Qwen!`, 'success');
        return result;
      }
      throw new Error("Syntx Qwen returned invalid response");
    } else if (preferModel === 'syntx-perplexity') {
      const result = await syntxBot.callSyntx(prompt, 'sonar-pro', syntxOptions);
      if (isValid(result, 'Syntx Perplexity')) {
        log(`✅ Sukses menggunakan Syntx Perplexity!`, 'success');
        return result;
      }
      throw new Error("Syntx Perplexity returned invalid response");
    } else if (preferModel === 'tsx-default') {
      log("Memulai pencarian model untuk konversi TSX (Gemini Syntx -> Claude Syntx -> 9Router)...", "info");
      
      // 1. Coba Syntx Gemini
      try {
        log("📡 [1/3] Mencoba Syntx.ai Gemini 3.5 Flash...", "info");
        const result = await syntxBot.callSyntx(prompt, 'gemini-3.5-flash', syntxOptions);
        if (isValid(result, "Syntx Gemini")) {
          log("✅ Sukses menggunakan Syntx Gemini untuk TSX!", "success");
          return result;
        }
        log("⚠️ Syntx Gemini: respons tidak valid, lanjut fallback...", "warning");
      } catch (err) {
        log(`⚠️ Syntx.ai Gemini gagal: ${err.message?.substring(0, 150)}`, "warning");
        errors.push({ provider: "syntx-gemini", error: err.message });
      }

      // 2. Coba Syntx Claude
      try {
        log("📡 [2/3] Mencoba Syntx.ai Claude Sonnet 4.5...", "info");
        const result = await syntxBot.callSyntx(prompt, 'claude-sonnet-4-6', syntxOptions);
        if (isValid(result, "Syntx Claude")) {
          log("✅ Sukses menggunakan Syntx Claude untuk TSX!", "success");
          return result;
        }
        log("⚠️ Syntx Claude: respons tidak valid, lanjut fallback...", "warning");
      } catch (err) {
        log(`⚠️ Syntx.ai Claude gagal: ${err.message?.substring(0, 150)}`, "warning");
        errors.push({ provider: "syntx-claude", error: err.message });
      }

      // 3. Coba 9Router
      try {
        if (NINEROUTER_API_KEY) {
          log("📡 [3/3] Mencoba 9Router...", "info");
          const result = await callNineRouter(prompt);
          if (isValid(result, "9Router")) {
            log("✅ Sukses menggunakan 9Router untuk TSX!", "success");
            return result;
          }
          log("⚠️ 9Router: respons tidak valid, lanjut fallback...", "warning");
        }
      } catch (err) {
        log(`⚠️ 9Router gagal untuk TSX: ${err.message?.substring(0, 150)}`, "warning");
        errors.push({ provider: "9router", error: err.message });
      }

      log("⚠️ Semua model TSX (Gemini, Claude, 9Router) gagal, lanjut ke standard auto-fallback...", "warning");
    }
  }

  // Auto-fallback mode (default) — coba Syntx lalu 9Router
  log("Memulai pencarian model otomatis dengan fallback (Syntx -> 9Router)...", "info");

  // 1. Syntx.ai Claude
  if (preferModel !== 'syntx-claude') {
    try {
      log("📡 [1/3] Mencoba Syntx.ai Claude Sonnet 4.5...", "info");
      const result = await syntxBot.callSyntx(prompt, 'claude-sonnet-4-6', syntxOptions);
      if (isValid(result, "Syntx Claude")) {
        log("✅ Sukses menggunakan Syntx Claude!", "success");
        return result;
      }
      log("⚠️ Syntx Claude: respons tidak valid, lanjut fallback...", "warning");
    } catch (err) {
      log(`⚠️ Syntx.ai Claude gagal: ${err.message?.substring(0, 150)}`, "warning");
      errors.push({ provider: "syntx-claude", error: err.message });
    }
  }

  // 2. Syntx.ai Gemini
  if (preferModel !== 'syntx-gemini') {
    try {
      log("📡 [2/3] Mencoba Syntx.ai Gemini 3.5 Flash...", "info");
      const result = await syntxBot.callSyntx(prompt, 'gemini-3.5-flash', syntxOptions);
      if (isValid(result, "Syntx Gemini")) {
        log("✅ Sukses menggunakan Syntx Gemini!", "success");
        return result;
      }
      log("⚠️ Syntx Gemini: respons tidak valid, lanjut fallback...", "warning");
    } catch (err) {
      log(`⚠️ Syntx.ai Gemini gagal: ${err.message?.substring(0, 150)}`, "warning");
      errors.push({ provider: "syntx-gemini", error: err.message });
    }
  }

  // 3. Coba 9Router
  if (preferModel !== '9router') {
    try {
      if (NINEROUTER_API_KEY) {
        log("📡 [3/3] Mencoba 9Router...", "info");
        const result = await callNineRouter(prompt);
        if (isValid(result, "9Router")) {
          log("✅ Sukses menggunakan 9Router!", "success");
          return result;
        }
        log("⚠️ 9Router: respons tidak valid");
      } else {
        log("⏩ Skip 9Router (API Key kosong)", "info");
      }
    } catch (err) {
      log(`⚠️ 9Router gagal: ${err.message?.substring(0, 150)}`, "warning");
      errors.push({ provider: "9router", error: err.message });
    }
  }

  // Semua gagal
  log(`❌ Semua provider AI gagal! Rincian error: ${JSON.stringify(errors)}`, "error");
  throw new Error(`Semua provider AI gagal: ${JSON.stringify(errors)}`);
}

// Wrap callAIWithFallback with retry logic for production resilience
async function callAIWithRetry(prompt, options = {}) {
  const shouldRetry = (error) => {
    // Retry on network errors, timeouts, but not on validation failures
    return !error.message?.includes('tidak lolos validasi') &&
           !error.message?.includes('invalid response');
  };

  return withRetry(
    async () => {
      const result = await callAIWithFallback(prompt, options);

      // Cache successful responses (if not skipped)
      if (result && !options.skipCache && !options.validator) {
        setCachedResponse(prompt, options.preferModel || 'auto', result);
      }

      return result;
    },
    {
      maxRetries: 2,
      initialDelay: 2000,
      shouldRetry,
      onRetry: (error, attempt) => {
        const log = options.logger || console.log;
        log(`🔄 Retrying AI call (attempt ${attempt}/2): ${error.message?.substring(0, 100)}`);
      }
    }
  );
}

// 9Router API Call Helper (OpenAI-compatible) with retry
async function callNineRouter(prompt, model = NINEROUTER_MODEL) {
  return withRetry(
    async () => {
      const url = `${NINEROUTER_BASE_URL.replace(/\/+$/, '')}/chat/completions`;
      console.log(`📡 Mengirim request ke 9Router (URL: ${url}, model: ${model})...`);

      const headers = {
        "Content-Type": "application/json"
      };
      if (NINEROUTER_API_KEY) {
        headers["Authorization"] = `Bearer ${NINEROUTER_API_KEY}`;
        console.log("🔑 API Key 9Router ada:", NINEROUTER_API_KEY.substring(0, 10) + "...");
      }

      const response = await axios.post(
        url,
        {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          stream: false // Explicitly disable streaming for consistency
        },
        {
          headers: headers,
          timeout: 90000 // 9Router may run slow for complex combo queries, give it 90s
        }
      );

      if (!response.data.choices || !response.data.choices[0]) {
        throw new Error("Respons 9Router tidak valid: " + JSON.stringify(response.data));
      }

      console.log("✅ Respon 9Router berhasil diterima!");
      return response.data.choices[0].message.content;
    },
    {
      maxRetries: 2,
      initialDelay: 3000,
      shouldRetry: (error) => {
        // Retry on network errors and timeouts, but not on 4xx client errors
        const status = error?.response?.status;
        return !status || status >= 500 || error.code === 'ECONNABORTED';
      },
      onRetry: (error, attempt) => {
        console.error(`🔄 Retrying 9Router (attempt ${attempt}/2):`, error.message?.substring(0, 100));
      }
    }
  );
}




// ══════════════════════════════════════════════════════════════
// MARKET RESEARCH SCRAPERS — Adobe Stock + Shutterstock
// ══════════════════════════════════════════════════════════════

const SCRAPE_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// Fungsi Scraping Live Data dari Adobe Stock (enhanced)
async function scrapAdobeStock(keyword) {
  try {
    const searchUrl = "https://stock.adobe.com/search/video?k=" + encodeURIComponent(keyword) + "&search_type=usertyped";
    console.log("🔍 Mengorek data Adobe Stock untuk: " + keyword);

    const { data } = await axios.get(searchUrl, {
      headers: { "User-Agent": SCRAPE_UA },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    let results = [];

    // Try multiple selectors for robustness
    $("img[alt]").each((index, element) => {
      const alt = $(element).attr("alt") || "";
      if (alt.length > 10 && !alt.includes("Adobe") && !alt.includes("stock") && results.length < 20) {
        results.push({
          title: alt.trim(),
          index: results.length + 1
        });
      }
    });

    // Fallback: try result cells
    if (results.length === 0) {
      $(".search-result-cell, .thumb-frame").each((index, element) => {
        if (index >= 10) return false;
        const judul = $(element).find("img").attr("alt") || $(element).find(".js-search-result-title").text().trim();
        if (judul) results.push({ title: judul, index: results.length + 1 });
      });
    }

    // Extract total result count if available
    let totalResults = "";
    const resultCountText = $(".search-count, [data-testid='result-count'], .nb-results").first().text().trim();
    if (resultCountText) totalResults = resultCountText;

    return {
      platform: "Adobe Stock",
      keyword,
      totalResults,
      items: results,
      titles: results.map(r => r.title),
      raw: results.length > 0 ? results.map(r => `- ${r.title}`).join("\n") : `- ${keyword} abstract motion background loop`
    };
  } catch (error) {
    console.log("⚠️ Adobe Stock scrape failed:", error.message);
    return {
      platform: "Adobe Stock",
      keyword,
      totalResults: "",
      items: [],
      titles: [],
      raw: `- ${keyword} tech abstract neon background loop`
    };
  }
}

// Fungsi Scraping Live Data dari Shutterstock
async function scrapShutterstock(keyword) {
  try {
    const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const searchUrl = `https://www.shutterstock.com/video/search/${slug}`;
    console.log("🔍 Mengorek data Shutterstock untuk: " + keyword);

    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent": SCRAPE_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      timeout: 15000
    });

    const $ = cheerio.load(data);
    let results = [];

    // Shutterstock stores video descriptions in alt tags and data attributes
    $("img[alt]").each((index, element) => {
      const alt = $(element).attr("alt") || "";
      if (alt.length > 10 && !alt.includes("Shutterstock") && !alt.includes("logo") && !alt.includes("icon") && results.length < 20) {
        results.push({
          title: alt.trim(),
          index: results.length + 1
        });
      }
    });

    // Also try to extract from JSON-LD or script tags
    $("script[type='application/ld+json']").each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json && Array.isArray(json)) {
          json.forEach(item => {
            if (item.name && results.length < 25) {
              results.push({ title: item.name, index: results.length + 1 });
            }
          });
        } else if (json && json.name) {
          results.push({ title: json.name, index: results.length + 1 });
        }
      } catch (e) { /* skip malformed JSON-LD */ }
    });

    // Extract total result count
    let totalResults = "";
    const countEl = $("[data-testid='search-results-count'], .c-pagination__count, .globalSearch_totalResults").first().text().trim();
    if (countEl) totalResults = countEl;

    // Deduplicate by title
    const seen = new Set();
    results = results.filter(r => {
      if (seen.has(r.title.toLowerCase())) return false;
      seen.add(r.title.toLowerCase());
      return true;
    });

    return {
      platform: "Shutterstock",
      keyword,
      totalResults,
      items: results,
      titles: results.map(r => r.title),
      raw: results.length > 0 ? results.map(r => `- ${r.title}`).join("\n") : `- ${keyword} abstract motion loop`
    };
  } catch (error) {
    console.log("⚠️ Shutterstock scrape failed:", error.message);
    return {
      platform: "Shutterstock",
      keyword,
      totalResults: "",
      items: [],
      titles: [],
      raw: `- ${keyword} abstract motion loop`
    };
  }
}

// Scrape both platforms in parallel
async function scrapAllPlatforms(keyword) {
  const [adobe, shutter] = await Promise.all([
    scrapAdobeStock(keyword),
    scrapShutterstock(keyword)
  ]);
  return { adobe, shutter };
}

// POST /api/research-market -> Deep market research from both platforms
app.post("/api/research-market", async (req, res) => {
  const { keyword } = req.body;
  if (!keyword || !keyword.trim()) {
    return res.status(400).json({ error: "Keyword diperlukan" });
  }

  console.log(`🔬 Memulai riset pasar mendalam untuk: "${keyword}"`);

  try {
    // 1. Scrape both platforms in parallel
    const { adobe, shutter } = await scrapAllPlatforms(keyword);
    console.log(`📊 Adobe: ${adobe.titles.length} results, Shutterstock: ${shutter.titles.length} results`);

    // 2. Build combined competitor data
    const competitorData = [
      `=== ADOBE STOCK (${adobe.titles.length} video ditemukan${adobe.totalResults ? ', total: ' + adobe.totalResults : ''}) ===`,
      adobe.raw,
      ``,
      `=== SHUTTERSTOCK (${shutter.titles.length} video ditemukan${shutter.totalResults ? ', total: ' + shutter.totalResults : ''}) ===`,
      shutter.raw
    ].join("\n");

    // 3. Send to AI for deep market analysis
    const prompt = `You are an elite Microstock Market Analyst specializing in Adobe Stock and Shutterstock video markets (USA/Global).

KEYWORD BEING RESEARCHED: "${keyword}"

COMPETITOR DATA FROM LIVE SCRAPING:
${competitorData}

Perform a DEEP MARKET ANALYSIS and output ONLY a valid JSON object (no markdown, no explanation):
{
  "keyword": "${keyword}",
  "marketSummary": "2-3 sentence summary of the competitive landscape for this keyword",
  "totalCompetitors": { "adobe": "${adobe.totalResults || 'unknown'}", "shutterstock": "${shutter.totalResults || 'unknown'}" },
  "competitionLevel": "Low/Medium/High/Saturated",
  "demandSignal": "Low/Medium/High/Very High based on competitor volume and keyword specificity",
  "topTrends": ["array of 5 visual/style trends observed in competitor titles"],
  "commonKeywords": ["array of 10-15 most frequently used keywords in competitor titles"],
  "underservedNiches": ["array of 3-5 underserved angles or gaps in the market"],
  "recommendedTitles": [
    {
      "title": "SEO-optimized English title (max 12 words, no programming terms)",
      "why": "Brief reason why this title would perform well"
    }
  ],
  "recommendedKeywords": "35-50 comma-separated English keywords for stock metadata. Use 3-pillar technique: Pilar 1 (What), Pilar 2 (Visual/Style), Pilar 3 (Use case). NO programming terms.",
  "recommendedCategories": {
    "adobe": "Best Adobe Stock category name",
    "shutterstock": "Best Shutterstock category name"
  },
  "pricingInsight": "Brief note on pricing potential for this niche",
  "actionableStrategy": "3-sentence actionable strategy for creating videos in this niche that will outsell competitors"
}

Generate 5 recommended titles that would OUTPERFORM existing competitors. Focus on what's MISSING in the market, not copying.`;

    console.log("🤖 Mengirim data kompetitor ke AI untuk analisis mendalam...");
    const aiResponse = await callAIWithFallback(prompt, { preferModel: 'syntx-claude' });

    let jsonText = aiResponse.trim();
    if (jsonText.includes("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    jsonText = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    const analysis = JSON.parse(jsonText);

    // 4. Return combined result
    console.log(`✅ Riset pasar selesai untuk: "${keyword}"`);
    res.json({
      success: true,
      keyword,
      scrapeData: {
        adobe: { count: adobe.titles.length, total: adobe.totalResults, titles: adobe.titles },
        shutter: { count: shutter.titles.length, total: shutter.totalResults, titles: shutter.titles }
      },
      analysis
    });
  } catch (error) {
    console.error("❌ Gagal riset pasar:", error.message);
    res.status(500).json({ error: "Gagal melakukan riset pasar", details: error.message });
  }
});

// JALUR 1: AMBIL DATA & OPTIMALISASI ATM VIA OPENROUTER
app.post("/api/generate", async (req, res) => {
  const { keyword } = req.body;

  const dataScrap = await scrapAdobeStock(keyword);
  console.log("🤖 Menyodorkan data kompetitor ke 9Router AI...");

  if (!NINEROUTER_API_KEY) {
    console.error("❌ EROR: NINEROUTER_API_KEY tidak ditemukan di file .env!");
    return res.status(500).json({ error: "API Key 9Router belum dikonfigurasi di file .env" });
  }

  const prompt = "Kamu adalah pakar Creative Director SEO Microstock USA.\n" +
    "Berikut adalah tren data judul kompetitor di Adobe Stock saat ini:\n" + dataScrap.raw + "\n\n" +
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

// JALUR 4B: KONVERSI HTML KE TSX & SIMPAN (via OpenRouter)
app.post("/api/convert-html-to-tsx", async (req, res) => {
  const { item } = req.body;
  console.log("🔄 Mengonversi HTML ke TSX untuk: " + item.id);

  if (!NINEROUTER_API_KEY) {
    return res.status(500).json({ error: "NINEROUTER_API_KEY tidak ditemukan" });
  }

  try {
    const promptsData = loadPromptsConfig();
    const animationDuration = item.animationDuration || 10;
    const durationFrames = item.durationInFrames || 300;
    const conversionPrompt = promptsData.conversionPrompt
      .replace(/{{ANIMATION_DURATION}}/g, String(animationDuration))
      .replace(/{{DURATION_FRAMES}}/g, String(durationFrames))
      .replace(/{{HTML_CONTENT}}/g, item.htmlPreview || "");

    const aiResponse = await callAIWithFallback(conversionPrompt, { preferModel: 'syntx-gemini' });

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

// GET: Export all keywords to CSV for download (legacy)
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

// GET: Export all keywords/data to platform-specific CSV for download
app.get("/api/export-csv", (req, res) => {
  try {
    const { platform } = req.query;
    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    const items = JSON.parse(data);

    if (platform === "adobe") {
      let csv = "Filename,Title,Keywords,Category,Releases\n";
      items.forEach((item) => {
        const filename = `${item.id}-4k.mov`;
        const title = (item.judul || "").replace(/"/g, '""');
        const keywords = (item.keywords || "").replace(/"/g, '""');
        const category = (item.adobeCategory || "").replace(/"/g, '""');
        csv += `"${filename}","${title}","${keywords}","${category}",""\n`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=adobe_stock_upload.csv");
      return res.send(csv);
    } else if (platform === "shutterstock") {
      let csv = "Filename,Description,Keywords,Categories,Editorial,Mature content,illustration\n";
      items.forEach((item) => {
        const filename = `${item.id}-4k.mov`;
        const description = (item.judul || "").replace(/"/g, '""');
        const keywords = (item.keywords || "").replace(/"/g, '""');
        const combinedCategories = [item.shutterstockCategory, item.shutterstockCategory2].filter(Boolean).join(",");
        const categories = combinedCategories.replace(/"/g, '""');
        csv += `"${filename}","${description}","${keywords}","${categories}","no","no","no"\n`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=shutterstock_upload.csv");
      return res.send(csv);
    } else {
      return res.status(400).json({ error: "Platform tidak valid. Gunakan 'adobe' or 'shutterstock'." });
    }
  } catch (error) {
    console.error("❌ Failed to export CSV:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Simpan atau update baris
app.post("/api/save-item", (req, res) => {
  try {
    let { item } = req.body;
    if (!item || !item.id) {
      return res.status(400).json({ error: "Item atau ID tidak valid" });
    }

    // Jalankan sanitasi keywords & judul untuk menjamin kepatuhan pada format microstock
    if (item.judul || item.keywords) {
      item = sanitizeKeywordsAndTitle(item);
    }

    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    let items = JSON.parse(data);

    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      // Track if user manually changed video config fields
      const videoConfigFields = ['loop', 'transparent', 'animationDuration', 'fps'];
      if (videoConfigFields.some(f => item[f] !== undefined)) {
        item._userSetVideoConfig = true;
      }
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

    // Hapus file HTML, TSX, video preview, video 4K, dan file temp lokal jika ada
    const pathsToCleanup = [
      path.join(__dirname, "public", "saved-code", `${id}.html`),
      path.join(__dirname, "public", "saved-code", `${id}.tsx`),
      path.join(__dirname, "public", "previews", `${id}-preview.mp4`),
      path.join(__dirname, "public", "previews", `${id}.mp4`),
      path.join(__dirname, "out", `${id}-4k.mov`),
      path.join(__dirname, "out", `${id}_4k.mov`),
      path.join(__dirname, `temp-props-preview-${id}.json`),
      path.join(__dirname, `temp-props-4k-${id}.json`),
      path.join(__dirname, `temp-link-${id}-preview.zip`),
      path.join(__dirname, `temp-link-${id}-4k.zip`)
    ];

    try {
      pathsToCleanup.forEach(p => {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
    } catch (fileErr) {
      console.warn(`Gagal menghapus file lokal untuk ${id}:`, fileErr.message);
    }

    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
    console.log(`🗑 Item "${id}" beserta kode dan file videonya berhasil dihapus`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Gagal hapus item:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST: Batch Hapus beberapa item sekaligus beserta file lokalnya
app.post("/api/batch-delete", (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Parameter 'ids' harus berupa array ID yang valid" });
    }

    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    let items = JSON.parse(data);

    const beforeCount = items.length;

    // Filter out deleted items and unlink their local files
    items = items.filter(item => {
      if (ids.includes(item.id)) {
        const id = item.id;
        const pathsToCleanup = [
          path.join(__dirname, "public", "saved-code", `${id}.html`),
          path.join(__dirname, "public", "saved-code", `${id}.tsx`),
          path.join(__dirname, "public", "previews", `${id}-preview.mp4`),
          path.join(__dirname, "public", "previews", `${id}.mp4`),
          path.join(__dirname, "out", `${id}-4k.mov`),
          path.join(__dirname, "out", `${id}_4k.mov`),
          path.join(__dirname, `temp-props-preview-${id}.json`),
          path.join(__dirname, `temp-props-4k-${id}.json`),
          path.join(__dirname, `temp-link-${id}-preview.zip`),
          path.join(__dirname, `temp-link-${id}-4k.zip`)
        ];
        try {
          pathsToCleanup.forEach(p => {
            if (fs.existsSync(p)) fs.unlinkSync(p);
          });
        } catch (fileErr) {
          console.warn(`Gagal menghapus file lokal untuk ${id}:`, fileErr.message);
        }
        return false;
      }
      return true;
    });

    const deletedCount = beforeCount - items.length;

    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
    console.log(`🗑 Berhasil menghapus ${deletedCount} item terpilih beserta kode dan file videonya`);
    res.json({ success: true, deletedCount });
  } catch (error) {
    console.error("❌ Gagal batch hapus item:", error.message);
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
      durationInFrames: Number(item.durationInFrames) || 150,
      fps: Number(item.fps) || 30
    };
    fs.writeFileSync(tempPropsFile, JSON.stringify(props));

    // 3. Jalankan render lokal
    const previewFile = path.join("public", "previews", `${item.id}.mp4`);
    const cmd = `npx remotion render Composition "${previewFile}" --scale=0.3 --props="${tempPropsFile}" --muted`;
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
      durationInFrames: Number(item.durationInFrames) || 150,
      fps: Number(item.fps) || 30
    };
    fs.writeFileSync(tempPropsFile, JSON.stringify(props));

    // 3. Jalankan render 4K ProRes
    const outputFile = path.join("out", `${item.id}-4k.mov`);
    const cmd = `npx remotion render Composition "${outputFile}" --codec=prores --props="${tempPropsFile}" --muted`;
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
        const tempOutputFile = path.join("out", `temp_${item.id}-4k.mov`);
        const title = item.judul || "Stock Video";
        const comment = item.keywords || "motion, abstract, loop";
        const ffmpegCmd = `ffmpeg -y -i "${outputFile}" -metadata title="${title.replace(/"/g, '\\"')}" -metadata keywords="${comment.replace(/"/g, '\\"')}" -an -codec copy "${tempOutputFile}"`;
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

// Background task queue state
const taskQueue = []; // Array of item IDs
const activeTasks = new Set(); // Set of currently processing item IDs
const MAX_CONCURRENT_TASKS = 1;
const abortControllers = {}; // { itemId: AbortController }
const taskLogs = {}; // { itemId: Array of log objects }
const taskSseClients = {}; // { itemId: Array of SSE response objects }
const activeSeoGenerations = {}; // { itemId: boolean }
const activePreviewRenders = {}; // { itemId: boolean }
const active4kRenders = {}; // { itemId: boolean }
const render4kQueue = [];
let isProcessingRender4k = false;

// SEO background queue state
const seoQueue = []; // Array of objects: { id, aiModel }
const MAX_CONCURRENT_SEO = 2; // Allow 2 parallel SEO generations
let activeSeoCount = 0;

// Health check endpoint for monitoring
app.get("/api/health", (req, res) => {
  try {
    let itemsCount = 0;
    try {
      const data = fs.readFileSync(dbPath, "utf-8");
      itemsCount = JSON.parse(data).length;
    } catch (e) {
      itemsCount = -1;
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      queue: {
        taskQueue: taskQueue.length,
        activeTasks: activeTasks.size,
        seoQueue: seoQueue.length,
        activeSeo: activeSeoCount,
        render4kQueue: render4kQueue.length
      },
      cache: {
        aiResponses: aiResponseCache.size
      },
      database: {
        itemsCount
      }
    };

    if (health.queue.taskQueue > 20) {
      health.status = 'degraded';
      health.warnings = ['Task queue backlog detected'];
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Sequential Git operator lock (Mutex) to prevent local commit/push conflicts
let gitMutex = Promise.resolve();
async function runGitTask(fn) {
  const next = gitMutex.then(() => fn());
  gitMutex = next.catch(() => {});
  return next;
}

// Helper: Wrap async function calls with an abortable listener
async function runAbortable(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) throw new Error("Cancelled by user");

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(new Error("Cancelled by user"));
    };
    signal.addEventListener('abort', onAbort);
    promise.then(resolve).catch(reject).finally(() => {
      signal.removeEventListener('abort', onAbort);
    });
  });
}

// Helper: Save or update item in database file
// Helper: Save or update item in database file synchronously
function saveOrUpdateItem(item) {
  const dbPath = path.join(__dirname, "saved-items.json");
  try {
    let items = [];
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      items = JSON.parse(data);
    }

    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      // If the user modified the title/keywords on the dashboard (disk edits),
      // we preserve them in `item` to avoid overwriting them with stale in-memory values.
      // We know `item` has the correct title if `item._isGeneratingSeo` is true.
      if (items[index].judul !== item.judul && !item._isGeneratingSeo) {
        item.judul = items[index].judul;
      }
      if (items[index].keywords !== item.keywords && !item._isGeneratingSeo) {
        item.keywords = items[index].keywords;
      }

      // If the user manually updated video config on the dashboard, we preserve it.
      if (items[index]._userSetVideoConfig) {
        item.loop = items[index].loop;
        item.transparent = items[index].transparent;
        item.animationDuration = items[index].animationDuration;
        item.fps = items[index].fps;
        item.durationInFrames = items[index].durationInFrames;
        item._userSetVideoConfig = true;
      }

      // Merge the item updates
      items[index] = { ...items[index], ...item };

      // Sync logs if we're actively tracking them in memory
      if (taskLogs[item.id]) {
        items[index].logs = taskLogs[item.id];
        if (taskLogs[item.id].length > 0) {
          items[index].lastLogMessage = taskLogs[item.id][taskLogs[item.id].length - 1].message;
        }
      }
    } else {
      if (taskLogs[item.id]) {
        item.logs = taskLogs[item.id];
        if (taskLogs[item.id].length > 0) {
          item.lastLogMessage = taskLogs[item.id][taskLogs[item.id].length - 1].message;
        }
      }
      items.push(item);
    }

    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
  } catch (e) {
    console.error("Failed to write database synchronously:", e);
  }
}

// Helper: Add logs for SSE task processing (per item)
function addTaskLog(itemId, message, type = 'info') {
  const time = new Date().toLocaleTimeString('id-ID');
  const logEntry = { message, type, time };

  let currentLogs = [];
  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      const items = JSON.parse(data);
      const item = items.find(i => i.id === itemId);
      if (item && item.logs) {
        currentLogs = [...item.logs];
      }
    }
  } catch (e) {
    console.error("Gagal menyinkronkan logs dari DB:", e);
  }

  // Jika memori sudah ada dan lebih panjang dari DB, gunakan memori.
  // Jika DB lebih panjang (misal karena ada push logs baru dari route lain), gunakan DB.
  if (taskLogs[itemId] && taskLogs[itemId].length > currentLogs.length) {
    currentLogs = taskLogs[itemId];
  }

  taskLogs[itemId] = currentLogs;
  taskLogs[itemId].push(logEntry);

  if (taskLogs[itemId].length > 500) {
    taskLogs[itemId].shift();
  }

  // Update logs and lastLogMessage in DB synchronously/persistently
  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      let items = JSON.parse(data);
      const index = items.findIndex(i => i.id === itemId);
      if (index !== -1) {
        items[index].logs = taskLogs[itemId];
        items[index].lastLogMessage = message;
        fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
      }
    }
  } catch (e) {
    console.error("Gagal menyimpan log task ke DB:", e);
  }

  // Stream to item-specific connected SSE clients
  if (taskSseClients[itemId]) {
    taskSseClients[itemId].forEach(client => {
      client.write(`data: ${JSON.stringify(logEntry)}\n\n`);
    });
  }

  console.log(`[Task ${itemId}] [${type}] ${message}`);
}

// Helper: Add logs for SSE batch rendering (backward compatibility)
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
      // Re-throw workflow failures immediately instead of looping forever
      if (err.message && (err.message.includes('fail') || err.message.includes('failure') || err.message.includes('Artifact') || err.message.includes('cloud-link'))) {
        throw err;
      }
      addLog(jobId, `Informasi status render: ${err.message}`, 'info');
    }

    // Tunggu 15 detik sebelum mengecek ulang
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  throw new Error("Timeout rendering video di GitHub Actions.");
}

// Helper: Normalisasi kategori Adobe Stock dan Shutterstock (Mendukung hingga 2 kategori Shutterstock)
function normalizeCategories(seoData) {
  // Adobe Category Normalization
  let rawAdobeCat = seoData.adobeCategory || seoData.adobe_category || seoData.adobe || '';
  let adobeCat = String(rawAdobeCat).trim();
  const matchNum = adobeCat.match(/^\d+/);
  if (matchNum) {
    adobeCat = matchNum[0];
  } else {
    const adobeMap = {
      'animals': '1', 'buildings': '2', 'architecture': '2', 'business': '3',
      'drinks': '4', 'environment': '5', 'states of mind': '6', 'food': '7',
      'graphic': '8', 'hobbies': '9', 'industry': '10', 'landscape': '11',
      'lifestyle': '12', 'people': '13', 'plants': '14', 'flowers': '14',
      'culture': '15', 'religion': '15', 'science': '16', 'social': '17',
      'sports': '18', 'technology': '19', 'transport': '20', 'travel': '21'
    };
    const cleanName = adobeCat.toLowerCase();
    for (const [kw, idVal] of Object.entries(adobeMap)) {
      if (cleanName.includes(kw)) {
        adobeCat = idVal;
        break;
      }
    }
  }

  // Shutterstock Category Normalization
  let rawShutterCat = seoData.shutterstockCategory || seoData.shutterstock_category || seoData.shutterstock || seoData.kategori || '';
  let shutterCatsRaw = String(rawShutterCat).split(",").map(c => c.trim()).filter(Boolean);

  const shutterMap = {
    'animal': 'Animals/Wildlife',
    'wildlife': 'Animals/Wildlife',
    'art': 'Arts',
    'background': 'Backgrounds/Textures',
    'texture': 'Backgrounds/Textures',
    'building': 'Buildings/Landmarks',
    'landmark': 'Buildings/Landmarks',
    'business': 'Business/Finance',
    'finance': 'Business/Finance',
    'education': 'Education',
    'food': 'Food and drink',
    'drink': 'Food and drink',
    'healthcare': 'Healthcare/Medical',
    'medical': 'Healthcare/Medical',
    'holiday': 'Holidays',
    'industrial': 'Industrial',
    'industry': 'Industrial',
    'nature': 'Nature',
    'object': 'Objects',
    'people': 'People',
    'person': 'People',
    'religion': 'Religion',
    'science': 'Science',
    'sign': 'Signs/Symbols',
    'symbol': 'Signs/Symbols',
    'sport': 'Sports/Recreation',
    'recreation': 'Sports/Recreation',
    'technology': 'Technology',
    'transport': 'Transportation',
    'transportation': 'Transportation'
  };

  const validLowerMap = {
    'animals/wildlife': 'Animals/Wildlife',
    'arts': 'Arts',
    'backgrounds/textures': 'Backgrounds/Textures',
    'buildings/landmarks': 'Buildings/Landmarks',
    'business/finance': 'Business/Finance',
    'education': 'Education',
    'food and drink': 'Food and drink',
    'healthcare/medical': 'Healthcare/Medical',
    'holidays': 'Holidays',
    'industrial': 'Industrial',
    'nature': 'Nature',
    'objects': 'Objects',
    'people': 'People',
    'religion': 'Religion',
    'science': 'Science',
    'signs/symbols': 'Signs/Symbols',
    'sports/recreation': 'Sports/Recreation',
    'technology': 'Technology',
    'transportation': 'Transportation'
  };

  const validShutterCats = [
    "Animals/Wildlife", "Arts", "Backgrounds/Textures", "Buildings/Landmarks",
    "Business/Finance", "Education", "Food and drink", "Healthcare/Medical",
    "Holidays", "Industrial", "Nature", "Objects", "People", "Religion",
    "Science", "Signs/Symbols", "Sports/Recreation", "Technology", "Transportation"
  ];

  function normalizeSingleShutter(catStr) {
    if (!catStr) return '';
    const cleanShutter = catStr.toLowerCase().trim();
    let matchedShutter = '';
    for (const [kw, val] of Object.entries(shutterMap)) {
      if (cleanShutter.includes(kw)) {
        matchedShutter = val;
        break;
      }
    }
    if (!matchedShutter && validLowerMap[cleanShutter]) {
      matchedShutter = validLowerMap[cleanShutter];
    }
    if (!matchedShutter) {
      for (const cat of validShutterCats) {
        if (cat.toLowerCase().includes(cleanShutter) || cleanShutter.includes(cat.toLowerCase())) {
          matchedShutter = cat;
          break;
        }
      }
    }
    return matchedShutter || catStr;
  }

  let shutterCat = shutterCatsRaw[0] ? normalizeSingleShutter(shutterCatsRaw[0]) : '';
  let shutterCat2 = shutterCatsRaw[1] ? normalizeSingleShutter(shutterCatsRaw[1]) : '';

  return { adobeCat, shutterCat, shutterCat2 };
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
      
      // Split multi-word keywords into single words (by whitespace)
      const subWords = kw.split(/\s+/);
      for (let subKw of subWords) {
        subKw = subKw.trim();
        if (!subKw) continue;
        
        let cleanKw = subKw.toLowerCase();

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
          cleanKeywords.push(subKw);
        }
      }
    }

    seoData.keywords = cleanKeywords.slice(0, 50).join(', ');
  }

  return seoData;
}

const promptsPath = path.join(__dirname, "prompts.json");
function loadPromptsConfig() {
  try {
    if (fs.existsSync(promptsPath)) {
      const data = fs.readFileSync(promptsPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Gagal membaca prompts.json, menggunakan default:", e.message);
  }
  return {
    seoPrompt: `Kamu adalah pakar Creative Director SEO Microstock USA.
Analisis file HTML berikut dan buat metadata SEO yang luar biasa kreatif, visualnya mewah, dan bernilai jual tinggi untuk dipasarkan di Adobe Stock.

HTML Content:
{{HTML_CONTENT}}

Keluarkan hasil dalam format JSON murni berbentuk objek tanpa teks pengantar/penutup apa pun.
DILARANG menggunakan karakter double quote (") di dalam nilai string. Gunakan single quote (') jika perlu.
Struktur objek wajib persis seperti ini:
{
  "judul": "Rekomendasi judul video SEO bahasa Inggris (maksimal 12 kata). DILARANG menggunakan kata teknis pemrograman seperti CSS, keyframes, requestAnimationFrame, HTML, canvas, SVG, easing, DLL. DILARANG menggunakan nama brand (Apple, Nike, Android, Google, Microsoft, dll). Gunakan istilah komersial video seperti: smooth animation, fluid movement, modern UI UX elements overlay, app interface template, abstract particles, seamless loop, data visualization, animated infographics, interactive design concept.",
  "keywords": "35-50 kata kunci bahasa Inggris dipisah koma. SETIAP KEYWORD WAJIB TERDIRI DARI SATU KATA SAJA (single word). DILARANG keras menggunakan kata majemuk / frase multi-kata (seperti 'mouse click', 'subscribe button', 'alpha channel', 'transparent background', 'social media', 'gradient background'). Pecah frase multi-kata menjadi kata-kata tunggal yang terpisah (misalnya: tulis 'mouse', 'click', 'subscribe', 'button', 'alpha', 'channel', 'transparent', 'background', 'social', 'media'). DILARANG menggunakan istilah teknis pemrograman (CSS transition, keyframes, requestAnimationFrame, SVG, canvas, loop) dan DILARANG menggunakan nama brand (Apple, Nike, Android, Google, Microsoft, dll). WAJIB menerjemahkan ke istilah komersial video stock dan disusun berdasarkan Teknik 3 Pilar dengan 7-10 keyword pertama adalah yang paling krusial. Pilar 1 (What/Isi: click, button, loading, bar, progress, indicator, dll), Pilar 2 (Visual/Style: minimalist, flat, modern, UI, isolated, 4k. Jika video transparan, keyword 'alpha', 'channel', 'transparent', 'background' WAJIB ditaruh di 10 keyword pertama), Pilar 3 (Kegunaan/Context: website, promo, social, media, asset, application, presentation, marketing).",
  "deskripsi": "Deskripsi detail visual bahasa Inggris untuk Adobe Stock (minimal 15 kata). Terjemahkan istilah kode ke visual: jangan sebut keyframes/easing/canvas, tapi gunakan smooth animation, fluid movement, dll.",
  "kategori": "Kategori Adobe Stock (Technology/Abstract/Business)"
}`,
    conversionPrompt: `Act as a **Senior React & Remotion Developer** specializing in high-fidelity 4K video rendering for commercial microstock.
You need to understand that Remotion renders videos frame-by-frame offline (using Puppeteer/Chrome). Therefore, any real-time browser features (like CSS @keyframes, transition, Date.now(), setInterval, or Math.random()) will cause severe synchronization bugs and frame-tearing in the final .mp4 export.

**OBJECTIVE:**
Convert the provided HTML/CSS/JS code into a single, production-grade Remotion component (.tsx). The visual output must be a 1:1 mirror of the original HTML, but entirely re-engineered for frame-locked rendering.

**0. ALLOWED IMPORTS RULE (CRITICAL):**
- You can import hooks/APIs from 'remotion':
  \`import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';\`
- If you need React hooks (like useRef, useEffect, useState, useMemo), import React and the hooks:
  \`import React, { useRef, useEffect, useState, useMemo } from 'react';\`
- If the original HTML uses Three.js, you MUST import THREE:
  \`import * as THREE from 'three';\`
- If the original HTML uses GSAP, you MUST import GSAP:
  \`import { gsap } from 'gsap';\`
- Do NOT import from any local files (e.g. './input', './utils', etc.) — these files do not exist.
- NEVER add any import other than the ones listed above.

**0.1 REACT INLINE STYLES camelCase RULE (CRITICAL):**
All style keys in JSX style objects (e.g., style={{ ... }}) MUST be camelCased. NEVER use hyphenated CSS properties as keys. For example: use 'boxShadow' instead of 'box-shadow', 'backgroundColor' instead of 'background-color', 'borderRadius' instead of 'border-radius', 'zIndex' instead of 'z-index', 'pointerEvents' instead of 'pointer-events', 'transformOrigin' instead of 'transform-origin', 'borderRight' instead of 'border-right', 'borderBottom' instead of 'border-bottom', 'borderLeft' instead of 'border-left', 'borderTop' instead of 'border-top', 'fontFamily' instead of 'font-family', 'fontSize' instead of 'font-size', 'lineHeight' instead of 'line-height', etc. Hyphenated keys are syntactically invalid inside JS objects and will crash the compiler.

**BANNED FUNCTIONS (WILL CAUSE RUNTIME CRASH — NEVER USE):**
- EasingEaseOut, EasingEaseIn, EasingEaseInOut — these do not exist in Remotion. Use Easing.out(Easing.quad), Easing.in(Easing.quad), Easing.inOut(Easing.quad).
- Valid Easing values: Easing.linear, Easing.ease, Easing.quad, Easing.cubic, Easing.sin, Easing.circle, Easing.exp, Easing.elastic(), Easing.back(), Easing.bounce, Easing.bezier(), Easing.in(), Easing.out(), Easing.inOut()
- CRITICAL: Remotion interpolate() options MUST use the property name \`easing\`, NEVER \`ease\`. Correct: \`interpolate(frame, [0, 30], [0, 1], { easing: Easing.out(Easing.quad) })\`. Incorrect and forbidden: \`{ ease: ... }\`.
- Date.now(), performance.now(), new Date() — BANNED, breaks deterministic frame rendering.
- Math.random() inside component render — BANNED. Pre-calculate outside the component into a static const array.
- setInterval(), setTimeout(), requestAnimationFrame() — BANNED.
- Any CSS @keyframes, CSS transition, CSS animation property — BANNED.

**1. Dynamic Identification:**
- Identify the main subject from the HTML and use it as the PascalCase component name (e.g., GlowingButton).

**1.1 Preserve All Elements (CRITICAL):**
- You must keep and translate ALL structural elements, divs, spans, SVGs, and textual content from the original HTML. Do NOT omit, delete, or skip any elements, styling layers, or decorative details present in the source code.

**2. Visual Parity & Animation (CRITICAL):**
- Motion Mirroring: Analyze the original CSS @keyframes. Map every percentage (0%, 50%, 100%) exactly into the inputRange of Remotion's interpolate() function.
- Easing Match: Translate CSS easing (e.g., ease-in-out) to the exact equivalent Remotion Easing API.
- Frame-Locked: ALL motion, opacity, and scale changes MUST be strictly driven by useCurrentFrame().

**2.1 THREE.JS / WEBGL CONVERSION GUIDELINES (CRITICAL FOR 3D):**
If the original HTML utilizes Three.js or WebGL:
- **Canvas Reference:** Use a React \`useRef\` to reference the canvas element: \`<canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />\`.
- **Initialization useEffect:** Initialize the Three.js \`Scene\`, \`PerspectiveCamera\`, \`WebGLRenderer\` (with \`{ canvas: canvasRef.current, antialias: true, alpha: true }\`), grids, lights, and meshes inside a single React \`useEffect\` with an empty dependency array (\`[]\`) to run once on mount. Store these instances in refs (e.g., \`sceneRef\`, \`cameraRef\`, \`rendererRef\`, and references to animated elements like grids or particle systems) so they are accessible on subsequent renders.
- **Dispose Cleanup:** Always return a cleanup function in the initialization \`useEffect\` that calls \`renderer.dispose()\` and disposes of all geometries and materials. This prevents WebGL memory leaks during multi-file batch renders.
- **Deterministic Render Effect:** Create a second \`useEffect\` keyed on the current frame: \`const frame = useCurrentFrame();\`. Inside this effect:
  1. Retrieve references to the scene, camera, renderer, and any animated objects.
  2. Compute simulated elapsed time from the frame: \`const elapsedTime = frame / fps;\` (retrieve \`fps\` from \`useVideoConfig()\`).
  3. Update animated properties (e.g. mesh rotation, positions, grid movement) using \`elapsedTime\` or \`frame\` deterministically (e.g., \`gridFloor.position.z = (elapsedTime * speed) % limit\`).
  4. Call \`renderer.render(scene, camera)\` manually to paint the new frame.
- **Never use \`requestAnimationFrame\` or \`clock.getElapsedTime()\`** (which rely on real-world time and break frame-by-frame rendering). All updates must be strictly computed from \`frame / fps\`.

**2.2 GSAP / CSS ANIMATIONS CONVERSION GUIDELINES:**
- For simple animations (opacity, position, scale, rotation, color transitions), map them directly to Remotion's \`interpolate()\` and \`Easing\` APIs.
- If GSAP is used in the HTML for complex timelines:
  1. Initialize the GSAP timeline paused in a React \`useEffect\` or \`useMemo\`: \`const tl = gsap.timeline({ paused: true });\`.
  2. Inside a \`useEffect\` keyed on \`frame\`, seek the timeline to the current time: \`tl.seek(frame / fps);\` or set progress: \`tl.progress(frame / totalFrames);\`.
  3. Never let GSAP animations run automatically with real-world timers.

**3. Deterministic Rendering:**
- Never use Math.random() inside the component render. Pre-calculate random elements (particles, positions, delays) in a static const array OUTSIDE the component function.

**4. FULLSCREEN 16:9 FILL (CRITICAL — NO BLACK BARS):**
- Define: const ORIGINAL_WIDTH = 1920; const ORIGINAL_HEIGHT = 1080;
- Inside the component: const { width, height, fps } = useVideoConfig();
- const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);
- The main wrapper div MUST have these exact styles: width: ORIGINAL_WIDTH, height: ORIGINAL_HEIGHT, position: 'absolute', top: '50%', left: '50%', transform: \`translate(-50%, -50%) scale(\${scaleFactor})\`, transformOrigin: 'center center', overflow: 'hidden'.
- NEVER multiply the scale by 0.85 or any value less than 1. The content MUST fill the entire 1920x1080 canvas edge-to-edge with NO black borders, NO margins, NO padding around the outer frame.
- If the original HTML content does NOT naturally fill 1920x1080 (e.g. it was designed for a smaller viewport like 800x600 or uses centered content with empty space), you MUST adapt it: scale up the inner elements, stretch backgrounds to cover, reposition elements to use the full canvas. The final output must look like a fullscreen 16:9 video with ZERO empty/black space.
- All background colors, gradients, and patterns MUST extend to cover the entire 1920x1080 area. Use 'backgroundSize: cover' or explicit width/height: '100%' on background layers.

**5. Absolute Seamless Looping & Duration (CRITICAL):**
- The animation MUST loop seamlessly and exactly match a duration of {{ANIMATION_DURATION}} seconds ({{DURATION_FRAMES}} frames at {{FPS}}fps).
- Set the component's duration/cycles to fit this {{ANIMATION_DURATION}}-second window.
- Apply const localFrame = frame % (fps * cycleDuration) for each element to loop perfectly.
- Symmetrical Interpolation: First and last value in every interpolate() output MUST be identical for seamless looping.

**6. Clean Visuals (NO WATERMARK OVERLAYS):**
- Do NOT add any new text overlays, badges, or watermark tags that represent the video's microstock title or keywords (e.g. do not display the SEO metadata title generated for the file).
- Crucially, you MUST PRESERVE all original text, typography, headings, buttons, and content elements from the provided HTML. Do NOT delete any content or elements that are part of the original HTML design, as this will break the visual styling and layout. Only avoid injecting *new* external metadata text as overlays.

**7. Output Structure:**
- Provide ONLY the raw .tsx file content — no markdown fences, no explanation text.
- The main component MUST have \`export default ComponentName;\` as the LAST line.
- Add a comment \`// END_OF_FILE\` at the very last line of the file.

HERE IS THE HTML TO CONVERT:

{{HTML_CONTENT}}

OUTPUT: Start directly with the import line. No markdown. No explanation.`
  };
}

// Helper to strip script tags from HTML to reduce token counts in prompt
function stripScripts(html) {
  if (!html) return "";
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "\n<!-- [Script block removed for token size reduction] -->\n");
}

// Helper: Jalankan job batch di background secara sekuensial
// Helper: Jalankan job batch di background secara sekuensial (Digantikan oleh sistem Queue)
async function executeSingleTask(itemId) {
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    console.error("Gagal membaca DB untuk task execution:", e);
  }
  
  const item = items.find(i => i.id === itemId);
  if (!item) {
    activeTasks.delete(itemId);
    processQueue();
    return;
  }

  // Jika statusnya sudah cancelled sebelum mulai, langsung skip
  if (item.statusConvertTsx === 'cancelled') {
    activeTasks.delete(itemId);
    processQueue();
    return;
  }

  // Buat AbortController untuk task ini
  const controller = new AbortController();
  abortControllers[itemId] = controller;
  const signal = controller.signal;

  try {
    // 1. Update status ke processing-tsx
    item.statusConvertTsx = 'processing-tsx';
    saveOrUpdateItem(item);
    
    // Inisialisasi logs memori jika belum ada
    if (!taskLogs[itemId]) {
      taskLogs[itemId] = item.logs || [];
    }
    addTaskLog(itemId, "Memulai pemrosesan task...", "info");

    // Simpan file HTML asli ke lokal secara fisik
    const htmlLocalPath = path.join(__dirname, "public", "saved-code", `${itemId}.html`);
    fs.writeFileSync(htmlLocalPath, item.htmlPreview);
    addTaskLog(itemId, `HTML asli disimpan secara lokal di /saved-code/${itemId}.html`, "info");

    const promptsData = loadPromptsConfig();

    // 2. Generate SEO Metadata (hanya jika belum ada)
    if (item.judul && item.keywords) {
      addTaskLog(itemId, `Menggunakan metadata SEO yang sudah ada. Judul: "${item.judul}"`, "info");
    } else {
      addTaskLog(itemId, "Menghasilkan metadata SEO via AI...", "info");
      const cleanHtml = stripScripts(item.htmlPreview);
      const seoPrompt = promptsData.seoPrompt.replace("{{HTML_CONTENT}}", cleanHtml);

      // Jalankan callAI dengan pembatalan (abortable)
      let aiResponse = "";
      try {
        aiResponse = await runAbortable(callAIWithFallback(seoPrompt, { preferModel: (!item.aiModel || item.aiModel === 'auto') ? '9router' : item.aiModel, signal, taskId: itemId }), signal);
      } catch (err) {
        throw new Error(`Gagal menghasilkan metadata SEO: ${err.message}`);
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

      item.judul = seoData.judul;
      item.keywords = seoData.keywords;
      item.deskripsi = seoData.deskripsi;
      item.kategori = seoData.kategori;
      
      const { adobeCat, shutterCat, shutterCat2 } = normalizeCategories(seoData);
      item.adobeCategory = adobeCat;
      item.shutterstockCategory = shutterCat;
      item.shutterstockCategory2 = shutterCat2;

      item.seoAiUsed = item.aiModel || 'auto';
      item._isGeneratingSeo = true;
      saveOrUpdateItem(item);
      delete item._isGeneratingSeo;

      addTaskLog(itemId, `Metadata SEO berhasil disesuaikan oleh AI. Judul: "${seoData.judul}"`, "success");
    }

    // 2.5. Analisis HTML untuk konfigurasi video (loop, solid, durasi, fps)
    addTaskLog(itemId, "Menganalisis HTML untuk konfigurasi video optimal...", "info");
    try {
      const cleanHtmlForAnalysis = stripScripts(item.htmlPreview);
      const analysisPrompt = `Analyze this HTML/CSS/JS code and determine the optimal video configuration for microstock sale. Output ONLY a valid JSON object (no markdown, no explanation):
{
  "loop": true or false (true if the animation is designed to loop seamlessly like backgrounds, patterns, particles; false if it has a clear start/end like UI interactions, text reveals, progress bars),
  "transparent": true or false (true ONLY if the HTML explicitly uses transparent/alpha background; false for solid color or gradient backgrounds),
  "duration": optimal duration in seconds from [5, 8, 10, 12, 15, 20, 30] (shorter for UI interactions/buttons, longer for backgrounds/patterns),
  "fps": 30 or 60 (60 only if the animation has fast motion, particles, or smooth high-speed movement; 30 for most cases)
}

HTML:
${cleanHtmlForAnalysis.substring(0, 3000)}`;

      const analysisResponse = await runAbortable(
        callAIWithFallback(analysisPrompt, { preferModel: item.aiModel || 'auto', taskId: itemId }),
        signal
      );

      let analysisText = analysisResponse.trim();
      if (analysisText.startsWith("```json")) {
        analysisText = analysisText.split("```json")[1].split("```")[0].trim();
      } else if (analysisText.includes("```")) {
        analysisText = analysisText.split("```")[1].split("```")[0].trim();
      }
      analysisText = analysisText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      const config = JSON.parse(analysisText);

      // Only apply AI values if user hasn't manually configured video settings
      if (!item._userSetVideoConfig) {
        if (config.loop !== undefined) {
          item.loop = config.loop === true || config.loop === 'true';
        }
        if (config.transparent !== undefined) {
          item.transparent = config.transparent === true || config.transparent === 'true';
        }
        if (config.duration !== undefined) {
          const parsedDur = Number(config.duration);
          if ([5, 8, 10, 12, 15, 20, 30].includes(parsedDur)) {
            item.animationDuration = parsedDur;
          }
        }
        if (config.fps !== undefined) {
          const parsedFps = Number(config.fps);
          if ([30, 60].includes(parsedFps)) {
            item.fps = parsedFps;
          }
        }
      } else {
        addTaskLog(itemId, "Menggunakan konfigurasi video yang diatur manual oleh user.", "info");
      }

      // Recalculate durationInFrames
      const calcFps = item.fps || 30;
      const calcDur = item.animationDuration || 10;
      item.durationInFrames = calcDur * calcFps;
      saveOrUpdateItem(item);

      addTaskLog(itemId, `Konfigurasi video: Loop=${item.loop ? 'Ya' : 'Tidak'}, Background=${item.transparent ? 'Transparan' : 'Solid'}, Durasi=${item.animationDuration}s, FPS=${item.fps || 30}`, "success");
    } catch (analysisErr) {
      addTaskLog(itemId, `Analisis konfigurasi video gagal (${analysisErr.message}), menggunakan default: 10s, 30fps, loop, solid`, "warning");
      if (!item.animationDuration) item.animationDuration = 10;
      if (!item.fps) item.fps = 30;
      if (!item.durationInFrames) item.durationInFrames = (item.animationDuration || 10) * (item.fps || 30);
      if (item.loop === undefined) item.loop = true;
      if (item.transparent === undefined) item.transparent = false;
      saveOrUpdateItem(item);
    }

    // 3. Konversi HTML ke TSX
    addTaskLog(itemId, "Mengonversi HTML ke kode Remotion TSX...", "info");
    const animationDuration = item.animationDuration || 10;
    const durationFrames = item.durationInFrames || 300;
    const fps = item.fps || 30;

    const conversionPrompt = promptsData.conversionPrompt
      .replace(/{{ANIMATION_DURATION}}/g, String(animationDuration))
      .replace(/{{DURATION_FRAMES}}/g, String(durationFrames))
      .replace(/{{FPS}}/g, String(fps))
      .replace(/{{HTML_CONTENT}}/g, item.htmlPreview);

    let tsxResponse = "";
    let tsxAttempts = 0;
    const MAX_TSX_ATTEMPTS = 3;

    const tsxValidator = (text) => {
      if (!text || !text.trim()) return false;
      
      // Ekstrak blok kode jika dibungkus markdown backticks
      let code = text.trim();
      if (code.includes("```typescript")) {
        code = code.split("```typescript")[1].split("```")[0].trim();
      } else if (code.includes("```tsx")) {
        code = code.split("```tsx")[1].split("```")[0].trim();
      } else if (code.includes("```")) {
        const parts = code.split("```");
        if (parts.length >= 3) {
          code = parts[1].trim();
        }
      }

      if (!code.includes('export default')) return false;

      // Hitung balance kurung kurawal {} untuk mendeteksi kode yang terpotong (truncated)
      let curly = 0;
      for (const ch of code) {
        if (ch === '{') curly++;
        else if (ch === '}') curly--;
      }
      
      // Kita abaikan pembanding angle brackets (< dan >) karena sering dipakai
      // sebagai operator perbandingan matematik (i < 10) atau generics dalam TypeScript
      if (Math.abs(curly) > 5) return false;
      return true;
    };


    while (tsxAttempts < MAX_TSX_ATTEMPTS) {
      if (signal.aborted) throw new Error("Cancelled by user");
      tsxAttempts++;
      addTaskLog(itemId, `Mencoba generate TSX (percobaan ke-${tsxAttempts})...`, "info");
      try {
        tsxResponse = await runAbortable(
          callAIWithFallback(conversionPrompt, { 
            preferModel: (!item.aiModel || item.aiModel === 'auto') ? 'syntx-gemini' : item.aiModel,
            validator: tsxValidator,
            taskId: itemId
          }),
          signal
        );
        break; // sukses
      } catch (err) {
        addTaskLog(itemId, `Percobaan ${tsxAttempts} gagal: ${err.message?.substring(0, 100)}`, "warning");
        if (tsxAttempts >= MAX_TSX_ATTEMPTS) {
          throw new Error(`Semua ${MAX_TSX_ATTEMPTS} percobaan AI gagal untuk TSX Conversion: ${err.message}`);
        }
        await new Promise((r, reject) => {
          const tm = setTimeout(r, 2000);
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(tm);
              reject(new Error("Cancelled by user"));
            });
          }
        });
      }
    }

    let tsxCode = tsxResponse.trim();
    if (tsxCode.startsWith("```typescript") || tsxCode.startsWith("```tsx")) {
      const parts = tsxCode.split("```");
      tsxCode = parts[1].split("\n").slice(1).join("\n").split("```")[0].trim();
    } else if (tsxCode.startsWith("```")) {
      tsxCode = tsxCode.split("```")[1].split("```")[0].trim();
    }

    const repairedTsxCode = repairGeneratedTsx(tsxCode);
    if (repairedTsxCode !== tsxCode) {
      addTaskLog(itemId, "Auto-repair TSX: mengganti opsi Remotion yang tidak valid (mis. ease -> easing).", "info");
      tsxCode = repairedTsxCode;
    }

    // Validasi lokal sebelum push
    if (!tsxValidator(tsxCode)) {
      throw new Error('TSX yang dihasilkan tidak valid (bracket tidak balance atau tidak ada export default). Batalkan.');
    }

    // --- AUTOMATED TSX COMPILATION CHECK ---
    addTaskLog(itemId, "Melakukan pemeriksaan kompilasi TSX lokal menggunakan TypeScript compiler...", "info");
    fs.writeFileSync("src/Composition.tsx", tsxCode);
    try {
      execSync("npx tsc --noEmit --noUnusedLocals false --noUnusedParameters false", { stdio: "pipe" });
      addTaskLog(itemId, "✅ Pemeriksaan kompilasi sukses! Kode valid.", "success");
    } catch (tscErr) {
      const errMsg = tscErr.stdout ? tscErr.stdout.toString() : tscErr.message;
      console.error("TypeScript compilation failed:\n", errMsg);
      const formattedErrors = errMsg.split('\n').filter(line => line.includes('error TS')).slice(0, 5).join('\n');
      throw new Error(`TypeScript compilation failed:\n${formattedErrors || errMsg.substring(0, 200)}`);
    }
    // --- END OF AUTOMATED TSX COMPILATION CHECK ---

    item.promptCode = tsxCode;
    saveOrUpdateItem(item);

    // Simpan file TSX lokal secara fisik di public/saved-code/<id>.tsx
    const tsxLocalPath = path.join(__dirname, "public", "saved-code", `${itemId}.tsx`);
    fs.writeFileSync(tsxLocalPath, tsxCode);
    addTaskLog(itemId, `File TSX disimpan secara lokal di /saved-code/${itemId}.tsx`, "info");

    addTaskLog(itemId, `Konversi HTML ke TSX berhasil! Kode disimpan di /saved-code/${itemId}.tsx`, "success");
    
    // Auto-trigger rendering preview immediately
    addTaskLog(itemId, "Menjalankan render preview otomatis ke Cloud...", "info");
    item.statusConvertTsx = 'processing-preview';
    saveOrUpdateItem(item);

    runPreviewRenderBackground(itemId).catch(err => {
      console.error(`Error in auto runPreviewRenderBackground for ${itemId}:`, err);
    });

  } catch (err) {
    if (err.message === "Cancelled by user" || signal.aborted) {
      item.statusConvertTsx = 'cancelled';
      addTaskLog(itemId, "Proses dibatalkan oleh pengguna.", "warning");
    } else {
      item.statusConvertTsx = 'failed';
      addTaskLog(itemId, `Gagal memproses task: ${err.message}`, "error");
    }
    saveOrUpdateItem(item);
  } finally {
    delete abortControllers[itemId];
    activeTasks.delete(itemId);
    
    // Kirim event selesai ke SSE clients individual
    if (taskSseClients[itemId]) {
      taskSseClients[itemId].forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'done', message: 'Task selesai' })}\n\n`);
        client.end();
      });
      delete taskSseClients[itemId];
    }

    processQueue();
  }
}

async function waitForRenderSingle(id, renderType, signal) {
  const startTime = Date.now();
  const timeoutMs = 20 * 60 * 1000; // 20 menit timeout

  while (Date.now() - startTime < timeoutMs) {
    if (signal && signal.aborted) return null;

    const finalFilename = renderType === "preview" ? `${id}-preview.mp4` : `${id}-4k.mov`;
    const legacyFilename = renderType === "preview" ? `${id}.mp4` : `${id}_4k.mov`;
    const finalPath = renderType === "preview"
      ? path.join(__dirname, "public", "previews", finalFilename)
      : path.join(__dirname, "out", finalFilename);
    const legacyPath = renderType === "preview"
      ? path.join(__dirname, "public", "previews", legacyFilename)
      : path.join(__dirname, "out", legacyFilename);

    if (fs.existsSync(finalPath)) {
      addTaskLog(id, `Video preview untuk ${id} berhasil ditemukan secara lokal!`, 'success');
      return renderType === "preview" ? `/previews/${finalFilename}` : `/out/${finalFilename}`;
    }
    if (fs.existsSync(legacyPath)) {
      addTaskLog(id, `Video preview untuk ${id} berhasil ditemukan secara lokal!`, 'success');
      return renderType === "preview" ? `/previews/${legacyFilename}` : `/out/${legacyFilename}`;
    }

    try {
      const statusResult = await checkGithubRenderStatusInternal(id, renderType);
      if (statusResult.status === 'success') {
        addTaskLog(id, `Video preview untuk ${id} berhasil didapat dari GitHub!`, 'success');
        return statusResult.url;
      } else if (statusResult.status === 'failed') {
        throw new Error(statusResult.error || 'Workflow failed');
      } else {
        addTaskLog(id, `Status render GitHub: ${statusResult.status} (${statusResult.progress || 'menunggu runner'})...`, 'info');
      }
    } catch (err) {
      // Re-throw workflow failures immediately instead of looping forever
      if (err.message && (err.message.includes('Workflow failed') || err.message.includes('fail') || err.message.includes('failure') || err.message === 'Cancelled by user')) {
        throw err;
      }
      addTaskLog(id, `Informasi status render: ${err.message}`, 'info');
    }

    // Tunggu 15 detik sebelum mengecek ulang, dengan dukungan abort signal
    await new Promise((resolve, reject) => {
      const tm = setTimeout(resolve, 15000);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(tm);
          reject(new Error("Cancelled by user"));
        });
      }
    });
  }
  throw new Error("Timeout rendering video di GitHub Actions.");
}

function enqueueTask({ id, fileName, htmlContent, loop, transparent, aiModel, animationDuration, fps }) {
  const targetFps = Number(fps) || 30;
  const durationFrames = (Number(animationDuration) || 10) * targetFps;

  const itemData = {
    id: id,
    fileName: fileName,
    judul: "",
    keywords: "",
    deskripsi: "",
    kategori: "",
    durationInFrames: durationFrames,
    animationDuration: Number(animationDuration) || 10,
    fps: targetFps,
    htmlPreview: htmlContent,
    loop: !!loop,
    transparent: !!transparent,
    aiModel: aiModel,
    statusConvertTsx: 'waiting', // status awal menunggu
    statusRender4k: 'idle',
    previewUrl: '',
    outputPath4k: '',
    createdAt: new Date().toISOString(),
    logs: [{ message: "Ditambahkan ke daftar. Menunggu tombol Mulai...", type: "info", time: new Date().toLocaleTimeString('id-ID') }]
  };

  saveOrUpdateItem(itemData);

  // Daftarkan ke memori logs
  taskLogs[id] = [...itemData.logs];

  // Jangan masukkan ke antrean secara otomatis agar user dapat mengklik Mulai
  
  return id;
}

function processQueue() {
  console.log(`[Queue] Checking queue... Active: ${activeTasks.size}/${MAX_CONCURRENT_TASKS}, Queue length: ${taskQueue.length}`);
  
  while (activeTasks.size < MAX_CONCURRENT_TASKS && taskQueue.length > 0) {
    const nextItemId = taskQueue.shift();
    activeTasks.add(nextItemId);
    
    console.log(`[Queue] Starting task: ${nextItemId}`);
    
    // Jalankan secara asinkron di latar belakang
    executeSingleTask(nextItemId).catch(err => {
      console.error(`[Queue] Fatal error executing task ${nextItemId}:`, err);
    });
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
          fps: String(item.fps || 30),
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
  const { files, loop, transparent, aiModel, animationDuration, fps } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "Data batch file tidak valid atau kosong" });
  }

  const enqueuedIds = [];
  for (const file of files) {
    const baseName = path.basename(file.name, '.html');
    const sanitizedId = baseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    enqueueTask({
      id: sanitizedId,
      fileName: file.name,
      htmlContent: file.content,
      loop,
      transparent,
      aiModel,
      animationDuration,
      fps
    });
    enqueuedIds.push(sanitizedId);
  }

  res.json({ success: true, ids: enqueuedIds });
});

// POST: Generate dari paste kode HTML langsung
app.post("/api/paste-html", (req, res) => {
  const { id, htmlContent, loop, transparent, aiModel, animationDuration, fps } = req.body;
  if (!htmlContent || !htmlContent.trim()) {
    return res.status(400).json({ error: "Konten HTML kosong" });
  }

  // Generate kustom ID jika tidak diisi
  let targetId = id ? id.trim() : "";
  if (!targetId) {
    targetId = "paste_" + Math.random().toString(36).substring(2, 10);
  }
  const sanitizedId = targetId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  enqueueTask({
    id: sanitizedId,
    fileName: sanitizedId + ".html",
    htmlContent,
    loop,
    transparent,
    aiModel,
    animationDuration,
    fps
  });

  res.json({ success: true, id: sanitizedId });
});

// POST: Retry task yang gagal / dibatalkan
app.post("/api/retry-task/:id", (req, res) => {
  const { id } = req.params;
  const { aiModel, animationDuration, fps } = req.body;

  // Baca item dari DB
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    return res.status(500).json({ error: "Gagal membaca database" });
  }

  const item = items.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: `Item ${id} tidak ditemukan` });
  }

  // Hanya izinkan jika tidak sedang aktif berjalan
  if (taskQueue.includes(id) || activeTasks.has(id) || item.statusConvertTsx === 'queued' || item.statusConvertTsx === 'processing-tsx' || item.statusConvertTsx === 'processing-preview') {
    return res.status(400).json({ error: "Task sedang berjalan atau mengantre" });
  }

  console.log(`🔄 Mengantrekan ulang task: ${id}`);

  // Reset status and logs (preserving old ones)
  item.statusConvertTsx = 'queued';
  item.previewUrl = '';
  item.promptCode = '';
  if (aiModel) item.aiModel = aiModel;
  if (req.body.loop !== undefined) item.loop = !!req.body.loop;
  if (req.body.transparent !== undefined) item.transparent = !!req.body.transparent;
  const targetFps = Number(fps) || item.fps || 30;
  item.fps = targetFps;
  if (animationDuration) {
    item.animationDuration = Number(animationDuration);
    item.durationInFrames = Number(animationDuration) * targetFps;
  }

  if (!item.logs) item.logs = [];
  const timeStr = new Date().toLocaleTimeString('id-ID');
  item.logs.push({ message: `=================================`, type: "info", time: timeStr });
  item.logs.push({ message: `🔄 Mengulang proses (Retry) dengan AI: ${item.aiModel || 'auto'}`, type: "info", time: timeStr });
  item.lastLogMessage = "Mengulang proses...";

  // Simpan ke DB
  saveOrUpdateItem(item);

  // Inisialisasi logs memori
  taskLogs[id] = [...item.logs];

  // Masukkan ke antrean
  taskQueue.push(id);
  processQueue();

  res.json({ success: true, id });
});

// POST: Batalkan task pemrosesan
app.post("/api/cancel-task/:id", (req, res) => {
  const { id } = req.params;
  
  // 1. Cek di database
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    return res.status(500).json({ error: "Gagal membaca database" });
  }

  const item = items.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: `Item ${id} tidak ditemukan` });
  }

  // Cek apakah item masih dalam status yang bisa dibatalkan
  if (item.statusConvertTsx !== 'queued' && item.statusConvertTsx !== 'processing-tsx' && item.statusConvertTsx !== 'processing-preview') {
    return res.status(400).json({ error: "Task tidak sedang berjalan atau mengantre" });
  }

  // 2. Jika di antrean pending
  const queueIndex = taskQueue.indexOf(id);
  if (queueIndex !== -1) {
    taskQueue.splice(queueIndex, 1);
    addTaskLog(id, "Dibatalkan saat berada di antrean pending.", "warning");
    item.statusConvertTsx = 'cancelled';
    saveOrUpdateItem(item);
    return res.json({ success: true, message: "Task antrean berhasil dibatalkan" });
  }

  // 3. Jika sedang diproses secara aktif
  if (activeTasks.has(id)) {
    if (abortControllers[id]) {
      abortControllers[id].abort(); // Picu abort signal
      addTaskLog(id, "Meminta pembatalan proses...", "warning");
      // executeSingleTask catch block akan mengurus perubahan status ke cancelled dan trigger processQueue
      return res.json({ success: true, message: "Proses task sedang dibatalkan" });
    }
  }

  // Fallback pengaman jika status gantung di DB
  item.statusConvertTsx = 'cancelled';
  saveOrUpdateItem(item);
  res.json({ success: true, message: "Status task direset ke cancelled" });
});

// GET: Stream SSE log per task/item
app.get("/api/task-logs/:id", (req, res) => {
  const { id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Kirim log-log yang sudah ada di memori atau DB
  let existingLogs = taskLogs[id] || [];
  if (existingLogs.length === 0) {
    try {
      const dbPath = path.join(__dirname, "saved-items.json");
      const data = fs.readFileSync(dbPath, "utf-8");
      const items = JSON.parse(data);
      const item = items.find(i => i.id === id);
      if (item && item.logs) {
        existingLogs = item.logs;
        taskLogs[id] = [...item.logs];
      }
    } catch (e) {
      console.error("Gagal mengambil histori log dari DB:", e);
    }
  }

  existingLogs.forEach(log => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // Cek status pengerjaan saat ini. Jika sudah selesai dan tidak sedang dalam regenerasi SEO, tutup stream
  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    const data = fs.readFileSync(dbPath, "utf-8");
    const items = JSON.parse(data);
    const item = items.find(i => i.id === id);
    const isRunning = activeSeoGenerations[id] || 
                      activePreviewRenders[id] || 
                      active4kRenders[id] ||
                      (item && (item.statusConvertTsx === 'queued' || item.statusConvertTsx === 'processing-tsx' || item.statusConvertTsx === 'processing-preview'));
    if (!isRunning && item && (item.statusConvertTsx === 'success' || item.statusConvertTsx === 'failed' || item.statusConvertTsx === 'cancelled' || item.statusConvertTsx === 'waiting' || item.statusConvertTsx === 'waiting-preview')) {
      res.write(`data: ${JSON.stringify({ type: 'done', message: 'Task selesai' })}\n\n`);
      res.end();
      return;
    }
  } catch (e) {}

  if (!taskSseClients[id]) {
    taskSseClients[id] = [];
  }
  taskSseClients[id].push(res);

  req.on('close', () => {
    if (taskSseClients[id]) {
      taskSseClients[id] = taskSseClients[id].filter(c => c !== res);
    }
  });
});

// GET: Hubungkan stream SSE untuk log batch (backward compatibility)
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

// Helper untuk memproses Render Preview di background secara asinkron
async function runPreviewRenderBackground(itemId) {
  activePreviewRenders[itemId] = true;
  
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    console.error("Gagal membaca database di runPreviewRenderBackground", e);
    delete activePreviewRenders[itemId];
    return;
  }
  const item = items.find(i => i.id === itemId);
  if (!item) {
    delete activePreviewRenders[itemId];
    return;
  }

  if (!taskLogs[itemId]) {
    taskLogs[itemId] = item.logs || [];
  }

  addTaskLog(itemId, `=================================`, "info");
  addTaskLog(itemId, `☁️ Memulai proses Render Preview (Cloud)...`, "info");

  try {
    addTaskLog(itemId, "Mengantrekan operasi Git Push untuk sinkronisasi kode ke GitHub...", "info");
    
    await runGitTask(async () => {
      addTaskLog(itemId, "Sinkronisasi repository dari GitHub...", "info");
      try {
        execSync("git pull origin main --rebase", { stdio: "inherit" });
      } catch (pullErr) {
        console.error("Gagal melakukan git pull:", pullErr.message);
      }

      addTaskLog(itemId, "Mulai menulis src/Composition.tsx...", "info");
      fs.writeFileSync("src/Composition.tsx", item.promptCode);
      const compSafety = fs.readFileSync("src/Composition.tsx", "utf-8").trim();
      if (!compSafety) throw new Error("src/Composition.tsx kosong setelah write!");
      if (compSafety.length < 100) addTaskLog(itemId, `⚠️ src/Composition.tsx hanya ${compSafety.length} karakter`, "warning");

      execSync("git add src/Composition.tsx", { stdio: "inherit" });
      try {
        execSync(`git commit -m "Render Preview: ${itemId}"`, { stdio: "inherit" });
      } catch (e) {
        // No changes is fine
      }
      execSync("git push origin main", { stdio: "inherit" });

      const sha = execSync("git rev-parse HEAD").toString().trim();
      addTaskLog(itemId, `Kode berhasil didorong ke GitHub. Commit SHA: ${sha}`, "success");

      addTaskLog(itemId, "Memicu workflow rendering preview di GitHub Actions...", "info");
      const workflowFile = "render-preview.yml";
      const workflowDispatchUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`;

      await axios.post(
        workflowDispatchUrl,
        {
          ref: "main",
          inputs: {
            commit_sha: sha,
            composition_id: itemId,
            duration_frames: String(item.durationInFrames || 300),
            fps: String(item.fps || 30),
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

      const trackingKey = `${itemId}_preview`;
      gitRuns[trackingKey] = {
        sha: sha,
        status: "triggered",
        runId: null,
        triggeredAt: Date.now(),
        workflowFile: workflowFile
      };
    });

    addTaskLog(itemId, "Menunggu proses rendering video preview di GitHub Actions...", "info");
    const fileUrl = await waitForRenderSingle(itemId, 'preview');
    if (fileUrl) {
      // Ambil data terbaru untuk mencegah overwrite
      const dataFresh = fs.readFileSync(dbPath, "utf-8");
      const itemsFresh = JSON.parse(dataFresh);
      const itemFresh = itemsFresh.find(i => i.id === itemId);
      
      itemFresh.previewUrl = fileUrl;
      itemFresh.statusConvertTsx = 'success';
      saveOrUpdateItem(itemFresh);
      addTaskLog(itemId, `Video preview selesai diproses! URL: ${fileUrl}`, "success");
    } else {
      throw new Error("Rendering cloud gagal.");
    }
  } catch (err) {
    const dataFresh = fs.readFileSync(dbPath, "utf-8");
    const itemsFresh = JSON.parse(dataFresh);
    const itemFresh = itemsFresh.find(i => i.id === itemId);
    
    // Only mark as failed if this render is still the active one (prevents race condition with retries)
    if (itemFresh && itemFresh.statusConvertTsx === 'processing-preview') {
      itemFresh.statusConvertTsx = 'failed';
      saveOrUpdateItem(itemFresh);
      addTaskLog(itemId, `Gagal merender preview: ${err.message}`, "error");
    } else {
      console.log(`⚠️ Skipping status update for ${itemId}: status is ${itemFresh?.statusConvertTsx}, not processing-preview`);
    }
  } finally {
    delete activePreviewRenders[itemId];
    
    if (taskSseClients[itemId]) {
      taskSseClients[itemId].forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'done', message: 'Render Preview selesai' })}\n\n`);
        client.end();
      });
      delete taskSseClients[itemId];
    }
  }
}

// Helper function to compare visual similarity of first and last frames of a composition
async function comparePngs(path1, path2) {
  let browser;
  try {
    const { chromium } = require("playwright");
    // Read files as base64
    const img1Base64 = fs.readFileSync(path1).toString("base64");
    const img2Base64 = fs.readFileSync(path2).toString("base64");

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Use page.evaluate to compare the images using canvas
    const result = await page.evaluate(async ({ img1, img2 }) => {
      return new Promise((resolve, reject) => {
        const loadImage = (base64) => {
          return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = "data:image/png;base64," + base64;
          });
        };

        Promise.all([loadImage(img1), loadImage(img2)]).then(([i1, i2]) => {
          const w = i1.width;
          const h = i1.height;
          
          const canvas1 = document.createElement("canvas");
          canvas1.width = w;
          canvas1.height = h;
          const ctx1 = canvas1.getContext("2d");
          ctx1.drawImage(i1, 0, 0);
          const data1 = ctx1.getImageData(0, 0, w, h).data;

          const canvas2 = document.createElement("canvas");
          canvas2.width = w;
          canvas2.height = h;
          const ctx2 = canvas2.getContext("2d");
          ctx2.drawImage(i2, 0, 0);
          const data2 = ctx2.getImageData(0, 0, w, h).data;

          let diffPixels = 0;
          let totalDiff = 0;
          const totalPixels = w * h;

          for (let i = 0; i < data1.length; i += 4) {
            const rDiff = Math.abs(data1[i] - data2[i]);
            const gDiff = Math.abs(data1[i+1] - data2[i+1]);
            const bDiff = Math.abs(data1[i+2] - data2[i+2]);
            const aDiff = Math.abs(data1[i+3] - data2[i+3]);

            const colorDiff = (rDiff + gDiff + bDiff + aDiff) / 4;
            totalDiff += colorDiff;

            if (rDiff > 15 || gDiff > 15 || bDiff > 15 || aDiff > 15) {
              diffPixels++;
            }
          }

          const isImageBlank = (data) => {
            const firstR = data[0];
            const firstG = data[1];
            const firstB = data[2];
            const firstA = data[3];
            for (let i = 0; i < data.length; i += 4) {
              if (data[i] !== firstR || data[i+1] !== firstG || data[i+2] !== firstB || data[i+3] !== firstA) {
                return false;
              }
            }
            return true;
          };

          const isBlank = isImageBlank(data1) && isImageBlank(data2);
          const percentDiff = (diffPixels / totalPixels) * 100;
          const avgPercentDiff = (totalDiff / (totalPixels * 255)) * 100;
          const similarity = 100 - avgPercentDiff;

          resolve({
            similarity: Number(similarity.toFixed(2)),
            percentDiff: Number(percentDiff.toFixed(2)),
            seamless: similarity >= 85 && percentDiff <= 15,
            blank: isBlank
          });
        }).catch(reject);
      });
    }, { img1: img1Base64, img2: img2Base64 });

    return result;
  } catch (err) {
    console.error("Gagal melakukan perbandingan visual", err);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Helper untuk memproses Render 4K di background secara asinkron
async function run4kRenderBackground(itemId) {
  active4kRenders[itemId] = true;
  
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    console.error("Gagal membaca database di run4kRenderBackground", e);
    delete active4kRenders[itemId];
    return;
  }
  const item = items.find(i => i.id === itemId);
  if (!item) {
    delete active4kRenders[itemId];
    return;
  }

  if (!taskLogs[itemId]) {
    taskLogs[itemId] = item.logs || [];
  }

  addTaskLog(itemId, `=================================`, "info");
  addTaskLog(itemId, `🚀 Memulai proses Render 4K ProRes (Cloud)...`, "info");

  try {
    await runGitTask(async () => {
      addTaskLog(itemId, "Sinkronisasi repository dari GitHub...", "info");
      try {
        execSync("git pull origin main --rebase", { stdio: "inherit" });
      } catch (pullErr) {
        console.error("Gagal melakukan git pull:", pullErr.message);
      }

      addTaskLog(itemId, "Mulai menulis src/Composition.tsx...", "info");
      fs.writeFileSync("src/Composition.tsx", item.promptCode);
      const compSafety = fs.readFileSync("src/Composition.tsx", "utf-8").trim();
      if (!compSafety) throw new Error("src/Composition.tsx kosong setelah write!");
      if (compSafety.length < 100) addTaskLog(itemId, `⚠️ src/Composition.tsx hanya ${compSafety.length} karakter`, "warning");

      // --- AUTOMATED QC VISUAL LOOP CHECK ---
      const frame0Path = path.join(__dirname, `out/temp-0-${itemId}.png`);
      const frameLastPath = path.join(__dirname, `out/temp-last-${itemId}.png`);
      const localProps = {
        width: 1920,
        height: 1080,
        durationInFrames: Number(item.durationInFrames) || 300,
        fps: Number(item.fps) || 30,
        judul: item.judul || "Stock Video",
        keywords: item.keywords || "motion, abstract, loop"
      };
      const localPropsPath = path.join(__dirname, `out/temp-props-${itemId}.json`);
      const lastFrame = localProps.durationInFrames - 1;

      addTaskLog(itemId, "Melakukan QC Visual Loop: Merender frame pertama dan terakhir secara lokal...", "info");
      
      let renderSuccess = false;
      try {
        fs.writeFileSync(localPropsPath, JSON.stringify(localProps, null, 2));
        execSync(`npx remotion render Composition "${frame0Path}" --frame=0 --scale=0.1 --props="${localPropsPath}" --overwrite`, { stdio: 'inherit' });
        execSync(`npx remotion render Composition "${frameLastPath}" --frame=${lastFrame} --scale=0.1 --props="${localPropsPath}" --overwrite`, { stdio: 'inherit' });
        renderSuccess = true;
      } catch (renderError) {
        console.error("Gagal merender frame QC:", renderError);
        addTaskLog(itemId, `⚠️ QC Loop Warning: Gagal merender frame preview lokal untuk QC: ${renderError.message}. Melanjutkan render...`, "warning");
      }

      if (renderSuccess) {
        try {
          addTaskLog(itemId, "QC Loop: Membandingkan kemiripan visual frame pertama dan terakhir...", "info");
          const qcResult = await comparePngs(frame0Path, frameLastPath);
          if (qcResult) {
            if (qcResult.blank) {
              addTaskLog(itemId, `⚠️ QC Loop Warning: Gagal memvalidasi loop karena render frame kosong (kemungkinan kendala WebGL headless pada host).`, "warning");
            } else if (qcResult.similarity >= 85) {
              addTaskLog(itemId, `✅ QC Loop Sukses: Kemiripan visual frame pertama dan terakhir ${qcResult.similarity}%. Loop terdeteksi mulus/seamless.`, "success");
            } else {
              addTaskLog(itemId, `⚠️ QC Loop Warning: Kemiripan visual frame pertama dan terakhir hanya ${qcResult.similarity}%. Loop mungkin tidak seamless.`, "warning");
            }
          }
        } catch (compareError) {
          console.error("Gagal membandingkan visual QC:", compareError);
          addTaskLog(itemId, `⚠️ QC Loop Warning: Gagal membandingkan visual: ${compareError.message}. Melanjutkan render...`, "warning");
        }
      }

      // Cleanup temp QC files
      try {
        if (fs.existsSync(frame0Path)) fs.unlinkSync(frame0Path);
        if (fs.existsSync(frameLastPath)) fs.unlinkSync(frameLastPath);
        if (fs.existsSync(localPropsPath)) fs.unlinkSync(localPropsPath);
      } catch (cleanupErr) {
        console.error("Gagal membersihkan file temp QC:", cleanupErr.message);
      }
      // --- END OF AUTOMATED QC VISUAL LOOP CHECK ---

      addTaskLog(itemId, "Mengantrekan operasi Git Push untuk sinkronisasi kode ke GitHub...", "info");
      execSync("git add src/Composition.tsx", { stdio: "inherit" });
      try {
        execSync(`git commit -m "Render 4K: ${itemId}"`, { stdio: "inherit" });
      } catch (e) {
        // No changes is fine
      }
      execSync("git push origin main", { stdio: "inherit" });

      const sha = execSync("git rev-parse HEAD").toString().trim();
      addTaskLog(itemId, `Kode berhasil didorong ke GitHub. Commit SHA: ${sha}`, "success");

      addTaskLog(itemId, "Memicu workflow rendering 4K di GitHub Actions...", "info");
      const workflowFile = "render-4k.yml";
      const workflowDispatchUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`;

      await axios.post(
        workflowDispatchUrl,
        {
          ref: "main",
          inputs: {
            commit_sha: sha,
            composition_id: itemId,
            duration_frames: String(item.durationInFrames || 300),
            fps: String(item.fps || 30),
            judul: item.judul || "Stock Video",
            keywords: item.keywords || "motion, abstract, loop",
            transparent: String(item.transparent || false)
          }
        },
        {
          headers: {
            Authorization: "token " + GITHUB_TOKEN,
            Accept: "application/vnd.github.v3+json"
          }
        }
      );

      const trackingKey = `${itemId}_4k`;
      gitRuns[trackingKey] = {
        sha: sha,
        status: "triggered",
        runId: null,
        triggeredAt: Date.now(),
        workflowFile: workflowFile
      };
    });

    addTaskLog(itemId, "Menunggu proses rendering video 4K ProRes di GitHub Actions (~10-15 menit)...", "info");
    const fileUrl = await waitForRenderSingle(itemId, '4k');
    if (fileUrl) {
      const dataFresh = fs.readFileSync(dbPath, "utf-8");
      const itemsFresh = JSON.parse(dataFresh);
      const itemFresh = itemsFresh.find(i => i.id === itemId);
      
      itemFresh.outputPath4k = fileUrl;
      itemFresh.statusRender4k = 'success';
      saveOrUpdateItem(itemFresh);
      addTaskLog(itemId, `Video 4K ProRes selesai diproses! URL: /api/4k-file/${itemId}`, "success");
    } else {
      throw new Error("Rendering cloud 4K gagal.");
    }
  } catch (err) {
    const dataFresh = fs.readFileSync(dbPath, "utf-8");
    const itemsFresh = JSON.parse(dataFresh);
    const itemFresh = itemsFresh.find(i => i.id === itemId);
    
    itemFresh.statusRender4k = 'failed';
    saveOrUpdateItem(itemFresh);
    addTaskLog(itemId, `Gagal merender 4K: ${err.message}`, "error");
  } finally {
    delete active4kRenders[itemId];
    
    if (taskSseClients[itemId]) {
      taskSseClients[itemId].forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'done', message: 'Render 4K selesai' })}\n\n`);
        client.end();
      });
      delete taskSseClients[itemId];
    }
  }
}

async function executeSingleSeoTask(id, aiModel) {
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    console.error("Gagal membaca database");
    return;
  }

  const item = items.find(i => i.id === id);
  if (!item) {
    console.log(`[SeoQueue] Item ${id} tidak ditemukan.`);
    return;
  }
  if (!item.htmlPreview) {
    console.log(`[SeoQueue] Item ${id} tidak memiliki htmlPreview.`);
    return;
  }

  activeSeoGenerations[id] = true;
  try {
    const timeStr = new Date().toLocaleTimeString('id-ID');
    if (!item.logs) item.logs = [];
    item.logs.push({ message: `=================================`, type: "info", time: timeStr });
    item.logs.push({ message: `✨ Memulai regenerasi Judul & Keywords (AI: ${aiModel || 'auto'})`, type: "info", time: timeStr });
    item.lastLogMessage = "Menghubungi AI...";
    saveOrUpdateItem(item);

    // Sync memory logs
    taskLogs[id] = [...item.logs];
    addTaskLog(id, "Menghubungi AI...", "info");

    const promptsData = loadPromptsConfig();
    const cleanHtml = stripScripts(item.htmlPreview);
    const activeSeoPrompt = promptsData.seoPrompt.replace("{{HTML_CONTENT}}", cleanHtml);

    const aiResponse = await callAIWithFallback(activeSeoPrompt, { preferModel: (!aiModel || aiModel === 'auto') ? '9router' : aiModel, taskId: id });
    
    let jsonText = aiResponse.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      const parts = jsonText.split("```");
      for (const p of parts) {
        if (p.trim().startsWith("{") || p.trim().startsWith("[")) {
          jsonText = p.trim();
          break;
        }
      }
    }

    const seoResult = JSON.parse(jsonText);
    item.judul = seoResult.title || item.judul;
    item.keywords = seoResult.keywords || item.keywords;
    
    // Normalisasi keywords dan judul
    if (typeof sanitizeKeywordsAndTitle === 'function') {
      const sanitized = sanitizeKeywordsAndTitle(item.judul, item.keywords);
      item.judul = sanitized.title;
      item.keywords = sanitized.keywords;
    }

    item.statusConvertTsx = 'waiting'; // Reset status TSX to waiting so they can build it
    const finishTime = new Date().toLocaleTimeString('id-ID');
    item.logs.push({ message: `✅ Regenerasi SEO sukses! Judul: "${item.judul}"`, type: "success", time: finishTime });
    item.lastLogMessage = "Regenerasi SEO sukses.";
    
    item._isGeneratingSeo = true;
    saveOrUpdateItem(item);
    delete item._isGeneratingSeo;
    addTaskLog(id, `✅ Regenerasi SEO sukses! Judul: "${item.judul}"`, "success");
  } catch (err) {
    console.error(`[SeoQueue] Gagal memproses ${id}:`, err.message);
    const errTime = new Date().toLocaleTimeString('id-ID');
    item.logs.push({ message: `❌ Gagal regenerasi SEO: ${err.message}`, type: "error", time: errTime });
    item.lastLogMessage = "Gagal regenerasi SEO.";
    item._isGeneratingSeo = true;
    saveOrUpdateItem(item);
    delete item._isGeneratingSeo;
    addTaskLog(id, `❌ Gagal regenerasi SEO: ${err.message}`, "error");
  } finally {
    activeSeoGenerations[id] = false;
    
    if (taskSseClients[id]) {
      taskSseClients[id].forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'done', message: 'SEO selesai' })}\n\n`);
        client.end();
      });
      delete taskSseClients[id];
    }
  }
}

async function processSeoQueue() {
  // Updated to support concurrent processing
  while (seoQueue.length > 0 && activeSeoCount < MAX_CONCURRENT_SEO) {
    const task = seoQueue.shift();
    console.log(`[SeoQueue] Processing item: ${task.id}. Active: ${activeSeoCount + 1}/${MAX_CONCURRENT_SEO}, Remaining: ${seoQueue.length}`);

    activeSeoCount++;
    executeSingleSeoTask(task.id, task.aiModel).finally(() => {
      activeSeoCount--;
      // Continue processing if there are more items
      if (seoQueue.length > 0) {
        setTimeout(processSeoQueue, 100);
      }
    });
  }
}

async function processRender4kQueue() {
  if (isProcessingRender4k) return;
  if (render4kQueue.length === 0) return;

  isProcessingRender4k = true;
  const itemId = render4kQueue.shift();
  console.log(`[Render4KQueue] Processing next item: ${itemId}. Remaining: ${render4kQueue.length}`);

  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    if (!fs.existsSync(dbPath)) {
      console.error("[Render4KQueue] Database not found");
      isProcessingRender4k = false;
      setTimeout(processRender4kQueue, 1000);
      return;
    }

    const data = fs.readFileSync(dbPath, "utf-8");
    const items = JSON.parse(data);
    const item = items.find(i => i.id === itemId);

    if (!item) {
      console.log(`[Render4KQueue] Item ${itemId} tidak ditemukan di database.`);
      isProcessingRender4k = false;
      setTimeout(processRender4kQueue, 1000);
      return;
    }

    if (!item.promptCode) {
      addTaskLog(itemId, "Gagal memproses antrean render 4K: Kode TSX kosong.", "error");
      item.statusRender4k = 'failed';
      saveOrUpdateItem(item);
      isProcessingRender4k = false;
      setTimeout(processRender4kQueue, 1000);
      return;
    }

    // Update status to processing
    item.statusRender4k = 'processing';
    saveOrUpdateItem(item);

    // Call the background render function and wait for it to finish!
    await run4kRenderBackground(itemId);
  } catch (err) {
    console.error(`[Render4KQueue] Error rendering ${itemId}:`, err);
    try {
      const dbPath = path.join(__dirname, "saved-items.json");
      const data = fs.readFileSync(dbPath, "utf-8");
      const items = JSON.parse(data);
      const item = items.find(i => i.id === itemId);
      if (item) {
        item.statusRender4k = 'failed';
        saveOrUpdateItem(item);
        addTaskLog(itemId, `Gagal memproses render 4K: ${err.message}`, "error");
      }
    } catch (e) {}
  } finally {
    isProcessingRender4k = false;
    // Process next item in the queue
    setTimeout(processRender4kQueue, 1000);
  }
}


// POST: Trigger render Preview
app.post("/api/trigger-preview/:id", async (req, res) => {
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

    if (item.statusConvertTsx === 'processing-preview') {
      return res.status(400).json({ error: "Render preview sedang berjalan" });
    }

    item.statusConvertTsx = 'processing-preview';
    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));

    // Jalankan background task asinkron
    runPreviewRenderBackground(id).catch(err => {
      console.error(`Error in runPreviewRenderBackground for ${id}:`, err);
    });

    res.json({ success: true, message: "Render preview dimulai di background" });
  } catch (error) {
    console.error(`❌ Gagal di trigger-preview untuk ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
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

    if (item.statusRender4k === 'processing' || item.statusRender4k === 'queued' || render4kQueue.includes(id)) {
      return res.status(400).json({ error: "Render 4K sedang berjalan atau dalam antrean" });
    }

    item.statusRender4k = 'queued';
    if (!item.logs) item.logs = [];
    const timeStr = new Date().toLocaleTimeString('id-ID');
    item.logs.push({ message: `=================================`, type: "info", time: timeStr });
    item.logs.push({ message: `📥 Ditambahkan ke antrean Render 4K di server.`, type: "info", time: timeStr });
    item.lastLogMessage = "Mengantre untuk render 4K...";
    
    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));

    if (!render4kQueue.includes(id)) {
      render4kQueue.push(id);
    }

    // Jalankan background processor (jika belum aktif)
    processRender4kQueue();

    res.json({ success: true, message: "Render 4K dimasukkan ke antrean background" });
  } catch (error) {
    console.error(`❌ Gagal di trigger-4k untuk ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET: Download 4K ProRes Zip directly from GitHub Actions artifacts
app.get("/api/download-4k-zip/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: "Database tidak ditemukan" });
    }
    const data = fs.readFileSync(dbPath, "utf-8");
    const items = JSON.parse(data);
    const item = items.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: `Item ${id} tidak ditemukan` });
    }

    if (!GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_TOKEN) {
      return res.status(500).json({ error: "Kredensial GitHub tidak dikonfigurasi di server" });
    }

    // Cari artifact dengan nama `${id}-4k-video`
    const artifactsUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/artifacts?per_page=100`;
    const response = await axios.get(artifactsUrl, {
      headers: {
        Authorization: "token " + GITHUB_TOKEN,
        Accept: "application/vnd.github.v3+json"
      }
    });

    const artifacts = response.data.artifacts || [];
    const targetArtifactName = `${id}-4k-video`;
    const matchedArtifact = artifacts.find(a => a.name === targetArtifactName);

    if (!matchedArtifact) {
      return res.status(404).json({ error: `Artifact "${targetArtifactName}" tidak ditemukan di GitHub. Pastikan render 4K sudah selesai.` });
    }

    // Dapatkan URL redirect langsung dari GitHub Action artifact zip
    const downloadUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/artifacts/${matchedArtifact.id}/zip`;
    
    console.log(`⬇️ Mengambil URL redirect artifact zip untuk ${id} dari GitHub...`);
    const downloadRes = await axios({
      method: "get",
      url: downloadUrl,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        Authorization: "token " + GITHUB_TOKEN,
        Accept: "application/vnd.github.v3+json"
      }
    });

    const redirectUrl = downloadRes.headers.location;
    if (redirectUrl) {
      console.log(`➡️ Streaming download artifact zip untuk ${id} dari cloud storage...`);
      res.setHeader('Content-Disposition', `attachment; filename="${id}-4k.zip"`);
      res.setHeader('Content-Type', 'application/zip');

      const s3Stream = await axios({
        method: 'get',
        url: redirectUrl,
        responseType: 'stream'
      });

      s3Stream.data.pipe(res);
    } else {
      throw new Error("Gagal mendapatkan lokasi redirect artifact dari GitHub");
    }
  } catch (error) {
    console.error(`❌ Gagal mendownload 4k zip untuk ${id}:`, error.message);
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

// GET: Stream/Download 4K ProRes MOV file (supports local file & cloud proxy download with correct filename)
app.get("/api/4k-file/:id", async (req, res) => {
  const { id } = req.params;
  const finalFilename = `${id}-4k.mov`;
  const legacyFilename = `${id}_4k.mov`;

  const finalPath = path.join(__dirname, "out", finalFilename);
  const legacyPath = path.join(__dirname, "out", legacyFilename);

  if (fs.existsSync(finalPath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    return res.sendFile(finalPath);
  } else if (fs.existsSync(legacyPath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    return res.sendFile(legacyPath);
  }

  // Jika tidak ada secara lokal, coba stream dari cloud (x0.at)
  try {
    const dbPath = path.join(__dirname, "saved-items.json");
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      const items = JSON.parse(data);
      const item = items.find(i => i.id === id);
      if (item && item.outputPath4k && (item.outputPath4k.startsWith("http://") || item.outputPath4k.startsWith("https://"))) {
        console.log(`➡️ Proxy download 4K video for ${id} from cloud: ${item.outputPath4k}`);
        
        res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
        res.setHeader('Content-Type', 'video/quicktime');

        const streamRes = await axios({
          method: 'get',
          url: item.outputPath4k,
          responseType: 'stream'
        });

        streamRes.data.pipe(res);
        return;
      }
    }
  } catch (err) {
    console.error(`❌ Gagal proxy download 4K dari cloud untuk ${id}:`, err.message);
  }

  return res.status(404).json({ error: "File 4K ProRes tidak ditemukan secara lokal maupun di cloud" });
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
  const poolStatus = syntxBot.getPoolStatus ? syntxBot.getPoolStatus() : { activeAccountsCount: 0, totalAccountsCount: 0, accounts: [] };
  const state = syntxBot.getSessionState();
  const isActive = !!state.token && state.expiresAt && Date.now() < state.expiresAt;
  
  const waitingOtp = !!pendingOtpResolvers['manual'];
  const otpEmail = waitingOtp ? pendingOtpResolvers['manual'].email : null;

  res.json({
    isActive,
    email: state.email,
    expiresAt: state.expiresAt ? new Date(state.expiresAt).toISOString() : null,
    hasToken: !!state.token,
    pool: poolStatus,
    waitingOtp,
    otpEmail
  });
});

// POST: Trigger manual login ke syntx.ai (berguna untuk pre-warm session)
app.post("/api/syntx-login", async (req, res) => {
  try {
    console.log("🔐 Manual trigger: Login ke syntx.ai...");
    await syntxBot.loginAndGetToken({
      taskId: 'manual',
      onEmailGenerated: (nextIndex) => {
        updateEnvKeys({ syntxEmailIndex: String(nextIndex) });
      }
    });
    const state = syntxBot.getSessionState();
    res.json({
      success: true,
      email: state.email,
      expiresAt: state.expiresAt ? new Date(state.expiresAt).toISOString() : null,
      message: "Login syntx.ai berhasil! Token tersimpan di session dan pool."
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

// POST: Batch trigger 4K render untuk beberapa item sekaligus
app.post("/api/batch-trigger-4k", async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Parameter 'ids' harus berupa array ID yang valid" });
  }

  const results = [];
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    return res.status(500).json({ error: "Gagal membaca database" });
  }

  const enqueuedIds = [];
  for (const id of ids) {
    const item = items.find(i => i.id === id);
    if (!item) {
      results.push({ id, success: false, error: "Item tidak ditemukan" });
      continue;
    }
    if (!item.promptCode) {
      results.push({ id, success: false, error: "Kode TSX kosong" });
      continue;
    }
    if (item.statusRender4k === 'processing' || item.statusRender4k === 'queued' || render4kQueue.includes(id)) {
      results.push({ id, success: false, error: "Sedang berjalan atau mengantre" });
      continue;
    }

    item.statusRender4k = 'queued';
    if (!item.logs) item.logs = [];
    
    const timeStr = new Date().toLocaleTimeString('id-ID');
    item.logs.push({ message: `=================================`, type: "info", time: timeStr });
    item.logs.push({ message: `📥 Ditambahkan ke antrean Render 4K batch di server.`, type: "info", time: timeStr });
    item.lastLogMessage = "Mengantre untuk render 4K...";
    
    render4kQueue.push(id);
    enqueuedIds.push(id);
    results.push({ id, success: true });
  }

  if (enqueuedIds.length > 0) {
    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
    // Start background processor
    processRender4kQueue();
  }

  res.json({ results });
});

// GET: Ambil prompt dari prompts.json
app.get("/api/prompts", (req, res) => {
  const prompts = loadPromptsConfig();
  res.json(prompts);
});

// POST: Update prompt ke prompts.json
app.post("/api/prompts", (req, res) => {
  const { seoPrompt, conversionPrompt } = req.body;
  try {
    fs.writeFileSync(promptsPath, JSON.stringify({ seoPrompt, conversionPrompt }, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan prompts.json: " + err.message });
  }
});

// POST: Mulai task yang sedang menunggu (waiting)
app.post("/api/start-task/:id", (req, res) => {
  const { id } = req.params;
  const { aiModel, animationDuration, fps } = req.body; // opsional: model AI, durasi, fps yang dipilih user

  // Baca item dari DB
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    return res.status(500).json({ error: "Gagal membaca database" });
  }

  const item = items.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: `Item ${id} tidak ditemukan` });
  }

  if (item.statusConvertTsx !== 'waiting') {
    return res.status(400).json({ error: "Task tidak sedang dalam status menunggu" });
  }

  // Cek apakah sudah ada di antrian
  if (taskQueue.includes(id) || activeTasks.has(id)) {
    return res.status(400).json({ error: "Task sudah ada di antrian" });
  }

  console.log(`▶ Memulai task: ${id} (AI: ${aiModel || 'auto'})`);

  // Update status ke queued, simpan aiModel jika ada
  item.statusConvertTsx = 'queued';
  if (aiModel) item.aiModel = aiModel;
  // For fresh start, clear user override flag so AI analysis runs
  delete item._userSetVideoConfig;
  if (req.body.loop !== undefined) item.loop = !!req.body.loop;
  if (req.body.transparent !== undefined) item.transparent = !!req.body.transparent;
  const targetFps = Number(fps) || item.fps || 30;
  item.fps = targetFps;
  if (animationDuration) {
    item.animationDuration = Number(animationDuration);
    item.durationInFrames = Number(animationDuration) * targetFps;
  }
  
  if (!item.logs) item.logs = [];
  const timeStr = new Date().toLocaleTimeString('id-ID');
  item.logs.push({ message: `=================================`, type: "info", time: timeStr });
  item.logs.push({ message: `▶ Memulai proses baru dengan AI: ${aiModel || 'auto'}`, type: "info", time: timeStr });
  item.lastLogMessage = "Memulai proses...";

  // Simpan ke DB
  saveOrUpdateItem(item);

  // Inisialisasi logs memori
  taskLogs[id] = [...item.logs];

  // Masukkan ke antrean
  taskQueue.push(id);
  processQueue();

  res.json({ success: true, id });
});

// POST: Mulai batch task TSX / Preview konversi secara sekuensial di server
app.post("/api/batch-start-tasks", (req, res) => {
  const { ids, aiModel, loop, transparent, fps, animationDuration } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "Daftar ID tidak valid" });
  }

  // Baca item dari DB
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    return res.status(500).json({ error: "Gagal membaca database" });
  }

  let count = 0;
  ids.forEach(id => {
    const item = items.find(i => i.id === id);
    if (item && item.statusConvertTsx === 'waiting' && !taskQueue.includes(id) && !activeTasks.has(id)) {
      item.statusConvertTsx = 'queued';
      if (aiModel) item.aiModel = aiModel;
      
      delete item._userSetVideoConfig;
      if (loop !== undefined) item.loop = !!loop;
      if (transparent !== undefined) item.transparent = !!transparent;
      const targetFps = Number(fps) || item.fps || 30;
      item.fps = targetFps;
      if (animationDuration) {
        item.animationDuration = Number(animationDuration);
        item.durationInFrames = Number(animationDuration) * targetFps;
      }
      
      if (!item.logs) item.logs = [];
      const timeStr = new Date().toLocaleTimeString('id-ID');
      item.logs.push({ message: `=================================`, type: "info", time: timeStr });
      item.logs.push({ message: `▶ Memulai proses batch dengan AI: ${aiModel || 'auto'}`, type: "info", time: timeStr });
      item.lastLogMessage = "Memulai proses batch...";

      taskLogs[id] = [...item.logs];
      taskQueue.push(id);
      count++;
    }
  });

  if (count > 0) {
    fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
    processQueue();
  }

  console.log(`📡 Batch start-tasks diproses: ${count} dari ${ids.length} item dimasukkan ke antrean.`);
  res.json({ success: true, count });
});

// POST: Batch regenerasi SEO metadata secara sekuensial di server
app.post("/api/batch-regenerate-seo", (req, res) => {
  const { ids, aiModel } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "Daftar ID tidak valid" });
  }

  let count = 0;
  ids.forEach(id => {
    // Cek apakah tidak sedang aktif dan belum masuk antrean
    const alreadyInQueue = seoQueue.some(task => task.id === id);
    if (!alreadyInQueue && !activeSeoGenerations[id]) {
      seoQueue.push({ id, aiModel });
      count++;
    }
  });

  if (count > 0) {
    processSeoQueue();
  }

  console.log(`📡 Batch regenerate-seo diproses: ${count} dari ${ids.length} item dimasukkan ke antrean.`);
  res.json({ success: true, count });
});

// Fungsi untuk memperbarui file .env dan memory variables
function updateEnvKeys({ syntxBaseEmail, syntxEmailIndex, githubToken, githubUsername, githubRepo, ninerouterKey, ninerouterUrl, ninerouterModel }) {
  const envPath = path.join(__dirname, ".env");
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
  }

  // Parse existing content
  const lines = content.split(/\r?\n/);
  const keyValues = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      keyValues[key] = val;
    }
  }

  // Update keys
  if (syntxBaseEmail !== undefined) keyValues["SYNTX_BASE_EMAIL"] = syntxBaseEmail;
  if (syntxEmailIndex !== undefined) keyValues["SYNTX_EMAIL_INDEX"] = syntxEmailIndex;
  if (githubToken !== undefined) keyValues["GITHUB_TOKEN"] = githubToken;
  if (githubUsername !== undefined) keyValues["GITHUB_USERNAME"] = githubUsername;
  if (githubRepo !== undefined) keyValues["GITHUB_REPO"] = githubRepo;
  if (ninerouterKey !== undefined) keyValues["NINEROUTER_API_KEY"] = ninerouterKey;
  if (ninerouterUrl !== undefined) keyValues["NINEROUTER_BASE_URL"] = ninerouterUrl;
  if (ninerouterModel !== undefined) keyValues["NINEROUTER_MODEL"] = ninerouterModel;

  // Build new content preserving original lines/formatting
  const newLines = [];
  const updatedKeys = new Set();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        if (keyValues[key] !== undefined) {
          newLines.push(`${key}=${keyValues[key]}`);
          updatedKeys.add(key);
          continue;
        }
      }
    }
    newLines.push(line);
  }

  // Add keys that weren't in the original file
  for (const key of Object.keys(keyValues)) {
    if (!updatedKeys.has(key)) {
      newLines.push(`${key}=${keyValues[key]}`);
    }
  }

  fs.writeFileSync(envPath, newLines.join("\n"));

  // Update memory variables
  if (syntxBaseEmail !== undefined) {
    process.env.SYNTX_BASE_EMAIL = syntxBaseEmail;
    SYNTX_BASE_EMAIL = syntxBaseEmail;
  }
  if (syntxEmailIndex !== undefined) {
    process.env.SYNTX_EMAIL_INDEX = syntxEmailIndex;
    SYNTX_EMAIL_INDEX = syntxEmailIndex;
  }
  if (githubToken !== undefined) {
    process.env.GITHUB_TOKEN = githubToken;
    GITHUB_TOKEN = githubToken;
  }
  if (githubUsername !== undefined) {
    process.env.GITHUB_USERNAME = githubUsername;
    GITHUB_USERNAME = githubUsername;
  }
  if (githubRepo !== undefined) {
    process.env.GITHUB_REPO = githubRepo;
    GITHUB_REPO = githubRepo;
  }
  if (ninerouterKey !== undefined) {
    process.env.NINEROUTER_API_KEY = ninerouterKey;
    NINEROUTER_API_KEY = ninerouterKey;
  }
  if (ninerouterUrl !== undefined) {
    process.env.NINEROUTER_BASE_URL = ninerouterUrl;
    NINEROUTER_BASE_URL = ninerouterUrl;
  }
  if (ninerouterModel !== undefined) {
    process.env.NINEROUTER_MODEL = ninerouterModel;
    NINEROUTER_MODEL = ninerouterModel;
  }
}


// GET: Ambil API Keys saat ini
app.get("/api/keys", (req, res) => {
  res.json({
    syntxBaseEmail: process.env.SYNTX_BASE_EMAIL || "",
    syntxEmailIndex: process.env.SYNTX_EMAIL_INDEX || "0",
    githubToken: process.env.GITHUB_TOKEN || "",
    githubUsername: process.env.GITHUB_USERNAME || "",
    githubRepo: process.env.GITHUB_REPO || "",
    ninerouterKey: process.env.NINEROUTER_API_KEY || "",
    ninerouterUrl: process.env.NINEROUTER_BASE_URL || "",
    ninerouterModel: process.env.NINEROUTER_MODEL || ""
  });
});

// POST: Simpan API Keys baru
app.post("/api/keys", (req, res) => {
  const { syntxBaseEmail, syntxEmailIndex, githubToken, githubUsername, githubRepo, ninerouterKey, ninerouterUrl, ninerouterModel } = req.body;
  try {
    updateEnvKeys({ syntxBaseEmail, syntxEmailIndex, githubToken, githubUsername, githubRepo, ninerouterKey, ninerouterUrl, ninerouterModel });
    console.log("🔑 API Keys & Config GitHub berhasil diperbarui di server runtime.");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan API Keys ke .env: " + err.message });
  }
});


// POST: Test validitas API Key untuk provider tertentu
app.post("/api/keys/test", async (req, res) => {
  const { provider, apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ valid: false, error: "API Key tidak boleh kosong" });
  }

  console.log(`🧪 Mengetes API Key untuk provider: ${provider}...`);
  try {
    if (provider === "ninerouter") {
      const baseUrl = req.body.apiBaseUrl || NINEROUTER_BASE_URL || "http://localhost:20128/v1";
      const model = req.body.apiModel || NINEROUTER_MODEL || "9router";
      const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
      
      const headers = { "Content-Type": "application/json" };
      if (apiKey && apiKey !== "TIDAK_ADA" && apiKey !== "kosong") {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      console.log(`🧪 Mengetes 9Router pada ${url} dengan model ${model}...`);
      const response = await axios.post(
        url,
        {
          model: model,
          messages: [
            { role: "user", content: "Hello" }
          ],
          max_tokens: 5
        },
        {
          headers: headers,
          timeout: 15000
        }
      );
      if (response.data && response.data.choices && response.data.choices[0]) {
        return res.json({ valid: true });
      } else {
        throw new Error("Respons dari 9Router tidak valid");
      }
    } else {
      return res.status(400).json({ valid: false, error: "Provider tidak dikenal" });
    }
  } catch (error) {
    console.error(`❌ Test API Key ${provider} gagal:`, error.response?.data || error.message);
    const errorMsg = error.response?.data?.error?.message || error.message;
    return res.status(400).json({ valid: false, error: errorMsg });
  }
});

// Pending OTP Resolvers for manual Syntx.ai logins
const pendingOtpResolvers = {};

// POST: Submit manual OTP code for a waiting task/login
app.post("/api/submit-otp", (req, res) => {
  const { id, otp } = req.body;
  if (!id || !otp) {
    return res.status(400).json({ error: "id dan otp diperlukan" });
  }

  console.log(`🔑 Menerima OTP manual untuk task: ${id}, OTP: ${otp}`);
  const resolver = pendingOtpResolvers[id];
  if (!resolver) {
    return res.status(404).json({ error: "Tidak ada proses login yang menunggu OTP untuk ID ini" });
  }

  // Resolve pending promise with the OTP
  resolver.resolve(otp.trim());
  delete pendingOtpResolvers[id];

  res.json({ success: true });
});

// Register OTP Provider to syntxBot
syntxBot.registerOtpProvider(async (email, taskId) => {
  console.log(`⏳ Menunggu input OTP manual untuk email: ${email} (Task ID: ${taskId})...`);
  
  // Jika taskId !== 'manual', update status item di DB agar user tahu
  if (taskId !== 'manual') {
    const dbPath = path.join(__dirname, "saved-items.json");
    let items = [];
    try {
      items = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    } catch (e) {}
    
    const item = items.find(i => i.id === taskId);
    if (item) {
      item.statusConvertTsx = 'waiting-otp';
      item.otpEmail = email;
      if (!item.logs) item.logs = [];
      item.logs.push({
        message: `⚠️ Menunggu kode OTP Syntx.ai dikirim ke ${email}. Silakan buka mailbox email Anda di emailnator.com dan masukkan kode di bawah.`,
        type: 'warning',
        time: new Date().toLocaleTimeString('id-ID')
      });
      item.lastLogMessage = `Menunggu input OTP untuk ${email}...`;
      
      // Save changes immediately
      fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
    }
  }

  return new Promise((resolve, reject) => {
    pendingOtpResolvers[taskId] = { resolve, reject, email };
    
    // Timeout setelah 5 menit
    setTimeout(() => {
      if (pendingOtpResolvers[taskId]) {
        reject(new Error("Timeout menunggu input OTP manual"));
        delete pendingOtpResolvers[taskId];
        
        if (taskId !== 'manual') {
          const dbPath = path.join(__dirname, "saved-items.json");
          let items = [];
          try { items = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch (e) {}
          const item = items.find(i => i.id === taskId);
          if (item && item.statusConvertTsx === 'waiting-otp') {
            item.statusConvertTsx = 'failed';
            item.logs.push({
              message: `❌ Timeout menunggu input OTP manual (5 menit)`,
              type: 'error',
              time: new Date().toLocaleTimeString('id-ID')
            });
            fs.writeFileSync(dbPath, JSON.stringify(items, null, 2));
          }
        }
      }
    }, 5 * 60 * 1000);
  });
});

// POST: Regenerate SEO metadata (judul & keyword) saja untuk suatu item
app.post("/api/regenerate-seo/:id", async (req, res) => {
  const { id } = req.params;
  const { aiModel } = req.body;

  // Baca item dari DB
  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    items = JSON.parse(data);
  } catch (e) {
    return res.status(500).json({ error: "Gagal membaca database" });
  }

  const item = items.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: `Item ${id} tidak ditemukan` });
  }

  if (!item.htmlPreview) {
    return res.status(400).json({ error: "Tidak ada konten HTML yang tersimpan untuk item ini" });
  }

  try {
    activeSeoGenerations[id] = true;
    console.log(`✨ Regenerating SEO metadata for ${id} using model: ${aiModel || 'auto'}`);
    
    const timeStr = new Date().toLocaleTimeString('id-ID');
    if (!item.logs) item.logs = [];
    item.logs.push({ message: `=================================`, type: "info", time: timeStr });
    item.logs.push({ message: `✨ Memulai regenerasi Judul & Keywords (AI: ${aiModel || 'auto'})`, type: "info", time: timeStr });
    saveOrUpdateItem(item);

    // Inisialisasi logs memori agar sync dengan DB
    taskLogs[id] = [...item.logs];

    addTaskLog(id, "Menghubungi AI...", "info");

    // Load SEO prompt, replace {{HTML_CONTENT}}
    const promptsData = loadPromptsConfig();
    const cleanHtml = stripScripts(item.htmlPreview);
    const activeSeoPrompt = promptsData.seoPrompt.replace("{{HTML_CONTENT}}", cleanHtml);

    const aiResponse = await callAIWithFallback(activeSeoPrompt, { preferModel: (!aiModel || aiModel === 'auto') ? '9router' : aiModel, taskId: id });
    
    let jsonText = aiResponse.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }
    jsonText = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    let seoData = JSON.parse(jsonText);
    seoData = sanitizeKeywordsAndTitle(seoData);

    item.judul = seoData.judul;
    item.keywords = seoData.keywords;
    item.deskripsi = seoData.deskripsi;
    item.kategori = seoData.kategori;
    
    const { adobeCat, shutterCat, shutterCat2 } = normalizeCategories(seoData);
    item.adobeCategory = adobeCat;
    item.shutterstockCategory = shutterCat;
    item.shutterstockCategory2 = shutterCat2;

    item.seoAiUsed = aiModel || 'auto';
    
    item._isGeneratingSeo = true;
    saveOrUpdateItem(item);
    delete item._isGeneratingSeo;
    
    addTaskLog(id, `Judul & keywords berhasil di-regenerate!`, "success");
    
    res.json({ success: true, item });
  } catch (err) {
    addTaskLog(id, `Gagal regenerasi SEO: ${err.message}`, "error");
    res.status(500).json({ error: err.message });
  } finally {
    delete activeSeoGenerations[id];

    // Tutup SSE stream clients jika ada
    if (taskSseClients[id]) {
      taskSseClients[id].forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'done', message: 'SEO Selesai' })}\n\n`);
        client.end();
      });
      delete taskSseClients[id];
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────
// CHAT AI PAGE — Gemini-style Chat with Syntx Integration
// ─────────────────────────────────────────────────────────────────────────

const CHAT_HISTORY_FILE = path.join(__dirname, "chat-history.json");

function loadChatHistory() {
  try {
    if (fs.existsSync(CHAT_HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(CHAT_HISTORY_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read chat-history.json:", e.message);
  }
  return [];
}

function saveChatHistory(sessions) {
  try {
    fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify(sessions, null, 2));
  } catch (e) {
    console.error("Failed to save chat-history.json:", e.message);
  }
}

// GET /chat → serve chat.html
app.get("/chat", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// GET /api/chat/models → available syntx models (all providers)
app.get("/api/chat/models", (req, res) => {
    const models = [
    // Claude - Sonnet
    { id: "claude-sonnet-4-6",           label: "Claude Sonnet 4.6",   group: "claude", speed: "⭐ Terbaik", default: true },
    { id: "claude-sonnet-4-5-20250929",  label: "Claude Sonnet 4.5",   group: "claude", speed: "⚡ Cepat" },
    { id: "claude-sonnet-4-20250514",    label: "Claude Sonnet 4",     group: "claude", speed: "⚡ Cepat" },
    // Claude - Opus
    { id: "claude-opus-4-8",             label: "Claude Opus 4.8",     group: "claude", speed: "🧠 Terkuat" },
    { id: "claude-opus-4-7",             label: "Claude Opus 4.7",     group: "claude", speed: "🧠 Kuat" },
    { id: "claude-opus-4-6",             label: "Claude Opus 4.6",     group: "claude", speed: "🧠 Kuat" },
    { id: "claude-opus-4-5-20251101",    label: "Claude Opus 4.5",     group: "claude", speed: "🧠 Kuat" },
    { id: "claude-opus-4-20250514",      label: "Claude Opus 4",       group: "claude", speed: "🧠 Kuat" },
    { id: "claude-opus-4-1-20250805",    label: "Claude Opus 4.1",     group: "claude", speed: "🧠 Kuat" },
    // ChatGPT
    { id: "gpt-5.5",                     label: "GPT-5.5",             group: "chatgpt", speed: "🔥 Terbaru" },
    { id: "gpt-5.4-pro",                 label: "GPT-5.4 Pro",         group: "chatgpt", speed: "🧠 Pro" },
    { id: "gpt-5.4",                     label: "GPT-5.4",             group: "chatgpt", speed: "⚡ Cepat" },
    { id: "gpt-5.3-chat-latest",         label: "GPT-5.3 Chat",        group: "chatgpt", speed: "⚡ Cepat" },
    { id: "gpt-5.2",                     label: "GPT-5.2",             group: "chatgpt", speed: "⚡ Cepat" },
    { id: "gpt-5.1",                     label: "GPT-5.1",             group: "chatgpt", speed: "⚡ Cepat" },
    { id: "gpt-5-2025-08-07",            label: "GPT-5",               group: "chatgpt", speed: "⚡ Cepat" },
    { id: "gpt-5-mini-2025-08-07",       label: "GPT-5 Mini",          group: "chatgpt", speed: "⚡ Ringan" },
    { id: "gpt-5-nano-2025-08-07",       label: "GPT-5 Nano",          group: "chatgpt", speed: "⚡ Tercepat" },
    { id: "gpt-4.1-2025-04-14",          label: "GPT-4.1",             group: "chatgpt", speed: "💼 Stabil" },
    { id: "gpt-4.1-mini-2025-04-14",     label: "GPT-4.1 Mini",        group: "chatgpt", speed: "⚡ Ringan" },
    { id: "gpt-4.1-nano-2025-04-14",     label: "GPT-4.1 Nano",        group: "chatgpt", speed: "⚡ Tercepat" },
    // Gemini
    { id: "gemini-3.5-flash",            label: "Gemini 3.5 Flash",    group: "gemini", speed: "⭐ Terbaru" },
    { id: "gemini-3.1-pro-preview",      label: "Gemini 3.1 Pro",      group: "gemini", speed: "🧠 Pro" },
    { id: "gemini-2.5-pro",              label: "Gemini 2.5 Pro",      group: "gemini", speed: "🧠 Kuat" },
    { id: "gemini-2.5-flash",            label: "Gemini 2.5 Flash",    group: "gemini", speed: "⚡ Cepat" },
    // Grok
    { id: "grok-4.3",                    label: "Grok 4.3",            group: "grok", speed: "🔥 Terbaru" },
    { id: "grok-4",                      label: "Grok 4",              group: "grok", speed: "⚡ Cepat" },
    { id: "grok-3",                      label: "Grok 3",              group: "grok", speed: "⚡ Cepat" },
    { id: "grok-3-reasoner",             label: "Grok 3 Reasoner",     group: "grok", speed: "🧠 Reasoning" },
    { id: "grok-3-deepsearch",           label: "Grok 3 DeepSearch",   group: "grok", speed: "🔍 Riset" },
    // DeepSeek
    { id: "deepseek-r1",                 label: "DeepSeek R1",         group: "deepseek", speed: "🧠 Reasoning" },
    { id: "deepseek-v3",                 label: "DeepSeek V3",         group: "deepseek", speed: "⚡ Cepat" },
    // Qwen
    { id: "qwen3.7-max",                 label: "Qwen 3.7 Max",        group: "qwen", speed: "🔥 Terbaru" },
    { id: "qwen3.7-plus",                label: "Qwen 3.7 Plus",       group: "qwen", speed: "⚡ Cepat" },
    { id: "qwen3-max-2026-01-23",        label: "Qwen 3 Max",          group: "qwen", speed: "🧠 Kuat" },
    { id: "qwen3-235b-a22b",             label: "Qwen 3 235B",         group: "qwen", speed: "🧠 Besar" },
    { id: "qwen3-vl-30b-a3b-thinking",   label: "Qwen 3 VL Thinking",  group: "qwen", speed: "🧠 Vision" },
    // Perplexity
    { id: "sonar-pro",                   label: "Sonar Pro",           group: "perplexity", speed: "🔍 Riset" },
    { id: "sonar",                       label: "Sonar",               group: "perplexity", speed: "🔍 Riset" },
    { id: "sonar-deep-research",         label: "Sonar Deep Research", group: "perplexity", speed: "🔬 Deep" },
  ];
  const pool = syntxBot.getPoolStatus ? syntxBot.getPoolStatus() : {};
  res.json({ models, poolStatus: pool });
});

// POST /api/chat/upload-image → upload image for chat attachment
app.post("/api/chat/upload-image", chatUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  const publicUrl = `/chat-uploads/${req.file.filename}`;
  res.json({ success: true, url: publicUrl, filename: req.file.filename });
});

// GET /api/chat/sessions → list all sessions (no messages, just metadata)
app.get("/api/chat/sessions", (req, res) => {
  try {
    const sessions = loadChatHistory();
    const meta = sessions.map(s => ({
      id: s.id,
      title: s.title || "Percakapan Baru",
      model: s.model,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: (s.messages || []).length
    }));
    res.json({ sessions: meta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/sessions → create new session
app.post("/api/chat/sessions", (req, res) => {
  try {
    const { model = "claude-sonnet-4-6", title = "Percakapan Baru" } = req.body || {};
    const sessions = loadChatHistory();
    const newSession = {
      id: `session_${Date.now()}`,
      title,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    sessions.unshift(newSession);
    saveChatHistory(sessions);
    res.json({ success: true, session: newSession });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions/:id → get session with all messages
app.get("/api/chat/sessions/:id", (req, res) => {
  try {
    const sessions = loadChatHistory();
    const session = sessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ error: "Sesi tidak ditemukan" });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/sessions/:id → delete session
app.delete("/api/chat/sessions/:id", (req, res) => {
  try {
    let sessions = loadChatHistory();
    const before = sessions.length;
    
    // Temukan sesi yang akan dihapus untuk membersihkan file gambarnya
    const sessionToDelete = sessions.find(s => s.id === req.params.id);
    
    sessions = sessions.filter(s => s.id !== req.params.id);
    if (sessions.length === before) return res.status(404).json({ error: "Sesi tidak ditemukan" });
    
    // Hapus file attachment gambar yang diunggah ke sesi ini jika ada
    if (sessionToDelete && Array.isArray(sessionToDelete.messages)) {
      sessionToDelete.messages.forEach(msg => {
        if (msg.imageUrl && msg.imageUrl.startsWith('/chat-uploads/')) {
          const filename = path.basename(msg.imageUrl);
          const filepath = path.join(__dirname, 'public', 'chat-uploads', filename);
          try {
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
              console.log(`🗑 Berhasil menghapus file gambar chat: ${filename}`);
            }
          } catch (fileErr) {
            console.warn(`Gagal menghapus file gambar chat ${filename}:`, fileErr.message);
          }
        }
      });
    }
    
    saveChatHistory(sessions);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/chat/sessions/:id → rename session title
app.patch("/api/chat/sessions/:id", (req, res) => {
  try {
    const { title } = req.body || {};
    const sessions = loadChatHistory();
    const idx = sessions.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Sesi tidak ditemukan" });
    if (title) sessions[idx].title = title;
    sessions[idx].updatedAt = new Date().toISOString();
    saveChatHistory(sessions);
    res.json({ success: true, session: sessions[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to upload a local file to tmpfiles.org and return a direct download URL
async function uploadToTmpFiles(localFilePath) {
  try {
    const fs = require('fs');
    if (!fs.existsSync(localFilePath)) {
      console.warn(`[TmpFiles] File not found: ${localFilePath}`);
      return null;
    }
    const fileBuffer = fs.readFileSync(localFilePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('file', fileBlob, path.basename(localFilePath));
    
    console.log(`[TmpFiles] Uploading ${path.basename(localFilePath)}...`);
    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
    
    const result = await response.json();
    if (result.status === 'success' && result.data && result.data.url) {
      const downloadUrl = result.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
      console.log(`[TmpFiles] Upload success: ${downloadUrl}`);
      return downloadUrl;
    }
    throw new Error('Invalid response payload');
  } catch (err) {
    console.error(`[TmpFiles] Error uploading to tmpfiles.org:`, err.message);
    return null;
  }
}

// POST /api/chat/sessions/:id/message → send message to AI and save
app.post("/api/chat/sessions/:id/message", async (req, res) => {
  const sessionId = req.params.id;
  const { content, model } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Pesan tidak boleh kosong" });
  }

  try {
    let sessions = loadChatHistory();
    let session = sessions.find(s => s.id === sessionId);
    if (!session) return res.status(404).json({ error: "Sesi tidak ditemukan" });

    const activeModel = model || session.model || "claude-sonnet-4-6";
    const imageUrl = req.body.imageUrl || null; // local relative image URL (e.g. /chat-uploads/img_...)

    // Save user message immediately
    const userMsg = {
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
      imageUrl: imageUrl || undefined
    };
    session.messages.push(userMsg);

    // Update session title from first user message
    if (session.messages.filter(m => m.role === "user").length === 1) {
      session.title = content.trim().slice(0, 60) + (content.trim().length > 60 ? "..." : "");
    }

    session.model = activeModel;
    session.updatedAt = new Date().toISOString();
    saveChatHistory(sessions);

    // Build context prompt: include recent conversation history for context
    const historyMsgs = session.messages.slice(-12); // last 12 messages for context
    let contextPrompt = "";
    for (const m of historyMsgs) {
      if (m.role === "user") contextPrompt += `Human: ${m.content}\n`;
      else if (m.role === "assistant") contextPrompt += `Assistant: ${m.content}\n`;
    }

    // Translate local relative imageUrl to public tmpfiles URL for Syntx AI
    let publicImageUrl = null;
    if (imageUrl && imageUrl.startsWith('/chat-uploads/')) {
      const localPath = path.join(__dirname, 'public', imageUrl);
      publicImageUrl = await uploadToTmpFiles(localPath);
    }

    // Call Syntx AI (account rotation is handled automatically by syntx-bot)
    // Pass publicImageUrl if successfully generated, otherwise fallback to imageUrl
    const aiResponse = await syntxBot.callSyntx(contextPrompt.trim(), activeModel, {}, publicImageUrl || imageUrl);

    // Save assistant message
    const assistantMsg = {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
      model: activeModel
    };

    // Reload sessions to avoid stale state
    sessions = loadChatHistory();
    session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.messages.push(assistantMsg);
      session.updatedAt = new Date().toISOString();
      saveChatHistory(sessions);
    }

    res.json({
      success: true,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      session: { id: session.id, title: session.title, model: session.model }
    });

  } catch (err) {
    console.error("Chat AI error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/sessions/:id/message/:messageIndex/edit → edit user message, truncate history, regenerate response
app.post("/api/chat/sessions/:id/message/:messageIndex/edit", async (req, res) => {
  const sessionId = req.params.id;
  const messageIndex = parseInt(req.params.messageIndex, 10);
  const { content, model } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Pesan tidak boleh kosong" });
  }

  try {
    let sessions = loadChatHistory();
    let session = sessions.find(s => s.id === sessionId);
    if (!session) return res.status(404).json({ error: "Sesi tidak ditemukan" });

    if (isNaN(messageIndex) || messageIndex < 0 || messageIndex >= session.messages.length) {
      return res.status(400).json({ error: "Index pesan tidak valid" });
    }

    const targetMsg = session.messages[messageIndex];
    if (targetMsg.role !== "user") {
      return res.status(400).json({ error: "Hanya pesan user yang dapat diedit" });
    }

    const activeModel = model || session.model || "claude-sonnet-4-6";
    
    // Determine imageUrl: if body explicitly has imageUrl, use it (can be null/empty)
    // If not specified, we can keep the old one, but the user may choose to remove it.
    let imageUrl = targetMsg.imageUrl;
    if (req.body.hasOwnProperty('imageUrl')) {
      imageUrl = req.body.imageUrl || null;
    }

    // Hapus file gambar lampiran dari pesan-pesan setelah messageIndex yang akan dipangkas (truncated)
    const truncatedMessages = session.messages.slice(messageIndex + 1);
    truncatedMessages.forEach(msg => {
      if (msg.imageUrl && msg.imageUrl.startsWith('/chat-uploads/')) {
        const filename = path.basename(msg.imageUrl);
        const filepath = path.join(__dirname, 'public', 'chat-uploads', filename);
        try {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log(`🗑 Hapus file gambar chat terpangkas: ${filename}`);
          }
        } catch (fileErr) {
          console.warn(`Gagal menghapus file gambar chat terpangkas ${filename}:`, fileErr.message);
        }
      }
    });

    // Truncate messages: keep only up to messageIndex
    session.messages = session.messages.slice(0, messageIndex + 1);

    // Update target message
    session.messages[messageIndex].content = content.trim();
    if (imageUrl) {
      session.messages[messageIndex].imageUrl = imageUrl;
    } else {
      delete session.messages[messageIndex].imageUrl;
    }
    session.messages[messageIndex].timestamp = new Date().toISOString();

    // Update session model and title (if it is the first user message)
    session.model = activeModel;
    if (messageIndex === 0) {
      session.title = content.trim().slice(0, 60) + (content.trim().length > 60 ? "..." : "");
    }
    session.updatedAt = new Date().toISOString();
    saveChatHistory(sessions);

    // Build context prompt: include the truncated conversation history
    const historyMsgs = session.messages;
    let contextPrompt = "";
    for (const m of historyMsgs) {
      if (m.role === "user") contextPrompt += `Human: ${m.content}\n`;
      else if (m.role === "assistant") contextPrompt += `Assistant: ${m.content}\n`;
    }

    // Translate local relative imageUrl to public tmpfiles URL for Syntx AI
    let publicImageUrl = null;
    if (imageUrl && imageUrl.startsWith('/chat-uploads/')) {
      const localPath = path.join(__dirname, 'public', imageUrl);
      publicImageUrl = await uploadToTmpFiles(localPath);
    }

    // Call Syntx AI
    const aiResponse = await syntxBot.callSyntx(contextPrompt.trim(), activeModel, {}, publicImageUrl || imageUrl);

    // Save assistant message
    const assistantMsg = {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
      model: activeModel
    };

    // Reload sessions to avoid stale state
    sessions = loadChatHistory();
    session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.messages = session.messages.slice(0, messageIndex + 1);
      session.messages.push(assistantMsg);
      session.updatedAt = new Date().toISOString();
      saveChatHistory(sessions);
    }

    res.json({
      success: true,
      userMessage: session ? session.messages[messageIndex] : null,
      assistantMessage: assistantMsg,
      session: session ? { id: session.id, title: session.title, model: session.model } : null
    });

  } catch (err) {
    console.error("Edit Chat AI error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Loop Latar Belakang: Secara otomatis menambah akun Syntx baru
// jika jumlah akun di pool belum mencapai batas maksimal (SYNTX_EMAIL_INDEX).
async function checkAndAutoRegisterSyntx() {
  try {
    const baseEmail = process.env.SYNTX_BASE_EMAIL || "";
    if (!baseEmail || !baseEmail.includes('@')) return;

    const maxIndex = parseInt(process.env.SYNTX_EMAIL_INDEX || '0', 10);
    if (maxIndex <= 0) return;

    // Hindari bentrokan jika ada OTP resolver manual yang sedang aktif
    if (pendingOtpResolvers['manual']) {
      return;
    }

    const poolStatus = syntxBot.getPoolStatus ? syntxBot.getPoolStatus() : { accounts: [] };
    const pool = poolStatus.accounts || [];

    if (pool.length >= maxIndex) {
      return;
    }

    console.log(`📡 [Auto Pre-warm] Jumlah akun pool (${pool.length}/${maxIndex}) di bawah batas maksimum. Memulai pendaftaran otomatis...`);

    syntxBot.loginAndGetToken({
      taskId: 'manual' // Menggunakan ID 'manual' agar OTP box muncul di dashboard jika butuh input OTP manual
    }).then(token => {
      console.log(`✅ [Auto Pre-warm] Pendaftaran akun otomatis berhasil! Akun ditambahkan ke pool.`);
    }).catch(err => {
      console.error(`❌ [Auto Pre-warm] Pendaftaran akun otomatis gagal:`, err.message);
    });

  } catch (error) {
    console.error("❌ Error pada Auto Pre-warm:", error.message);
  }
}

// Jalankan pertama kali 5 detik setelah server aktif
setTimeout(checkAndAutoRegisterSyntx, 5000);
// Jalankan secara periodik setiap 10 menit
setInterval(checkAndAutoRegisterSyntx, 10 * 60 * 1000);

// ==========================================
// GOOGLE TRENDS & ADOBE STOCK DISCOVERY NEW API
// ==========================================

const MIXKIT_LOOPS = [
  {
    previewUrl: "https://assets.mixkit.co/videos/preview/mixkit-liquid-gold-and-black-swirls-40283-large.mp4",
    thumbUrl: "https://assets.mixkit.co/videos/40283/40283-thumb-720-0.jpg"
  },
  {
    previewUrl: "https://assets.mixkit.co/videos/preview/mixkit-liquid-blue-and-purple-ink-swirls-40277-large.mp4",
    thumbUrl: "https://assets.mixkit.co/videos/40277/40277-thumb-720-0.jpg"
  },
  {
    previewUrl: "https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-neon-lights-42284-large.mp4",
    thumbUrl: "https://assets.mixkit.co/videos/42284/42284-thumb-720-0.jpg"
  },
  {
    previewUrl: "https://assets.mixkit.co/videos/preview/mixkit-purple-and-blue-neon-light-strips-loop-42319-large.mp4",
    thumbUrl: "https://assets.mixkit.co/videos/42319/42319-thumb-720-0.jpg"
  },
  {
    previewUrl: "https://assets.mixkit.co/videos/preview/mixkit-glowing-gold-particles-in-slow-motion-42588-large.mp4",
    thumbUrl: "https://assets.mixkit.co/videos/42588/42588-thumb-720-0.jpg"
  },
  {
    previewUrl: "https://assets.mixkit.co/videos/preview/mixkit-abstract-modern-background-with-glowing-lines-42595-large.mp4",
    thumbUrl: "https://assets.mixkit.co/videos/42595/42595-thumb-720-0.jpg"
  }
];

// Helper: Ambil data RSS Trends mentah dari Google Trends
async function fetchRawTrendsData() {
  const countries = {
    'US': 'United States',
    'DE': 'Germany',
    'GB': 'United Kingdom',
    'JP': 'Japan',
    'CA': 'Canada',
    'FR': 'France'
  };

  const trendData = [];

  for (const [code, name] of Object.entries(countries)) {
    try {
      console.log(`Fetching Google Trends RSS for ${name} (${code})...`);
      const url = `https://trends.google.com/trending/rss?geo=${code}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const countryQueries = [];
      $('item').each((i, el) => {
        if (i < 5) {
          const title = $(el).find('title').text();
          if (title) countryQueries.push(title);
        }
      });

      if (countryQueries.length > 0) {
        trendData.push({
          country: name,
          code: code,
          queries: countryQueries
        });
      }
    } catch (err) {
      console.error(`Gagal mengambil tren untuk ${name}:`, err.message);
    }
  }

  return trendData;
}

// GET /api/trends/raw -> Ambil data Google Trends RSS mentah (6 negara)
app.get("/api/trends/raw", async (req, res) => {
  console.log("📡 Mengambil data Google Trends RSS...");
  try {
    const rawData = await fetchRawTrendsData();
    if (rawData.length === 0) {
      return res.status(500).json({ error: "Gagal mengambil data dari Google Trends untuk semua negara." });
    }
    res.json(rawData);
  } catch (error) {
    console.error("❌ Gagal mengambil tren mentah:", error.message);
    res.status(500).json({ error: "Gagal mengambil data tren mentah", details: error.message });
  }
});

// GET /api/trends/events -> Ambil data event/hari penting internasional dari daysoftheyear.com untuk bulan ini
app.get("/api/trends/events", async (req, res) => {
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  let month = req.query.month || months[new Date().getMonth()];
  month = month.toLowerCase();
  if (!months.includes(month)) {
    month = months[new Date().getMonth()];
  }
  const url = `https://www.daysoftheyear.com/days/${month}/`;
  console.log(`📡 Mengambil data event internasional untuk bulan ${month} dari ${url}...`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const events = [];

    $('.card').each((i, el) => {
      const card = $(el);
      const title = card.find('.card__title, h2, h3').first().text().trim();
      if (!title) return;
      
      let link = card.attr('href') || card.find('a').attr('href') || '';
      if (link && link.startsWith('/')) {
        link = 'https://www.daysoftheyear.com' + link;
      }
      
      let excerpt = card.find('.card__excerpt, p').text().trim();
      let dateText = card.find('.card__date, .calendar__date').text().trim().replace(/\s+/g, ' ');
      
      if (dateText && excerpt.startsWith(dateText)) {
        excerpt = excerpt.substring(dateText.length).trim();
      }
      
      let img = card.find('img').first().attr('src') || card.find('img').first().attr('data-src') || card.find('img').first().attr('data-lazy-src') || '';
      if (img && img.startsWith('/')) {
        img = 'https://www.daysoftheyear.com' + img;
      } else if (img && img.startsWith('//')) {
        img = 'https:' + img;
      }
      
      let cleanDate = dateText;
      const match = dateText.match(/^(\d{1,2})([A-Z]{3})([A-Z]{3,4})$/i);
      if (match) {
        cleanDate = `${match[1]} ${match[2]} (${match[3]})`;
      }
      
      events.push({
        title,
        link,
        excerpt,
        date: cleanDate,
        rawDate: dateText,
        image: img
      });
    });

    // Sort chronologically (1-31, month-long events at the bottom using day 99)
    events.sort((a, b) => {
      const dayA = parseInt((a.rawDate || '').match(/^\d+/)?.[0] || '99');
      const dayB = parseInt((b.rawDate || '').match(/^\d+/)?.[0] || '99');
      return dayA - dayB;
    });

    console.log(`✅ Berhasil mengambil ${events.length} event internasional untuk bulan ${month}.`);
    res.json(events);
  } catch (error) {
    console.error("❌ Gagal mengambil event internasional:", error.message);
    res.status(500).json({ error: "Gagal mengambil data event internasional", details: error.message });
  }
});

// POST /api/trends/analyze -> Analisis kata kunci tren dari klien dengan prompt kustom
app.post("/api/trends/analyze", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "Prompt tidak boleh kosong" });
  }

  console.log("📡 Memulai analisis tren dengan prompt AI kustom...");
  try {
    console.log("🤖 Menyodorkan custom prompt ke AI...");
    const aiResponse = await callAIWithFallback(prompt, { preferModel: 'syntx-claude' });
    
    let jsonText = aiResponse.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.split("```json")[1].split("```")[0].trim();
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.split("```")[1].split("```")[0].trim();
    }

    jsonText = jsonText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    const niches = JSON.parse(jsonText);
    
    console.log("✅ Sukses menganalisis tren!");
    res.json(niches);
  } catch (error) {
    console.error("❌ Gagal menganalisis tren dengan AI:", error.message);
    res.status(500).json({ error: "Gagal memproses analisis tren dengan AI", details: error.message });
  }
});



// CSV helper function to escape fields per RFC 4180
function escapeCsvField(val) {
  if (val === undefined || val === null) return '';
  let str = String(val);
  // If field contains comma, quote, or newline, escape it
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return str;
}

// Map user-defined categories to Adobe Stock categories (numeric)
function mapAdobeCategory(categoryStr) {
  const cat = String(categoryStr || '').toLowerCase();
  if (cat.includes('tech')) return 19; // Technology
  if (cat.includes('business')) return 3; // Business
  if (cat.includes('science')) return 16; // Science
  if (cat.includes('graphic') || cat.includes('abstract') || cat.includes('design')) return 8; // Graphic Resources
  return 8; // Default to Graphic Resources
}

// Map user-defined categories to Shutterstock categories (string names)
function mapShutterstockCategory(categoryStr) {
  const cat = String(categoryStr || '').toLowerCase();
  if (cat.includes('tech')) return 'Technology';
  if (cat.includes('business') || cat.includes('finance')) return 'Business/Finance';
  if (cat.includes('science')) return 'Science';
  if (cat.includes('abstract') || cat.includes('graphic') || cat.includes('design')) return 'Abstract';
  return 'Abstract'; // Default
}

// POST /api/export-csv/adobe -> Export selected compositions as Adobe Stock metadata CSV
app.post("/api/export-csv/adobe", (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Pilih setidaknya satu item untuk diekspor." });
  }

  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    if (fs.existsSync(dbPath)) {
      items = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (err) {
    return res.status(500).json({ error: "Gagal membaca database lokal." });
  }

  const selectedItems = items.filter(item => ids.includes(item.id));
  let csvContent = "Filename,Title,Keywords,Category,Releases\n";

  selectedItems.forEach(item => {
    const filename = `${item.id}-4k.mov`;
    const title = item.judul || "Stock Video Loop";
    const keywords = item.keywords || "";
    
    // Prefer normalized adobeCategory from DB, map category string if empty, or map numeric category ID
    let category = item.adobeCategory || "";
    if (!category || !/^\d+$/.test(category)) {
      category = mapAdobeCategory(category || item.kategori);
    }
    
    const releases = ""; // No releases by default

    csvContent += `${escapeCsvField(filename)},${escapeCsvField(title)},${escapeCsvField(keywords)},${category},${escapeCsvField(releases)}\n`;
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=adobe_stock_upload.csv");
  return res.status(200).send(csvContent);
});

// POST /api/export-csv/shutterstock -> Export selected compositions as Shutterstock metadata CSV
app.post("/api/export-csv/shutterstock", (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Pilih setidaknya satu item untuk diekspor." });
  }

  const dbPath = path.join(__dirname, "saved-items.json");
  let items = [];
  try {
    if (fs.existsSync(dbPath)) {
      items = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (err) {
    return res.status(500).json({ error: "Gagal membaca database lokal." });
  }

  const selectedItems = items.filter(item => ids.includes(item.id));
  let csvContent = "Filename,Description,Keywords,Categories,Editorial,Mature content,illustration\n";

  selectedItems.forEach(item => {
    const filename = `${item.id}-4k.mov`;
    const description = item.deskripsi || item.judul || "Stock Video Loop";
    const keywords = item.keywords || "";
    
    // Combine normalized categories from DB if available, else map kategori
    let category = [item.shutterstockCategory, item.shutterstockCategory2].filter(Boolean).join(",");
    if (!category) {
      category = mapShutterstockCategory(item.kategori);
    }
    
    const editorial = "no";
    const matureContent = "no";
    const illustration = "yes";

    csvContent += `${escapeCsvField(filename)},${escapeCsvField(description)},${escapeCsvField(keywords)},${escapeCsvField(category)},${editorial},${matureContent},${illustration}\n`;
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=shutterstock_upload.csv");
  return res.status(200).send(csvContent);
});

// GET /api/proxy-image -> Proxy gambar untuk menghindari CORS
app.get("/api/proxy-image", async (req, res) => {
  const { url } = req.query || {};
  if (!url) {
    return res.status(400).send("Parameter url diperlukan");
  }
  try {
    const parsedUrl = new URL(url);
    const referer = parsedUrl.origin + '/';

    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': referer
      },
      timeout: 10000
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    response.data.pipe(res);
  } catch (err) {
    console.error("Gagal melakukan proxy gambar:", err.message);
    res.status(500).send("Gagal memproses gambar");
  }
});

// Jalankan pembersihan database startup setelah semua queue didefinisikan
performStartupCleanup();

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Jembatan Kode Bebas aktif di http://0.0.0.0:${PORT}`);
});

