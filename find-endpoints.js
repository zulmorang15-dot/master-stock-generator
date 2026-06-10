const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
  console.log("Fetching syntx.ai landing page...");
  try {
    const res = await axios.get("https://syntx.ai/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    const $ = cheerio.load(res.data);
    const scripts = [];
    $('script[src]').each((i, el) => {
      scripts.push($(el).attr('src'));
    });
    
    console.log("Found JS scripts:", scripts);
    
    for (const src of scripts) {
      const url = src.startsWith('http') ? src : `https://syntx.ai${src}`;
      console.log(`Fetching bundle: ${url}...`);
      try {
        const jsRes = await axios.get(url, { timeout: 10000 });
        const jsText = jsRes.data;
        
        // Let's search for endpoints matching api/v1
        const regex = /\/api\/v1\/[a-zA-Z0-9\/\-_]+/g;
        let match;
        const matches = new Set();
        while ((match = regex.exec(jsText)) !== null) {
          matches.add(match[0]);
        }
        
        if (matches.size > 0) {
          console.log(`Matches in ${src}:`, Array.from(matches));
        }

        // Also search for "claude" or "chat" or similar
        const keywords = ['claude', 'chat', 'completions', 'ask', 'message', 'send'];
        keywords.forEach(kw => {
          let idx = 0;
          while (true) {
            idx = jsText.indexOf(kw, idx);
            if (idx === -1) break;
            console.log(`Context for '${kw}' in ${src}:`, jsText.substring(Math.max(0, idx - 100), Math.min(jsText.length, idx + 100)));
            idx += kw.length;
            break; // just show first context to avoid flooding
          }
        });
        
      } catch (e) {
        console.log(`Failed to fetch ${src}:`, e.message);
      }
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

main();
