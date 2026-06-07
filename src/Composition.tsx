import { interpolate, useCurrentFrame, useVideoConfig, getInputProps } from "remotion";
import React from "react";

// 1. Variabel dinamis yang nantinya akan diatur oleh AI
interface MainProps {
  color1?: string;
  color2?: string;
  speed?: number;
  textInput?: string;
}

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();

  // 2. Ambil data dari luar. Jika tidak ada, pakai warna default (Neon Pink & Biru)
  const config = (getInputProps() as MainProps) ?? {};
  const color1 = config.color1 ?? "#ff007f"; 
  const color2 = config.color2 ?? "#00f0ff"; 
  const speed = config.speed ?? 1;
  const textInput = config.textInput ?? "MOTION";

  // 3. Logika Animasi teks muncul dan membesar
  const opacity = interpolate(frame * speed, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame * speed, [0, 25], [0.3, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#0d0d1a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(circle, #1a1a3a 0%, #050510 100%)`,
      }}
    >
      <h1
        style={{
          fontFamily: "sans-serif",
          fontSize: 100,
          fontWeight: "bold",
          color: "white",
          opacity: opacity,
          transform: `scale(${scale})`,
          textShadow: `0 0 20px ${color1}, 0 0 40px ${color2}, 0 0 60px ${color1}`,
        }}
      >
        {textInput}
      </h1>
    </div>
  );
};