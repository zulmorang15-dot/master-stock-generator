import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

// 🎨 CYBER COLOR PALETTE
const COLORS = ['#00f0ff', '#0066ff', '#bd00ff', '#ff00c8', '#00ff9d', '#3d7bff', '#00d4ff'];

// Deterministic seed-based PRNG to avoid Math.random() inside component render
let seed = 98765;
const random = () => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};
const rnd = (min: number, max: number) => min + random() * (max - min);
const pick = <T,>(arr: T[]): T => arr[Math.floor(random() * arr.length)];

// Smooth color interpolation helper for frame-locked breathing effects
const interpColor = (p: number, r1: number, g1: number, b1: number, a1: number, r2: number, g2: number, b2: number, a2: number) => {
  const r = Math.round(r1 + (r2 - r1) * p);
  const g = Math.round(g1 + (g2 - g1) * p);
  const b = Math.round(b1 + (b2 - b1) * p);
  const a = a1 + (a2 - a1) * p;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

interface StreakData {
  width: number;
  height: number;
  left: number;
  color: string;
  opacity: number;
  rev: boolean;
  duration: number;
  offset: number;
}

// Generate static, deterministic stream of vertical lines
const STREAKS: StreakData[] = Array.from({ length: 50 }).map(() => {
  const thick = rnd(2, 9);
  return {
    width: thick,
    height: rnd(80, 420),
    left: rnd(0, 100),
    color: pick(COLORS),
    opacity: Number(rnd(0.35, 0.9).toFixed(2)),
    rev: random() > 0.5,
    duration: rnd(1.5, 3.5),
    offset: random(),
  };
});

interface DotlineData {
  width: number;
  height: number;
  left: number;
  color: string;
  gap: number;
  opacity: number;
  rev: boolean;
  duration: number;
  offset: number;
}

// Generate static vertical dotted lines
const DOTLINES: DotlineData[] = Array.from({ length: 24 }).map(() => {
  const size = rnd(2, 5);
  return {
    width: size,
    height: rnd(120, 380),
    left: rnd(0, 100),
    color: pick(COLORS),
    gap: rnd(8, 18),
    opacity: Number(rnd(0.5, 1).toFixed(2)),
    rev: random() > 0.5,
    duration: rnd(1.8, 3.8),
    offset: random(),
  };
});

interface DotData {
  size: number;
  top: number;
  left: number;
  color: string;
  opacity: number;
  moveDuration: number;
  twinkleDuration: number;
  moveOffset: number;
  twinkleOffset: number;
}

// Generate static twinkling ambient background particles
const DOTS: DotData[] = Array.from({ length: 45 }).map(() => {
  return {
    size: rnd(2, 6),
    top: rnd(0, 100),
    left: rnd(0, 100),
    color: pick(COLORS),
    opacity: Number(rnd(0.4, 1).toFixed(2)),
    moveDuration: rnd(2.5, 6),
    twinkleDuration: rnd(1.5, 3),
    moveOffset: random(),
    twinkleOffset: random(),
  };
});

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CyberNeonFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Fullscreen 16:9 aspect ratio preservation scaling
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Ambient Background Hue shift (20s cycle matches total duration seamlessly)
  const hue = (frame / (fps * 20)) * 360;
  const ambientStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `
      radial-gradient(circle at 50% 50%, rgba(0, 102, 255, 0.28), transparent 60%),
      radial-gradient(circle at 20% 80%, rgba(189, 0, 255, 0.18), transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(0, 240, 255, 0.18), transparent 50%)
    `,
    zIndex: 0,
    filter: `hue-rotate(${hue}deg)`,
  };

  // 2. Pixel Grid moving & breathing (4s pulse cycle, 20s grid translation loops at exactly 38px size)
  const gridPulseProgress = (frame % (fps * 4)) / (fps * 4);
  const gridPulseOpacity = interpolate(gridPulseProgress, [0, 0.5, 1], [0.22, 0.55, 0.22]);
  const gridScrollProgress = (frame / (fps * 20)) * 38;
  const pixelGridStyle: React.CSSProperties = {
    position: 'absolute',
    inset: -50,
    backgroundImage: `
      linear-gradient(rgba(0, 240, 255, 0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 240, 255, 0.07) 1px, transparent 1px)
    `,
    backgroundSize: '38px 38px',
    opacity: gridPulseOpacity,
    transform: `translateY(${gridScrollProgress}px)`,
    zIndex: 1,
  };

  // 3. Scanline sweep effect (10s cycle)
  const scanProgress = (frame % (fps * 10)) / (fps * 10);
  const scanLeft = interpolate(scanProgress, [0, 1], [-160, 1920]);
  const scanlineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 160,
    background: 'linear-gradient(to right, transparent, rgba(0, 240, 255, 0.08), rgba(189, 0, 255, 0.08), transparent)',
    zIndex: 3,
    pointerEvents: 'none',
    left: scanLeft,
  };

  // 4. Glitching & pulsing neon Title (5s cycle loop)
  const titleGlowPulseProgress = (frame % (fps * 2.5)) / (fps * 2.5);
  const titleBrightness = interpolate(titleGlowPulseProgress, [0, 0.5, 1], [1, 1.8, 1]);
  const titleSaturate = interpolate(titleGlowPulseProgress, [0, 0.5, 1], [1.2, 1.7, 1.2]);

  const titleGlitchProgress = (frame % (fps * 5)) / (fps * 5);
  const titleTx = interpolate(titleGlitchProgress, [0, 0.90, 0.91, 0.93, 0.95, 1.0], [0, 0, -3, 3, 0, 0]);
  const titleSkewX = interpolate(titleGlitchProgress, [0, 0.90, 0.91, 0.93, 0.95, 1.0], [0, 0, 5, -5, 0, 0]);

  let titleShadow = '0 0 12px #00f0ff, 0 0 24px #ff00c8';
  if (titleGlitchProgress >= 0.90 && titleGlitchProgress < 0.92) {
    titleShadow = '2px 0 #ff00c8, -2px 0 #00f0ff';
  } else if (titleGlitchProgress >= 0.92 && titleGlitchProgress < 0.94) {
    titleShadow = '-2px 0 #ff00c8, 2px 0 #00f0ff';
  }

  const titleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 140,
    width: '100%',
    textAlign: 'center',
    zIndex: 5,
    color: '#fff',
    fontSize: 44,
    letterSpacing: 10,
    textTransform: 'uppercase',
    textShadow: titleShadow,
    filter: `brightness(${titleBrightness}) saturate(${titleSaturate})`,
    transform: `translateX(${titleTx}px) skewX(${titleSkewX}deg)`,
    fontFamily: `'Segoe UI', Arial, sans-serif`,
    fontWeight: 700,
  };

  // 5. Container floating motion (5s cycle loop)
  const containerFloatProgress = (frame % (fps * 5)) / (fps * 5);
  const containerY = interpolate(containerFloatProgress, [0, 0.5, 1], [0, -20, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 5,
    width: 1200,
    height: 450,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transform: `translateY(${containerY}px)`,
  };

  // 6. Generic Flicker animation for Content/CTA labels
  const labelFlickerProgress = (frame % (fps * 5)) / (fps * 5);
  const labelOpacity = interpolate(
    labelFlickerProgress,
    [0, 0.92, 0.93, 0.94, 0.96, 0.97, 1.0],
    [1, 1, 0.4, 1, 0.6, 1, 1]
  );

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#d6faff',
    textShadow: '0 0 10px #00f0ff, 0 0 18px #ff00c8',
    pointerEvents: 'none',
    opacity: labelOpacity,
    fontFamily: `'Segoe UI', Arial, sans-serif`,
  };

  // --- Dynamic Framework animations (Left Card, Right Card, Center Circle) ---
  const globalPulseProgress = (frame % (fps * 2.5)) / (fps * 2.5);
  const elementBrightness = interpolate(globalPulseProgress, [0, 0.5, 1], [1, 1.8, 1]);
  const elementSaturate = interpolate(globalPulseProgress, [0, 0.5, 1], [1.2, 1.7, 1.2]);

  // A. Left Rect Frame
  const rectLeftBorderFlowY = ((frame % (fps * 5)) / (fps * 5)) * 100;
  const tiltLProgress = (frame % (fps * 5)) / (fps * 5);
  const tiltLAngle = interpolate(tiltLProgress, [0, 0.5, 1], [6, -2, 6]);

  const rectLeftStyle: React.CSSProperties = {
    position: 'absolute',
    width: 380,
    height: 240,
    left: 100,
    borderRadius: 8,
    border: '3px solid transparent',
    background: `
      linear-gradient(rgba(4, 8, 20, 0.85), rgba(4, 8, 20, 0.85)) padding-box,
      linear-gradient(160deg, #00f0ff, #0066ff, #bd00ff, #00ff9d, #00f0ff) border-box
    `,
    backgroundSize: '100% 100%, 300% 300%',
    backgroundPosition: `0% 0%, 50% ${rectLeftBorderFlowY}%`,
    boxShadow: '0 0 16px #00f0ff, 0 0 35px rgba(189, 0, 255, 0.55), inset 0 0 25px rgba(0, 240, 255, 0.25)',
    filter: `brightness(${elementBrightness}) saturate(${elementSaturate})`,
    transform: `perspective(800px) rotateY(${tiltLAngle}deg)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backdropFilter: 'blur(2px)',
  };

  // B. Right Rect Frame
  const rectRightBorderFlowY = 100 - ((frame % (fps * 5)) / (fps * 5)) * 100;
  const tiltRProgress = ((frame % (fps * 5)) / (fps * 5) + 0.24) % 1;
  const tiltRAngle = interpolate(tiltRProgress, [0, 0.5, 1], [-6, 2, -6]);

  const rectRightStyle: React.CSSProperties = {
    position: 'absolute',
    width: 380,
    height: 240,
    right: 100,
    borderRadius: 8,
    border: '3px solid transparent',
    background: `
      linear-gradient(rgba(4, 8, 20, 0.85), rgba(4, 8, 20, 0.85)) padding-box,
      linear-gradient(20deg, #ff00c8, #bd00ff, #0066ff, #00ff9d, #ff00c8) border-box
    `,
    backgroundSize: '100% 100%, 300% 300%',
    backgroundPosition: `0% 0%, 50% ${rectRightBorderFlowY}%`,
    boxShadow: '0 0 16px #ff00c8, 0 0 35px rgba(0, 102, 255, 0.55), inset 0 0 25px rgba(189, 0, 255, 0.25)',
    filter: `brightness(${elementBrightness}) saturate(${elementSaturate})`,
    transform: `perspective(800px) rotateY(${tiltRAngle}deg)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backdropFilter: 'blur(2px)',
  };

  // C. Centered Circular Frame components
  const breatheProgress = (frame % (fps * 4)) / (fps * 4);
  const bValue = interpolate(breatheProgress, [0, 0.5, 1], [0, 1, 0]);

  // Color & intensity breathing transitions inside Center CTA Frame
  const shadowColor1 = interpColor(bValue, 189, 0, 255, 1.0, 255, 0, 200, 1.0);
  const shadowColor2 = interpColor(bValue, 0, 240, 255, 0.5, 0, 255, 157, 0.7);
  const shadowColor3 = interpColor(bValue, 189, 0, 255, 0.3, 255, 0, 200, 0.4);

  const cShadowWidth1 = interpolate(bValue, [0, 1], [18, 30]);
  const cShadowWidth2 = interpolate(bValue, [0, 1], [40, 70]);
  const cShadowWidth3 = interpolate(bValue, [0, 1], [25, 35]);

  const spinAngle = ((frame % (fps * 5)) / (fps * 5)) * 360;
  const dashAngle = -((frame % (fps * 10)) / (fps * 10)) * 360;
  const orbitAngle = ((frame % (fps * 4)) / (fps * 4)) * 360;

  const circleContainerStyle: React.CSSProperties = {
    position: 'absolute',
    width: 240,
    height: 240,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const circleStyle: React.CSSProperties = {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: '50%',
    border: '3px solid transparent',
    background: `
      radial-gradient(circle, rgba(4, 10, 25, 0.9), rgba(4, 8, 20, 0.85)) padding-box,
      conic-gradient(#ff00c8, #bd00ff, #0066ff, #00f0ff, #00ff9d, #ff00c8) border-box
    `,
    boxShadow: `0 0 ${cShadowWidth1}px ${shadowColor1}, 0 0 ${cShadowWidth2}px ${shadowColor2}, inset 0 0 ${cShadowWidth3}px ${shadowColor3}`,
    filter: `brightness(${elementBrightness}) saturate(${elementSaturate})`,
    transform: `rotate(${spinAngle}deg)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const orbitStyle: React.CSSProperties = {
    position: 'absolute',
    top: -22,
    left: '50%',
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: '50%',
    backgroundColor: '#00ff9d',
    boxShadow: '0 0 14px #00ff9d',
    transformOrigin: '5px 142px',
    transform: `rotate(${orbitAngle}deg)`,
  };

  return (
    <div
      style={{
        backgroundColor: '#01030a',
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
      }}
    >
      {/* Background Layers */}
      <div style={ambientStyle} />
      <div style={pixelGridStyle} />
      <div style={scanlineStyle} />

      {/* Dynamic particles, streaks & dashed dotlines */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 2 }}>
        {STREAKS.map((s, i) => {
          const localProgress = ((frame / (fps * s.duration)) + s.offset) % 1;
          const y = s.rev
            ? interpolate(localProgress, [0, 1], [-450, 1350])
            : interpolate(localProgress, [0, 1], [1350, -450]);

          return (
            <div
              key={`streak-${i}`}
              style={{
                position: 'absolute',
                borderRadius: 6,
                filter: 'blur(0.6px)',
                width: s.width,
                height: s.height,
                left: `${s.left}%`,
                background: `linear-gradient(180deg, transparent, ${s.color}, transparent)`,
                boxShadow: `0 0 ${s.width * 2}px ${s.color}`,
                opacity: s.opacity,
                transform: `translateY(${y}px)`,
              }}
            />
          );
        })}

        {DOTLINES.map((d, i) => {
          const localProgress = ((frame / (fps * d.duration)) + d.offset) % 1;
          const y = d.rev
            ? interpolate(localProgress, [0, 1], [-450, 1350])
            : interpolate(localProgress, [0, 1], [1350, -450]);

          return (
            <div
              key={`dotline-${i}`}
              style={{
                position: 'absolute',
                width: d.width,
                height: d.height,
                left: `${d.left}%`,
                backgroundImage: `radial-gradient(circle, ${d.color} 0 ${d.width / 2}px, transparent ${d.width / 2 + 0.5}px)`,
                backgroundSize: `${d.width}px ${d.gap}px`,
                backgroundRepeat: 'repeat-y',
                filter: `drop-shadow(0 0 ${d.width * 2}px ${d.color})`,
                opacity: d.opacity,
                transform: `translateY(${y}px)`,
              }}
            />
          );
        })}

        {DOTS.map((p, i) => {
          const localMoveProgress = ((frame / (fps * p.moveDuration)) + p.moveOffset) % 1;
          const y = interpolate(localMoveProgress, [0, 1], [1350, -450]);

          const localTwinkleProgress = ((frame / (fps * p.twinkleDuration)) + p.twinkleOffset) % 1;
          const twinkleOpacity = interpolate(localTwinkleProgress, [0, 0.5, 1], [0.3, 1, 0.3]);

          return (
            <div
              key={`dot-${i}`}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                width: p.size,
                height: p.size,
                left: `${p.left}%`,
                background: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                opacity: p.opacity * twinkleOpacity,
                transform: `translateY(${y}px)`,
              }}
            />
          );
        })}
      </div>

      {/* Cyber Title */}
      <h1 style={titleStyle}>Cyber Neon Flow</h1>

      {/* Frames Interface Wrapper */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={containerStyle}>
          {/* Left Panel */}
          <div style={rectLeftStyle}>
            <span style={labelStyle}>CONTENT 01</span>
          </div>

          {/* Central Circular CTA Component */}
          <div style={circleContainerStyle}>
            {/* outer dashed spinning border */}
            <div
              style={{
                position: 'absolute',
                inset: -18,
                borderRadius: '50%',
                border: '1px dashed rgba(0, 240, 255, 0.5)',
                transform: `rotate(${dashAngle}deg)`,
              }}
            />

            {/* main frame */}
            <div style={circleStyle}>
              {/* rotating the label in reverse cancels the parent spin, keeping text legible */}
              <span
                style={{
                  ...labelStyle,
                  transform: `rotate(${-spinAngle}deg)`,
                  fontSize: 28,
                }}
              >
                CTA
              </span>
            </div>

            {/* satellite orbit point */}
            <div style={orbitStyle} />
          </div>

          {/* Right Panel */}
          <div style={rectRightStyle}>
            <span style={labelStyle}>CONTENT 02</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberNeonFlow;
// END_OF_FILE