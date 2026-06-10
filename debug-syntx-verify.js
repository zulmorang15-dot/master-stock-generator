/**
 * debug-syntx-verify.js
 * Script untuk debug endpoint verify-otp syntx.ai
 * Kita akan buat email baru dan lihat respons detail saat verify
 */

require('dotenv').config();
const axios = require('axios');

const MAIL_TM_API  = 'https://api.mail.tm';
const SYNTX_API_V1 = 'https://api.syntx.ai/api/v1';
const SYNTX_API_V2 = 'https://api.syntx.ai/api/v2';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomString(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function main() {
  console.log('=== DEBUG: syntx.ai verify-otp ===\n');

  // 1. Buat email temporer
  console.log('1. Membuat email temporer...');
  const domainRes = await axios.get(`${MAIL_TM_API}/domains`);
  const domain = domainRes.data['hydra:member'][0].domain;
  const username = `debug_${randomString(6)}`;
  const password = `P@ss${randomString(8)}!`;
  const email = `${username}@${domain}`;

  await axios.post(`${MAIL_TM_API}/accounts`, { address: email, password });
  const loginRes = await axios.post(`${MAIL_TM_API}/token`, { address: email, password });
  const mailToken = loginRes.data.token;
  console.log(`✅ Email: ${email}\n`);

  // 2. Request OTP
  console.log('2. Request OTP ke syntx.ai...');
  try {
    const otpRes = await axios.post(`${SYNTX_API_V1}/auth/email/send-otp`, { email }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://syntx.ai',
        'Referer': 'https://syntx.ai/login'
      }
    });
    console.log('✅ OTP Response:', JSON.stringify(otpRes.data, null, 2));
  } catch (err) {
    console.log('❌ send-otp error:', err.response?.status, JSON.stringify(err.response?.data));
    // Try v2
    try {
      const otpRes2 = await axios.post(`${SYNTX_API_V2}/auth/email/send-otp`, { email }, {
        headers: { 'Content-Type': 'application/json', 'Origin': 'https://syntx.ai' }
      });
      console.log('✅ OTP v2 Response:', JSON.stringify(otpRes2.data, null, 2));
    } catch (err2) {
      console.log('❌ send-otp v2 error:', err2.response?.status, JSON.stringify(err2.response?.data));
    }
  }

  // 3. Tunggu OTP
  console.log('\n3. Menunggu OTP di inbox...');
  let otp = null;
  for (let i = 0; i < 12; i++) {
    await sleep(5000);
    const msgs = await axios.get(`${MAIL_TM_API}/messages`, {
      headers: { 'Authorization': `Bearer ${mailToken}` }
    });
    const messages = msgs.data['hydra:member'] || [];
    if (messages.length > 0) {
      const msgRes = await axios.get(`${MAIL_TM_API}/messages/${messages[0].id}`, {
        headers: { 'Authorization': `Bearer ${mailToken}` }
      });
      const body = msgRes.data.text || msgRes.data.html || '';
      const match = body.match(/\b(\d{6})\b/);
      if (match) {
        otp = match[1];
        console.log(`✅ OTP ditemukan: ${otp}`);
        console.log(`   Subject: ${messages[0].subject}`);
        console.log(`   Body preview: ${body.substring(0, 300)}\n`);
        break;
      }
    }
    console.log(`⏳ ${i+1}/12 - Belum ada pesan...`);
  }

  if (!otp) {
    console.log('❌ OTP tidak diterima!');
    return;
  }

  // 4. Coba berbagai format payload untuk verify-otp
  console.log('4. Mencoba berbagai format payload verify-otp...\n');
  
  const payloads = [
    { label: 'v1: { email, otp }', url: `${SYNTX_API_V1}/auth/email/verify-otp`, body: { email, otp } },
    { label: 'v1: { email, code }', url: `${SYNTX_API_V1}/auth/email/verify-otp`, body: { email, code: otp } },
    { label: 'v1: { email, token }', url: `${SYNTX_API_V1}/auth/email/verify-otp`, body: { email, token: otp } },
    { label: 'v1: { email, otp (number) }', url: `${SYNTX_API_V1}/auth/email/verify-otp`, body: { email, otp: parseInt(otp) } },
    { label: 'v2: { email, otp }', url: `${SYNTX_API_V2}/auth/email/verify-otp`, body: { email, otp } },
    { label: 'v2: { email, code }', url: `${SYNTX_API_V2}/auth/email/verify-otp`, body: { email, code: otp } },
    { label: 'v1: verify-email-otp { email, otp }', url: `${SYNTX_API_V1}/auth/verify-email-otp`, body: { email, otp } },
    { label: 'v1: email/confirm { email, otp }', url: `${SYNTX_API_V1}/auth/email/confirm`, body: { email, otp } },
    { label: 'v1: login { email, otp }', url: `${SYNTX_API_V1}/auth/login`, body: { email, otp } },
  ];

  for (const payload of payloads) {
    try {
      const res = await axios.post(payload.url, payload.body, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://syntx.ai',
          'Referer': 'https://syntx.ai/login'
        },
        timeout: 15000,
        validateStatus: () => true // jangan throw error, tangkap semua status
      });
      
      const status = res.status;
      const data = JSON.stringify(res.data, null, 2);
      
      if (status >= 200 && status < 300) {
        console.log(`✅ SUKSES! [${payload.label}] Status: ${status}`);
        console.log(`   Response: ${data}\n`);
        return; // Berhasil!
      } else {
        console.log(`❌ [${payload.label}] Status: ${status}`);
        console.log(`   Error: ${data.substring(0, 200)}\n`);
      }
    } catch (err) {
      console.log(`❌ [${payload.label}] Exception: ${err.message}\n`);
    }
  }
  
  console.log('\n=== Semua payload dicoba ===');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
