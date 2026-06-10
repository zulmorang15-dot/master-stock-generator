/**
 * deep-search-syntx.js
 * Cari semua endpoint yang tersembunyi di syntx.ai app.js
 */

const axios = require('axios');

async function main() {
  const res = await axios.get('https://syntx.ai/assets/1781010264/app.js', { timeout: 30000 });
  const txt = res.data;
  
  // 1. Cari SEMUA string yang mungkin berupa URL path
  console.log('=== ALL POSSIBLE API PATHS ===');
  const pathRegex = /"(\/(?:api|text|chat|ai|model|generate|stream|completions)[^"]*?)"/g;
  const paths = new Set();
  let m;
  while ((m = pathRegex.exec(txt)) !== null) {
    paths.add(m[1]);
  }
  paths.forEach(p => console.log(' ', p));

  // 2. Cari fetch dengan URL patterns
  console.log('\n=== FETCH WITH URL PATTERNS ===');
  const fetchReg = /fetch\(([^)]{0,300})\)/g;
  while ((m = fetchReg.exec(txt)) !== null) {
    if (m[1].includes('syntx') || m[1].includes('api')) {
      console.log(' fetch(', m[1].substring(0, 200), ')');
    }
  }

  // 3. Cari semua template literals yang mungkin merupakan URL  
  console.log('\n=== TEMPLATE LITERAL URLS ===');
  const tmplReg = /`(https?:\/\/[^`]{1,200})`/g;
  while ((m = tmplReg.exec(txt)) !== null) {
    if (m[1].includes('api') || m[1].includes('text') || m[1].includes('chat')) {
      console.log(' `', m[1].substring(0, 200), '`');
    }
  }

  // 4. Cari Ypt dengan lebih luas
  console.log('\n=== WIDE Ypt SEARCH ===');
  let idx = 0;
  while ((idx = txt.indexOf('Ypt', idx)) !== -1) {
    const ctx = txt.substring(Math.max(0, idx - 50), Math.min(txt.length, idx + 200));
    if (ctx.match(/["'`](\/|https?)/)) {
      console.log(`Ypt at ${idx}: ${ctx}`);
    }
    idx += 3;
  }

  // 5. Cari bagaimana user.subscription diambil - mungkin ada endpoint yg sama buat text
  console.log('\n=== SUBSCRIPTION/BALANCE CONTEXT ===');
  idx = txt.indexOf('user/subscription');
  if (idx !== -1) {
    console.log(txt.substring(Math.max(0, idx - 300), Math.min(txt.length, idx + 500)));
  }

  // 6. Cari pola "aiName" dalam konteks request building
  console.log('\n=== aiName IN REQUEST CONTEXT ===');
  idx = txt.indexOf('aiName');
  let count = 0;
  while (idx !== -1 && count < 15) {
    const ctx = txt.substring(Math.max(0, idx - 100), Math.min(txt.length, idx + 300));
    if (ctx.match(/(url|post|get|fetch|request|api)/i)) {
      console.log(`\n--- aiName at ${idx} ---\n${ctx}`);
      count++;
    }
    idx = txt.indexOf('aiName', idx + 6);
  }
}

main().catch(e => console.error('Error:', e.message));
