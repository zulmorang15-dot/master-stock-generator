import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

// PRE-CALCULATED DETERMINISTIC MOTION DATA
const LINES_DATA = [
  { vertical: true, top: 12, left: 24, size: 150, delay: 0.2 },
  { vertical: false, top: 45, left: 10, size: 210, delay: 1.1 },
  { vertical: true, top: 70, left: 85, size: 180, delay: 0.7 },
  { vertical: false, top: 20, left: 60, size: 120, delay: 2.3 },
  { vertical: true, top: 5, left: 40, size: 220, delay: 1.8 },
  { vertical: false, top: 88, left: 30, size: 190, delay: 0.5 },
  { vertical: true, top: 60, left: 15, size: 130, delay: 2.9 },
  { vertical: false, top: 15, left: 75, size: 250, delay: 1.4 },
  { vertical: true, top: 40, left: 92, size: 160, delay: 0.1 },
  { vertical: false, top: 78, left: 50, size: 200, delay: 2.5 },
  { vertical: true, top: 82, left: 68, size: 140, delay: 1.0 },
  { vertical: false, top: 33, left: 5, size: 170, delay: 0.9 },
  { vertical: true, top: 25, left: 53, size: 205, delay: 2.1 },
  { vertical: false, top: 93, left: 70, size: 110, delay: 1.6 }
];

const NODES_DATA = [
  { top: 15, left: 20, delay: 0.1 }, { top: 42, left: 88, delay: 1.5 }, { top: 73, left: 45, delay: 0.8 },
  { top: 8, left: 64, delay: 2.1 }, { top: 88, left: 12, delay: 0.4 }, { top: 55, left: 33, delay: 1.9 },
  { top: 29, left: 77, delay: 1.2 }, { top: 91, left: 59, delay: 0.6 }, { top: 63, left: 95, delay: 2.4 },
  { top: 38, left: 18, delay: 1.7 }, { top: 47, left: 52, delay: 0.3 }, { top: 80, left: 81, delay: 1.0 },
  { top: 22, left: 39, delay: 2.2 }, { top: 69, left: 27, delay: 1.3 }, { top: 3, left: 84, delay: 0.7 },
  { top: 51, left: 71, delay: 1.6 }, { top: 96, left: 40, delay: 0.2 }, { top: 14, left: 90, delay: 2.5 },
  { top: 76, left: 6, delay: 1.8 }, { top: 34, left: 61, delay: 0.9 }, { top: 59, left: 10, delay: 1.1 },
  { top: 26, left: 49, delay: 2.0 }, { top: 84, left: 23, delay: 0.5 }, { top: 41, left: 74, delay: 1.4 },
  { top: 11, left: 31, delay: 2.3 }, { top: 67, left: 89, delay: 0.7 }, { top: 93, left: 73, delay: 1.2 },
  { top: 49, left: 99, delay: 0.4 }, { top: 18, left: 55, delay: 1.8 }, { top: 82, left: 47, delay: 2.2 }
];

const PARTICLES_DATA = [
  { left: 5, startY: 1100, duration: 5, delay: 0 },
  { left: 15, startY: 1150, duration: 10, delay: 3 },
  { left: 28, startY: 1120, duration: 4, delay: 1 },
  { left: 42, startY: 1100, duration: 5, delay: 2.5 },
  { left: 56, startY: 1130, duration: 10, delay: 7 },
  { left: 68, startY: 1180, duration: 4, delay: 2 },
  { left: 81, startY: 1110, duration: 5, delay: 1.5 },
  { left: 94, startY: 1120, duration: 10, delay: 0.5 },
  { left: 12, startY: 1140, duration: 4, delay: 3 },
  { left: 24, startY: 1150, duration: 5, delay: 4 },
  { left: 37, startY: 1110, duration: 10, delay: 1 },
  { left: 49, startY: 1190, duration: 4, delay: 0 },
  { left: 62, startY: 1160, duration: 5, delay: 3.5 },
  { left: 75, startY: 1160, duration: 10, delay: 5 },
  { left: 88, startY: 1130, duration: 4, delay: 1.2 },
  { left: 98, startY: 1110, duration: 5, delay: 2.8 },
  { left: 20, startY: 1130, duration: 10, delay: 8 },
  { left: 45, startY: 1150, duration: 4, delay: 3.8 },
  { left: 70, startY: 1170, duration: 5, delay: 4.8 },
  { left: 91, startY: 1120, duration: 10, delay: 2.2 }
];

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const FuturisticCircuitEndScreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Grid Background movement loop (Perfect 20s seamless loop)
  const gridPos = (frame / (20 * fps) * 55) % 55;

  // 2. Scan line sweep (Seamless every 5 seconds)
  const scanLocalFrame = frame % (5 * fps);
  const scanTop = interpolate(scanLocalFrame, [0, 5 * fps], [-180, 1080], {
    extrapolateRight: 'clamp',
  });

  // 3. Flares movement (10 second loop cycle)
  const f1LocalFrame = frame % (10 * fps);
  const f1X = interpolate(f1LocalFrame, [0, 5 * fps, 10 * fps], [0, 50, 0], { easing: Easing.inOut(Easing.quad) });
  const f1Y = interpolate(f1LocalFrame, [0, 5 * fps, 10 * fps], [0, 40, 0], { easing: Easing.inOut(Easing.quad) });
  const f1Scale = interpolate(f1LocalFrame, [0, 5 * fps, 10 * fps], [1, 1.25, 1], { easing: Easing.inOut(Easing.quad) });
  const f1Opacity = interpolate(f1LocalFrame, [0, 5 * fps, 10 * fps], [0.4, 0.85, 0.4], { easing: Easing.inOut(Easing.quad) });

  const f2LocalFrame = (frame + 5 * fps) % (10 * fps); // offset by 5 seconds
  const f2X = interpolate(f2LocalFrame, [0, 5 * fps, 10 * fps], [0, 50, 0], { easing: Easing.inOut(Easing.quad) });
  const f2Y = interpolate(f2LocalFrame, [0, 5 * fps, 10 * fps], [0, 40, 0], { easing: Easing.inOut(Easing.quad) });
  const f2Scale = interpolate(f2LocalFrame, [0, 5 * fps, 10 * fps], [1, 1.25, 1], { easing: Easing.inOut(Easing.quad) });
  const f2Opacity = interpolate(f2LocalFrame, [0, 5 * fps, 10 * fps], [0.4, 0.85, 0.4], { easing: Easing.inOut(Easing.quad) });

  // 4. Rotating Corners (Linear continuous, completes fully at 10s)
  const rotationAngle = (frame / (10 * fps)) * 360;

  // 5. Title Intro/Outro Loop Integration (Seams cleanly at 20s)
  let titleOpacity = 0;
  let titleY = -20;
  if (frame >= 18 && frame < 102) {
    const t = (frame - 18) / 84;
    const ease = Easing.out(Easing.quad)(t);
    titleOpacity = ease;
    titleY = -20 + ease * 20;
  } else if (frame >= 102 && frame < 1140) {
    titleOpacity = 1;
    titleY = 0;
  } else if (frame >= 1140) {
    const t = (frame - 1140) / 60;
    const ease = Easing.out(Easing.quad)(t);
    titleOpacity = 1 - ease;
    titleY = -ease * 20;
  }

  // PLACEHOLDER 1: Rect R1
  let r1Opacity = 0;
  let r1Scale = 0.6;
  let r1Rotate = -4;
  if (frame >= 48 && frame < 102) {
    const t = (frame - 48) / 54;
    const ease = Easing.bezier(0.2, 0.8, 0.3, 1.2)(t);
    r1Opacity = ease;
    r1Scale = 0.6 + ease * 0.4;
    r1Rotate = -4 + ease * 4;
  } else if (frame >= 102 && frame < 1140) {
    r1Opacity = 1;
    r1Scale = 1;
    r1Rotate = 0;
  } else if (frame >= 1140) {
    const t = (frame - 1140) / 60;
    const ease = Easing.out(Easing.quad)(t);
    r1Opacity = 1 - ease;
    r1Scale = 1 - ease * 0.4;
    r1Rotate = -ease * 4;
  }

  let r1HatchOpacity = 1;
  if (frame >= 132 && frame < 192) {
    r1HatchOpacity = 1 - (frame - 132) / 60;
  } else if (frame >= 192 && frame < 1140) {
    r1HatchOpacity = 0;
  }

  let r1FillScaleY = 0;
  if (frame >= 132 && frame < 198) {
    const t = (frame - 132) / 66;
    r1FillScaleY = Easing.bezier(0.4, 0, 0.2, 1)(t);
  } else if (frame >= 198 && frame < 1140) {
    r1FillScaleY = 1;
  }

  let r1ShineLeft = -60;
  if (frame >= 192 && frame < 1140) {
    const localShineFrame = (frame - 192) % 240;
    if (localShineFrame < 96) {
      r1ShineLeft = interpolate(localShineFrame, [0, 96], [-60, 160], { easing: Easing.inOut(Easing.quad) });
    } else {
      r1ShineLeft = 160;
    }
  }

  let r1LabelOpacity = 0;
  let r1LabelY = -20;
  if (frame >= 192 && frame < 252) {
    const t = (frame - 192) / 60;
    const ease = Easing.out(Easing.quad)(t);
    r1LabelOpacity = ease;
    r1LabelY = -20 + ease * 20;
  } else if (frame >= 252 && frame < 1140) {
    r1LabelOpacity = 1;
    r1LabelY = 0;
  }

  // PLACEHOLDER 2: Circle
  let circleOpacity = 0;
  let circleScale = 0.6;
  let circleRotate = -4;
  if (frame >= 30 && frame < 84) {
    const t = (frame - 30) / 54;
    const ease = Easing.bezier(0.2, 0.8, 0.3, 1.2)(t);
    circleOpacity = ease;
    circleScale = 0.6 + ease * 0.4;
    circleRotate = -4 + ease * 4;
  } else if (frame >= 84 && frame < 1140) {
    circleOpacity = 1;
    circleScale = 1;
    circleRotate = 0;
  } else if (frame >= 1140) {
    const t = (frame - 1140) / 60;
    const ease = Easing.out(Easing.quad)(t);
    circleOpacity = 1 - ease;
    circleScale = 1 - ease * 0.4;
    circleRotate = -ease * 4;
  }

  let circleHatchOpacity = 1;
  if (frame >= 114 && frame < 174) {
    circleHatchOpacity = 1 - (frame - 114) / 60;
  } else if (frame >= 174 && frame < 1140) {
    circleHatchOpacity = 0;
  }

  let circleFillScaleY = 0;
  if (frame >= 114 && frame < 180) {
    const t = (frame - 114) / 66;
    circleFillScaleY = Easing.bezier(0.4, 0, 0.2, 1)(t);
  } else if (frame >= 180 && frame < 1140) {
    circleFillScaleY = 1;
  }

  let circleShineLeft = -60;
  if (frame >= 192 && frame < 1140) {
    const localShineFrame = (frame - 192) % 240;
    if (localShineFrame < 96) {
      circleShineLeft = interpolate(localShineFrame, [0, 96], [-60, 160], { easing: Easing.inOut(Easing.quad) });
    } else {
      circleShineLeft = 160;
    }
  }

  let circleLabelOpacity = 0;
  let circleLabelY = -20;
  if (frame >= 180 && frame < 240) {
    const t = (frame - 180) / 60;
    const ease = Easing.out(Easing.quad)(t);
    circleLabelOpacity = ease;
    circleLabelY = -20 + ease * 20;
  } else if (frame >= 240 && frame < 1140) {
    circleLabelOpacity = 1;
    circleLabelY = 0;
  }

  // PLACEHOLDER 3: Rect R2
  let r2Opacity = 0;
  let r2Scale = 0.6;
  let r2Rotate = -4;
  if (frame >= 66 && frame < 120) {
    const t = (frame - 66) / 54;
    const ease = Easing.bezier(0.2, 0.8, 0.3, 1.2)(t);
    r2Opacity = ease;
    r2Scale = 0.6 + ease * 0.4;
    r2Rotate = -4 + ease * 4;
  } else if (frame >= 120 && frame < 1140) {
    r2Opacity = 1;
    r2Scale = 1;
    r2Rotate = 0;
  } else if (frame >= 1140) {
    const t = (frame - 1140) / 60;
    const ease = Easing.out(Easing.quad)(t);
    r2Opacity = 1 - ease;
    r2Scale = 1 - ease * 0.4;
    r2Rotate = -ease * 4;
  }

  let r2HatchOpacity = 1;
  if (frame >= 150 && frame < 210) {
    r2HatchOpacity = 1 - (frame - 150) / 60;
  } else if (frame >= 210 && frame < 1140) {
    r2HatchOpacity = 0;
  }

  let r2FillScaleY = 0;
  if (frame >= 150 && frame < 216) {
    const t = (frame - 150) / 66;
    r2FillScaleY = Easing.bezier(0.4, 0, 0.2, 1)(t);
  } else if (frame >= 216 && frame < 1140) {
    r2FillScaleY = 1;
  }

  let r2ShineLeft = -60;
  if (frame >= 192 && frame < 1140) {
    const localShineFrame = (frame - 192) % 240;
    if (localShineFrame < 96) {
      r2ShineLeft = interpolate(localShineFrame, [0, 96], [-60, 160], { easing: Easing.inOut(Easing.quad) });
    } else {
      r2ShineLeft = 160;
    }
  }

  let r2LabelOpacity = 0;
  let r2LabelY = -20;
  if (frame >= 204 && frame < 264) {
    const t = (frame - 204) / 60;
    const ease = Easing.out(Easing.quad)(t);
    r2LabelOpacity = ease;
    r2LabelY = -20 + ease * 20;
  } else if (frame >= 264 && frame < 1140) {
    r2LabelOpacity = 1;
    r2LabelY = 0;
  }

  // RENDER MAIN SCENE
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
        background: '#020812',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}
    >
      {/* 3D-like radial & linear gradient background scene */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 25% 35%, rgba(0,120,255,0.18), transparent 45%),
            radial-gradient(circle at 75% 65%, rgba(0,210,255,0.14), transparent 45%),
            linear-gradient(135deg, #010610 0%, #04162e 50%, #010610 100%)
          `,
        }}
      >
        {/* Circuit grid layer */}
        <div
          style={{
            position: 'absolute',
            inset: -50,
            backgroundImage: `
              linear-gradient(rgba(0,150,255,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,150,255,0.07) 1px, transparent 1px)
            `,
            backgroundSize: '55px 55px',
            backgroundPosition: `${gridPos}px ${gridPos}px`,
          }}
        />

        {/* Floating Light Flares */}
        <div
          style={{
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
          }}
        />
        <div
          style={{
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
          }}
        />

        {/* Lines and Nodes Container */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {/* Circuit Lines */}
          {LINES_DATA.map((line, idx) => {
            const lineLocalFrame = (frame + line.delay * fps) % (4 * fps);
            const lineOpacity = interpolate(
              lineLocalFrame,
              [0, 2 * fps, 4 * fps],
              [0.15, 0.8, 0.15],
              { easing: Easing.inOut(Easing.quad) }
            );

            return (
              <div
                key={`line-${idx}`}
                style={{
                  position: 'absolute',
                  top: `${line.top}%`,
                  left: `${line.left}%`,
                  opacity: lineOpacity,
                  boxShadow: '0 0 8px #00d4ff',
                  height: line.vertical ? line.size : 2,
                  width: line.vertical ? 2 : line.size,
                  background: line.vertical
                    ? 'linear-gradient(0deg, transparent, #00d4ff, transparent)'
                    : 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                }}
              />
            );
          })}

          {/* Glowing Nodes */}
          {NODES_DATA.map((node, idx) => {
            const nodeLocalFrame = (frame + node.delay * fps) % (2.5 * fps);
            const nodeOpacity = interpolate(
              nodeLocalFrame,
              [0, 1.25 * fps, 2.5 * fps],
              [0.25, 1, 0.25],
              { easing: Easing.inOut(Easing.quad) }
            );
            const nodeScale = interpolate(
              nodeLocalFrame,
              [0, 1.25 * fps, 2.5 * fps],
              [1, 1.6, 1],
              { easing: Easing.inOut(Easing.quad) }
            );

            return (
              <div
                key={`node-${idx}`}
                style={{
                  position: 'absolute',
                  width: 5,
                  height: 5,
                  background: '#00eaff',
                  borderRadius: '50%',
                  boxShadow: '0 0 12px #00eaff, 0 0 24px #00aaff',
                  top: `${node.top}%`,
                  left: `${node.left}%`,
                  transform: `scale(${nodeScale})`,
                  opacity: nodeOpacity,
                }}
              />
            );
          })}

          {/* Floating particles */}
          {PARTICLES_DATA.map((p, idx) => {
            const localFrame = (frame + p.delay * fps) % (p.duration * fps);
            const progress = localFrame / (p.duration * fps);
            const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 0.8, 0.8, 0]);
            const yTrans = interpolate(progress, [0, 1], [0, -1200]);

            return (
              <div
                key={`particle-${idx}`}
                style={{
                  position: 'absolute',
                  width: 3,
                  height: 3,
                  background: 'rgba(120,220,255,0.8)',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px #66ddff',
                  left: `${p.left}%`,
                  top: p.startY,
                  transform: `translateY(${yTrans}px)`,
                  opacity: opacity,
                }}
              />
            );
          })}
        </div>

        {/* Scan line sweep layer */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 180,
            background: 'linear-gradient(180deg, transparent, rgba(0,200,255,0.12), transparent)',
            pointerEvents: 'none',
            top: scanTop,
          }}
        />

        {/* Corner Decor - Top Left */}
        <div
          style={{
            position: 'absolute',
            width: 90,
            height: 90,
            border: '2px solid rgba(0,200,255,0.4)',
            borderRadius: '50%',
            top: 35,
            left: 35,
            transform: `rotate(${rotationAngle}deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 12,
              border: '1px dashed rgba(0,200,255,0.5)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 35,
              background: 'rgba(0,200,255,0.3)',
              borderRadius: '50%',
              boxShadow: '0 0 15px #00d4ff',
            }}
          />
        </div>

        {/* Corner Decor - Bottom Right */}
        <div
          style={{
            position: 'absolute',
            width: 90,
            height: 90,
            border: '2px solid rgba(0,200,255,0.4)',
            borderRadius: '50%',
            bottom: 35,
            right: 35,
            transform: `rotate(${-rotationAngle}deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 12,
              border: '1px dashed rgba(0,200,255,0.5)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 35,
              background: 'rgba(0,200,255,0.3)',
              borderRadius: '50%',
              boxShadow: '0 0 15px #00d4ff',
            }}
          />
        </div>

        {/* Title Heading */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            width: '100%',
            textAlign: 'center',
            color: '#bdeeff',
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: 'uppercase',
            textShadow: '0 0 18px rgba(0,200,255,0.8)',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Thanks For Watching
        </div>

        {/* Main interactive Placeholders Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 50,
          }}
        >
          {/* PLACEHOLDER 1: Next Video Rect */}
          <div
            style={{
              position: 'relative',
              width: 270,
              height: 160,
              borderRadius: 14,
              border: '2px solid rgba(0,200,255,0.7)',
              boxShadow: '0 0 30px rgba(0,180,255,0.45), inset 0 0 25px rgba(0,150,255,0.2)',
              overflow: 'hidden',
              opacity: r1Opacity,
              transform: `scale(${r1Scale}) rotate(${r1Rotate}deg)`,
            }}
          >
            {/* Rising Solid Fill */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #5fd9ff, #009dff)',
                transformOrigin: 'bottom',
                transform: `scaleY(${r1FillScaleY})`,
              }}
            />
            {/* Hatch Texture Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  rgba(0,190,255,0.5),
                  rgba(0,190,255,0.5) 4px,
                  transparent 4px,
                  transparent 11px
                )`,
                zIndex: 1,
                opacity: r1HatchOpacity,
              }}
            />
            {/* Label Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 1,
                textShadow: '0 0 10px rgba(0,60,120,0.9)',
                zIndex: 4,
                opacity: r1LabelOpacity,
                transform: `translateY(${r1LabelY}px)`,
              }}
            >
              Next Video
            </div>
            {/* Sweeping Shine Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent)',
                transform: 'skewX(-20deg)',
                zIndex: 3,
                left: `${r1ShineLeft}%`,
              }}
            />
          </div>

          {/* PLACEHOLDER 2: LOGO Circle */}
          <div
            style={{
              position: 'relative',
              width: 210,
              height: 210,
              borderRadius: '50%',
              border: '2px solid rgba(0,200,255,0.7)',
              boxShadow: '0 0 30px rgba(0,180,255,0.45), inset 0 0 25px rgba(0,150,255,0.2)',
              overflow: 'hidden',
              opacity: circleOpacity,
              transform: `scale(${circleScale}) rotate(${circleRotate}deg)`,
            }}
          >
            {/* Rising Solid Fill */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #5fd9ff, #009dff)',
                transformOrigin: 'bottom',
                transform: `scaleY(${circleFillScaleY})`,
              }}
            />
            {/* Hatch Texture Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  rgba(0,190,255,0.5),
                  rgba(0,190,255,0.5) 4px,
                  transparent 4px,
                  transparent 11px
                )`,
                zIndex: 1,
                opacity: circleHatchOpacity,
              }}
            />
            {/* Label Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: 1,
                textShadow: '0 0 10px rgba(0,60,120,0.9)',
                zIndex: 4,
                opacity: circleLabelOpacity,
                transform: `translateY(${circleLabelY}px)`,
              }}
            >
              LOGO
            </div>
            {/* Sweeping Shine Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent)',
                transform: 'skewX(-20deg)',
                zIndex: 3,
                left: `${circleShineLeft}%`,
              }}
            />
          </div>

          {/* PLACEHOLDER 3: Subscribe Rect */}
          <div
            style={{
              position: 'relative',
              width: 270,
              height: 160,
              borderRadius: 14,
              border: '2px solid rgba(0,200,255,0.7)',
              boxShadow: '0 0 30px rgba(0,180,255,0.45), inset 0 0 25px rgba(0,150,255,0.2)',
              overflow: 'hidden',
              opacity: r2Opacity,
              transform: `scale(${r2Scale}) rotate(${r2Rotate}deg)`,
            }}
          >
            {/* Rising Solid Fill */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #5fd9ff, #009dff)',
                transformOrigin: 'bottom',
                transform: `scaleY(${r2FillScaleY})`,
              }}
            />
            {/* Hatch Texture Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  rgba(0,190,255,0.5),
                  rgba(0,190,255,0.5) 4px,
                  transparent 4px,
                  transparent 11px
                )`,
                zIndex: 1,
                opacity: r2HatchOpacity,
              }}
            />
            {/* Label Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: 1,
                textShadow: '0 0 10px rgba(0,60,120,0.9)',
                zIndex: 4,
                opacity: r2LabelOpacity,
                transform: `translateY(${r2LabelY}px)`,
              }}
            >
              Subscribe
            </div>
            {/* Sweeping Shine Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent)',
                transform: 'skewX(-20deg)',
                zIndex: 3,
                left: `${r2ShineLeft}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticCircuitEndScreen;
// END_OF_FILE