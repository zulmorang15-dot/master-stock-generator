/**
 * intercept-syntx-network.js
 * Gunakan Playwright untuk intercept real network requests dari syntx.ai
 * saat kita login dan kirim pesan chat
 */

require('dotenv').config();
const { chromium } = require('playwright');
const axios = require('axios');

const MAIL_TM_API  = 'https://api.mail.tm';
const SYNTX_API_V1 = 'https://api.syntx.ai/api/v1';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rnd(n = 8) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: n}, () => c[Math.floor(Math.random()*c.length)]).join('');
}

async function createEmailAndGetOTP() {
  // Buat email temporer
  const domainRes = await axios.get(`${MAIL_TM_API}/domains`);
  const domain = domainRes.data['hydra:member'][0].domain;
  const email = `intercept_${rnd(6)}@${domain}`;
  const pw = `P@ss${rnd(8)}!`;

  await axios.post(`${MAIL_TM_API}/accounts`, { address: email, password: pw });
  const loginRes = await axios.post(`${MAIL_TM_API}/token`, { address: email, password: pw });
  const mailToken = loginRes.data.token;
  console.log(`✅ Email: ${email}`);

  // Request OTP via Playwright API (tetap pakai axios karena kita sudah tahu endpointnya)
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

  return { email, otp, mailToken };
}

async function main() {
  console.log('=== PLAYWRIGHT NETWORK INTERCEPTOR ===\n');
  
  const { email, otp } = await createEmailAndGetOTP();
  
  const capturedRequests = [];
  
  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Intercept ALL network requests
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    
    // Skip static assets
    if (url.match(/\.(js|css|png|jpg|ico|woff|svg)(\?|$)/)) return;
    
    const headers = request.headers();
    let postData = null;
    try { postData = request.postData(); } catch(e) {}
    
    const info = {
      url,
      method,
      headers: Object.fromEntries(Object.entries(headers).filter(([k]) => 
        ['authorization', 'content-type', 'accept', 'x-auth-token'].includes(k.toLowerCase())
      )),
      postData
    };
    
    capturedRequests.push(info);
    
    if (url.includes('api.syntx') || url.includes('syntx.ai/api')) {
      console.log(`\n🔵 REQUEST: ${method} ${url}`);
      if (headers.authorization) console.log(`   Auth: ${headers.authorization.substring(0, 60)}...`);
      if (postData) console.log(`   Body: ${postData.substring(0, 300)}`);
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api.syntx') || url.includes('syntx.ai/api')) {
      const status = response.status();
      let body = '';
      try { body = await response.text(); } catch(e) {}
      console.log(`🟢 RESPONSE: ${status} ${url}`);
      console.log(`   Body: ${body.substring(0, 300)}`);
    }
  });

  // Navigate to syntx.ai
  console.log('\n📱 Navigating to syntx.ai...');
  await page.goto('https://syntx.ai/login', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);
  
  // Enter email
  console.log('📧 Entering email...');
  const emailInput = await page.$('input[type="email"], input[placeholder*="email"], input[name="email"]');
  if (emailInput) {
    await emailInput.fill(email);
    
    // Click submit/continue
    const submitBtn = await page.$('button[type="submit"], button:has-text("Sign"), button:has-text("Continue"), button:has-text("Login")');
    if (submitBtn) {
      await submitBtn.click();
      console.log('✅ Email submitted');
    }
  } else {
    console.log('⚠️ Email input not found, trying to find any input...');
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} inputs`);
    for (const inp of inputs) {
      const type = await inp.getAttribute('type');
      const placeholder = await inp.getAttribute('placeholder');
      const name = await inp.getAttribute('name');
      console.log(`  Input: type=${type}, placeholder=${placeholder}, name=${name}`);
    }
  }
  
  await sleep(5000);
  
  // Check if OTP page appeared
  console.log('\n🔐 Entering OTP...');
  const otpInput = await page.$('input[type="text"], input[type="number"], input[maxlength="6"], input[placeholder*="OTP"], input[placeholder*="code"]');
  if (otpInput) {
    await otpInput.fill(otp);
    const verifyBtn = await page.$('button[type="submit"], button:has-text("Verify"), button:has-text("Confirm")');
    if (verifyBtn) {
      await verifyBtn.click();
      console.log('✅ OTP submitted');
    }
  } else {
    // Coba masukkan OTP digit per digit
    const digitInputs = await page.$$('input[maxlength="1"]');
    if (digitInputs.length === 6) {
      for (let i = 0; i < 6; i++) {
        await digitInputs[i].fill(otp[i]);
      }
      console.log('✅ OTP entered digit by digit');
    } else {
      console.log('⚠️ OTP input not found!');
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      console.log('URL:', page.url());
    }
  }
  
  await sleep(8000);
  
  // Navigate to text/claude
  console.log('\n🚀 Navigating to /text/claude...');
  await page.goto('https://syntx.ai/text/claude', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  
  console.log('URL:', page.url());
  
  // Find and type a message
  console.log('💬 Finding chat input...');
  const chatInput = await page.$('textarea, input[type="text"]:not([type="email"]):not([type="password"])');
  if (chatInput) {
    await chatInput.fill('Hello, please respond with just the word "WORKING" if you can hear me.');
    
    // Submit
    const sendBtn = await page.$('button[type="submit"], button:has-text("Send"), button:has-text("Submit"), [class*="send"]');
    if (sendBtn) {
      await sendBtn.click();
      console.log('✅ Message sent! Waiting for response...');
      await sleep(10000); // wait for AI response
    } else {
      // Try Enter key
      await chatInput.press('Enter');
      console.log('✅ Message sent via Enter! Waiting...');
      await sleep(10000);
    }
  } else {
    console.log('⚠️ Chat input not found!');
    const url = page.url();
    console.log('Current URL:', url);
  }
  
  // Print all captured API requests
  console.log('\n\n=== ALL CAPTURED API REQUESTS ===');
  capturedRequests
    .filter(r => r.url.includes('api') || r.url.includes('syntx'))
    .forEach(r => {
      console.log(`\n${r.method} ${r.url}`);
      if (r.headers.authorization) console.log(`  Auth: ${r.headers.authorization.substring(0, 60)}`);
      if (r.postData) console.log(`  Body: ${r.postData.substring(0, 500)}`);
    });
  
  await browser.close();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
