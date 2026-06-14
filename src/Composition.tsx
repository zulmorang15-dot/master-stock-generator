import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React, { useMemo } from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic mock data to avoid Math.random() in render loops
const BLOBS = [
  { size: 380, x: 200, y: 150, driftScaleX: 1.1, driftScaleY: 0.9, delayOffset: 0 },
  { size: 480, x: 1400, y: 200, driftScaleX: 0.8, driftScaleY: 1.2, delayOffset: 120 },
  { size: 300, x: 800, y: 700, driftScaleX: 1.2, driftScaleY: 1.0, delayOffset: 240 },
  { size: 420, x: 150, y: 800, driftScaleX: 0.9, driftScaleY: 1.1, delayOffset: 360 },
  { size: 350, x: 1600, y: 850, driftScaleX: 1.0, driftScaleY: 0.8, delayOffset: 480 },
  { size: 260, x: 1100, y: 450, driftScaleX: 1.3, driftScaleY: 0.7, delayOffset: 600 },
  { size: 310, x: 500, y: 300, driftScaleX: 0.7, driftScaleY: 1.3, delayOffset: 720 },
];

const CONFETTI_DATA = [
  { size: 24, x: 300, y: 200, wanderScaleX: 1.0, wanderScaleY: 1.0, spinDir: 1, phase: 0 },
  { size: 18, x: 1600, y: 150, wanderScaleX: -1.2, wanderScaleY: 0.8, spinDir: -1, phase: 100 },
  { size: 22, x: 900, y: 800, wanderScaleX: 0.9, wanderScaleY: -1.1, spinDir: 1, phase: 200 },
  { size: 15, x: 200, y: 900, wanderScaleX: -0.8, wanderScaleY: 1.2, spinDir: -1, phase: 300 },
  { size: 26, x: 1450, y: 750, wanderScaleX: 1.1, wanderScaleY: -0.9, spinDir: 1, phase: 400 },
  { size: 20, x: 700, y: 300, wanderScaleX: -1.0, wanderScaleY: -1.0, spinDir: -1, phase: 500 },
  { size: 16, x: 1200, y: 600, wanderScaleX: 1.3, wanderScaleY: 1.1, spinDir: 1, phase: 600 },
  { size: 25, x: 400, y: 650, wanderScaleX: -0.7, wanderScaleY: -1.3, spinDir: -1, phase: 700 },
  { size: 21, x: 1750, y: 450, wanderScaleX: 1.0, wanderScaleY: 1.2, spinDir: 1, phase: 800 },
  { size: 19, x: 100, y: 400, wanderScaleX: -1.1, wanderScaleY: -0.8, spinDir: -1, phase: 900 },
  { size: 23, x: 1050, y: 100, wanderScaleX: 0.8, wanderScaleY: 1.0, spinDir: 1, phase: 1000 },
  { size: 17, x: 1350, y: 950, wanderScaleX: -1.0, wanderScaleY: 1.3, spinDir: -1, phase: 1100 },
];

const DOT_DELAYS = Array.from({ length: 50 }, (_, i) => {
  return ((i * 7 + 13) % 25) / 10; 
});

const GoldEndScreen: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Title Sway (600 frames = 10s loop)
  const titleFrame = frame % 600;
  const titleSwayX = interpolate(titleFrame, [0, 300, 600], [0, 25, 0], { easing: Easing.inOut(Easing.quad) });
  const titleSwayY = interpolate(titleFrame, [0, 300, 600], [0, 10, 0], { easing: Easing.inOut(Easing.quad) });

  // 2. Glitch top & bottom (quick 30 frames cycle)
  const glitchCycle = frame % 30;
  const glitchTopClip = interpolate(glitchCycle, [0, 12, 24, 30], [60, 20, 70, 30]);
  const glitchTopTx = interpolate(glitchCycle, [0, 12, 24, 30], [0, 3, 2, 0]);
  const glitchTopTy = interpolate(glitchCycle, [0, 12, 24, 30], [0, 1, -1, 1]);

  const glitchBotClip = interpolate(glitchCycle, [0, 12, 24, 30], [60, 70, 45, 65]);
  const glitchBotTx = interpolate(glitchCycle, [0, 12, 24, 30], [0, -3, -2, 0]);
  const glitchBotTy = interpolate(glitchCycle, [0, 12, 24, 30], [0, -1, 1, -1]);

  // 3. Dot Matrix drift (1200 frames = 20s loop)
  const matrixFrame = frame % 1200;
  const matrixDriftX = interpolate(matrixFrame, [0, 400, 800, 1200], [0, 40, -30, 0], { easing: Easing.inOut(Easing.quad) });
  const matrixDriftY = interpolate(matrixFrame, [0, 400, 800, 1200], [0, 30, 20, 0], { easing: Easing.inOut(Easing.quad) });

  // 4. Rect Left drift (600 frames = 10s loop)
  const leftDriftFrame = frame % 600;
  const leftDriftX = interpolate(leftDriftFrame, [0, 150, 300, 450, 600], [0, -30, 20, -15, 0], { easing: Easing.inOut(Easing.quad) });
  const leftDriftY = interpolate(leftDriftFrame, [0, 150, 300, 450, 600], [0, -25, 15, 30, 0], { easing: Easing.inOut(Easing.quad) });
  const leftRotate = interpolate(leftDriftFrame, [0, 150, 300, 450, 600], [0, -3, 2, -2, 0], { easing: Easing.inOut(Easing.quad) });

  // 5. Rect Right drift (600 frames = 10s loop with offset)
  const rightDriftFrame = (frame + 300) % 600;
  const rightDriftX = interpolate(rightDriftFrame, [0, 150, 300, 450, 600], [0, 30, -20, 15, 0], { easing: Easing.inOut(Easing.quad) });
  const rightDriftY = interpolate(rightDriftFrame, [0, 150, 300, 450, 600], [0, 20, -25, -15, 0], { easing: Easing.inOut(Easing.quad) });
  const rightRotate = interpolate(rightDriftFrame, [0, 150, 300, 450, 600], [0, 3, -2, 2, 0], { easing: Easing.inOut(Easing.quad) });

  // 6. Gold Shimmer (240 frames = 4s loop)
  const shimmerFrame = frame % 240;
  const shimmerBrightness = interpolate(shimmerFrame, [0, 120, 240], [1, 1.35, 1], { easing: Easing.inOut(Easing.quad) });
  const shimmerSaturation = interpolate(shimmerFrame, [0, 120, 240], [1.1, 1.4, 1.1], { easing: Easing.inOut(Easing.quad) });

  // 7. Screen Shine (300 frames = 5s loop)
  const shineFrame = frame % 300;
  const shineX = interpolate(shineFrame, [0, 180, 300], [-120, -120, 120], { easing: Easing.inOut(Easing.quad) });

  // 8. Center Circle drift & spin (1200 frames = 20s loop)
  const centerDriftFrame = frame % 1200;
  const centerDriftX = interpolate(centerDriftFrame, [0, 300, 600, 900, 1200], [0, 40, 0, -40, 0], { easing: Easing.inOut(Easing.quad) });
  const centerDriftY = interpolate(centerDriftFrame, [0, 300, 600, 900, 1200], [0, -30, 40, -20, 0], { easing: Easing.inOut(Easing.quad) });
  const centerRotate = interpolate(centerDriftFrame, [0, 300, 600, 900, 1200], [0, 90, 180, 270, 360], { easing: Easing.inOut(Easing.quad) });

  const centerCounterRotate = interpolate(centerDriftFrame, [0, 300, 600, 900, 1200], [0, -90, -180, -270, -360], { easing: Easing.inOut(Easing.quad) });

  const circleShineFrame = (frame + 120) % 300;
  const circleShineX = interpolate(circleShineFrame, [0, 180, 300], [-120, -120, 120], { easing: Easing.inOut(Easing.quad) });

  const outerSpinFrame = frame % 720;
  const outerSpinAngle = interpolate(outerSpinFrame, [0, 720], [360, 0]);

  // 9. Watermark Drift (1200 frames = 20s loop)
  const watermarkFrame = frame % 1200;
  const watermarkX = interpolate(watermarkFrame, [0, 300, 600, 900, 1200], [0, 180, -135, 105, 0], { easing: Easing.inOut(Easing.quad) });
  const watermarkY = interpolate(watermarkFrame, [0, 300, 600, 900, 1200], [0, -120, 90, 165, 0], { easing: Easing.inOut(Easing.quad) });
  const watermarkRotate = interpolate(watermarkFrame, [0, 300, 600, 900, 1200], [0, 15, -10, 8, 0], { easing: Easing.inOut(Easing.quad) });

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
        background: 'radial-gradient(circle at 50% 40%, #8a7a2e, #6f6322 80%)',
        fontFamily: "'Arial Black', 'Segoe UI', sans-serif",
      }}
    >
      {/* Background Blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>
        {BLOBS.map((blob, i) => {
          const blobFrame = (frame + blob.delayOffset) % 1200;
          const driftX = interpolate(blobFrame, [0, 300, 600, 900, 1200], [0, 120 * blob.driftScaleX, -90 * blob.driftScaleX, 70 * blob.driftScaleX, 0], { easing: Easing.inOut(Easing.quad) });
          const driftY = interpolate(blobFrame, [0, 300, 600, 900, 1200], [0, -80 * blob.driftScaleY, 60 * blob.driftScaleY, 110 * blob.driftScaleY, 0], { easing: Easing.inOut(Easing.quad) });
          const rotateBlob = interpolate(blobFrame, [0, 300, 600, 900, 1200], [0, 15, -10, 8, 0], { easing: Easing.inOut(Easing.quad) });

          const morphProgress = interpolate((frame % 540), [0, 270, 540], [0, 1, 0], { easing: Easing.inOut(Easing.quad) });
          const r1 = interpolate(morphProgress, [0, 1], [46, 60]);
          const r2 = interpolate(morphProgress, [0, 1], [54, 40]);
          const r3 = interpolate(morphProgress, [0, 1], [60, 45]);
          const r4 = interpolate(morphProgress, [0, 1], [40, 55]);
          const r5 = interpolate(morphProgress, [0, 1], [50, 45]);
          const r6 = interpolate(morphProgress, [0, 1], [45, 60]);
          const r7 = interpolate(morphProgress, [0, 1], [55, 40]);
          const r8 = interpolate(morphProgress, [0, 1], [50, 55]);
          const borderRadiusStr = `${r1}% ${r2}% ${r3}% ${r4}% / ${r5}% ${r6}% ${r7}% ${r8}%`;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: blob.size,
                height: blob.size,
                top: blob.y,
                left: blob.x,
                background: 'linear-gradient(135deg, rgba(255,243,196,0.55), rgba(184,134,11,0.25))',
                borderRadius: borderRadiusStr,
                filter: 'blur(2px)',
                opacity: 0.6,
                transform: `translate(${driftX}px, ${driftY}px) rotate(${rotateBlob}deg)`,
              }}
            />
          );
        })}
      </div>

      {/* Watermark Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '400px',
          left: '700px',
          zIndex: 3,
          fontSize: '90px',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.12)',
          letterSpacing: '4px',
          pointerEvents: 'none',
          textTransform: 'uppercase',
          transform: `translate(${watermarkX}px, ${watermarkY}px) rotate(${watermarkRotate}deg)`,
        }}
      >
        preview
      </div>

      {/* Confetti */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 4 }}>
        {CONFETTI_DATA.map((confetti, i) => {
          const spinFrame = frame % 300;
          const confettiSpinDeg = interpolate(spinFrame, [0, 300], [0, 360]) * confetti.spinDir;

          const wanderFrame = (frame + confetti.phase) % 1200;
          const wanderX = interpolate(wanderFrame, [0, 300, 600, 900, 1200], [0, 345 * confetti.wanderScaleX, -270 * confetti.wanderScaleX, 190 * confetti.wanderScaleX, 0], { easing: Easing.inOut(Easing.quad) });
          const wanderY = interpolate(wanderFrame, [0, 300, 600, 900, 1200], [0, -130 * confetti.wanderScaleY, 170 * confetti.wanderScaleY, 86 * confetti.wanderScaleY, 0], { easing: Easing.inOut(Easing.quad) });

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: confetti.size,
                height: confetti.size,
                left: confetti.x,
                top: confetti.y,
                background: 'linear-gradient(135deg, #fff3c4, #d4af37)',
                boxShadow: '0 0 10px rgba(255,243,196,0.6)',
                transform: `translate(${wanderX}px, ${wanderY}px) rotate(${confettiSpinDeg}deg)`,
              }}
            />
          );
        })}
      </div>

      {/* Dot Matrix */}
      <div
        style={{
          position: 'absolute',
          top: '180px',
          left: '200px',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 20px)',
          gridTemplateRows: 'repeat(5, 20px)',
          gap: '10px',
          zIndex: 6,
          transform: `translate(${matrixDriftX}px, ${matrixDriftY}px)`,
        }}
      >
        {DOT_DELAYS.map((delay, i) => {
          const dotFrame = (frame + Math.round(delay * 60)) % 150;
          const dotScale = interpolate(dotFrame, [0, 75, 150], [0.7, 1.2, 0.7], { easing: Easing.inOut(Easing.quad) });
          const dotOpacity = interpolate(dotFrame, [0, 75, 150], [0.25, 1.0, 0.25], { easing: Easing.inOut(Easing.quad) });

          return (
            <span
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#fff3c4',
                boxShadow: '0 0 6px #f9e08c',
                display: 'block',
                opacity: dotOpacity,
                transform: `scale(${dotScale})`,
              }}
            />
          );
        })}
      </div>

      {/* Title with RGB Glitch */}
      <h1
        style={{
          position: 'absolute',
          top: '120px',
          width: '100%',
          textAlign: 'center',
          zIndex: 7,
          fontSize: '64px',
          fontWeight: 900,
          color: '#fff3c4',
          textShadow: '0 0 10px #d4af37, 0 3px 6px rgba(0,0,0,0.5)',
          transform: `translate(${titleSwayX}px, ${titleSwayY}px)`,
          letterSpacing: '2px',
        }}
      >
        SUBSCRIBE{' '}
        <span
          style={{
            position: 'relative',
            display: 'inline-block',
          }}
        >
          FOR MORE INFO
          {/* Cyan Glitch Layer */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              color: '#00eaff',
              background: 'transparent',
              clipPath: `inset(${glitchTopClip}% 0px ${100 - glitchTopClip - 15}% 0px)`,
              transform: `translate(${glitchTopTx}px, ${glitchTopTy}px)`,
            }}
          >
            FOR MORE INFO
          </span>
          {/* Magenta Glitch Layer */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              color: '#ff00d4',
              background: 'transparent',
              clipPath: `inset(${100 - glitchBotClip - 15}% 0px ${glitchBotClip}% 0px)`,
              transform: `translate(${glitchBotTx}px, ${glitchBotTy}px)`,
            }}
          >
            FOR MORE INFO
          </span>
        </span>
      </h1>

      {/* Main Containers & Screens */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '55%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          width: '1400px',
          height: '600px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Left Video Frame */}
        <div
          style={{
            position: 'absolute',
            left: '60px',
            top: '160px',
            transform: `translate(${leftDriftX}px, ${leftDriftY}px) rotate(${leftRotate}deg)`,
            zIndex: 15,
          }}
        >
          <div
            style={{
              width: '360px',
              height: '220px',
              borderRadius: '8px',
              padding: '10px',
              background: 'linear-gradient(135deg, #f9e08c, #b8860b 40%, #fff3c4 60%, #d4af37)',
              boxShadow: '0 0 20px rgba(212,175,55,0.7), 0 12px 36px rgba(0,0,0,0.35)',
              filter: `brightness(${shimmerBrightness}) saturate(${shimmerSaturation})`,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#fff',
                borderRadius: '4px',
                boxShadow: 'inset 0 0 18px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)',
                  transform: `translateX(${shineX}%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Center Round Screen */}
        <div
          style={{
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            padding: '22px',
            background: 'conic-gradient(#f9e08c, #b8860b, #fff3c4, #d4af37, #f9e08c)',
            boxShadow: '0 0 30px rgba(212,175,55,0.8), 0 15px 45px rgba(0,0,0,0.4)',
            zIndex: 10,
            position: 'absolute',
            left: '540px',
            top: '110px',
            transform: `translate(${centerDriftX}px, ${centerDriftY}px) rotate(${centerRotate}deg)`,
          }}
        >
          {/* Dashed Outer border spinning reverse */}
          <div
            style={{
              position: 'absolute',
              inset: '-20px',
              borderRadius: '50%',
              border: '3px dashed rgba(255,243,196,0.6)',
              transform: `rotate(${outerSpinAngle}deg)`,
              pointerEvents: 'none',
            }}
          />
          {/* Inside Screen keeping straight position */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#fff',
              boxShadow: 'inset 0 0 22px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden',
              transform: `rotate(${centerCounterRotate}deg)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.95) 50%, transparent 65%)',
                transform: `translateX(${circleShineX}%)`,
              }}
            />
          </div>
        </div>

        {/* Right Video Frame */}
        <div
          style={{
            position: 'absolute',
            right: '60px',
            top: '160px',
            transform: `translate(${rightDriftX}px, ${rightDriftY}px) rotate(${rightRotate}deg)`,
            zIndex: 15,
          }}
        >
          <div
            style={{
              width: '360px',
              height: '220px',
              borderRadius: '8px',
              padding: '10px',
              background: 'linear-gradient(135deg, #f9e08c, #b8860b 40%, #fff3c4 60%, #d4af37)',
              boxShadow: '0 0 20px rgba(212,175,55,0.7), 0 12px 36px rgba(0,0,0,0.35)',
              filter: `brightness(${shimmerBrightness}) saturate(${shimmerSaturation})`,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#fff',
                borderRadius: '4px',
                boxShadow: 'inset 0 0 18px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)',
                  transform: `translateX(${shineX}%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* WATCH NEXT label */}
        <span
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '60px',
            width: '360px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '2px',
            color: '#fff3c4',
            textShadow: '0 0 8px #d4af37, 0 2px 4px rgba(0,0,0,0.5)',
            zIndex: 8,
            whiteSpace: 'nowrap',
            transform: `translate(${leftDriftX}px, ${leftDriftY}px) rotate(${leftRotate}deg)`,
          }}
        >
          WATCH NEXT
        </span>

        {/* RECOMMENDED label */}
        <span
          style={{
            position: 'absolute',
            bottom: '100px',
            right: '60px',
            width: '360px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '2px',
            color: '#fff3c4',
            textShadow: '0 0 8px #d4af37, 0 2px 4px rgba(0,0,0,0.5)',
            zIndex: 8,
            whiteSpace: 'nowrap',
            transform: `translate(${rightDriftX}px, ${rightDriftY}px) rotate(${rightRotate}deg)`,
          }}
        >
          RECOMMENDED
        </span>
      </div>
    </div>
  );
};

export default GoldEndScreen;
// END_OF_FILE