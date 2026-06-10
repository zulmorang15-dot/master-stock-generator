const axios = require('axios');

async function main() {
  const url = "https://syntx.ai/assets/1781010264/app.js";
  console.log(`Fetching bundle: ${url}...`);
  try {
    const jsRes = await axios.get(url);
    const jsText = jsRes.data;
    
    // Find the variable holding Ypt = Fne("https://api.syntx.ai/api/v2/")
    // In our previous search, we saw:
    // const hr=Fne("https://api.syntx.ai/api/v1/"),Ypt=Fne("https://api.syntx.ai/api/v2/")
    // So the variable name is exactly "Ypt"!
    // Let's search for "Ypt.post" or "Ypt.get" or "Ypt("
    const searchTerms = ["Ypt.post", "Ypt.get", "Ypt(", "Ypt.put", "Ypt.delete", "Ypt"];
    for (const term of searchTerms) {
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
