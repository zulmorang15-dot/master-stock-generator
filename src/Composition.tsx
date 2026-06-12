import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// PRE-CALCULATED STATIC VALUES TO AVOID MATH.RANDOM IN RENDER
const PARTICLE_COUNT = 150;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  // Deterministic pseudo-random generation using trigonometry
  const rawX = Math.sin(i * 12.9898 + 43758.5453) * 2 - 1;
  const rawY = Math.cos(i * 78.233 + 43758.5453) * 2 - 1;
  const rawZ = Math.sin(i * 45.123 + 923.123) * 0.5 + 0.5;
  const rawSpeed = Math.sin(i * 93.111) * 0.5 + 0.5;
  const rawSize = Math.cos(i * 27.421) * 0.5 + 0.5;

  return {
    x: rawX * 1200,
    y: rawY * 600,
    zStart: rawZ * 1000 + 50,
    speed: 3 + rawSpeed * 4,
    size: 1 + rawSize * 3,
    color: i % 2 === 0 ? '#00ffff' : '#ff00ff',
  };
});

const RINGS_CONFIG = [
  { rotationsX: 2, rotationsY: 1, rotationsZ: 3, scale: 1.0, zDepth: -50, color: '#00ffff' },
  { rotationsX: -1, rotationsY: 2, rotationsZ: -2, scale: 1.4, zDepth: -80, color: '#ff00ff' },
  { rotationsX: 3, rotationsY: -2, rotationsZ: 1, scale: 1.8, zDepth: -110, color: '#00ffff' },
  { rotationsX: -2, rotationsY: 1, rotationsZ: -1, scale: 2.2, zDepth: -140, color: '#ff00ff' },
  { rotationsX: 1, rotationsY: 3, rotationsZ: 2, scale: 2.6, zDepth: -170, color: '#00ffff' },
];

const STREAK_1_Y_OFFSETS = [0, -45, 30];
const STREAK_2_Y_OFFSETS = [0, 60];
const STREAK_3_Y_OFFSETS = [0, -70, 40, -20];

// FLICKER COEFFICIENTS FOR ULTRA-REALISTIC HOLOGRAPHIC SHADOW GLOW
const FLICKER_VALUES = [1.0, 0.75, 1.2, 0.45, 0.9, 1.35, 0.6, 1.15, 0.8, 1.05, 0.7, 1.25, 0.5, 0.95, 1.3, 0.85];

export const CyberpunkEsportsEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const ORIGINAL_WIDTH = 1920;
  const ORIGINAL_HEIGHT = 1080;
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Core Loop config (12 seconds = 360 frames at 30fps)
  const totalDuration = 360;
  const localFrame = frame % totalDuration;

  // --- GRID INTERPOLATION (Seamless Loop) ---
  const grid1Y = (interpolate(localFrame, [0, totalDuration], [0, 240]) % 60);
  const grid2Y = (interpolate(localFrame, [0, totalDuration], [0, 120]) % 30);

  // --- LIGHT STREAK SIMULATIONS (Perfect deterministic loops) ---
  // Streak 1 (Cyan) - Loops every 120 frames (3 cycles total)
  const s1Cycle = localFrame % 120;
  const s1YOffset = STREAK_1_Y_OFFSETS[Math.floor(localFrame / 120) % STREAK_1_Y_OFFSETS.length];
  const s1X = interpolate(s1Cycle, [0, 80], [-800, 2920], { extrapolateRight: 'clamp' });
  const s1Opacity = interpolate(s1Cycle, [0, 10, 70, 80], [0, 0.9, 0.9, 0], { extrapolateRight: 'clamp' });

  // Streak 2 (Magenta) - Loops every 180 frames (2 cycles total, delayed by 40 frames)
  const s2Cycle = (localFrame + 40) % 180;
  const s2YOffset = STREAK_2_Y_OFFSETS[Math.floor((localFrame + 40) / 180) % STREAK_2_Y_OFFSETS.length];
  const s2X = interpolate(s2Cycle, [0, 110], [-1000, 2920], { extrapolateRight: 'clamp' });
  const s2Opacity = interpolate(s2Cycle, [0, 15, 95, 110], [0, 0.95, 0.95, 0], { extrapolateRight: 'clamp' });

  // Streak 3 (Cyan) - Loops every 90 frames (4 cycles total, delayed by 80 frames)
  const s3Cycle = (localFrame + 80) % 90;
  const s3YOffset = STREAK_3_Y_OFFSETS[Math.floor((localFrame + 80) / 90) % STREAK_3_Y_OFFSETS.length];
  const s3X = interpolate(s3Cycle, [0, 60], [-700, 2920], { extrapolateRight: 'clamp' });
  const s3Opacity = interpolate(s3Cycle, [0, 8, 52, 60], [0, 0.85, 0.85, 0], { extrapolateRight: 'clamp' });

  // --- PLACEHOLDERS FLICKER (Aggressive glowing cyber aesthetic) ---
  const flickerIndex = Math.floor(localFrame / 2) % FLICKER_VALUES.length;
  const pulseFactor = FLICKER_VALUES[flickerIndex];
  const placeholderBoxShadow = `0 0 ${50 * pulseFactor}px rgba(0, 255, 255, 0.45), inset 0 0 ${40 * pulseFactor}px rgba(0, 255, 255, 0.25)`;

  // --- SCANLINE ANIMATION ---
  const scanlineY = interpolate(localFrame % 120, [0, 120], [-100, 438]);

  // --- SUBSCRIBE PORTAL ROTATIONS AND PULSES ---
  const outerRotation = interpolate(localFrame % 240, [0, 240], [0, 360]);
  const innerRotation = interpolate(localFrame % 360, [0, 360], [360, 0]);

  // Center core glow pulsing smoothly
  const corePulseFrame = localFrame % 60;
  const coreScale = interpolate(corePulseFrame, [0, 30, 60], [0.9, 1.1, 0.9], { easing: Easing.inOut(Easing.quad) });
  const coreBrightness = interpolate(corePulseFrame, [0, 30, 60], [1, 1.4, 1], { easing: Easing.inOut(Easing.quad) });

  // Scaling target expands and fades
  const targetFrame = localFrame % 30;
  const targetScale = interpolate(targetFrame, [0, 30], [0.2, 3.2]);
  const targetOpacity = interpolate(targetFrame, [0, 30], [1, 0], { easing: Easing.out(Easing.quad) });

  return (
    <div
      style={{
        backgroundColor: '#010105',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* SCALING VIEWPORT WRAPPER */}
      <div
        style={{
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scaleFactor})`,
          transformOrigin: 'center center',
          background: 'radial-gradient(circle at center, #020412 0%, #000000 100%)',
          overflow: 'hidden',
        }}
      >
        {/* ========================================================= */}
        {/* DETAILED 3D-EMULATED BACKDROP LAYER                       */}
        {/* ========================================================= */}

        {/* Space Dust / Digital Flow (Deterministic Particle Layer) */}
        <svg
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          {PARTICLES.map((p, idx) => {
            const zSpeed = p.speed * 4;
            const displacement = zSpeed * localFrame;
            let currentZ = p.zStart - displacement;
            
            // Safe looping boundaries
            while (currentZ < 10) {
              currentZ += 1000;
            }

            const fov = 300;
            const projectedScale = fov / (fov + currentZ);
            const xProjected = ORIGINAL_WIDTH / 2 + p.x * projectedScale;
            const yProjected = ORIGINAL_HEIGHT / 2 + p.y * projectedScale;
            const particleOpacity = interpolate(currentZ, [10, 1000], [0.95, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const finalSize = p.size * projectedScale * 2.5;

            return (
              <circle
                key={idx}
                cx={xProjected}
                cy={yProjected}
                r={finalSize}
                fill={p.color}
                opacity={particleOpacity}
                style={{
                  filter: 'drop-shadow(0 0 4px currentColor)',
                }}
              />
            );
          })}
        </svg>

        {/* Massive Dynamic Rotating Background Rings */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 2,
            perspective: '1200px',
            transformStyle: 'preserve-3d',
            pointerEvents: 'none',
          }}
        >
          {RINGS_CONFIG.map((ring, idx) => {
            const rotX = interpolate(localFrame, [0, totalDuration], [ring.rx, ring.rx + ring.rotationsX * 360]);
            const rotY = interpolate(localFrame, [0, totalDuration], [ring.ry, ring.ry + ring.rotationsY * 360]);
            const rotZ = interpolate(localFrame, [0, totalDuration], [ring.rz, ring.rz + ring.rotationsZ * 360]);

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '600px',
                  height: '600px',
                  marginLeft: '-300px',
                  marginTop: '-300px',
                  border: `4px solid ${ring.color}`,
                  borderRadius: '50%',
                  opacity: 0.15,
                  transformStyle: 'preserve-3d',
                  transform: `translateZ(${ring.zDepth}px) scale(${ring.scale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
                  boxShadow: `0 0 40px ${ring.color}, inset 0 0 40px ${ring.color}`,
                }}
              />
            );
          })}
        </div>

        {/* Futuristic Cyber Grid floor system (Dual Color Mapping) */}
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            left: '-50%',
            width: '200%',
            height: '550px',
            transform: 'perspective(450px) rotateX(75deg)',
            transformOrigin: 'center bottom',
            overflow: 'hidden',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 85%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 85%)',
            opacity: 0.5,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {/* Cyan Grid Level */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: `
                linear-gradient(rgba(0, 255, 255, 0.3) 2px, transparent 2px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.3) 2px, transparent 2px)
              `,
              backgroundSize: '60px 60px',
              transform: `translateY(${grid1Y}px)`,
            }}
          />
          {/* Magenta Accent Grid Level */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: `
                linear-gradient(rgba(255, 0, 255, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 0, 255, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
              transform: `translateY(${grid2Y}px)`,
            }}
          />
        </div>

        {/* Ambient Overlay Lights */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 15% 30%, rgba(0,255,255,0.08) 0%, transparent 60%), radial-gradient(circle at 85% 70%, rgba(255,0,255,0.08) 0%, transparent 60%)',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        />

        {/* ========================================================= */}
        {/* UI LAYER                                                  */}
        {/* ========================================================= */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {/* Left Video Placeholder */}
          <div
            style={{
              position: 'absolute',
              width: '600px',
              height: '338px',
              top: '371px',
              left: '100px',
              background: 'rgba(1, 4, 15, 0.75)',
              border: '3px solid #00ffff',
              boxShadow: placeholderBoxShadow,
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
            }}
          >
            {/* Corner Tech Highlights */}
            <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', zIndex: 2, top: '-4px', left: '-4px', borderRight: 'none', borderBottom: 'none' }} />
            <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', zIndex: 2, top: '-4px', right: '-4px', borderLeft: 'none', borderBottom: 'none' }} />
            <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', zIndex: 2, bottom: '-4px', left: '-4px', borderRight: 'none', borderTop: 'none' }} />
            <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', zIndex: 2, bottom: '-4px', right: '-4px', borderLeft: 'none', borderTop: 'none' }} />

            {/* Interior Grid Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                zIndex: 0,
              }}
            />

            {/* Moving Scanline */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100px',
                background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.35), transparent)',
                top: 0,
                zIndex: 1,
                transform: `translateY(${scanlineY}px)`,
              }}
            />
          </div>

          {/* Right Video Placeholder */}
          <div
            style={{
              position: 'absolute',
              width: '600px',
              height: '338px',
              top: '371px',
              right: '100px',
              background: 'rgba(1, 4, 15, 0.75)',
              border: '3px solid #00ffff',
              boxShadow: placeholderBoxShadow,
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
            }}
          >
            {/* Corner Tech Highlights */}
            <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', zIndex: 2, top: '-4px', left: '-4px', borderRight: 'none', borderBottom: 'none' }} />
            <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', zIndex: 2, top: '-4px', right: '-4px', borderLeft: 'none', borderBottom: 'none' }} />
            <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', zIndex: 2, bottom: '-4px', left: '-4px', borderRight: 'none', borderTop: 'none' }} />
            <div style={{ position: 'absolute', width: '40px', height: '40px', border: '4px solid #fff', boxShadow: '0 0 15px #00ffff', zIndex: 2, bottom: '-4px', right: '-4px', borderLeft: 'none', borderTop: 'none' }} />

            {/* Interior Grid Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                zIndex: 0,
              }}
            />

            {/* Moving Scanline */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100px',
                background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.35), transparent)',
                top: 0,
                zIndex: 1,
                transform: `translateY(${scanlineY}px)`,
              }}
            />
          </div>

          {/* Subscribe Portal Area */}
          <div
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
            {/* Outer Reactor Ring (Cyan) */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '4px solid transparent',
                borderTop: '4px solid #00ffff',
                borderBottom: '4px solid #00ffff',
                boxShadow: '0 0 35px #00ffff, inset 0 0 25px #00ffff',
                transform: `rotate(${outerRotation}deg)`,
              }}
            />

            {/* Inner Ring (Magenta) */}
            <div
              style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                borderRadius: '50%',
                border: '4px dashed #ff00ff',
                boxShadow: '0 0 45px #ff00ff, inset 0 0 25px #ff00ff',
                transform: `rotate(${innerRotation}deg)`,
              }}
            />

            {/* Central Glowing Core */}
            <div
              style={{
                position: 'absolute',
                width: '45%',
                height: '45%',
                borderRadius: '50%',
                background: 'radial-gradient(circle at center, #ffffff 0%, #00ffff 40%, transparent 70%)',
                boxShadow: '0 0 85px #00ffff, 0 0 125px #00ffff',
                transform: `scale(${coreScale})`,
                filter: `brightness(${coreBrightness})`,
              }}
            />

            {/* Concentric Expanding Core Target Ring */}
            <div
              style={{
                position: 'absolute',
                width: '25%',
                height: '25%',
                borderRadius: '50%',
                border: '6px solid #ffffff',
                boxShadow: '0 0 25px #ffffff',
                transform: `scale(${targetScale})`,
                opacity: targetOpacity,
              }}
            />
          </div>

          {/* ========================================================= */}
          {/* HIGH ENERGY LIGHT STREAKS SWEEPING EFFECT                  */}
          {/* ========================================================= */}
          <div
            style={{
              position: 'absolute',
              height: '3px',
              width: '600px',
              background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
              boxShadow: '0 0 25px #00ffff, 0 0 45px #00ffff',
              borderRadius: '50%',
              top: `${250 + s1YOffset}px`,
              left: 0,
              zIndex: 5,
              opacity: s1Opacity,
              mixBlendMode: 'screen',
              transform: `translateX(${s1X}px)`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              height: '3px',
              width: '800px',
              background: 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)',
              boxShadow: '0 0 25px #ff00ff, 0 0 45px #ff00ff',
              borderRadius: '50%',
              top: `${850 + s2YOffset}px`,
              left: 0,
              zIndex: 5,
              opacity: s2Opacity,
              mixBlendMode: 'screen',
              transform: `translateX(${s2X}px)`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              height: '3px',
              width: '500px',
              background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
              boxShadow: '0 0 25px #00ffff, 0 0 45px #00ffff',
              borderRadius: '50%',
              top: `${450 + s3YOffset}px`,
              left: 0,
              zIndex: 5,
              opacity: s3Opacity,
              mixBlendMode: 'screen',
              transform: `translateX(${s3X}px)`,
            }}
          />
        </div>

        {/* Ambient Dark Overlay Vignette for intense focus */}
        <div
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
    </div>
  );
};

export default CyberpunkEsportsEndscreen;
// END_OF_FILE