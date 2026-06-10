/**
 * playwright-ws-intercept.js
 * Intercept WebSocket connections di syntx.ai setelah login
 * Juga capture semua request dengan token yang di-inject
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

async function loginSyntx() {
  const domainRes = await axios.get(`${MAIL_TM_API}/domains`);
  const domain = domainRes.data['hydra:member'][0].domain;
  const email = `wsint_${rnd(6)}@${domain}`;
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
    if (!otp) process.stdout.write(`⏳${i+1} `);
  }
  console.log();
  const verRes = await axios.post(`${SYNTX_API_V1}/auth/email/verify-otp`, { email, otp_code: otp }, {
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://syntx.ai' }
  });
  const token = verRes.data?.token || verRes.data?.data?.token;
  console.log(`✅ Token: ${token.substring(0, 50)}...`);
  return token;
}

async function main() {
  console.log('=== WS + API INTERCEPTOR ===\n');
  
  const token = await loginSyntx();
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  });

  // Intercept WebSocket connections
  context.on('websocket', ws => {
    console.log(`\n🔌 WebSocket OPENED: ${ws.url()}`);
    
    ws.on('framesent', frame => {
      console.log(`  ↗️ WS SENT: ${JSON.stringify(frame.payload).substring(0, 300)}`);
    });
    
    ws.on('framereceived', frame => {
      console.log(`  ↙️ WS RECV: ${JSON.stringify(frame.payload).substring(0, 300)}`);
    });
    
    ws.on('close', () => {
      console.log(`🔌 WebSocket CLOSED: ${ws.url()}`);
    });
  });

  // Intercept HTTP requests
  const capturedApiRequests = [];
  context.on('request', request => {
    const url = request.url();
    if (url.match(/\.(js|css|png|jpg|ico|woff|svg|gif|webp)(\?|$)/)) return;
    if (url.match(/google-analytics|gtm|facebook|doubleclick/)) return;
    
    let postData = null;
    try { postData = request.postData(); } catch(e) {}
    
    capturedApiRequests.push({ url, method: request.method(), headers: request.headers(), postData });
    
    if (url.includes('syntx') || url.includes('api')) {
      console.log(`\n📥 ${request.method()} ${url}`);
      if (postData) console.log(`   Body: ${postData.substring(0, 500)}`);
    }
  });
  
  context.on('response', async response => {
    const url = response.url();
    if (url.match(/\.(js|css|png|jpg|ico|woff|svg|gif|webp)(\?|$)/)) return;
    if (url.match(/google-analytics|gtm|facebook|doubleclick/)) return;
    
    if (url.includes('syntx') || url.includes('api')) {
      const status = response.status();
      let body = '';
      try { body = await response.text(); } catch(e) {}
      console.log(`📤 ${status} ${url.substring(0, 100)}`);
      if (body && body.length < 1000 && body.length > 2) {
        console.log(`   → ${body.substring(0, 400)}`);
      }
    }
  });
  
  const page = await context.newPage();
  
  // Navigate to syntx.ai first
  await page.goto('https://syntx.ai', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await sleep(1000);
  
  // Inject token - try multiple storage keys
  await page.evaluate((t) => {
    // Pinia/Vue stores often use specific key formats
    const storageKeys = [
      'auth_token',
      'token',
      'access_token',
      'bearerToken',
      'jwt',
      'user_token',
      'syntx-auth',
    ];
    storageKeys.forEach(k => localStorage.setItem(k, t));
    console.log('Injected token to all storage keys');
  }, token);
  
  console.log('\n[Navigate to /text/claude]');
  
  try {
    await page.goto('https://syntx.ai/text/claude', { timeout: 25000, waitUntil: 'domcontentloaded' });
  } catch(e) {
    console.log('Navigate timeout, continuing...');
  }
  
  await sleep(5000);
  console.log('Current URL:', page.url());
  
  // Check if we need to handle login redirect
  const currentUrl = page.url();
  if (currentUrl.includes('login') || currentUrl.includes('auth')) {
    console.log('⚠️ Redirected to login! Trying actual browser login...');
    
    // Wait for login form
    await sleep(2000);
    
    // Try to fill email
    const emailSelector = 'input[type="email"], input[placeholder*="mail"], input[placeholder*="email"]';
    try {
      await page.fill(emailSelector, 'test@example.com', { timeout: 5000 });
    } catch(e) {
      console.log('Cannot find email input');
    }
  }
  
  // Wait and capture
  console.log('\nWaiting 20s to capture all requests...');
  await sleep(20000);
  
  // Try to find and interact with chat
  console.log('\n[Looking for chat input]');
  const textareaEl = await page.$('textarea');
  if (textareaEl) {
    console.log('Found textarea!');
    await textareaEl.click();
    await textareaEl.fill('Test message - respond with just "OK"');
    await textareaEl.press('Enter');
    await sleep(15000);
  }
  
  // Get page content for analysis
  const pageContent = await page.content();
  console.log('\n[Page meta info]');
  console.log('Title:', await page.title());
  console.log('URL:', page.url());
  console.log('Has textarea:', pageContent.includes('<textarea'));
  console.log('Has auth_token in page:', pageContent.includes('auth_token'));
  
  console.log('\n\n=== SUMMARY OF CAPTURED REQUESTS ===');
  capturedApiRequests
    .filter(r => r.url.includes('syntx'))
    .forEach(r => {
      console.log(`${r.method} ${r.url}`);
      if (r.postData) console.log(`  Body: ${r.postData.substring(0, 200)}`);
    });
  
  await browser.close();
  console.log('\nDone!');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
