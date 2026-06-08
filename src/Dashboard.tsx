import React, { useState } from "react";
import axios from "axios";

interface StockIdea {
  id: string;
  deskripsi: string;
  judul: string;
  keywords: string;
  kategori: string;
  durationInFrames: number;
  promptCode: string;
  statusPreview: "idle" | "processing" | "success" | "failed";
}

export const Dashboard: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<StockIdea[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fungsi Mengambil Ide & Kode dari Backend
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

  // 2. Fungsi Mengubah Parameter Langsung dari Ketikan User di Tabel
  const handleInputChange = (index: number, field: keyof StockIdea, value: any) => {
    const updatedResults = [...results];
    updatedResults[index] = {
      ...updatedResults[index],
      [field]: value,
    };
    setResults(updatedResults);
  };

  // 3. Fungsi Eksekusi Cetak Video ke Cloud
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

  // Fungsi Salin Teks ke Clipboard
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
            Mata-matai kompetitor teratas di USA secara real-time dan edit langsung kodenya sebelum dirender di Cloud.
          </p>
          
          <div style={{ backgroundColor: "#161f32", padding: "20px", borderRadius: "16px", border: "1px solid #1e293b" }}>
            <textarea
              style={{ width: "100%", backgroundColor: "transparent", border: "none", outline: "none", color: "white", fontSize: "16px", resize: "none" }}
              placeholder="Masukkan kata kunci... (Contoh: Futuristic Digital Cyber Background)"
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
                {loading ? "Menyisir Data & Meracik Kode..." : "Cari Ide & Optimasi ATM"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", margin: "0 auto" }}>
          <button onClick={() => setResults([])} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", marginBottom: "20px", fontWeight: "bold" }}>← Cari Kata Kunci Lain</button>
          <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Pusat Kendali Hasil Analisis Kompetitor & AI Code: <span style={{ color: "#38bdf8" }}>"{keyword}"</span></h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#111827", borderRadius: "12px", overflow: "hidden", fontSize: "13px", border: "1px solid #1e293b" }}>
            <thead>
              <tr style={{ backgroundColor: "#1f2937", color: "#e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "12px", width: "40px" }}>No</th>
                <th style={{ padding: "12px", width: "220px" }}>Deskripsi Video (Bisa Diedit)</th>
                <th style={{ padding: "12px", width: "200px" }}>Rekomendasi Judul (Bisa Diedit)</th>
                <th style={{ padding: "12px", width: "230px" }}>Keywords (Tagging)</th>
                <th style={{ padding: "12px", width: "110px" }}>Kategori / Durasi</th>
                <th style={{ padding: "12px", width: "250px" }}>Kode Visual `.tsx` AI (Bisa Diedit)</th>
                <th style={{ padding: "12px", width: "90px" }}>Aksi</th>
                <th style={{ padding: "12px", width: "140px" }}>Cloud Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #1e293b", verticalAlign: "top" }}>
                  <td style={{ padding: "12px", color: "#9ca3af" }}>{index + 1}</td>
                  
                  {/* 1. Kolom Deskripsi (Editable) */}
                  <td style={{ padding: "12px" }}>
                    <textarea
                      style={{ width: "100%", backgroundColor: "#1f2937", color: "white", border: "1px solid #374151", borderRadius: "4px", padding: "6px", fontSize: "12px", resize: "vertical" }}
                      rows={4}
                      value={item.deskripsi}
                      onChange={(e) => handleInputChange(index, "deskripsi", e.target.value)}
                    />
                    <button onClick={() => copyToClipboard(item.deskripsi)} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "11px", marginTop: "5px", padding: 0 }}>📋 Salin Deskripsi</button>
                  </td>
                  
                  {/* 2. Kolom Judul (Editable) */}
                  <td style={{ padding: "12px" }}>
                    <input
                      type="text"
                      style={{ width: "100%", backgroundColor: "#1f2937", color: "white", border: "1px solid #374151", borderRadius: "4px", padding: "6px", fontSize: "12px" }}
                      value={item.judul}
                      onChange={(e) => handleInputChange(index, "judul", e.target.value)}
                    />
                    <button onClick={() => copyToClipboard(item.judul)} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "11px", marginTop: "5px", padding: 0 }}>📋 Salin Judul</button>
                  </td>
                  
                  {/* 3. Kolom Keywords (Editable) */}
                  <td style={{ padding: "12px" }}>
                    <textarea
                      style={{ width: "100%", backgroundColor: "#1f2937", color: "#9ca3af", border: "1px solid #374151", borderRadius: "4px", padding: "6px", fontSize: "11px", resize: "vertical" }}
                      rows={4}
                      value={item.keywords}
                      onChange={(e) => handleInputChange(index, "keywords", e.target.value)}
                    />
                    <button onClick={() => copyToClipboard(item.keywords)} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "11px", marginTop: "5px", padding: 0 }}>📋 Salin Semua Tag</button>
                  </td>
                  
                  {/* 4. Kolom Kategori & Durasi */}
                  <td style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ backgroundColor: "#1e1b4b", color: "#818cf8", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", textAlign: "center" }}>{item.kategori}</span>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                      Frames:
                      <input 
                        type="number" 
                        style={{ width: "100%", backgroundColor: "#1f2937", color: "white", border: "1px solid #374151", borderRadius: "4px", padding: "4px", marginTop: "2px" }}
                        value={item.durationInFrames}
                        onChange={(e) => handleInputChange(index, "durationInFrames", Number(e.target.value))}
                      />
                    </div>
                  </td>
                  
                  {/* 5. Kolom Skrip Kode .tsx AI (Editable) */}
                  <td style={{ padding: "12px" }}>
                    <textarea
                      style={{ width: "100%", fontFamily: "monospace", fontSize: "11px", color: "#34d399", backgroundColor: "#062016", border: "1px solid #10b981", borderRadius: "4px", padding: "6px", resize: "vertical" }}
                      rows={6}
                      value={item.promptCode}
                      onChange={(e) => handleInputChange(index, "promptCode", e.target.value)}
                    />
                    <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }}>💡 Anda bisa merombak logika CSS/React AI di atas langsung sebelum merender</div>
                  </td>
                  
                  {/* 6. Kolom Aksi */}
                  <td style={{ padding: "12px" }}>
                    <button
                      onClick={() => handleCreatePreview(item.id, index)}
                      disabled={item.statusPreview === "processing"}
                      style={{ backgroundColor: item.statusPreview === "success" ? "#4b5563" : "#38bdf8", color: item.statusPreview === "success" ? "white" : "#0b0f19", padding: "8px 12px", borderRadius: "4px", border: "none", cursor: item.statusPreview === "processing" ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "bold", width: "100%" }}
                    >
                      {item.statusPreview === "processing" ? "Deploy..." : item.statusPreview === "success" ? "Cetak Lagi" : "Generate"}
                    </button>
                  </td>
                  
                  {/* 7. Kolom Status */}
                  <td style={{ padding: "12px", fontSize: "12px" }}>
                    {item.statusPreview === "idle" && <span style={{ color: "#6b7280" }}>Menunggu</span>}
                    {item.statusPreview === "processing" && <span style={{ color: "#a855f7", fontWeight: "bold" }}>⏳ Injeksi & Cloud Render...</span>}
                    {item.statusPreview === "failed" && <span style={{ color: "#ef4444" }}>❌ Gagal Kirim</span>}
                    {item.statusPreview === "success" && <span style={{ color: "#34d399", fontWeight: "bold" }}>✅ Sukses! Cek Tab Actions GitHub</span>}
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