import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

// Seed-based Pseudo-Random Number Generator for strict determinism
function createSeededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const rng = createSeededRandom("neon_cyberpunk_seed_payload_v1");

const COLORS = ['#00b3ff', '#ff1f5a', '#8a2be2', '#00ffd5', '#ff00e6', '#5d8bff', '#ff7a00', '#39ff14'];

// Pre-calculate randomized elements outside render
const STREAKS = Array.from({ length: 50 }).map(() => {
  const color = COLORS[Math.floor(rng() * COLORS.length)];
  const thick = 2 + rng() * 7;
  const width = 80 + rng() * 340;
  const top = rng() * 100;
  const rev = rng() > 0.5;
  const opacity = 0.35 + rng() * 0.55;
  const duration = 1.2 + rng() * 2.3;
  const delay = rng() * 5;
  return { color, thick, width, top, rev, opacity, duration, delay };
});

const DOTLINES = Array.from({ length: 24 }).map(() => {
  const color = COLORS[Math.floor(rng() * COLORS.length)];
  const size = 2 + rng() * 3;
  const gap = 8 + rng() * 10;
  const width = 120 + rng() * 260;
  const top = rng() * 100;
  const rev = rng() > 0.5;
  const opacity = 0.5 + rng() * 0.5;
  const duration = 1.5 + rng() * 2.3;
  const delay = rng() * 5;
  return { color, size, gap, width, top, rev, opacity, duration, delay };
});

const DOTS = Array.from({ length: 45 }).map(() => {
  const color = COLORS[Math.floor(rng() * COLORS.length)];
  const size = 2 + rng() * 4;
  const top = rng() * 100;
  const left = rng() * 100;
  const opacity = 0.4 + rng() * 0.6;
  const twinkleDuration = 1.5 + rng() * 1.5;
  const twinkleDelay = rng() * 2;
  const moveDuration = 2 + rng() * 4;
  const moveDelay = rng() * 6;
  return { color, size, top, left, opacity, twinkleDuration, twinkleDelay, moveDuration, moveDelay };
});

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CyberpunkNeonFrames: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Fullscreen scale logic
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Ambient shifting radial glow (20s cycle)
  const hueRotate = interpolate(frame % (fps * 20), [0, fps * 20], [0, 360]);

  // 2. Pixel grid parallax pulse & scroll
  const gridOpacity = interpolate(
    frame % (fps * 4),
    [0, fps * 2, fps * 4],
    [0.22, 0.55, 0.22],
    { easing: Easing.inOut(Easing.quad) }
  );
  const gridScrollX = interpolate(frame % (fps * 20), [0, fps * 20], [0, 38]);
  const gridScrollY = interpolate(frame % (fps * 20), [0, fps * 20], [0, 38]);

  // 3. Scanline horizontal sweep (5s cycle)
  const scanTop = interpolate(frame % (fps * 5), [0, fps * 5], [-140, ORIGINAL_HEIGHT]);

  // 4. Main container float animation (5s cycle)
  const translateY = interpolate(
    frame % (fps * 5),
    [0, fps * 2.5, fps * 5],
    [0, -14, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  // 5. Shared Glow Pulse values (4s cycle)
  const brightness = interpolate(
    frame % (fps * 4),
    [0, fps * 2, fps * 4],
    [1, 1.8, 1],
    { easing: Easing.inOut(Easing.quad) }
  );
  const saturate = interpolate(
    frame % (fps * 4),
    [0, fps * 2, fps * 4],
    [1.2, 1.7, 1.2],
    { easing: Easing.inOut(Easing.quad) }
  );

  // 6. Border flow background positional shifting (5s cycle)
  const bgPosX = interpolate(frame % (fps * 5), [0, fps * 5], [0, 100]);
  const bgPosXRight = interpolate(frame % (fps * 5), [0, fps * 5], [100, 0]);

  // 7. Perspective rotations (5s cycle)
  const tiltAngleL = interpolate(
    frame % (fps * 5),
    [0, fps * 2.5, fps * 5],
    [6, -2, 6],
    { easing: Easing.inOut(Easing.quad) }
  );
  const tiltAngleR = interpolate(
    (frame + Math.round(1.2 * fps)) % (fps * 5),
    [0, fps * 2.5, fps * 5],
    [-6, 2, -6],
    { easing: Easing.inOut(Easing.quad) }
  );

  // 8. Circle Spin (5s cycle) and orbit elements
  const rotateDeg = interpolate(frame % (fps * 5), [0, fps * 5], [0, 360]);
  const rotateDegReverse = interpolate(frame % (fps * 10), [0, fps * 10], [0, 360]);
  const orbitRotate = interpolate(frame % (fps * 4), [0, fps * 4], [0, 360]);

  // 9. Breathe Pulse (4s cycle) for circle shadows
  const breatheProgress = interpolate(
    frame % (fps * 4),
    [0, fps * 2, fps * 4],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const shadowBlur1 = interpolate(breatheProgress, [0, 1], [18, 30]);
  const shadowBlur2 = interpolate(breatheProgress, [0, 1], [40, 70]);
  const shadowBlur3 = interpolate(breatheProgress, [0, 1], [25, 35]);
  const breatheShadowColor1 = breatheProgress > 0.5 ? '#ff00e6' : '#8a2be2';
  const breatheShadowColor2 = breatheProgress > 0.5 ? 'rgba(0,255,213,0.7)' : 'rgba(0,200,255,0.5)';
  const breatheShadowColor3 = breatheProgress > 0.5 ? 'rgba(255,0,230,0.4)' : 'rgba(150,0,255,0.3)';

  // 10. Text flicker opacity (5s cycle)
  const flickerFrame = frame % (fps * 5);
  const pct = (flickerFrame / (fps * 5)) * 100;
  let flickerOpacity = 1;
  if (pct >= 92 && pct < 93) flickerOpacity = interpolate(pct, [92, 93], [1, 0.4]);
  else if (pct >= 93 && pct < 94) flickerOpacity = interpolate(pct, [93, 94], [0.4, 1]);
  else if (pct >= 94 && pct < 96) flickerOpacity = interpolate(pct, [94, 96], [1, 0.6]);
  else if (pct >= 96 && pct < 97) flickerOpacity = interpolate(pct, [96, 97], [0.6, 1]);

  // 11. Title Glitch translation / skew calculation (5s cycle)
  const titleGlitchFrame = frame % (fps * 5);
  const glitchPct = (titleGlitchFrame / (fps * 5)) * 100;
  let glitchX = 0;
  let glitchSkew = 0;
  let useGlitchShadow = false;
  if (glitchPct >= 90 && glitchPct < 91) {
    glitchX = interpolate(glitchPct, [90, 91], [0, -3]);
    glitchSkew = interpolate(glitchPct, [90, 91], [0, 5]);
    useGlitchShadow = true;
  } else if (glitchPct >= 91 && glitchPct < 93) {
    glitchX = interpolate(glitchPct, [91, 93], [-3, 3]);
    glitchSkew = interpolate(glitchPct, [91, 93], [5, -5]);
    useGlitchShadow = true;
  } else if (glitchPct >= 93 && glitchPct < 95) {
    glitchX = interpolate(glitchPct, [93, 95], [3, 0]);
    glitchSkew = interpolate(glitchPct, [93, 95], [-5, 0]);
    useGlitchShadow = true;
  }

  const mainWrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#03020a',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  };

  return (
    <div style={mainWrapperStyle}>
      {/* Ambient background with hueRotate */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 50% 50%, rgba(120,40,200,0.28), transparent 60%),
            radial-gradient(circle at 20% 50%, rgba(255,0,80,0.18), transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(0,150,255,0.18), transparent 50%)
          `,
          zIndex: 0,
          filter: `hue-rotate(${hueRotate}deg)`,
        }}
      />

      {/* Moving pixel grid overlay */}
      <div
        style={{
          position: 'absolute',
          top: -50,
          left: -50,
          right: -50,
          bottom: -50,
          backgroundImage: `
            linear-gradient(rgba(120,80,255,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(120,80,255,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '38px 38px',
          opacity: gridOpacity,
          transform: `translate(${gridScrollX}px, ${gridScrollY}px)`,
          zIndex: 1,
        }}
      />

      {/* Sweeping scanline */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: '100%',
          height: 140,
          background: 'linear-gradient(to bottom, transparent, rgba(0,234,255,0.08), rgba(255,0,230,0.08), transparent)',
          zIndex: 3,
          pointerEvents: 'none',
          top: scanTop,
        }}
      />

      {/* Streaks & Floating Dots particles layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 2 }}>
        {STREAKS.map((s, idx) => {
          const durationFrames = s.duration * fps;
          const delayFrames = s.delay * fps;
          const progress = ((frame + delayFrames) % durationFrames) / durationFrames;
          const x = interpolate(progress, [0, 1], s.rev ? [ORIGINAL_WIDTH + 450, -450] : [-450, ORIGINAL_WIDTH + 450]);
          return (
            <div
              key={`streak-${idx}`}
              style={{
                position: 'absolute',
                borderRadius: 6,
                filter: 'blur(0.6px)',
                height: s.thick,
                width: s.width,
                top: `${s.top}%`,
                left: 0,
                transform: `translateX(${x}px)`,
                background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
                boxShadow: `0 0 ${s.thick * 2}px ${s.color}`,
                opacity: s.opacity,
              }}
            />
          );
        })}

        {DOTLINES.map((d, idx) => {
          const durationFrames = d.duration * fps;
          const delayFrames = d.delay * fps;
          const progress = ((frame + delayFrames) % durationFrames) / durationFrames;
          const x = interpolate(progress, [0, 1], d.rev ? [ORIGINAL_WIDTH + 450, -450] : [-450, ORIGINAL_WIDTH + 450]);
          return (
            <div
              key={`dotline-${idx}`}
              style={{
                position: 'absolute',
                height: d.size,
                width: d.width,
                top: `${d.top}%`,
                left: 0,
                transform: `translateX(${x}px)`,
                backgroundImage: `radial-gradient(circle, ${d.color} 0 ${d.size / 2}px, transparent ${d.size / 2 + 0.5}px)`,
                backgroundSize: `${d.gap}px ${d.size}px`,
                backgroundRepeat: 'repeat-x',
                filter: `drop-shadow(0 0 ${d.size * 2}px ${d.color})`,
                opacity: d.opacity,
              }}
            />
          );
        })}

        {DOTS.map((dot, idx) => {
          const moveDurationFrames = dot.moveDuration * fps;
          const moveDelayFrames = dot.moveDelay * fps;
          const moveProgress = ((frame + moveDelayFrames) % moveDurationFrames) / moveDurationFrames;
          const x = interpolate(moveProgress, [0, 1], [-450, ORIGINAL_WIDTH + 450]);

          const twinkleDurationFrames = dot.twinkleDuration * fps;
          const twinkleDelayFrames = dot.twinkleDelay * fps;
          const twinkleProgress = ((frame + twinkleDelayFrames) % twinkleDurationFrames) / twinkleDurationFrames;
          const twinkleAlpha = interpolate(twinkleProgress, [0, 0.5, 1], [0.3 * dot.opacity, dot.opacity, 0.3 * dot.opacity]);

          return (
            <div
              key={`dot-${idx}`}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                width: dot.size,
                height: dot.size,
                top: `${dot.top}%`,
                left: 0,
                transform: `translateX(${x}px)`,
                background: dot.color,
                boxShadow: `0 0 ${dot.size * 3}px ${dot.color}`,
                opacity: twinkleAlpha,
              }}
            />
          );
        })}
      </div>

      {/* Glitch Animated Cyber Title */}
      <h1
        style={{
          position: 'absolute',
          top: 80,
          width: '100%',
          textAlign: 'center',
          zIndex: 5,
          color: '#fff',
          fontSize: 32,
          letterSpacing: 8,
          textTransform: 'uppercase',
          textShadow: useGlitchShadow
            ? (glitchX < 0 ? "3px 0 #ff003c, -3px 0 #00eaff" : "-3px 0 #ff003c, 3px 0 #00eaff")
            : '0 0 12px #00eaff, 0 0 24px #ff00e6',
          transform: `translateX(${glitchX}px) skewX(${glitchSkew}deg)`,
          filter: `brightness(${brightness}) saturate(${saturate})`,
        }}
      >
        Digital Neon Flow
      </h1>

      {/* Main interactive cards container */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 1000,
          height: 360,
          zIndex: 5,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
        }}
      >
        {/* Left Rect Frame */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 220,
            left: 60,
            borderRadius: 8,
            border: '3px solid transparent',
            background: `
              linear-gradient(rgba(8,5,20,0.55), rgba(8,5,20,0.55)) padding-box,
              linear-gradient(160deg, #00b3ff, #6a00ff, #ff1f5a, #00ffd5, #00b3ff) border-box
            `,
            backgroundSize: '100% 100%, 300% 300%',
            backgroundPosition: `0% 0%, ${bgPosX}% 50%`,
            boxShadow: '0 0 12px #00b3ff, 0 0 30px rgba(255,31,90,0.6), inset 0 0 25px rgba(0,150,255,0.25)',
            filter: `brightness(${brightness}) saturate(${saturate})`,
            transform: `perspective(800px) rotateY(${tiltAngleL}deg)`,
            backdropFilter: 'blur(2px)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              color: '#eaf6ff',
              textShadow: '0 0 10px #00eaff, 0 0 18px #ff00d4',
              pointerEvents: 'none',
              opacity: flickerOpacity,
            }}
          >
            CONTENT 01
          </span>
        </div>

        {/* Center Circular Frame */}
        <div
          style={{
            position: 'absolute',
            width: 210,
            height: 210,
            borderRadius: '50%',
            border: '3px solid transparent',
            background: `
              radial-gradient(circle, rgba(10,5,25,0.7), rgba(8,5,20,0.55)) padding-box,
              conic-gradient(#ff1f5a, #6a00ff, #00b3ff, #00ffd5, #ff00e6, #ff1f5a) border-box
            `,
            boxShadow: `0 0 ${shadowBlur1}px ${breatheShadowColor1}, 0 0 ${shadowBlur2}px ${breatheShadowColor2}, inset 0 0 ${shadowBlur3}px ${breatheShadowColor3}`,
            zIndex: 10,
            filter: `brightness(${brightness}) saturate(${saturate})`,
            transform: `rotate(${rotateDeg}deg)`,
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* Circular Orbit Dash Line (reversing rotation internally) */}
          <div
            style={{
              position: 'absolute',
              top: -18,
              left: -18,
              right: -18,
              bottom: -18,
              borderRadius: '50%',
              border: '1px dashed rgba(0,234,255,0.5)',
              transform: `rotate(${-rotateDegReverse}deg)`,
              pointerEvents: 'none',
            }}
          />

          {/* Orbiting glowing dot element */}
          <div
            style={{
              position: 'absolute',
              top: -22,
              left: '50%',
              width: 10,
              height: 10,
              marginLeft: -5,
              borderRadius: '50%',
              background: '#00ffd5',
              boxShadow: '0 0 14px #00ffd5',
              transformOrigin: '5px 127px',
              transform: `rotate(${orbitRotate}deg)`,
            }}
          />

          {/* CTA Center Label (reversing parent rotation to keep text right-side-up) */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              color: '#eaf6ff',
              textShadow: '0 0 10px #00eaff, 0 0 18px #ff00d4',
              pointerEvents: 'none',
              transform: `rotate(${-rotateDeg}deg)`,
              opacity: flickerOpacity,
            }}
          >
            CTA
          </span>
        </div>

        {/* Right Rect Frame */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 220,
            right: 60,
            borderRadius: 8,
            border: '3px solid transparent',
            background: `
              linear-gradient(rgba(8,5,20,0.55), rgba(8,5,20,0.55)) padding-box,
              linear-gradient(20deg, #ff1f5a, #6a00ff, #00b3ff, #00ffd5, #ff1f5a) border-box
            `,
            backgroundSize: '100% 100%, 300% 300%',
            backgroundPosition: `0% 0%, ${bgPosXRight}% 50%`,
            boxShadow: '0 0 12px #ff1f5a, 0 0 30px rgba(0,150,255,0.6), inset 0 0 25px rgba(120,0,255,0.25)',
            filter: `brightness(${brightness}) saturate(${saturate})`,
            transform: `perspective(800px) rotateY(${tiltAngleR}deg)`,
            backdropFilter: 'blur(2px)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 2,
              color: '#eaf6ff',
              textShadow: '0 0 10px #00eaff, 0 0 18px #ff00d4',
              pointerEvents: 'none',
              opacity: flickerOpacity,
            }}
          >
            CONTENT 02
          </span>
        </div>
      </div>
    </div>
  );
};

export default CyberpunkNeonFrames;
// END_OF_FILE