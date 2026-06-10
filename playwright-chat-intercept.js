/**
 * playwright-chat-intercept.js
 * Intercept network request SETELAH login melalui API (bypass halaman login)
 * Langsung inject token ke localStorage dan navigate ke /text/claude
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
  const email = `playwright_${rnd(6)}@${domain}`;
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
    if (!otp) console.log(`⏳ ${i+1}/12 - Waiting for OTP...`);
  }
  const verRes = await axios.post(`${SYNTX_API_V1}/auth/email/verify-otp`, { email, otp_code: otp }, {
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://syntx.ai' }
  });
  const token = verRes.data?.token || verRes.data?.data?.token;
  console.log(`✅ Logged in as ${email}`);
  console.log(`✅ Token: ${token.substring(0, 50)}...`);
  return { email, token };
}

async function main() {
  console.log('=== PLAYWRIGHT CHAT INTERCEPTOR ===\n');
  
  // Get token via API
  const { email, token } = await loginSyntx();
  
  const capturedRequests = [];
  
  // Launch browser
  const browser = await chromium.launch({
    headless: true, // set to false to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  // INTERCEPT EVERYTHING
  context.on('request', request => {
    const url = request.url();
    if (url.match(/\.(js|css|png|jpg|ico|woff|svg|gif|webp)(\?|$)/)) return;
    
    const method = request.method();
    let postData = null;
    try { postData = request.postData(); } catch(e) {}
    
    const info = { url, method, headers: request.headers(), postData };
    capturedRequests.push(info);
    
    if (!url.match(/google|chatwoot|analytics|gtm|facebook|twitch|instagram/)) {
      console.log(`\n📥 ${method} ${url}`);
      if (postData) console.log(`   Body: ${postData.substring(0, 300)}`);
    }
  });
  
  context.on('response', async response => {
    const url = response.url();
    if (url.match(/\.(js|css|png|jpg|ico|woff|svg|gif|webp)(\?|$)/)) return;
    if (url.match(/google|chatwoot|analytics|gtm|facebook/)) return;
    
    const status = response.status();
    let body = '';
    try { body = await response.text(); } catch(e) {}
    console.log(`📤 ${status} ${url}`);
    if (body && body.length > 0 && body.length < 2000) {
      console.log(`   → ${body.substring(0, 500)}`);
    }
  });

  const page = await context.newPage();
  
  // STEP 1: Navigate to syntx.ai first to set cookies/origin
  console.log('\n[1] Navigating to syntx.ai...');
  await page.goto('https://syntx.ai', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await sleep(2000);
  
  // STEP 2: Inject auth token into localStorage (bypass login page entirely)
  console.log('\n[2] Injecting auth token into localStorage...');
  await page.evaluate((authToken) => {
    // Try multiple storage key patterns
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('access_token', authToken);
    localStorage.setItem('syntx_token', authToken);
    
    // Also try cookie-based auth
    document.cookie = `auth_token=${authToken}; domain=.syntx.ai; path=/`;
    
    console.log('Token injected into localStorage');
    console.log('Auth token keys:', Object.keys(localStorage).filter(k => k.includes('token') || k.includes('auth')));
  }, token);
  
  console.log('✅ Token injected');
  
  // STEP 3: Navigate to text/claude page
  console.log('\n[3] Navigating to /text/claude...');
  await page.goto('https://syntx.ai/text/claude', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await sleep(5000);
  
  console.log('Current URL:', page.url());
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);
  
  // Check localStorage after navigation
  const storageState = await page.evaluate(() => {
    return {
      keys: Object.keys(localStorage),
      auth: localStorage.getItem('auth_token') || localStorage.getItem('token') || 'NOT FOUND'
    };
  });
  console.log('Storage state:', JSON.stringify(storageState));
  
  // STEP 4: Find and interact with chat input
  console.log('\n[4] Looking for chat input...');
  await sleep(3000);
  
  // Screenshot to see what the page looks like
  const screenshotPath = 'syntx-screenshot.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved: ${screenshotPath}`);
  
  // Try to find textarea or input
  const selectors = [
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]',
    '[class*="input"]',
    '[class*="chat"]',
    '[placeholder*="Type"]',
    '[placeholder*="message"]',
    '[data-testid*="input"]',
  ];
  
  let chatInput = null;
  for (const sel of selectors) {
    try {
      chatInput = await page.$(sel);
      if (chatInput) {
        const isVisible = await chatInput.isVisible();
        if (isVisible) {
          console.log(`✅ Found chat input: ${sel}`);
          break;
        }
      }
    } catch(e) {}
  }
  
  if (chatInput) {
    console.log('\n[5] Sending test message...');
    await chatInput.click();
    await chatInput.fill('Hello! Please respond with just the text "API_WORKING"');
    await sleep(1000);
    
    // Try to find send button or press Enter
    const sendButton = await page.$('button[type="submit"], button:has-text("Send"), [aria-label*="Send"], [class*="send-button"], [class*="submit"]');
    if (sendButton) {
      console.log('Clicking send button...');
      await sendButton.click();
    } else {
      console.log('Pressing Enter...');
      await chatInput.press('Enter');
    }
    
    console.log('✅ Message sent! Waiting for response...');
    await sleep(15000); // Wait 15s for AI response
  } else {
    console.log('⚠️ No chat input found!');
    
    // Print all visible elements
    const elements = await page.$$('*');
    console.log(`Total elements: ${elements.length}`);
    
    // Check if we're still on login page
    const loginForm = await page.$('form[action*="login"], input[type="email"]');
    if (loginForm) {
      console.log('⚠️ Still on login page! Token injection may have failed.');
      
      // Try to fill login form with email
      const emailInput = await page.$('input[type="email"], input[placeholder*="mail"]');
      if (emailInput) {
        console.log('Filling email form as fallback...');
        await emailInput.fill(email);
        await sleep(500);
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) await submitBtn.click();
      }
    }
  }
  
  // Print all captured API requests
  console.log('\n\n=== ALL CAPTURED API/NETWORK REQUESTS ===');
  const apiRequests = capturedRequests.filter(r => 
    r.url.includes('api.syntx') || 
    (r.url.includes('syntx.ai') && !r.url.match(/\.(js|css|png|jpg|ico|woff|svg|gif|webp)/))
  );
  
  apiRequests.forEach(r => {
    console.log(`\n${r.method} ${r.url}`);
    const auth = r.headers?.authorization;
    if (auth) console.log(`  Auth: ${auth.substring(0, 60)}`);
    if (r.postData) console.log(`  Body: ${r.postData.substring(0, 300)}`);
  });
  
  await browser.close();
}

main().catch(e => {
  console.error('\nFatal Error:', e.message);
  process.exit(1);
});
