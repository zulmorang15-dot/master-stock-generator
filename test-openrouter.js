const axios = require("axios");

async function test() {
  const apiKey = process.env.OPENROUTER_API_KEY || "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";
  
  try {
    console.log("Testing OpenRouter API...");
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: "Say 'Hello from OpenRouter' in 3 words" }],
        max_tokens: 50
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "Stock Generator Test",
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );
    console.log("✅ SUCCESS!");
    console.log("Response:", response.data.choices[0].message.content);
  } catch (error) {
    console.error("❌ FAILED!");
    console.error("Status:", error.response?.status);
    console.error("Error:", JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

test();