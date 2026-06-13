import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLE_COUNT = 180;
const SEED = 8888;

// Deterministic Pseudo-Random Generator
function seededRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = seededRandom(SEED);

// Pre-calculate deterministic, perfectly looping particle values
const STATIC_PARTICLES = Array.from({ length: PARTICLE_COUNT }).map(() => {
  const size = rand() * 3 + 0.5; // Size between 0.5 and 3.5

  // Symmetrical loop: vertical displacement must be a multiple of the height wrap span
  const verticalLoops = Math.floor(rand() * 4) + 1; // 1 to 4 full screen loops
  const speedY = -(verticalLoops * 1180) / 300; 

  // Symmetrical loop: horizontal displacement must be a multiple of the width wrap span
  const horizontalLoops = Math.floor(rand() * 5) - 2; // -2 to 2 full screen loops
  const speedX = (horizontalLoops * 2020) / 300;

  const baseOpacity = rand() * 0.8 + 0.2; 
  const flickerCycles = Math.floor(rand() * 12) + 3; // 3 to 14 full cycles per 10s
  const hue = rand() * 15 + 30; // Golden-orange hue range (30 to 45)

  return {
    xSeed: rand() * 1920,
    ySeed: rand() * 1080,
    size,
    speedY,
    speedX,
    baseOpacity,
    flickerCycles,
    hue,
  };
});

const GoldenEndScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // --- Animation Math: Glow Pulse (2.5 seconds per cycle = 75 frames) ---
  const glowLocalFrame = frame % 75;
  const pulseProgress = interpolate(
    glowLocalFrame,
    [0, 37.5, 75],
    [0, 1, 0],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const shadowRadius = interpolate(pulseProgress, [0, 1], [20, 45]);
  const insetRadius = interpolate(pulseProgress, [0, 1], [20, 35]);
  const insetOpacity = interpolate(pulseProgress, [0, 1], [0.3, 0.5]);

  const glowR = Math.round(interpolate(pulseProgress, [0, 1], [255, 255]));
  const glowG = Math.round(interpolate(pulseProgress, [0, 1], [149, 203]));
  const glowB = Math.round(interpolate(pulseProgress, [0, 1], [0, 82]));
  const glowColor = `rgb(${glowR}, ${glowG}, ${glowB})`;

  const borderR = Math.round(interpolate(pulseProgress, [0, 1], [255, 255]));
  const borderG = Math.round(interpolate(pulseProgress, [0, 1], [178, 215]));
  const borderB = Math.round(interpolate(pulseProgress, [0, 1], [46, 110]));
  const computedBorderColor = `rgb(${borderR}, ${borderG}, ${borderB})`;

  const glowBoxShadow = `0 0 ${shadowRadius}px ${glowColor}, inset 0 0 ${insetRadius}px rgba(255,149,0,${insetOpacity})`;

  // --- Animation Math: Subscribe Button Pulse (2 seconds per cycle = 60 frames) ---
  const btnLocalFrame = frame % 60;
  const btnProgress = interpolate(
    btnLocalFrame,
    [0, 30, 60],
    [0, 1, 0],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const btnScale = interpolate(btnProgress, [0, 1], [1, 1.06]);
  const btnShadowRadius = interpolate(btnProgress, [0, 1], [30, 45]);
  const btnShadowG = Math.round(interpolate(btnProgress, [0, 1], [149, 180]));
  const btnShadowB = Math.round(interpolate(btnProgress, [0, 1], [0, 46]));
  const btnShadowAlpha = interpolate(btnProgress, [0, 1], [0.7, 1.0]);
  const btnBoxShadow = `0 0 ${btnShadowRadius}px rgba(255, ${btnShadowG}, ${btnShadowB}, ${btnShadowAlpha})`;

  // --- Animation Math: Ring Rotation (Seamless 10-second loop, 2 full rotations) ---
  const ringRotation = interpolate(frame, [0, 300], [0, 720]);

  // --- Canvas Rendering Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Dark Brown/Black background
    ctx.fillStyle = '#0a0500';
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Draw Ambient Center-Top Radial Glow
    const cx = ORIGINAL_WIDTH * 0.55;
    const cy = ORIGINAL_HEIGHT * 0.1;
    const r = ORIGINAL_WIDTH * 0.6;
    const ambientGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    ambientGrad.addColorStop(0, 'rgba(255,170,40,0.35)');
    ambientGrad.addColorStop(0.3, 'rgba(180,90,10,0.15)');
    ambientGrad.addColorStop(1, 'rgba(10,5,0,0)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Draw Particles
    ctx.globalCompositeOperation = 'lighter';

    STATIC_PARTICLES.forEach((p) => {
      // Calculate wrapped position deterministically
      let x = (p.xSeed + p.speedX * frame) % 2020;
      if (x < -50) x += 2020;
      let y = (p.ySeed + p.speedY * frame) % 1180;
      if (y < -50) y += 1180;

      // Symmetrical flicker using sine wave
      const opacityOffset = Math.sin((frame * p.flickerCycles * 2 * Math.PI) / 300) * 0.25;
      let opacity = p.baseOpacity + opacityOffset;
      if (opacity < 0.1) opacity = 0.1;
      if (opacity > 1.0) opacity = 1.0;

      // Particle outer glow
      const glowSize = p.size * 4;
      const particleGrad = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      particleGrad.addColorStop(0, `hsla(${p.hue}, 100%, 65%, ${opacity})`);
      particleGrad.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
      ctx.fillStyle = particleGrad;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Particle core
      ctx.fillStyle = `hsla(${p.hue + 10}, 100%, 80%, ${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
  }, [frame]);

  // --- Absolute Position Styling ---
  const wrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#0a0500',
    fontFamily: 'Arial, sans-serif',
  };

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
    pointerEvents: 'none',
  };

  const circleFrameStyle: React.CSSProperties = {
    position: 'absolute',
    left: '8%',
    top: '38%',
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    border: `3px solid ${computedBorderColor}`,
    boxShadow: glowBoxShadow,
    transform: `rotate(${ringRotation}deg)`,
  };

  const subscribeBtnStyle: React.CSSProperties = {
    position: 'absolute',
    left: '7%',
    top: '70%',
    background: 'linear-gradient(90deg, #ff7b00, #ffb22e)',
    color: '#fff',
    padding: '12px 30px',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    boxShadow: btnBoxShadow,
    transform: `scale(${btnScale})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const videoFrameStyle: React.CSSProperties = {
    position: 'absolute',
    right: '8%',
    top: '30%',
    width: '42%',
    height: '45%',
    border: `3px solid ${computedBorderColor}`,
    borderRadius: '6px',
    boxShadow: glowBoxShadow,
  };

  return (
    <div style={wrapperStyle}>
      <canvas ref={canvasRef} width={ORIGINAL_WIDTH} height={ORIGINAL_HEIGHT} style={canvasStyle} />
      <div style={overlayStyle}>
        <div style={circleFrameStyle} />
        <div style={subscribeBtnStyle}>Subscribe</div>
        <div style={videoFrameStyle} />
      </div>
    </div>
  );
};

export default GoldenEndScreen;
// END_OF_FILE