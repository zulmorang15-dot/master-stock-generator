import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic particles pre-computed to avoid Math.random() in render loop
const PARTICLE_COUNT = 150;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const seedX = Math.sin(i * 12.9898 + 43758.5453);
  const seedY = Math.cos(i * 78.233 + 43758.5453);
  const seedSize = Math.sin(i * 45.123 + 12345.6789);
  
  const x = Math.abs(seedX) * 1920;
  const y = Math.abs(seedY) * 1080;
  const size = 2 + Math.abs(seedSize) * 5;
  const colors = ['#ff007f', '#9d4edd', '#00f0ff'];
  const color = colors[Math.abs(Math.floor(seedX * 100)) % colors.length];
  const speedX = (seedX * 2) % 0.5 - 0.25;
  const speedY = (seedY * 2) % 0.5 - 0.25;
  
  return { x, y, size, color, speedX, speedY, phase: i };
});

export const CinematicEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Scale engine for auto-fit 4K
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  // 10s Seamless loop system
  const cycleDuration = 10;
  const totalFrames = fps * cycleDuration;
  const localFrame = frame % totalFrames;

  // Safe Dynamic Text Props
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'THANKS FOR WATCHING';
  const keywordsList = (inputProps.keywords || 'CYBERPUNK, NEXT VIDEO, SUBSCRIBE, NEON').split(',');

  // Float Animations (Symmetrical loops)
  const leftCardY = interpolate(localFrame, [0, 150, 300], [0, -15, 0], {
    ease: Easing.inOut(Easing.quad),
  });
  const leftCardRotate = interpolate(localFrame, [0, 150, 300], [0, -0.8, 0], {
    ease: Easing.inOut(Easing.quad),
  });

  const rightCardY = interpolate(localFrame, [0, 150, 300], [-10, 5, -10], {
    ease: Easing.inOut(Easing.quad),
  });
  const rightCardRotate = interpolate(localFrame, [0, 150, 300], [0.5, -0.3, 0.5], {
    ease: Easing.inOut(Easing.quad),
  });

  // Subscribe Pulsing and Rotation
  const pulseGlow = interpolate(localFrame, [0, 150, 300], [1, 1.05, 1], {
    ease: Easing.inOut(Easing.quad),
  });
  const outerRotation = interpolate(localFrame, [0, 300], [0, 360]);
  const innerRotation = interpolate(localFrame, [0, 300], [360, 0]);

  // Traveling glow for cinematic progress bar (Seamless sweeping)
  const activeProgressLeft = interpolate(localFrame, [0, 300], [-300, 1000]);

  // Title Elegant Fade and Float
  const titleGlow = interpolate(localFrame, [0, 150, 300], [10, 25, 10], {
    ease: Easing.inOut(Easing.quad),
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#030008',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'center center',
          background: 'radial-gradient(circle at center, #0c051a 0%, #020005 100%)',
          boxShadow: '0 0 150px rgba(0,0,0,0.9)',
          overflow: 'hidden',
        }}
      >
        {/* Dynamic Vector Wave Grid (Alternative to WebGL Grid) */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.6,
          }}
        >
          {/* Horizontal waving perspective lines */}
          {Array.from({ length: 16 }).map((_, i) => {
            const progress = (i + (localFrame / totalFrames)) / 16;
            const y = 500 + progress * 580;
            const scale = progress;
            const widthAtY = 2800 * scale;
            const leftX = 960 - widthAtY / 2;
            const rightX = 960 + widthAtY / 2;
            
            const waveAmp = 25 * (1 - Math.cos(progress * Math.PI));
            let d = `M ${leftX} ${y}`;
            const steps = 30;
            for (let step = 1; step <= steps; step++) {
              const ratio = step / steps;
              const x = leftX + (rightX - leftX) * ratio;
              const waveX = Math.sin(ratio * Math.PI * 4 + (localFrame / totalFrames) * Math.PI * 2) * waveAmp;
              d += ` L ${x} ${y + waveX}`;
            }

            return (
              <path
                key={`h-${i}`}
                d={d}
                fill="none"
                stroke="#9d4edd"
                strokeWidth={1.5 * progress}
                opacity={0.15 + progress * 0.45}
              />
            );
          })}

          {/* Perspective rays radiating from center */}
          {Array.from({ length: 21 }).map((_, i) => {
            const ratio = i / 20;
            const startX = 960;
            const startY = 500;
            const endX = -400 + ratio * 2720;
            const endY = 1080;

            let d = `M ${startX} ${startY}`;
            const steps = 10;
            for (let step = 1; step <= steps; step++) {
              const stepRatio = step / steps;
              const x = startX + (endX - startX) * stepRatio;
              const y = startY + (endY - startY) * stepRatio;
              const waveAmp = 15 * stepRatio;
              const waveX = Math.sin(stepRatio * Math.PI * 2 + (localFrame / totalFrames) * Math.PI * 2) * waveAmp;
              d += ` L ${x + waveX} ${y}`;
            }

            return (
              <path
                key={`p-${i}`}
                d={d}
                fill="none"
                stroke="#00f0ff"
                strokeWidth={1}
                opacity={0.15}
              />
            );
          })}
        </svg>

        {/* Floating Nebula Particles */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
          {PARTICLES.map((p) => {
            // Symmetrical float looping
            const wave = Math.sin((localFrame / totalFrames) * Math.PI * 2);
            const px = p.x + p.speedX * wave * 80;
            const py = p.y + p.speedY * wave * 80;
            const opacity = interpolate(wave, [-1, 1], [0.3, 0.8]);

            return (
              <div
                key={p.phase}
                style={{
                  position: 'absolute',
                  left: px,
                  top: py,
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  opacity: opacity,
                }}
              />
            );
          })}
        </div>

        {/* Cinematic Vignette and Color Grading Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            boxShadow: 'inset 0 0 300px rgba(0, 0, 0, 0.95)',
            background: `
              radial-gradient(circle at 20% 30%, rgba(255, 0, 127, 0.05) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(0, 240, 255, 0.05) 0%, transparent 40%),
              linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%)
            `,
            backgroundSize: '100% 100%, 100% 100%, 100% 6px',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Ambient Lighting Strips */}
        <div
          style={{
            position: 'absolute',
            width: '1200px',
            height: '2px',
            left: '360px',
            background: 'linear-gradient(90deg, transparent, #9d4edd, #00f0ff, #9d4edd, transparent)',
            opacity: 0.5,
            filter: 'blur(2px)',
            top: '180px',
            zIndex: 3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '1200px',
            height: '2px',
            left: '360px',
            background: 'linear-gradient(90deg, transparent, #9d4edd, #00f0ff, #9d4edd, transparent)',
            opacity: 0.5,
            filter: 'blur(2px)',
            bottom: '180px',
            zIndex: 3,
          }}
        />

        {/* UI Layer */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 5 }}>
          
          {/* Section Labels */}
          <div
            style={{
              position: 'absolute',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '6px',
              textTransform: 'uppercase',
              opacity: 0.6,
              width: '640px',
              textAlign: 'center',
              left: '150px',
              top: '315px',
              fontFamily: '"Segoe UI", Roboto, sans-serif',
            }}
          >
            Recommended Video
          </div>

          <div
            style={{
              position: 'absolute',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '6px',
              textTransform: 'uppercase',
              opacity: 0.6,
              width: '640px',
              textAlign: 'center',
              right: '150px',
              top: '315px',
              fontFamily: '"Segoe UI", Roboto, sans-serif',
            }}
          >
            Best for Viewer
          </div>

          {/* Left Video Placeholder */}
          <div
            style={{
              position: 'absolute',
              width: '640px',
              height: '360px',
              top: '360px',
              left: '150px',
              borderRadius: '20px',
              backgroundColor: 'rgba(10, 5, 18, 0.45)',
              border: '1px solid rgba(157, 78, 221, 0.3)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 50px rgba(157, 78, 221, 0.08)',
              overflow: 'hidden',
              transform: `translateY(${leftCardY}px) rotate(${leftCardRotate}deg)`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Tech Corner Accents */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' }}>
              <div
                style={{
                  position: 'absolute',
                  width: '30px',
                  height: '30px',
                  borderColor: '#ff007f',
                  borderStyle: 'solid',
                  opacity: 0.8,
                  top: '-1px',
                  left: '-1px',
                  borderWidth: '3px 0 0 3px',
                  borderRadius: '20px 0 0 0',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '30px',
                  height: '30px',
                  borderColor: '#ff007f',
                  borderStyle: 'solid',
                  opacity: 0.8,
                  bottom: '-1px',
                  right: '-1px',
                  borderWidth: '0 3px 3px 0',
                  borderRadius: '0 0 20px 0',
                }}
              />
            </div>
            {/* Elegant Neon Scanning Effect Inside Placeholder */}
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(45deg, rgba(255, 0, 127, 0.02), rgba(0, 240, 255, 0.02))',
              }}
            />
          </div>

          {/* Right Video Placeholder */}
          <div
            style={{
              position: 'absolute',
              width: '640px',
              height: '360px',
              top: '360px',
              right: '150px',
              borderRadius: '20px',
              backgroundColor: 'rgba(10, 5, 18, 0.45)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 50px rgba(0, 240, 255, 0.08)',
              overflow: 'hidden',
              transform: `translateY(${rightCardY}px) rotate(${rightCardRotate}deg)`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Tech Corner Accents */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' }}>
              <div
                style={{
                  position: 'absolute',
                  width: '30px',
                  height: '30px',
                  borderColor: '#00f0ff',
                  borderStyle: 'solid',
                  opacity: 0.8,
                  top: '-1px',
                  left: '-1px',
                  borderWidth: '3px 0 0 3px',
                  borderRadius: '20px 0 0 0',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '30px',
                  height: '30px',
                  borderColor: '#00f0ff',
                  borderStyle: 'solid',
                  opacity: 0.8,
                  bottom: '-1px',
                  right: '-1px',
                  borderWidth: '0 3px 3px 0',
                  borderRadius: '0 0 20px 0',
                }}
              />
            </div>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(-45deg, rgba(255, 0, 127, 0.02), rgba(0, 240, 255, 0.02))',
              }}
            />
          </div>

          {/* Center Subscribe Ring System */}
          <div
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              top: '390px',
              left: '810px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: `scale(${pulseGlow})`,
            }}
          >
            {/* Outer Cyan Dashed Ring */}
            <div
              style={{
                position: 'absolute',
                width: '270px',
                height: '270px',
                borderRadius: '50%',
                border: '2px dashed #00f0ff',
                opacity: 0.4,
                transform: `rotate(${outerRotation}deg)`,
              }}
            />
            
            {/* Inner Neon Gradiation Ring */}
            <div
              style={{
                position: 'absolute',
                width: '236px',
                height: '236px',
                borderRadius: '50%',
                border: '3px solid transparent',
                borderTop: '3px solid #ff007f',
                borderBottom: '3px solid #9d4edd',
                filter: 'drop-shadow(0 0 12px #ff007f)',
                transform: `rotate(${innerRotation}deg)`,
              }}
            />

            {/* Subscribe Core Element */}
            <div
              style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #1a0b2e 0%, #07020f 100%)',
                border: '2px solid rgba(255, 0, 127, 0.5)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.7), inset 0 0 30px rgba(157, 78, 221, 0.4), 0 0 60px rgba(255, 0, 127, 0.3)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Inner dashed detail */}
              <div
                style={{
                  width: '170px',
                  height: '170px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(255, 0, 127, 0.4)',
                  position: 'absolute',
                }}
              />
              
              {/* Profile Icon / Logo Graphic */}
              <svg
                viewBox="0 0 100 100"
                style={{
                  width: '60px',
                  height: '60px',
                  fill: 'none',
                  stroke: '#ffffff',
                  strokeWidth: 3,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  filter: 'drop-shadow(0 0 8px #ff007f)',
                  zIndex: 10,
                }}
              >
                <path d="M50 20 C35 20, 25 35, 25 50 C25 65, 50 80, 50 80 C50 80, 75 65, 75 50 C75 35, 65 20, 50 20 Z" />
                <circle cx="50" cy="45" r="12" stroke="#00f0ff" />
              </svg>
            </div>
          </div>

          {/* Sweep Laser Progress Line */}
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '700px',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            {/* Seamless Laser Sweep */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: activeProgressLeft,
                height: '100%',
                width: '300px',
                background: 'linear-gradient(90deg, transparent, #9d4edd, #ff007f, #00f0ff, transparent)',
                boxShadow: '0 0 15px #ff007f, 0 0 25px #00f0ff',
              }}
            />
          </div>

          {/* Dynamic Title and Tags Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '120px',
              left: '150px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              fontFamily: '"Segoe UI", Roboto, sans-serif',
            }}
          >
            {/* Glow Title */}
            <h1
              style={{
                margin: 0,
                color: '#ffffff',
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                textShadow: `0 0 ${titleGlow}px rgba(255, 0, 127, 0.8), 0 0 5px rgba(0, 240, 255, 0.5)`,
              }}
            >
              {judul}
            </h1>
            
            {/* Glassmorphic Keyword Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {keywordsList.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: '#00f0ff',
                    backgroundColor: 'rgba(10, 5, 18, 0.6)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '30px',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                    textShadow: '0 0 4px rgba(0, 240, 255, 0.5)',
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

export default CinematicEndscreen;
// END_OF_FILE