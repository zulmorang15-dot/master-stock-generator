import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const COLORS = ['#00f0ff', '#0066ff', '#bd00ff', '#ff00c8', '#00ff9d', '#3d7bff', '#00d4ff'];

// Seed-based pseudo-random number generator for deterministic rendering
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Generate static, frame-locked properties once
const STREAKS = (() => {
  const rng = createRng(1001);
  const divisors = [80, 100, 120, 150, 200, 240, 300];
  const arr = [];
  for (let i = 0; i < 50; i++) {
    const thick = 2 + rng() * 7;
    const height = 80 + rng() * 340;
    const left = rng() * 1920;
    const color = COLORS[Math.floor(rng() * COLORS.length)];
    const rev = rng() > 0.5;
    const durationFrames = divisors[Math.floor(rng() * divisors.length)];
    const delayFrames = Math.floor(rng() * 1200);
    const opacity = 0.35 + rng() * 0.55;
    arr.push({ thick, height, left, color, rev, durationFrames, delayFrames, opacity });
  }
  return arr;
})();

const DOTLINES = (() => {
  const rng = createRng(2002);
  const divisors = [100, 120, 150, 200, 240, 300];
  const arr = [];
  for (let i = 0; i < 24; i++) {
    const size = 2 + rng() * 3;
    const height = 120 + rng() * 260;
    const gap = 8 + rng() * 10;
    const left = rng() * 1920;
    const color = COLORS[Math.floor(rng() * COLORS.length)];
    const rev = rng() > 0.5;
    const durationFrames = divisors[Math.floor(rng() * divisors.length)];
    const delayFrames = Math.floor(rng() * 1200);
    const opacity = 0.5 + rng() * 0.5;
    arr.push({ size, height, gap, left, color, rev, durationFrames, delayFrames, opacity });
  }
  return arr;
})();

const DOTS = (() => {
  const rng = createRng(3003);
  const divisors = [120, 150, 200, 240, 300, 400];
  const arr = [];
  for (let i = 0; i < 45; i++) {
    const size = 2 + rng() * 4;
    const left = rng() * 1920;
    const color = COLORS[Math.floor(rng() * COLORS.length)];
    const rev = rng() > 0.5;
    const durationFrames = divisors[Math.floor(rng() * divisors.length)];
    const delayFrames = Math.floor(rng() * 1200);
    const opacity = 0.4 + rng() * 0.6;
    const twinkleFrames = 60 + Math.floor(rng() * 120);
    const twinkleDelayFrames = Math.floor(rng() * 120);
    arr.push({ size, left, color, rev, durationFrames, delayFrames, opacity, twinkleFrames, twinkleDelayFrames });
  }
  return arr;
})();

export const CyberNeonFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Fullscreen scale logic
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 16s Ambient Hue Shift Cycle (960 frames at 60fps)
  const hueShiftFrame = frame % 960;
  const hueRotate = interpolate(hueShiftFrame, [0, 960], [0, 360]);

  // 4s Grid Pulse Cycle (240 frames)
  const gridPulseFrame = frame % 240;
  const gridPulseOpacity = interpolate(gridPulseFrame, [0, 120, 240], [0.22, 0.55, 0.22], {
    ease: Easing.inOut(Easing.quad),
  });

  // 20s Grid Scroll Cycle (1200 frames)
  const gridScrollFrame = frame % 1200;
  const gridTranslateY = interpolate(gridScrollFrame, [0, 1200], [0, 38]);

  // 8s Scanline Cycle (480 frames)
  const scanlineFrame = frame % 480;
  const scanlineLeft = interpolate(scanlineFrame, [0, 480], [-160, 1920]);

  // 6s Container Float Cycle (360 frames)
  const containerFloatFrame = frame % 360;
  const containerTranslateY = interpolate(containerFloatFrame, [0, 180, 360], [0, -14, 0], {
    ease: Easing.inOut(Easing.quad),
  });

  // 2.4s Rect-left & Rect-right Glow Pulse Cycle (144 frames)
  const glowPulseFrame = frame % 144;
  const rectLeftGlow = interpolate(glowPulseFrame, [0, 72, 144], [1.0, 1.8, 1.0], {
    ease: Easing.inOut(Easing.quad),
  });
  const rectLeftSaturate = interpolate(glowPulseFrame, [0, 72, 144], [1.2, 1.7, 1.2], {
    ease: Easing.inOut(Easing.quad),
  });

  // rect-right delay is -1.2s (72 frames)
  const rectRightGlowFrame = (frame + 72) % 144;
  const rectRightGlow = interpolate(rectRightGlowFrame, [0, 72, 144], [1.0, 1.8, 1.0], {
    ease: Easing.inOut(Easing.quad),
  });
  const rectRightSaturate = interpolate(rectRightGlowFrame, [0, 72, 144], [1.2, 1.7, 1.2], {
    ease: Easing.inOut(Easing.quad),
  });

  // 5s Border Flow Cycle (300 frames)
  const borderFlowFrame = frame % 300;
  const rectLeftBorderPos = interpolate(borderFlowFrame, [0, 300], [0, 100]);
  const rectRightBorderPos = 100 - rectLeftBorderPos;

  // 7s Tilt Cycle (420 frames)
  const tiltFrame = frame % 420;
  const rectLeftTiltY = interpolate(tiltFrame, [0, 210, 420], [6, -2, 6], {
    ease: Easing.inOut(Easing.quad),
  });
  const rectRightTiltY = interpolate(tiltFrame, [0, 210, 420], [-6, 2, -6], {
    ease: Easing.inOut(Easing.quad),
  });

  // 6s Circle Spin Cycle (360 frames)
  const spinGlowFrame = frame % 360;
  const circleRotate = interpolate(spinGlowFrame, [0, 360], [0, 360]);

  // 10s Dashed Ring Reverse Spin Cycle (600 frames)
  const dashedSpinFrame = frame % 600;
  const dashedRotate = interpolate(dashedSpinFrame, [0, 600], [0, -360]);

  // 4s Circle Orbit Point Cycle (240 frames)
  const orbitFrame = frame % 240;
  const orbitRotate = interpolate(orbitFrame, [0, 240], [0, 360]);

  // 4s Circle Breathe (Shadow Pulse) Cycle (240 frames)
  const breatheFrame = frame % 240;
  const breatheProgress = interpolate(breatheFrame, [0, 120, 240], [0, 1, 0], {
    ease: Easing.inOut(Easing.quad),
  });

  const glow1Radius = interpolate(breatheProgress, [0, 1], [18, 30]);
  const glow1Color = breatheProgress < 0.5 ? '#bd00ff' : '#ff00c8';
  const glow2Radius = interpolate(breatheProgress, [0, 1], [40, 70]);
  const glow2Color = breatheProgress < 0.5 ? 'rgba(0,240,255,0.5)' : 'rgba(0,255,157,0.7)';
  const glow3Radius = interpolate(breatheProgress, [0, 1], [25, 35]);
  const glow3Color = breatheProgress < 0.5 ? 'rgba(189,0,255,0.3)' : 'rgba(255,0,200,0.4)';

  // 5s Label Flicker Cycle (300 frames)
  const flickerFrame = frame % 300;
  const labelFlicker = interpolate(
    flickerFrame,
    [0, 276, 279, 282, 288, 291, 300],
    [1, 1, 0.4, 1, 0.6, 1, 1]
  );

  // 6s Title Glitch Cycle (360 frames)
  const titleGlitchFrame = frame % 360;
  const titleGlitchPhase = titleGlitchFrame / 360;
  let titleTransform = "translateX(0px) skewX(0deg)";
  let titleTextShadow = "0 0 12px #00f0ff, 0 0 24px #ff00c8";

  if (titleGlitchPhase >= 0.90 && titleGlitchPhase < 0.92) {
    titleTransform = "translateX(-3px) skewX(5deg)";
    titleTextShadow = "2px 0 #ff00c8, -2px 0 #00f0ff";
  } else if (titleGlitchPhase >= 0.92 && titleGlitchPhase < 0.95) {
    titleTransform = "translateX(3px) skewX(-5deg)";
    titleTextShadow = "-2px 0 #ff00c8, 2px 0 #00f0ff";
  }

  // 3s Title Glow Cycle (180 frames)
  const titleGlowFrame = frame % 180;
  const titleBrightness = interpolate(titleGlowFrame, [0, 90, 180], [1.0, 1.8, 1.0], {
    ease: Easing.inOut(Easing.quad),
  });
  const titleSaturate = interpolate(titleGlowFrame, [0, 90, 180], [1.2, 1.7, 1.2], {
    ease: Easing.inOut(Easing.quad),
  });

  // Styles defined as local React CSS styles to comply with rule 0.1
  const mainWrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    background: '#01030a',
  };

  const ambientStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(0,102,255,0.28), transparent 60%), radial-gradient(circle at 20% 80%, rgba(189,0,255,0.18), transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,240,255,0.18), transparent 50%)',
    zIndex: 0,
    filter: `hue-rotate(${hueRotate}deg)`,
  };

  const pixelGridStyle: React.CSSProperties = {
    position: 'absolute',
    inset: -50,
    backgroundImage: 'linear-gradient(rgba(0,240,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.07) 1px, transparent 1px)',
    backgroundSize: '38px 38px',
    zIndex: 1,
    opacity: gridPulseOpacity,
    transform: `translateY(${gridTranslateY}px)`,
  };

  const scanlineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 160,
    background: 'linear-gradient(to right, transparent, rgba(0,240,255,0.08), rgba(189,0,255,0.08), transparent)',
    zIndex: 3,
    pointerEvents: 'none',
    left: scanlineLeft,
  };

  const streaksStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    zIndex: 2,
  };

  const titleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 100,
    width: '100%',
    textAlign: 'center',
    zIndex: 5,
    color: '#fff',
    fontSize: 48,
    letterSpacing: 12,
    textTransform: 'uppercase',
    transform: titleTransform,
    textShadow: titleTextShadow,
    filter: `brightness(${titleBrightness}) saturate(${titleSaturate})`,
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontWeight: 'bold',
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 5,
    width: 1000,
    height: 360,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transform: `translate(-50%, -50%) translateY(${containerTranslateY}px)`,
    top: '55%',
    left: '50%',
    transformOrigin: 'center center',
  };

  const frameBaseStyle: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(4,8,20,0.55)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  };

  const rectLeftStyle: React.CSSProperties = {
    ...frameBaseStyle,
    width: 360,
    height: 220,
    left: 60,
    borderRadius: 8,
    border: '3px solid transparent',
    background: 'linear-gradient(rgba(4,8,20,0.55), rgba(4,8,20,0.55)) padding-box, linear-gradient(160deg, #00f0ff, #0066ff, #bd00ff, #00ff9d, #00f0ff) border-box',
    backgroundSize: '100% 100%, 300% 300%',
    backgroundPosition: `0% 0%, 50% ${rectLeftBorderPos}%`,
    boxShadow: '0 0 12px #00f0ff, 0 0 30px rgba(189,0,255,0.55), inset 0 0 25px rgba(0,240,255,0.25)',
    transform: `perspective(800px) rotateY(${rectLeftTiltY}deg)`,
    filter: `brightness(${rectLeftGlow}) saturate(${rectLeftSaturate})`,
  };

  const rectRightStyle: React.CSSProperties = {
    ...frameBaseStyle,
    width: 360,
    height: 220,
    right: 60,
    borderRadius: 8,
    border: '3px solid transparent',
    background: 'linear-gradient(rgba(4,8,20,0.55), rgba(4,8,20,0.55)) padding-box, linear-gradient(20deg, #ff00c8, #bd00ff, #0066ff, #00ff9d, #ff00c8) border-box',
    backgroundSize: '100% 100%, 300% 300%',
    backgroundPosition: `0% 0%, 50% ${rectRightBorderPos}%`,
    boxShadow: '0 0 12px #ff00c8, 0 0 30px rgba(0,102,255,0.55), inset 0 0 25px rgba(189,0,255,0.25)',
    transform: `perspective(800px) rotateY(${rectRightTiltY}deg)`,
    filter: `brightness(${rectRightGlow}) saturate(${rectRightSaturate})`,
  };

  const circleContainerStyle: React.CSSProperties = {
    position: 'absolute',
    width: 210,
    height: 210,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const circleStyle: React.CSSProperties = {
    ...frameBaseStyle,
    width: 210,
    height: 210,
    borderRadius: '50%',
    border: '3px solid transparent',
    background: 'radial-gradient(circle, rgba(4,10,25,0.7), rgba(4,8,20,0.55)) padding-box, conic-gradient(#ff00c8, #bd00ff, #0066ff, #00f0ff, #00ff9d, #ff00c8) border-box',
    boxShadow: `0 0 ${glow1Radius}px ${glow1Color}, 0 0 ${glow2Radius}px ${glow2Color}, inset 0 0 ${glow3Radius}px ${glow3Color}`,
    transform: `rotate(${circleRotate}deg)`,
    filter: `brightness(${rectLeftGlow}) saturate(${rectLeftSaturate})`,
  };

  const circleBeforeStyle: React.CSSProperties = {
    position: 'absolute',
    inset: -18,
    borderRadius: '50%',
    border: '1px dashed rgba(0,240,255,0.5)',
    transform: `rotate(${dashedRotate}deg)`,
    pointerEvents: 'none',
  };

  const circleAfterStyle: React.CSSProperties = {
    position: 'absolute',
    top: -22,
    left: '50%',
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: '50%',
    background: '#00ff9d',
    boxShadow: '0 0 14px #00ff9d',
    transformOrigin: '5px 127px',
    transform: `rotate(${orbitRotate}deg)`,
    pointerEvents: 'none',
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
    color: '#d6faff',
    textShadow: '0 0 10px #00f0ff, 0 0 18px #ff00c8',
    pointerEvents: 'none',
    opacity: labelFlicker,
    fontFamily: "'Segoe UI', Arial, sans-serif",
  };

  const circleLabelStyle: React.CSSProperties = {
    ...labelStyle,
    transform: `rotate(${-circleRotate}deg)`,
  };

  return (
    <div style={mainWrapperStyle}>
      <div style={ambientStyle} />
      <div style={pixelGridStyle} />
      <div style={scanlineStyle} />

      {/* Streaks Container rendering custom-interpolated elements */}
      <div style={streaksStyle}>
        {STREAKS.map((s, index) => {
          const progress = ((frame + s.delayFrames) % s.durationFrames) / s.durationFrames;
          const y = s.rev
            ? interpolate(progress, [0, 1], [-450, 1350])
            : interpolate(progress, [0, 1], [1350, -450]);

          return (
            <div
              key={`streak-${index}`}
              style={{
                position: 'absolute',
                borderRadius: 6,
                filter: 'blur(0.6px)',
                width: s.thick,
                height: s.height,
                left: s.left,
                transform: `translateY(${y}px)`,
                background: `linear-gradient(180deg, transparent, ${s.color}, transparent)`,
                boxShadow: `0 0 ${s.thick * 2}px ${s.color}`,
                opacity: s.opacity,
              }}
            />
          );
        })}

        {DOTLINES.map((d, index) => {
          const progress = ((frame + d.delayFrames) % d.durationFrames) / d.durationFrames;
          const y = d.rev
            ? interpolate(progress, [0, 1], [-450, 1350])
            : interpolate(progress, [0, 1], [1350, -450]);

          return (
            <div
              key={`dotline-${index}`}
              style={{
                position: 'absolute',
                width: d.size,
                height: d.height,
                left: d.left,
                transform: `translateY(${y}px)`,
                backgroundImage: `radial-gradient(circle, ${d.color} 0px, ${d.color} ${d.size / 2}px, transparent ${d.size / 2 + 0.5}px)`,
                backgroundSize: `${d.size}px ${d.gap}px`,
                backgroundRepeat: 'repeat-y',
                filter: `drop-shadow(0px 0px ${d.size * 2}px ${d.color})`,
                opacity: d.opacity,
              }}
            />
          );
        })}

        {DOTS.map((p, index) => {
          const progress = ((frame + p.delayFrames) % p.durationFrames) / p.durationFrames;
          const y = p.rev
            ? interpolate(progress, [0, 1], [-450, 1350])
            : interpolate(progress, [0, 1], [1350, -450]);

          const twinkleProgress = ((frame + p.twinkleDelayFrames) % p.twinkleFrames) / p.twinkleFrames;
          const opacityScale = interpolate(twinkleProgress, [0, 0.5, 1], [0.3, 1.0, 0.3], {
            ease: Easing.inOut(Easing.quad),
          });

          return (
            <div
              key={`dot-${index}`}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                width: p.size,
                height: p.size,
                left: p.left,
                transform: `translateY(${y}px)`,
                background: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                opacity: p.opacity * opacityScale,
              }}
            />
          );
        })}
      </div>

      <h1 style={titleStyle}>Cyber Neon Flow</h1>

      <div style={containerStyle}>
        <div style={rectLeftStyle}>
          <span style={labelStyle}>CONTENT 01</span>
        </div>
        <div style={circleContainerStyle}>
          <div style={circleBeforeStyle} />
          <div style={circleStyle}>
            <span style={circleLabelStyle}>CTA</span>
          </div>
          <div style={circleAfterStyle} />
        </div>
        <div style={rectRightStyle}>
          <span style={labelStyle}>CONTENT 02</span>
        </div>
      </div>
    </div>
  );
};

export default CyberNeonFlow;
// END_OF_FILE