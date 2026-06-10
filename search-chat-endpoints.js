const axios = require('axios');

async function main() {
  const url = "https://syntx.ai/assets/1781010264/app.js";
  console.log(`Fetching bundle: ${url}...`);
  try {
    const jsRes = await axios.get(url);
    const jsText = jsRes.data;
    
    // Let's search for "chat/completions" or similar, or find post(" or post(`
    // Usually, chat endpoints have "chat/" or "/chat" or "text/" or "/text"
    // Let's search for occurrences of hr.post(" or Ypt.post("
    const searchTerms = [
      'hr.post("', 'hr.post(`', 'Ypt.post("', 'Ypt.post(`',
      'chat/session', 'chat/messages', 'text/session',
      'text/messages', '/chat', 'send-message', 'message'
    ];
    for (const term of searchTerms) {
      let idx = 0;
      let count = 0;
      while ((idx = jsText.indexOf(term, idx)) !== -1) {
        count++;
        if (count <= 5) {
          console.log(`\nContext for '${term}' #${count}:`);
          console.log(jsText.substring(Math.max(0, idx - 150), Math.min(jsText.length, idx + 250)));
        }
        idx += term.length;
      }
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

main();
