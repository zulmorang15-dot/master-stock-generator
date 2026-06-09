// ============================================================
// GENERATED FILE — DO NOT EDIT MANUALLY
// This file is overwritten every time you click "Convert HTML → TSX"
// in the dashboard. Any manual edits WILL be lost.
// ============================================================
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Pre-calculated static particle data (deterministic, never uses Math.random inside render)
const PARTICLE_COUNT = 80;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
  const radius = 150 + (i % 5) * 40;
  const speed = 0.3 + (i % 3) * 0.15;
  const size = 2 + (i % 4);
  const hue = Math.round((i / PARTICLE_COUNT) * 360);
  const direction = i % 2 === 0 ? 1 : -1;
  return { angle, radius, speed, size, hue, direction };
});

const RING_COUNT = 5;
const RINGS = Array.from({ length: RING_COUNT }, (_, i) => ({
  radius: 80 + i * 55,
  speed: 0.4 + i * 0.1,
  opacity: 0.15 + i * 0.05,
  direction: i % 2 === 0 ? 1 : -1,
}));

const DefaultPlaceholder = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.9;
  const fps = 30;
  const cycleDuration = fps * 10; // 10-second seamless loop
  const localFrame = frame % cycleDuration;

  // Global pulse
  const pulse = interpolate(
    localFrame,
    [0, cycleDuration / 2, cycleDuration],
    [1, 1.05, 1],
    { easing: Easing.inOut(Easing.sine), extrapolate: 'clamp' }
  );

  // Fade in at start
  const globalOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolate: 'clamp',
  });

  // Central core glow breathe
  const coreGlow = interpolate(
    localFrame,
    [0, cycleDuration / 2, cycleDuration],
    [0.6, 1, 0.6],
    { easing: Easing.inOut(Easing.sine), extrapolate: 'clamp' }
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#040818',
        opacity: globalOpacity,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'center center',
          overflow: 'hidden',
        }}
      >
        {/* Background radial gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 50%, #0d1b4b 0%, #040818 70%)',
          }}
        />

        {/* Orbital rings */}
        {RINGS.map((ring, i) => {
          const rotation = interpolate(
            localFrame,
            [0, cycleDuration],
            [0, 360 * ring.direction],
            { extrapolate: 'clamp' }
          );
          return (
            <div
              key={`ring-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: ring.radius * 2,
                height: ring.radius * 2,
                marginLeft: -ring.radius,
                marginTop: -ring.radius,
                borderRadius: '50%',
                border: `1px solid rgba(0, 200, 255, ${ring.opacity})`,
                transform: `rotate(${rotation}deg)`,
                boxShadow: `0 0 8px rgba(0, 200, 255, ${ring.opacity * 0.5})`,
              }}
            />
          );
        })}

        {/* Orbiting particles */}
        {PARTICLES.map((p, i) => {
          const currentAngle = interpolate(
            localFrame,
            [0, cycleDuration],
            [p.angle, p.angle + Math.PI * 2 * p.speed * p.direction],
            { extrapolate: 'clamp' }
          );
          const px = ORIGINAL_WIDTH / 2 + Math.cos(currentAngle) * p.radius - p.size / 2;
          const py = ORIGINAL_HEIGHT / 2 + Math.sin(currentAngle) * p.radius - p.size / 2;
          const particleOpacity = interpolate(
            localFrame,
            [0, cycleDuration / 2, cycleDuration],
            [0.4, 0.9, 0.4],
            { easing: Easing.inOut(Easing.sine), extrapolate: 'clamp' }
          );
          return (
            <div
              key={`particle-${i}`}
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: `hsl(${p.hue}, 100%, 70%)`,
                opacity: particleOpacity,
                boxShadow: `0 0 ${p.size * 3}px hsl(${p.hue}, 100%, 60%)`,
              }}
            />
          );
        })}

        {/* Central glowing core */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 120,
            height: 120,
            marginLeft: -60,
            marginTop: -60,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #00eeff 0%, #0044ff 50%, transparent 100%)',
            transform: `scale(${pulse * coreGlow})`,
            boxShadow: `0 0 60px rgba(0, 200, 255, ${coreGlow * 0.8}), 0 0 120px rgba(0, 100, 255, ${coreGlow * 0.4})`,
          }}
        />

        {/* Inner core dot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 30px #ffffff, 0 0 60px #00eeff',
          }}
        />

        {/* Placeholder label */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 28,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: 6,
              textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(0, 200, 255, 0.8)',
            }}
          >
            AWAITING COMPOSITION
          </div>
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 16,
              color: 'rgba(100, 200, 255, 0.6)',
              letterSpacing: 2,
            }}
          >
            Upload HTML → Convert → Render
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultPlaceholder;