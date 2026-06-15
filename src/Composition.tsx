import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

// Deterministic seed-based pseudo-random generator to avoid Math.random() in render
const createSeededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
};

const colors = ['#00b3ff', '#ff1f5a', '#8a2be2', '#00ffd5', '#ff00e6', '#5d8bff', '#ff7a00'];
const rnd = createSeededRandom(4321);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const rndRange = (min: number, max: number) => min + rnd() * (max - min);

// Divisors of 900 (for perfect seamless looping of moving assets at 60fps / 15s)
const allowedDurations = [60, 75, 90, 100, 150, 180, 225, 300];

// Pre-generated static values to ensure deterministic offline rendering
const solidStreaks = Array.from({ length: 45 }).map(() => {
  const thick = rndRange(2, 9);
  const color = pick(colors);
  const duration = allowedDurations[Math.floor(rnd() * allowedDurations.length)];
  return {
    thick,
    color,
    width: rndRange(80, 420),
    top: rndRange(0, 1080),
    opacity: Number(rndRange(0.35, 0.9).toFixed(2)),
    duration,
    offset: Math.floor(rnd() * 900),
  };
});

const dotLines = Array.from({ length: 22 }).map(() => {
  const size = rndRange(2, 5);
  const gap = rndRange(8, 18);
  const color = pick(colors);
  const duration = allowedDurations[Math.floor(rnd() * allowedDurations.length)];
  return {
    size,
    gap,
    color,
    width: rndRange(120, 380),
    top: rndRange(0, 1080),
    opacity: Number(rndRange(0.5, 1).toFixed(2)),
    duration,
    offset: Math.floor(rnd() * 900),
  };
});

const glowDots = Array.from({ length: 40 }).map(() => {
  const size = rndRange(2, 6);
  const color = pick(colors);
  const duration = allowedDurations[Math.floor(rnd() * allowedDurations.length)];
  return {
    size,
    color,
    top: rndRange(0, 1080),
    left: rndRange(0, 1920),
    opacity: Number(rndRange(0.4, 1).toFixed(2)),
    duration,
    offset: Math.floor(rnd() * 900),
  };
});

export const NeonGlowFrames: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const ORIGINAL_WIDTH = 1920;
  const ORIGINAL_HEIGHT = 1080;
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Grid opacity oscillation (4s / 240 frames period, dividing 900 frames perfectly)
  const gridLocalFrame = frame % 225; // 225 frames is 3.75s, perfect divisor of 900
  const gridOpacity = interpolate(
    gridLocalFrame,
    [0, 112.5, 225],
    [0.25, 0.6, 0.25],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Glow pulse animations (150 frames = 2.5s period, divides 900 frames)
  const glowLocalFrame = frame % 150;
  const glowBrightness = interpolate(
    glowLocalFrame,
    [0, 75, 150],
    [1.0, 1.8, 1.0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const glowSaturate = interpolate(
    glowLocalFrame,
    [0, 75, 150],
    [1.2, 1.6, 1.2],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Delayed glow pulse for the right panel (offset by half a cycle)
  const rightGlowLocalFrame = (frame + 75) % 150;
  const rightGlowBrightness = interpolate(
    rightGlowLocalFrame,
    [0, 75, 150],
    [1.0, 1.8, 1.0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const rightGlowSaturate = interpolate(
    rightGlowLocalFrame,
    [0, 75, 150],
    [1.2, 1.6, 1.2],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Title glow pulse (180 frames = 3s period, divides 900 frames)
  const titleLocalFrame = frame % 180;
  const titleBrightness = interpolate(
    titleLocalFrame,
    [0, 90, 180],
    [1.0, 1.8, 1.0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const titleSaturate = interpolate(
    titleLocalFrame,
    [0, 90, 180],
    [1.2, 1.6, 1.2],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Central circle rotation (300 frames = 5s period, divides 900 frames)
  const spinLocalFrame = frame % 300;
  const circleRotation = interpolate(spinLocalFrame, [0, 300], [0, 360]);

  // Style Definitions
  const mainWrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#05030f',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const ambientStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at 50% 50%, rgba(120,40,200,0.25), transparent 60%), radial-gradient(circle at 20% 50%, rgba(255,0,80,0.15), transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,150,255,0.15), transparent 50%)',
    zIndex: 0,
  };

  const pixelGridStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(120,80,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120,80,255,0.06) 1px, transparent 1px)',
    backgroundSize: '38px 38px',
    opacity: gridOpacity,
    zIndex: 1,
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 5,
    width: 1000,
    height: 360,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#eaf6ff',
    textShadow: '0 0 10px #00eaff, 0 0 18px #ff00d4',
    pointerEvents: 'none',
  };

  const rectLeftStyle: React.CSSProperties = {
    width: 360,
    height: 220,
    left: 60,
    position: 'absolute',
    borderRadius: 6,
    border: '3px solid transparent',
    background:
      'linear-gradient(rgba(8,5,20,0.55), rgba(8,5,20,0.55)) padding-box, linear-gradient(160deg, #00b3ff 0%, #6a00ff 45%, #ff1f5a 100%) border-box',
    boxShadow:
      '0 0 12px #00b3ff, 0 0 30px rgba(255,31,90,0.6), inset 0 0 25px rgba(0,150,255,0.25)',
    backdropFilter: 'blur(2px)',
    filter: `brightness(${glowBrightness}) saturate(${glowSaturate})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const rectRightStyle: React.CSSProperties = {
    width: 360,
    height: 220,
    right: 60,
    position: 'absolute',
    borderRadius: 6,
    border: '3px solid transparent',
    background:
      'linear-gradient(rgba(8,5,20,0.55), rgba(8,5,20,0.55)) padding-box, linear-gradient(20deg, #00b3ff 0%, #6a00ff 50%, #ff1f5a 100%) border-box',
    boxShadow:
      '0 0 12px #ff1f5a, 0 0 30px rgba(0,150,255,0.6), inset 0 0 25px rgba(120,0,255,0.25)',
    backdropFilter: 'blur(2px)',
    filter: `brightness(${rightGlowBrightness}) saturate(${rightGlowSaturate})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const circleStyle: React.CSSProperties = {
    width: 200,
    height: 200,
    position: 'absolute',
    borderRadius: '50%',
    border: '3px solid transparent',
    background:
      'radial-gradient(circle, rgba(10,5,25,0.7), rgba(8,5,20,0.55)) padding-box, conic-gradient(#ff1f5a, #6a00ff, #00b3ff, #00ffd5, #ff1f5a) border-box',
    boxShadow:
      '0 0 18px #8a2be2, 0 0 40px rgba(0,200,255,0.5), inset 0 0 25px rgba(150,0,255,0.3)',
    zIndex: 10,
    backdropFilter: 'blur(2px)',
    transform: `rotate(${circleRotation}deg)`,
    filter: `brightness(${glowBrightness}) saturate(${glowSaturate})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const titleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 50,
    width: '100%',
    textAlign: 'center',
    zIndex: 5,
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 5,
    textTransform: 'uppercase',
    textShadow: '0 0 12px #00eaff, 0 0 24px #ff00e6',
    filter: `brightness(${titleBrightness}) saturate(${titleSaturate})`,
  };

  return (
    <div style={mainWrapperStyle}>
      {/* Background layer */}
      <div style={ambientStyle} />

      {/* Grid layer */}
      <div style={pixelGridStyle} />

      {/* Frame-locked dynamic streaks & dots */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 2 }}>
        {solidStreaks.map((streak, idx) => {
          const progress = ((frame + streak.offset) % streak.duration) / streak.duration;
          const translateX = interpolate(progress, [0, 1], [-450, ORIGINAL_WIDTH + 450]);
          return (
            <div
              key={`solid-${idx}`}
              style={{
                position: 'absolute',
                borderRadius: 6,
                filter: 'blur(0.6px)',
                height: streak.thick,
                width: streak.width,
                top: streak.top,
                background: `linear-gradient(90deg, transparent, ${streak.color}, transparent)`,
                boxShadow: `0 0 ${streak.thick * 2}px ${streak.color}`,
                opacity: streak.opacity,
                transform: `translateX(${translateX}px)`,
              }}
            />
          );
        })}

        {dotLines.map((dotLine, idx) => {
          const progress = ((frame + dotLine.offset) % dotLine.duration) / dotLine.duration;
          const translateX = interpolate(progress, [0, 1], [-450, ORIGINAL_WIDTH + 450]);
          return (
            <div
              key={`dotline-${idx}`}
              style={{
                position: 'absolute',
                height: dotLine.size,
                width: dotLine.width,
                top: dotLine.top,
                backgroundImage: `radial-gradient(circle, ${dotLine.color} 0 ${dotLine.size / 2}px, transparent ${dotLine.size / 2 + 0.5}px)`,
                backgroundSize: `${dotLine.gap}px ${dotLine.size}px`,
                backgroundRepeat: 'repeat-x',
                filter: `drop-shadow(0 0 ${dotLine.size * 2}px ${dotLine.color})`,
                opacity: dotLine.opacity,
                transform: `translateX(${translateX}px)`,
              }}
            />
          );
        })}

        {glowDots.map((dot, idx) => {
          const progress = ((frame + dot.offset) % dot.duration) / dot.duration;
          const translateX = interpolate(progress, [0, 1], [-450, ORIGINAL_WIDTH + 450]);
          return (
            <div
              key={`dot-${idx}`}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                width: dot.size,
                height: dot.size,
                top: dot.top,
                left: dot.left,
                background: dot.color,
                boxShadow: `0 0 ${dot.size * 3}px ${dot.color}`,
                opacity: dot.opacity,
                transform: `translateX(${translateX}px)`,
              }}
            />
          );
        })}
      </div>

      {/* Main Title */}
      <h1 style={titleStyle}>Digital Neon Flow</h1>

      {/* Centerpiece Frames */}
      <div style={containerStyle}>
        {/* Left Rect Frame */}
        <div style={rectLeftStyle}>
          <span style={labelStyle}>CONTENT 01</span>
        </div>

        {/* Center Circular Frame */}
        <div style={circleStyle}>
          <span
            style={{
              ...labelStyle,
              transform: `rotate(${-circleRotation}deg)`,
            }}
          >
            CTA
          </span>
        </div>

        {/* Right Rect Frame */}
        <div style={rectRightStyle}>
          <span style={labelStyle}>CONTENT 02</span>
        </div>
      </div>
    </div>
  );
};

export default NeonGlowFrames;
// END_OF_FILE