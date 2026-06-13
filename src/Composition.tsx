import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const COLORS = ['#00b3ff', '#ff1f5a', '#8a2be2', '#00ffd5', '#ff00e6', '#5d8bff', '#ff7a00'];

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

function pickColor(seed: number): string {
  return COLORS[Math.floor(seededRandom(seed) * COLORS.length)];
}

function rndSeed(a: number, b: number, seed: number): number {
  return a + seededRandom(seed) * (b - a);
}

interface StreakData {
  type: 'streak';
  color: string;
  thick: number;
  width: number;
  top: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface DotlineData {
  type: 'dotline';
  color: string;
  size: number;
  gap: number;
  width: number;
  top: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface GlowDotData {
  type: 'glowdot';
  color: string;
  size: number;
  top: number;
  left: number;
  opacity: number;
  duration: number;
  delay: number;
}

type ParticleData = StreakData | DotlineData | GlowDotData;

const PARTICLES: ParticleData[] = [];

let seedOffset = 0;

for (let i = 0; i < 45; i++) {
  const color = pickColor(seedOffset++);
  const thick = rndSeed(2, 9, seedOffset++);
  const width = rndSeed(80, 420, seedOffset++);
  const top = rndSeed(0, 100, seedOffset++);
  const opacity = rndSeed(0.35, 0.9, seedOffset++);
  const duration = rndSeed(1, 3.5, seedOffset++);
  const delay = rndSeed(0, 5, seedOffset++);
  PARTICLES.push({ type: 'streak', color, thick, width, top, opacity, duration, delay });
}

for (let i = 0; i < 22; i++) {
  const color = pickColor(seedOffset++);
  const size = rndSeed(2, 5, seedOffset++);
  const gap = rndSeed(8, 18, seedOffset++);
  const width = rndSeed(120, 380, seedOffset++);
  const top = rndSeed(0, 100, seedOffset++);
  const opacity = rndSeed(0.5, 1, seedOffset++);
  const duration = rndSeed(1.2, 3.8, seedOffset++);
  const delay = rndSeed(0, 5, seedOffset++);
  PARTICLES.push({ type: 'dotline', color, size, gap, width, top, opacity, duration, delay });
}

for (let i = 0; i < 40; i++) {
  const color = pickColor(seedOffset++);
  const size = rndSeed(2, 6, seedOffset++);
  const top = rndSeed(0, 100, seedOffset++);
  const left = rndSeed(0, 100, seedOffset++);
  const opacity = rndSeed(0.4, 1, seedOffset++);
  const duration = rndSeed(2, 6, seedOffset++);
  const delay = rndSeed(0, 6, seedOffset++);
  PARTICLES.push({ type: 'glowdot', color, size, top, left, opacity, duration, delay });
}

const NeonGlowFrames: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const totalFrames = 900;
  const localFrame = frame % totalFrames;

  // gridPulse: 4s cycle, ease-in-out
  const gridCycleFrames = fps * 4;
  const gridLocalFrame = localFrame % gridCycleFrames;
  const gridOpacity = interpolate(
    gridLocalFrame,
    [0, gridCycleFrames * 0.5, gridCycleFrames],
    [0.25, 0.6, 0.25],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // glowPulse for rect-left: 2.4s cycle, no delay
  const glowCycleFrames = fps * 2.4;
  const glowLocalFrameLeft = localFrame % glowCycleFrames;
  const glowBrightnessLeft = interpolate(
    glowLocalFrameLeft,
    [0, glowCycleFrames * 0.5, glowCycleFrames],
    [1, 1.8, 1],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const glowSaturateLeft = interpolate(
    glowLocalFrameLeft,
    [0, glowCycleFrames * 0.5, glowCycleFrames],
    [1.2, 1.6, 1.2],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // glowPulse for rect-right: 2.4s cycle, delay -1.2s => offset by half cycle
  const glowOffsetFrames = fps * 1.2;
  const glowLocalFrameRight = (localFrame + glowOffsetFrames) % glowCycleFrames;
  const glowBrightnessRight = interpolate(
    glowLocalFrameRight,
    [0, glowCycleFrames * 0.5, glowCycleFrames],
    [1, 1.8, 1],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const glowSaturateRight = interpolate(
    glowLocalFrameRight,
    [0, glowCycleFrames * 0.5, glowCycleFrames],
    [1.2, 1.6, 1.2],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // glowPulse for circle: 2.4s cycle, no delay
  const glowBrightnessCircle = glowBrightnessLeft;
  const glowSaturateCircle = glowSaturateLeft;

  // glowPulse for title: 3s cycle
  const titleCycleFrames = fps * 3;
  const titleLocalFrame = localFrame % titleCycleFrames;
  const titleBrightness = interpolate(
    titleLocalFrame,
    [0, titleCycleFrames * 0.5, titleCycleFrames],
    [1, 1.8, 1],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const titleSaturate = interpolate(
    titleLocalFrame,
    [0, titleCycleFrames * 0.5, titleCycleFrames],
    [1.2, 1.6, 1.2],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // spinGlow for circle: 6s cycle, full 360deg
  const spinCycleFrames = fps * 6;
  const spinLocalFrame = localFrame % spinCycleFrames;
  const spinDeg = interpolate(
    spinLocalFrame,
    [0, spinCycleFrames],
    [0, 360],
    { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // counter-spin for circle label
  const spinDegReverse = -spinDeg;

  // streak translation: each particle moves from -450px to 1920*1.25px = 2400px over its duration
  // We compute position deterministically per frame
  const streakTravelDistance = ORIGINAL_WIDTH * 1.25 + 450;

  return (
    <div
      style={{
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        background: '#05030f',
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* Ambient radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 50%, rgba(120,40,200,0.25), transparent 60%), radial-gradient(circle at 20% 50%, rgba(255,0,80,0.15), transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,150,255,0.15), transparent 50%)',
          zIndex: 0,
        }}
      />

      {/* Pixel grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(120,80,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120,80,255,0.06) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
          opacity: gridOpacity,
          zIndex: 1,
        }}
      />

      {/* Streaks layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        {PARTICLES.map((p, idx) => {
          // Compute position: from -450 to streakTravelDistance, looping
          const durationFrames = p.duration * fps;
          // offset by delay (negative delay = start partway through)
          const delayFrames = p.delay * fps;
          const cycleFrame = (localFrame + delayFrames) % durationFrames;
          const progress = cycleFrame / durationFrames;
          const translateX = -450 + progress * streakTravelDistance;

          if (p.type === 'streak') {
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  borderRadius: '6px',
                  filter: 'blur(0.6px)',
                  height: p.thick,
                  width: p.width,
                  top: `${p.top}%`,
                  background: `linear-gradient(90deg, transparent, ${p.color}, transparent)`,
                  boxShadow: `0 0 ${p.thick * 2}px ${p.color}`,
                  opacity: p.opacity,
                  transform: `translateX(${translateX}px)`,
                }}
              />
            );
          } else if (p.type === 'dotline') {
            const dl = p as DotlineData;
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  height: dl.size,
                  width: dl.width,
                  top: `${dl.top}%`,
                  backgroundImage: `radial-gradient(circle, ${dl.color} 0 ${dl.size / 2}px, transparent ${dl.size / 2 + 0.5}px)`,
                  backgroundSize: `${dl.gap}px ${dl.size}px`,
                  backgroundRepeat: 'repeat-x',
                  filter: `drop-shadow(0 0 ${dl.size * 2}px ${dl.color})`,
                  opacity: dl.opacity,
                  transform: `translateX(${translateX}px)`,
                }}
              />
            );
          } else {
            const gd = p as GlowDotData;
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  width: gd.size,
                  height: gd.size,
                  top: `${gd.top}%`,
                  left: `${gd.left}%`,
                  background: gd.color,
                  boxShadow: `0 0 ${gd.size * 3}px ${gd.color}`,
                  opacity: gd.opacity,
                  transform: `translateX(${translateX}px)`,
                }}
              />
            );
          }
        })}
      </div>

      {/* Title */}
      <h1
        style={{
          position: 'absolute',
          top: 28,
          width: '100%',
          textAlign: 'center',
          zIndex: 5,
          color: '#fff',
          fontSize: 20,
          letterSpacing: 5,
          textTransform: 'uppercase',
          textShadow: '0 0 12px #00eaff, 0 0 24px #ff00e6',
          margin: 0,
          padding: 0,
          filter: `brightness(${titleBrightness}) saturate(${titleSaturate})`,
        }}
      >
        Digital Neon Flow
      </h1>

      {/* Container */}
      <div
        style={{
          position: 'absolute',
          zIndex: 5,
          width: 1000,
          height: 360,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* rect-left */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 220,
            left: 60,
            borderRadius: 6,
            border: '3px solid transparent',
            background:
              'linear-gradient(rgba(8,5,20,0.55), rgba(8,5,20,0.55)) padding-box, linear-gradient(160deg, #00b3ff 0%, #6a00ff 45%, #ff1f5a 100%) border-box',
            boxShadow: '0 0 12px #00b3ff, 0 0 30px rgba(255,31,90,0.6), inset 0 0 25px rgba(0,150,255,0.25)',
            filter: `brightness(${glowBrightnessLeft}) saturate(${glowSaturateLeft})`,
          }}
        >
          <span
            style={{
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
            }}
          >
            CONTENT 01
          </span>
        </div>

        {/* circle */}
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            border: '3px solid transparent',
            background:
              'radial-gradient(circle, rgba(10,5,25,0.7), rgba(8,5,20,0.55)) padding-box, conic-gradient(#ff1f5a, #6a00ff, #00b3ff, #00ffd5, #ff1f5a) border-box',
            boxShadow: '0 0 18px #8a2be2, 0 0 40px rgba(0,200,255,0.5), inset 0 0 25px rgba(150,0,255,0.3)',
            zIndex: 10,
            transform: `rotate(${spinDeg}deg)`,
            filter: `brightness(${glowBrightnessCircle}) saturate(${glowSaturateCircle})`,
          }}
        >
          <span
            style={{
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
              transform: `rotate(${spinDegReverse}deg)`,
            }}
          >
            CTA
          </span>
        </div>

        {/* rect-right */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 220,
            right: 60,
            borderRadius: 6,
            border: '3px solid transparent',
            background:
              'linear-gradient(rgba(8,5,20,0.55), rgba(8,5,20,0.55)) padding-box, linear-gradient(20deg, #00b3ff 0%, #6a00ff 50%, #ff1f5a 100%) border-box',
            boxShadow: '0 0 12px #ff1f5a, 0 0 30px rgba(0,150,255,0.6), inset 0 0 25px rgba(120,0,255,0.25)',
            filter: `brightness(${glowBrightnessRight}) saturate(${glowSaturateRight})`,
          }}
        >
          <span
            style={{
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
            }}
          >
            CONTENT 02
          </span>
        </div>
      </div>
    </div>
  );
};

export default NeonGlowFrames;
// END_OF_FILE