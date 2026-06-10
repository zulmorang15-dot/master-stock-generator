import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Seeded deterministic particle parameters calculated outside the component render to avoid Math.random() runtime bugs
const PARTICLE_COUNT = 100;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const x = ((i * 19) + 43) % 1920;
  const y = ((i * 31) + 97) % 1080;
  const size = 1.5 + ((i * 7) % 3);
  const speedY = 0.3 + ((i * 13) % 4) * 0.15;
  const opacity = 0.2 + ((i * 3) % 5) * 0.12;
  return { x, y, size, speedY, opacity };
});

const CyberpunkGamingEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // 10-second seamless loop safety (300 frames at 30fps)
  const totalFrames = 300;
  const localFrame = frame % totalFrames;

  // Auto-fit 4K / HD Landscape scaling
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  // Motion Mapping & Interpolations matching the GSAP easing exactly
  
  // 1. Grid movement speed
  const gridScrollFloor = interpolate(localFrame % 30, [0, 30], [0, 80], {
    easing: Easing.linear,
  });
  const gridScrollCeiling = interpolate(localFrame % 30, [0, 30], [80, 0], {
    easing: Easing.linear,
  });

  // 2. Placeholder floating
  const leftYOffset = interpolate(localFrame % 150, [0, 75, 150], [0, -10, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const rightYOffset = interpolate((localFrame + 75) % 150, [0, 75, 150], [0, -10, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  // 3. Placeholder Neon Glow Pulse (Electric Blue)
  const pulseVal = interpolate(localFrame % 75, [0, 37.5, 75], [0.3, 0.7, 0.3], {
    easing: Easing.inOut(Easing.quad),
  });
  const borderPulseColor = `rgba(0, 243, 255, ${interpolate(pulseVal, [0.3, 0.7], [0.6, 1.0])})`;
  const placeholderBoxShadow = `0 0 ${interpolate(pulseVal, [0.3, 0.7], [25, 45])}px rgba(0, 243, 255, ${pulseVal}), inset 0 0 ${interpolate(pulseVal, [0.3, 0.7], [15, 30])}px rgba(0, 243, 255, ${pulseVal * 0.4})`;

  // 4. Subscribe Center Pulse (Neon Purple)
  const subPulseVal = interpolate(localFrame % 60, [0, 30, 60], [0.5, 0.9, 0.5], {
    easing: Easing.inOut(Easing.quad),
  });
  const subscribeBoxShadow = `0 0 ${interpolate(subPulseVal, [0.5, 0.9], [40, 65])}px rgba(188, 19, 254, ${subPulseVal}), inset 0 0 ${interpolate(subPulseVal, [0.5, 0.9], [30, 50])}px rgba(188, 19, 254, ${subPulseVal * 0.6})`;

  // 5. Subscribe Floating
  const subYOffset = interpolate(localFrame % 90, [0, 45, 90], [0, 8, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  // 6. Holographic Rings Rotation
  const innerRotate = interpolate(localFrame, [0, totalFrames], [0, 360]);
  const outerRotate = interpolate(localFrame, [0, totalFrames], [360, 0]);

  // 7. Ambient opacity pulse on HUD lines
  const hudOpacity = interpolate(localFrame % 150, [0, 75, 150], [0.6, 0.2, 0.6], {
    easing: Easing.inOut(Easing.quad),
  });

  // Dynamic Text Overlay pattern (Safe getInputProps)
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Cyberpunk Studio';
  const keywordsList = (inputProps.keywords || 'next level, visual, loop').split(',');

  // Text fade-in / fade-out mapping for perfect loop transition
  const textOpacity = interpolate(localFrame, [0, 25, 275, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
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
        backgroundColor: '#030008',
        overflow: 'hidden',
      }}
    >
      {/* PERSPECTIVE CYBERPUNK ENVIROMENT (Deterministic Three.js Visual Mirror) */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, transparent 0%, #030008 100%)',
          zIndex: 1,
        }}
      >
        {/* Neon Grid Ceiling */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-50%',
            width: '200%',
            height: '500px',
            backgroundImage: `
              linear-gradient(rgba(188, 19, 254, 0.2) 2px, transparent 2px),
              linear-gradient(90deg, rgba(188, 19, 254, 0.2) 2px, transparent 2px)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: `center ${gridScrollCeiling}px`,
            transform: 'perspective(500px) rotateX(-80deg)',
            transformOrigin: 'center top',
            opacity: 0.8,
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
          }}
        />

        {/* Neon Grid Floor */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '-50%',
            width: '200%',
            height: '500px',
            backgroundImage: `
              linear-gradient(rgba(0, 243, 255, 0.2) 2px, transparent 2px),
              linear-gradient(90deg, rgba(0, 243, 255, 0.2) 2px, transparent 2px)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: `center ${gridScrollFloor}px`,
            transform: 'perspective(500px) rotateX(80deg)',
            transformOrigin: 'center bottom',
            opacity: 0.8,
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
          }}
        />

        {/* Floating Stars/Dust particles */}
        {PARTICLES.map((p, i) => {
          const currentY = (p.y - localFrame * p.speedY * 2 + 1080) % 1080;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: p.x,
                top: currentY,
                width: p.size,
                height: p.size,
                backgroundColor: '#00f3ff',
                borderRadius: '50%',
                opacity: p.opacity,
                boxShadow: '0 0 8px #00f3ff',
              }}
            />
          );
        })}
      </div>

      {/* SCANLINE & FOG OVERLAY */}
      <div
        className="vfx-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
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

      {/* DECORATIVE HUD LINES */}
      <div
        className="hud-line top"
        style={{
          position: 'absolute',
          background: '#00f3ff',
          boxShadow: '0 0 10px #00f3ff',
          opacity: hudOpacity,
          top: 120,
          left: 160,
          width: 1600,
          height: 1,
          zIndex: 5,
        }}
      />
      <div
        className="hud-line bottom"
        style={{
          position: 'absolute',
          background: '#00f3ff',
          boxShadow: '0 0 10px #00f3ff',
          opacity: hudOpacity,
          bottom: 120,
          left: 160,
          width: 1600,
          height: 1,
          zIndex: 5,
        }}
      />

      {/* HUD DOTS */}
      <div style={{ position: 'absolute', width: 4, height: 4, backgroundColor: '#bc13fe', boxShadow: '0 0 8px #bc13fe', borderRadius: '50%', top: 118, left: 160, zIndex: 6 }} />
      <div style={{ position: 'absolute', width: 4, height: 4, backgroundColor: '#bc13fe', boxShadow: '0 0 8px #bc13fe', borderRadius: '50%', top: 118, right: 160, zIndex: 6 }} />
      <div style={{ position: 'absolute', width: 4, height: 4, backgroundColor: '#bc13fe', boxShadow: '0 0 8px #bc13fe', borderRadius: '50%', bottom: 118, left: 160, zIndex: 6 }} />
      <div style={{ position: 'absolute', width: 4, height: 4, backgroundColor: '#bc13fe', boxShadow: '0 0 8px #bc13fe', borderRadius: '50%', bottom: 118, right: 160, zIndex: 6 }} />

      {/* LEFT PLACEHOLDER */}
      <div
        className="placeholder left"
        style={{
          position: 'absolute',
          zIndex: 10,
          width: 640,
          height: 360,
          top: 360 + leftYOffset,
          left: 160,
          background: 'rgba(0, 15, 30, 0.6)',
          border: '2px solid',
          borderColor: borderPulseColor,
          borderRadius: 12,
          boxShadow: placeholderBoxShadow,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
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
        {/* Corners */}
        <div style={{ position: 'absolute', width: 30, height: 30, border: '2px solid', borderRight: 'none', borderBottom: 'none', borderRadius: '12px 0 0 0', borderColor: '#bc13fe', top: -2, left: -2, opacity: 0.8 }} />
        <div style={{ position: 'absolute', width: 30, height: 30, border: '2px solid', borderLeft: 'none', borderBottom: 'none', borderRadius: '0 12px 0 0', borderColor: '#bc13fe', top: -2, right: -2, opacity: 0.8 }} />
        <div style={{ position: 'absolute', width: 30, height: 30, border: '2px solid', borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 12px', borderColor: '#bc13fe', bottom: -2, left: -2, opacity: 0.8 }} />
        <div style={{ position: 'absolute', width: 30, height: 30, border: '2px solid', borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 12px 0', borderColor: '#bc13fe', bottom: -2, right: -2, opacity: 0.8 }} />
      </div>

      {/* RIGHT PLACEHOLDER */}
      <div
        className="placeholder right"
        style={{
          position: 'absolute',
          zIndex: 10,
          width: 640,
          height: 360,
          top: 360 + rightYOffset,
          right: 160,
          background: 'rgba(0, 15, 30, 0.6)',
          border: '2px solid',
          borderColor: borderPulseColor,
          borderRadius: 12,
          boxShadow: placeholderBoxShadow,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
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
        {/* Corners */}
        <div style={{ position: 'absolute', width: 30, height: 30, border: '2px solid', borderRight: 'none', borderBottom: 'none', borderRadius: '12px 0 0 0', borderColor: '#bc13fe', top: -2, left: -2, opacity: 0.8 }} />
        <div style={{ position: 'absolute', width: 30, height: 30, border: '2px solid', borderLeft: 'none', borderBottom: 'none', borderRadius: '0 12px 0 0', borderColor: '#bc13fe', top: -2, right: -2, opacity: 0.8 }} />
        <div style={{ position: 'absolute', width: 30, height: 30, border: '2px solid', borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 12px', borderColor: '#bc13fe', bottom: -2, left: -2, opacity: 0.8 }} />
        <div style={{ position: 'absolute', width: 30, height: 30, border: '2px solid', borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 12px 0', borderColor: '#bc13fe', bottom: -2, right: -2, opacity: 0.8 }} />
      </div>

      {/* SUBSCRIBE AREA */}
      <div
        className="subscribe-area"
        style={{
          position: 'absolute',
          zIndex: 15,
          top: 415 + subYOffset,
          left: 835,
          width: 250,
          height: 250,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Rotating Outer Ring */}
        <div
          className="ring outer"
          style={{
            position: 'absolute',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            width: 240,
            height: 240,
            border: '2px solid transparent',
            borderLeft: '2px dashed #bc13fe',
            borderRight: '2px dashed #bc13fe',
            boxShadow: '-10px 0 20px rgba(188, 19, 254, 0.2)',
            zIndex: 18,
            transform: `translate(-50%, -50%) rotate(${outerRotate}deg)`,
          }}
        />

        {/* Rotating Inner Ring */}
        <div
          className="ring inner"
          style={{
            position: 'absolute',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            width: 210,
            height: 210,
            border: '2px solid transparent',
            borderTop: '2px solid #00f3ff',
            borderBottom: '2px solid #00f3ff',
            boxShadow: '0 10px 20px rgba(0, 243, 255, 0.2)',
            zIndex: 19,
            transform: `translate(-50%, -50%) rotate(${innerRotate}deg)`,
          }}
        />

        {/* Pulsing Subscribe Center */}
        <div
          className="subscribe-circle"
          style={{
            width: 180,
            height: 180,
            background: 'rgba(20, 0, 40, 0.7)',
            border: '2px solid #bc13fe',
            borderRadius: '50%',
            boxShadow: subscribeBoxShadow,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 20,
          }}
        />
      </div>

      {/* DYNAMIC TEXT OVERLAY */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          left: 160,
          zIndex: 30,
          opacity: textOpacity,
          fontFamily: 'sans-serif',
          pointerEvents: 'none',
        }}
      >
        {/* Elegant Glowing Title */}
        <h1
          style={{
            color: '#ffffff',
            fontSize: '42px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            margin: 0,
            textShadow: '0 0 15px rgba(0, 243, 255, 0.6), 0 0 30px rgba(188, 19, 254, 0.4)',
          }}
        >
          {judul}
        </h1>

        {/* Glassmorphic Badge Tags */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          {keywordsList.map((tag: string, idx: number) => (
            <span
              key={idx}
              style={{
                background: 'rgba(0, 243, 255, 0.08)',
                border: '1px solid rgba(0, 243, 255, 0.25)',
                borderRadius: '4px',
                padding: '4px 12px',
                color: '#00f3ff',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                boxShadow: '0 0 10px rgba(0, 243, 255, 0.1)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CyberpunkGamingEndscreen;
// END_OF_FILE