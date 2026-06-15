import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic Seeded Generator to avoid Math.random() inside component render
const LINES_COUNT = 14;
const LINES_DATA = Array.from({ length: LINES_COUNT }, (_, i) => {
  const seed1 = Math.sin(i * 12.3) * 0.5 + 0.5;
  const seed2 = Math.cos(i * 37.7) * 0.5 + 0.5;
  const seed3 = Math.sin(i * 89.1) * 0.5 + 0.5;
  const vertical = seed1 > 0.5;
  return {
    vertical,
    top: seed2 * 100,
    left: seed3 * 100,
    size: vertical ? (80 + seed1 * 180) : (80 + seed2 * 220),
    pulseDelay: Math.round(seed3 * 150), // 150 frames = 2.5s cycle (divisible into 1200)
  };
});

const NODES_COUNT = 30;
const NODES_DATA = Array.from({ length: NODES_COUNT }, (_, i) => {
  const seed1 = Math.sin(i * 45.6) * 0.5 + 0.5;
  const seed2 = Math.cos(i * 92.3) * 0.5 + 0.5;
  const seed3 = Math.sin(i * 124.5) * 0.5 + 0.5;
  return {
    top: seed1 * 100,
    left: seed2 * 100,
    blinkDelay: Math.round(seed3 * 120), // 120 frames = 2s cycle (divisible into 1200)
  };
});

const PARTICLES_COUNT = 20;
const PARTICLE_DURATIONS = [300, 400, 600]; // Seamless divisible factors of 1200
const PARTICLES_DATA = Array.from({ length: PARTICLES_COUNT }, (_, i) => {
  const seed1 = Math.sin(i * 73.1) * 0.5 + 0.5;
  const seed2 = Math.cos(i * 29.4) * 0.5 + 0.5;
  const seed3 = Math.sin(i * 156.2) * 0.5 + 0.5;
  const durationIdx = Math.floor(seed2 * 3) % 3;
  return {
    left: seed1 * 100,
    duration: PARTICLE_DURATIONS[durationIdx],
    delay: Math.round(seed3 * 600),
  };
});

const FuturisticCircuitEndScreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Scale computation to fit within 16:9 flawlessly with no black bars
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Grid Background movement loop (300 frames = 5 seconds)
  const gridPos = interpolate(frame % 300, [0, 300], [0, 55]);

  // 2. Scanline loop (300 frames = 5 seconds)
  const scanTop = interpolate(frame % 300, [0, 300], [-180, 1080]);

  // 3. Flares movement (600 frames = 10 seconds loop)
  const f1Prog = frame % 600;
  const f1X = interpolate(f1Prog, [0, 300, 600], [0, 50, 0]);
  const f1Y = interpolate(f1Prog, [0, 300, 600], [0, 40, 0]);
  const f1Scale = interpolate(f1Prog, [0, 300, 600], [1, 1.25, 1]);
  const f1Opacity = interpolate(f1Prog, [0, 300, 600], [0.4, 0.85, 0.4]);

  const f2Prog = (frame + 300) % 600;
  const f2X = interpolate(f2Prog, [0, 300, 600], [0, 50, 0]);
  const f2Y = interpolate(f2Prog, [0, 300, 600], [0, 40, 0]);
  const f2Scale = interpolate(f2Prog, [0, 300, 600], [1, 1.25, 1]);
  const f2Opacity = interpolate(f2Prog, [0, 300, 600], [0.4, 0.85, 0.4]);

  // 4. Rotating Corner Decos (600 frames loop)
  const rotTL = interpolate(frame % 600, [0, 600], [0, 360]);
  const rotBR = interpolate(frame % 600, [0, 600], [360, 0]);

  // Helper for Corner Deco markup mapping
  const renderCornerDeco = (rotation: number, positionStyle: React.CSSProperties) => (
    <div style={{
      position: 'absolute',
      width: 90,
      height: 90,
      border: '2px solid rgba(0,200,255,0.4)',
      borderRadius: '50%',
      transform: `rotate(${rotation}deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...positionStyle
    }}>
      <div style={{
        position: 'absolute',
        inset: 12,
        border: '1px dashed rgba(0,200,255,0.5)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        inset: 35,
        background: 'rgba(0,200,255,0.3)',
        borderRadius: '50%',
        boxShadow: '0 0 15px #00d4ff',
      }} />
    </div>
  );

  // 5. Title animation (in and out)
  let titleOpacity = 0;
  let titleY = -20;
  if (frame < 1050) {
    titleOpacity = interpolate(frame, [18, 102], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    titleY = interpolate(frame, [18, 102], [-20, 0], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else {
    titleOpacity = interpolate(frame, [1120, 1180], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    titleY = interpolate(frame, [1120, 1180], [0, -20], {
      easing: Easing.in(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // 6. Placeholders state computation
  const getPlaceholderState = (startFrame: number) => {
    let scale = 0.6;
    let rotate = -4;
    let opacity = 0;

    if (frame < 1050) {
      scale = interpolate(frame, [startFrame, startFrame + 54], [0.6, 1], {
        easing: Easing.bezier(0.2, 0.8, 0.3, 1.2),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      rotate = interpolate(frame, [startFrame, startFrame + 54], [-4, 0], {
        easing: Easing.bezier(0.2, 0.8, 0.3, 1.2),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      opacity = interpolate(frame, [startFrame, startFrame + 54], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    } else {
      scale = interpolate(frame, [1110, 1150], [1, 0.6], {
        easing: Easing.in(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      rotate = interpolate(frame, [1110, 1150], [0, -4], {
        easing: Easing.in(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      opacity = interpolate(frame, [1110, 1150], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }

    return { scale, rotate, opacity };
  };

  const getFillScaleY = (startFrame: number) => {
    if (frame < 1050) {
      return interpolate(frame, [startFrame, startFrame + 66], [0, 1], {
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    } else {
      return interpolate(frame, [1060, 1100], [1, 0], {
        easing: Easing.in(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  };

  const getHatchOpacity = (startFrame: number) => {
    if (frame < 1050) {
      return interpolate(frame, [startFrame, startFrame + 60], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
    return 0;
  };

  const getLabelAnim = (startFrame: number) => {
    let opacity = 0;
    let y = -20;
    if (frame < 1000) {
      opacity = interpolate(frame, [startFrame, startFrame + 60], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      y = interpolate(frame, [startFrame, startFrame + 60], [-20, 0], {
        easing: Easing.out(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    } else {
      opacity = interpolate(frame, [1020, 1060], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      y = interpolate(frame, [1020, 1060], [0, -20], {
        easing: Easing.in(Easing.quad),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
    return { opacity, y };
  };

  // Shine sweep animation left value (300 frames loop)
  let shineLeft = -60;
  if (frame > 192 && frame < 1060) {
    const shineProgress = ((frame - 192) % 300) / 300;
    if (shineProgress < 0.4) {
      shineLeft = interpolate(shineProgress, [0, 0.4], [-60, 160]);
    } else {
      shineLeft = 160;
    }
  }

  // Anim state configurations for the elements
  const r1Anim = getPlaceholderState(48); // r1 delay 0.8s (48f)
  const r1FillScale = getFillScaleY(132); // r1 fill delay 2.2s (132f)
  const r1HatchOpacity = getHatchOpacity(132);
  const r1Label = getLabelAnim(192); // r1 label delay 3.2s (192f)

  const circleAnim = getPlaceholderState(30); // circle delay 0.5s (30f)
  const circleFillScale = getFillScaleY(114); // circle fill delay 1.9s (114f)
  const circleHatchOpacity = getHatchOpacity(114);
  const circleLabel = getLabelAnim(180); // circle label delay 3.0s (180f)

  const r2Anim = getPlaceholderState(66); // r2 delay 1.1s (66f)
  const r2FillScale = getFillScaleY(150); // r2 fill delay 2.5s (150f)
  const r2HatchOpacity = getHatchOpacity(150);
  const r2Label = getLabelAnim(204); // r2 label delay 3.4s (204f)

  return (
    <div style={{
      width: ORIGINAL_WIDTH,
      height: ORIGINAL_HEIGHT,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) scale(${scaleFactor})`,
      transformOrigin: 'center center',
      overflow: 'hidden',
      backgroundColor: '#020812',
      fontFamily: "'Segoe UI', 'Arial', sans-serif"
    }}>
      {/* Background radial and linear gradients */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 25% 35%, rgba(0,120,255,0.18), transparent 45%),
          radial-gradient(circle at 75% 65%, rgba(0,210,255,0.14), transparent 45%),
          linear-gradient(135deg, #010610 0%, #04162e 50%, #010610 100%)
        `
      }} />

      {/* Circuit grid background */}
      <div style={{
        position: 'absolute',
        inset: '-50px',
        backgroundImage: `
          linear-gradient(rgba(0,150,255,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,150,255,0.07) 1px, transparent 1px)
        `,
        backgroundSize: '55px 55px',
        backgroundPosition: `${gridPos}px ${gridPos}px`,
      }} />

      {/* Light Flares */}
      <div style={{
        position: 'absolute',
        width: 450,
        height: 450,
        background: 'radial-gradient(circle, rgba(0,200,255,0.22), transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        top: '5%',
        left: '2%',
        transform: `translate(${f1X}px, ${f1Y}px) scale(${f1Scale})`,
        opacity: f1Opacity,
      }} />

      <div style={{
        position: 'absolute',
        width: 450,
        height: 450,
        background: 'radial-gradient(circle, rgba(0,200,255,0.22), transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        bottom: '5%',
        right: '2%',
        transform: `translate(${f2X}px, ${f2Y}px) scale(${f2Scale})`,
        opacity: f2Opacity,
      }} />

      {/* Lines, Nodes & Particles container */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Pulsing Circuit Lines */}
        {LINES_DATA.map((line, idx) => {
          const lineOpacity = interpolate(
            (frame + line.pulseDelay) % 150,
            [0, 75, 150],
            [0.15, 0.8, 0.15]
          );
          return (
            <div
              key={`line-${idx}`}
              style={{
                position: 'absolute',
                top: `${line.top}%`,
                left: `${line.left}%`,
                height: line.vertical ? line.size : 2,
                width: line.vertical ? 2 : line.size,
                background: line.vertical
                  ? 'linear-gradient(0deg, transparent, #00d4ff, transparent)'
                  : 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                opacity: lineOpacity,
                boxShadow: '0 0 8px #00d4ff',
              }}
            />
          );
        })}

        {/* Blinking Nodes */}
        {NODES_DATA.map((node, idx) => {
          const nodeProgress = (frame + node.blinkDelay) % 120;
          const nodeOpacity = interpolate(nodeProgress, [0, 60, 120], [0.25, 1, 0.25]);
          const nodeScale = interpolate(nodeProgress, [0, 60, 120], [1, 1.6, 1]);
          return (
            <div
              key={`node-${idx}`}
              style={{
                position: 'absolute',
                top: `${node.top}%`,
                left: `${node.left}%`,
                width: 5,
                height: 5,
                backgroundColor: '#00eaff',
                borderRadius: '50%',
                boxShadow: '0 0 12px #00eaff, 0 0 24px #00aaff',
                transform: `scale(${nodeScale})`,
                opacity: nodeOpacity,
              }}
            />
          );
        })}

        {/* Floating Particles */}
        {PARTICLES_DATA.map((p, idx) => {
          const pFrame = (frame + p.delay) % p.duration;
          const yPos = interpolate(pFrame, [0, p.duration], [1150, -150]);
          const opacity = interpolate(
            pFrame,
            [0, p.duration * 0.1, p.duration * 0.9, p.duration],
            [0, 1, 1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <div
              key={`particle-${idx}`}
              style={{
                position: 'absolute',
                width: 3,
                height: 3,
                backgroundColor: 'rgba(120,220,255,0.8)',
                borderRadius: '50%',
                boxShadow: '0 0 6px #66ddff',
                left: `${p.left}%`,
                transform: `translateY(${yPos}px)`,
                opacity,
              }}
            />
          );
        })}
      </div>

      {/* Sweep Scan Line */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 180,
        background: 'linear-gradient(180deg, transparent, rgba(0,200,255,0.12), transparent)',
        top: scanTop,
        pointerEvents: 'none',
      }} />

      {/* Corner Decos */}
      {renderCornerDeco(rotTL, { top: 35, left: 35 })}
      {renderCornerDeco(rotBR, { bottom: 35, right: 35 })}

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: '7%',
        width: '100%',
        textAlign: 'center',
        color: '#bdeeff',
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: '6px',
        textTransform: 'uppercase',
        textShadow: '0 0 18px rgba(0,200,255,0.8)',
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
      }}>
        Thanks For Watching
      </div>

      {/* Placeholders */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 50,
        flexWrap: 'wrap',
      }}>
        {/* R1: Next Video */}
        <div style={{
          position: 'relative',
          border: '2px solid rgba(0,200,255,0.7)',
          boxShadow: '0 0 30px rgba(0,180,255,0.45), inset 0 0 25px rgba(0,150,255,0.2)',
          overflow: 'hidden',
          width: 270,
          height: 160,
          borderRadius: 14,
          opacity: r1Anim.opacity,
          transform: `scale(${r1Anim.scale}) rotate(${r1Anim.rotate}deg)`,
        }}>
          {/* Solid fill rising */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #5fd9ff, #009dff)',
            transformOrigin: 'bottom',
            transform: `scaleY(${r1FillScale})`,
          }} />

          {/* Hatch pattern overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,190,255,0.5), rgba(0,190,255,0.5) 4px, transparent 4px, transparent 11px)',
            zIndex: 1,
            opacity: r1HatchOpacity,
          }} />

          {/* Shine Sweep Overlay */}
          {frame > 192 && frame < 1060 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: `${shineLeft}%`,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent)',
              transform: 'skewX(-20deg)',
              zIndex: 3,
            }} />
          )}

          {/* Label */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '1px',
            textShadow: '0 0 10px rgba(0,60,120,0.9)',
            opacity: r1Label.opacity,
            transform: `translateY(${r1Label.y}px)`,
            zIndex: 4,
          }}>
            Next Video
          </div>
        </div>

        {/* Circle: Logo */}
        <div style={{
          position: 'relative',
          border: '2px solid rgba(0,200,255,0.7)',
          boxShadow: '0 0 30px rgba(0,180,255,0.45), inset 0 0 25px rgba(0,150,255,0.2)',
          overflow: 'hidden',
          width: 210,
          height: 210,
          borderRadius: '50%',
          opacity: circleAnim.opacity,
          transform: `scale(${circleAnim.scale}) rotate(${circleAnim.rotate}deg)`,
        }}>
          {/* Solid fill rising */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #5fd9ff, #009dff)',
            transformOrigin: 'bottom',
            transform: `scaleY(${circleFillScale})`,
          }} />

          {/* Hatch pattern overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,190,255,0.5), rgba(0,190,255,0.5) 4px, transparent 4px, transparent 11px)',
            zIndex: 1,
            opacity: circleHatchOpacity,
          }} />

          {/* Shine Sweep Overlay */}
          {frame > 192 && frame < 1060 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: `${shineLeft}%`,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent)',
              transform: 'skewX(-20deg)',
              zIndex: 3,
            }} />
          )}

          {/* Label */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '1px',
            textShadow: '0 0 10px rgba(0,60,120,0.9)',
            opacity: circleLabel.opacity,
            transform: `translateY(${circleLabel.y}px)`,
            zIndex: 4,
          }}>
            LOGO
          </div>
        </div>

        {/* R2: Subscribe */}
        <div style={{
          position: 'relative',
          border: '2px solid rgba(0,200,255,0.7)',
          boxShadow: '0 0 30px rgba(0,180,255,0.45), inset 0 0 25px rgba(0,150,255,0.2)',
          overflow: 'hidden',
          width: 270,
          height: 160,
          borderRadius: 14,
          opacity: r2Anim.opacity,
          transform: `scale(${r2Anim.scale}) rotate(${r2Anim.rotate}deg)`,
        }}>
          {/* Solid fill rising */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #5fd9ff, #009dff)',
            transformOrigin: 'bottom',
            transform: `scaleY(${r2FillScale})`,
          }} />

          {/* Hatch pattern overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,190,255,0.5), rgba(0,190,255,0.5) 4px, transparent 4px, transparent 11px)',
            zIndex: 1,
            opacity: r2HatchOpacity,
          }} />

          {/* Shine Sweep Overlay */}
          {frame > 192 && frame < 1060 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: `${shineLeft}%`,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent)',
              transform: 'skewX(-20deg)',
              zIndex: 3,
            }} />
          )}

          {/* Label */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '1px',
            textShadow: '0 0 10px rgba(0,60,120,0.9)',
            opacity: r2Label.opacity,
            transform: `translateY(${r2Label.y}px)`,
            zIndex: 4,
          }}>
            Subscribe
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticCircuitEndScreen;
// END_OF_FILE