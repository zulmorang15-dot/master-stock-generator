import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic static particles generated outside the component
const PARTICLE_COUNT = 80;
const STATIC_PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const seed = Math.sin(i + 1) * 10000;
  const x = Math.floor(((seed * 1.5) % 1) * ORIGINAL_WIDTH);
  const y = Math.floor(((seed * 2.8) % 1) * ORIGINAL_HEIGHT);
  const size = ((seed * 3.7) % 1) * 3 + 2;
  const speedY = -(((seed * 4.2) % 1) * 0.8 + 0.4);
  const speedX = (((seed * 5.9) % 1) - 0.5) * 0.3;
  const opacity = ((seed * 7.1) % 1) * 0.5 + 0.3;
  return { x, y, size, speedY, speedX, opacity };
});

export const CyberpunkGamingEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // 10-second seamless loop logic (300 frames at 30fps)
  const durationFrames = fps * 10;
  const localFrame = frame % durationFrames;

  // Auto-fit 4K Landscape Scaling
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  // Safe Input Props
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'NEXT VIDEO';
  const keywordsList = (inputProps.keywords || 'gaming, neon, cyberpunk, loop').split(',');

  // --- Animation Oscillations (Deterministic Sine Waves) ---
  const pulseFast = Math.sin((localFrame * Math.PI * 2) / (fps * 2)); // 2s cycle
  const pulseMedium = Math.sin((localFrame * Math.PI * 2) / (fps * 3)); // 3s cycle
  const pulseSlow = Math.sin((localFrame * Math.PI * 2) / (fps * 4)); // 4s cycle

  // Left Placeholder (Floating & Glow Pulse)
  const leftFloatY = interpolate(pulseMedium, [-1, 1], [-10, 10]);
  const leftGlowRadius = interpolate(pulseFast, [-1, 1], [15, 35]);
  const leftGlowOpacity = interpolate(pulseFast, [-1, 1], [0.3, 0.6]);

  // Right Placeholder (Floating offset & Glow Pulse offset)
  const rightFloatY = interpolate(Math.sin(((localFrame + 45) * Math.PI * 2) / (fps * 3)), [-1, 1], [-10, 10]);
  const rightGlowRadius = interpolate(Math.sin(((localFrame + 30) * Math.PI * 2) / (fps * 2)), [-1, 1], [15, 35]);

  // Subscribe Center Glow & Float
  const subFloatY = interpolate(pulseSlow, [-1, 1], [-6, 6]);
  const subGlowRadius = interpolate(pulseFast, [-1, 1], [30, 60]);

  // Rings Rotation (0 to 360 degrees over 300 frames)
  const innerRingRotate = interpolate(localFrame, [0, durationFrames], [0, 360]);
  const outerRingRotate = interpolate(localFrame, [0, durationFrames], [360, 0]);

  // HUD Line Ambient Pulsing
  const hudOpacity = interpolate(pulseSlow, [-1, 1], [0.3, 0.7]);

  // Infinite Grid Movement (Offset to simulate traveling forward)
  const gridOffset = interpolate(localFrame % (fps * 2), [0, fps * 2], [0, 80], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        backgroundColor: '#030008',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Scaling Wrapper */}
      <div
        style={{
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          position: 'absolute',
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'center center',
          background: 'radial-gradient(circle at center, transparent 0%, #030008 100%)',
        }}
      >
        {/* --- PROCEDURAL CYBERPUNK 3D GRID FLOOR & CEILING --- */}
        <div
          style={{
            position: 'absolute',
            width: '3000px',
            height: '1500px',
            bottom: '-450px',
            left: '-540px',
            backgroundImage: `
              linear-gradient(to right, rgba(0, 243, 255, 0.15) 2px, transparent 2px),
              linear-gradient(to bottom, rgba(0, 243, 255, 0.15) 2px, transparent 2px)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: `0px ${gridOffset}px`,
            transform: 'perspective(450px) rotateX(80deg)',
            transformOrigin: 'center top',
            opacity: 0.8,
            maskImage: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,1) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,1) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: '3000px',
            height: '1500px',
            top: '-450px',
            left: '-540px',
            backgroundImage: `
              linear-gradient(to right, rgba(188, 19, 254, 0.12) 2px, transparent 2px),
              linear-gradient(to bottom, rgba(188, 19, 254, 0.12) 2px, transparent 2px)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: `0px ${-gridOffset}px`,
            transform: 'perspective(450px) rotateX(-80deg)',
            transformOrigin: 'center bottom',
            opacity: 0.8,
            maskImage: 'linear-gradient(to top, transparent 20%, rgba(0,0,0,1) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent 20%, rgba(0,0,0,1) 100%)',
          }}
        />

        {/* --- CINEMATIC FOG PARTICLES --- */}
        {STATIC_PARTICLES.map((p, idx) => {
          // Frame-locked deterministic movement with flawless loop wrap-around
          const rawY = p.y + p.speedY * localFrame;
          const currentY = ((rawY % ORIGINAL_HEIGHT) + ORIGINAL_HEIGHT) % ORIGINAL_HEIGHT;
          const rawX = p.x + p.speedX * localFrame;
          const currentX = ((rawX % ORIGINAL_WIDTH) + ORIGINAL_WIDTH) % ORIGINAL_WIDTH;

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: currentX,
                top: currentY,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: '#00f3ff',
                opacity: p.opacity,
                boxShadow: '0 0 10px #00f3ff',
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {/* --- SCANLINE & CRT GLOW OVERLAY --- */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            zIndex: 2,
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              rgba(0, 243, 255, 0.03) 0px,
              rgba(0, 243, 255, 0.03) 2px,
              transparent 2px,
              transparent 4px
            )`,
            pointerEvents: 'none',
            boxShadow: 'inset 0 0 150px rgba(188, 19, 254, 0.15)',
          }}
        />

        {/* --- HUD DECORATIVE LINES --- */}
        <div
          style={{
            position: 'absolute',
            background: '#00f3ff',
            boxShadow: '0 0 10px #00f3ff',
            opacity: hudOpacity,
            top: '120px',
            left: '160px',
            width: '1600px',
            height: '1px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            background: '#00f3ff',
            boxShadow: '0 0 10px #00f3ff',
            opacity: hudOpacity,
            bottom: '120px',
            left: '160px',
            width: '1600px',
            height: '1px',
          }}
        />

        {/* HUD Dots */}
        <div style={{ position: 'absolute', width: '4px', height: '4px', backgroundColor: '#bc13fe', boxShadow: '0 0 8px #bc13fe', borderRadius: '50%', top: '118px', left: '160px' }} />
        <div style={{ position: 'absolute', width: '4px', height: '4px', backgroundColor: '#bc13fe', boxShadow: '0 0 8px #bc13fe', borderRadius: '50%', top: '118px', right: '160px' }} />
        <div style={{ position: 'absolute', width: '4px', height: '4px', backgroundColor: '#bc13fe', boxShadow: '0 0 8px #bc13fe', borderRadius: '50%', bottom: '118px', left: '160px' }} />
        <div style={{ position: 'absolute', width: '4px', height: '4px', backgroundColor: '#bc13fe', boxShadow: '0 0 8px #bc13fe', borderRadius: '50%', bottom: '118px', right: '160px' }} />

        {/* --- PLACEHOLDER LEFT --- */}
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            width: '640px',
            height: '360px',
            top: '360px',
            left: '160px',
            background: 'rgba(0, 15, 30, 0.6)',
            border: '2px solid #00f3ff',
            borderRadius: '12px',
            boxShadow: `0 0 ${leftGlowRadius}px rgba(0, 243, 255, ${leftGlowOpacity}), inset 0 0 25px rgba(0, 243, 255, 0.15)`,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            transform: `translateY(${leftFloatY}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: `
                linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              backgroundPosition: 'center center',
              opacity: 0.3,
            }}
          />
          {/* Tech Corners */}
          <div style={{ position: 'absolute', width: '30px', height: '30px', border: '2px solid #fff', opacity: 0.8, pointerEvents: 'none', top: '-2px', left: '-2px', borderRight: 'none', borderBottom: 'none', borderRadius: '12px 0 0 0', borderColor: '#bc13fe' }} />
          <div style={{ position: 'absolute', width: '30px', height: '30px', border: '2px solid #fff', opacity: 0.8, pointerEvents: 'none', top: '-2px', right: '-2px', borderLeft: 'none', borderBottom: 'none', borderRadius: '0 12px 0 0', borderColor: '#bc13fe' }} />
          <div style={{ position: 'absolute', width: '30px', height: '30px', border: '2px solid #fff', opacity: 0.8, pointerEvents: 'none', bottom: '-2px', left: '-2px', borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 12px', borderColor: '#bc13fe' }} />
          <div style={{ position: 'absolute', width: '30px', height: '30px', border: '2px solid #fff', opacity: 0.8, pointerEvents: 'none', bottom: '-2px', right: '-2px', borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 12px 0', borderColor: '#bc13fe' }} />
        </div>

        {/* --- PLACEHOLDER RIGHT --- */}
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            width: '640px',
            height: '360px',
            top: '360px',
            right: '160px',
            background: 'rgba(0, 15, 30, 0.6)',
            border: '2px solid #00f3ff',
            borderRadius: '12px',
            boxShadow: `0 0 ${rightGlowRadius}px rgba(0, 243, 255, 0.45), inset 0 0 25px rgba(0, 243, 255, 0.15)`,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            transform: `translateY(${rightFloatY}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: `
                linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              backgroundPosition: 'center center',
              opacity: 0.3,
            }}
          />
          {/* Tech Corners */}
          <div style={{ position: 'absolute', width: '30px', height: '30px', border: '2px solid #fff', opacity: 0.8, pointerEvents: 'none', top: '-2px', left: '-2px', borderRight: 'none', borderBottom: 'none', borderRadius: '12px 0 0 0', borderColor: '#bc13fe' }} />
          <div style={{ position: 'absolute', width: '30px', height: '30px', border: '2px solid #fff', opacity: 0.8, pointerEvents: 'none', top: '-2px', right: '-2px', borderLeft: 'none', borderBottom: 'none', borderRadius: '0 12px 0 0', borderColor: '#bc13fe' }} />
          <div style={{ position: 'absolute', width: '30px', height: '30px', border: '2px solid #fff', opacity: 0.8, pointerEvents: 'none', bottom: '-2px', left: '-2px', borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 12px', borderColor: '#bc13fe' }} />
          <div style={{ position: 'absolute', width: '30px', height: '30px', border: '2px solid #fff', opacity: 0.8, pointerEvents: 'none', bottom: '-2px', right: '-2px', borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 12px 0', borderColor: '#bc13fe' }} />
        </div>

        {/* --- SUBSCRIBE CENTER AREA --- */}
        <div
          style={{
            position: 'absolute',
            zIndex: 15,
            top: '415px',
            left: '835px',
            width: '250px',
            height: '250px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: `translateY(${subFloatY}px)`,
          }}
        >
          {/* Outer Rotating Ring */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: '240px',
              height: '240px',
              border: '2px solid transparent',
              borderLeft: '2px dashed #bc13fe',
              borderRight: '2px dashed #bc13fe',
              boxShadow: '-10px 0 20px rgba(188, 19, 254, 0.2)',
              zIndex: 18,
              transform: `rotate(${outerRingRotate}deg)`,
            }}
          />

          {/* Inner Rotating Ring */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: '210px',
              height: '210px',
              border: '2px solid transparent',
              borderTop: '2px solid #00f3ff',
              borderBottom: '2px solid #00f3ff',
              boxShadow: '0 10px 20px rgba(0, 243, 255, 0.2)',
              zIndex: 19,
              transform: `rotate(${innerRingRotate}deg)`,
            }}
          />

          {/* Neon Purple Center Circle */}
          <div
            style={{
              width: '180px',
              height: '180px',
              background: 'rgba(20, 0, 40, 0.7)',
              border: '2px solid #bc13fe',
              borderRadius: '50%',
              boxShadow: `0 0 ${subGlowRadius}px rgba(188, 19, 254, 0.65), inset 0 0 40px rgba(188, 19, 254, 0.3)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              position: 'relative',
              zIndex: 20,
            }}
          />
        </div>

        {/* --- DYNAMIC TEXT OVERLAY & GLASSMORPHIC BADGES --- */}
        <div
          style={{
            position: 'absolute',
            bottom: '150px',
            left: '160px',
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
              fontSize: '48px',
              color: '#ffffff',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(0, 243, 255, 0.8), 0 0 20px rgba(0, 243, 255, 0.5)',
            }}
          >
            {judul}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {keywordsList.map((tag, i) => (
              <span
                key={i}
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#00f3ff',
                  textTransform: 'uppercase',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(0, 243, 255, 0.08)',
                  border: '1px solid rgba(0, 243, 255, 0.25)',
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)',
                  letterSpacing: '1px',
                }}
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberpunkGamingEndscreen;
// END_OF_FILE