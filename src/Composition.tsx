import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

interface StyleProps {
  textInput: string;
  color1: string;
  color2: string;
  speed: number;
  style: "glitch" | "pulse" | "cinematic";
}

export const MyComposition: React.FC<StyleProps> = ({
  textInput = "SECURITY",
  color1 = "#00ffff",
  color2 = "#0080ff",
  speed = 1,
  style = "glitch",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Atur ritme frame berdasarkan kecepatan dari Gemini
  const adjustedFrame = frame * speed;

  // 1. ANIMASI GAYA: CINEMATIC (Fade in + Blur berkurang + Scale up pelan)
  const opacityCinematic = interpolate(adjustedFrame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const blurCinematic = interpolate(adjustedFrame, [0, 30], [20, 0], { extrapolateRight: "clamp" });
  const scaleCinematic = interpolate(adjustedFrame, [0, 150], [0.9, 1.1], { extrapolateRight: "clamp" });

  // 2. ANIMASI GAYA: PULSE (Teks membesar dengan efek Spring + Glow berkedip)
  const scalePulse = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 12 },
  });
  const glowPulse = Math.sin(adjustedFrame * 0.2) * 10 + 15; // Berkedip naik turun

  // 3. ANIMASI GAYA: GLITCH (Efek bergeser patah-patah acak ala cyberpunk)
  const glitchOffset = Math.random() > 0.85 && adjustedFrame % 5 === 0 ? (Math.random() - 0.5) * 15 : 0;
  const glitchOpacity = Math.random() > 0.92 ? 0.4 : 1;

  // Kondisional Style Renderer
  let textStyle: React.CSSProperties = {
    fontFamily: "sans-serif",
    fontWeight: "black" as any,
    fontSize: "90px",
    letterSpacing: "4px",
    textAlign: "center",
    textTransform: "uppercase",
    transition: "all 0.1s ease",
  };

  if (style === "glitch") {
    textStyle = {
      ...textStyle,
      color: color1,
      textShadow: `${glitchOffset}px 0px 0px ${color2}, -${glitchOffset}px 0px 0px #ff00ff, 0 0 20px ${color1}`,
      transform: `scale(${1 + Math.sin(adjustedFrame * 0.02) * 0.05})`,
      opacity: glitchOpacity,
    };
  } else if (style === "pulse") {
    textStyle = {
      ...textStyle,
      color: "#ffffff",
      textShadow: `0 0 ${glowPulse}px ${color1}, 0 0 ${glowPulse + 10}px ${color2}`,
      transform: `scale(${scalePulse})`,
    };
  } else if (style === "cinematic") {
    textStyle = {
      ...textStyle,
      color: "transparent",
      WebkitTextStroke: `2px ${color1}`,
      filter: `blur(${blurCinematic}px) drop-shadow(0 0 15px ${color2})`,
      opacity: opacityCinematic,
      transform: `scale(${scaleCinematic})`,
    };
  }

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#05070c",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "radial-gradient(circle, #111625 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <h1 style={textStyle}>{textInput}</h1>
    </div>
  );
};