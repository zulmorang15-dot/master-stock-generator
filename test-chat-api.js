/**
 * test-chat-api.js
 * Test endpoint chat dengan debug respons penuh
 */

require('dotenv').config();
const axios = require('axios');

const MAIL_TM_API  = 'https://api.mail.tm';
const SYNTX_API_V1 = 'https://api.syntx.ai/api/v1';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rnd(n = 8) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: n}, () => c[Math.floor(Math.random()*c.length)]).join('');
}

async function loginSyntx() {
  const domainRes = await axios.get(`${MAIL_TM_API}/domains`);
  const domain = domainRes.data['hydra:member'][0].domain;
  const email = `chattest_${rnd(6)}@${domain}`;
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
  console.log(`✅ Logged in`);
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

  // 1. Buat chat baru dan lihat respons penuh
  console.log('\n=== POST /chats (create session) ===');
  const chatRes = await axios.post(`${SYNTX_API_V1}/chats`, {
    title: 'New chat',
    scope: 'text'
  }, { headers, timeout: 30000, validateStatus: () => true });
  
  console.log('Status:', chatRes.status);
  console.log('Full response:', JSON.stringify(chatRes.data, null, 2));
  
  // Ekstrak chat ID (bisa UUID atau integer)
  const chatData = chatRes.data;
  const chatId = chatData?.uid || chatData?.uuid || chatData?.id;
  console.log('\nChat ID/UUID:', chatId);

  // 2. Kirim pesan dengan berbagai format payload untuk lihat mana yang berhasil
  const payloads = [
    // Format dari Playwright (yang benar dari capture)
    {
      message_object: {
        object_type: 'text',
        object_url: null,
        object_text: 'Hello! Please respond with just: OK',
        model_type: 'claude-sonnet-4-6'
      }
    },
    // Format alternative 1: content langsung
    {
      message_object: {
        type: 'text',
        content: 'Hello! Please respond with just: OK',
        model: 'claude-sonnet-4-6'
      }
    },
    // Format alternative 2: text langsung
    {
      message: 'Hello! Please respond with just: OK',
      model_type: 'claude-sonnet-4-6',
      ai_name: 'claude'
    },
    // Format alternative 3: similar to OpenAI
    {
      content: 'Hello! Please respond with just: OK',
      model_type: 'claude-sonnet-4-6'
    },
  ];

  for (let i = 0; i < payloads.length; i++) {
    const url = `${SYNTX_API_V1}/chats/${chatId}/messages?ai_name=claude`;
    console.log(`\n=== PAYLOAD ${i+1} ===`);
    console.log('URL:', url);
    console.log('Body:', JSON.stringify(payloads[i]));
    
    try {
      const msgRes = await axios.post(url, payloads[i], { headers, timeout: 60000, validateStatus: () => true });
      const icon = msgRes.status < 300 ? '✅✅✅' : '⚠️';
      console.log(`${icon} Status: ${msgRes.status}`);
      console.log('Response:', JSON.stringify(msgRes.data, null, 2).substring(0, 800));
      
      if (msgRes.status < 300) {
        console.log('\n🎉🎉🎉 SUCCESS!');
        break;
      }
    } catch(e) {
      console.log('Error:', e.message);
    }
  }
  
  // 3. Also GET chat details to see structure
  console.log('\n=== GET /chats (list) ===');
  const listRes = await axios.get(`${SYNTX_API_V1}/chats?scope=text&page_size=5`, { headers, validateStatus: () => true });
  console.log('Status:', listRes.status);
  console.log('Chats:', JSON.stringify(listRes.data, null, 2).substring(0, 1000));
  
  // 4. GET the specific chat
  if (chatId) {
    console.log(`\n=== GET /chats/${chatId} ===`);
    const getRes = await axios.get(`${SYNTX_API_V1}/chats/${chatId}`, { headers, validateStatus: () => true });
    console.log('Status:', getRes.status);
    console.log('Data:', JSON.stringify(getRes.data, null, 2).substring(0, 800));
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  if (e.response) console.error('Resp:', e.response.status, JSON.stringify(e.response.data));
});
