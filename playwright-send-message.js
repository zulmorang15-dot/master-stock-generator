/**
 * playwright-send-message.js
 * Script final: Login, inject token, tutup modal, kirim pesan, tangkap API endpoint
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
  const email = `final_${rnd(6)}@${domain}`;
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

async function main() {
  console.log('=== FINAL CHAT INTERCEPTOR ===\n');
  
  const token = await loginSyntx();
  
  const chatApiRequests = [];
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  });

  // WebSocket interceptor
  context.on('websocket', ws => {
    console.log(`\n🔌 WebSocket: ${ws.url()}`);
    ws.on('framesent', f => console.log(`  ↗️ SENT: ${String(f.payload).substring(0, 200)}`));
    ws.on('framereceived', f => console.log(`  ↙️ RECV: ${String(f.payload).substring(0, 200)}`));
  });

  // HTTP interceptor - focus on API calls
  context.on('request', request => {
    const url = request.url();
    if (url.match(/\.(js|css|png|jpg|ico|woff|svg|gif|webp)(\?|$)/)) return;
    if (!url.includes('syntx') && !url.includes('api')) return;
    
    let postData = null;
    try { postData = request.postData(); } catch(e) {}
    chatApiRequests.push({ url, method: request.method(), postData });
    
    console.log(`📥 ${request.method()} ${url}`);
    if (postData && postData.length < 500) console.log(`   ↳ ${postData}`);
  });
  
  context.on('response', async response => {
    const url = response.url();
    if (url.match(/\.(js|css|png|jpg|ico|woff|svg|gif|webp)(\?|$)/)) return;
    if (!url.includes('syntx') && !url.includes('api')) return;
    if (url.includes('sentry')) return;
    
    const status = response.status();
    let body = '';
    try { body = await response.text(); } catch(e) {}
    console.log(`📤 ${status} ${url.substring(0, 120)}`);
    if (body && body.length > 0 && body.length < 1500 && !body.startsWith('<')) {
      console.log(`   ↳ ${body.substring(0, 600)}`);
    }
  });
  
  const page = await context.newPage();
  
  // Navigate and inject token
  await page.goto('https://syntx.ai', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await sleep(1000);
  
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t);
    localStorage.setItem('token', t);
  }, token);
  
  // Navigate to claude chat
  console.log('\n→ Navigating to /text/claude');
  try {
    await page.goto('https://syntx.ai/text/claude', { timeout: 25000, waitUntil: 'domcontentloaded' });
  } catch(e) { console.log('Navigate timeout, continuing...'); }
  
  await sleep(4000);
  console.log('Current URL:', page.url());
  
  // DISMISS ALL MODALS / DIALOGS
  console.log('\n→ Dismissing any modals...');
  
  // Method 1: Click any accept/agree/confirm buttons
  const dismissSelectors = [
    'button:has-text("Accept")',
    'button:has-text("Agree")',
    'button:has-text("Continue")',
    'button:has-text("OK")',
    'button:has-text("Got it")',
    'button:has-text("Confirm")',
    'button:has-text("Close")',
    'button:has-text("I agree")',
    '[class*="accept"]',
    '[class*="close"]',
    '[class*="dismiss"]',
  ];
  
  for (const sel of dismissSelectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        const visible = await el.isVisible();
        if (visible) {
          await el.click({ force: true });
          console.log(`  ✅ Dismissed: ${sel}`);
          await sleep(500);
        }
      }
    } catch(e) {}
  }
  
  // Method 2: Escape key
  await page.keyboard.press('Escape');
  await sleep(500);
  
  // Method 3: Click outside modal
  try {
    await page.mouse.click(10, 10, { force: true });
    await sleep(500);
  } catch(e) {}
  
  // Method 4: Force-remove modal via JS
  await page.evaluate(() => {
    // Remove all modal overlays
    document.querySelectorAll('.el-overlay, [class*="modal"], [class*="dialog"], [role="dialog"]').forEach(el => {
      el.remove();
    });
    // Also remove any backdrop
    document.querySelectorAll('.el-overlay-dialog, .v-overlay, [class*="backdrop"]').forEach(el => {
      el.remove();
    });
    console.log('Modals removed via JS');
  });
  
  await sleep(1000);
  
  // Find chat textarea
  console.log('\n→ Finding chat input...');
  
  // List all textareas and inputs
  const textareas = await page.$$('textarea');
  console.log(`Found ${textareas.length} textareas`);
  
  const inputs = await page.$$('input:not([type="hidden"])');
  console.log(`Found ${inputs.length} inputs`);
  
  let chatInput = null;
  
  // Try textarea first (most common for chat)
  for (const ta of textareas) {
    try {
      const isVisible = await ta.isVisible();
      const placeholder = await ta.getAttribute('placeholder');
      const className = await ta.getAttribute('class');
      console.log(`  Textarea: visible=${isVisible}, placeholder=${placeholder}, class=${className}`);
      if (isVisible) {
        chatInput = ta;
        break;
      }
    } catch(e) {}
  }
  
  if (!chatInput) {
    // Try contenteditable
    const contentEditable = await page.$('[contenteditable="true"]');
    if (contentEditable) {
      const isVisible = await contentEditable.isVisible();
      if (isVisible) chatInput = contentEditable;
    }
  }
  
  if (chatInput) {
    console.log('✅ Found chat input!');
    
    // Type message
    try {
      await chatInput.focus();
      await sleep(500);
      await chatInput.fill('Hello! Please respond with exactly: {"status":"working","message":"Syntx API is connected"}');
      await sleep(500);
      
      // Find send button or use Ctrl+Enter
      const sendBtn = await page.$('button[type="submit"]:visible, button:has-text("Send"):visible');
      if (sendBtn) {
        console.log('→ Clicking send button');
        await sendBtn.click({ force: true });
      } else {
        console.log('→ Pressing Enter');
        await chatInput.press('Enter');
      }
      
      console.log('✅ Message sent! Capturing response...');
      await sleep(20000); // Wait 20s for AI response
      
    } catch(e) {
      console.log('Error sending message:', e.message.substring(0, 200));
    }
  } else {
    console.log('⚠️ No chat input found, capturing page state...');
    
    // Get page HTML snippet
    const bodyHtml = await page.evaluate(() => document.body.innerHTML.substring(0, 3000));
    console.log('Page HTML snippet:', bodyHtml);
  }
  
  console.log('\n\n=== CAPTURED SYNTX API REQUESTS ===');
  chatApiRequests
    .filter(r => !r.url.includes('sentry') && !r.url.includes('clarity'))
    .forEach(r => {
      console.log(`\n${r.method} ${r.url}`);
      if (r.postData) console.log(`  Body: ${r.postData.substring(0, 500)}`);
    });
  
  await browser.close();
}

main().catch(e => {
  console.error('Error:', e.message.substring(0, 300));
  process.exit(1);
});
