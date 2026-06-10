const axios = require('axios');

async function main() {
  const url = "https://syntx.ai/assets/1781010264/app.js";
  console.log(`Fetching bundle: ${url}...`);
  try {
    const jsRes = await axios.get(url);
    const jsText = jsRes.data;
    
    // Find where hr is defined or created
    const searchTerms = ["hr=axios.create", "hr = axios.create", "const hr", "let hr", "baseURL:", "api.syntx.ai"];
    for (const term of searchTerms) {
      const idx = jsText.indexOf(term);
      if (idx !== -1) {
        console.log(`\nContext for '${term}':`);
        console.log(jsText.substring(Math.max(0, idx - 150), Math.min(jsText.length, idx + 250)));
      }
    }

    // Let's search for chat endpoints like "/chat/send" or similar
    const chatTerms = ["chat/send", "chat/message", "chat/completions", "chat/completion", "claude", "nemotron", "api/v1"];
    for (const term of chatTerms) {
      let idx = 0;
      let count = 0;
      while ((idx = jsText.indexOf(term, idx)) !== -1) {
        count++;
        if (count <= 3) {
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
