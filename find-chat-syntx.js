/**
 * find-chat-syntx.js
 * Probe chat.syntx.ai dan cari endpoint yang benar untuk chat
 */

require('dotenv').config();
const axios = require('axios');

const MAIL_TM_API  = 'https://api.mail.tm';
const SYNTX_API_V1 = 'https://api.syntx.ai/api/v1';
const CHAT_BASE    = 'https://chat.syntx.ai';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rnd(n = 8) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: n}, () => c[Math.floor(Math.random()*c.length)]).join('');
}

async function loginSyntx() {
  const domainRes = await axios.get(`${MAIL_TM_API}/domains`);
  const domain = domainRes.data['hydra:member'][0].domain;
  const email = `chatprobe_${rnd(6)}@${domain}`;
  const pw = `P@ss${rnd(8)}!`;

  await axios.post(`${MAIL_TM_API}/accounts`, { address: email, password: pw });
  const loginRes = await axios.post(`${MAIL_TM_API}/token`, { address: email, password: pw });
  const mailToken = loginRes.data.token;

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

  const verRes = await axios.post(`${SYNTX_API_V1}/auth/email/verify-otp`, {
    email, otp_code: otp
  }, {
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://syntx.ai' }
  });
  const token = verRes.data?.token || verRes.data?.data?.token;
  console.log(`✅ Login OK. Email: ${email}, Token: ${token?.substring(0, 40)}...`);
  return token;
}

async function probeChat(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream, */*',
    'Origin': 'https://syntx.ai',
    'Referer': 'https://syntx.ai/text/claude'
  };

  // 1. Probe chat.syntx.ai - GET requests
  console.log('\n=== PROBING chat.syntx.ai ===');
  const getProbes = ['/', '/health', '/api', '/v1', '/v2', '/text', '/chat', '/claude'];
  for (const p of getProbes) {
    try {
      const res = await axios.get(`${CHAT_BASE}${p}`, { headers, timeout: 8000, validateStatus: () => true });
      console.log(`GET ${CHAT_BASE}${p} → ${res.status}: ${JSON.stringify(res.data).substring(0, 200)}`);
    } catch (e) {
      console.log(`GET ${CHAT_BASE}${p} → ERROR: ${e.message}`);
    }
  }

  // 2. Probe chat.syntx.ai POST endpoints
  const payload = {
    messages: [{ role: 'user', content: 'Hello, please respond with just "OK"' }],
    model: 'claude-3-5-sonnet-20241022',
    stream: false
  };

  const postProbes = [
    '/',
    '/chat',
    '/chat/completions',
    '/v1/chat/completions',
    '/api/chat',
    '/api/v1/chat/completions',
    '/completions',
    '/text',
    '/text/chat',
    '/claude',
    '/claude/chat',
  ];

  console.log('\n=== POST PROBES chat.syntx.ai ===');
  for (const p of postProbes) {
    try {
      const res = await axios.post(`${CHAT_BASE}${p}`, payload, { headers, timeout: 15000, validateStatus: () => true });
      const icon = res.status < 300 ? '✅✅✅' : res.status === 404 ? '❌' : '⚠️';
      console.log(`${icon} POST ${CHAT_BASE}${p} → ${res.status}: ${JSON.stringify(res.data).substring(0, 300)}`);
      if (res.status < 300) {
        console.log('\n🎉🎉🎉 FOUND WORKING ENDPOINT!');
        console.log('Full response:', JSON.stringify(res.data, null, 2));
      }
    } catch (e) {
      console.log(`POST ${CHAT_BASE}${p} → ${e.message}`);
    }
  }

  // 3. Also check api.syntx.ai with different paths
  console.log('\n=== MORE PROBES api.syntx.ai ===');
  const moreProbes = [
    'https://api.syntx.ai/api/v1/text/ai',
    'https://api.syntx.ai/api/v2/text/ai',
    'https://api.syntx.ai/api/v1/text/claude/chat',
    'https://api.syntx.ai/api/v2/text/claude/chat',
    'https://api.syntx.ai/text/chat',
    'https://api.syntx.ai/text/claude',
    'https://api.syntx.ai/api/v1/ai/text/claude',
    'https://api.syntx.ai/api/v1/session',
    'https://api.syntx.ai/api/v2/session',
  ];

  for (const url of moreProbes) {
    try {
      const res = await axios.post(url, payload, { headers, timeout: 10000, validateStatus: () => true });
      const icon = res.status < 300 ? '✅✅✅' : res.status === 404 ? '❌' : '⚠️';
      console.log(`${icon} POST ${url} → ${res.status}: ${JSON.stringify(res.data).substring(0, 300)}`);
    } catch (e) {
      console.log(`POST ${url} → ${e.message}`);
    }
  }
}

async function main() {
  console.log('=== chat.syntx.ai ENDPOINT PROBE ===\n');
  try {
    const token = await loginSyntx();
    await probeChat(token);
  } catch (err) {
    console.error('Fatal:', err.message);
    if (err.response) console.error('Response:', err.response.status, JSON.stringify(err.response.data));
  }
}

main();
