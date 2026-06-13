import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const CYAN = '#00e5ff';
const MAGENTA = '#d900ff';
const BG_DEEP = '#05010a';
const BG_LIGHT = '#0a0216';
const PARTICLE_COUNT = 150;

// Pre-calculate all particle data outside component (deterministic, no Math.random in render)
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const seed1 = (i * 7919 + 1) % 1000 / 1000;
  const seed2 = (i * 6271 + 2) % 1000 / 1000;
  const seed3 = (i * 4513 + 3) % 1000 / 1000;
  const seed4 = (i * 3371 + 4) % 1000 / 1000;
  const seed5 = (i * 2357 + 5) % 1000 / 1000;
  const seed6 = (i * 1847 + 6) % 1000 / 1000;
  const seed7 = (i * 9001 + 7) % 1000 / 1000;
  return {
    x: seed1 * ORIGINAL_WIDTH,
    y: seed2 * ORIGINAL_HEIGHT,
    size: seed3 * 1.2 + 0.3,
    color: seed4 > 0.5 ? CYAN : MAGENTA,
    speedX: (seed5 - 0.5) * 0.4,
    speedY: (seed6 - 0.5) * 0.4,
    initialOpacity: seed7,
    fadeDir: seed4 > 0.5 ? 0.01 : -0.01,
  };
});

const CyberpunkUI: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const totalFrames = fps * 20; // 1200 frames at 60fps
  const localFrame = frame % totalFrames;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Vortex rotation angles (frame-locked, seamless loop)
  // v-cyan-1: spin 7s = 420 frames at 60fps
  const cyan1CycleDuration = 7;
  const cyan1LocalFrame = localFrame % (fps * cyan1CycleDuration);
  const cyan1Rotation = interpolate(
    cyan1LocalFrame,
    [0, fps * cyan1CycleDuration],
    [0, 360],
    { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // v-mag-1: spin-reverse 5s = 300 frames
  const mag1CycleDuration = 5;
  const mag1LocalFrame = localFrame % (fps * mag1CycleDuration);
  const mag1Rotation = interpolate(
    mag1LocalFrame,
    [0, fps * mag1CycleDuration],
    [0, -360],
    { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // v-cyan-2: spin 4s = 240 frames
  const cyan2CycleDuration = 4;
  const cyan2LocalFrame = localFrame % (fps * cyan2CycleDuration);
  const cyan2Rotation = interpolate(
    cyan2LocalFrame,
    [0, fps * cyan2CycleDuration],
    [0, 360],
    { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // vortex-core-glow: spin 9s = 540 frames
  const coreGlowCycleDuration = 9;
  const coreGlowLocalFrame = localFrame % (fps * coreGlowCycleDuration);
  const coreGlowRotation = interpolate(
    coreGlowLocalFrame,
    [0, fps * coreGlowCycleDuration],
    [0, 360],
    { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Portal ring pulse glow
  const pulseLocal = localFrame % (fps * 3);
  const portalPulse = interpolate(
    pulseLocal,
    [0, fps * 1.5, fps * 3],
    [0.4, 0.8, 0.4],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const portalInnerPulse = interpolate(
    pulseLocal,
    [0, fps * 1.5, fps * 3],
    [0.4, 0.9, 0.4],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Node glow pulse
  const nodeGlowLocal = localFrame % (fps * 2);
  const nodeGlow = interpolate(
    nodeGlowLocal,
    [0, fps, fps * 2],
    [0.5, 1.0, 0.5],
    { easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Particle canvas rendering - frame-locked
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = ORIGINAL_WIDTH;
    canvas.height = ORIGINAL_HEIGHT;

    ctx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Simulate particle positions deterministically based on localFrame
    PARTICLES.forEach((p) => {
      // Compute position based on frame (deterministic movement, wraps around)
      const totalSeconds = localFrame / fps;
      let x = (p.x + p.speedX * localFrame) % ORIGINAL_WIDTH;
      let y = (p.y + p.speedY * localFrame) % ORIGINAL_HEIGHT;
      if (x < 0) x += ORIGINAL_WIDTH;
      if (y < 0) y += ORIGINAL_HEIGHT;

      // Opacity oscillation - use sine based on frame for determinism
      const opacityCyclePeriod = 60; // frames per opacity cycle
      const opacityPhase = (p.initialOpacity * opacityCyclePeriod + localFrame * (p.fadeDir > 0 ? 1 : -1)) / opacityCyclePeriod;
      const opacity = 0.1 + 0.9 * (0.5 + 0.5 * Math.sin(opacityPhase * Math.PI * 2));

      ctx.globalAlpha = Math.max(0.05, Math.min(1, opacity));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }, [localFrame, fps]);

  const hexSvgDataUri = "data:image/svg+xml,%3Csvg width='40' height='69.28203230275509' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 17.32050807568877l-20 11.547005383792516L0 17.32050807568877V-5.773502691896258l20-11.547005383792516 20 11.547005383792516V17.32050807568877zm0 46.18802153517006l-20 11.547005383792516-20-11.547005383792516V40.414513459481295l20-11.547005383792516 20 11.547005383792516v23.094010767585034z' fill='rgba(0, 229, 255, 0.04)' fill-rule='evenodd'/%3E%3C/svg%3E";

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
        backgroundColor: '#000',
      }}
    >
      {/* UI Container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at center, ${BG_LIGHT} 0%, ${BG_DEEP} 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* bg-hex */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("${hexSvgDataUri}")`,
            backgroundSize: '30px 52px',
            zIndex: 1,
          }}
        />

        {/* bg-lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `repeating-linear-gradient(
              to bottom,
              transparent,
              transparent 49.5%,
              rgba(0, 229, 255, 0.05) 50%,
              transparent 50.5%
            )`,
            backgroundSize: '100% 20px',
            opacity: 0.6,
            zIndex: 2,
          }}
        />

        {/* Particles canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            zIndex: 3,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6% 8%',
            boxSizing: 'border-box',
          }}
        >
          {/* Left Panel */}
          <div
            style={{
              width: '44%',
              height: '85%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-evenly',
            }}
          >
            {/* Cyber Box 1 */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: 4,
                border: '2px solid transparent',
                background: `linear-gradient(${BG_DEEP}, ${BG_DEEP}) padding-box, linear-gradient(135deg, ${CYAN} 0%, ${MAGENTA} 100%) border-box`,
                boxShadow: `0 0 10px rgba(0, 229, 255, ${0.2 * nodeGlow}), inset 0 0 15px rgba(217, 0, 255, 0.1)`,
                overflow: 'hidden',
              }}
            >
              {/* node n-top pos-tl-h (cyan) */}
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: '8%',
                  width: 12,
                  height: 2,
                  background: CYAN,
                  boxShadow: `0 0 ${8 * nodeGlow}px ${CYAN}`,
                  zIndex: 2,
                }}
              />
              {/* node n-left pos-tl-v (cyan) */}
              <div
                style={{
                  position: 'absolute',
                  top: '15%',
                  left: -2,
                  width: 2,
                  height: 12,
                  background: CYAN,
                  boxShadow: `0 0 ${8 * nodeGlow}px ${CYAN}`,
                  zIndex: 2,
                }}
              />
              {/* node n-bottom pos-br-h magenta */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: '8%',
                  width: 12,
                  height: 2,
                  background: MAGENTA,
                  boxShadow: `0 0 ${8 * nodeGlow}px ${MAGENTA}`,
                  zIndex: 2,
                }}
              />
              {/* node n-right pos-br-v magenta */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '15%',
                  right: -2,
                  width: 2,
                  height: 12,
                  background: MAGENTA,
                  boxShadow: `0 0 ${8 * nodeGlow}px ${MAGENTA}`,
                  zIndex: 2,
                }}
              />
            </div>

            {/* Cyber Box 2 */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: 4,
                border: '2px solid transparent',
                background: `linear-gradient(${BG_DEEP}, ${BG_DEEP}) padding-box, linear-gradient(135deg, ${CYAN} 0%, ${MAGENTA} 100%) border-box`,
                boxShadow: `0 0 10px rgba(0, 229, 255, ${0.2 * nodeGlow}), inset 0 0 15px rgba(217, 0, 255, 0.1)`,
                overflow: 'hidden',
              }}
            >
              {/* node n-top pos-tl-h (cyan) */}
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: '8%',
                  width: 12,
                  height: 2,
                  background: CYAN,
                  boxShadow: `0 0 ${8 * nodeGlow}px ${CYAN}`,
                  zIndex: 2,
                }}
              />
              {/* node n-left pos-tl-v (cyan) */}
              <div
                style={{
                  position: 'absolute',
                  top: '15%',
                  left: -2,
                  width: 2,
                  height: 12,
                  background: CYAN,
                  boxShadow: `0 0 ${8 * nodeGlow}px ${CYAN}`,
                  zIndex: 2,
                }}
              />
              {/* node n-bottom pos-br-h magenta */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: '8%',
                  width: 12,
                  height: 2,
                  background: MAGENTA,
                  boxShadow: `0 0 ${8 * nodeGlow}px ${MAGENTA}`,
                  zIndex: 2,
                }}
              />
              {/* node n-right pos-br-v magenta */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '15%',
                  right: -2,
                  width: 2,
                  height: 12,
                  background: MAGENTA,
                  boxShadow: `0 0 ${8 * nodeGlow}px ${MAGENTA}`,
                  zIndex: 2,
                }}
              />
            </div>
          </div>

          {/* Right Panel */}
          <div
            style={{
              width: '45%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Portal Wrapper */}
            <div
              style={{
                width: '90%',
                aspectRatio: '1 / 1',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* portal-outer-glow */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, transparent 50%, rgba(0, 229, 255, 0.1) 65%, transparent 75%)',
                  position: 'absolute',
                }}
              />

              {/* portal-ring */}
              <div
                style={{
                  width: '90%',
                  height: '90%',
                  borderRadius: '50%',
                  border: '2px solid transparent',
                  background: `linear-gradient(${BG_DEEP}, ${BG_DEEP}) padding-box, linear-gradient(135deg, ${CYAN} 20%, ${MAGENTA} 80%) border-box`,
                  boxShadow: `0 0 20px rgba(0, 229, 255, ${portalPulse}), inset 0 0 25px rgba(217, 0, 255, ${portalInnerPulse})`,
                  position: 'absolute',
                  zIndex: 5,
                }}
              />

              {/* vortex-core-glow */}
              <div
                style={{
                  width: '105%',
                  height: '105%',
                  position: 'absolute',
                  background: `conic-gradient(from ${coreGlowRotation}deg, transparent 0%, rgba(0, 229, 255, 0.25) 15%, transparent 30%, rgba(217, 0, 255, 0.25) 60%, transparent 80%)`,
                  borderRadius: '50%',
                  filter: 'blur(12px)',
                }}
              />

              {/* vortex-layer v-cyan-1 */}
              <div
                style={{
                  position: 'absolute',
                  width: '85%',
                  height: '85%',
                  border: `3px solid ${CYAN}`,
                  filter: 'blur(4px)',
                  borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                  mixBlendMode: 'screen',
                  opacity: 0.8,
                  transform: `rotate(${cyan1Rotation}deg)`,
                }}
              />

              {/* vortex-layer v-mag-1 */}
              <div
                style={{
                  position: 'absolute',
                  width: '75%',
                  height: '75%',
                  border: `4px solid ${MAGENTA}`,
                  filter: 'blur(5px)',
                  borderRadius: '50% 50% 30% 70% / 60% 40% 70% 30%',
                  mixBlendMode: 'screen',
                  opacity: 0.8,
                  transform: `rotate(${mag1Rotation}deg)`,
                }}
              />

              {/* vortex-layer v-cyan-2 */}
              <div
                style={{
                  position: 'absolute',
                  width: '65%',
                  height: '65%',
                  border: `2px solid ${CYAN}`,
                  filter: 'blur(3px)',
                  borderRadius: '60% 40% 50% 50% / 30% 60% 40% 70%',
                  mixBlendMode: 'screen',
                  opacity: 0.8,
                  transform: `rotate(${cyan2Rotation}deg)`,
                }}
              />

              {/* vortex-blackhole */}
              <div
                style={{
                  width: '55%',
                  height: '55%',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, #000000 40%, ${BG_DEEP} 70%, transparent 100%)`,
                  position: 'absolute',
                  zIndex: 4,
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,1)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberpunkUI;
// END_OF_FILE