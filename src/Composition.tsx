import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const TOTAL_FRAMES = 600;

const COLORS = [
  'rgba(0, 234, 255, ',   // cyan
  'rgba(255, 0, 212, ',   // magenta
  'rgba(120, 80, 255, ',  // ungu
  'rgba(255, 255, 255, ', // putih
  'rgba(40, 60, 120, '    // biru gelap
];

// Simple Seeded LCG PRNG for exact and reproducible random sequences
function createRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = createRandom(42);

// Pre-calculate deterministic lines and background block-glitches
const LINES_COUNT = 160;
const staticLines = Array.from({ length: LINES_COUNT }, (_, i) => {
  return {
    y: rand() * ORIGINAL_HEIGHT,
    xSeed: rand() * ORIGINAL_WIDTH,
    w: 40 + rand() * 400,
    thickness: 2 + rand() * 7,
    color: COLORS[Math.floor(rand() * COLORS.length)],
    alpha: 0.25 + rand() * 0.65,
    speed: (rand() - 0.5) * 5,
  };
});

const block1Frames = Array.from({ length: TOTAL_FRAMES }, () => {
  if (rand() < 0.18) {
    const by = rand() * ORIGINAL_HEIGHT;
    const bh = 4 + rand() * 50;
    const bx = rand() * ORIGINAL_WIDTH;
    const bw = 80 + rand() * 550;
    const color = COLORS[Math.floor(rand() * COLORS.length)] + (0.2 + rand() * 0.4) + ')';
    return { x: bx, y: by, w: bw, h: bh, color };
  }
  return null;
});

const block2Frames = Array.from({ length: TOTAL_FRAMES }, () => {
  if (rand() < 0.08) {
    const by = rand() * ORIGINAL_HEIGHT;
    const bh = 10 + rand() * 60;
    const color = `rgba(255, 255, 255, ${0.05 + rand() * 0.12})`;
    return { y: by, h: bh, color };
  }
  return null;
});

const GlitchTebal = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Seamless looping local frame trackers
  const shakeFrame = frame % 200;
  const beforeFrame = frame % 150;
  const afterFrame = frame % 120;
  const flickerFrame = frame % 600;
  const scanlineFrame = frame % 300;

  // 1. Text Shake Interpolation (200 frames cycle)
  const shakeRange = [0, 20, 40, 60, 90, 110, 140, 170, 200];
  const shakeX = interpolate(shakeFrame, shakeRange, [0, -4, 4, -2, 5, -5, 2, -4, 0]);
  const shakeY = interpolate(shakeFrame, shakeRange, [0, 2, -2, 0, 2, -2, 3, -3, 0]);

  // 2. Glitch Cyan Overlay - Before (150 frames cycle)
  const beforeRange = [0, 22.5, 45, 67.5, 90, 112.5, 135, 150];
  const beforeX = interpolate(beforeFrame, beforeRange, [0, -12, 9, -14, 8, -10, 12, 0]);
  const beforeY = interpolate(beforeFrame, beforeRange, [0, -4, 2, 0, -4, 4, 0, 0]);
  const beforeClipTop = interpolate(beforeFrame, beforeRange, [0, 20, 60, 10, 40, 80, 30, 0]);
  const beforeClipBottom = interpolate(beforeFrame, beforeRange, [0, 50, 10, 70, 30, 5, 45, 0]);

  // 3. Glitch Magenta Overlay - After (120 frames cycle)
  const afterRange = [0, 18, 36, 54, 72, 90, 108, 120];
  const afterX = interpolate(afterFrame, afterRange, [0, 12, -9, 14, -8, 10, -12, 0]);
  const afterY = interpolate(afterFrame, afterRange, [0, 4, -2, 0, 4, -4, 0, 0]);
  const afterClipTop = interpolate(afterFrame, afterRange, [0, 55, 15, 70, 25, 5, 45, 0]);
  const afterClipBottom = interpolate(afterFrame, afterRange, [0, 15, 60, 8, 50, 80, 30, 0]);

  // 4. White Flicker Overlay (600 frames cycle)
  const flickerOpacity = interpolate(
    flickerFrame,
    [0, 12, 18, 24, 30, 36, 288, 294, 300, 468, 474, 480, 600],
    [0, 0.06, 0, 0.14, 0.03, 0, 0, 0.2, 0, 0, 0.12, 0, 0]
  );

  // 5. Scanline movement loop (300 frames cycle)
  const scanlineY = interpolate(scanlineFrame, [0, 300], [0, 100], { easing: Easing.linear });

  // Draw the deterministic horizontal glitch line animations to the 1080p canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    staticLines.forEach((line) => {
      // Deterministic loop position matching canvas bounds
      let currentX = (line.xSeed + line.speed * frame + Math.sin(frame * 0.05 + line.y) * 40) % ORIGINAL_WIDTH;
      if (currentX < 0) currentX += ORIGINAL_WIDTH;

      const alphaPulse = line.alpha * (0.55 + 0.45 * Math.abs(Math.sin(frame * 0.1 + line.y)));
      ctx.fillStyle = line.color + alphaPulse + ')';
      ctx.fillRect(currentX, line.y, line.w, line.thickness);
    });

    // Draw active large glitch blocks
    const block1 = block1Frames[frame % TOTAL_FRAMES];
    if (block1) {
      ctx.fillStyle = block1.color;
      ctx.fillRect(block1.x, block1.y, block1.w, block1.h);
    }

    // Draw horizontal sweep band
    const block2 = block2Frames[frame % TOTAL_FRAMES];
    if (block2) {
      ctx.fillStyle = block2.color;
      ctx.fillRect(0, block2.y, ORIGINAL_WIDTH, block2.h);
    }
  }, [frame]);

  // React Styles
  const wrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#05060a'
  };

  const textWrapStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 3,
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const glitchStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: '130px',
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: '#f5f5ff',
    textTransform: 'uppercase',
    textShadow: '0 0 4px rgba(255,255,255,0.4), 0 0 12px rgba(0,234,255,0.3)',
    transform: `translate(${shakeX}px, ${shakeY}px)`,
    fontFamily: "'Arial', sans-serif"
  };

  const beforeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    color: '#00eaff',
    textShadow: '0 0 10px rgba(0,234,255,0.6)',
    zIndex: -1,
    transform: `translate(${beforeX}px, ${beforeY}px)`,
    clipPath: `inset(${beforeClipTop}% 0% ${beforeClipBottom}% 0%)`
  };

  const afterStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    color: '#ff00d4',
    textShadow: '0 0 10px rgba(255,0,212,0.6)',
    zIndex: -2,
    transform: `translate(${afterX}px, ${afterY}px)`,
    clipPath: `inset(${afterClipTop}% 0% ${afterClipBottom}% 0%)`
  };

  const scanlinesStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 4,
    pointerEvents: 'none',
    background: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 50%)',
    backgroundSize: '100% 4px',
    backgroundPosition: `0 ${scanlineY}px`,
    opacity: 0.5
  };

  const vignetteStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 5,
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)'
  };

  const flickerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 6,
    backgroundColor: '#ffffff',
    mixBlendMode: 'overlay',
    opacity: flickerOpacity,
    pointerEvents: 'none'
  };

  return (
    <div style={wrapperStyle}>
      <canvas 
        ref={canvasRef} 
        width={ORIGINAL_WIDTH} 
        height={ORIGINAL_HEIGHT} 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: 1 
        }} 
      />

      <div style={textWrapStyle}>
        <div style={glitchStyle}>
          THE END
          <div style={beforeStyle}>THE END</div>
          <div style={afterStyle}>THE END</div>
        </div>
      </div>

      <div style={scanlinesStyle} />
      <div style={vignetteStyle} />
      <div style={flickerStyle} />
    </div>
  );
};

export default GlitchTebal;
// END_OF_FILE