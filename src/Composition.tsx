import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic Pseudo-Random Seed Generator
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const COLORS = [
  'rgba(0, 234, 255, ',   // cyan
  'rgba(255, 0, 212, ',   // magenta
  'rgba(120, 80, 255, ',  // ungu
  'rgba(255, 255, 255, ', // putih
  'rgba(40, 60, 120, '    // biru gelap
];

// Pre-calculate 160 lines to avoid Math.random during render
const linesConfig = Array.from({ length: 160 }).map((_, idx) => {
  const r1 = seededRandom(idx * 7 + 1);
  const r2 = seededRandom(idx * 13 + 2);
  const r3 = seededRandom(idx * 17 + 3);
  const r4 = seededRandom(idx * 23 + 4);
  const r5 = seededRandom(idx * 29 + 5);
  const r6 = seededRandom(idx * 31 + 6);

  // Loop-safe periodic oscillation variables (must align to a 600 frame cycle)
  const cyclesX1 = Math.floor(r1 * 3) + 1; // 1 to 3 full cycles
  const cyclesX2 = Math.floor(r2 * 5) + 2; // 2 to 6 full cycles
  const ampX1 = 120 + r3 * 350;
  const ampX2 = 30 + r4 * 90;

  return {
    y: r1 * ORIGINAL_HEIGHT,
    initialX: r2 * ORIGINAL_WIDTH,
    cyclesX1,
    cyclesX2,
    ampX1,
    ampX2,
    w: 60 + r3 * 450,
    thickness: 3 + r4 * 8,
    color: COLORS[Math.floor(r5 * COLORS.length)],
    alpha: 0.3 + r6 * 0.6,
  };
});

// Pre-calculate deterministic glitches and sweeps for all 600 frames
const frameGlitches = Array.from({ length: 600 }).map((_, f) => {
  const rBlock = seededRandom(f * 19 + 77);
  const rSweep = seededRandom(f * 29 + 103);

  let block = null;
  if (rBlock < 0.20) { // 20% deterministic chance
    const r1 = seededRandom(f * 41 + 1);
    const r2 = seededRandom(f * 43 + 2);
    const r3 = seededRandom(f * 47 + 3);
    const r4 = seededRandom(f * 53 + 4);
    const r5 = seededRandom(f * 59 + 5);

    block = {
      y: r1 * ORIGINAL_HEIGHT,
      h: 6 + r2 * 60,
      x: r3 * ORIGINAL_WIDTH,
      w: 100 + r4 * 600,
      color: COLORS[Math.floor(r5 * COLORS.length)] + (0.25 + r1 * 0.45) + ')',
    };
  }

  let sweep = null;
  if (rSweep < 0.09) { // 9% deterministic chance
    const r1 = seededRandom(f * 61 + 6);
    const r2 = seededRandom(f * 67 + 7);
    const r3 = seededRandom(f * 71 + 8);

    sweep = {
      y: r1 * ORIGINAL_HEIGHT,
      h: 12 + r2 * 70,
      color: 'rgba(255,255,255,' + (0.05 + r3 * 0.14) + ')',
    };
  }

  return { block, sweep };
});

const GlitchTebal: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Responsive scaling to fit perfectly into 16:9 
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. TEXT SHAKE ANIMATION MAPPING (3s loop = 180 frames)
  const shakeFrame = frame % 180;
  const shakePct = shakeFrame / 180;
  const shakeX = interpolate(
    shakePct,
    [0, 0.1, 0.2, 0.3, 0.45, 0.55, 0.7, 0.85, 1.0],
    [0, -4, 4, -2, 5, -5, 2, -4, 0]
  );
  const shakeY = interpolate(
    shakePct,
    [0, 0.1, 0.2, 0.3, 0.45, 0.55, 0.7, 0.85, 1.0],
    [0, 2, -2, 0, 2, -2, 3, -3, 0]
  );

  // 2. CYAN LAYER GLITCHBEFORE MAPPING (2.4s loop = 144 frames)
  const beforeFrame = frame % 144;
  const beforePct = beforeFrame / 144;
  const beforeX = interpolate(
    beforePct,
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0],
    [0, -12, 9, -14, 8, -10, 12, 0]
  );
  const beforeY = interpolate(
    beforePct,
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0],
    [0, -4, 2, 0, -4, 4, 0, 0]
  );
  const beforeClipTop = interpolate(
    beforePct,
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0],
    [0, 20, 60, 10, 40, 80, 30, 0]
  );
  const beforeClipBottom = interpolate(
    beforePct,
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0],
    [0, 50, 10, 70, 30, 5, 45, 0]
  );

  // 3. MAGENTA LAYER GLITCHAFTER MAPPING (2s loop = 120 frames)
  const afterFrame = frame % 120;
  const afterPct = afterFrame / 120;
  const afterX = interpolate(
    afterPct,
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0],
    [0, 12, -9, 14, -8, 10, -12, 0]
  );
  const afterY = interpolate(
    afterPct,
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0],
    [0, 4, -2, 0, 4, -4, 0, 0]
  );
  const afterClipTop = interpolate(
    afterPct,
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0],
    [0, 55, 15, 70, 25, 5, 45, 0]
  );
  const afterClipBottom = interpolate(
    afterPct,
    [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0],
    [0, 15, 60, 8, 50, 80, 30, 0]
  );

  // 4. OVERLAY FLICKER MAPPING (9s loop = 540 frames)
  const flickerFrame = frame % 540;
  const flickerPct = flickerFrame / 540;
  const flickerOpacity = interpolate(
    flickerPct,
    [0, 0.02, 0.03, 0.04, 0.05, 0.06, 0.48, 0.49, 0.50, 0.78, 0.79, 0.80, 1.0],
    [0, 0.06, 0, 0.14, 0.03, 0, 0, 0.2, 0, 0, 0.12, 0, 0]
  );

  // 5. SCANLINES Y MOVEMENT MAPPING (8s loop = 480 frames)
  const scanlineFrame = frame % 480;
  const scanlineY = interpolate(scanlineFrame, [0, 480], [0, 100]);

  // Frame-locked canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and Redraw frame deterministically
    ctx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Dark cyberpunk backdrop
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Draw active pseudo-random horizontal lines
    linesConfig.forEach((line) => {
      // Loop-safe dual-sine oscillation formula for horizontal seamless movement
      const angle1 = (frame / 600) * 2 * Math.PI * line.cyclesX1;
      const angle2 = (frame / 600) * 2 * Math.PI * line.cyclesX2;
      const offsetX = Math.sin(angle1) * line.ampX1 + Math.sin(angle2) * line.ampX2;

      let currentX = (line.initialX + offsetX) % (ORIGINAL_WIDTH + line.w);
      if (currentX < -line.w) currentX += (ORIGINAL_WIDTH + line.w);

      // Loop-safe periodic sine for alpha flicker
      const alphaAngle = (frame / 600) * 2 * Math.PI * 12 + (line.y * 0.02);
      const alphaVal = line.alpha * (0.55 + 0.45 * Math.abs(Math.sin(alphaAngle)));

      ctx.fillStyle = line.color + alphaVal.toFixed(3) + ')';
      ctx.fillRect(currentX, line.y, line.w, line.thickness);
    });

    // Retreive pre-calculated transient glitches
    const activeGlitch = frameGlitches[frame % 600];

    // Heavy glitch blocks
    if (activeGlitch.block) {
      const { x, y, w, h, color } = activeGlitch.block;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    }

    // Wide horizontal sweeping white glints
    if (activeGlitch.sweep) {
      const { y, h, color } = activeGlitch.sweep;
      ctx.fillStyle = color;
      ctx.fillRect(0, y, ORIGINAL_WIDTH, h);
    }
  }, [frame]);

  // CSS Styles converted to camelCased react style objects
  const mainWrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#000000',
  };

  const stageStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#05060a',
    overflow: 'hidden',
  };

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  };

  const textWrapStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 3,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  };

  const textGlitchStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: '120px', 
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: '#f5f5ff',
    textTransform: 'uppercase',
    textShadow: '0 0 4px rgba(255,255,255,0.4), 0 0 12px rgba(0,234,255,0.3)',
    transform: `translate(${shakeX}px, ${shakeY}px)`,
    fontFamily: 'Arial, sans-serif',
  };

  const pseudoBeforeStyle: React.CSSProperties = {
    content: 'attr(data-text)',
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
    clipPath: `inset(${beforeClipTop}% 0% ${beforeClipBottom}% 0%)`,
  };

  const pseudoAfterStyle: React.CSSProperties = {
    content: 'attr(data-text)',
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
    clipPath: `inset(${afterClipTop}% 0% ${afterClipBottom}% 0%)`,
  };

  const scanlinesStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    pointerEvents: 'none',
    background: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 50%)',
    backgroundSize: '100% 4px',
    backgroundPosition: `0px ${scanlineY}px`,
    opacity: 0.5,
  };

  const vignetteStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)',
  };

  const flickerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    backgroundColor: '#ffffff',
    mixBlendMode: 'overlay',
    opacity: flickerOpacity,
    pointerEvents: 'none',
  };

  return (
    <div style={mainWrapperStyle}>
      <div style={stageStyle}>
        <canvas
          ref={canvasRef}
          width={ORIGINAL_WIDTH}
          height={ORIGINAL_HEIGHT}
          style={canvasStyle}
        />

        <div style={textWrapStyle}>
          <div style={textGlitchStyle} data-text="THE END">
            THE END
            <div style={pseudoBeforeStyle}>THE END</div>
            <div style={pseudoAfterStyle}>THE END</div>
          </div>
        </div>

        <div style={scanlinesStyle} />
        <div style={vignetteStyle} />
        <div style={flickerStyle} />
      </div>
    </div>
  );
};

export default GlitchTebal;
// END_OF_FILE