import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React, { useRef, useEffect } from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const COLORS_BASE = [
  'rgba(0, 234, 255, ',
  'rgba(255, 0, 212, ',
  'rgba(120, 80, 255, ',
  'rgba(255, 255, 255, ',
  'rgba(40, 60, 120, ',
];

const NUM_LINES = 160;
const NUM_GLITCH_BLOCKS = 80;
const NUM_WIDE_BANDS = 30;

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

const STATIC_LINES: {
  yFrac: number;
  xFrac: number;
  wFrac: number;
  thickness: number;
  colorIdx: number;
  alpha: number;
  speed: number;
}[] = Array.from({ length: NUM_LINES }, (_, i) => ({
  yFrac: seededRandom(i * 7 + 0),
  xFrac: seededRandom(i * 7 + 1),
  wFrac: 40 / 1920 + seededRandom(i * 7 + 2) * (400 / 1920),
  thickness: 2 + seededRandom(i * 7 + 3) * 7,
  colorIdx: Math.floor(seededRandom(i * 7 + 4) * COLORS_BASE.length),
  alpha: 0.25 + seededRandom(i * 7 + 5) * 0.65,
  speed: (seededRandom(i * 7 + 6) - 0.5) * 5,
}));

const GLITCH_BLOCKS: {
  yFrac: number;
  hFrac: number;
  xFrac: number;
  wFrac: number;
  colorIdx: number;
  alpha: number;
  triggerFrac: number;
}[] = Array.from({ length: NUM_GLITCH_BLOCKS }, (_, i) => ({
  yFrac: seededRandom(i * 9 + 100),
  hFrac: (4 + seededRandom(i * 9 + 101) * 50) / 1080,
  xFrac: seededRandom(i * 9 + 102),
  wFrac: (80 + seededRandom(i * 9 + 103) * 550) / 1920,
  colorIdx: Math.floor(seededRandom(i * 9 + 104) * COLORS_BASE.length),
  alpha: 0.2 + seededRandom(i * 9 + 105) * 0.4,
  triggerFrac: seededRandom(i * 9 + 106),
}));

const WIDE_BANDS: {
  yFrac: number;
  hFrac: number;
  alpha: number;
  triggerFrac: number;
}[] = Array.from({ length: NUM_WIDE_BANDS }, (_, i) => ({
  yFrac: seededRandom(i * 5 + 200),
  hFrac: (10 + seededRandom(i * 5 + 201) * 60) / 1080,
  alpha: 0.05 + seededRandom(i * 5 + 202) * 0.12,
  triggerFrac: seededRandom(i * 5 + 203),
}));

const GlitchTheEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const TOTAL_FRAMES = fps * 10;
  const localFrame = frame % TOTAL_FRAMES;
  const cycleProgress = localFrame / TOTAL_FRAMES;

  // ---- textShake: 3s cycle mapped to steps(15) ----
  const shakeFrames = fps * 3;
  const shakeLocal = localFrame % shakeFrames;
  const shakeProgress = shakeLocal / shakeFrames;

  const shakeKeyframesX = [0, 0.10, 0.20, 0.30, 0.45, 0.55, 0.70, 0.85, 1.0];
  const shakeValuesX =   [0,  -4,    4,   -2,    5,   -5,    2,   -4,    0];
  const shakeKeyframesY = [0, 0.10, 0.20, 0.30, 0.45, 0.55, 0.70, 0.85, 1.0];
  const shakeValuesY =   [0,   2,   -2,    0,    2,   -2,    3,   -3,    0];

  const shakeX = interpolate(shakeProgress, shakeKeyframesX, shakeValuesX, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shakeY = interpolate(shakeProgress, shakeKeyframesY, shakeValuesY, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ---- glitchBefore: 2.4s cycle, alternate-reverse → we use modulo on full cycle ----
  const beforeFrames = fps * 2.4;
  const beforeLocal = localFrame % beforeFrames;
  const beforeProgress = beforeLocal / beforeFrames;

  const beforeKf = [0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1.0];
  const beforeTX = interpolate(beforeProgress, beforeKf, [0, -12, 9, -14, 8, -10, 12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const beforeTY = interpolate(beforeProgress, beforeKf, [0, -4, 2, 0, -4, 4, 0, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const beforeClipTop = interpolate(beforeProgress, beforeKf, [0, 20, 60, 10, 40, 80, 30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const beforeClipBottom = interpolate(beforeProgress, beforeKf, [0, 50, 10, 70, 30, 5, 45, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ---- glitchAfter: 2s cycle ----
  const afterFrames = fps * 2.0;
  const afterLocal = localFrame % afterFrames;
  const afterProgress = afterLocal / afterFrames;

  const afterKf = [0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90, 1.0];
  const afterTX = interpolate(afterProgress, afterKf, [0, 12, -9, 14, -8, 10, -12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const afterTY = interpolate(afterProgress, afterKf, [0, 4, -2, 0, 4, -4, 0, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const afterClipTop = interpolate(afterProgress, afterKf, [0, 55, 15, 70, 25, 5, 45, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const afterClipBottom = interpolate(afterProgress, afterKf, [0, 15, 60, 8, 50, 80, 30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ---- flicker: 9s cycle ----
  const flickerFrames = fps * 9;
  const flickerLocal = localFrame % flickerFrames;
  const flickerProgress = flickerLocal / flickerFrames;

  const flickerKf = [0, 0.02, 0.03, 0.04, 0.05, 0.06, 0.48, 0.49, 0.50, 0.78, 0.79, 0.80, 1.0];
  const flickerVals = [0, 0.06, 0, 0.14, 0.03, 0, 0, 0.2, 0, 0, 0.12, 0, 0];
  const flickerOpacity = interpolate(flickerProgress, flickerKf, flickerVals, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ---- scanlines offset: 8s cycle ----
  const scanFrames = fps * 8;
  const scanLocal = localFrame % scanFrames;
  const scanOffset = interpolate(scanLocal, [0, scanFrames], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ---- Canvas drawing ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = ORIGINAL_WIDTH;
    const H = ORIGINAL_HEIGHT;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);

    // Draw moving glitch lines
    for (let i = 0; i < STATIC_LINES.length; i++) {
      const line = STATIC_LINES[i];
      const lineY = line.yFrac * H;
      const lineW = line.wFrac * W;

      // Simulate x movement deterministically from frame
      const totalDistPerFrame = line.speed + Math.sin(localFrame * 0.05 + lineY) * 2;
      let lineX = (line.xFrac * W + totalDistPerFrame * localFrame) % (W + lineW);
      if (lineX < -lineW) lineX = W + (lineX % (W + lineW));
      // wrap
      lineX = ((lineX % (W + lineW)) + (W + lineW)) % (W + lineW) - lineW;

      const a = line.alpha * (0.55 + 0.45 * Math.abs(Math.sin(localFrame * 0.1 + lineY)));
      ctx.fillStyle = COLORS_BASE[line.colorIdx] + a + ')';
      ctx.fillRect(lineX, lineY, lineW, line.thickness);
    }

    // Draw glitch blocks (deterministic: show based on cycleProgress vs triggerFrac)
    const blockWindowSize = 0.18;
    for (let i = 0; i < GLITCH_BLOCKS.length; i++) {
      const blk = GLITCH_BLOCKS[i];
      const triggerStart = blk.triggerFrac;
      const triggerEnd = (triggerStart + blockWindowSize) % 1.0;
      let show = false;
      if (triggerEnd > triggerStart) {
        show = cycleProgress >= triggerStart && cycleProgress < triggerEnd;
      } else {
        show = cycleProgress >= triggerStart || cycleProgress < triggerEnd;
      }
      if (show) {
        const by = blk.yFrac * H;
        const bh = blk.hFrac * H;
        const bx = blk.xFrac * W;
        const bw = blk.wFrac * W;
        ctx.fillStyle = COLORS_BASE[blk.colorIdx] + blk.alpha + ')';
        ctx.fillRect(bx, by, bw, bh);
      }
    }

    // Draw wide white bands (deterministic)
    const bandWindowSize = 0.08;
    for (let i = 0; i < WIDE_BANDS.length; i++) {
      const band = WIDE_BANDS[i];
      const triggerStart = band.triggerFrac;
      const triggerEnd = (triggerStart + bandWindowSize) % 1.0;
      let show = false;
      if (triggerEnd > triggerStart) {
        show = cycleProgress >= triggerStart && cycleProgress < triggerEnd;
      } else {
        show = cycleProgress >= triggerStart || cycleProgress < triggerEnd;
      }
      if (show) {
        const by = band.yFrac * H;
        const bh = band.hFrac * H;
        ctx.fillStyle = 'rgba(255,255,255,' + band.alpha + ')';
        ctx.fillRect(0, by, W, bh);
      }
    }
  }, [localFrame, cycleProgress]);

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
        background: '#05060a',
      }}
    >
      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />

      {/* Text wrap */}
      <div
        style={{
          position: 'absolute',
          zIndex: 3,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Main glitch text container */}
        <div
          style={{
            position: 'relative',
            fontSize: 120,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#f5f5ff',
            textTransform: 'uppercase',
            fontFamily: 'Arial, sans-serif',
            textShadow: '0 0 4px rgba(255,255,255,0.4), 0 0 12px rgba(0,234,255,0.3)',
            transform: `translate(${shakeX}px, ${shakeY}px)`,
          }}
        >
          {/* Before layer - cyan */}
          <span
            style={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              color: '#00eaff',
              textShadow: '0 0 10px rgba(0,234,255,0.6)',
              zIndex: -1,
              fontWeight: 800,
              letterSpacing: '0.12em',
              fontFamily: 'Arial, sans-serif',
              textTransform: 'uppercase',
              fontSize: 120,
              transform: `translate(${beforeTX}px, ${beforeTY}px)`,
              clipPath: `inset(${beforeClipTop}% 0 ${beforeClipBottom}% 0)`,
              display: 'block',
              whiteSpace: 'nowrap',
            }}
          >
            THE END
          </span>

          {/* After layer - magenta */}
          <span
            style={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              color: '#ff00d4',
              textShadow: '0 0 10px rgba(255,0,212,0.6)',
              zIndex: -2,
              fontWeight: 800,
              letterSpacing: '0.12em',
              fontFamily: 'Arial, sans-serif',
              textTransform: 'uppercase',
              fontSize: 120,
              transform: `translate(${afterTX}px, ${afterTY}px)`,
              clipPath: `inset(${afterClipTop}% 0 ${afterClipBottom}% 0)`,
              display: 'block',
              whiteSpace: 'nowrap',
            }}
          >
            THE END
          </span>

          {/* Main text */}
          THE END
        </div>
      </div>

      {/* Scanlines */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 4,
          pointerEvents: 'none',
          background: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 50%)',
          backgroundSize: '100% 4px',
          backgroundPosition: `0 ${scanOffset}px`,
          opacity: 0.5,
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Flicker */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 6,
          background: '#fff',
          mixBlendMode: 'overlay',
          opacity: flickerOpacity,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default GlitchTheEnd;
// END_OF_FILE