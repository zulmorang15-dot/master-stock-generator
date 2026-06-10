/**
 * find-syntx-chat-endpoint.js
 * Download JS bundle syntx.ai dan cari semua URL API termasuk endpoint chat
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
  console.log('Fetching syntx.ai /text/claude page...\n');

  try {
    // Fetch halaman utama (auth-protected, tapi kita bisa lihat script tags)
    const res = await axios.get('https://syntx.ai/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 15000
    });

    const $ = cheerio.load(res.data);
    const scripts = [];
    $('script[src]').each((i, el) => {
      scripts.push($(el).attr('src'));
    });
    console.log('Found scripts:', scripts);

    let allText = '';

    for (const src of scripts) {
      const url = src.startsWith('http') ? src : `https://syntx.ai${src}`;
      try {
        console.log(`\nFetching: ${url}`);
        const jsRes = await axios.get(url, { timeout: 20000 });
        allText += jsRes.data;
        console.log(`  Size: ${jsRes.data.length} chars`);
      } catch (e) {
        console.log(`  Failed: ${e.message}`);
      }
    }

    // Cari semua pola URL API
    console.log('\n=== ALL API PATHS FOUND ===');
    const apiPaths = new Set();
    const regexes = [
      /["'`]\/api\/v[12]\/[a-zA-Z0-9\/_\-?=&]+["'`]/g,
      /["'`](text|chat|claude|message|generate|completions|ask)[/"'`]/g,
      /path:\s*["'`][^"'`]+["'`]/g,
    ];
    
    for (const regex of regexes) {
      let match;
      while ((match = regex.exec(allText)) !== null) {
        apiPaths.add(match[0]);
      }
    }
    
    Array.from(apiPaths).sort().forEach(p => console.log(' ', p));

    // Cari konteks sekitar kata kunci penting
    console.log('\n=== CONTEXT SEARCH ===');
    const keywords = [
      'text/chat', 'text/claude', 'text/generate', 'text/message',
      'chat/completions', 'ai/text', 'ai/chat',
      'ask', 'prompt', 'inference', 'generation',
      'hr.post', 'hr.get', 'axios.post', 'fetch('
    ];
    
    keywords.forEach(kw => {
      let idx = allText.indexOf(kw);
      if (idx !== -1) {
        const start = Math.max(0, idx - 150);
        const end = Math.min(allText.length, idx + 250);
        console.log(`\n--- Context for "${kw}" ---`);
        console.log(allText.substring(start, end));
      }
    });

  } catch (e) {
    console.error('Fatal:', e.message);
  }
}

main();
