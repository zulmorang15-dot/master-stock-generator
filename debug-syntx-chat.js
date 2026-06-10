/**
 * debug-syntx-chat.js
 * Script untuk menemukan endpoint chat yang benar di syntx.ai
 * Login sudah berhasil, sekarang kita cari endpoint chat
 */

require('dotenv').config();
const axios = require('axios');

const MAIL_TM_API  = 'https://api.mail.tm';
const SYNTX_API_V1 = 'https://api.syntx.ai/api/v1';
const SYNTX_API_V2 = 'https://api.syntx.ai/api/v2';
const SYNTX_BASE   = 'https://api.syntx.ai';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rnd(n = 8) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: n}, () => c[Math.floor(Math.random()*c.length)]).join('');
}

async function loginSyntx() {
  // Email temporer
  const domainRes = await axios.get(`${MAIL_TM_API}/domains`);
  const domain = domainRes.data['hydra:member'][0].domain;
  const email = `chatdebug_${rnd(6)}@${domain}`;
  const pw = `P@ss${rnd(8)}!`;

  await axios.post(`${MAIL_TM_API}/accounts`, { address: email, password: pw });
  const loginRes = await axios.post(`${MAIL_TM_API}/token`, { address: email, password: pw });
  const mailToken = loginRes.data.token;
  console.log(`✅ Email: ${email}`);

  // OTP
  await axios.post(`${SYNTX_API_V1}/auth/email/send-otp`, { email }, {
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://syntx.ai' }
  });

  let otp = null;
  for (let i = 0; i < 12 && !otp; i++) {
    await sleep(5000);
    const msgs = await axios.get(`${MAIL_TM_API}/messages`, {
      headers: { 'Authorization': `Bearer ${mailToken}` }
    });
    const m = msgs.data['hydra:member'] || [];
    if (m.length > 0) {
      const msg = await axios.get(`${MAIL_TM_API}/messages/${m[0].id}`, {
        headers: { 'Authorization': `Bearer ${mailToken}` }
      });
      const match = (msg.data.text || '').match(/\b(\d{6})\b/);
      if (match) otp = match[1];
    }
    if (!otp) console.log(`⏳ Tunggu OTP... ${i+1}/12`);
  }
  console.log(`✅ OTP: ${otp}`);

  // Verify
  const verRes = await axios.post(`${SYNTX_API_V1}/auth/email/verify-otp`, {
    email, otp_code: otp
  }, {
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://syntx.ai' }
  });
  const token = verRes.data?.token || verRes.data?.data?.token || verRes.data?.access_token;
  console.log(`✅ Token syntx.ai: ${token?.substring(0, 40)}...`);
  console.log('Full response:', JSON.stringify(verRes.data, null, 2));
  return { token, email };
}

async function probeEndpoints(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'https://syntx.ai',
    'Referer': 'https://syntx.ai/text/claude'
  };

  // Endpoints yang akan di-probe (GET untuk discovery, POST untuk chat)
  const getProbes = [
    '/api/v1/user/profile',
    '/api/v1/user/me',
    '/api/v1/profile',
    '/api/v1/me',
    '/api/v2/user/profile',
    '/api/v2/user/me',
    '/api/v1/text/models',
    '/api/v1/models',
    '/api/v2/models',
    '/api/v1/text',
    '/api/v2/text',
    '/api/v1/conversations',
    '/api/v2/conversations',
  ];

  console.log('\n=== GET Endpoint Probe ===');
  for (const path of getProbes) {
    try {
      const res = await axios.get(`${SYNTX_BASE}${path}`, { headers, timeout: 8000, validateStatus: () => true });
      const icon = res.status < 300 ? '✅' : res.status === 404 ? '❌' : '⚠️';
      console.log(`${icon} GET ${path} → ${res.status}: ${JSON.stringify(res.data).substring(0, 150)}`);
    } catch (e) {
      console.log(`💥 GET ${path} → ${e.message}`);
    }
  }

  // POST Probes dengan minimal payload
  const postPayload = {
    messages: [{ role: 'user', content: 'hi' }],
    model: 'claude-3-5-sonnet-20241022'
  };

  const postProbes = [
    '/api/v1/text/completions',
    '/api/v2/text/completions',
    '/api/v1/completions',
    '/api/v2/completions',
    '/api/v1/text/generate',
    '/api/v2/text/generate',
    '/api/v1/generate',
    '/api/v2/generate',
    '/api/v1/text/message',
    '/api/v2/text/message',
    '/api/v1/message',
    '/api/v2/message',
    '/api/v1/text/send',
    '/api/v2/text/send',
    '/api/v1/claude',
    '/api/v2/claude',
    '/api/v1/ai/text',
    '/api/v2/ai/text',
    '/api/v1/ai/chat',
    '/api/v2/ai/chat',
  ];

  console.log('\n=== POST Endpoint Probe ===');
  for (const path of postProbes) {
    try {
      const res = await axios.post(`${SYNTX_BASE}${path}`, postPayload, { headers, timeout: 10000, validateStatus: () => true });
      const icon = res.status < 300 ? '✅' : res.status === 404 ? '❌' : '⚠️';
      console.log(`${icon} POST ${path} → ${res.status}: ${JSON.stringify(res.data).substring(0, 200)}`);
      if (res.status < 300) {
        console.log('\n🎉🎉🎉 FOUND WORKING ENDPOINT:', path);
        console.log('Full response:', JSON.stringify(res.data, null, 2));
      }
    } catch (e) {
      console.log(`💥 POST ${path} → ${e.message}`);
    }
  }
}

async function main() {
  console.log('=== DEBUG: Mencari endpoint chat syntx.ai ===\n');
  try {
    const { token } = await loginSyntx();
    await probeEndpoints(token);
  } catch (err) {
    console.error('Fatal:', err.message);
    if (err.response) {
      console.error('Response:', err.response.status, JSON.stringify(err.response.data));
    }
  }
}

main();
