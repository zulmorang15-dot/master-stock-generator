import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import React from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Pre-calculate deterministic particle values outside the component to prevent frame-tearing
const PARTICLES = [
  { id: 1, width: 3, height: 15, left: '20%', color: '#00ffff', duration: 5, delay: 0 },
  { id: 2, width: 4, height: 4, left: '80%', color: '#ff00ff', duration: 10, delay: 2 },
  { id: 3, width: 10, height: 2, left: '50%', color: '#ffff00', duration: 2.5, delay: 1 },
  { id: 4, width: 2, height: 20, left: '35%', color: '#00ffff', duration: 5, delay: 3 },
  { id: 5, width: 5, height: 5, left: '65%', color: '#ff00ff', duration: 5, delay: 4 },
];

export const CyberpunkOverlayTemplate: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Scale factor to fill 16:9 1080p frame perfectly on any composition resolution
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 10s Loop (600 frames at 60fps)
  const loopDurationFrames = fps * 10;
  const localFrame = frame % loopDurationFrames;

  // Master Glitch Calculation
  const glitchProgress = (localFrame / loopDurationFrames) * 100;
  let glitchX = 0;
  let glitchY = 0;
  let glitchFilter = 'none';

  if (glitchProgress >= 48.5 && glitchProgress < 49.5) {
    glitchX = -3;
    glitchY = 2;
    glitchFilter = 'drop-shadow(4px 0px 0px #00ffff) drop-shadow(-4px 0px 0px #ff00ff)';
  } else if (glitchProgress >= 49.5 && glitchProgress < 50.5) {
    glitchX = 3;
    glitchY = -2;
    glitchFilter = 'drop-shadow(-4px 0px 0px #00ffff) drop-shadow(4px 0px 0px #ff00ff)';
  } else if (glitchProgress >= 96.5 && glitchProgress < 97.5) {
    glitchX = 2;
    glitchY = 3;
    glitchFilter = 'drop-shadow(5px 0px 0px #00ffff) drop-shadow(-5px 0px 0px #ff00ff)';
  } else if (glitchProgress >= 97.5 && glitchProgress < 98.5) {
    glitchX = -4;
    glitchY = -1;
    glitchFilter = 'drop-shadow(-5px 0px 0px #00ffff) drop-shadow(5px 0px 0px #ff00ff)';
  }

  // Ambient Lights pulsing (10s total loop, 5s alternate)
  const pulseLeftProgress = 0.5 - 0.5 * Math.cos((localFrame / loopDurationFrames) * 2 * Math.PI);
  const opacityLeft = interpolate(pulseLeftProgress, [0, 1], [0.15, 0.35]);
  const scaleLeft = interpolate(pulseLeftProgress, [0, 1], [0.9, 1.1]);

  const localFrameRight = (localFrame + fps * 2.5) % loopDurationFrames;
  const pulseRightProgress = 0.5 - 0.5 * Math.cos((localFrameRight / loopDurationFrames) * 2 * Math.PI);
  const opacityRight = interpolate(pulseRightProgress, [0, 1], [0.15, 0.35]);
  const scaleRight = interpolate(pulseRightProgress, [0, 1], [0.9, 1.1]);

  // Moving synthwave grid calculation (5s loop)
  const gridProgress = (localFrame % (fps * 5)) / (fps * 5);
  const gridBackgroundPosition = `0% ${gridProgress * 15}%`;

  // Glowing borders rotation (5s loop)
  const borderProgress = (localFrame % (fps * 5)) / (fps * 5);
  const borderRotationLeft = borderProgress * 360;
  const borderRotationRight = (1 - borderProgress) * 360;

  // Circular subscribe border rotation (2.5s loop)
  const circleProgress = (localFrame % (fps * 2.5)) / (fps * 2.5);
  const circleRotation = circleProgress * 360;

  // Jump glitch line calculations (5s loop)
  const gp = (localFrame % (fps * 5)) / (fps * 5) * 100;
  let lineOpacity = 0;
  let lineTop = '0%';
  if (gp >= 90 && gp < 91) {
    lineOpacity = 1;
    lineTop = '20%';
  } else if (gp >= 92 && gp < 93) {
    lineOpacity = 1;
    lineTop = '20%';
  } else if (gp >= 93 && gp < 94) {
    lineOpacity = 1;
    lineTop = '75%';
  } else if (gp >= 95 && gp < 96) {
    lineOpacity = 1;
    lineTop = '40%';
  }

  return (
    <div
      style={{
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${glitchX}px), calc(-50% + ${glitchY}px)) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#050505',
        boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.9)',
        filter: glitchFilter,
      }}
    >
      {/* Ambient Pulsing Lights */}
      <div
        className="ambient-light light-left"
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '40%',
          height: '60%',
          background: '#00ffff',
          borderRadius: '50%',
          filter: 'blur(80px)',
          zIndex: 0,
          opacity: opacityLeft,
          transform: `scale(${scaleLeft})`,
        }}
      />
      <div
        className="ambient-light light-right"
        style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '40%',
          height: '60%',
          background: '#ff00ff',
          borderRadius: '50%',
          filter: 'blur(80px)',
          zIndex: 0,
          opacity: opacityRight,
          transform: `scale(${scaleRight})`,
        }}
      />

      {/* Synthwave Moving Grid */}
      <div
        className="grid-wrapper"
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-50%',
          width: '200%',
          height: '70%',
          perspective: 800,
          zIndex: 1,
        }}
      >
        <div
          className="grid-surface"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundImage: `
              linear-gradient(to right, rgba(0, 255, 255, 0.2) 2px, transparent 2px),
              linear-gradient(to top, rgba(255, 0, 255, 0.4) 2px, transparent 2px)
            `,
            backgroundSize: '3% 15%',
            backgroundPosition: gridBackgroundPosition,
            transform: 'rotateX(75deg)',
            transformOrigin: 'center top',
            boxShadow: 'inset 0 100px 100px #050505',
          }}
        />
      </div>

      {/* Floating Cyber Particles */}
      <div className="particles" style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
        {PARTICLES.map((p) => {
          const durationFrames = p.duration * fps;
          const delayFrames = p.delay * fps;
          const pFrame = (localFrame + delayFrames) % durationFrames;
          const progress = pFrame / durationFrames;

          const translateY = interpolate(progress, [0, 1], [1180, -100]);
          const scale = interpolate(progress, [0, 1], [1, 0.5]);
          const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 0.8, 0.8, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={p.id}
              className={`particle p${p.id}`}
              style={{
                position: 'absolute',
                width: p.width,
                height: p.height,
                left: p.left,
                backgroundColor: p.color,
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
                transformOrigin: 'bottom center',
              }}
            />
          );
        })}
      </div>

      {/* Horizontal Glitch Line */}
      <div
        className="glitch-line"
        style={{
          position: 'absolute',
          width: '100%',
          height: 2,
          background: 'rgba(255, 255, 255, 0.8)',
          boxShadow: '0 0 10px #00ffff, 0 0 10px #ff00ff',
          zIndex: 90,
          opacity: lineOpacity,
          top: lineTop,
        }}
      />

      {/* Video Box Left */}
      <div
        className="video-box video-left"
        style={{
          position: 'absolute',
          width: '36%',
          aspectRatio: '16 / 9',
          top: '16%',
          left: '9%',
          zIndex: 10,
        }}
      >
        <div
          className="border-wrapper border-left"
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            background: '#222',
            overflow: 'hidden',
            zIndex: -1,
            boxShadow: '0 0 25px rgba(0, 255, 255, 0.4)',
          }}
        >
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent 60%, #00ffff 100%)',
              transform: `rotate(${borderRotationLeft}deg)`,
              transformOrigin: 'center center',
            }}
          />
        </div>
        <div
          className="green-screen-rect"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#00FF00',
            zIndex: 2,
          }}
        />
        <div
          className="tech-corners"
          style={{
            position: 'absolute',
            top: -10,
            left: -10,
            right: -10,
            bottom: -10,
            zIndex: 3,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 20,
              height: 20,
              borderLeft: '2px solid #fff',
              borderTop: '2px solid #fff',
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRight: '2px solid #fff',
              borderBottom: '2px solid #fff',
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      {/* Video Box Right */}
      <div
        className="video-box video-right"
        style={{
          position: 'absolute',
          width: '36%',
          aspectRatio: '16 / 9',
          top: '16%',
          right: '9%',
          zIndex: 10,
        }}
      >
        <div
          className="border-wrapper border-right"
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            background: '#222',
            overflow: 'hidden',
            zIndex: -1,
            boxShadow: '0 0 25px rgba(255, 0, 255, 0.4)',
          }}
        >
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent 60%, #ff00ff 100%)',
              transform: `rotate(${borderRotationRight}deg)`,
              transformOrigin: 'center center',
            }}
          />
        </div>
        <div
          className="green-screen-rect"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#00FF00',
            zIndex: 2,
          }}
        />
        <div
          className="tech-corners"
          style={{
            position: 'absolute',
            top: -10,
            left: -10,
            right: -10,
            bottom: -10,
            zIndex: 3,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 20,
              height: 20,
              borderLeft: '2px solid #fff',
              borderTop: '2px solid #fff',
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRight: '2px solid #fff',
              borderBottom: '2px solid #fff',
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      {/* Subscribe Placeholder */}
      <div
        className="subscribe-box"
        style={{
          position: 'absolute',
          width: '14%',
          aspectRatio: '1 / 1',
          bottom: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          borderRadius: '50%',
        }}
      >
        <div
          className="border-circle"
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 0 30px rgba(255, 255, 0, 0.4)',
            zIndex: -1,
          }}
        >
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent 40%, #00ffff 60%, #ff00ff 80%, #ffff00 100%)',
              transform: `rotate(${circleRotation}deg)`,
              transformOrigin: 'center center',
            }}
          />
        </div>
        <div
          className="green-screen-circle"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#00FF00',
            borderRadius: '50%',
            zIndex: 2,
          }}
        />
      </div>

      {/* Scanlines Overlay */}
      <div
        className="scanlines"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0) 2px, rgba(0, 0, 0, 0.2) 3px, rgba(0, 0, 0, 0.2) 4px)',
          zIndex: 100,
          opacity: 0.6,
        }}
      />
    </div>
  );
};

export default CyberpunkOverlayTemplate;
// END_OF_FILE