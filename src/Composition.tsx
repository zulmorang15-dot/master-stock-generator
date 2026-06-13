import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLE_DATA = [
  { id: 1, w: 3, h: 15, left: '20%', bg: '#00ffff', duration: 5, offset: 0 },
  { id: 2, w: 4, h: 4, left: '80%', bg: '#ff00ff', duration: 10, offset: 120 },
  { id: 3, w: 10, h: 2, left: '50%', bg: '#ffff00', duration: 2.5, offset: 60 },
  { id: 4, w: 2, h: 20, left: '35%', bg: '#00ffff', duration: 5, offset: 180 },
  { id: 5, w: 5, h: 5, left: '65%', bg: '#ff00ff', duration: 5, offset: 240 },
];

export const SynthwaveStreamOverlay = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);
  const localFrame = frame % 600;

  // 1. Master Glitch State
  let glitchTx = 0;
  let glitchTy = 0;
  let glitchFilter = 'none';

  if (localFrame >= 290 && localFrame < 306) {
    if (localFrame >= 294 && localFrame < 297) {
      glitchTx = -3;
      glitchTy = 2;
      glitchFilter = 'drop-shadow(4px 0 0 #00ffff) drop-shadow(-4px 0 0 #ff00ff)';
    } else if (localFrame >= 297 && localFrame < 301) {
      glitchTx = 3;
      glitchTy = -2;
      glitchFilter = 'drop-shadow(-4px 0 0 #00ffff) drop-shadow(4px 0 0 #ff00ff)';
    }
  } else if (localFrame >= 576 && localFrame < 594) {
    if (localFrame >= 582 && localFrame < 585) {
      glitchTx = 2;
      glitchTy = 3;
      glitchFilter = 'drop-shadow(5px 0 0 #00ffff) drop-shadow(-5px 0 0 #ff00ff)';
    } else if (localFrame >= 585 && localFrame < 589) {
      glitchTx = -4;
      glitchTy = -1;
      glitchFilter = 'drop-shadow(-5px 0 0 #00ffff) drop-shadow(5px 0 0 #ff00ff)';
    }
  }

  // 2. Ambient Pulsing Lights (Symmetrical sine modulation)
  const pulseLeftVal = interpolate(
    Math.sin((frame / 300) * Math.PI),
    [-1, 1],
    [0.9, 1.1]
  );
  const pulseLeftOpacity = interpolate(
    Math.sin((frame / 300) * Math.PI),
    [-1, 1],
    [0.15, 0.35]
  );

  const pulseRightVal = interpolate(
    Math.sin(((frame + 150) / 300) * Math.PI),
    [-1, 1],
    [0.9, 1.1]
  );
  const pulseRightOpacity = interpolate(
    Math.sin(((frame + 150) / 300) * Math.PI),
    [-1, 1],
    [0.15, 0.35]
  );

  // 3. Synthwave Grid Y position
  const gridProgress = (frame % 300) / 300;
  const gridY = interpolate(gridProgress, [0, 1], [0, 15]);

  // 4. Video Box Border Rotations
  const borderLeftRot = ((frame % 300) / 300) * 360;
  const borderRightRot = -((frame % 300) / 300) * 360;
  const borderCircleRot = ((frame % 150) / 150) * 360;

  // 5. Glitch Line State
  const glitchLineCycle = frame % 300;
  let glitchLineOpacity = 0;
  let glitchLineTop = '0%';

  if (glitchLineCycle >= 270 && glitchLineCycle < 273) {
    glitchLineOpacity = 1;
    glitchLineTop = '20%';
  } else if (glitchLineCycle >= 276 && glitchLineCycle < 279) {
    glitchLineOpacity = 1;
    glitchLineTop = '75%';
  } else if (glitchLineCycle >= 282 && glitchLineCycle < 285) {
    glitchLineOpacity = 1;
    glitchLineTop = '40%';
  }

  return (
    <div
      style={{
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor}) translate(${glitchTx}px, ${glitchTy}px)`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#050505',
        boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.9)',
        filter: glitchFilter,
      }}
    >
      {/* Ambient Pulsing Lights */}
      <div
        style={{
          position: 'absolute',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: pulseLeftOpacity,
          zIndex: 0,
          top: '10%',
          left: '5%',
          width: '40%',
          height: '60%',
          background: '#00ffff',
          transform: `scale(${pulseLeftVal})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: pulseRightOpacity,
          zIndex: 0,
          top: '10%',
          right: '5%',
          width: '40%',
          height: '60%',
          background: '#ff00ff',
          transform: `scale(${pulseRightVal})`,
        }}
      />

      {/* Grid Wrapper */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-50%',
          width: '200%',
          height: '70%',
          perspective: '800px',
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundImage: `
              linear-gradient(to right, rgba(0, 255, 255, 0.2) 2px, transparent 2px),
              linear-gradient(to top, rgba(255, 0, 255, 0.4) 2px, transparent 2px)
            `,
            backgroundSize: '3% 15%',
            backgroundPosition: `0 ${gridY}%`,
            transform: 'rotateX(75deg)',
            transformOrigin: 'center top',
            boxShadow: 'inset 0 100px 100px #050505',
          }}
        />
      </div>

      {/* Floating Cyber Particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
        {PARTICLE_DATA.map((p) => {
          const durationFrames = p.duration * 60;
          const currentParticleFrame = (frame + p.offset) % durationFrames;
          const progress = currentParticleFrame / durationFrames;

          let opacity = 0;
          if (progress < 0.1) {
            opacity = interpolate(progress, [0, 0.1], [0, 0.8]);
          } else if (progress < 0.9) {
            opacity = 0.8;
          } else {
            opacity = interpolate(progress, [0.9, 1.0], [0.8, 0]);
          }

          const yPos = interpolate(progress, [0, 1], [0, -1180]);
          const scale = interpolate(progress, [0, 1], [1, 0.5]);

          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                width: p.w,
                height: p.h,
                left: p.left,
                bottom: '-10%',
                backgroundColor: p.bg,
                opacity,
                transform: `translateY(${yPos}px) scale(${scale})`,
              }}
            />
          );
        })}
      </div>

      {/* Horizontal Glitch Line */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.8)',
          boxShadow: '0 0 10px #00ffff, 0 0 10px #ff00ff',
          zIndex: 90,
          opacity: glitchLineOpacity,
          top: glitchLineTop,
        }}
      />

      {/* Left Video Box */}
      <div
        style={{
          position: 'absolute',
          width: '36%',
          aspectRatio: '16/9',
          top: '16%',
          left: '9%',
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-4px',
            background: '#222',
            overflow: 'hidden',
            zIndex: -1,
            boxShadow: '0 0 25px rgba(0, 255, 255, 0.4)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent 60%, #00ffff 100%)',
              transform: `rotate(${borderLeftRot}deg)`,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#00FF00',
            zIndex: 2,
          }}
        />
        <div style={{ position: 'absolute', inset: '-10px', zIndex: 3 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '20px',
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
              width: '20px',
              height: '20px',
              borderRight: '2px solid #fff',
              borderBottom: '2px solid #fff',
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      {/* Right Video Box */}
      <div
        style={{
          position: 'absolute',
          width: '36%',
          aspectRatio: '16/9',
          top: '16%',
          right: '9%',
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-4px',
            background: '#222',
            overflow: 'hidden',
            zIndex: -1,
            boxShadow: '0 0 25px rgba(255, 0, 255, 0.4)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent 60%, #ff00ff 100%)',
              transform: `rotate(${borderRightRot}deg)`,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#00FF00',
            zIndex: 2,
          }}
        />
        <div style={{ position: 'absolute', inset: '-10px', zIndex: 3 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '20px',
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
              width: '20px',
              height: '20px',
              borderRight: '2px solid #fff',
              borderBottom: '2px solid #fff',
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      {/* Subscribe Placeholder */}
      <div
        style={{
          position: 'absolute',
          width: '14%',
          aspectRatio: '1/1',
          bottom: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          borderRadius: '50%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 0 30px rgba(255, 255, 0, 0.4)',
            zIndex: -1,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent 40%, #00ffff 60%, #ff00ff 80%, #ffff00 100%)',
              transform: `rotate(${borderCircleRot}deg)`,
            }}
          />
        </div>
        <div
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
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0) 2px, rgba(0, 0, 0, 0.2) 3px, rgba(0, 0, 0, 0.2) 4px)',
          zIndex: 100,
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default SynthwaveStreamOverlay;
// END_OF_FILE