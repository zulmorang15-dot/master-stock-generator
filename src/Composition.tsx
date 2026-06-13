import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

interface Particle {
  x: number;
  y: number;
  size: number;
  cycles: number; 
  phase: number;  
  isCyan: boolean;
  rotSpeedX: number;
  rotSpeedY: number;
}

const PARTICLES: Particle[] = [
  { x: -500, y: -200, size: 40, cycles: 3, phase: 0.1, isCyan: true, rotSpeedX: 0.8, rotSpeedY: 1.2 },
  { x: 400, y: 300, size: 55, cycles: 4, phase: 0.4, isCyan: false, rotSpeedX: 1.5, rotSpeedY: 0.6 },
  { x: -700, y: 400, size: 30, cycles: 5, phase: 0.7, isCyan: true, rotSpeedX: 0.5, rotSpeedY: 1.8 },
  { x: 600, y: -350, size: 48, cycles: 3, phase: 0.25, isCyan: false, rotSpeedX: 1.1, rotSpeedY: 1.1 },
  { x: -200, y: -450, size: 35, cycles: 4, phase: 0.8, isCyan: true, rotSpeedX: 2.0, rotSpeedY: 0.5 },
  { x: 300, y: -250, size: 60, cycles: 5, phase: 0.15, isCyan: true, rotSpeedX: 0.7, rotSpeedY: 1.4 },
  { x: -800, y: -100, size: 45, cycles: 3, phase: 0.6, isCyan: false, rotSpeedX: 1.2, rotSpeedY: 0.9 },
  { x: 800, y: 200, size: 32, cycles: 6, phase: 0.35, isCyan: true, rotSpeedX: 0.9, rotSpeedY: 1.5 },
  { x: -350, y: 350, size: 50, cycles: 4, phase: 0.9, isCyan: false, rotSpeedX: 1.4, rotSpeedY: 0.8 },
  { x: 150, y: 450, size: 42, cycles: 5, phase: 0.5, isCyan: true, rotSpeedX: 1.0, rotSpeedY: 1.0 },
  { x: -600, y: -400, size: 38, cycles: 3, phase: 0.05, isCyan: false, rotSpeedX: 0.6, rotSpeedY: 1.7 },
  { x: 700, y: -150, size: 52, cycles: 5, phase: 0.75, isCyan: true, rotSpeedX: 1.3, rotSpeedY: 1.2 },
  { x: -450, y: 150, size: 47, cycles: 4, phase: 0.2, isCyan: false, rotSpeedX: 1.7, rotSpeedY: 0.4 },
  { x: 500, y: -50, size: 33, cycles: 6, phase: 0.65, isCyan: true, rotSpeedX: 0.4, rotSpeedY: 2.1 },
  { x: -100, y: 250, size: 58, cycles: 3, phase: 0.85, isCyan: false, rotSpeedX: 1.1, rotSpeedY: 1.3 },
  { x: 900, y: -300, size: 41, cycles: 5, phase: 0.12, isCyan: true, rotSpeedX: 0.8, rotSpeedY: 0.8 },
  { x: -950, y: -250, size: 36, cycles: 4, phase: 0.45, isCyan: true, rotSpeedX: 1.6, rotSpeedY: 1.1 },
  { x: 250, y: -400, size: 44, cycles: 3, phase: 0.95, isCyan: false, rotSpeedX: 0.5, rotSpeedY: 1.6 },
  { x: -150, y: -150, size: 50, cycles: 5, phase: 0.3, isCyan: true, rotSpeedX: 1.2, rotSpeedY: 1.0 },
  { x: 100, y: 100, size: 65, cycles: 4, phase: 0.55, isCyan: false, rotSpeedX: 0.9, rotSpeedY: 0.7 }
];

const BACKGROUND_RINGS = [
  { r: 450, color: '#00f3ff', rotDirection: 1, z: -500 },
  { r: 350, color: '#0055ff', rotDirection: -1, z: -300 },
  { r: 250, color: '#00f3ff', rotDirection: 1, z: -100 }
];

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const SciFiEsportsEndscreen = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Seamless Camera Parallax Setup
  const camX = Math.sin((frame / 900) * Math.PI * 2 * 2) * 40;
  const camY = Math.cos((frame / 900) * Math.PI * 2 * 1) * 20;

  // Floor Grid Animation
  const gridYOffset = interpolate(frame % 60, [0, 60], [0, 80], { ease: Easing.linear });

  // Center Light Glow Breath
  const glowPulse = interpolate(
    Math.sin((frame / 90) * Math.PI * 2),
    [-1, 1],
    [0.4, 0.8]
  );

  // Scanline Positions
  const scanLeftY = interpolate(frame % 150, [0, 75, 150], [0, 356, 0]);
  const scanRightY = interpolate((frame + 30) % 180, [0, 90, 180], [0, 356, 0]);

  // Video Placeholder Glow Breathe
  const placeholderGlowValue = interpolate(
    Math.sin((frame / 90) * Math.PI * 2),
    [-1, 1],
    [40, 70]
  );
  const placeholderInsetGlowValue = interpolate(
    Math.sin((frame / 90) * Math.PI * 2),
    [-1, 1],
    [30, 60]
  );
  const placeholderGlowStyle = {
    boxShadow: `0 0 ${placeholderGlowValue}px rgba(0, 243, 255, 0.6), inset 0 0 ${placeholderInsetGlowValue}px rgba(0, 243, 255, 0.4)`
  };

  // Subscribe UI Component Rotations & Scaling
  const rotOuter = interpolate(frame % 900, [0, 900], [0, 360]);
  const rotMiddle = interpolate(frame % 450, [0, 450], [360, 0]);
  const rotInner = interpolate(frame % 300, [0, 300], [0, 360]);
  const scaleCore = interpolate(frame % 100, [0, 50, 100], [0.9, 1.2, 0.9]);
  const opacityCore = interpolate(frame % 100, [0, 50, 100], [0.6, 1.0, 0.6]);

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
        backgroundColor: '#00040a',
        fontFamily: 'sans-serif'
      }}
    >
      {/* simulated webgl canvas with high fidelity css 3D elements */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          zIndex: 1,
          perspective: '1000px',
          perspectiveOrigin: '50% 40%',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transform: `translate3d(${camX}px, ${camY}px, 0)`,
          }}
        >
          {/* Cyberpunk Grid Floor */}
          <div
            style={{
              position: 'absolute',
              bottom: '-10%',
              left: '-50%',
              width: '200%',
              height: '80%',
              transform: 'rotateX(82deg)',
              transformOrigin: '50% 100%',
              backgroundImage: `
                linear-gradient(0deg, rgba(0, 243, 255, 0.25) 2px, transparent 2px),
                linear-gradient(90deg, rgba(0, 243, 255, 0.2) 2px, transparent 2px)
              `,
              backgroundSize: '80px 80px',
              backgroundPositionY: `${gridYOffset}px`,
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            }}
          />

          {/* Glowing Ambient Center Light */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 800,
              height: 800,
              marginLeft: -400,
              marginTop: -400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 243, 255, 0.3) 0%, rgba(0, 85, 255, 0.08) 50%, rgba(0, 0, 0, 0) 70%)',
              opacity: glowPulse,
              pointerEvents: 'none',
              transform: 'translateZ(-300px)',
            }}
          />

          {/* giant rings in background */}
          {BACKGROUND_RINGS.map((ring, i) => {
            const rotRingZ = interpolate(frame % 900, [0, 900], [0, 360 * ring.rotDirection]);
            const tiltX = 72 + i * 4;
            const tiltY = 4 + i * 2;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: ring.r * 2,
                  height: ring.r * 2,
                  marginLeft: -ring.r,
                  marginTop: -ring.r,
                  borderRadius: '50%',
                  border: `6px dashed ${ring.color}`,
                  boxShadow: `0 0 40px ${ring.color}, inset 0 0 20px ${ring.color}`,
                  opacity: 0.3,
                  transform: `translateZ(${ring.z}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${rotRingZ}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              />
            );
          })}

          {/* 3D Projected Floating Particles */}
          {PARTICLES.map((p, i) => {
            const t = ((frame * p.cycles / 900) + p.phase) % 1.0;
            const z = interpolate(t, [0, 1], [-1800, 800]);
            const distance = 1000 - z;
            const d = Math.max(distance, 50);
            const fov = 800;
            const scale = fov / d;

            const screenX = 1920 / 2 + p.x * scale;
            const screenY = 1080 / 2 + (p.y - 100) * scale;
            const size = p.size * scale;
            const opacity = interpolate(z, [-1800, -1200, 400, 800], [0, 0.8, 0.8, 0]);

            const rotX = (frame * p.rotSpeedX) % 360;
            const rotY = (frame * p.rotSpeedY) % 360;
            const particleColor = p.isCyan ? '0, 243, 255' : '0, 85, 255';

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: screenX,
                  top: screenY,
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  opacity: opacity,
                  transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                  pointerEvents: 'none',
                }}
              >
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <polygon
                    points="50,5 95,30 95,70 50,95 5,70 5,30"
                    fill="none"
                    stroke={`rgba(${particleColor}, 0.8)`}
                    strokeWidth="4"
                    style={{
                      filter: `drop-shadow(0 0 10px rgba(${particleColor}, 0.6))`
                    }}
                  />
                  <line x1="50" y1="5" x2="50" y2="95" stroke={`rgba(${particleColor}, 0.5)`} strokeWidth="2" />
                  <line x1="5" y1="30" x2="95" y2="70" stroke={`rgba(${particleColor}, 0.5)`} strokeWidth="2" />
                  <line x1="95" y1="30" x2="5" y2="70" stroke={`rgba(${particleColor}, 0.5)`} strokeWidth="2" />
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 20,
          pointerEvents: 'none',
          boxShadow: 'inset 0 150px 100px -100px rgba(0,0,0,0.9), inset 0 -150px 100px -100px rgba(0,0,0,0.9)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* Left Video Placeholder */}
        <div
          style={{
            position: 'absolute',
            top: 250,
            left: 150,
            width: 640,
            height: 360,
            border: '6px solid #00f3ff',
            background: 'rgba(0, 10, 30, 0.4)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            ...placeholderGlowStyle,
          }}
        >
          {/* Top Left Corner */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              width: 50,
              height: 50,
              border: '8px solid #00f3ff',
              borderRight: 'none',
              borderBottom: 'none',
              boxShadow: '0 0 20px #00f3ff',
            }}
          />
          {/* Bottom Right Corner */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 50,
              height: 50,
              border: '8px solid #00f3ff',
              borderLeft: 'none',
              borderTop: 'none',
              boxShadow: '0 0 20px #00f3ff',
            }}
          />
          {/* Scanline Left */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 4,
              background: '#00f3ff',
              boxShadow: '0 0 20px #00f3ff, 0 0 40px #00f3ff',
              opacity: 0.8,
              transform: `translateY(${scanLeftY}px)`,
            }}
          />
        </div>

        {/* Right Video Placeholder */}
        <div
          style={{
            position: 'absolute',
            top: 250,
            right: 150,
            width: 640,
            height: 360,
            border: '6px solid #00f3ff',
            background: 'rgba(0, 10, 30, 0.4)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
            ...placeholderGlowStyle,
          }}
        >
          {/* Top Left Corner */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              width: 50,
              height: 50,
              border: '8px solid #00f3ff',
              borderRight: 'none',
              borderBottom: 'none',
              boxShadow: '0 0 20px #00f3ff',
            }}
          />
          {/* Bottom Right Corner */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 50,
              height: 50,
              border: '8px solid #00f3ff',
              borderLeft: 'none',
              borderTop: 'none',
              boxShadow: '0 0 20px #00f3ff',
            }}
          />
          {/* Scanline Right */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 4,
              background: '#00f3ff',
              boxShadow: '0 0 20px #00f3ff, 0 0 40px #00f3ff',
              opacity: 0.8,
              transform: `translateY(${scanRightY}px)`,
            }}
          />
        </div>

        {/* Subscribe Area */}
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 350,
            height: 350,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Ring Outer */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: 350,
              height: 350,
              border: '4px dashed #0055ff',
              boxShadow: '0 0 30px rgba(0, 85, 255, 0.6)',
              transform: `rotate(${rotOuter}deg)`,
            }}
          />

          {/* Ring Middle */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: 300,
              height: 300,
              borderTop: '12px solid #00f3ff',
              borderBottom: '12px solid #00f3ff',
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              boxShadow: '0 0 40px #00f3ff, inset 0 0 20px #00f3ff',
              transform: `rotate(${rotMiddle}deg)`,
            }}
          />

          {/* Ring Inner */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: 240,
              height: 240,
              border: '6px solid #0055ff',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              transform: `rotate(${rotInner}deg)`,
            }}
          />

          {/* Holo Core */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: 160,
              height: 160,
              background: 'radial-gradient(circle, #00f3ff 0%, rgba(0, 243, 255, 0) 70%)',
              opacity: opacityCore,
              transform: `scale(${scaleCore})`,
              filter: 'brightness(1.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SciFiEsportsEndscreen;
// END_OF_FILE