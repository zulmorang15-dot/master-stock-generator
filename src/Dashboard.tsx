import React, { useState } from "react";
import axios from "axios";

interface StockIdea {
  id: string;
  deskripsi: string;
  judul: string;
  keywords: string;
  kategori: string;
  promptCode: string; // Menampung kode .tsx murni dari AI
  statusPreview: "idle" | "processing" | "success" | "failed";
}

export const Dashboard: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<StockIdea[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fungsi Ambil Data Kompetitor + Buat Kode Bebas via Gemini
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

  // 2. Fungsi Klik "Buat" -> Menimpa File Lokal -> Push Git -> Cloud Render
  const handleCreatePreview = async (id: string, index: number) => {
    const updated = [...results];
    updated[index].statusPreview = "processing";
    setResults(updated);

    try {
      const response = await axios.post("http://localhost:5000/api/render", { item: results[index] });
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
    }
  };

  // Fungsi Salin Teks Otomatis ke Clipboard
  const copyToClipboard = (text: string) => {
    const globalObj = globalThis as any;
    if (globalObj.navigator && globalObj.navigator.clipboard) {
      globalObj.navigator.clipboard.writeText(text);
      if (globalObj.alert) {
        globalObj.alert("Teks berhasil disalin!");
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", padding: "30px", fontFamily: "sans-serif" }}>
      {results.length === 0 ? (
        <div style={{ maxWidth: "600px", margin: "100px auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "10px", background: "linear-gradient(to right, #38bdf8, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "bold" }}>
            Adobe Stock Live-Scrape & Code Generator
          </h1>
          <p style={{ color: "#9ca3af", marginBottom: "30px", fontSize: "14px" }}>
            Korek data video teratas secara *real-time* dan biarkan AI menulis kode `.tsx` unik murni dari nol tanpa batasan template.
          </p>
          
          <div style={{ backgroundColor: "#161f32", padding: "20px", borderRadius: "16px", border: "1px solid #1e293b" }}>
            <textarea
              style={{ width: "100%", backgroundColor: "transparent", border: "none", outline: "none", color: "white", fontSize: "16px", resize: "none" }}
              placeholder="Masukkan kata kunci... (Contoh: Matrix Digital Code Rain)"
              rows={3}
              value={keyword}
              onChange={(e) => setKeyword((e.target as any).value)}
            />
            <div style={{ textAlign: "right", marginTop: "15px", borderTop: "1px solid #1e293b", paddingTop: "10px" }}>
              <button
                onClick={handleSearch}
                disabled={loading}
                style={{ backgroundColor: "#38bdf8", color: "#0b0f19", padding: "10px 24px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", opacity: loading ? 0.5 : 1 }}
              >
                {loading ? "Membaca Kompetitor & Menulis Kode..." : "Cari & Optimasi ATM"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", margin: "0 auto" }}>
          <button onClick={() => setResults([])} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", marginBottom: "20px", fontWeight: "bold" }}>← Cari Kata Kunci Lain</button>
          <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Hasil Analisis Kompetitor & AI Code: <span style={{ color: "#38bdf8" }}>"{keyword}"</span></h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#111827", borderRadius: "12px", overflow: "hidden", fontSize: "13px", border: "1px solid #1e293b" }}>
            <thead>
              <tr style={{ backgroundColor: "#1f2937", color: "#e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "12px", width: "40px" }}>No</th>
                <th style={{ padding: "12px", width: "220px" }}>Deskripsi Detail Video (USA SEO)</th>
                <th style={{ padding: "12px", width: "200px" }}>Rekomendasi Judul Motion</th>
                <th style={{ padding: "12px", width: "250px" }}>Keywords (Tagging)</th>
                <th style={{ padding: "12px", width: "100px" }}>Kategori</th>
                <th style={{ padding: "12px", width: "150px" }}>Intisari Kode Visual AI</th>
                <th style={{ padding: "12px", width: "90px" }}>Aksi</th>
                <th style={{ padding: "12px", width: "150px" }}>Preview Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #1e293b", verticalAlign: "top" }}>
                  <td style={{ padding: "12px", color: "#9ca3af" }}>{index + 1}</td>
                  
                  {/* 1. Kolom Deskripsi */}
                  <td style={{ padding: "12px", color: "#d1d5db", lineHeight: "1.4" }}>
                    {item.deskripsi}
                    <button onClick={() => copyToClipboard(item.deskripsi)} style={{ display: "block", background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "11px", marginTop: "5px", padding: 0 }}>📋 Salin Deskripsi</button>
                  </td>
                  
                  {/* 2. Kolom Judul */}
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#ffffff" }}>
                    {item.judul}
                    <button onClick={() => copyToClipboard(item.judul)} style={{ display: "block", background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "11px", marginTop: "5px", padding: 0 }}>📋 Salin Judul</button>
                  </td>
                  
                  {/* 3. Kolom Keywords */}
                  <td style={{ padding: "12px" }}>
                    <div style={{ maxHeight: "70px", overflowY: "auto", color: "#9ca3af", fontSize: "12px", backgroundColor: "#1f2937", padding: "6px", borderRadius: "6px" }}>
                      {item.keywords}
                    </div>
                    <button onClick={() => copyToClipboard(item.keywords)} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "11px", marginTop: "5px", padding: 0 }}>📋 Salin Semua Tag</button>
                  </td>
                  
                  {/* 4. Kolom Kategori */}
                  <td style={{ padding: "12px" }}>
                    <span style={{ backgroundColor: "#1e1b4b", color: "#818cf8", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>{item.kategori}</span>
                  </td>
                  
                  {/* 5. Kolom Intisari / Tampilan Struktur Kode */}
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#10b981", backgroundColor: "#062016", padding: "6px", borderRadius: "6px", fontFamily: "monospace", maxHeight: "70px", overflowY: "auto" }}>
                      {item.promptCode.substring(0, 150)}...
                    </div>
                    <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }}>✓ Kode .tsx siap injeksi</div>
                  </td>
                  
                  {/* 6. Kolom Aksi */}
                  <td style={{ padding: "12px" }}>
                    <button
                      onClick={() => handleCreatePreview(item.id, index)}
                      disabled={item.statusPreview === "processing"}
                      style={{ backgroundColor: item.statusPreview === "success" ? "#4b5563" : "#38bdf8", color: item.statusPreview === "success" ? "white" : "#0b0f19", padding: "6px 12px", borderRadius: "4px", border: "none", cursor: item.statusPreview === "processing" ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "bold", width: "100%" }}
                    >
                      {item.statusPreview === "processing" ? "Deploy..." : item.statusPreview === "success" ? "Cetak Lagi" : "Generate"}
                    </button>
                  </td>
                  
                  {/* 7. Kolom Status */}
                  <td style={{ padding: "12px", fontSize: "12px" }}>
                    {item.statusPreview === "idle" && <span style={{ color: "#6b7280" }}>Menunggu</span>}
                    {item.statusPreview === "processing" && <span style={{ color: "#a855f7", fontWeight: "bold" }}>⏳ Injeksi & Cloud Render...</span>}
                    {item.statusPreview === "failed" && <span style={{ color: "#ef4444" }}>❌ Gagal</span>}
                    {item.statusPreview === "success" && <span style={{ color: "#34d399", fontWeight: "bold" }}>✅ Sukses Terkirim! Cek GitHub Actions</span>}
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