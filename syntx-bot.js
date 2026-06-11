/**
 * syntx-bot.js
 * ============
 * Modul otomasi untuk syntx.ai menggunakan email temporer dari mail.tm
 * 
 * Flow:
 *  1. Buat akun email temporer di mail.tm
 *  2. Daftarkan email tersebut ke syntx.ai (request OTP)
 *  3. Ambil OTP dari inbox mail.tm
 *  4. Verifikasi OTP → dapat token syntx.ai
 *  5. Buat sesi chat di syntx.ai
 *  6. Kirim prompt ke Claude melalui sesi chat
 *  7. Poll untuk mendapatkan respons Claude
 * 
 * Endpoint yang dikonfirmasi (dari Playwright network intercept):
 *  - POST /api/v1/auth/email/send-otp
 *  - POST /api/v1/auth/email/verify-otp
 *  - POST /api/v1/chats → buat sesi chat (returns uuid)
 *  - POST /api/v1/chats/{uuid}/messages?ai_name=claude → kirim pesan
 *  - GET  /api/v1/chats/{uuid}/messages → poll respons Claude
 * 
 * Usage:
 *  const syntxBot = require('./syntx-bot');
 *  const reply = await syntxBot.callSyntx("Your prompt here");
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ACCOUNTS_FILE = path.join(__dirname, 'syntx-accounts.json');
const MAX_MESSAGES_LIMIT = 5;

// Load pool from file
function loadAccountsPool() {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("❌ Gagal membaca syntx-accounts.json:", e.message);
  }
  return [];
}

// Save pool to file
function saveAccountsPool(pool) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(pool, null, 2));
  } catch (e) {
    console.error("❌ Gagal menyimpan syntx-accounts.json:", e.message);
  }
}

function getPoolStatus() {
  const pool = loadAccountsPool();
  const activeAccounts = pool.filter(acc => {
    const isTokenValid = acc.token && acc.expiresAt && Date.now() < acc.expiresAt;
    const isUnderLimit = acc.messageCount < MAX_MESSAGES_LIMIT;
    return isTokenValid && isUnderLimit && acc.isValid !== false;
  });

  return {
    activeAccountsCount: activeAccounts.length,
    totalAccountsCount: pool.length,
    accounts: pool.map(acc => ({
      email: acc.email,
      messageCount: acc.messageCount,
      messageLimit: MAX_MESSAGES_LIMIT,
      expiresAt: acc.expiresAt,
      isValid: !!(acc.isValid !== false && acc.messageCount < MAX_MESSAGES_LIMIT && Date.now() < acc.expiresAt)
    }))
  };
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const MAIL_TM_API  = 'https://api.mail.tm';
const SYNTX_API_V1 = 'https://api.syntx.ai/api/v1';

// Global session state – persisted in memory across calls within same process
let sessionState = {
  token: null,          // syntx.ai auth token
  email: null,          // temp email currently in use
  mailToken: null,      // mail.tm bearer token
  mailId: null,         // mail.tm account ID
  expiresAt: null,      // token expiry estimate (ms epoch)
  messageLimit: MAX_MESSAGES_LIMIT,     // limit pesan per akun (dari API: "limit":5)
};

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomString(len = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Logging helper supporting parent task delegation
function logToTask(options, message, type = 'info') {
  console.log(message);
  if (options && options.logger) {
    options.logger(message, type);
  }
}

// ─────────────────────────────────────────────
// OPENINBOX: Create inbox + fetch OTP (free, no API key)
// Uses internal web endpoints with session cookies
// ─────────────────────────────────────────────
const OPENINBOX_API = 'https://api.openinbox.io/api';

function _openInboxSession() {
  return axios.create({
    baseURL: OPENINBOX_API,
    withCredentials: true,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://openinbox.io',
      'Referer': 'https://openinbox.io/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
}

async function createOpenInboxEmail(options) {
  logToTask(options, '📧 [syntx-bot] Membuat inbox via OpenInbox.io (gratis)...', 'info');

  const session = _openInboxSession();
  const fingerprint = require('crypto').randomBytes(16).toString('hex');
  const res = await session.post('/inbox', { fingerprint });

  const inboxId = res.data.id;
  const email = res.data.email;
  if (!email || !inboxId) {
    throw new Error('OpenInbox gagal membuat inbox: ' + JSON.stringify(res.data));
  }

  logToTask(options, `✅ [syntx-bot] OpenInbox dibuat: ${email} (expire: ${res.data.expiresAt || '~10min'})`, 'success');
  return { email, inboxId, session };
}

async function fetchOTPFromOpenInbox(session, inboxId, maxWaitMs = 60000, options) {
  logToTask(options, `🔍 [syntx-bot] Menunggu OTP di OpenInbox...`, 'info');
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await sleep(5000);

    try {
      const listRes = await session.get(`/emails/inbox/${inboxId}?page=1&limit=30`);

      const emails = listRes.data.emails || [];
      if (emails.length === 0) {
        logToTask(options, `   ⏳ OpenInbox masih kosong, tunggu 5s... (${Math.floor((Date.now() - startTime)/1000)}s)`, 'info');
        continue;
      }

      // Read the first email's full content
      const firstEmail = emails[0];
      const emailId = firstEmail.id || firstEmail.emailId;
      let body = firstEmail.body || firstEmail.text || firstEmail.html || firstEmail.textBody || firstEmail.htmlBody || '';
      let subject = firstEmail.subject || '';

      if (emailId && !body) {
        try {
          const detailRes = await session.get(`/emails/${emailId}`);
          const d = detailRes.data;
          body = d.textBody || d.htmlBody || d.body || d.text || d.html || '';
          subject = d.subject || subject;
        } catch (e) {
          logToTask(options, `⚠️ [syntx-bot] Gagal ambil detail email: ${e.message}`, 'warning');
        }
      }

      // Extract 6-digit OTP
      const otpMatch = body.match(/\b(\d{6})\b/) || subject.match(/\b(\d{6})\b/);
      if (otpMatch) {
        const otp = otpMatch[1];
        logToTask(options, `🎯 [syntx-bot] OTP ditemukan via OpenInbox: ${otp}`, 'success');
        return otp;
      }

      logToTask(options, `⚠️ [syntx-bot] Email masuk dari ${firstEmail.from || '?'} tapi OTP tidak ditemukan`, 'warning');
    } catch (err) {
      logToTask(options, `⚠️ [syntx-bot] Error cek OpenInbox: ${err.message}`, 'warning');
    }
  }

  throw new Error('Timeout: OTP tidak diterima via OpenInbox dalam ' + Math.floor(maxWaitMs / 1000) + ' detik');
}

// ─────────────────────────────────────────────
// STEP 1: Buat akun email temporer di mail.tm
// ─────────────────────────────────────────────
async function createTempEmail(options) {
  logToTask(options, '📧 [syntx-bot] Membuat email temporer via mail.tm...', 'info');

  const domainRes = await axios.get(`${MAIL_TM_API}/domains`, {
    headers: { 'Accept': 'application/json' },
    timeout: 15000
  });

  const domains = domainRes.data['hydra:member'] || domainRes.data.data || domainRes.data;
  if (!domains || domains.length === 0) {
    throw new Error('Tidak ada domain mail.tm yang tersedia');
  }
  const domain = domains[0].domain;

  const username  = `syntxbot_${randomString(8)}`;
  const password  = `P@ss${randomString(8)}!`;
  const email     = `${username}@${domain}`;

  const createRes = await axios.post(`${MAIL_TM_API}/accounts`, {
    address: email,
    password: password
  }, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 15000
  });

  const accountId = createRes.data.id;
  logToTask(options, `✅ [syntx-bot] Email temporer dibuat: ${email} (ID: ${accountId})`, 'success');

  const loginRes = await axios.post(`${MAIL_TM_API}/token`, {
    address: email,
    password: password
  }, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 15000
  });

  const mailToken = loginRes.data.token;
  logToTask(options, `🔑 [syntx-bot] Token mail.tm berhasil didapat`, 'success');

  return { email, password, accountId, mailToken };
}

// ─────────────────────────────────────────────
// STEP 2: Request OTP ke syntx.ai
// ─────────────────────────────────────────────
async function requestSyntxOTP(email, options) {
  logToTask(options, `📨 [syntx-bot] Meminta OTP syntx.ai untuk: ${email}`, 'info');
  
  const res = await axios.post(`${SYNTX_API_V1}/auth/email/send-otp`, {
    email: email
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://syntx.ai',
      'Referer': 'https://syntx.ai/login'
    },
    timeout: 20000
  });
  logToTask(options, `✅ [syntx-bot] OTP terkirim ke ${email}: ${res.data?.message || 'OK'}`, 'success');
  return true;
}

// ─────────────────────────────────────────────
// STEP 3: Ambil OTP dari inbox mail.tm
// ─────────────────────────────────────────────
async function fetchOTPFromMailTm(mailToken, maxWaitMs = 60000, options) {
  logToTask(options, '🔍 [syntx-bot] Menunggu OTP di inbox mail.tm...', 'info');
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    await sleep(5000);

    try {
      const messagesRes = await axios.get(`${MAIL_TM_API}/messages`, {
        headers: {
          'Authorization': `Bearer ${mailToken}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      const messages = messagesRes.data['hydra:member'] || messagesRes.data.data || messagesRes.data || [];
      
      if (messages.length === 0) {
        logToTask(options, `   ⏳ Inbox masih kosong, tunggu 5s lagi... (${Math.floor((Date.now() - startTime)/1000)}s)`, 'info');
        continue;
      }

      const msgId = messages[0].id;
      const msgRes = await axios.get(`${MAIL_TM_API}/messages/${msgId}`, {
        headers: {
          'Authorization': `Bearer ${mailToken}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      const body = msgRes.data.text || msgRes.data.html || '';
      
      const otpMatch = body.match(/\b(\d{6})\b/);
      if (otpMatch) {
        const otp = otpMatch[1];
        logToTask(options, `🎯 [syntx-bot] OTP berhasil ditemukan: ${otp}`, 'success');
        return otp;
      }

      const subject = messages[0].subject || '';
      const subjectMatch = subject.match(/\b(\d{6})\b/);
      if (subjectMatch) {
        const otp = subjectMatch[1];
        logToTask(options, `🎯 [syntx-bot] OTP ditemukan di subject: ${otp}`, 'success');
        return otp;
      }

      logToTask(options, `⚠️ [syntx-bot] Pesan diterima tapi OTP tidak ditemukan. Subject: "${messages[0].subject}"`, 'warning');
    } catch (err) {
      logToTask(options, `⚠️ [syntx-bot] Error saat cek inbox: ${err.message}`, 'warning');
    }
  }

  throw new Error('Timeout: OTP tidak diterima dalam 60 detik');
}

// ─────────────────────────────────────────────
// STEP 4: Verifikasi OTP di syntx.ai → dapat token
// ─────────────────────────────────────────────
async function verifySyntxOTP(email, otp, options) {
  logToTask(options, `🔐 [syntx-bot] Memverifikasi OTP ${otp} untuk ${email}...`, 'info');
  
  const res = await axios.post(`${SYNTX_API_V1}/auth/email/verify-otp`, {
    email: email,
    otp_code: otp   // field yang dikonfirmasi: 'otp_code'
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://syntx.ai',
      'Referer': 'https://syntx.ai/login'
    },
    timeout: 20000
  });

  const token = res.data?.token || res.data?.data?.token || res.data?.access_token;
  if (!token) {
    throw new Error('Token tidak ditemukan di respons: ' + JSON.stringify(res.data));
  }
  logToTask(options, `✅ [syntx-bot] Token syntx.ai berhasil didapat!`, 'success');
  return token;
}

// ─────────────────────────────────────────────
// STEP 5A: Buat sesi chat baru di syntx.ai
// ─────────────────────────────────────────────
async function createChatSession(token, options) {
  logToTask(options, '📂 [syntx-bot] Membuat sesi chat baru...', 'info');
  
  const res = await axios.post(`${SYNTX_API_V1}/chats`, {
    title: 'New chat',
    scope: 'text'
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://syntx.ai',
      'Referer': 'https://syntx.ai/text/claude'
    },
    timeout: 30000
  });

  // Response: { id: integer, uuid: "string-guid", ... }
  const chatUuid = res.data?.uuid;
  const chatId = res.data?.id;
  if (!chatUuid && !chatId) {
    throw new Error('Chat UUID/ID tidak ditemukan di respons: ' + JSON.stringify(res.data).substring(0, 200));
  }
  
  logToTask(options, `✅ [syntx-bot] Sesi chat dibuat: UUID=${chatUuid}, ID=${chatId}`, 'success');
  return { uuid: chatUuid, id: chatId };
}

// ─────────────────────────────────────────────
// STEP 5B: Kirim prompt ke syntx.ai
// API bersifat async – response dari AI muncul di messages list
// ─────────────────────────────────────────────
// Model → AI Provider mapping (verified via Syntx UI):
// Claude models → ai_name=claude
// Gemini models → ai_name=gemini
// ChatGPT/GPT   → ai_name=chatgpt
// Grok          → ai_name=grok
// Deepseek      → ai_name=deepseek
// Perplexity    → ai_name=perplexity
// Qwen          → ai_name=qwen

function getAiName(model) {
  const m = (model || '').toLowerCase();
  if (m.startsWith('gemini')) return 'gemini';
  if (m.startsWith('claude') || m.includes('fable')) return 'claude';
  if (m.startsWith('gpt') || m.startsWith('chatgpt') || m.startsWith('o1') || m.startsWith('o3')) return 'chatgpt';
  if (m.startsWith('grok')) return 'grok';
  if (m.startsWith('deepseek')) return 'deepseek';
  if (m.startsWith('perplexity') || m.startsWith('sonar')) return 'perplexity';
  if (m.startsWith('qwen')) return 'qwen';
  return 'claude'; // default
}

async function sendPromptToSyntx(token, prompt, model = 'claude-sonnet-4-5', options = {}, imageUrl = null) {
  const aiName = getAiName(model);
  const label = aiName.charAt(0).toUpperCase() + aiName.slice(1);

  logToTask(options, `🤖 [syntx-bot] Mengirim prompt ke syntx.ai ${label} (${model})...`, 'info');
  
  logToTask(options, `🤖 [syntx-bot] Mengirim prompt ke syntx.ai ${label} (${model})${imageUrl ? ' + gambar' : ''}...`, 'info');

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'https://syntx.ai',
    'Referer': `https://syntx.ai/text/${aiName}`
  };
  
  // Buat sesi chat baru → gunakan UUID untuk endpoint berikutnya
  const { uuid: chatUuid } = await createChatSession(token, options);
  
  // Kirim pesan ke sesi chat
  // Jika ada imageUrl, gunakan object_type=image dan sertakan teks sebagai caption
  let messagePayload;
  if (imageUrl) {
    // Kirim gambar dulu, lalu teks sebagai pesan terpisah di sesi yang sama
    messagePayload = {
      message_object: {
        object_type: 'image',
        object_url: imageUrl,
        object_text: prompt || '',
        model_type: model
      }
    };
  } else {
    messagePayload = {
      message_object: {
        object_type: 'text',
        object_url: null,
        object_text: prompt,
        model_type: model
      }
    };
  }
  
  logToTask(options, `   📡 Mengirim ke: /api/v1/chats/${chatUuid}/messages?ai_name=${aiName}`, 'info');
  
  await axios.post(
    `${SYNTX_API_V1}/chats/${chatUuid}/messages?ai_name=${aiName}`,
    messagePayload,
    {
      headers: {
        ...authHeaders,
        'Referer': `https://syntx.ai/text/${aiName}/${chatUuid}`
      },
      timeout: 60000
    }
  );
  
  logToTask(options, `   ⏳ Pesan terkirim! Polling untuk respons ${label}...`, 'info');
  
  // Poll GET /chats/{uuid}/messages untuk mendapat respons AI
  const maxWait = 180000;  // 3 menit (naik dari 2 menit)
  const pollInterval = 1500; // 1.5 detik (turun dari 3 detik) 
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    await sleep(pollInterval);
    
    try {
      const messagesRes = await axios.get(
        `${SYNTX_API_V1}/chats/${chatUuid}/messages`,
        { headers: authHeaders, timeout: 30000 }
      );
      
      const messages = messagesRes.data?.messages || 
                       (Array.isArray(messagesRes.data) ? messagesRes.data : []);
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      if (Array.isArray(messages) && messages.length >= 2) {
        // Cari pesan yang bukan user message (bukan pesan kita)
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          const msgTexts = (msg.message_object || []).map(o => o.object_text).filter(t => t);
          
          // Skip pesan yang isinya sama dengan prompt kita (user message)
          const isUserMsg = msgTexts.some(t => 
            t === prompt || 
            (prompt.length > 30 && t?.includes(prompt.substring(0, 30)))
          );
          
          if (!isUserMsg && msgTexts.length > 0) {
            const aiContent = msgTexts.join('\n');
            logToTask(options, `✅ [syntx-bot] Respons ${label} diterima dalam ${elapsed}s!`, 'success');
            return aiContent;
          }
        }
      }
      
      logToTask(options, `   ⏳ Menunggu ${label}... (${elapsed}s, messages: ${messages.length})`, 'info');
      
    } catch (pollErr) {
      logToTask(options, `   ⚠️ Poll error: ${pollErr.message}`, 'warning');
    }
  }
  
  throw new Error(`Timeout: Respons ${label} tidak diterima dalam 3 menit`);
}

// ─────────────────────────────────────────────
// EMAILNATOR WEB API (TANPA KEY - GRATIS)
// https://www.emailnator.com
// ─────────────────────────────────────────────
const EMAILNATOR_BASE = 'https://www.emailnator.com';

// Header standar agar mirip browser
function emailnatorHeaders(cookies = '', referer = '') {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.emailnator.com',
    'Referer': referer || 'https://www.emailnator.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    ...(cookies ? { 'Cookie': cookies } : {})
  };
}

/**
 * Buat email @gmail.com via Emailnator web API.
 * Return: { email, cookies } – cookies diperlukan untuk baca inbox.
 */
async function createEmailnatorGmail(options) {
  logToTask(options, '📧 [syntx-bot] Membuat email @gmail.com via Emailnator...', 'info');

  // Step 1: ambil XSRF token + session cookie
  let xsrfToken = '';
  let sessionCookies = '';

  try {
    const homeRes = await axios.get(EMAILNATOR_BASE, {
      headers: emailnatorHeaders(),
      timeout: 15000,
      maxRedirects: 5
    });

    const setCookieHeader = homeRes.headers['set-cookie'] || [];
    const allCookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

    for (const c of allCookies) {
      const match = c.match(/XSRF-TOKEN=([^;]+)/);
      if (match) xsrfToken = decodeURIComponent(match[1]);
    }
    // Gabung semua cookie name=value
    sessionCookies = allCookies.map(c => c.split(';')[0]).join('; ');
    logToTask(options, `   🍪 Session cookies didapat, XSRF: ${xsrfToken ? xsrfToken.substring(0, 20) + '...' : 'tidak ada'}`, 'info');
  } catch (err) {
    logToTask(options, `   ⚠️ Gagal ambil home page Emailnator: ${err.message}`, 'warning');
  }

  // Step 2: generate email dengan tipe "plusGmail" atau "dotGmail"
  let email = null;
  let attempts = 0;

  while (!email && attempts < 5) {
    attempts++;
    try {
      const genHeaders = {
        ...emailnatorHeaders(sessionCookies),
        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {})
      };

      const genRes = await axios.post(`${EMAILNATOR_BASE}/generate-email`, {
        email: ['dotGmail', 'plusGmail']
      }, {
        headers: genHeaders,
        timeout: 15000
      });

      const emails = genRes.data?.email || [];
      // Ambil yang @gmail.com
      const gmailEmail = emails.find(e => e.endsWith('@gmail.com'));

      if (gmailEmail) {
        email = gmailEmail;

        // Update cookies AND XSRF token dari generate-email response (Laravel merotasi keduanya)
        const respCookies = genRes.headers['set-cookie'] || [];
        const respCookieArr = Array.isArray(respCookies) ? respCookies : [respCookies];
        if (respCookieArr.length > 0) {
          // Update xsrfToken jika ada yang baru
          for (const c of respCookieArr) {
            const xsrfMatch = c.match(/XSRF-TOKEN=([^;]+)/);
            if (xsrfMatch) xsrfToken = decodeURIComponent(xsrfMatch[1]);
          }
          // Merge cookies
          const existing = {};
          sessionCookies.split('; ').forEach(pair => {
            const [k, v] = pair.split('=');
            if (k) existing[k] = v;
          });
          respCookieArr.map(c => c.split(';')[0]).forEach(pair => {
            const [k, v] = pair.split('=');
            if (k) existing[k] = v;
          });
          sessionCookies = Object.entries(existing).map(([k, v]) => `${k}=${v}`).join('; ');
        }
        logToTask(options, `✅ [syntx-bot] Email Emailnator dibuat: ${email} (XSRF updated)`, 'success');
      } else {
        logToTask(options, `   ⏳ Belum dapat @gmail.com, coba lagi... (attempts: ${attempts})`, 'info');
        await sleep(1500);
      }
    } catch (err) {
      logToTask(options, `   ⚠️ Error generate Emailnator (attempt ${attempts}): ${err.message}`, 'warning');
      await sleep(2000);
    }
  }

  if (!email) {
    throw new Error('Gagal mendapatkan email @gmail.com dari Emailnator setelah 5 percobaan');
  }

  return { email, cookies: sessionCookies, xsrfToken };
}

/**
 * Baca inbox Emailnator dan ambil OTP dari pesan Syntx.ai.
 */
async function fetchOTPFromEmailnator(email, cookies, xsrfToken, maxWaitMs = 90000, options) {
  logToTask(options, `🔍 [syntx-bot] Menunggu OTP di inbox Emailnator untuk: ${email}...`, 'info');
  const startTime = Date.now();

  // Headers untuk request inbox - Emailnator butuh Referer /mailbox/{email} agar tidak 500
  const buildHeaders = (xsrf, cookieStr) => ({
    ...emailnatorHeaders(cookieStr, `https://www.emailnator.com/mailbox/${email}`),
    ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {})
  });

  let currentXsrf = xsrfToken;
  let currentCookies = cookies;

  while (Date.now() - startTime < maxWaitMs) {
    await sleep(5000);

    try {
      const headers = buildHeaders(currentXsrf, currentCookies);

      // Cek daftar pesan di inbox
      const inboxRes = await axios.post(`${EMAILNATOR_BASE}/message-list`, {
        email
      }, { headers, timeout: 25000 });

      // Update cookies dari response jika ada
      const respC = inboxRes.headers['set-cookie'] || [];
      const respCArr = Array.isArray(respC) ? respC : [respC];
      if (respCArr.length > 0) {
        for (const c of respCArr) {
          const m = c.match(/XSRF-TOKEN=([^;]+)/);
          if (m) currentXsrf = decodeURIComponent(m[1]);
        }
        const existing = {};
        currentCookies.split('; ').forEach(pair => { const [k,v]=pair.split('='); if(k) existing[k]=v; });
        respCArr.map(c=>c.split(';')[0]).forEach(pair => { const [k,v]=pair.split('='); if(k) existing[k]=v; });
        currentCookies = Object.entries(existing).map(([k,v])=>`${k}=${v}`).join('; ');
      }

      const messageList = inboxRes.data?.messageData || [];

      if (messageList.length === 0) {
        logToTask(options, `   ⏳ Inbox Emailnator kosong (${Math.floor((Date.now() - startTime) / 1000)}s)...`, 'info');
        continue;
      }

      // Skip pesan iklan bawaan Emailnator (ADSVPN = promotional, tidak bisa dibuka)
      const realMessages = messageList.filter(m => m.messageID && m.messageID !== 'ADSVPN');

      if (realMessages.length === 0) {
        logToTask(options, `   ⏳ Inbox hanya berisi iklan bawaan, menunggu email Syntx... (${Math.floor((Date.now() - startTime) / 1000)}s)`, 'info');
        continue;
      }

      // Ambil pesan pertama yang bukan iklan
      const firstMsg = realMessages[0];
      const msgId = firstMsg.messageID;

      if (!msgId) {
        logToTask(options, '   ⚠️ messageID tidak ditemukan di entry inbox', 'warning');
        continue;
      }

      logToTask(options, `   📨 Pesan diterima: "${firstMsg.subject || '?'}" dari "${firstMsg.from || '?'}" (msgID: ${msgId})`, 'info');
      
      // Cek apakah subject sudah mengandung OTP
      const subjectOtpMatch = (firstMsg.subject || '').match(/\b(\d{6})\b/);
      if (subjectOtpMatch) {
        logToTask(options, `🎯 [syntx-bot] OTP ditemukan di subject: ${subjectOtpMatch[1]}`, 'success');
        return subjectOtpMatch[1];
      }

      // Baca konten pesan dengan XSRF terbaru
      const msgRes = await axios.post(`${EMAILNATOR_BASE}/message-list`, {
        email,
        messageID: msgId
      }, { headers: buildHeaders(currentXsrf, currentCookies), timeout: 25000 });

      const body = msgRes.data || '';
      const bodyText = typeof body === 'string' ? body : JSON.stringify(body);

      // Cari OTP 6 digit (bisa di body atau subject)
      const otpMatch = bodyText.match(/\b(\d{6})\b/);
      if (otpMatch) {
        const otp = otpMatch[1];
        logToTask(options, `🎯 [syntx-bot] OTP berhasil ditemukan via Emailnator: ${otp}`, 'success');
        return otp;
      }

      const subjectMatch = (firstMsg.subject || '').match(/\b(\d{6})\b/);
      if (subjectMatch) {
        logToTask(options, `🎯 [syntx-bot] OTP ditemukan di subject: ${subjectMatch[1]}`, 'success');
        return subjectMatch[1];
      }

      logToTask(options, `   ⚠️ Pesan masuk tapi OTP tidak ditemukan. Body preview: ${bodyText.substring(0, 100)}`, 'warning');
    } catch (err) {
      logToTask(options, `   ⚠️ Error cek inbox Emailnator (${Math.floor((Date.now()-startTime)/1000)}s): ${err.response?.status || ''} ${err.message}`, 'warning');
    }
  }

  throw new Error('Timeout: OTP tidak diterima via Emailnator dalam batas waktu');
}


// ─────────────────────────────────────────────
// GMAILNATOR (RAPIDAPI) INTEGRATION FOR DISPOSABLE EMAIL BYPASS
// ─────────────────────────────────────────────
async function createGmailnatorEmail(rapidApiKey, options) {
  logToTask(options, '📧 [syntx-bot] Membuat email Gmailnator via RapidAPI...', 'info');
  const response = await axios.post(
    'https://gmailnator.p.rapidapi.com/api/emails/generate',
    {
      type: ["public_gmail_dot"]
    },
    {
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'gmailnator.p.rapidapi.com'
      },
      timeout: 20000
    }
  );
  const email = response.data?.email;
  if (!email) {
    throw new Error('Gagal mendapatkan email dari Gmailnator: ' + JSON.stringify(response.data));
  }
  logToTask(options, `✅ [syntx-bot] Email Gmailnator dibuat: ${email}`, 'success');
  return email;
}

async function fetchOTPFromGmailnator(rapidApiKey, email, maxWaitMs = 90000, options) {
  logToTask(options, `🔍 [syntx-bot] Menunggu OTP di inbox Gmailnator untuk: ${email}...`, 'info');
  const startTime = Date.now();
  const headers = {
    'content-type': 'application/json',
    'X-RapidAPI-Key': rapidApiKey,
    'X-RapidAPI-Host': 'gmailnator.p.rapidapi.com'
  };

  while (Date.now() - startTime < maxWaitMs) {
    await sleep(5000);

    try {
      const response = await axios.post(
        'https://gmailnator.p.rapidapi.com/api/inbox',
        { email },
        { headers, timeout: 20000 }
      );

      const messages = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      if (messages.length === 0) {
        logToTask(options, `⏳ [syntx-bot] Inbox Gmailnator kosong, tunggu 5s... (${Math.floor((Date.now() - startTime)/1000)}s)`, 'info');
        continue;
      }

      // Ambil pesan pertama karena email ini baru dibuat dan khusus untuk menerima OTP
      const otpMail = messages[0];

      const messageId = otpMail.message_id || otpMail.id;
      if (!messageId) {
        throw new Error('Message ID tidak ditemukan di entry inbox: ' + JSON.stringify(otpMail));
      }

      // Fetch detail message
      logToTask(options, `🎯 [syntx-bot] Email OTP masuk! Membaca konten pesan: ${messageId}...`, 'info');
      const msgDetailRes = await axios.get(
        `https://gmailnator.p.rapidapi.com/api/inbox/${messageId}`,
        { headers, timeout: 20000 }
      );

      const body = msgDetailRes.data?.content || msgDetailRes.data?.text || msgDetailRes.data?.html || '';
      const subject = otpMail.subject || msgDetailRes.data?.subject || '';

      const otpMatch = body.match(/\b(\d{6})\b/) || subject.match(/\b(\d{6})\b/);
      if (otpMatch) {
        const otp = otpMatch[1];
        logToTask(options, `🎯 [syntx-bot] OTP berhasil ditemukan via Gmailnator: ${otp}`, 'success');
        return otp;
      } else {
        logToTask(options, `⚠️ [syntx-bot] OTP tidak ditemukan di badan atau subjek email.`, 'warning');
      }
    } catch (err) {
      logToTask(options, `⚠️ [syntx-bot] Error saat cek inbox Gmailnator: ${err.message}`, 'warning');
    }
  }

  throw new Error('Timeout: OTP tidak diterima via Gmailnator dalam 90 detik');
}

// ─────────────────────────────────────────────
// MAIN: Full login flow + send prompt
// ─────────────────────────────────────────────
// Helper to generate dot-variants of a Gmail address
function getDotVariant(email, index) {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const originalUsername = parts[0];
  const domain = parts[1];
  
  const canonicalUsername = originalUsername.replace(/\./g, '');
  if (canonicalUsername.length <= 1) return email;
  
  // Calculate baseIndex of the original email address
  let baseIndex = 0;
  let canonicalPos = 0;
  for (let i = 0; i < originalUsername.length - 1; i++) {
    if (originalUsername[i] !== '.') {
      if (originalUsername[i + 1] === '.') {
        baseIndex |= (1 << canonicalPos);
      }
      canonicalPos++;
    }
  }
  
  const numSlots = canonicalUsername.length - 1;
  const maxVariants = 1 << numSlots;
  
  const targetIndex = (baseIndex + index) % maxVariants;
  
  let variant = canonicalUsername[0];
  for (let i = 0; i < numSlots; i++) {
    if ((targetIndex & (1 << i)) !== 0) {
      variant += '.';
    }
    variant += canonicalUsername[i + 1];
  }
  
  return `${variant}@${domain}`;
}

let otpProvider = null;

function registerOtpProvider(fn) {
  otpProvider = fn;
}

// ─────────────────────────────────────────────
// MAIN: Full login flow + send prompt
// ─────────────────────────────────────────────
async function loginAndGetToken(options = {}) {
  logToTask(options, '\n🔄 [syntx-bot] Memulai proses login syntx.ai...', 'info');
  
  // Prioritas: 1) OpenInbox (gratis, stabil), 2) dot-variant, 3) Emailnator, 4) Gmailnator, 5) Mail.tm
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const baseEmail = process.env.SYNTX_BASE_EMAIL;
  let email;
  let syntxToken;
  let emailnatorCookies = null;
  let emailnatorXsrf = null;
  let openInboxId = null;
  let openInboxSession = null;

  // === OPSI 1: OpenInbox.io (gratis, tanpa API key) ===
  try {
    logToTask(options, '📧 [syntx-bot] Mencoba OpenInbox.io (gratis)...', 'info');
    const { email: oiEmail, inboxId, session } = await createOpenInboxEmail(options);
    email = oiEmail;
    openInboxId = inboxId;
    openInboxSession = session;
  } catch (oiErr) {
    logToTask(options, `⚠️ [syntx-bot] OpenInbox gagal: ${oiErr.message}`, 'warning');
    openInboxId = null;
  }

  // === OPSI 2: Gmail dot-variant (jika OpenInbox gagal & ada base email) ===
  if (!email && baseEmail && baseEmail.includes('@')) {
    const currentIndex = parseInt(process.env.SYNTX_EMAIL_INDEX || '0', 10);
    email = getDotVariant(baseEmail, currentIndex);
    logToTask(options, `📧 [syntx-bot] Menggunakan Gmail dot-variant (${currentIndex}): ${email}`, 'info');
    if (options.onEmailGenerated) {
      options.onEmailGenerated(currentIndex + 1);
    }
  }
  // === OPSI 3: Emailnator Web ===
  else if (!email) {
    try {
      logToTask(options, '🌐 [syntx-bot] Mencoba Emailnator Web API (gratis, tanpa key)...', 'info');
      const { email: enEmail, cookies: enCookies, xsrfToken: enXsrf } = await createEmailnatorGmail(options);
      email = enEmail;
      emailnatorCookies = enCookies;
      emailnatorXsrf = enXsrf;
    } catch (enErr) {
      logToTask(options, `⚠️ [syntx-bot] Emailnator gagal: ${enErr.message}`, 'warning');

      // === OPSI 4: Gmailnator RapidAPI ===
      if (rapidApiKey) {
        logToTask(options, '🔑 [syntx-bot] Fallback ke Gmailnator (RapidAPI)...', 'info');
        email = await createGmailnatorEmail(rapidApiKey, options);
      }
      // === OPSI 5: Mail.tm ===
      else {
        logToTask(options, '⚠️ [syntx-bot] Fallback ke Mail.tm...', 'warning');
        const { email: tempEmail, mailToken, accountId } = await createTempEmail(options);
        email = tempEmail;
        sessionState.mailToken = mailToken;
        sessionState.mailId = accountId;
      }
    }
  }

  if (!email) {
    throw new Error('Gagal membuat email untuk registrasi Syntx.ai');
  }

  // Send OTP
  await requestSyntxOTP(email, options);

  // Retrieve OTP sesuai sumber email
  let otp;
  if (openInboxId && openInboxSession) {
    // OpenInbox inbox (free, no API key)
    try {
      otp = await fetchOTPFromOpenInbox(openInboxSession, openInboxId, 60000, options);
    } catch (err) {
      logToTask(options, `⚠️ Gagal mengambil OTP dari OpenInbox: ${err.message}`, 'warning');
    }
  } else if (emailnatorCookies) {
    // Emailnator inbox
    try {
      otp = await fetchOTPFromEmailnator(email, emailnatorCookies, emailnatorXsrf, 90000, options);
    } catch (err) {
      logToTask(options, `⚠️ Gagal mengambil OTP dari Emailnator: ${err.message}`, 'warning');
    }
  } else if (rapidApiKey) {
    // Gmailnator (RapidAPI) - for dot-variant or Gmailnator email
    try {
      otp = await fetchOTPFromGmailnator(rapidApiKey, email, 60000, options);
    } catch (err) {
      logToTask(options, `⚠️ Gagal mengambil OTP dari Gmailnator: ${err.message}`, 'warning');
    }
  } else if (sessionState.mailToken) {
    // Mail.tm
    try {
      otp = await fetchOTPFromMailTm(sessionState.mailToken, 60000, options);
    } catch (err) {
      logToTask(options, `⚠️ Gagal mengambil OTP dari Mail.tm: ${err.message}`, 'warning');
    }
  }

  // Fallback to manual OTP if automated failed/wasn't tried
  if (!otp && otpProvider) {
    logToTask(options, `⏳ [syntx-bot] Menunggu input OTP manual untuk email: ${email}...`, 'warning');
    otp = await otpProvider(email, options.taskId || 'manual');
  }

  if (!otp) {
    throw new Error('Gagal mendapatkan OTP untuk verifikasi Syntx.ai');
  }

  syntxToken = await verifySyntxOTP(email, otp, options);
  
  const newAccount = {
    email: email,
    token: syntxToken,
    expiresAt: Date.now() + (23 * 60 * 60 * 1000), // 23 jam
    messageCount: 0,
    messageLimit: MAX_MESSAGES_LIMIT,
    isValid: true,
    createdAt: new Date().toISOString()
  };

  const pool = loadAccountsPool();
  const existingIdx = pool.findIndex(acc => acc.email === email);
  if (existingIdx !== -1) {
    pool[existingIdx] = newAccount;
  } else {
    pool.push(newAccount);
  }
  saveAccountsPool(pool);

  sessionState = { ...newAccount };
  
  logToTask(options, `🎉 [syntx-bot] Login syntx.ai berhasil! Akun ${email} ditambahkan ke pool.\n`, 'success');
  return syntxToken;
}

// ─────────────────────────────────────────────
// PUBLIC API: callSyntx(prompt)
// Auto-rotate akun saat mendekati/melebihi limit pesan
// ─────────────────────────────────────────────
async function callSyntx(prompt, model = 'claude-sonnet-4-5', options = {}, imageUrl = null, _retryCount = 0) {
  const MAX_RETRIES = 5;
  if (_retryCount >= MAX_RETRIES) {
    throw new Error(`Gagal setelah ${MAX_RETRIES} percobaan: semua akun Syntx rate-limited atau expired. Coba lagi nanti atau tambahkan akun baru.`);
  }
  let pool = loadAccountsPool();
  
  // Cari akun yang valid di pool
  let activeAccount = pool.find(acc => {
    const isTokenValid = acc.token && acc.expiresAt && Date.now() < acc.expiresAt;
    const isUnderLimit = acc.messageCount < MAX_MESSAGES_LIMIT;
    return isTokenValid && isUnderLimit && acc.isValid !== false;
  });

  if (!activeAccount) {
    logToTask(options, '🔑 [syntx-bot] Tidak ada akun valid di pool (semua limit/expired/kosong). Membuat akun baru...', 'info');
    const token = await loginAndGetToken(options);
    
    // loginAndGetToken memperbarui sessionState dan menyimpannya ke pool, load ulang pool & cari
    pool = loadAccountsPool();
    activeAccount = pool.find(acc => acc.email === sessionState.email);
  }

  if (!activeAccount) {
    throw new Error("Gagal mendapatkan akun aktif untuk request Syntx.ai");
  }

  // Set current active sessionState
  sessionState = { ...activeAccount };

  try {
    const result = await sendPromptToSyntx(sessionState.token, prompt, model, options, imageUrl);
    
    // Sukses: update messageCount
    pool = loadAccountsPool();
    const idx = pool.findIndex(acc => acc.email === sessionState.email);
    if (idx !== -1) {
      pool[idx].messageCount++;
      sessionState.messageCount = pool[idx].messageCount;
      const limit = MAX_MESSAGES_LIMIT;
      if (pool[idx].messageCount >= limit) {
        logToTask(options, `❌ [syntx-bot] Akun ${sessionState.email} mencapai batas ${limit} pesan. Menghapus dari pool...`, 'warning');
        pool.splice(idx, 1);
        sessionState.token = null; // force login/rotation next time
      }
      saveAccountsPool(pool);
    }
    
    logToTask(options, `📊 [syntx-bot] [${sessionState.email}] Pesan ke-${sessionState.messageCount}/${MAX_MESSAGES_LIMIT} di akun ini`, 'info');
    return result;
  } catch (err) {
    const status = err.response?.status;
    const isAuthError = status === 401 || err.message === 'TOKEN_EXPIRED';
    const isLimitError = status === 402 || status === 403 || status === 429 ||
                         err.message?.toLowerCase().includes('limit') ||
                         err.message?.toLowerCase().includes('quota') ||
                         err.message?.toLowerCase().includes('rate') ||
                         err.message?.toLowerCase().includes('429');
    
    if (isAuthError || isLimitError) {
      logToTask(options, `❌ [syntx-bot] Akun ${sessionState.email} bermasalah (status ${status}, ${err.message}). Menghapus dari pool...`, 'warning');
      pool = loadAccountsPool();
      const idx = pool.findIndex(acc => acc.email === sessionState.email);
      if (idx !== -1) {
        pool.splice(idx, 1);
        saveAccountsPool(pool);
      }
      sessionState.token = null;
      // Coba panggil ulang (dia akan cari akun lain atau bikin baru)
      return callSyntx(prompt, model, options, imageUrl, _retryCount + 1);
    }
    
    throw err;
  }
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
module.exports = {
  callSyntx,
  loginAndGetToken,
  registerOtpProvider,
  getPoolStatus,
  getSessionState: () => ({ ...sessionState, token: sessionState.token ? '***HIDDEN***' : null }),
};

// ─────────────────────────────────────────────
// STANDALONE TEST MODE
// ─────────────────────────────────────────────
if (require.main === module) {
  (async () => {
    console.log('🧪 Menjalankan tes syntx-bot standalone...\n');
    try {
      const result = await callSyntx('Hello! Please respond with a short JSON object: { "status": "ok", "message": "Hello from Syntx Claude!" }');
      console.log('\n📄 Hasil dari syntx.ai:\n', result);
    } catch (err) {
      console.error('\n❌ Test gagal:', err.message);
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data:', JSON.stringify(err.response.data));
      }
      process.exit(1);
    }
  })();
}
