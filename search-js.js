const axios = require('axios');

async function main() {
  const url = "https://syntx.ai/assets/1781010264/app.js";
  console.log(`Fetching bundle: ${url}...`);
  try {
    const jsRes = await axios.get(url);
    const jsText = jsRes.data;
    
    const keywords = ["verify-otp", "send-otp", "/auth", "/chat", "model:", "model", "claude"];
    for (const kw of keywords) {
      const idx = jsText.indexOf(kw);
      if (idx !== -1) {
        console.log(`\nContext for '${kw}':`);
        console.log(jsText.substring(Math.max(0, idx - 150), Math.min(jsText.length, idx + 250)));
      } else {
        console.log(`\n'${kw}' not found`);
      }
    }
    
  } catch (e) {
    console.log("Error:", e.message);
  }
}

main();
