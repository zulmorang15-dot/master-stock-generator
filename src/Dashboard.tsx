import React, { useState } from "react";
import axios from "axios";

interface StockIdea {
  id: string;
  textInput: string;
  color1: string;
  color2: string;
  speed: number;
  statusPreview: "idle" | "processing" | "success" | "failed";
}

export const Dashboard: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<StockIdea[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fungsi Tombol "Cari Ide"
  const handleSearch = async () => {
    if (!keyword) return;
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/generate", { keyword });
      const formatted = response.data.map((item: any) => ({
        ...item,
        statusPreview: "idle"
      }));
      setResults(formatted);
    } catch (error) {
      const globalObj = globalThis as any;
      if (globalObj.console) {
        globalObj.console.error("Gagal terhubung ke backend:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Fungsi Tombol "Buat" -> Langsung Merespon Secara Real-Time Sekarang
  const handleCreatePreview = async (id: string, index: number) => {
    // Ubah status di layar jadi "processing" (Render...)
    const updated = [...results];
    updated[index].statusPreview = "processing";
    setResults(updated);

    try {
      // Mengirim perintah render ke server backend port 5000
      const response = await axios.post("http://localhost:5000/api/render", { item: results[index] });
      
      // KUNCI REAL-TIME: Begitu server memberikan respon balik 'success', 
      // React akan langsung mengubah status di layar saat itu juga!
      const finalUpdate = [...results];
      if (response.data && response.data.success) {
        finalUpdate[index].statusPreview = "success";
      } else {
        finalUpdate[index].statusPreview = "failed";
      }
      setResults(finalUpdate);

    } catch (error) {
      const finalUpdate = [...results];
      finalUpdate[index].statusPreview = "failed";
      setResults(finalUpdate);
      
      const globalObj = globalThis as any;
      if (globalObj.console) {
        globalObj.console.error("Gagal merender:", error);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0e1117", color: "#f3f4f6", padding: "40px", fontFamily: "sans-serif" }}>
      {results.length === 0 ? (
        <div style={{ maxWidth: "600px", margin: "100px auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "30px", background: "linear-gradient(to right, #60a5fa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "bold" }}>
            Ide video stock apa yang ingin kamu cari?
          </h1>
          <div style={{ backgroundColor: "#1b1f2b", padding: "20px", borderRadius: "16px", border: "1px solid #374151" }}>
            <textarea
              style={{ width: "100%", backgroundColor: "transparent", border: "none", outline: "none", color: "white", fontSize: "16px", resize: "none" }}
              placeholder="Masukkan kata kunci... (Contoh: Neon Motion Background)"
              rows={3}
              value={keyword}
              onChange={(e) => setKeyword((e.target as any).value)}
            />
            <div style={{ textAlign: "right", marginTop: "15px", borderTop: "1px solid #374151", paddingTop: "10px" }}>
              <button
                onClick={handleSearch}
                disabled={loading}
                style={{ backgroundColor: "#3b82f6", color: "white", padding: "10px 24px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", opacity: loading ? 0.5 : 1 }}
              >
                {loading ? "Mencari..." : "Cari Ide"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <button onClick={() => setResults([])} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", marginBottom: "20px" }}>← Kembali</button>
          <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Hasil Analisis Ide untuk: <span style={{ color: "#60a5fa" }}>"{keyword}"</span></h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#161b26", borderRadius: "12px", overflow: "hidden" }}>
            <thead>
              <tr style={{ backgroundColor: "#1f2535", color: "#d1d5db", textAlign: "left" }}>
                <th style={{ padding: "15px" }}>No</th>
                <th style={{ padding: "15px" }}>Rekomendasi Teks</th>
                <th style={{ padding: "15px" }}>Warna & Speed</th>
                <th style={{ padding: "15px" }}>Aksi</th>
                <th style={{ padding: "15px" }}>Hasil Preview</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #374151" }}>
                  <td style={{ padding: "15px" }}>{index + 1}</td>
                  <td style={{ padding: "15px", fontWeight: "bold" }}>{item.textInput}</td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ backgroundColor: item.color1, color: "black", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", marginRight: "5px" }}>{item.color1}</span>
                    <span style={{ backgroundColor: item.color2, color: "black", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", marginRight: "10px" }}>{item.color2}</span>
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>{item.speed}x</span>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <button
                      onClick={() => handleCreatePreview(item.id, index)}
                      disabled={item.statusPreview === "processing"}
                      style={{ backgroundColor: item.statusPreview === "success" ? "#4b5563" : "#10b981", color: "white", padding: "6px 12px", borderRadius: "4px", border: "none", cursor: item.statusPreview === "processing" ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "bold" }}
                    >
                      {item.statusPreview === "processing" ? "Render..." : item.statusPreview === "success" ? "Buat Lagi" : "Buat"}
                    </button>
                  </td>
                  <td style={{ padding: "15px", fontSize: "13px" }}>
                    {item.statusPreview === "idle" && <span style={{ color: "#6b7280" }}>Belum dibuat</span>}
                    {item.statusPreview === "processing" && <span style={{ color: "#3b82f6", fontWeight: "bold" }}>⏳ Sedang merender video...</span>}
                    {item.statusPreview === "failed" && <span style={{ color: "#ef4444" }}>❌ Gagal</span>}
                    {item.statusPreview === "success" && <span style={{ color: "#34d399", fontWeight: "bold" }}>✅ Selesai! Cek folder 'out/'</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};