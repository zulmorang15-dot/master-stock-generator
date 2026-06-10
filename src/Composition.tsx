import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const BLOBS = [
  { color: '#3b1c63', size: 1000, rx: 350, ry: 250, speedX: 1, speedY: 1, phase: 0, opacity: 0.85 },
  { color: '#ff007f', size: 850, rx: 450, ry: 300, speedX: -1, speedY: 2, phase: Math.PI / 4, opacity: 0.7 },
  { color: '#00f3ff', size: 750, rx: 300, ry: 450, speedX: 2, speedY: -1, phase: Math.PI / 2, opacity: 0.6 },
  { color: '#ffd700', size: 550, rx: 500, ry: 200, speedX: -2, speedY: -2, phase: Math.PI * 0.75, opacity: 0.5 },
  { color: '#3b1c63', size: 900, rx: 250, ry: 400, speedX: -1, speedY: -1, phase: Math.PI, opacity: 0.75 },
  { color: '#ff007f', size: 600, rx: 400, ry: 250, speedX: 2, speedY: 1, phase: Math.PI * 1.25, opacity: 0.55 },
  { color: '#00f3ff', size: 800, rx: 480, ry: 320, speedX: -1, speedY: 2, phase: Math.PI * 1.5, opacity: 0.7 },
  { color: '#ffd700', size: 450, rx: 350, ry: 250, speedX: 1, speedY: -2, phase: Math.PI * 1.75, opacity: 0.5 }
];

export const FluidAuroraLoop = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  const totalFrames = fps * 10;
  const angle = (frame / totalFrames) * Math.PI * 2;

  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'WebGL Fluid Aurora';
  const keywordsList = (inputProps.keywords || '4k, microstock, fluid, seamless, loop, neon').split(',');

  const textOpacity = interpolate(
    frame,
    [0, 45, 255, 300],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const textY = interpolate(
    frame,
    [0, 45, 255, 300],
    [30, 0, 0, -30],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const containerRotation = interpolate(
    frame,
    [0, 300],
    [0, 360],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0b1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'center center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#0a0b1e',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '140%',
            height: '140%',
            top: '-20%',
            left: '-20%',
            filter: 'blur(140px)',
            transform: `rotate(${containerRotation}deg)`,
            transformOrigin: 'center center',
          }}
        >
          {BLOBS.map((blob, index) => {
            const x = Math.cos(angle * blob.speedX + blob.phase) * blob.rx;
            const y = Math.sin(angle * blob.speedY + blob.phase) * blob.ry;
            const blobScale = 1 + Math.sin(angle * 2 + blob.phase) * 0.15;

            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  width: blob.size,
                  height: blob.size,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${blob.color} 0%, rgba(10, 11, 30, 0) 70%)`,
                  opacity: blob.opacity,
                  mixBlendMode: 'screen',
                  transform: `translate(calc(50vw - ${blob.size / 2}px + ${x}px), calc(50vh - ${blob.size / 2}px + ${y}px)) scale(${blobScale})`,
                  transformOrigin: 'center center',
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            background: 'radial-gradient(circle, transparent 30%, rgba(10, 11, 30, 0.85) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.045,
            pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 80,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: '#ffffff',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: 4,
              textShadow: '0 0 20px rgba(255,255,255,0.4), 0 0 40px rgba(0,243,255,0.2)',
              textTransform: 'uppercase',
            }}
          >
            {judul}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            {keywordsList.map((tag, idx) => (
              <div
                key={idx}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {tag.trim()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FluidAuroraLoop;
// END_OF_FILE