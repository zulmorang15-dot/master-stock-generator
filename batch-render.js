const { execSync } = require("child_process");
const fs = require("fs");

// 1. Baca data dari file ideas.json yang sudah kita buat
const rawData = fs.readFileSync("ideas.json");
const ideas = JSON.parse(rawData);

console.log(`🤖 Menemukan ${ideas.length} antrean video. Memulai render massal...\n`);

// 2. Lakukan looping (perulangan) untuk merender setiap video satu per satu
ideas.forEach((item, index) => {
  console.log(`--------------------------------------------------`);
  console.log(`⏳ [${index + 1}/${ideas.length}] Merender: ${item.textInput} (ID: ${item.id})`);
  
  // Ubah data objek menjadi teks string JSON agar bisa dibaca Remotion CLI
  const propsString = JSON.stringify(item);

  // Perintah terminal Remotion yang disesuaikan untuk Windows (menggunakan file props sementara)
  fs.writeFileSync("temp-props.json", propsString);

  try {
    // Jalankan perintah render Remotion secara otomatis melalui kode
 execSync(`npx remotion render Composition out/${item.id}.mp4 --props=temp-props.json`, { stdio: "inherit" });
  } catch (error) {
    console.error(`❌ Gagal merender ${item.id}:`, error.message);
  }
});

// 3. Bersihkan file properti sementara setelah selesai
if (fs.existsSync("temp-props.json")) {
  fs.unlinkSync("temp-props.json");
}

console.log(`\n🎉 Semua proses render massal selesai! Silakan cek folder 'out'.`);