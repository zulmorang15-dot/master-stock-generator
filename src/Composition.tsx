import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic static particles generation (avoids Math.random inside rendering)
const PARTICLES = Array.from({ length: 140 }, (_, i) => {
  const sinX = Math.sin(i * 12.9898);
  const sinY = Math.sin(i * 78.233);
  const sinZ = Math.sin(i * 45.123);
  return {
    x: sinX * 800,
    y: sinY * 400,
    zStart: Math.abs(sinZ) * 1000,
    color: i % 3 === 0 ? '#ff00ff' : '#00ffff',
    size: 2 + Math.abs(sinX) * 4,
  };
});

// Deterministic static rings config
const BACKGROUND_RINGS = Array.from({ length: 5 }, (_, i) => {
  const sinX = Math.sin(i * 31.4);
  const sinY = Math.sin(i * 59.2);
  return {
    scale: 1.2 + i * 0.6,
    z: -100 - i * 60,
    color: i % 2 === 0 ? '#00ffff' : '#ff00ff',
    rx: sinX * 180,
    ry: sinY * 180,
    loopsX: (i % 2 === 0 ? 1 : -1) * (i + 1),
    loopsY: (i % 2 === 0 ? -1 : 1) * (2 - i),
  };
});

export const CyberpunkEsportsEndscreen = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // --- Dynamic FX calculations ---
  
  // Holographic crawling grid floor
  const gridMove = interpolate(frame % 30, [0, 30], [0, 40], {
    extrapolateRight: 'clamp',
  });

  // Cyberpunk flickering border values for placeholders
  const fVal1 = Math.sin(frame * 0.4) * 0.12 + Math.sin(frame * 1.8) * 0.06 + 1.0;
  const fVal2 = Math.sin((frame + 50) * 0.4) * 0.12 + Math.sin((frame + 50) * 1.8) * 0.06 + 1.0;

  const leftBoxGlow = 40 * fVal1;
  const rightBoxGlow = 40 * fVal2;

  // Scanline vertical loops (every 4 seconds)
  const scanlineY = interpolate(frame % 120, [0, 120], [-100, 438]);

  // Subscribe Portal core pulses
  const coreScale = interpolate(Math.sin((frame / 60) * Math.PI * 2), [-1, 1], [0.9, 1.1]);
  const coreBrightness = interpolate(Math.sin((frame / 60) * Math.PI * 2), [-1, 1], [1, 1.5]);

  // Infinite expanding target circle loops (every 1 second)
  const targetFrame = frame % 30;
  const targetScale = interpolate(targetFrame, [0, 30], [0.1, 3.2]);
  const targetOpacity = interpolate(targetFrame, [0, 30], [1, 0]);

  // Ring Rotations (Continuous seamless loop over 300 frames)
  const outerRingRot = interpolate(frame, [0, 300], [0, 360]);
  const innerRingRot = interpolate(frame, [0, 300], [360, 0]);

  // Sweeping Light Streaks calculations (Clean looping mapping)
  // Streak 1 (Cyan)
  const rel1 = frame % 50;
  const left1 = interpolate(rel1, [0, 42], [-800, 2100], {
    easing: Easing.bezier(0.25, 1, 0.5, 1),
    extrapolateRight: 'clamp',
  });
  const op1 = interpolate(rel1, [0, 6, 36, 42], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const yOffset1 = [-30, 70, -90, 30, -50, 90][Math.floor(frame / 50) % 6];

  // Streak 2 (Magenta)
  const rel2 = (frame - 30 + 300) % 75;
  const left2 = interpolate(rel2, [0, 55], [-850, 2150], {
    easing: Easing.bezier(0.25, 1, 0.5, 1),
    extrapolateRight: 'clamp',
  });
  const op2 = interpolate(rel2, [0, 8, 48, 55], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const yOffset2 = [100, -50, 40, -80][Math.floor((frame - 30 + 300) / 75) % 4];

  // Streak 3 (Cyan-Blue)
  const rel3 = (frame - 15 + 300) % 60;
  const left3 = interpolate(rel3, [0, 48], [-800, 2100], {
    easing: Easing.bezier(0.25, 1, 0.5, 1),
    extrapolateRight: 'clamp',
  });
  const op3 = interpolate(rel3, [0, 6, 40, 48], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const yOffset3 = [-60, 40, -20, 80, -40][Math.floor((frame - 15 + 300) / 60) % 5];

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
      {/* --- BACKGROUND 3D GRID FLOOR ENVIRONMENT --- */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          perspective: '1000px',
          perspectiveOrigin: '50% 50%',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Cyan Main Grid */}
        <div
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            bottom: '-50%',
            left: '-50%',
            transform: 'rotateX(75deg)',
            transformOrigin: 'center bottom',
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.25) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            backgroundPosition: `0px ${gridMove}px`,
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
          }}
        />

        {/* Magenta Secondary Grid */}
        <div
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            bottom: '-50%',
            left: '-50%',
            transform: 'rotateX(75deg) translateZ(-4px)',
            transformOrigin: 'center bottom',
            backgroundImage: `
              linear-gradient(rgba(255, 0, 255, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 0, 255, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '120px 120px',
            backgroundPosition: `0px ${gridMove}px`,
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
          }}
        />
      </div>

      {/* --- BACKGROUND ROTATING 3D RINGS --- */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          perspective: '1000px',
          zIndex: 2,
        }}
      >
        {BACKGROUND_RINGS.map((ring, idx) => {
          const rotX = ring.rx + (frame / 300) * ring.loopsX * 360;
          const rotY = ring.ry + (frame / 300) * ring.loopsY * 360;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                width: `${320 * ring.scale}px`,
                height: `${320 * ring.scale}px`,
                border: `3px solid ${ring.color}`,
                borderRadius: '50%',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translateZ(${ring.z}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                boxShadow: `0 0 25px ${ring.color}, inset 0 0 25px ${ring.color}`,
                opacity: 0.18,
              }}
            />
          );
        })}
      </div>

      {/* --- VOLUMETRIC PARTICLES FIELD --- */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          perspective: '800px',
          zIndex: 3,
        }}
      >
        {PARTICLES.map((p, idx) => {
          const zTravel = 1000;
          const zCurrent = (p.zStart - frame * (zTravel / 300) + zTravel) % zTravel;
          const opacity = interpolate(zCurrent, [0, 150, 850, 1000], [0, 0.75, 0.75, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: p.color,
                top: '50%',
                left: '50%',
                boxShadow: `0 0 12px ${p.color}, 0 0 4px #ffffff`,
                transform: `translate(-50%, -50%) translate3d(${p.x}px, ${p.y}px, ${zCurrent - 600}px)`,
                opacity,
              }}
            />
          );
        })}
      </div>

      {/* --- UI INTERFACE LAYER --- */}
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
            width: 600,
            height: 338,
            top: 371,
            left: 100,
            background: 'rgba(1, 4, 15, 0.7)',
            border: '3px solid #00ffff',
            boxShadow: `0 0 ${leftBoxGlow}px rgba(0, 255, 255, 0.4), inset 0 0 ${leftBoxGlow * 1.2}px rgba(0, 255, 255, 0.2)`,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          {/* Tech Corners */}
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, top: -4, left: -4, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' }} />

          {/* Grid Pattern Background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />

          {/* Sweep Scanline */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.45), transparent)',
              transform: `translateY(${scanlineY}px)`,
              zIndex: 1,
            }}
          />
        </div>

        {/* Right Video Placeholder */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 338,
            top: 371,
            right: 100,
            background: 'rgba(1, 4, 15, 0.7)',
            border: '3px solid #00ffff',
            boxShadow: `0 0 ${rightBoxGlow}px rgba(0, 255, 255, 0.4), inset 0 0 ${rightBoxGlow * 1.2}px rgba(0, 255, 255, 0.2)`,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          {/* Tech Corners */}
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, top: -4, left: -4, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' }} />

          {/* Grid Pattern Background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />

          {/* Sweep Scanline */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.45), transparent)',
              transform: `translateY(${scanlineY}px)`,
              zIndex: 1,
            }}
          />
        </div>

        {/* --- SUBSCRIBE PORTAL (CENTER) --- */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            left: 780,
            top: 360,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
          }}
        >
          {/* Outer Reactor Ring (Rotating CW) */}
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
              transform: `rotate(${outerRingRot}deg)`,
            }}
          />

          {/* Inner Magenta Ring (Rotating CCW) */}
          <div
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              border: '4px dashed #ff00ff',
              boxShadow: '0 0 45px #ff00ff, inset 0 0 25px #ff00ff',
              transform: `rotate(${innerRingRot}deg)`,
            }}
          />

          {/* Central Holographic Core */}
          <div
            style={{
              position: 'absolute',
              width: '45%',
              height: '45%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, #ffffff 0%, #00ffff 40%, transparent 70%)',
              boxShadow: '0 0 80px #00ffff, 0 0 120px #00ffff',
              transform: `scale(${coreScale})`,
              filter: `brightness(${coreBrightness})`,
            }}
          />

          {/* Core Target Rings (Scaling Expansion Loop) */}
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

        {/* --- HORIZONTAL LIGHT STREAKS --- */}
        {/* Streak 1 */}
        <div
          style={{
            position: 'absolute',
            height: 2,
            width: 600,
            background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
            boxShadow: '0 0 25px #00ffff, 0 0 45px #00ffff',
            borderRadius: '50%',
            top: 250 + yOffset1,
            left: left1,
            zIndex: 5,
            opacity: op1,
            mixBlendMode: 'screen',
          }}
        />

        {/* Streak 2 (Magenta) */}
        <div
          style={{
            position: 'absolute',
            height: 2,
            width: 800,
            background: 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)',
            boxShadow: '0 0 25px #ff00ff, 0 0 45px #ff00ff',
            borderRadius: '50%',
            top: 850 + yOffset2,
            left: left2,
            zIndex: 5,
            opacity: op2,
            mixBlendMode: 'screen',
          }}
        />

        {/* Streak 3 */}
        <div
          style={{
            position: 'absolute',
            height: 2,
            width: 500,
            background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
            boxShadow: '0 0 25px #00ffff, 0 0 45px #00ffff',
            borderRadius: '50%',
            top: 450 + yOffset3,
            left: left3,
            zIndex: 5,
            opacity: op3,
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* --- CINEMATIC EDGE VIGNETTE --- */}
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
  );
};

export default CyberpunkEsportsEndscreen;
// END_OF_FILE