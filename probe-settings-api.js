/**
 * probe-settings-api.js
 * Login ke syntx.ai dan probe endpoint settings untuk mendapat AI list
 * Kemudian coba semua endpoint yang mungkin berkaitan dengan text generation
 */

require('dotenv').config();
const axios = require('axios');

const MAIL_TM_API  = 'https://api.mail.tm';
const SYNTX_API_V1 = 'https://api.syntx.ai/api/v1';
const SYNTX_BASE   = 'https://api.syntx.ai';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rnd(n = 8) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: n}, () => c[Math.floor(Math.random()*c.length)]).join('');
}

async function loginSyntx() {
  const domainRes = await axios.get(`${MAIL_TM_API}/domains`);
  const domain = domainRes.data['hydra:member'][0].domain;
  const email = `settings_${rnd(6)}@${domain}`;
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
  console.log(`✅ Logged in as ${email}`);
  return token;
}

async function main() {
  const token = await loginSyntx();
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'https://syntx.ai',
    'Referer': 'https://syntx.ai/text/claude'
  };

  // 1. Coba endpoint settings (dari hr("settings") yang ditemukan sebelumnya)
  console.log('\n=== GET settings ===');
  try {
    const res = await axios.get(`${SYNTX_API_V1}/settings`, { headers, validateStatus: () => true });
    console.log(`Status: ${res.status}`);
    console.log('Data:', JSON.stringify(res.data, null, 2).substring(0, 1000));
  } catch (e) { console.log('Error:', e.message); }

  // 2. Coba GET models dari settings
  console.log('\n=== GET settings.ai_list ===');
  try {
    const res = await axios.get(`${SYNTX_API_V1}/settings`, { headers, validateStatus: () => true });
    if (res.data?.ai_list) {
      console.log('AI List:', JSON.stringify(res.data.ai_list, null, 2).substring(0, 2000));
    }
  } catch (e) { console.log('Error:', e.message); }

  // 3. Probe semua variasi endpoint dengan token valid
  const probes = [
    // Endpoint berbasis aiName
    { method: 'GET', path: '/api/v1/text/claude' },
    { method: 'GET', path: '/api/v2/text/claude' },
    { method: 'GET', path: '/api/v1/text/sessions' },
    { method: 'GET', path: '/api/v2/text/sessions' },
    { method: 'POST', path: '/api/v1/text/sessions', body: { ai_name: 'claude' } },
    { method: 'POST', path: '/api/v2/text/sessions', body: { ai_name: 'claude' } },
    { method: 'GET', path: '/api/v1/text/history' },
    { method: 'GET', path: '/api/v2/text/history' },
    { method: 'GET', path: '/api/v1/session' },
    { method: 'POST', path: '/api/v1/session', body: { type: 'text', ai_name: 'claude' } },
    { method: 'GET', path: '/api/v1/user' },
    { method: 'GET', path: '/api/v2/user' },
    // Coba endpoint dengan auth/identities yang berhasil sebelumnya sebagai template
    { method: 'GET', path: '/api/v1/auth/identities' },
    { method: 'POST', path: '/api/v1/text', body: { ai_name: 'claude', message: 'hello' } },
    { method: 'POST', path: '/api/v2/text', body: { ai_name: 'claude', message: 'hello' } },
    // Endpoint dengan format berbeda
    { method: 'POST', path: '/api/v1/messages', body: { ai: 'claude', content: 'hello', type: 'text' } },
    { method: 'POST', path: '/api/v2/messages', body: { ai: 'claude', content: 'hello', type: 'text' } },
    { method: 'POST', path: '/api/v1/ask', body: { ai: 'claude', prompt: 'hello' } },
  ];

  console.log('\n=== ENDPOINT PROBES ===');
  for (const probe of probes) {
    try {
      let res;
      if (probe.method === 'GET') {
        res = await axios.get(`${SYNTX_BASE}${probe.path}`, { headers, timeout: 8000, validateStatus: () => true });
      } else {
        res = await axios.post(`${SYNTX_BASE}${probe.path}`, probe.body, { headers, timeout: 8000, validateStatus: () => true });
      }
      const icon = res.status < 300 ? '✅' : res.status === 404 ? '❌' : '⚠️';
      const data = JSON.stringify(res.data).substring(0, 200);
      console.log(`${icon} ${probe.method} ${probe.path} → ${res.status}: ${data}`);
      
      if (res.status < 300 && probe.method === 'GET') {
        console.log('   FULL DATA:', JSON.stringify(res.data, null, 2).substring(0, 500));
      }
    } catch (e) {
      console.log(`💥 ${probe.method} ${probe.path} → ${e.message}`);
    }
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  if (e.response) console.error('Response:', e.response.status, JSON.stringify(e.response.data));
});
