import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React from 'react';

const GOLD_1 = '#d4af37';
const GOLD_2 = '#f9e08c';
const GOLD_3 = '#b8860b';
const GOLD_4 = '#fff3c4';
const BG_1 = '#8a7a2e';
const BG_2 = '#6f6322';

// Static configs to avoid Math.random() in render and ensure seamless loops
const BLOB_CONFIGS = [
  { size: 280, top: 150, left: 100, driftDx: 1.2, driftDy: 0.8, morphSeed: 0 },
  { size: 180, top: 600, left: 1400, driftDx: -0.9, driftDy: 1.1, morphSeed: 1 },
  { size: 320, top: 800, left: 300, driftDx: 0.7, driftDy: -1.2, morphSeed: 2 },
  { size: 220, top: 100, left: 1200, driftDx: -1.1, driftDy: -0.7, morphSeed: 3 },
  { size: 150, top: 400, left: 800, driftDx: 0.5, driftDy: 0.5, morphSeed: 4 },
  { size: 260, top: 750, left: 950, driftDx: -0.6, driftDy: 0.9, morphSeed: 5 },
  { size: 200, top: 300, left: 200, driftDx: 1.0, driftDy: -0.5, morphSeed: 6 },
];

const CONFETTI_CONFIGS = [
  { size: 22, x: 200, y: 150, spinDirection: 1, wanderScale: 1.2 },
  { size: 16, x: 1600, y: 250, spinDirection: -1, wanderScale: 0.8 },
  { size: 24, x: 400, y: 850, spinDirection: 1, wanderScale: 1.5 },
  { size: 14, x: 1300, y: 750, spinDirection: -1, wanderScale: 1.0 },
  { size: 18, x: 850, y: 180, spinDirection: 1, wanderScale: 0.9 },
  { size: 26, x: 1100, y: 900, spinDirection: -1, wanderScale: 1.3 },
  { size: 15, x: 100, y: 600, spinDirection: 1, wanderScale: 0.7 },
  { size: 20, x: 1750, y: 550, spinDirection: -1, wanderScale: 1.1 },
  { size: 25, x: 700, y: 800, spinDirection: 1, wanderScale: 1.4 },
  { size: 12, x: 950, y: 450, spinDirection: -1, wanderScale: 0.6 },
  { size: 19, x: 1500, y: 850, spinDirection: 1, wanderScale: 1.0 },
  { size: 21, x: 300, y: 400, spinDirection: -1, wanderScale: 1.1 },
];

const DOT_DELAYS = [
  0.1, 0.4, 0.8, 1.2, 1.5, 0.3, 0.7, 1.1, 1.6, 1.9,
  0.2, 0.5, 0.9, 1.3, 1.7, 0.6, 1.0, 1.4, 1.8, 0.1,
  0.3, 0.7, 1.1, 1.5, 1.8, 0.2, 0.6, 1.0, 1.4, 1.7,
  0.4, 0.8, 1.2, 1.6, 1.9, 0.5, 0.9, 1.3, 1.7, 0.1,
  0.2, 0.6, 1.0, 1.4, 1.8, 0.3, 0.7, 1.1, 1.5, 1.9,
];

// Helper functions for deterministic animations
const getBlobDrift = (frame: number, config: { driftDx: number; driftDy: number }) => {
  const cycle = 1200; // Loops every 20 seconds
  const progress = (frame % cycle) / cycle;

  const tx = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, 120 * config.driftDx, -90 * config.driftDx, 70 * config.driftDx, 0], { easing: Easing.inOut(Easing.quad) });
  const ty = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, -80 * config.driftDy, 60 * config.driftDy, 110 * config.driftDy, 0], { easing: Easing.inOut(Easing.quad) });
  const rot = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, 15 * config.driftDx, -10 * config.driftDx, 8 * config.driftDx, 0], { easing: Easing.inOut(Easing.quad) });

  return { tx, ty, rot };
};

const getBlobMorph = (frame: number, seed: number) => {
  const cycle = 300; // Loops every 5 seconds
  const progress = ((frame + seed * 45) % cycle) / cycle;

  const r1 = interpolate(progress, [0, 0.5, 1], [46, 60, 46], { easing: Easing.inOut(Easing.quad) });
  const r2 = interpolate(progress, [0, 0.5, 1], [54, 40, 54], { easing: Easing.inOut(Easing.quad) });
  const r3 = interpolate(progress, [0, 0.5, 1], [60, 45, 60], { easing: Easing.inOut(Easing.quad) });
  const r4 = interpolate(progress, [0, 0.5, 1], [40, 55, 40], { easing: Easing.inOut(Easing.quad) });

  const r5 = interpolate(progress, [0, 0.5, 1], [50, 45, 50], { easing: Easing.inOut(Easing.quad) });
  const r6 = interpolate(progress, [0, 0.5, 1], [45, 60, 45], { easing: Easing.inOut(Easing.quad) });
  const r7 = interpolate(progress, [0, 0.5, 1], [55, 40, 55], { easing: Easing.inOut(Easing.quad) });
  const r8 = interpolate(progress, [0, 0.5, 1], [50, 55, 50], { easing: Easing.inOut(Easing.quad) });

  return `${r1}% ${r2}% ${r3}% ${r4}% / ${r5}% ${r6}% ${r7}% ${r8}%`;
};

const getConfettiSpin = (frame: number, direction: number) => {
  const cycle = 240; // 4 seconds
  const progress = (frame % cycle) / cycle;
  return progress * 360 * direction;
};

const getConfettiWander = (frame: number, config: { x: number; y: number; wanderScale: number }) => {
  const cycle = 1200; // 20 seconds
  const progress = (frame % cycle) / cycle;
  const scale = config.wanderScale;

  const dx = interpolate(
    progress,
    [0, 0.25, 0.5, 0.75, 1],
    [0, 345.6 * scale, -268.8 * scale, 192 * scale, 0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const dy = interpolate(
    progress,
    [0, 0.25, 0.5, 0.75, 1],
    [0, -129.6 * scale, 172.8 * scale, 86.4 * scale, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  return { x: config.x + dx, y: config.y + dy };
};

const getMatrixDrift = (frame: number) => {
  const cycle = 600; // 10 seconds
  const progress = (frame % cycle) / cycle;
  const tx = interpolate(progress, [0, 0.33, 0.66, 1], [0, 40, -30, 0], { easing: Easing.inOut(Easing.quad) });
  const ty = interpolate(progress, [0, 0.33, 0.66, 1], [0, 30, 20, 0], { easing: Easing.inOut(Easing.quad) });
  return { tx, ty };
};

const getDotBlink = (frame: number, delaySeconds: number) => {
  const cycle = 150; // 2.5 seconds
  const delayFrames = Math.round(delaySeconds * 60);
  const progress = ((frame + delayFrames) % cycle) / cycle;

  const opacity = interpolate(progress, [0, 0.5, 1], [0.25, 1, 0.25], { easing: Easing.inOut(Easing.quad) });
  const scale = interpolate(progress, [0, 0.5, 1], [0.7, 1.2, 0.7], { easing: Easing.inOut(Easing.quad) });
  return { opacity, scale };
};

const getDriftLeft = (frame: number) => {
  const cycle = 600; // 10 seconds
  const progress = (frame % cycle) / cycle;
  const tx = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, -30, 20, -15, 0], { easing: Easing.inOut(Easing.quad) });
  const ty = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, -25, 15, 30, 0], { easing: Easing.inOut(Easing.quad) });
  const rot = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, -3, 2, -2, 0], { easing: Easing.inOut(Easing.quad) });
  return { tx, ty, rot };
};

const getDriftRight = (frame: number) => {
  const cycle = 600; // 10 seconds
  const progress = (frame % cycle) / cycle;
  const tx = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, 30, -20, 15, 0], { easing: Easing.inOut(Easing.quad) });
  const ty = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, 20, -25, -15, 0], { easing: Easing.inOut(Easing.quad) });
  const rot = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, 3, -2, 2, 0], { easing: Easing.inOut(Easing.quad) });
  return { tx, ty, rot };
};

const getGoldShimmer = (frame: number, offsetFrames: number = 0) => {
  const cycle = 240; // 4 seconds
  const progress = ((frame + offsetFrames + cycle * 10) % cycle) / cycle;
  const brightness = interpolate(progress, [0, 0.5, 1], [1, 1.35, 1], { easing: Easing.inOut(Easing.quad) });
  const saturate = interpolate(progress, [0, 0.5, 1], [1.1, 1.4, 1.1], { easing: Easing.inOut(Easing.quad) });
  return `brightness(${brightness}) saturate(${saturate})`;
};

const getShineTransform = (frame: number, offsetFrames: number = 0) => {
  const cycle = 210; // 3.5 seconds
  const progress = ((frame + offsetFrames + cycle * 10) % cycle) / cycle;
  const tx = interpolate(progress, [0, 0.6, 1], [-120, -120, 120], { easing: Easing.inOut(Easing.quad) });
  return `translateX(${tx}%)`;
};

const getDriftCenter = (frame: number) => {
  const cycleFrames = 600;
  const progress = (frame % cycleFrames) / cycleFrames;
  const tx = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, 40, 0, -40, 0], { easing: Easing.inOut(Easing.quad) });
  const ty = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, -30, 40, -20, 0], { easing: Easing.inOut(Easing.quad) });
  const rot = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, 90, 180, 270, 360], { easing: Easing.inOut(Easing.quad) });
  return { tx, ty, rot };
};

const getCounterSpin = (frame: number) => {
  const cycle = 600;
  const progress = (frame % cycle) / cycle;
  const rot = interpolate(progress, [0, 0.25, 0.5, 0.75, 1], [0, -90, -180, -270, -360], { easing: Easing.inOut(Easing.quad) });
  return rot;
};

const getSpinSlow = (frame: number) => {
  const cycleFrames = 600;
  const progress = (frame % cycleFrames) / cycleFrames;
  return progress * -360;
};

const getTitleSway = (frame: number) => {
  const cycle = 600; // 10 seconds
  const progress = (frame % cycle) / cycle;
  const tx = interpolate(progress, [0, 0.5, 1], [0, 25, 0], { easing: Easing.inOut(Easing.quad) });
  const ty = interpolate(progress, [0, 0.5, 1], [0, 10, 0], { easing: Easing.inOut(Easing.quad) });
  return { tx, ty };
};

const getGlitchTop = (frame: number) => {
  const cycle = 120; // 2 seconds
  const progress = (frame % cycle) / cycle;

  const clipTop = interpolate(progress, [0, 0.4, 0.8, 1], [0, 40, 0, 30], { easing: Easing.linear });
  const clipBottom = interpolate(progress, [0, 0.4, 0.8, 1], [60, 20, 70, 30], { easing: Easing.linear });
  const tx = interpolate(progress, [0, 0.4, 0.8, 1], [0, 3, 2, 0], { easing: Easing.linear });
  const ty = interpolate(progress, [0, 0.4, 0.8, 1], [0, 1, -1, 1], { easing: Easing.linear });

  return {
    clipPath: `inset(${clipTop}% 0% ${clipBottom}% 0%)`,
    transform: `translate(${tx}px, ${ty}px)`,
  };
};

const getGlitchBot = (frame: number) => {
  const cycle = 60; // 1 second
  const progress = (frame % cycle) / cycle;

  const clipTop = interpolate(progress, [0, 0.4, 0.8, 1], [60, 70, 45, 65], { easing: Easing.linear });
  const clipBottom = interpolate(progress, [0, 0.4, 0.8, 1], [0, 0, 25, 5], { easing: Easing.linear });
  const tx = interpolate(progress, [0, 0.4, 0.8, 1], [0, -3, -2, 0], { easing: Easing.linear });
  const ty = interpolate(progress, [0, 0.4, 0.8, 1], [0, -1, 1, -1], { easing: Easing.linear });

  return {
    clipPath: `inset(${clipTop}% 0% ${clipBottom}% 0%)`,
    transform: `translate(${tx}px, ${ty}px)`,
  };
};

export const GoldEndScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const ORIGINAL_WIDTH = 1920;
  const ORIGINAL_HEIGHT = 1080;
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Compute animations for this frame
  const matrixDrift = getMatrixDrift(frame);
  const leftDrift = getDriftLeft(frame);
  const rightDrift = getDriftRight(frame);
  const circleDrift = getDriftCenter(frame);
  const circleCounterSpin = getCounterSpin(frame);
  const circleSpinSlow = getSpinSlow(frame);
  const titleSway = getTitleSway(frame);
  const glitchTop = getGlitchTop(frame);
  const glitchBot = getGlitchBot(frame);

  // Shimmer and shine calculations
  const leftShimmer = getGoldShimmer(frame, 0);
  const leftShine = getShineTransform(frame, 0);
  const rightShimmer = getGoldShimmer(frame, -90); // Translate -1.5 seconds delay to frames
  const rightShine = getShineTransform(frame, -30); // staggered shine
  const circleShine = getShineTransform(frame, -60); // staggered circle shine

  const watermarkDrift = getBlobDrift(frame, { driftDx: 0.8, driftDy: 0.6 });

  // Styles defined inside for dynamic binding
  const wrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    background: `radial-gradient(circle at 50% 40%, ${BG_1}, ${BG_2} 80%)`,
    fontFamily: "'Arial Black', 'Segoe UI', sans-serif",
  };

  const leftFrameStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 6,
    transform: `translate(${leftDrift.tx}px, ${leftDrift.ty}px) rotate(${leftDrift.rot}deg)`,
    marginRight: 60,
  };

  const rightFrameStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 6,
    transform: `translate(${rightDrift.tx}px, ${rightDrift.ty}px) rotate(${rightDrift.rot}deg)`,
    marginLeft: 60,
  };

  return (
    <div style={wrapperStyle}>
      {/* ===== Background Blobs ===== */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
        {BLOB_CONFIGS.map((config: any, index: number) => {
          const drift = getBlobDrift(frame, config);
          const morph = getBlobMorph(frame, config.morphSeed);
          return (
            <div
              key={`blob-${index}`}
              style={{
                position: 'absolute',
                background: 'linear-gradient(135deg, rgba(255,243,196,0.55), rgba(184,134,11,0.25))',
                borderRadius: morph,
                filter: 'blur(2px)',
                opacity: 0.6,
                width: config.size,
                height: config.size,
                top: config.top,
                left: config.left,
                transform: `translate(${drift.tx}px, ${drift.ty}px) rotate(${drift.rot}deg)`,
              }}
            />
          );
        })}
      </div>

      {/* ===== Watermark Background Label ===== */}
      <div
        style={{
          position: 'absolute',
          zIndex: 3,
          fontSize: 120,
          fontWeight: 900,
          color: 'rgba(255,255,255,0.07)',
          letterSpacing: 6,
          pointerEvents: 'none',
          top: '35%',
          left: '25%',
          transform: `translate(${watermarkDrift.tx}px, ${watermarkDrift.ty}px) rotate(${watermarkDrift.rot}deg)`,
          textTransform: 'uppercase',
        }}
      >
        preview
      </div>

      {/* ===== Confetti elements ===== */}
      {CONFETTI_CONFIGS.map((config: any, index: number) => {
        const wander = getConfettiWander(frame, config);
        const spin = getConfettiSpin(frame, config.spinDirection);
        return (
          <div
            key={`confetti-${index}`}
            style={{
              position: 'absolute',
              width: config.size,
              height: config.size,
              background: `linear-gradient(135deg, ${GOLD_4}, ${GOLD_1})`,
              boxShadow: '0 0 10px rgba(255,243,196,0.6)',
              zIndex: 4,
              left: wander.x,
              top: wander.y,
              transform: `rotate(${spin}deg)`,
            }}
          />
        );
      })}

      {/* ===== Dot Matrix Panel ===== */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 180,
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 18px)',
          gridTemplateRows: 'repeat(5, 18px)',
          gap: 8,
          zIndex: 6,
          transform: `translate(${matrixDrift.tx}px, ${matrixDrift.ty}px)`,
        }}
      >
        {DOT_DELAYS.map((delay: number, index: number) => {
          const blink = getDotBlink(frame, delay);
          return (
            <span
              key={`dot-${index}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: GOLD_4,
                boxShadow: `0 0 6px ${GOLD_2}`,
                opacity: blink.opacity,
                transform: `scale(${blink.scale})`,
              }}
            />
          );
        })}
      </div>

      {/* ===== Head Title with RGB Glitch ===== */}
      <h1
        style={{
          position: 'absolute',
          top: 110,
          width: '100%',
          textAlign: 'center',
          zIndex: 7,
          fontSize: 64,
          fontWeight: 900,
          color: GOLD_4,
          textShadow: `0 0 15px ${GOLD_1}, 0 5px 10px rgba(0,0,0,0.5)`,
          transform: `translate(${titleSway.tx}px, ${titleSway.ty}px)`,
        }}
      >
        SUBSCRIBE{' '}
        <span
          style={{
            position: 'relative',
            display: 'inline-block',
            marginLeft: 15,
          }}
        >
          FOR MORE INFO
          {/* Glitch Overlay Top */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              color: '#00eaff',
              overflow: 'hidden',
              clipPath: glitchTop.clipPath,
              transform: glitchTop.transform,
            }}
            aria-hidden="true"
          >
            FOR MORE INFO
          </span>
          {/* Glitch Overlay Bottom */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              color: '#ff00d4',
              overflow: 'hidden',
              clipPath: glitchBot.clipPath,
              transform: glitchBot.transform,
            }}
            aria-hidden="true"
          >
            FOR MORE INFO
          </span>
        </span>
      </h1>

      {/* ===== Main Video Grid Container ===== */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1500,
          height: 500,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 5,
        }}
      >
        {/* Left Video Rect */}
        <div style={leftFrameStyle}>
          <div
            style={{
              width: 360,
              height: 215,
              borderRadius: 8,
              padding: 10,
              background: `linear-gradient(135deg, ${GOLD_2}, ${GOLD_3} 40%, ${GOLD_4} 60%, ${GOLD_1})`,
              boxShadow: `0 0 25px rgba(212,175,55,0.7), 0 15px 40px rgba(0,0,0,0.35)`,
              filter: leftShimmer,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#fff',
                borderRadius: 4,
                boxShadow: 'inset 0 0 25px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.95) 50%, transparent 70%)',
                  transform: leftShine,
                }}
              />
            </div>
          </div>
        </div>

        {/* Center Circular Video */}
        <div
          style={{
            position: 'relative',
            width: 310,
            height: 310,
            borderRadius: '50%',
            padding: 20,
            background: `conic-gradient(${GOLD_2}, ${GOLD_3}, ${GOLD_4}, ${GOLD_1}, ${GOLD_2})`,
            boxShadow: `0 0 35px rgba(212,175,55,0.8), 0 15px 45px rgba(0,0,0,0.4)`,
            zIndex: 10,
            transform: `translate(${circleDrift.tx}px, ${circleDrift.ty}px) rotate(${circleDrift.rot}deg)`,
          }}
        >
          {/* Inner static counter-rotating screen */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#fff',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden',
              transform: `rotate(${circleCounterSpin}deg)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.95) 50%, transparent 65%)',
                transform: circleShine,
              }}
            />
          </div>

          {/* Outer Rotating Dashed Ring */}
          <div
            style={{
              position: 'absolute',
              inset: -22,
              borderRadius: '50%',
              border: `3px dashed rgba(255,243,196,0.6)`,
              transform: `rotate(${circleSpinSlow}deg)`,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Right Video Rect */}
        <div style={rightFrameStyle}>
          <div
            style={{
              width: 360,
              height: 215,
              borderRadius: 8,
              padding: 10,
              background: `linear-gradient(135deg, ${GOLD_2}, ${GOLD_3} 40%, ${GOLD_4} 60%, ${GOLD_1})`,
              boxShadow: `0 0 25px rgba(212,175,55,0.7), 0 15px 40px rgba(0,0,0,0.35)`,
              filter: rightShimmer,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#fff',
                borderRadius: 4,
                boxShadow: 'inset 0 0 25px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.95) 50%, transparent 70%)',
                  transform: rightShine,
                }}
              />
            </div>
          </div>
        </div>

        {/* Floating Labels beneath elements */}
        <span
          style={{
            position: 'absolute',
            bottom: 30,
            left: 110,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 2,
            color: GOLD_4,
            textShadow: `0 0 8px ${GOLD_1}, 0 2px 4px rgba(0,0,0,0.5)`,
            zIndex: 8,
            whiteSpace: 'nowrap',
            transform: `translate(${leftDrift.tx}px, ${leftDrift.ty}px) rotate(${leftDrift.rot}deg)`,
          }}
        >
          WATCH NEXT
        </span>

        <span
          style={{
            position: 'absolute',
            bottom: 30,
            right: 110,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: 2,
            color: GOLD_4,
            textShadow: `0 0 8px ${GOLD_1}, 0 2px 4px rgba(0,0,0,0.5)`,
            zIndex: 8,
            whiteSpace: 'nowrap',
            transform: `translate(${rightDrift.tx}px, ${rightDrift.ty}px) rotate(${rightDrift.rot}deg)`,
          }}
        >
          RECOMMENDED
        </span>
      </div>
    </div>
  );
};

export default GoldEndScreen;