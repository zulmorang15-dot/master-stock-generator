const axios = require('axios');

async function main() {
  const url = "https://syntx.ai/assets/1781010264/app.js";
  console.log(`Fetching bundle: ${url}...`);
  try {
    const jsRes = await axios.get(url);
    const jsText = jsRes.data;
    
    const terms = ["Ypt", "Ypt.", "api/v2", "chat", "text", "completions", "auth/email"];
    for (const term of terms) {
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
