import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// High-fidelity pre-calculated static values for deterministic visual rendering
const JITTER_SHADOWS = [
  "0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.2)",
  "0 0 70px rgba(0, 255, 255, 0.8), inset 0 0 80px rgba(0, 255, 255, 0.4)",
  "0 0 45px rgba(0, 255, 255, 0.5), inset 0 0 55px rgba(0, 255, 255, 0.25)",
  "0 0 60px rgba(0, 255, 255, 0.7), inset 0 0 70px rgba(0, 255, 255, 0.35)",
  "0 0 38px rgba(0, 255, 255, 0.38), inset 0 0 48px rgba(0, 255, 255, 0.18)",
  "0 0 75px rgba(0, 255, 255, 0.9), inset 0 0 85px rgba(0, 255, 255, 0.45)",
  "0 0 50px rgba(0, 255, 255, 0.5), inset 0 0 60px rgba(0, 255, 255, 0.25)",
  "0 0 42px rgba(0, 255, 255, 0.42), inset 0 0 52px rgba(0, 255, 255, 0.22)",
  "0 0 65px rgba(0, 255, 255, 0.75), inset 0 0 75px rgba(0, 255, 255, 0.38)",
  "0 0 55px rgba(0, 255, 255, 0.6), inset 0 0 65px rgba(0, 255, 255, 0.3)"
];

const RINGS_DATA = [
  { size: 400, color: '#00ffff', rotX: 40, rotY: 25, speed: 1, dash: '10 15' },
  { size: 550, color: '#ff00ff', rotX: -30, rotY: 45, speed: -0.7, dash: '40 10 5 10' },
  { size: 700, color: '#00ffff', rotX: 55, rotY: -20, speed: 0.5, dash: '15 30' },
  { size: 850, color: '#ff00ff', rotX: 15, rotY: 35, speed: -0.4, dash: 'none' },
  { size: 1000, color: '#00ffff', rotX: -35, rotY: -35, speed: 0.3, dash: '100 20 10 20' },
];

const PARTICLE_COUNT = 100;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const seed = Math.sin(i * 456.789) * 10000;
  const x = (Math.abs(seed * 1.7) % 2400) - 1200;
  const y = (Math.abs(seed * 2.3) % 1400) - 700;
  const size = 2 + (Math.abs(seed * 3.1) % 4);
  const depthStart = Math.abs(seed * 7.9) % 1000;
  const color = i % 2 === 0 ? '#00ffff' : '#ff00ff';
  return { x, y, size, depthStart, color };
});

const S1_Y_OFFSETS = [0, 40, -30, 10, -20];
const S2_Y_OFFSETS = [0, -50, 30, -10];
const S3_Y_OFFSETS = [0, 20, -40, 50, -15, 10];

export const CyberpunkEsportsEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Parallax floating background simulation
  const timeSec = frame / fps;
  const parallaxX = Math.sin(timeSec * 0.628) * 12;
  const parallaxY = Math.cos(timeSec * 0.628) * 6;

  // Infinite holographic grid motion
  const gridOffset1 = interpolate(frame % 30, [0, 30], [0, 40], { extrapolateRight: 'clamp' });
  const gridOffset2 = interpolate(frame % 30, [0, 30], [0, 80], { extrapolateRight: 'clamp' });

  // Border rough flickering effect (10-frame perfect cycle loops inside 300 frames)
  const leftPlaceholderShadow = JITTER_SHADOWS[frame % 10];
  const rightPlaceholderShadow = JITTER_SHADOWS[(frame + 4) % 10];

  // Moving scanline animation (Looping every 4 seconds = 120 frames)
  const scanlineY = interpolate(frame % 120, [0, 120], [-100, 338], {
    easing: Easing.linear,
  });

  // Subscribe portal animations
  const rotCW = interpolate(frame % 300, [0, 300], [0, 360]);
  const rotCCW = interpolate(frame % 300, [0, 300], [360, 0]);

  // Core glow pulse (Symmetrical loop every 60 frames = 2 seconds)
  const coreGlowFrame = frame % 60;
  const coreScale = interpolate(coreGlowFrame, [0, 30, 60], [0.9, 1.1, 0.9], {
    easing: Easing.inOut(Easing.quad),
  });
  const coreGlowIntensity = interpolate(coreGlowFrame, [0, 30, 60], [60, 110, 60], {
    easing: Easing.inOut(Easing.quad),
  });

  // Target radar scaling (Loops every 30 frames = 1 second)
  const coreTargetFrame = frame % 30;
  const targetScale = interpolate(coreTargetFrame, [0, 30], [0.1, 3], {
    easing: Easing.out(Easing.quad),
  });
  const targetOpacity = interpolate(coreTargetFrame, [0, 10, 30], [1, 1, 0], {
    easing: Easing.out(Easing.quad),
  });

  // GSAP Replica: Sweeping laser streaks
  // Streak 1: 60 frames (2s)
  const s1Frame = frame % 60;
  const s1X = interpolate(s1Frame, [0, 60], [-800, 2200], { easing: Easing.inOut(Easing.quad) });
  const s1CurrentY = S1_Y_OFFSETS[Math.floor(frame / 60) % 5];
  const s1Opacity = interpolate(s1Frame, [0, 10, 50, 60], [0, 1, 1, 0]);

  // Streak 2 (Magenta): 75 frames (2.5s)
  const s2Frame = frame % 75;
  const s2X = interpolate(s2Frame, [0, 75], [-1000, 2200], { easing: Easing.inOut(Easing.quad) });
  const s2CurrentY = S2_Y_OFFSETS[Math.floor(frame / 75) % 4];
  const s2Opacity = interpolate(s2Frame, [0, 12, 63, 75], [0, 1, 1, 0]);

  // Streak 3: 50 frames (1.66s)
  const s3Frame = frame % 50;
  const s3X = interpolate(s3Frame, [0, 50], [-700, 2200], { easing: Easing.inOut(Easing.quad) });
  const s3CurrentY = S3_Y_OFFSETS[Math.floor(frame / 50) % 6];
  const s3Opacity = interpolate(s3Frame, [0, 8, 42, 50], [0, 1, 1, 0]);

  // Point light pulsing intensity values
  const lightPulseCyan = 4 + Math.sin(timeSec * 3) * 1.5;
  const lightPulseMagenta = 4 + Math.cos(timeSec * 2.5) * 1.5;

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
        backgroundColor: '#010105',
        background: 'radial-gradient(circle at center, #020412 0%, #000000 100%)',
      }}
    >
      {/* Background 3D Perspective Environment */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0px)`,
        }}
      >
        {/* Holographic Cyan Grid Floor */}
        <div
          style={{
            position: 'absolute',
            width: '300%',
            height: '300%',
            top: '25%',
            left: '-100%',
            backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.12) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: `0px ${gridOffset1}px`,
            transform: 'rotateX(75deg) translateY(200px)',
            transformOrigin: 'center top',
            opacity: 0.4,
          }}
        />

        {/* Holographic Magenta Grid Floor */}
        <div
          style={{
            position: 'absolute',
            width: '300%',
            height: '300%',
            top: '25.5%',
            left: '-100%',
            backgroundImage: 'linear-gradient(rgba(255, 0, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            backgroundPosition: `0px ${gridOffset2}px`,
            transform: 'rotateX(75deg) translateY(200px)',
            transformOrigin: 'center top',
            opacity: 0.25,
          }}
        />

        {/* Rotating Concentric Rings (3D Background) */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
          {RINGS_DATA.map((ring, i) => {
            const ringAngle = interpolate(frame % 300, [0, 300], [0, 360 * ring.speed]);
            return (
              <svg
                key={i}
                width={ring.size}
                height={ring.size}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginLeft: -ring.size / 2,
                  marginTop: -ring.size / 2,
                  transform: `translateZ(-500px) rotateX(${ring.rotX}deg) rotateY(${ring.rotY}deg) rotateZ(${ringAngle}deg)`,
                  transformOrigin: 'center center',
                  overflow: 'visible',
                }}
              >
                <circle
                  cx={ring.size / 2}
                  cy={ring.size / 2}
                  r={ring.size / 2 - 4}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth="3"
                  strokeDasharray={ring.dash}
                  style={{
                    filter: `drop-shadow(0 0 15px ${ring.color})`,
                    opacity: 0.35,
                  }}
                />
              </svg>
            );
          })}
        </div>

        {/* Volumetric Digital Data Flow (Camera-bound particles) */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
          {PARTICLES.map((p, i) => {
            const speed = 4;
            const movement = (frame * speed) % 1000;
            const currentDepth = (p.depthStart - movement + 1000) % 1000;
            const z = interpolate(currentDepth, [0, 1000], [350, -1200]);
            const opacity = interpolate(currentDepth, [0, 120, 880, 1000], [0, 0.75, 0.75, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 12px ${p.color}`,
                  opacity,
                  transform: `translate3d(${p.x}px, ${p.y}px, ${z}px)`,
                  transformOrigin: 'center center',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Cyber Ambient Backdrop Lights (Overlay effects) */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 70%)',
          top: '10%',
          left: '15%',
          transform: `scale(${1 + Math.sin(timeSec) * 0.1})`,
          opacity: lightPulseCyan / 5,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 0, 255, 0.12) 0%, transparent 70%)',
          bottom: '10%',
          right: '15%',
          transform: `scale(${1 + Math.cos(timeSec) * 0.1})`,
          opacity: lightPulseMagenta / 5,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* 2D Interface / Interactive Elements Layer */}
      <div className="ui-layer" style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
        
        {/* Left Video Placeholder */}
        <div
          className="placeholder left"
          style={{
            position: 'absolute',
            width: '600px',
            height: '338px',
            top: '371px',
            left: '100px',
            background: 'rgba(1, 4, 15, 0.75)',
            border: '3px solid #00ffff',
            boxShadow: leftPlaceholderShadow,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div style={{ position: 'absolute', width: '100%', height: '100px', background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.35), transparent)', top: -100, transform: `translateY(${scanlineY}px)` }} />
          
          {/* Glowing Tech Corners */}
          <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', top: -4, left: -4, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' }} />
        </div>

        {/* Right Video Placeholder */}
        <div
          className="placeholder right"
          style={{
            position: 'absolute',
            width: '600px',
            height: '338px',
            top: '371px',
            right: '100px',
            background: 'rgba(1, 4, 15, 0.75)',
            border: '3px solid #00ffff',
            boxShadow: rightPlaceholderShadow,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div style={{ position: 'absolute', width: '100%', height: '100px', background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.35), transparent)', top: -100, transform: `translateY(${scanlineY}px)` }} />
          
          {/* Glowing Tech Corners */}
          <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', top: -4, left: -4, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' }} />
        </div>

        {/* Subscribe Portal Circle */}
        <div
          className="subscribe-portal"
          style={{
            position: 'absolute',
            width: '360px',
            height: '360px',
            left: '780px',
            top: '360px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
          }}
        >
          {/* Outer Reactor Ring */}
          <div
            className="ring-outer"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '4px solid transparent',
              borderTop: '4px solid #00ffff',
              borderBottom: '4px solid #00ffff',
              boxShadow: '0 0 30px #00ffff, inset 0 0 20px #00ffff',
              transform: `rotate(${rotCW}deg)`,
            }}
          />

          {/* Inner Magenta Ring */}
          <div
            className="ring-inner"
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              border: '4px dashed #ff00ff',
              boxShadow: '0 0 40px #ff00ff, inset 0 0 20px #ff00ff',
              transform: `rotate(${rotCCW}deg)`,
            }}
          />

          {/* Central Holographic Core */}
          <div
            className="core-glow"
            style={{
              position: 'absolute',
              width: '45%',
              height: '45%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, #ffffff 0%, #00ffff 40%, transparent 70%)',
              boxShadow: `0 0 ${coreGlowIntensity}px #00ffff, 0 0 ${coreGlowIntensity + 40}px #00ffff`,
              transform: `scale(${coreScale})`,
            }}
          />

          {/* Core Target Radar Circle */}
          <div
            className="core-target"
            style={{
              position: 'absolute',
              width: '25%',
              height: '25%',
              borderRadius: '50%',
              border: '6px solid #fff',
              boxShadow: '0 0 20px #fff',
              transform: `scale(${targetScale})`,
              opacity: targetOpacity,
            }}
          />
        </div>

        {/* Cinematic Fast Light Streaks */}
        {/* Streak 1 */}
        <div
          className="light-streak"
          style={{
            position: 'absolute',
            height: '2px',
            width: '600px',
            background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
            borderRadius: '50%',
            top: '250px',
            left: 0,
            transform: `translate3d(${s1X}px, ${s1CurrentY}px, 0px)`,
            opacity: s1Opacity,
            mixBlendMode: 'screen',
          }}
        />

        {/* Streak 2 (Magenta) */}
        <div
          className="light-streak magenta"
          style={{
            position: 'absolute',
            height: '2px',
            width: '800px',
            background: 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)',
            boxShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff',
            borderRadius: '50%',
            top: '850px',
            left: 0,
            transform: `translate3d(${s2X}px, ${s2CurrentY}px, 0px)`,
            opacity: s2Opacity,
            mixBlendMode: 'screen',
          }}
        />

        {/* Streak 3 */}
        <div
          className="light-streak"
          style={{
            position: 'absolute',
            height: '2px',
            width: '500px',
            background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
            borderRadius: '50%',
            top: '450px',
            left: 0,
            transform: `translate3d(${s3X}px, ${s3CurrentY}px, 0px)`,
            opacity: s3Opacity,
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* Cyberpunk Vignette Layer */}
      <div
        className="vignette"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          boxShadow: 'inset 0 0 250px rgba(0, 0, 0, 0.95)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default CyberpunkEsportsEndscreen;
// END_OF_FILE