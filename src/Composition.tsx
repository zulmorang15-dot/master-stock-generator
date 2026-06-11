import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// ==========================================
// STATIC DETERMINISTIC PARTICLES (Pre-calculated)
// ==========================================
const PARTICLE_COUNT = 150;
const SEED_PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  // Deterministic pseudo-random generation based on index to avoid Math.random() in render
  const xSeed = Math.sin(i * 12.9898) * 43758.5453;
  const ySeed = Math.cos(i * 78.233) * 43758.5453;
  const speedSeed = Math.sin(i * 45.123) * 43758.5453;
  const sizeSeed = Math.cos(i * 92.456) * 43758.5453;

  return {
    startX: Math.abs(xSeed % 1) * 1920,
    startY: Math.abs(ySeed % 1) * 1080,
    speed: 0.8 + Math.abs(speedSeed % 1) * 1.5,
    size: 2 + Math.abs(sizeSeed % 1) * 5,
    opacity: 0.15 + Math.abs(speedSeed % 1) * 0.6,
    phase: Math.abs(ySeed % 1) * Math.PI * 2,
    amplitude: 15 + Math.abs(xSeed % 1) * 30,
    frequency: 1 + Math.floor(Math.abs(sizeSeed % 1) * 3),
  };
});

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const LuxuryBlackGoldEndscreen = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // 10-second seamless loop setup (300 frames)
  const loopDuration = 300;
  const localFrame = frame % loopDuration;

  // 4K Auto-Fit Landscape Scaling
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  // --- Particle Loop Math ---
  const particles = SEED_PARTICLES.map((p) => {
    // Perfect seamless loop over 300 frames
    // travelDistance is a multiple of 1080 to ensure seamless wrap-around
    const travelDistance = 1080; 
    const progress = localFrame / loopDuration;
    const currentY = (p.startY - progress * travelDistance + 1080) % 1080;
    
    // Swaying X motion (perfect seamless sine loop)
    const sway = Math.sin(progress * Math.PI * 2 * p.frequency + p.phase) * p.amplitude;
    const currentX = (p.startX + sway) % 1920;

    return {
      x: currentX,
      y: currentY,
      size: p.size,
      opacity: p.opacity,
    };
  });

  // --- Animation Timelines ---

  // 1. Video Boxes Hover Floating (5s / 150 frames period - fits twice in 10s loop)
  const floatOffsetLeft = Math.sin((localFrame / 150) * Math.PI * 2) * 8;
  const floatOffsetRight = Math.cos((localFrame / 150) * Math.PI * 2) * 8;

  // 2. Subscribe Circle Breathing (2.5s / 75 frames period - fits 4 times in 10s loop)
  const breatheProgress = Math.sin((localFrame / 75) * Math.PI * 2);
  const circleScale = interpolate(breatheProgress, [-1, 1], [0.98, 1.03]);
  const circleGlow = interpolate(breatheProgress, [-1, 1], [30, 60]);

  // 3. Rotating Inner Ring (10s continuous rotation)
  const ringRotation = (localFrame / loopDuration) * 360;

  // 4. Ambient Sweep Effect over Videos (5s / 150 frames period)
  const sweepProgress = localFrame % 150;
  // Sweep runs for 105 frames (3.5s) and rests for 45 frames (1.5s)
  const sweepX = interpolate(
    sweepProgress, 
    [0, 105], 
    [-100, 250], 
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );

  // 5. Ambient text pulse
  const textOpacity = interpolate(
    Math.sin((localFrame / 100) * Math.PI * 2),
    [-1, 1],
    [0.4, 0.8]
  );

  return (
    <div
      style={{
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        backgroundColor: '#050505',
        position: 'absolute',
        top: '50%',
        left: '50%',
        overflow: 'hidden',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
      }}
    >
      {/* Dynamic Floor Grid & Ambient Reflection Simulation */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '40%',
          background: 'linear-gradient(to top, rgba(15, 12, 5, 0.6) 0%, rgba(5, 5, 5, 0) 100%)',
          zIndex: 1,
        }}
      />

      {/* Luxury Deterministic Particles Layer */}
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
          <radialGradient id="particleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
            <stop offset="40%" stopColor="#d4af37" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </radialGradient>
        </defs>
        {particles.map((particle, index) => (
          <circle
            key={index}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            fill="url(#particleGlow)"
            style={{ opacity: particle.opacity }}
          />
        ))}
      </svg>

      {/* Vignette Layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.85) 80%, #000000 100%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* UI Layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      >
        {/* Left Video Box */}
        <div
          style={{
            position: 'absolute',
            width: '610px',
            height: '343px',
            top: '368px',
            left: '160px',
            borderRadius: '12px',
            background: 'rgba(10, 8, 5, 0.45)',
            border: '1.5px solid rgba(212, 175, 55, 0.5)',
            boxShadow: `0 0 30px rgba(212, 175, 55, 0.15), inset 0 0 20px rgba(212, 175, 55, 0.1)`,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
            transform: `translateY(${floatOffsetLeft}px)`,
          }}
        >
          {/* Sweep Light Effect */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(to right, transparent 45%, rgba(212, 175, 55, 0.25) 50%, transparent 55%)',
              transform: `rotate(45deg) translateX(${sweepX}%)`,
            }}
          />
        </div>

        {/* Center Subscribe Circle */}
        <div
          style={{
            position: 'absolute',
            width: '240px',
            height: '240px',
            top: '420px',
            left: '840px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.12) 0%, rgba(5, 5, 5, 0.9) 70%)',
            border: '2px solid rgba(212, 175, 55, 0.8)',
            boxShadow: `0 0 ${circleGlow}px rgba(212, 175, 55, 0.35), inset 0 0 30px rgba(212, 175, 55, 0.2)`,
            transform: `scale(${circleScale})`,
          }}
        >
          {/* Rotating Inner Ring */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              bottom: '10px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(212, 175, 55, 0.4)',
              transform: `rotate(${ringRotation}deg)`,
            }}
          />
        </div>

        {/* Right Video Box */}
        <div
          style={{
            position: 'absolute',
            width: '610px',
            height: '343px',
            top: '368px',
            right: '160px',
            borderRadius: '12px',
            background: 'rgba(10, 8, 5, 0.45)',
            border: '1.5px solid rgba(212, 175, 55, 0.5)',
            boxShadow: `0 0 30px rgba(212, 175, 55, 0.15), inset 0 0 20px rgba(212, 175, 55, 0.1)`,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
            transform: `translateY(${floatOffsetRight}px)`,
          }}
        >
          {/* Sweep Light Effect */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(to right, transparent 45%, rgba(212, 175, 55, 0.25) 50%, transparent 55%)',
              transform: `rotate(45deg) translateX(${sweepX}%)`,
            }}
          />
        </div>

        {/* Bottom Ambient Hint Text */}
        <div
          style={{
            position: 'absolute',
            bottom: '120px',
            width: '100%',
            textAlign: 'center',
            color: 'rgba(212, 175, 55, 0.7)',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: '14px',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          Thanks For Watching
        </div>
      </div>
    </div>
  );
};

export default LuxuryBlackGoldEndscreen;
// END_OF_FILE