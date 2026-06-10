/**
 * probe-v2-endpoints.js
 * Probe semua pola endpoint v2 yang ditemukan sebelumnya
 * /api/v2/get_model_info → 200 (sudah konfirmasi)
 * /api/v1/folders/text/list → 200 (sudah konfirmasi)
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
  const email = `v2probe_${rnd(6)}@${domain}`;
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
    const msgs = await axios.get(`${MAIL_TM_API}/messages`, { headers: { 'Authorization': `Bearer ${mailToken}` } });
    const m = msgs.data['hydra:member'] || [];
    if (m.length > 0) {
      const msg = await axios.get(`${MAIL_TM_API}/messages/${m[0].id}`, { headers: { 'Authorization': `Bearer ${mailToken}` } });
      const match = (msg.data.text || '').match(/\b(\d{6})\b/);
      if (match) otp = match[1];
    }
    if (!otp) process.stdout.write(`${i+1} `);
  }
  console.log('');
  const verRes = await axios.post(`${SYNTX_API_V1}/auth/email/verify-otp`, { email, otp_code: otp }, {
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://syntx.ai' }
  });
  const token = verRes.data?.token || verRes.data?.data?.token;
  console.log(`✅ Token OK`);
  return token;
}

async function probe(token, method, path, body = null) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream, */*',
    'Origin': 'https://syntx.ai',
    'Referer': 'https://syntx.ai/text/claude'
  };
  try {
    const opts = { headers, timeout: 10000, validateStatus: () => true };
    const res = body 
      ? await axios.post(`${SYNTX_BASE}${path}`, body, opts)
      : await axios.get(`${SYNTX_BASE}${path}`, opts);
    const icon = res.status < 300 ? '✅' : res.status === 404 ? '❌' : '⚠️';
    const data = JSON.stringify(res.data).substring(0, 300);
    console.log(`${icon} ${method} ${path} → ${res.status}: ${data}`);
    if (res.status < 300 && (method === 'POST' || data.length > 10)) {
      console.log(`   FULL: ${JSON.stringify(res.data, null, 2).substring(0, 800)}`);
    }
  } catch (e) {
    console.log(`💥 ${method} ${path} → ${e.message}`);
  }
}

async function main() {
  const token = await loginSyntx();
  
  console.log('\n=== V2 ENDPOINT PROBES ===');
  
  // Based on /api/v2/get_model_info pattern
  await probe(token, 'GET', '/api/v2/get_model_info?ai_name=claude&model_type=claude-sonnet-4-6');
  await probe(token, 'GET', '/api/v2/get_model_info?ai_name=chatgpt&model_type=gpt-4o');
  
  // V2 variations based on underscore naming convention
  await probe(token, 'POST', '/api/v2/send_message', { ai_name: 'claude', model_type: 'claude-sonnet-4-6', message: 'hello', session_id: null });
  await probe(token, 'POST', '/api/v2/text_generate', { ai_name: 'claude', model_type: 'claude-sonnet-4-6', prompt: 'hello' });
  await probe(token, 'POST', '/api/v2/create_chat', { ai_name: 'claude', model_type: 'claude-sonnet-4-6' });
  await probe(token, 'POST', '/api/v2/ai_chat', { ai_name: 'claude', message: 'hello' });
  await probe(token, 'POST', '/api/v2/ai_request', { ai_name: 'claude', model: 'claude-sonnet-4-6', message: 'hello' });
  await probe(token, 'GET', '/api/v2/session?ai_name=claude');
  await probe(token, 'POST', '/api/v2/session', { ai_name: 'claude' });
  await probe(token, 'GET', '/api/v2/history?ai_name=claude');
  await probe(token, 'GET', '/api/v2/chat_history?ai_name=claude');
  
  console.log('\n=== V1 FOLDERS-BASED PROBES ===');
  // Based on /api/v1/folders/text/list pattern
  await probe(token, 'GET', '/api/v1/folders/text/list');
  await probe(token, 'POST', '/api/v1/folders/text/create', { name: 'test' });
  await probe(token, 'GET', '/api/v1/sessions/text/list');
  await probe(token, 'GET', '/api/v1/sessions/text/list?ai_name=claude');
  await probe(token, 'POST', '/api/v1/sessions/text/create', { ai_name: 'claude' });
  await probe(token, 'GET', '/api/v1/chats/text/list');
  
  console.log('\n=== ADDITIONAL V1 PROBES ===');
  await probe(token, 'POST', '/api/v1/text/message', { ai_name: 'claude', model: 'claude-sonnet-4-6', message: 'hello' });
  await probe(token, 'GET', '/api/v1/text/list');
  await probe(token, 'POST', '/api/v1/request/text', { ai_name: 'claude', content: 'hello' });
  
  // Endpoint dari Playwright capture sebelumnya: promo_banners, document
  await probe(token, 'GET', '/api/v1/promo_banners?lang=en');
  
  // Coba dengan session creation
  await probe(token, 'POST', '/api/v1/chat/create', { ai_name: 'claude', model_type: 'claude-sonnet-4-6' });
  await probe(token, 'POST', '/api/v1/chat/message', { ai_name: 'claude', session_id: null, message: 'hello' });
  await probe(token, 'POST', '/api/v1/chat/text/create', { ai_name: 'claude' });
  await probe(token, 'POST', '/api/v1/text/chat/create', { ai_name: 'claude' });
  
  // Plural forms  
  await probe(token, 'GET', '/api/v1/chats?ai_name=claude&scope=text');
  await probe(token, 'POST', '/api/v1/chats', { ai_name: 'claude', scope: 'text' });
  await probe(token, 'POST', '/api/v1/dialogs', { ai_name: 'claude' });
  await probe(token, 'GET', '/api/v1/dialogs?ai_name=claude');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  if (e.response) console.error('Resp:', e.response.status, JSON.stringify(e.response.data));
});
