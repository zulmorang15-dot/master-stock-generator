/**
 * probe-ai-endpoint.js
 * Probe endpoint /api/v1/ai/* untuk menemukan endpoint chat
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
  const email = `aiprobe_${rnd(6)}@${domain}`;
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
    if (!otp) console.log(`⏳ ${i+1}/12`);
  }
  const verRes = await axios.post(`${SYNTX_API_V1}/auth/email/verify-otp`, { email, otp_code: otp }, {
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

  // 1. Pertama ambil AI list untuk tau nilai yang benar untuk ai_name
  console.log('\n=== GET AI List ===');
  const aiRes = await axios.get(`${SYNTX_API_V1}/ai?lang=en`, { headers, validateStatus: () => true });
  console.log('Status:', aiRes.status);
  if (aiRes.status === 200) {
    const claudeAi = (aiRes.data || []).find(a => a.value === 'claude' || a.label?.toLowerCase().includes('claude'));
    console.log('Claude AI:', JSON.stringify(claudeAi, null, 2));
    const allAis = (aiRes.data || []).map(a => `${a.value} (${a.scope})`).join(', ');
    console.log('All AIs:', allAis);
  }

  // 2. Get AI Models
  console.log('\n=== GET AI Models ===');
  const modRes = await axios.get(`${SYNTX_API_V1}/ai/models?lang=en`, { headers, validateStatus: () => true });
  console.log('Status:', modRes.status);
  if (modRes.status === 200) {
    const claudeModels = (modRes.data || []).filter(m => m.ai_name === 'claude');
    console.log('Claude models:', JSON.stringify(claudeModels, null, 2).substring(0, 1000));
  }

  // 3. Probe /api/v1/ai/* endpoints  
  const aiProbes = [
    { method: 'GET', path: '/api/v1/ai/claude' },
    { method: 'GET', path: '/api/v1/ai/claude/sessions' },
    { method: 'GET', path: '/api/v1/ai/claude/history' },
    { method: 'GET', path: '/api/v1/ai/claude/chat' },
    { method: 'POST', path: '/api/v1/ai/claude/sessions', body: {} },
    { method: 'POST', path: '/api/v1/ai/claude/chat', body: { message: 'hello', model: 'claude-3-5-sonnet-20241022' } },
    { method: 'POST', path: '/api/v1/ai/claude/message', body: { content: 'hello' } },
    { method: 'GET', path: '/api/v1/ai/chatgpt' },
    { method: 'GET', path: '/api/v1/ai/chatgpt/sessions' },
    { method: 'POST', path: '/api/v1/ai/chatgpt/sessions', body: {} },
    // Probe with session ID
    { method: 'POST', path: '/api/v1/sessions', body: { ai_name: 'claude' } },
    { method: 'GET', path: '/api/v1/sessions' },
    { method: 'GET', path: '/api/v1/sessions?ai_name=claude' },
    { method: 'POST', path: '/api/v1/chat', body: { ai_name: 'claude', message: 'Hello' } },
    { method: 'POST', path: '/api/v1/generate', body: { ai_name: 'claude', prompt: 'Hello' } },
    { method: 'POST', path: '/api/v1/request', body: { ai_name: 'claude', type: 'text', content: 'Hello' } },
    { method: 'GET', path: '/api/v1/ai/claude/models' },
    { method: 'GET', path: '/api/v1/notification/unread/count' },
    { method: 'GET', path: '/api/v1/chatwoot/unread' },
  ];

  console.log('\n=== AI ENDPOINT PROBES ===');
  for (const probe of aiProbes) {
    try {
      let res;
      if (probe.method === 'GET') {
        res = await axios.get(`${SYNTX_BASE}${probe.path}`, { headers, timeout: 8000, validateStatus: () => true });
      } else {
        res = await axios.post(`${SYNTX_BASE}${probe.path}`, probe.body, { headers, timeout: 8000, validateStatus: () => true });
      }
      const icon = res.status < 300 ? '✅' : res.status === 404 ? '❌' : '⚠️';
      const data = JSON.stringify(res.data).substring(0, 300);
      console.log(`${icon} ${probe.method} ${probe.path} → ${res.status}: ${data}`);
    } catch (e) {
      console.log(`💥 ${probe.method} ${probe.path} → ${e.message}`);
    }
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  if (e.response) console.error('Resp:', e.response.status, JSON.stringify(e.response.data));
});
