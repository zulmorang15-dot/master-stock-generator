/**
 * find-ypt-calls.js
 * Cari semua endpoint yang dipanggil via Ypt (v2 axios instance)
 * dan cari endpoint chat di syntx.ai app.js
 */

const axios = require('axios');

async function main() {
  console.log('Fetching syntx.ai app.js...');
  const res = await axios.get('https://syntx.ai/assets/1781010264/app.js', { timeout: 30000 });
  const txt = res.data;
  console.log(`Downloaded ${txt.length} chars\n`);

  // 1. Cari semua calls ke Ypt (v2 axios instance)
  console.log('=== Ypt (v2) CALLS ===');
  const yptRegex = /Ypt[.(]["'`]([^"'`]{1,80})["'`]/g;
  const yptCalls = new Set();
  let m;
  while ((m = yptRegex.exec(txt)) !== null) {
    yptCalls.add(m[1]);
  }
  Array.from(yptCalls).sort().forEach(c => console.log(' ', c));

  // 2. Cari semua hr.post dan Ypt.post calls
  console.log('\n=== POST CALLS (hr.post / Ypt.post) ===');
  const postRegex = /(hr|Ypt|uV)\.(post|put|delete|patch)\s*\(["'`]([^"'`]{1,80})["'`]/g;
  const postCalls = new Set();
  while ((m = postRegex.exec(txt)) !== null) {
    postCalls.add(`${m[1]}.${m[2]}("${m[3]}")`);
  }
  Array.from(postCalls).sort().forEach(c => console.log(' ', c));

  // 3. Cari kata "text" dalam konteks API calls
  console.log('\n=== CONTEXT OF hr/Ypt WITH "text" ===');
  ['Ypt("text', 'hr("text', "Ypt('text", "hr('text", 'hr.post("text', 'Ypt.post("text'].forEach(kw => {
    let idx = txt.indexOf(kw);
    if (idx !== -1) {
      console.log(`\n--- "${kw}" found at ${idx} ---`);
      console.log(txt.substring(Math.max(0, idx - 200), Math.min(txt.length, idx + 400)));
    }
  });

  // 4. Cari token usage patterns
  console.log('\n=== TOKEN USAGE IN REQUESTS ===');
  const tokenPatterns = [
    'Authorization', 'Bearer', 'x-auth-token', 'X-Auth-Token', 'access_token', 'auth_token'
  ];
  tokenPatterns.forEach(kw => {
    let idx = txt.indexOf(kw);
    while (idx !== -1) {
      const ctx = txt.substring(Math.max(0, idx - 100), Math.min(txt.length, idx + 200));
      if (ctx.includes('interceptor') || ctx.includes('header') || ctx.includes('token')) {
        console.log(`\n--- "${kw}" at ${idx} ---`);
        console.log(ctx);
        break;
      }
      idx = txt.indexOf(kw, idx + 1);
    }
  });

  // 5. Cari kode yang menangani chat/text generation
  console.log('\n=== GENERATION / CHAT LOGIC ===');
  const genKeywords = [
    'generation', 'streaming', 'EventSource', 'SSE', 'ReadableStream', 
    'completions', 'inference', 'anthropic', 'claude-'
  ];
  genKeywords.forEach(kw => {
    const idx = txt.indexOf(kw);
    if (idx !== -1) {
      console.log(`\n--- "${kw}" at ${idx} ---`);
      console.log(txt.substring(Math.max(0, idx - 150), Math.min(txt.length, idx + 300)));
    }
  });
}

main().catch(e => console.error('Error:', e.message));
