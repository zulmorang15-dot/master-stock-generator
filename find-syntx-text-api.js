/**
 * find-syntx-text-api.js
 * Cari endpoint text/chat secara lebih mendalam
 * Termasuk streaming dan semua keyword terkait AI generation
 */

const axios = require('axios');

async function main() {
  const res = await axios.get('https://syntx.ai/assets/1781010264/app.js', { timeout: 30000 });
  const txt = res.data;
  console.log(`Downloaded ${txt.length} chars\n`);

  // 1. Cari semua URL yang mengandung 'text' atau 'chat' atau 'ai' dalam konteks request
  console.log('=== ALL URL STRINGS CONTAINING RELEVANT KEYWORDS ===');
  // Cari semua string dalam quotes yang berisi path seperti /text/, /chat/, /ai/
  const urlRegex = /["'`]((?:https?:\/\/[^"'`\s]+|\/[a-zA-Z][a-zA-Z0-9\/_\-?=&.]*))["'`]/g;
  const foundUrls = new Set();
  let m;
  while ((m = urlRegex.exec(txt)) !== null) {
    const url = m[1];
    if (url.includes('text') || url.includes('chat') || url.includes('claude') || 
        url.includes('ai/') || url.includes('generate') || url.includes('complete') ||
        url.includes('api.syntx') || url.includes('inference')) {
      foundUrls.add(url);
    }
  }
  Array.from(foundUrls).sort().forEach(u => console.log(' ', u));

  // 2. Cari konteks 300 chars sebelum dan sesudah setiap kemunculan kata "scope"
  console.log('\n=== SCOPE USAGE CONTEXT ===');
  let idx = 0;
  let count = 0;
  while ((idx = txt.indexOf('"scope"', idx)) !== -1 && count < 5) {
    console.log(`\n--- scope at ${idx} ---`);
    console.log(txt.substring(Math.max(0, idx - 100), Math.min(txt.length, idx + 300)));
    idx += 7;
    count++;
  }

  // 3. Cari semua endpoint fetch/XMLHttpRequest yang mencakup "text" atau "claude"
  console.log('\n=== FETCH CALLS WITH API CONTEXT ===');
  const fetchRegex = /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g;
  while ((m = fetchRegex.exec(txt)) !== null) {
    if (m[1].includes('api') || m[1].includes('syntx') || m[1].includes('text')) {
      console.log(`fetch("${m[1]}")`);
    }
  }

  // 4. Cari "aiName" usage - dari path :aiName yang ditemukan sebelumnya
  console.log('\n=== aiName CONTEXT ===');
  const aiNameIdx = txt.indexOf('aiName');
  if (aiNameIdx !== -1) {
    // Cari 2000 chars sekitar first occurrence
    const ctx = txt.substring(Math.max(0, aiNameIdx - 500), Math.min(txt.length, aiNameIdx + 1000));
    console.log(ctx);
  }

  // 5. Cari "claude" dalam konteks yang ada URL atau request
  console.log('\n=== CLAUDE IN REQUEST CONTEXT ===');
  let claudeIdx = 0;
  count = 0;
  while ((claudeIdx = txt.indexOf('claude', claudeIdx)) !== -1 && count < 10) {
    const ctx = txt.substring(Math.max(0, claudeIdx - 100), Math.min(txt.length, claudeIdx + 300));
    if (ctx.includes('url') || ctx.includes('post') || ctx.includes('get') || 
        ctx.includes('fetch') || ctx.includes('request') || ctx.includes('http')) {
      console.log(`\n--- claude at ${claudeIdx} ---`);
      console.log(ctx);
      count++;
    }
    claudeIdx += 6;
  }

  // 6. Cari pola Fne() - constructor yang digunakan untuk membuat axios instances
  console.log('\n=== ALL Fne() CALLS ===');
  const fneRegex = /Fne\s*\(\s*["'`]([^"'`]+)["'`]/g;
  while ((m = fneRegex.exec(txt)) !== null) {
    console.log(`Fne("${m[1]}")`);
  }
}

main().catch(e => console.error('Error:', e.message));
