import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLES = [
  { id: 1, x: -650, y: -280, size: 35, colorType: 0, delay: 0 },
  { id: 2, x: 700, y: 120, size: 22, colorType: 1, delay: 45 },
  { id: 3, x: -350, y: 320, size: 48, colorType: 0, delay: 90 },
  { id: 4, x: 500, y: -200, size: 15, colorType: 1, delay: 15 },
  { id: 5, x: -750, y: 180, size: 28, colorType: 0, delay: 30 },
  { id: 6, x: 250, y: -380, size: 42, colorType: 1, delay: 105 },
  { id: 7, x: -180, y: -280, size: 19, colorType: 0, delay: 60 },
  { id: 8, x: 550, y: -120, size: 31, colorType: 1, delay: 75 },
  { id: 9, x: -450, y: 380, size: 25, colorType: 0, delay: 110 },
  { id: 10, x: 350, y: 280, size: 38, colorType: 1, delay: 50 },
  { id: 11, x: -680, y: -180, size: 45, colorType: 0, delay: 15 },
  { id: 12, x: 780, y: -320, size: 12, colorType: 1, delay: 85 },
  { id: 13, x: -220, y: 150, size: 33, colorType: 0, delay: 40 },
  { id: 14, x: 480, y: 220, size: 29, colorType: 1, delay: 95 },
  { id: 15, x: -850, y: -420, size: 50, colorType: 0, delay: 70 },
  { id: 16, x: 150, y: -180, size: 17, colorType: 1, delay: 115 },
  { id: 17, x: -380, y: -220, size: 26, colorType: 0, delay: 35 },
  { id: 18, x: 850, y: 420, size: 40, colorType: 1, delay: 65 },
  { id: 19, x: -120, y: 420, size: 21, colorType: 0, delay: 100 },
  { id: 20, x: 620, y: -300, size: 36, colorType: 1, delay: 55 }
];

const Corner = ({ top, left, bottom, right }: { top?: number; left?: number; bottom?: number; right?: number }) => (
  <div
    style={{
      position: 'absolute',
      top: top !== undefined ? top - 6 : undefined,
      left: left !== undefined ? left - 6 : undefined,
      bottom: bottom !== undefined ? bottom - 6 : undefined,
      right: right !== undefined ? right - 6 : undefined,
      width: 50,
      height: 50,
      borderWidth: 8,
      borderStyle: 'solid',
      borderColor: '#00f3ff',
      borderRightColor: right !== undefined ? '#00f3ff' : 'transparent',
      borderBottomColor: bottom !== undefined ? '#00f3ff' : 'transparent',
      borderLeftColor: left !== undefined ? '#00f3ff' : 'transparent',
      borderTopColor: top !== undefined ? '#00f3ff' : 'transparent',
      boxShadow: '0 0 20px #00f3ff',
      zIndex: 5,
    }}
  />
);

const SciFiEsportsEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Sci-Fi Endscreen';
  const keywordsList = (inputProps.keywords || 'esports, cyberpunk, neon, loop').split(',');

  // UI Animations
  const glowIntensity = interpolate(frame % 50, [0, 25, 50], [0.4, 1.0, 0.4]);
  const scanLeftY = interpolate(frame % 75, [0, 37.5, 75], [0, 356, 0]);
  const scanRightY = interpolate(frame % 60, [0, 30, 60], [0, 356, 0]);

  // Subscribe rings rotations (seamless)
  const spinOuter = interpolate(frame % 300, [0, 300], [0, 360]);
  const spinMiddle = interpolate(frame % 150, [0, 150], [360, 0]);
  const spinInner = interpolate(frame % 75, [0, 75], [0, 360]);

  const coreScale = interpolate(frame % 60, [0, 30, 60], [0.9, 1.2, 0.9]);
  const coreOpacity = interpolate(frame % 60, [0, 30, 60], [0.6, 1.0, 0.6]);
  const coreBrightness = interpolate(frame % 60, [0, 30, 60], [1, 1.5, 1]);

  // Cyberpunk background grid movement (seamless 40px cycle)
  const gridOffset = interpolate(frame % 30, [0, 30], [0, 40]);

  // Floating background motion (sine-driven, loop-locked over 300 frames)
  const ringAngleX = Math.sin((frame / 300) * Math.PI * 2) * 12;
  const ringAngleY = Math.cos((frame / 300) * Math.PI * 2) * 12;

  // Seamless Text Fade
  const textOpacity = interpolate(frame, [0, 30, 270, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          position: 'relative',
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'center center',
          backgroundColor: '#00040a',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Cinematic Backdrop & Grid */}
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            left: '-50%',
            width: '200%',
            height: 600,
            backgroundImage:
              'linear-gradient(to right, #00f3ff 1px, transparent 1px), linear-gradient(to bottom, #00f3ff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.18,
            transform: `perspective(500px) rotateX(75deg) translateY(${gridOffset}px)`,
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* 3D Glowing Torus Background Simulation */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 800,
            height: 800,
            border: '4px solid #00f3ff',
            borderRadius: '50%',
            opacity: 0.12,
            boxShadow: '0 0 50px rgba(0, 243, 255, 0.4)',
            transform: `translate(-50%, -50%) perspective(1000px) rotateX(${70 + ringAngleX}deg) rotateY(${ringAngleY}deg) rotateZ(${interpolate(
              frame % 300,
              [0, 300],
              [0, 360]
            )}deg)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 650,
            height: 650,
            border: '6px dashed #0055ff',
            borderRadius: '50%',
            opacity: 0.15,
            boxShadow: '0 0 40px rgba(0, 85, 255, 0.4)',
            transform: `translate(-50%, -50%) perspective(1000px) rotateX(${65 - ringAngleX}deg) rotateY(${20 + ringAngleY}deg) rotateZ(${interpolate(
              frame % 300,
              [0, 300],
              [360, 0]
            )}deg)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 500,
            height: 500,
            border: '8px double #00f3ff',
            borderRadius: '50%',
            opacity: 0.2,
            boxShadow: '0 0 30px rgba(0, 243, 255, 0.5)',
            transform: `translate(-50%, -50%) perspective(1000px) rotateX(${60 + ringAngleY}deg) rotateY(${10 - ringAngleX}deg) rotateZ(${interpolate(
              frame % 300,
              [0, 300],
              [0, 720]
            )}deg)`,
          }}
        />

        {/* Foreground Traveling Geometric Particles */}
        {PARTICLES.map((p) => {
          const cycle = 120;
          const pFrame = (frame + p.delay) % cycle;
          const progress = pFrame / cycle;

          const scale = interpolate(progress, [0, 0.9, 1], [0.1, 1.4, 2.5]);
          const opacity = interpolate(progress, [0, 0.15, 0.85, 1], [0, 0.7, 0.7, 0]);
          const currentX = p.x * interpolate(progress, [0, 1], [0.3, 1.8]);
          const currentY = p.y * interpolate(progress, [0, 1], [0.3, 1.8]);

          const color = p.colorType === 0 ? '#00f3ff' : '#0055ff';

          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `calc(50% + ${currentX}px)`,
                top: `calc(50% + ${currentY}px)`,
                width: p.size,
                height: p.size,
                backgroundColor: 'transparent',
                border: `2px solid ${color}`,
                boxShadow: `0 0 15px ${color}`,
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${pFrame * 1.5}deg)`,
                opacity,
                clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              }}
            />
          );
        })}

        {/* Ambient Dark Cinematic Vignette */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 15,
            pointerEvents: 'none',
            boxShadow:
              'inset 0 150px 100px -100px rgba(0,0,0,0.95), inset 0 -150px 100px -100px rgba(0,0,0,0.95)',
          }}
        />

        {/* UI Layer */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 10 }}>
          {/* Left Gameplay Placeholder */}
          <div
            style={{
              position: 'absolute',
              top: 250,
              left: 150,
              width: 640,
              height: 360,
              border: '6px solid #00f3ff',
              boxShadow: `0 0 ${30 + glowIntensity * 40}px rgba(0, 243, 255, ${
                0.4 + glowIntensity * 0.4
              }), inset 0 0 ${30 + glowIntensity * 30}px rgba(0, 243, 255, ${
                0.2 + glowIntensity * 0.3
              })`,
              backgroundColor: 'rgba(0, 10, 30, 0.4)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden',
            }}
          >
            <Corner top={0} left={0} />
            <Corner bottom={0} right={0} />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 4,
                backgroundColor: '#00f3ff',
                boxShadow: '0 0 20px #00f3ff, 0 0 40px #00f3ff',
                opacity: 0.8,
                transform: `translateY(${scanLeftY}px)`,
              }}
            />
          </div>

          {/* Right Gameplay Placeholder */}
          <div
            style={{
              position: 'absolute',
              top: 250,
              right: 150,
              width: 640,
              height: 360,
              border: '6px solid #00f3ff',
              boxShadow: `0 0 ${30 + glowIntensity * 40}px rgba(0, 243, 255, ${
                0.4 + glowIntensity * 0.4
              }), inset 0 0 ${30 + glowIntensity * 30}px rgba(0, 243, 255, ${
                0.2 + glowIntensity * 0.3
              })`,
              backgroundColor: 'rgba(0, 10, 30, 0.4)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden',
            }}
          >
            <Corner top={0} left={0} />
            <Corner bottom={0} right={0} />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 4,
                backgroundColor: '#00f3ff',
                boxShadow: '0 0 20px #00f3ff, 0 0 40px #00f3ff',
                opacity: 0.8,
                transform: `translateY(${scanRightY}px)`,
              }}
            />
          </div>

          {/* Centered Subscribe Area */}
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
            <div
              style={{
                position: 'absolute',
                width: 350,
                height: 350,
                borderRadius: '50%',
                border: '4px dashed #0055ff',
                boxShadow: '0 0 30px rgba(0, 85, 255, 0.6)',
                transform: `rotate(${spinOuter}deg)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                borderTop: '12px solid #00f3ff',
                borderBottom: '12px solid #00f3ff',
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                boxShadow: '0 0 40px #00f3ff, inset 0 0 20px #00f3ff',
                transform: `rotate(${spinMiddle}deg)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 240,
                height: 240,
                borderRadius: '50%',
                border: '6px solid #0055ff',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                transform: `rotate(${spinInner}deg)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #00f3ff 0%, rgba(0, 243, 255, 0) 70%)',
                transform: `scale(${coreScale})`,
                opacity: coreOpacity,
                filter: `brightness(${coreBrightness})`,
              }}
            />
          </div>

          {/* Dynamic Text & Glassmorphic Badge Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 80,
              left: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              opacity: textOpacity,
            }}
          >
            <h1
              style={{
                fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
                fontSize: '44px',
                fontWeight: 900,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '4px',
                textShadow: '0 0 20px #00f3ff, 0 0 40px rgba(0, 243, 255, 0.6)',
                margin: 0,
              }}
            >
              {judul}
            </h1>
            <div style={{ display: 'flex', gap: 10 }}>
              {keywordsList.map((tag: string, index: number) => (
                <span
                  key={index}
                  style={{
                    fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#00f3ff',
                    backgroundColor: 'rgba(0, 243, 255, 0.12)',
                    border: '1px solid rgba(0, 243, 255, 0.4)',
                    borderRadius: '20px',
                    padding: '6px 16px',
                    backdropFilter: 'blur(10px)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 0 10px rgba(0, 243, 255, 0.2)',
                  }}
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SciFiEsportsEndscreen;
// END_OF_FILE