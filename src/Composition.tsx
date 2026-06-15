import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLE_COUNT = 180;

// Precompute deterministic particle parameters outside the component
const STATIC_PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const r1 = Math.sin(i * 12.9898) * 43758.5453;
  const rand1 = r1 - Math.floor(r1);
  const r2 = Math.cos(i * 78.233) * 43758.5453;
  const rand2 = r2 - Math.floor(r2);
  const r3 = Math.sin(i * 45.123) * 43758.5453;
  const rand3 = r3 - Math.floor(r3);
  const r4 = Math.cos(i * 92.456) * 43758.5453;
  const rand4 = r4 - Math.floor(r4);

  // k must be negative to move upwards. Limit choices to divisors/multipliers for perfect looping over 300 frames
  // L_Y is 1200. speedY = k * (1200 / 300) = k * 4. So speedY is an integer multiple of 4, wrapping flawlessly.
  const k = -((i % 4) + 1); // -1, -2, -3, -4
  // j represents horizontal motion. L_X is 2000. speedX = j * (2000 / 300) = j * 6.666... Flawless wrapping around 2000.
  const j = (i % 3) - 1; // -1, 0, 1

  return {
    startX: rand1 * 2000,
    startY: rand2 * 1200,
    size: rand3 * 3.0 + 0.5, // Particle size: 0.5 to 3.5
    k,
    j,
    opacity: rand4 * 0.8 + 0.2, // Base opacity: 0.2 to 1
    hue: rand2 * 15 + 30, // Golden hues: 30 to 45
  };
});

export const GoldenEndScreen: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle high-fidelity layout scaling dynamically
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background color
    ctx.fillStyle = '#0a0500';
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Dynamic top-center radial light glow
    const grad = ctx.createRadialGradient(
      ORIGINAL_WIDTH * 0.55, ORIGINAL_HEIGHT * 0.1, 0,
      ORIGINAL_WIDTH * 0.55, ORIGINAL_HEIGHT * 0.1, ORIGINAL_WIDTH * 0.6
    );
    grad.addColorStop(0, 'rgba(255,170,40,0.35)');
    grad.addColorStop(0.3, 'rgba(180,90,10,0.15)');
    grad.addColorStop(1, 'rgba(10,5,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    ctx.globalCompositeOperation = 'lighter';

    STATIC_PARTICLES.forEach((p, i) => {
      // Periodic X position loop (range: 2000px, centering shift offset -40px)
      const L_X = 2000;
      const speedX = p.j * (L_X / 300);
      let x = (p.startX + speedX * frame) % L_X;
      if (x < 0) x += L_X;
      x -= 40;

      // Periodic Y position loop (range: 1200px, centering shift offset -60px)
      const L_Y = 1200;
      const speedY = p.k * (L_Y / 300);
      let y = (p.startY + speedY * frame) % L_Y;
      if (y < 0) y += L_Y;
      y -= 60;

      // Deterministic periodic flicker
      const cycleCount = (i % 15) + 5;
      const flickerOpacity = p.opacity + Math.sin((frame / 300) * 2 * Math.PI * cycleCount) * 0.15;
      const finalOpacity = Math.max(0.1, Math.min(1.0, flickerOpacity));

      // Outer particle glow
      const glowSize = p.size * 4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      g.addColorStop(0, `hsla(${p.hue}, 100%, 65%, ${finalOpacity})`);
      g.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Inner solid particle core
      ctx.fillStyle = `hsla(${p.hue + 10}, 100%, 80%, ${finalOpacity})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
  }, [frame]);

  // ===== Dynamic Keyframe Conversions (Strictly driven by frame) =====

  // 1. glowPulse Animation (2.5s cycle = 75 frames. Perfect loop within 300 frames)
  const glowLocalFrame = frame % 75;

  const glowRadius = interpolate(glowLocalFrame, [0, 37.5, 75], [25, 50, 25], {
    easing: Easing.inOut(Easing.quad),
  });

  const innerRadius = interpolate(glowLocalFrame, [0, 37.5, 75], [20, 35, 20], {
    easing: Easing.inOut(Easing.quad),
  });

  const borderG = interpolate(glowLocalFrame, [0, 37.5, 75], [178, 215, 178], {
    easing: Easing.inOut(Easing.quad),
  });
  const borderB = interpolate(glowLocalFrame, [0, 37.5, 75], [46, 110, 46], {
    easing: Easing.inOut(Easing.quad),
  });
  const borderColor = `rgb(255, ${Math.round(borderG)}, ${Math.round(borderB)})`;

  const glowG = interpolate(glowLocalFrame, [0, 37.5, 75], [149, 203, 149], {
    easing: Easing.inOut(Easing.quad),
  });
  const glowB = interpolate(glowLocalFrame, [0, 37.5, 75], [0, 82, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const outerColor = `rgb(255, ${Math.round(glowG)}, ${Math.round(glowB)})`;

  const innerG = interpolate(glowLocalFrame, [0, 37.5, 75], [149, 180, 149], {
    easing: Easing.inOut(Easing.quad),
  });
  const innerB = interpolate(glowLocalFrame, [0, 37.5, 75], [0, 46, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const innerA = interpolate(glowLocalFrame, [0, 37.5, 75], [0.4, 0.5, 0.4], {
    easing: Easing.inOut(Easing.quad),
  });
  const innerColor = `rgba(255, ${Math.round(innerG)}, ${Math.round(innerB)}, ${innerA})`;

  // 2. rotateRing Animation (linear 150 frames cycle = 5s. Perfect loop in 10s)
  const rotateVal = interpolate(frame % 150, [0, 150], [0, 360]);

  // 3. btnPulse Animation (2s cycle = 60 frames. Perfect loop within 300 frames)
  const btnLocalFrame = frame % 60;
  const btnScale = interpolate(btnLocalFrame, [0, 30, 60], [1, 1.06, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  const btnGlowRad = interpolate(btnLocalFrame, [0, 30, 60], [30, 45, 30], {
    easing: Easing.inOut(Easing.quad),
  });
  const btnG = interpolate(btnLocalFrame, [0, 30, 60], [149, 180, 149], {
    easing: Easing.inOut(Easing.quad),
  });
  const btnB = interpolate(btnLocalFrame, [0, 30, 60], [0, 46, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const btnA = interpolate(btnLocalFrame, [0, 30, 60], [0.7, 1.0, 0.7], {
    easing: Easing.inOut(Easing.quad),
  });
  const btnShadowColor = `rgba(255, ${Math.round(btnG)}, ${Math.round(btnB)}, ${btnA})`;

  // 4. video-frame glow parameters
  const videoOuterRadius = interpolate(glowLocalFrame, [0, 37.5, 75], [30, 45, 30], {
    easing: Easing.inOut(Easing.quad),
  });
  const videoInnerRadius = interpolate(glowLocalFrame, [0, 37.5, 75], [25, 35, 25], {
    easing: Easing.inOut(Easing.quad),
  });

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
        backgroundColor: '#0a0500',
        fontFamily: "'Arial', sans-serif",
      }}
    >
      <canvas
        ref={canvasRef}
        width={ORIGINAL_WIDTH}
        height={ORIGINAL_HEIGHT}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {/* Subscribe Ring (Circle Frame) */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            top: '38%',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            border: `3px solid ${borderColor}`,
            boxShadow: `0 0 ${glowRadius}px ${outerColor}, inset 0 0 ${innerRadius}px ${innerColor}`,
            transform: `rotate(${rotateVal}deg)`,
            transformOrigin: 'center center',
          }}
        />

        {/* Subscribe Button */}
        <div
          style={{
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
            boxShadow: `0 0 ${btnGlowRad}px ${btnShadowColor}`,
            transform: `scale(${btnScale})`,
            transformOrigin: 'center center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Subscribe
        </div>

        {/* Right Video Frame */}
        <div
          style={{
            position: 'absolute',
            right: '8%',
            top: '30%',
            width: '42%',
            height: '45%',
            border: `3px solid ${borderColor}`,
            borderRadius: '6px',
            boxShadow: `0 0 ${videoOuterRadius}px ${outerColor}, inset 0 0 ${videoInnerRadius}px ${innerColor}`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    </div>
  );
};

export default GoldenEndScreen;
// END_OF_FILE