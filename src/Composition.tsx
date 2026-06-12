import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Pre-calculate 150 3D-tunnel flying particles for high performance and deterministic rendering
const PARTICLE_COUNT = 150;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const sin1 = Math.sin(i * 9.123);
  const cos1 = Math.cos(i * 15.321);
  const sin2 = Math.sin(i * 45.789);
  
  // Angle-based dispersion from center
  const x = sin1 * 1000;
  const y = cos1 * 600;
  
  // Depth start distribution (between 0 and 1000)
  const startDepth = ((sin2 + 1) / 2) * 1000;
  const speed = 3 + Math.abs(sin1) * 5;
  const color = i % 3 === 0 ? '#ff00ff' : '#00ffff';
  const size = 2 + Math.abs(cos1) * 5;
  
  return { x, y, startDepth, speed, color, size };
});

// Background rings config matching the Three.js viewport
const BACKGROUND_RINGS = [
  { radius: 180, color: '#00ffff', rotSpeed: 0.3, dir: 1, rotX: 55, rotY: 15 },
  { radius: 260, color: '#ff00ff', rotSpeed: 0.5, dir: -1, rotX: 40, rotY: -25 },
  { radius: 340, color: '#00ffff', rotSpeed: 0.2, dir: 1, rotX: 65, rotY: 35 },
  { radius: 420, color: '#ff00ff', rotSpeed: 0.4, dir: -1, rotX: 30, rotY: -15 },
  { radius: 500, color: '#00ffff', rotSpeed: 0.15, dir: 1, rotX: 50, rotY: 20 },
];

// Pre-calculated horizontal offsets for light streak variation
const STREAK_1_Y_OFFSETS = [250, 210, 290];
const STREAK_2_Y_OFFSETS = [850, 890, 810];
const STREAK_3_Y_OFFSETS = [450, 410, 490, 430];

export const CyberpunkEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);
  
  // --- FLOOR ANIMATION ---
  // Moving grid floor lines forward
  const floorGridOffset = (frame * 12) % 40;
  const floorGridOffsetMagenta = (frame * 12) % 80;

  // --- FLOATING CAMERA PARALLAX EFFECT ---
  // Subtly translates background to mimic the camera floating mechanics in Three.js
  const cameraTranslateX = Math.sin((frame / 360) * Math.PI * 2) * 15;
  const cameraTranslateY = Math.cos((frame / 360) * Math.PI * 2) * 10;

  // --- PLACEHOLDER GLOW FLICKER (AGGRESSIVE NEON PULSES) ---
  const jitterSeed = Math.sin(frame * 0.9) * Math.cos(frame * 0.45) * 0.5 + 0.5;
  const glowRadiusLeft = interpolate(jitterSeed, [0, 1], [30, 65]);
  const glowRadiusRight = interpolate(Math.cos(frame * 0.8) * Math.sin(frame * 0.5) * 0.5 + 0.5, [0, 1], [30, 65]);

  const placeholderGlowLeft = `0 0 ${glowRadiusLeft}px rgba(0, 255, 255, 0.5), inset 0 0 ${glowRadiusLeft / 1.5}px rgba(0, 255, 255, 0.25)`;
  const placeholderGlowRight = `0 0 ${glowRadiusRight}px rgba(0, 255, 255, 0.5), inset 0 0 ${glowRadiusRight / 1.5}px rgba(0, 255, 255, 0.25)`;

  // --- SCANLINE ANIMATION ---
  // Loops 3 times over 360 frames (every 120 frames)
  const scanlineFrame = frame % 120;
  const scanlineY = interpolate(scanlineFrame, [0, 120], [-100, 438], {
    easing: Easing.linear,
  });

  // --- SUBSCRIBE PORTAL ROTATIONS AND PULSES ---
  const outerRingRotate = interpolate(frame, [0, 360], [0, 360]);
  const innerRingRotate = interpolate(frame, [0, 360], [360, 0]);
  
  const corePulseFactor = Math.sin((frame / 30) * Math.PI * 2); // 1-second pulse cycle
  const coreScale = interpolate(corePulseFactor, [-1, 1], [0.92, 1.08]);
  const coreGlowIntensity = interpolate(corePulseFactor, [-1, 1], [60, 110]);

  // Infinite expanding target circle inside the core (1-second loop)
  const targetFrame = frame % 30;
  const targetScale = interpolate(targetFrame, [0, 30], [0, 2.8]);
  const targetOpacity = interpolate(targetFrame, [0, 15, 30], [1, 0.8, 0], {
    extrapolateRight: 'clamp',
  });

  // --- SEAMLESS HORIZONTAL LIGHT STREAKS ---
  // Streak 1 (Cyan): loops every 120 frames
  const streak1Frame = frame % 120;
  const streak1X = interpolate(streak1Frame, [0, 90], [-800, 2100], {
    easing: Easing.bezier(0.25, 1, 0.5, 1),
    extrapolateRight: 'clamp',
  });
  const streak1Opacity = interpolate(streak1Frame, [0, 15, 75, 90], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const streak1Cycle = Math.floor(frame / 120);
  const streak1Y = STREAK_1_Y_OFFSETS[streak1Cycle % 3];

  // Streak 2 (Magenta): loops every 180 frames with offset
  const streak2Frame = (frame + 60) % 180;
  const streak2X = interpolate(streak2Frame, [0, 130], [-1000, 2100], {
    easing: Easing.bezier(0.25, 1, 0.5, 1),
    extrapolateRight: 'clamp',
  });
  const streak2Opacity = interpolate(streak2Frame, [0, 20, 110, 130], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const streak2Cycle = Math.floor((frame + 60) / 180);
  const streak2Y = STREAK_2_Y_OFFSETS[streak2Cycle % 3];

  // Streak 3 (Cyan): loops every 90 frames with offset
  const streak3Frame = (frame + 30) % 90;
  const streak3X = interpolate(streak3Frame, [0, 65], [-700, 2100], {
    easing: Easing.bezier(0.25, 1, 0.5, 1),
    extrapolateRight: 'clamp',
  });
  const streak3Opacity = interpolate(streak3Frame, [0, 10, 55, 65], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const streak3Cycle = Math.floor((frame + 30) / 90);
  const streak3Y = STREAK_3_Y_OFFSETS[streak3Cycle % 4];

  // Common Corner Element UI Style
  const cornerBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: 40,
    height: 40,
    border: '4px solid #fff',
    boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
    zIndex: 2,
  };

  return (
    <div
      style={{
        backgroundColor: '#010105',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
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
        {/* ==========================================
            BACKGROUND 3D VOLUMETRIC SCENE
        ========================================== */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: `translate(${cameraTranslateX}px, ${cameraTranslateY}px)`,
            zIndex: 1,
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Volumetric Lights Simulation */}
          <div
            style={{
              position: 'absolute',
              left: '15%',
              top: '20%',
              width: 800,
              height: 800,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 255, 255, 0.12) 0%, transparent 70%)',
              filter: 'blur(80px)',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '10%',
              bottom: '15%',
              width: 900,
              height: 900,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 0, 255, 0.08) 0%, transparent 70%)',
              filter: 'blur(90px)',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />

          {/* 3D Holographic Starfield Particles */}
          {PARTICLES.map((p, idx) => {
            const zMax = 1000;
            const rawDepth = p.startDepth - (frame * p.speed);
            const depth = ((rawDepth % zMax) + zMax) % zMax;
            
            // Perspective Projection
            const projScale = 220 / (depth + 1);
            const screenX = 960 + p.x * projScale;
            const screenY = 540 + p.y * projScale;
            const opacity = interpolate(depth, [0, 80, 850, 1000], [0, 0.85, 0.85, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const size = p.size * (projScale * 0.4 + 0.6);

            // Clip elements way out of viewport bounds
            if (screenX < -200 || screenX > 2120 || screenY < -200 || screenY > 1280) {
              return null;
            }

            return (
              <div
                key={`p-${idx}`}
                style={{
                  position: 'absolute',
                  left: screenX,
                  top: screenY,
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${size * 2.5}px ${p.color}`,
                  opacity,
                  pointerEvents: 'none',
                }}
              />
            );
          })}

          {/* Rotating Holographic Background Rings */}
          {BACKGROUND_RINGS.map((ring, idx) => {
            const angle = (frame * ring.rotSpeed * ring.dir) % 360;
            return (
              <div
                key={`bg-ring-${idx}`}
                style={{
                  position: 'absolute',
                  width: ring.radius * 2,
                  height: ring.radius * 2,
                  border: `3px solid ${ring.color}`,
                  borderRadius: '50%',
                  opacity: 0.18,
                  boxShadow: `0 0 35px ${ring.color}, inset 0 0 35px ${ring.color}`,
                  left: '50%',
                  top: '52%',
                  transform: `translate(-50%, -50%) translateZ(${-150 - idx * 60}px) rotateX(${ring.rotX}deg) rotateY(${ring.rotY}deg) rotateZ(${angle}deg)`,
                  transformStyle: 'preserve-3d',
                  pointerEvents: 'none',
                }}
              />
            );
          })}

          {/* Holographic 3D Grid Floors (Cyan & Magenta Layers) */}
          <div
            style={{
              position: 'absolute',
              width: '240%',
              height: '100%',
              bottom: '-25%',
              left: '-70%',
              transform: 'perspective(450px) rotateX(82deg)',
              transformOrigin: 'bottom center',
              backgroundSize: '40px 40px',
              backgroundImage: 'linear-gradient(to right, rgba(0, 255, 255, 0.15) 1.5px, transparent 1.5px), linear-gradient(to bottom, rgba(0, 255, 255, 0.15) 1.5px, transparent 1.5px)',
              backgroundPositionY: `${floorGridOffset}px`,
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 95%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 95%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '240%',
              height: '100%',
              bottom: '-25.5%',
              left: '-70%',
              transform: 'perspective(450px) rotateX(82deg)',
              transformOrigin: 'bottom center',
              backgroundSize: '80px 80px',
              backgroundImage: 'linear-gradient(to right, rgba(255, 0, 255, 0.08) 2px, transparent 2px), linear-gradient(to bottom, rgba(255, 0, 255, 0.08) 2px, transparent 2px)',
              backgroundPositionY: `${floorGridOffsetMagenta}px`,
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* ==========================================
            HUD / FRONT UI LAYER
        ========================================== */}
        <div 
          className="ui-layer"
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
          <div
            className="placeholder left"
            style={{
              position: 'absolute',
              width: 600,
              height: 338,
              left: 100,
              top: 371,
              backgroundColor: 'rgba(1, 4, 15, 0.72)',
              border: '3px solid #00ffff',
              boxShadow: placeholderGlowLeft,
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
            }}
          >
            {/* Corner Bracket Details */}
            <div style={{ ...cornerBaseStyle, top: -4, left: -4, borderRight: 'none', borderBottom: 'none' }} />
            <div style={{ ...cornerBaseStyle, top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' }} />
            <div style={{ ...cornerBaseStyle, bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' }} />
            <div style={{ ...cornerBaseStyle, bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' }} />
            
            {/* Inside Grid Pattern */}
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

            {/* Sweep Scanline */}
            <div
              className="scanline"
              style={{
                position: 'absolute',
                width: '100%',
                height: 100,
                background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.35), transparent)',
                top: 0,
                transform: `translateY(${scanlineY}px)`,
                zIndex: 1,
              }}
            />
          </div>

          {/* RIGHT VIDEO PLACEHOLDER */}
          <div
            className="placeholder right"
            style={{
              position: 'absolute',
              width: 600,
              height: 338,
              right: 100,
              top: 371,
              backgroundColor: 'rgba(1, 4, 15, 0.72)',
              border: '3px solid #00ffff',
              boxShadow: placeholderGlowRight,
              backdropFilter: 'blur(8px)',
              overflow: 'hidden',
            }}
          >
            {/* Corner Bracket Details */}
            <div style={{ ...cornerBaseStyle, top: -4, left: -4, borderRight: 'none', borderBottom: 'none' }} />
            <div style={{ ...cornerBaseStyle, top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' }} />
            <div style={{ ...cornerBaseStyle, bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' }} />
            <div style={{ ...cornerBaseStyle, bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' }} />
            
            {/* Inside Grid Pattern */}
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

            {/* Sweep Scanline */}
            <div
              className="scanline"
              style={{
                position: 'absolute',
                width: '100%',
                height: 100,
                background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.35), transparent)',
                top: 0,
                transform: `translateY(${scanlineY}px)`,
                zIndex: 1,
              }}
            />
          </div>

          {/* CENTRAL SUBSCRIBE PORTAL */}
          <div
            className="subscribe-portal"
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
            {/* Outer Cyan Ring */}
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
                boxShadow: '0 0 35px #00ffff, inset 0 0 25px #00ffff',
                transform: `rotate(${outerRingRotate}deg)`,
              }}
            />

            {/* Inner Dashed Magenta Ring */}
            <div
              className="ring-inner"
              style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                borderRadius: '50%',
                border: '4px dashed #ff00ff',
                boxShadow: '0 0 45px #ff00ff, inset 0 0 25px #ff00ff',
                transform: `rotate(${innerRingRotate}deg)`,
              }}
            />

            {/* Central Holographic Core Glow */}
            <div
              className="core-glow"
              style={{
                position: 'absolute',
                width: '45%',
                height: '45%',
                borderRadius: '50%',
                background: 'radial-gradient(circle at center, #ffffff 0%, #00ffff 45%, transparent 75%)',
                boxShadow: `0 0 ${coreGlowIntensity}px #00ffff, 0 0 ${coreGlowIntensity + 40}px #00ffff`,
                transform: `scale(${coreScale})`,
              }}
            />

            {/* Exploding Holographic Core Rings */}
            <div
              className="core-target"
              style={{
                position: 'absolute',
                width: '25%',
                height: '25%',
                borderRadius: '50%',
                border: '6px solid #fff',
                boxShadow: '0 0 25px #fff',
                transform: `scale(${targetScale})`,
                opacity: targetOpacity,
              }}
            />
          </div>

          {/* HIGH-SPEED VECTOR LIGHT STREAKS */}
          <div
            className="light-streak"
            id="streak-1"
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
              zIndex: 5,
              mixBlendMode: 'screen',
            }}
          />
          <div
            className="light-streak magenta"
            id="streak-2"
            style={{
              position: 'absolute',
              height: 2.5,
              width: 800,
              background: 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)',
              boxShadow: '0 0 25px #ff00ff, 0 0 45px #ff00ff',
              borderRadius: '50%',
              top: streak2Y,
              left: 0,
              transform: `translateX(${streak2X}px)`,
              opacity: streak2Opacity,
              zIndex: 5,
              mixBlendMode: 'screen',
            }}
          />
          <div
            className="light-streak"
            id="streak-3"
            style={{
              position: 'absolute',
              height: 1.8,
              width: 500,
              background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
              boxShadow: '0 0 15px #00ffff, 0 0 35px #00ffff',
              borderRadius: '50%',
              top: streak3Y,
              left: 0,
              transform: `translateX(${streak3X}px)`,
              opacity: streak3Opacity,
              zIndex: 5,
              mixBlendMode: 'screen',
            }}
          />
        </div>

        {/* OVERLAY CINEMATIC VIGNETTE */}
        <div
          className="vignette"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            boxShadow: 'inset 0 0 260px rgba(0, 0, 0, 0.95)',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default CyberpunkEndscreen;
// END_OF_FILE