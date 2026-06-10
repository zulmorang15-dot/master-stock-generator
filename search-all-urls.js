const axios = require('axios');
const fs = require('fs');

async function main() {
  const url = "https://syntx.ai/assets/1781010264/app.js";
  console.log(`Fetching bundle: ${url}...`);
  try {
    const jsRes = await axios.get(url);
    const jsText = jsRes.data;
    
    // Find all strings in double quotes, single quotes, or backticks
    // matching api paths (e.g. letters, slashes, dashes)
    const regex = /(?:"|'|`)([a-zA-Z0-9_\-]{2,}\/[a-zA-Z0-9_\-\/]+)(?:"|'|`)/g;
    const matches = new Set();
    let match;
    while ((match = regex.exec(jsText)) !== null) {
      matches.add(match[1]);
    }
    
    const sortedMatches = Array.from(matches).sort();
    fs.writeFileSync('all-paths.json', JSON.stringify(sortedMatches, null, 2));
    console.log(`Successfully found ${sortedMatches.length} paths and saved to all-paths.json`);
    
    // Print paths containing chat, text, ai, claude, or v1/v2
    const filtered = sortedMatches.filter(p => 
      p.includes('chat') || 
      p.includes('text') || 
      p.includes('claude') || 
      p.includes('auth') || 
      p.includes('user') ||
      p.includes('completion')
    );
    console.log("Filtered Paths:", filtered);
    
  } catch (e) {
    console.log("Error:", e.message);
  }
}

main();
