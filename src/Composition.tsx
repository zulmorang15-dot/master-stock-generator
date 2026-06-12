import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic Flicker Array (300 frames) to emulate organic cyberpunk screens
const FLICKER_VALUES = Array.from({ length: 300 }).map((_, i) => {
  const noise = Math.sin(i * 0.9) * 0.3 + Math.sin(i * 2.7) * 0.15 + Math.sin(i * 5.4) * 0.05;
  const base = 0.75 + noise;
  return Math.max(0.3, Math.min(1.3, base));
});

// Deterministic Volumetric Particles Flowing
const PARTICLES = Array.from({ length: 150 }).map((_, i) => {
  const x = ((Math.sin(i * 123.45) * 10000) % 1) * 1920;
  const y = ((Math.cos(i * 678.90) * 10000) % 1) * 1080;
  const zOffset = Math.abs(Math.floor(Math.sin(i * 456.78) * 300));
  const size = 1.5 + Math.abs((Math.sin(i * 987.65) * 3));
  const color = i % 3 === 0 ? '#ff00ff' : '#00ffff';
  const opacity = 0.25 + Math.abs((Math.sin(i * 345.67) * 0.45));
  return { x, y, zOffset, size, color, opacity };
});

// Rotating Background Rings Data
const RINGS_DATA = [
  { size: 500, color: '#00ffff', rotX: 1.2, rotY: 0.5, cyclesX: 1, cyclesY: 1, z: -120 },
  { size: 680, color: '#ff00ff', rotX: 2.1, rotY: 1.5, cyclesX: -1, cyclesY: 2, z: -180 },
  { size: 850, color: '#00ffff', rotX: 0.5, rotY: 2.8, cyclesX: 2, cyclesY: -1, z: -240 },
  { size: 1020, color: '#ff00ff', rotX: 3.0, rotY: 0.2, cyclesX: -2, cyclesY: 1, z: -300 },
  { size: 1200, color: '#00ffff', rotX: 1.7, rotY: 1.9, cyclesX: 1, cyclesY: -2, z: -360 },
];

// Moving Light Streaks Constants
const STREAK1_Y = [250, 310, 210, 270];
const STREAK2_Y = [850, 800, 890];
const STREAK3_Y = [450, 480, 420, 500, 430];

export const CyberpunkEsportsEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Parallax Floating Camera movement (Perfect seamless loop)
  const angle = (frame / 300) * Math.PI * 2;
  const parallaxX = Math.sin(angle) * 12;
  const parallaxY = Math.cos(angle * 2) * 6;

  // Grid continuous loop calculations (Modulo must be factors of 300)
  const cyanGridY = interpolate(frame % 30, [0, 30], [0, 60], { ease: Easing.linear });
  const magentaGridY = interpolate(frame % 50, [0, 50], [0, 120], { ease: Easing.linear });

  // Holographic Screen flicker factor
  const flicker = FLICKER_VALUES[frame % 300];

  // Left & Right Placeholder styling
  const leftPlaceholderStyle: React.CSSProperties = {
    position: 'absolute',
    width: 600,
    height: 338,
    top: 371,
    left: 100,
    backgroundColor: 'rgba(1, 4, 15, 0.7)',
    border: `3px solid rgba(0, 255, 255, ${0.75 + flicker * 0.25})`,
    boxShadow: `0 0 ${25 + flicker * 25}px rgba(0, 255, 255, ${0.25 + flicker * 0.25}), inset 0 0 ${35 + flicker * 25}px rgba(0, 255, 255, ${0.1 + flicker * 0.15})`,
    backdropFilter: 'blur(8px)',
    overflow: 'hidden',
  };

  const rightPlaceholderStyle: React.CSSProperties = {
    ...leftPlaceholderStyle,
    left: 'auto',
    right: 100,
  };

  // Moving scanline loop (looping over 100 frames)
  const scanlineY = interpolate(frame % 100, [0, 100], [-100, 340], { ease: Easing.linear });

  // Central Portal Ring Rotations
  const portalOuterRot = interpolate(frame, [0, 300], [0, 720]);
  const portalInnerRot = interpolate(frame, [0, 300], [0, -1080]);

  // Central Portal Core Pulsing (Symmetric sine over 4 cycles)
  const pulseVal = Math.sin((frame / 300) * Math.PI * 2 * 4);
  const coreScale = interpolate(pulseVal, [-1, 1], [0.88, 1.12]);
  const coreGlow = interpolate(pulseVal, [-1, 1], [60, 110]);

  // Expanding target rings loop (30 frame loop)
  const targetFrame1 = frame % 30;
  const targetScale1 = interpolate(targetFrame1, [0, 30], [0, 3.2], { ease: Easing.out(Easing.quad) });
  const targetOpacity1 = interpolate(targetFrame1, [0, 30], [1, 0], { ease: Easing.out(Easing.quad) });

  const targetFrame2 = (frame + 15) % 30;
  const targetScale2 = interpolate(targetFrame2, [0, 30], [0, 3.2], { ease: Easing.out(Easing.quad) });
  const targetOpacity2 = interpolate(targetFrame2, [0, 30], [1, 0], { ease: Easing.out(Easing.quad) });

  // Light Streak modulo sweep calculations
  const streak1Frame = frame % 75;
  const streak1X = interpolate(streak1Frame, [0, 48], [-700, 2020], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const streak1Opacity = interpolate(streak1Frame, [0, 8, 40, 48], [0, 1, 1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const streak1Y = STREAK1_Y[Math.floor(frame / 75) % 4];

  const streak2Frame = frame % 100;
  const streak2X = interpolate(streak2Frame, [0, 60], [-900, 2100], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const streak2Opacity = interpolate(streak2Frame, [0, 10, 50, 60], [0, 1, 1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const streak2Y = STREAK2_Y[Math.floor(frame / 100) % 3];

  const streak3Frame = frame % 50;
  const streak3X = interpolate(streak3Frame, [0, 35], [-600, 2000], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const streak3Opacity = interpolate(streak3Frame, [0, 5, 30, 35], [0, 1, 1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const streak3Y = STREAK3_Y[Math.floor(frame / 50) % 6] || 450;

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
      {/* 3D PARALLAX ENVIRONMENT WRAPPER */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
          zIndex: 1,
        }}
      >
        {/* Massive Background Rotating Rings */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          {RINGS_DATA.map((ring, idx) => {
            const rx = interpolate(frame, [0, 300], [ring.rotX, ring.rotX + Math.PI * 2 * ring.cyclesX]);
            const ry = interpolate(frame, [0, 300], [ring.rotY, ring.rotY + Math.PI * 2 * ring.cyclesY]);
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  width: ring.size,
                  height: ring.size,
                  borderRadius: '50%',
                  border: `4px solid ${ring.color}`,
                  boxShadow: `0 0 40px ${ring.color}, inset 0 0 30px ${ring.color}`,
                  opacity: 0.12,
                  left: '50%',
                  top: '50%',
                  marginLeft: -ring.size / 2,
                  marginTop: -ring.size / 2,
                  transform: `translate3d(0, 0, ${ring.z}px) rotateX(${rx}rad) rotateY(${ry}rad)`,
                }}
              />
            );
          })}
        </div>

        {/* 3D Moving Holographic Floor Grids */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '50%',
            bottom: 0,
            left: 0,
            perspective: '600px',
            transformStyle: 'preserve-3d',
            overflow: 'hidden',
          }}
        >
          {/* Cyan Grid Layer */}
          <div
            style={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              left: '-50%',
              bottom: '-50%',
              transform: 'rotateX(75deg)',
              transformOrigin: 'center bottom',
              backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.12) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              backgroundPositionY: `${cyanGridY}px`,
              opacity: 0.7,
            }}
          />
          {/* Magenta Grid Layer */}
          <div
            style={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              left: '-50%',
              bottom: '-50%',
              transform: 'rotateX(75deg)',
              transformOrigin: 'center bottom',
              backgroundImage: 'linear-gradient(rgba(255, 0, 255, 0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(255, 0, 255, 0.08) 2px, transparent 2px)',
              backgroundSize: '120px 120px',
              backgroundPositionY: `${magentaGridY}px`,
              opacity: 0.5,
            }}
          />
        </div>

        {/* Volumetric Floating Particles */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            perspective: '700px',
            transformStyle: 'preserve-3d',
            pointerEvents: 'none',
          }}
        >
          {PARTICLES.map((p, idx) => {
            const particleFrame = (frame + p.zOffset) % 300;
            const z = interpolate(particleFrame, [0, 300], [-1000, 300]);
            const op = interpolate(z, [-1000, -200, 300], [0, p.opacity, 0], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            });
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: '50%',
                  boxShadow: `0 0 8px ${p.color}`,
                  transform: `translate3d(0, 0, ${z}px)`,
                  opacity: op,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* FOREGROUND INTERFACE UI LAYER */}
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
        {/* LEFT VIDEO PLACEHOLDER */}
        <div style={leftPlaceholderStyle}>
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, top: -4, left: -4, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' }} />
          {/* Moving Scanline */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)',
              top: 0,
              zIndex: 1,
              transform: `translateY(${scanlineY}px)`,
            }}
          />
          {/* Inner Grid */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />
        </div>

        {/* RIGHT VIDEO PLACEHOLDER */}
        <div style={rightPlaceholderStyle}>
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, top: -4, left: -4, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' }} />
          {/* Moving Scanline */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)',
              top: 0,
              zIndex: 1,
              transform: `translateY(${scanlineY}px)`,
            }}
          />
          {/* Inner Grid */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />
        </div>

        {/* SUBSCRIBE PORTAL (CENTER) */}
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
          {/* Outer Reactor Ring */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '4px solid transparent',
              borderTop: '4px solid #00ffff',
              borderBottom: '4px solid #00ffff',
              boxShadow: '0 0 30px #00ffff, inset 0 0 20px #00ffff',
              transform: `rotate(${portalOuterRot}deg)`,
            }}
          />

          {/* Inner Magenta Ring */}
          <div
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              border: '4px dashed #ff00ff',
              boxShadow: '0 0 40px #ff00ff, inset 0 0 20px #ff00ff',
              transform: `rotate(${portalInnerRot}deg)`,
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
              boxShadow: `0 0 ${coreGlow}px #00ffff, 0 0 ${coreGlow * 1.5}px #00ffff`,
              transform: `scale(${coreScale})`,
              filter: `brightness(${1.1 + pulseVal * 0.4})`,
            }}
          />

          {/* Core Target Ring 1 */}
          <div
            style={{
              position: 'absolute',
              width: '25%',
              height: '25%',
              borderRadius: '50%',
              border: '6px solid #fff',
              boxShadow: '0 0 20px #fff',
              transform: `scale(${targetScale1})`,
              opacity: targetOpacity1,
            }}
          />

          {/* Core Target Ring 2 (Offset phase for high-end look) */}
          <div
            style={{
              position: 'absolute',
              width: '25%',
              height: '25%',
              borderRadius: '50%',
              border: '6px solid #fff',
              boxShadow: '0 0 20px #fff',
              transform: `scale(${targetScale2})`,
              opacity: targetOpacity2,
            }}
          />
        </div>

        {/* VFX LIGHT STREAKS */}
        {/* Streak 1 */}
        <div
          style={{
            position: 'absolute',
            height: 2,
            width: 600,
            background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
            borderRadius: '50%',
            top: streak1Y,
            left: 0,
            transform: `translateX(${streak1X}px)`,
            opacity: streak1Opacity,
            mixBlendMode: 'screen',
          }}
        />

        {/* Streak 2 - Magenta */}
        <div
          style={{
            position: 'absolute',
            height: 2,
            width: 800,
            background: 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)',
            boxShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff',
            borderRadius: '50%',
            top: streak2Y,
            left: 0,
            transform: `translateX(${streak2X}px)`,
            opacity: streak2Opacity,
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
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
            borderRadius: '50%',
            top: streak3Y,
            left: 0,
            transform: `translateX(${streak3X}px)`,
            opacity: streak3Opacity,
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* CINEMATIC OVERLAY VIGNETTE */}
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