const axios = require('axios');
const fs = require('fs');

async function main() {
  const url = "https://syntx.ai/assets/1781010264/app.js";
  console.log(`Fetching bundle: ${url}...`);
  try {
    const jsRes = await axios.get(url);
    const jsText = jsRes.data;
    
    // Find all occurrences of API endpoints
    const apiRegex = /\/api\/v1\/[a-zA-Z0-9\/\-_]+/g;
    const matches = new Set();
    let match;
    while ((match = apiRegex.exec(jsText)) !== null) {
      matches.add(match[0]);
    }
    
    const sortedMatches = Array.from(matches).sort();
    fs.writeFileSync('api-endpoints.json', JSON.stringify(sortedMatches, null, 2));
    console.log(`Successfully found ${sortedMatches.length} API endpoints and saved to api-endpoints.json`);
    
    // Let's search for "chat/completions" or similar endpoint matching chat
    const chatRegex = /\/api\/v1\/chat[a-zA-Z0-9\/\-_]*/g;
    const chatMatches = new Set();
    while ((match = chatRegex.exec(jsText)) !== null) {
      chatMatches.add(match[0]);
    }
    console.log("Chat specific endpoints:", Array.from(chatMatches));
    
  } catch (e) {
    console.log("Error:", e.message);
  }
}

main();
