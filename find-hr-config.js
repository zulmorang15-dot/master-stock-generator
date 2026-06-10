/**
 * find-hr-config.js
 * Cari konfigurasi baseURL dari axios instance 'hr' di syntx.ai
 * dan temukan semua endpoint yang dipakai oleh hr.post/hr.get
 */

const axios = require('axios');

async function main() {
  console.log('Fetching syntx.ai app.js...');
  const res = await axios.get('https://syntx.ai/assets/1781010264/app.js', { timeout: 30000 });
  const txt = res.data;
  console.log(`Downloaded ${txt.length} chars\n`);

  // 1. Cari konfigurasi baseURL dari hr (axios instance)
  console.log('=== BASEURL CONFIG ===');
  const baseUrlPatterns = [
    /baseURL[\s:]*["'`]([^"'`]+)["'`]/g,
    /baseUrl[\s:]*["'`]([^"'`]+)["'`]/g,
    /base_url[\s:]*["'`]([^"'`]+)["'`]/g,
    /VITE_[A-Z_]*URL[^"'`]*["'`]([^"'`]+)["'`]/g,
    /api\.syntx/g,
    /syntx\.ai\/api/g,
  ];

  for (const re of baseUrlPatterns) {
    let m;
    while ((m = re.exec(txt)) !== null) {
      console.log(`Match (${re.source.substring(0,30)}...): ${m[0].substring(0, 150)}`);
    }
  }

  // 2. Cari semua endpoint yang dipanggil via hr
  console.log('\n=== hr() CALLS ===');
  const hrCalls = new Set();
  const hrRegex = /hr[.(]["'`]([^"'`]{2,80})["'`]/g;
  let m;
  while ((m = hrRegex.exec(txt)) !== null) {
    hrCalls.add(m[1]);
  }
  // Sort dan print
  Array.from(hrCalls).sort().forEach(call => console.log(' ', call));

  // 3. Cari bagian kode yang membangun hr axios instance
  console.log('\n=== hr AXIOS INSTANCE CREATION ===');
  // Cari pola: const hr = axios.create atau let hr = ...
  const createPatterns = [
    /const hr\s*=\s*.{0,200}/g,
    /let hr\s*=\s*.{0,200}/g,
    /var hr\s*=\s*.{0,200}/g,
    /hr\s*=\s*axios\.create\s*\(.{0,300}/g,
  ];
  
  for (const re of createPatterns) {
    let m;
    while ((m = re.exec(txt)) !== null) {
      console.log(`Found: ${m[0].substring(0, 300)}`);
    }
  }

  // 4. Cari semua string yang mengandung "text" dalam konteks API
  console.log('\n=== STRINGS WITH "text" in API context ===');
  const textApiRegex = /["'`][^"'`]{0,20}text[^"'`]{0,50}["'`]/g;
  const textMatches = new Set();
  while ((m = textApiRegex.exec(txt)) !== null) {
    const match = m[0];
    if (match.includes('/') || match.includes('api')) {
      textMatches.add(match);
    }
  }
  Array.from(textMatches).slice(0, 50).forEach(s => console.log(' ', s));
}

main().catch(e => console.error('Error:', e.message));
