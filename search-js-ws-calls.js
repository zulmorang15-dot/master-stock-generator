const axios = require('axios');

async function main() {
  const url = "https://syntx.ai/assets/1781010264/app.js";
  console.log(`Fetching bundle: ${url}...`);
  try {
    const jsRes = await axios.get(url);
    const jsText = jsRes.data;
    
    // Let's search for "WebSocket" or the variable of WebSocket hook
    // Let's find "useWebSocket" or similar. Or search for websocket URL like "wss://" dynamically built
    const terms = ["useWebSocket", "WebSocket(", "WebSocket", "wss:", "ws:"];
    for (const term of terms) {
      let idx = 0;
      let count = 0;
      while ((idx = jsText.indexOf(term, idx)) !== -1) {
        count++;
        if (count <= 10) {
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
