import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// Constant dimensions
const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic particle generation for perfect 3D ambient particle loop
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
}

const PARTICLE_COUNT = 120;
const PARTICLES: Particle[] = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  // Use pseudo-random values generated with a deterministic sine-based hash
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  return {
    id: i,
    x: pseudoRandom(i * 1.5) * ORIGINAL_WIDTH,
    y: pseudoRandom(i * 2.5) * ORIGINAL_HEIGHT,
    size: pseudoRandom(i * 3.5) * 4 + 2, // Sizes 2px to 6px
    speed: pseudoRandom(i * 4.5) * 1.2 + 0.6, // Vertical float speed
    drift: pseudoRandom(i * 5.5) * Math.PI * 2, // Phase offset for horizontal sway
    opacity: pseudoRandom(i * 6.5) * 0.5 + 0.3,
  };
});

const LuxuryEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // 10-second loop duration (300 frames at 30fps)
  const loopDuration = 300;
  const localFrame = frame % loopDuration;

  // 4K Auto-Fit Landscape Scaling
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  // 1. Continuous Ambient Floating for Video Boxes (Phase staggered)
  const leftFloatY = Math.sin((localFrame / loopDuration) * Math.PI * 4) * 8;
  const rightFloatY = Math.sin(((localFrame + 75) / loopDuration) * Math.PI * 4) * 8;

  // 2. Subscribe Circle Breathing (Perfect seamless sine loop)
  const breatheScale = interpolate(
    Math.sin((localFrame / loopDuration) * Math.PI * 8),
    [-1, 1],
    [1.0, 1.03]
  );
  
  const breatheGlow = interpolate(
    Math.sin((localFrame / loopDuration) * Math.PI * 8),
    [-1, 1],
    [40, 65]
  );

  // 3. Rotating Inner Ring (Completes 1 full turn per loop for seamlessness)
  const ringRotation = interpolate(localFrame, [0, loopDuration], [0, 360]);

  // 4. Cinematic Spotlights Shimmer (replicating Three.js movement)
  const light1X = interpolate(
    Math.sin((localFrame / loopDuration) * Math.PI * 2),
    [-1, 1],
    [200, 800]
  );
  const light1Y = interpolate(
    Math.cos((localFrame / loopDuration) * Math.PI * 2),
    [-1, 1],
    [100, 500]
  );
  const light2X = interpolate(
    Math.cos((localFrame / loopDuration) * Math.PI * 4),
    [-1, 1],
    [1100, 1700]
  );
  const light2Y = interpolate(
    Math.sin((localFrame / loopDuration) * Math.PI * 4),
    [-1, 1],
    [300, 800]
  );

  // 5. CSS Light Sweep over video placeholders (starts at frame 30, ends at frame 135)
  // Both start/end values are off-screen (-100% to 250%) to ensure absolute seamless loops
  const sweepX = interpolate(
    localFrame,
    [30, 135],
    [-100, 250],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#050505',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        id="endscreen-container"
        style={{
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          backgroundColor: '#000000',
          position: 'absolute',
          overflow: 'hidden',
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Cinematic WebGL Replica Background (HTML5 Canvas/SVG Hybrid Spotlights & Floor) */}
        <div
          id="webgl-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            background: 'radial-gradient(circle at 50% 120%, #151005 0%, #000000 70%)',
          }}
        >
          {/* Animated Cinematic Lights */}
          <div
            style={{
              position: 'absolute',
              width: 1000,
              height: 1000,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(0,0,0,0) 70%)',
              left: light1X - 500,
              top: light1Y - 500,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 900,
              height: 900,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, rgba(0,0,0,0) 70%)',
              left: light2X - 450,
              top: light2Y - 450,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          />

          {/* 3D Glossy Reflective Floor (Bottom perspective) */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: 400,
              background: 'linear-gradient(to top, rgba(15, 12, 5, 0.5) 0%, rgba(0,0,0,0) 100%)',
              borderTop: '1px solid rgba(212, 175, 55, 0.08)',
              perspective: '500px',
              transform: 'rotateX(60deg)',
              transformOrigin: 'bottom center',
              zIndex: 1,
            }}
          />

          {/* Luxury Floating Particles */}
          <svg
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
            <defs>
              <radialGradient id="particleGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
                <stop offset="30%" stopColor="#d4af37" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
              </radialGradient>
            </defs>
            {PARTICLES.map((p) => {
              // Calculate upward vertical movement loop
              const yOffset = (localFrame * p.speed) % ORIGINAL_HEIGHT;
              const currentY = (p.y - yOffset + ORIGINAL_HEIGHT) % ORIGINAL_HEIGHT;

              // Left-right horizontal sway loop
              const swayProgress = (localFrame / loopDuration) * Math.PI * 2;
              const currentX = (p.x + Math.sin(swayProgress + p.drift) * 40) % ORIGINAL_WIDTH;

              // Symmetrical edge fading to guarantee seamless loop pops avoidance
              const topFadeRange = 150;
              const bottomFadeRange = 150;
              let edgeOpacity = 1;
              if (currentY < topFadeRange) {
                edgeOpacity = currentY / topFadeRange;
              } else if (currentY > ORIGINAL_HEIGHT - bottomFadeRange) {
                edgeOpacity = (ORIGINAL_HEIGHT - currentY) / bottomFadeRange;
              }

              const finalOpacity = p.opacity * edgeOpacity;

              return (
                <circle
                  key={p.id}
                  cx={currentX}
                  cy={currentY}
                  r={p.size}
                  fill="url(#particleGrad)"
                  opacity={finalOpacity}
                />
              );
            })}
          </svg>
        </div>

        {/* Cinematic Vignette Overlay */}
        <div
          className="vignette"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.85) 80%, #000000 100%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Dynamic UI Layer */}
        <div
          id="ui-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {/* Left Video Box */}
          <div
            className="video-box left"
            style={{
              position: 'absolute',
              width: 610,
              height: 343,
              top: 368,
              left: 160,
              borderRadius: 12,
              backgroundColor: 'rgba(10, 8, 5, 0.45)',
              border: '1.5px solid rgba(212, 175, 55, 0.5)',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.15), inset 0 0 20px rgba(212, 175, 55, 0.1)',
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
              transform: `translateY(${leftFloatY}px)`,
            }}
          >
            {/* Glossy Light Sweep */}
            <div
              className="sweep"
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(to right, transparent 45%, rgba(212, 175, 55, 0.25) 50%, transparent 55%)',
                transform: `rotate(45deg) translateX(${sweepX}%)`,
                zIndex: 4,
              }}
            />
          </div>

          {/* Centered Subscribe Circle */}
          <div
            className="subscribe-circle"
            style={{
              position: 'absolute',
              width: 240,
              height: 240,
              top: 420,
              left: 840,
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, rgba(5, 5, 5, 0.85) 75%)',
              border: '2px solid rgba(212, 175, 55, 0.8)',
              boxShadow: `0 0 ${breatheGlow}px rgba(212, 175, 55, 0.4), inset 0 0 30px rgba(212, 175, 55, 0.25)`,
              transform: `scale(${breatheScale})`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Rotating Decorative Inner Ring */}
            <div
              className="subscribe-inner-ring"
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                right: 10,
                bottom: 10,
                borderRadius: '50%',
                border: '1px dashed rgba(212, 175, 55, 0.4)',
                transform: `rotate(${ringRotation}deg)`,
              }}
            />
            
            {/* Luxury Minimalist Crown Icon / Centerpiece Emblem */}
            <svg
              viewBox="0 0 24 24"
              style={{
                width: 55,
                height: 55,
                fill: 'none',
                stroke: 'rgba(212, 175, 55, 0.95)',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                zIndex: 5,
                filter: 'drop-shadow(0px 0px 8px rgba(212, 175, 55, 0.6))',
              }}
            >
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
              <path d="M3 20h18" />
            </svg>
          </div>

          {/* Right Video Box */}
          <div
            className="video-box right"
            style={{
              position: 'absolute',
              width: 610,
              height: 343,
              top: 368,
              right: 160,
              borderRadius: 12,
              backgroundColor: 'rgba(10, 8, 5, 0.45)',
              border: '1.5px solid rgba(212, 175, 55, 0.5)',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.15), inset 0 0 20px rgba(212, 175, 55, 0.1)',
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
              transform: `translateY(${rightFloatY}px)`,
            }}
          >
            {/* Glossy Light Sweep */}
            <div
              className="sweep"
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(to right, transparent 45%, rgba(212, 175, 55, 0.25) 50%, transparent 55%)',
                transform: `rotate(45deg) translateX(${sweepX}%)`,
                zIndex: 4,
              }}
            />
          </div>

          {/* Glowing Premium Ambient Hint Text (Standardized minimal lettering for commercial look) */}
          <div
            className="hint-text"
            style={{
              position: 'absolute',
              bottom: 120,
              width: '100%',
              textAlign: 'center',
              color: 'rgba(212, 175, 55, 0.75)',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: 14,
              fontWeight: 300,
              letterSpacing: 8,
              textTransform: 'uppercase',
              filter: 'drop-shadow(0px 0px 10px rgba(212, 175, 55, 0.3))',
            }}
          >
            Thank You For Watching
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuxuryEndscreen;
// END_OF_FILE