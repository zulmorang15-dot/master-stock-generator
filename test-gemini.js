require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY tidak ditemukan di .env!");
    process.exit(1);
  }

  console.log("🔑 GEMINI_API_KEY ditemukan:", apiKey.substring(0, 15) + "...");
  
  try {
    console.log("🤖 Menginisialisasi Gemini AI SDK...");
    const genAI = new GoogleGenAI({ apiKey: apiKey });
    
    console.log("📡 Mengirim test request ke Gemini AI (model: gemini-2.0-flash)...");
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Say 'Hello from Gemini AI! Koneksi berhasil!' in 5 words",
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
        topP: 1,
      }
    });

    console.log("✅ SUCCESS!");
    console.log("Response:", response.text);
    console.log("\n🎉 Gemini AI berhasil terhubung dan berfungsi!");
    
  } catch (error) {
    console.error("❌ FAILED!");
    
    // Parse error message
    const errMsg = error.message || "";
    
    if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid")) {
      console.error("\n🔑 API Key Gemini tidak valid! Periksa GEMINI_API_KEY di .env");
      console.error("   Pastikan API key dari https://aistudio.google.com/apikey");
    } 
    else if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
      console.error("\n⚠️ Kuota Gemini API sudah habis untuk hari ini (free tier limit)");
      console.error("   Tunggu hingga kuota reset atau upgrade ke paid tier.");
      console.error("   Detail:", errMsg.substring(0, 200));
    }
    else if (errMsg.includes("NOT_FOUND")) {
      console.error("\n⚠️ Model tidak ditemukan. Coba model lain.");
      console.error("   Detail:", errMsg.substring(0, 200));
    }
    else {
      console.error("\n❌ Error tidak dikenal:", errMsg.substring(0, 300));
    }
    
    process.exit(1);
  }
}

testGemini();