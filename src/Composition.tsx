import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic hexagon grid node generator
const generateHexGrid = () => {
  const hexes = [];
  const R = 34; // radius
  const w = R * 2; // flat-top width
  const h = Math.sqrt(3) * R; // flat-top height
  const hSpacing = w * 0.75; // column spacing

  // Loop to completely fill 1920x1080 with padding
  for (let col = -1; col * hSpacing < ORIGINAL_WIDTH + w; col++) {
    for (let row = -1; row * h < ORIGINAL_HEIGHT + h; row++) {
      const x = col * hSpacing;
      const y = row * h + (col % 2 !== 0 ? h / 2 : 0);

      const dx = (x - ORIGINAL_WIDTH * 0.5) / (ORIGINAL_WIDTH * 0.5);
      const dy = (y - ORIGINAL_HEIGHT * 0.4) / (ORIGINAL_HEIGHT * 0.5);
      const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const base = 0.10 + (1 - dist) * 0.30;

      // Deterministic phase/speed to avoid Math.random()
      const hash1 = Math.abs(Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1;
      const hash2 = Math.abs(Math.cos(col * 45.123 + row * 9.876) * 12345.6789) % 1;
      const phase = hash1 * Math.PI * 2;
      const spd = 0.4 + hash2 * 1.2;

      hexes.push({ x, y, base, phase, spd });
    }
  }
  return hexes;
};

const EndScreenPro: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hexes = useMemo(() => generateHexGrid(), []);

  // Frame-locked canvas renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    const R = 34;
    const t = frame * 0.02;

    hexes.forEach((hx) => {
      const flick = 0.5 + 0.5 * Math.sin(t * hx.spd + hx.phase);
      const alpha = hx.base * 0.4 + hx.base * flick;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i);
        const px = hx.x + R * Math.cos(a);
        const py = hx.y + R * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(90, 165, 225, ${alpha})`;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(150, 210, 255, ${alpha * 0.6})`;
      ctx.stroke();
    });
  }, [frame, hexes]);

  // Corner floats (6s and 7.5s cycles fit perfectly in 15s)
  const fA = frame % 180;
  const txA = interpolate(fA, [0, 90, 180], [0, 15, 0], { easing: Easing.inOut(Easing.quad) });
  const tyA = interpolate(fA, [0, 90, 180], [0, 15, 0], { easing: Easing.inOut(Easing.quad) });
  const rotA = interpolate(fA, [0, 90, 180], [0, 8, 0], { easing: Easing.inOut(Easing.quad) });

  const fB = frame % 225;
  const txB = interpolate(fB, [0, 112.5, 225], [15, 0, 15], { easing: Easing.inOut(Easing.quad) });
  const tyB = interpolate(fB, [0, 112.5, 225], [15, 0, 15], { easing: Easing.inOut(Easing.quad) });
  const rotB = interpolate(fB, [0, 112.5, 225], [8, 0, 8], { easing: Easing.inOut(Easing.quad) });

  // Blinking dot decor
  const getBlinkOpacity = (index: number) => {
    const delay = index * 6;
    const f = (frame - delay + 36) % 36;
    return interpolate(f, [0, 18, 36], [1, 0.2, 1], { easing: Easing.inOut(Easing.quad) });
  };

  // Title bounce and wiggle (seamless loop)
  const wiggleY = interpolate(frame % 90, [0, 22.5, 67.5, 90], [0, -6, -4, 0], { easing: Easing.inOut(Easing.quad) });
  const wiggleRot = interpolate(frame % 90, [0, 22.5, 67.5, 90], [0, -1, 1, 0], { easing: Easing.inOut(Easing.quad) });

  const titleText = "THANKS FOR WATCHING";

  // Video frames colors and glow calculation
  const getFrameStyle = (offset: number) => {
    const f = (frame + offset) % 72;
    const glowRadius = interpolate(f, [0, 36, 72], [20, 45, 20], { easing: Easing.inOut(Easing.quad) });
    const r = interpolate(f, [0, 36, 72], [255, 249, 255]);
    const g = interpolate(f, [0, 36, 72], [255, 132, 255]);
    const b = interpolate(f, [0, 36, 72], [255, 74, 255]);
    const a = interpolate(f, [0, 36, 72], [0.25, 0.8, 0.25]);

    return {
      borderColor: `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 1)`,
      boxShadow: `0 0 ${glowRadius}px rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`,
    };
  };

  // Shine translate animation inside frames
  const shineX = interpolate(frame % 90, [0, 54, 90], [-100, 200, 200], { easing: Easing.inOut(Easing.quad) });

  // Center circle spin and pulse
  const circleRot = interpolate(frame % 360, [0, 360], [0, 360]);
  const revCircleRot = interpolate(frame % 360, [0, 360], [0, -360]);
  const fCirclePulse = frame % 90;
  const circleGlowRad = interpolate(fCirclePulse, [0, 45, 90], [25, 55, 25], { easing: Easing.inOut(Easing.quad) });
  const circleGlowR = interpolate(fCirclePulse, [0, 45, 90], [255, 249, 255]);
  const circleGlowG = interpolate(fCirclePulse, [0, 45, 90], [255, 132, 255]);
  const circleGlowB = interpolate(fCirclePulse, [0, 45, 90], [255, 74, 255]);
  const circleGlowA = interpolate(fCirclePulse, [0, 45, 90], [0.3, 0.9, 0.3]);
  const circleShadow = `0 0 ${circleGlowRad}px rgba(${Math.round(circleGlowR)}, ${Math.round(circleGlowG)}, ${Math.round(circleGlowB)}, ${circleGlowA})`;

  // Buttons jelly scales
  const getButtonScale = (offset: number) => {
    const f = (frame - offset + 72) % 72;
    const x = interpolate(f, [0, 21.6, 43.2, 72], [1, 1.12, 0.95, 1], { easing: Easing.inOut(Easing.quad) });
    const y = interpolate(f, [0, 21.6, 43.2, 72], [1, 0.88, 1.05, 1], { easing: Easing.inOut(Easing.quad) });
    return { x, y };
  };

  const btnLeftScale = getButtonScale(48);
  const btnRightScale = getButtonScale(54);

  // Subscribe scale and Y bounce
  const subScale = interpolate(frame % 50, [0, 20, 35, 50], [1, 1.14, 0.97, 1], { easing: Easing.inOut(Easing.quad) });
  const subY = interpolate(frame % 50, [0, 20, 35, 50], [0, -6, 0, 0], { easing: Easing.inOut(Easing.quad) });

  // Cursor indicator
  const cursorY = interpolate(frame % 60, [0, 30, 60], [0, -12, 0], { easing: Easing.inOut(Easing.quad) });
  const cursorScale = interpolate(frame % 60, [0, 30, 60], [1, 0.85, 1], { easing: Easing.inOut(Easing.quad) });

  // Progress Bar Width
  const progressWidthPct = (frame / 450) * 100;

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
        background: 'radial-gradient(circle at 50% 38%, #1a5f9e 0%, #0d3f6e 55%, #07294a 100%)',
        fontFamily: "'Arial Black', Arial, sans-serif",
      }}
    >
      {/* Canvas Grid Background */}
      <canvas
        ref={canvasRef}
        width={ORIGINAL_WIDTH}
        height={ORIGINAL_HEIGHT}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
        }}
      />

      {/* Blobs & Corners */}
      {/* Top Left */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          top: -110,
          left: -110,
          transform: `translate(${txA}px, ${tyA}px) rotate(${rotA}deg)`,
        }}
      >
        <div
          style={{
            borderRadius: '50%',
            width: 240,
            height: 240,
            background: 'radial-gradient(circle at 35% 35%, #ff9248, #f3722c)',
            boxShadow: '0 0 60px rgba(243,114,44,.7)',
          }}
        />
      </div>

      {/* Top Right with Ring */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          top: -90,
          right: -90,
          transform: `translate(${txB}px, ${tyB}px) rotate(${rotB}deg)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 300,
            height: 300,
            border: '16px solid #f9844a',
            borderRadius: '50%',
            opacity: 0.9,
          }}
        />
        <div
          style={{
            borderRadius: '50%',
            width: 240,
            height: 240,
            background: 'radial-gradient(circle at 35% 35%, #3b94d4, #1f6bb0)',
          }}
        />
      </div>

      {/* Bottom Left */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          bottom: -110,
          left: -110,
          transform: `translate(${txB}px, ${tyB}px) rotate(${rotB}deg)`,
        }}
      >
        <div
          style={{
            borderRadius: '50%',
            width: 240,
            height: 240,
            background: 'radial-gradient(circle at 35% 35%, #3b94d4, #1f6bb0)',
          }}
        />
      </div>

      {/* Bottom Right */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          bottom: -110,
          right: -110,
          transform: `translate(${txA}px, ${tyA}px) rotate(${rotA}deg)`,
        }}
      >
        <div
          style={{
            borderRadius: '50%',
            width: 240,
            height: 240,
            background: 'radial-gradient(circle at 35% 35%, #ff9248, #f3722c)',
            boxShadow: '0 0 60px rgba(243,114,44,.7)',
          }}
        />
      </div>

      {/* Decor Dots */}
      <div style={{ position: 'absolute', zIndex: 4, display: 'flex', gap: 6, top: 60, left: '38%' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 24,
              background: '#f3722c',
              transform: 'skewX(-20deg)',
              opacity: getBlinkOpacity(i),
            }}
          />
        ))}
      </div>
      <div style={{ position: 'absolute', zIndex: 4, display: 'flex', gap: 6, bottom: 80, right: '36%' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 24,
              background: '#f3722c',
              transform: 'skewX(-20deg)',
              opacity: getBlinkOpacity(i),
            }}
          />
        ))}
      </div>

      {/* Main Title */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          width: '100%',
          textAlign: 'center',
          zIndex: 6,
          fontSize: 104,
          fontWeight: 900,
          fontStyle: 'italic',
          color: '#fff',
          letterSpacing: 2,
          textTransform: 'uppercase',
          textShadow: '4px 4px 0 #f3722c, -1px -1px 0 #277fc4, 0 0 30px rgba(255,255,255,.4)',
          WebkitTextStroke: '1px #0b3a66',
          transform: `translateY(${wiggleY}px) rotate(${wiggleRot}deg)`,
        }}
      >
        {titleText.split('').map((char, i) => {
          const delay = i * 2;
          const f = (frame - delay + 7500) % 75;
          const bounceY = interpolate(f, [0, 37.5, 75], [0, -10, 0], { easing: Easing.inOut(Easing.quad) });
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `translateY(${bounceY}px)`,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>

      {/* Middle Content Row */}
      <div
        style={{
          position: 'absolute',
          top: 346,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1690,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 6,
        }}
      >
        {/* Left Video Frame */}
        <div
          style={{
            width: 558,
            height: 270,
            border: '4px dashed #fff',
            borderRadius: 12,
            background: 'rgba(255,255,255,.07)',
            position: 'relative',
            overflow: 'hidden',
            ...getFrameStyle(0),
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%)',
              transform: `translateX(${shineX}%)`,
            }}
          />
        </div>

        {/* Center Circle Play Button */}
        <div
          style={{
            width: 216,
            height: 216,
            border: '4px dashed #fff',
            borderRadius: '50%',
            background: 'rgba(255,255,255,.08)',
            position: 'relative',
            boxShadow: circleShadow,
            transform: `rotate(${circleRot}deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 58,
              color: '#f9844a',
              textShadow: '0 0 15px #f9844a',
              transform: `rotate(${revCircleRot}deg)`,
            }}
          >
            ▶
          </div>
        </div>

        {/* Right Video Frame */}
        <div
          style={{
            width: 558,
            height: 270,
            border: '4px dashed #fff',
            borderRadius: 12,
            background: 'rgba(255,255,255,.07)',
            position: 'relative',
            overflow: 'hidden',
            ...getFrameStyle(18),
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%)',
              transform: `translateX(${shineX}%)`,
            }}
          />
        </div>
      </div>

      {/* Slanted Buttons */}
      {/* Watch Next */}
      <div
        style={{
          position: 'absolute',
          zIndex: 7,
          color: '#fff',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 29,
          textTransform: 'uppercase',
          padding: '10px 26px',
          borderRadius: '8px 22px 8px 22px',
          background: 'linear-gradient(90deg, #f3722c, #f9844a)',
          boxShadow: '0 0 25px rgba(243,114,44,.6)',
          bottom: '13%',
          left: '5%',
          transformOrigin: 'center center',
          transform: `skewX(-8deg) scale(${btnLeftScale.x}, ${btnLeftScale.y})`,
        }}
      >
        <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>
          Watch Next
        </span>
      </div>

      {/* Recommended */}
      <div
        style={{
          position: 'absolute',
          zIndex: 7,
          color: '#fff',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 29,
          textTransform: 'uppercase',
          padding: '10px 26px',
          borderRadius: '8px 22px 8px 22px',
          background: 'linear-gradient(90deg, #f3722c, #f9844a)',
          boxShadow: '0 0 25px rgba(243,114,44,.6)',
          bottom: '13%',
          right: '5%',
          transformOrigin: 'center center',
          transform: `skewX(-8deg) scale(${btnRightScale.x}, ${btnRightScale.y})`,
        }}
      >
        <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>
          Recommended
        </span>
      </div>

      {/* Subscribe Call to Action */}
      <div
        style={{
          position: 'absolute',
          bottom: '4%',
          left: '50%',
          zIndex: 7,
          color: '#fff',
          fontSize: 61,
          fontWeight: 900,
          fontStyle: 'italic',
          letterSpacing: 3,
          textTransform: 'uppercase',
          textShadow: '3px 3px 0 #f3722c, 0 0 25px rgba(243,114,44,.8)',
          transformOrigin: 'left center',
          transform: `translateX(-50%) skewX(-8deg) scale(${subScale}) translateY(${subY}px)`,
        }}
      >
        Subscribe
      </div>

      {/* Interactive Cursor Simulation */}
      <div
        style={{
          position: 'absolute',
          bottom: '9%',
          left: '50%',
          zIndex: 8,
          fontSize: 46,
          color: '#fff',
          filter: 'drop-shadow(0 0 8px #f9844a)',
          transformOrigin: 'center center',
          transform: `translateX(40%) translateY(${cursorY}px) scale(${cursorScale})`,
        }}
      >
        👆
      </div>

      {/* Progress bar at the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 5,
          background: '#f9844a',
          boxShadow: '0 0 12px #f9844a',
          zIndex: 10,
          width: `${progressWidthPct}%`,
        }}
      />
    </div>
  );
};

export default EndScreenPro;
// END_OF_FILE