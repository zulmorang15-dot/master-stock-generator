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
  messageCount: 0,      // jumlah pesan yang sudah dikirim di akun ini
  messageLimit: 10,     // limit pesan per akun (dari API: "limit":10)
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

// ─────────────────────────────────────────────
// STEP 1: Buat akun email temporer di mail.tm
// ─────────────────────────────────────────────
async function createTempEmail() {
  console.log('📧 [syntx-bot] Membuat email temporer via mail.tm...');

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
  console.log(`✅ [syntx-bot] Email temporer dibuat: ${email} (ID: ${accountId})`);

  const loginRes = await axios.post(`${MAIL_TM_API}/token`, {
    address: email,
    password: password
  }, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 15000
  });

  const mailToken = loginRes.data.token;
  console.log(`🔑 [syntx-bot] Token mail.tm berhasil didapat`);

  return { email, password, accountId, mailToken };
}

// ─────────────────────────────────────────────
// STEP 2: Request OTP ke syntx.ai
// ─────────────────────────────────────────────
async function requestSyntxOTP(email) {
  console.log(`📨 [syntx-bot] Meminta OTP syntx.ai untuk: ${email}`);
  
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
  console.log(`✅ [syntx-bot] OTP terkirim ke ${email}:`, res.data?.message || 'OK');
  return true;
}

// ─────────────────────────────────────────────
// STEP 3: Ambil OTP dari inbox mail.tm
// ─────────────────────────────────────────────
async function fetchOTPFromMailTm(mailToken, maxWaitMs = 60000) {
  console.log('🔍 [syntx-bot] Menunggu OTP di inbox mail.tm...');
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
        console.log(`⏳ [syntx-bot] Inbox masih kosong, tunggu 5s lagi... (${Math.floor((Date.now() - startTime)/1000)}s)`);
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
        console.log(`🎯 [syntx-bot] OTP berhasil ditemukan: ${otp}`);
        return otp;
      }

      const subject = messages[0].subject || '';
      const subjectMatch = subject.match(/\b(\d{6})\b/);
      if (subjectMatch) {
        const otp = subjectMatch[1];
        console.log(`🎯 [syntx-bot] OTP ditemukan di subject: ${otp}`);
        return otp;
      }

      console.log(`⚠️ [syntx-bot] Pesan diterima tapi OTP tidak ditemukan. Subject: "${messages[0].subject}"`);
    } catch (err) {
      console.warn(`⚠️ [syntx-bot] Error saat cek inbox: ${err.message}`);
    }
  }

  throw new Error('Timeout: OTP tidak diterima dalam 60 detik');
}

// ─────────────────────────────────────────────
// STEP 4: Verifikasi OTP di syntx.ai → dapat token
// ─────────────────────────────────────────────
async function verifySyntxOTP(email, otp) {
  console.log(`🔐 [syntx-bot] Memverifikasi OTP ${otp} untuk ${email}...`);
  
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
  console.log(`✅ [syntx-bot] Token syntx.ai berhasil didapat!`);
  return token;
}

// ─────────────────────────────────────────────
// STEP 5A: Buat sesi chat baru di syntx.ai
// ─────────────────────────────────────────────
async function createChatSession(token) {
  console.log('📂 [syntx-bot] Membuat sesi chat baru...');
  
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
  
  console.log(`✅ [syntx-bot] Sesi chat dibuat: UUID=${chatUuid}, ID=${chatId}`);
  return { uuid: chatUuid, id: chatId };
}

// ─────────────────────────────────────────────
// STEP 5B: Kirim prompt ke syntx.ai Claude chat
// API bersifat async – response dari Claude muncul di messages list
// ─────────────────────────────────────────────
// Highest available models on Syntx (verified via API validation error):
// Claude: claude-opus-4-8
// Gemini: gemini-3.5-flash
async function sendPromptToSyntx(token, prompt, model = 'claude-opus-4-8') {
  const isGemini = model.toLowerCase().startsWith('gemini');
  const aiName = isGemini ? 'gemini' : 'claude';
  const label = isGemini ? 'Gemini' : 'Claude';

  console.log(`🤖 [syntx-bot] Mengirim prompt ke syntx.ai ${label} (${model})...`);
  
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'https://syntx.ai',
    'Referer': `https://syntx.ai/text/${aiName}`
  };
  
  // Buat sesi chat baru → gunakan UUID untuk endpoint berikutnya
  const { uuid: chatUuid } = await createChatSession(token);
  
  // Kirim pesan ke sesi chat (format dikonfirmasi dari Playwright intercept)
  const messagePayload = {
    message_object: {
      object_type: 'text',
      object_url: null,
      object_text: prompt,
      model_type: model
    }
  };
  
  console.log(`   📡 Mengirim ke: /api/v1/chats/${chatUuid}/messages?ai_name=${aiName}`);
  
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
  
  console.log(`   ⏳ Pesan terkirim! Polling untuk respons ${label}...`);
  
  // Poll GET /chats/{uuid}/messages untuk mendapat respons AI
  const maxWait = 120000;  // 2 menit
  const pollInterval = 3000; // 3 detik
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
            console.log(`✅ [syntx-bot] Respons ${label} diterima dalam ${elapsed}s!`);
            return aiContent;
          }
        }
      }
      
      console.log(`   ⏳ Menunggu ${label}... (${elapsed}s, messages: ${messages.length})`);
      
    } catch (pollErr) {
      console.warn(`   ⚠️ Poll error: ${pollErr.message}`);
    }
  }
  
  throw new Error(`Timeout: Respons ${label} tidak diterima dalam 2 menit`);
}

// ─────────────────────────────────────────────
// MAIN: Full login flow + send prompt
// ─────────────────────────────────────────────
async function loginAndGetToken() {
  console.log('\n🔄 [syntx-bot] Memulai proses login syntx.ai...');
  
  const { email, mailToken, accountId } = await createTempEmail();
  
  await requestSyntxOTP(email);
  
  const otp = await fetchOTPFromMailTm(mailToken, 60000);
  
  const syntxToken = await verifySyntxOTP(email, otp);
  
  sessionState.token = syntxToken;
  sessionState.email = email;
  sessionState.mailToken = mailToken;
  sessionState.mailId = accountId;
  sessionState.expiresAt = Date.now() + (23 * 60 * 60 * 1000); // 23 jam
  sessionState.messageCount = 0; // reset counter saat akun baru
  
  console.log('🎉 [syntx-bot] Login syntx.ai berhasil! Session tersimpan.\n');
  return syntxToken;
}

// ─────────────────────────────────────────────
// PUBLIC API: callSyntx(prompt)
// Auto-rotate akun saat mendekati/melebihi limit pesan
// ─────────────────────────────────────────────
async function callSyntx(prompt, model = 'claude-opus-4-8') {
  const isTokenValid = sessionState.token && 
                       sessionState.expiresAt && 
                       Date.now() < sessionState.expiresAt;
  
  // Cek apakah mendekati limit – rotasi akun preventif
  const nearLimit = sessionState.messageCount >= (sessionState.messageLimit - 1);
  
  if (!isTokenValid || nearLimit) {
    if (nearLimit && isTokenValid) {
      console.log(`🔄 [syntx-bot] Mendekati limit pesan (${sessionState.messageCount}/${sessionState.messageLimit}), rotasi akun baru...`);
    } else {
      console.log('🔑 [syntx-bot] Token tidak ada atau expired, melakukan re-login...');
    }
    await loginAndGetToken();
  }

  try {
    const result = await sendPromptToSyntx(sessionState.token, prompt, model);
    sessionState.messageCount++; // track jumlah pesan
    console.log(`📊 [syntx-bot] Pesan ke-${sessionState.messageCount}/${sessionState.messageLimit} di akun ini`);
    return result;
  } catch (err) {
    const status = err.response?.status;
    
    // Handle token expired
    if (err.message === 'TOKEN_EXPIRED' || status === 401) {
      console.log('🔄 [syntx-bot] Token expired, re-login otomatis...');
      sessionState.token = null;
      await loginAndGetToken();
      const result = await sendPromptToSyntx(sessionState.token, prompt, model);
      sessionState.messageCount++;
      return result;
    }
    
    // Handle limit akun tercapai (402 Payment Required atau 403 Forbidden)
    if (status === 402 || status === 403 || 
        err.message?.toLowerCase().includes('limit') ||
        err.message?.toLowerCase().includes('quota')) {
      console.log(`🔄 [syntx-bot] Limit akun tercapai (status ${status}), membuat akun baru...`);
      sessionState.token = null;
      sessionState.messageCount = 0;
      await loginAndGetToken();
      const result = await sendPromptToSyntx(sessionState.token, prompt, model);
      sessionState.messageCount++;
      return result;
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
