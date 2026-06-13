import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic particle generation to avoid Math.random() in component render
const SPARKLES = Array.from({ length: 35 }).map((_, i) => {
  const seed1 = Math.sin(i * 123.456) * 10000;
  const seed2 = Math.cos(i * 456.789) * 10000;
  const seed3 = Math.sin(i * 789.123) * 10000;
  const seed4 = Math.cos(i * 321.654) * 10000;

  const size = (seed1 - Math.floor(seed1)) * 3 + 2; // 2 to 5px
  const left = (seed2 - Math.floor(seed2)) * 100;   // 0% to 100%
  const top = (seed3 - Math.floor(seed3)) * 100;    // 0% to 100%
  const delay = Math.floor((seed4 - Math.floor(seed4)) * 420); // 0 to 420 frames
  const duration = Math.floor(((seed1 + seed2) - Math.floor(seed1 + seed2)) * 240) + 300; // 300 to 540 frames
  return { size, left, top, delay, duration };
});

export const PremiumGoldOutro: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const loopFrame = frame % 900; // Exact 15s seamless loop window at 60fps

  // Background Translation (14s cycle mapped to 15s seamless loop)
  const bgTranslate = interpolate(loopFrame, [0, 900], [0, -22]);

  // Background Glow Drift Alternate Loop (15s total cycle)
  const halfDuration = 450;
  const bgGlowX = interpolate(
    loopFrame,
    [0, halfDuration, 900],
    [-3, 4, -3],
    { easing: Easing.inOut(Easing.quad) }
  );
  const bgGlowY = interpolate(
    loopFrame,
    [0, halfDuration, 900],
    [-2, 3, -2],
    { easing: Easing.inOut(Easing.quad) }
  );
  const bgGlowScale = interpolate(
    loopFrame,
    [0, halfDuration, 900],
    [1, 1.1, 1],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Background Diagonal Streaks (5s cycle i.e. 300 frames)
  const streakPos = interpolate(loopFrame % 300, [0, 300], [0, 420]);

  // Light Sweep Left (5s cycle i.e. 300 frames)
  const sweepLeft = interpolate(loopFrame % 300, [0, 165, 240, 300], [-60, -60, 160, 160]);

  // Box Sweep Left (5s cycle i.e. 300 frames)
  const boxSweepLeft = interpolate(loopFrame % 300, [0, 180, 246, 300], [-120, -120, 220, 220]);

  // Border Brightness Shine (5s cycle i.e. 300 frames)
  const borderBrightness = interpolate(loopFrame % 300, [0, 150, 300], [1, 1.5, 1]);

  // Play Icon Pulse (2.5s cycle i.e. 150 frames)
  const playScale = interpolate(loopFrame % 150, [0, 75, 150], [1, 1.15, 1], { easing: Easing.inOut(Easing.quad) });
  const playOpacity = interpolate(loopFrame % 150, [0, 75, 150], [0.85, 1, 0.85]);

  // Watermark Pulse (3s cycle i.e. 180 frames)
  const watermarkOpacity = interpolate(loopFrame % 180, [0, 90, 180], [0.4, 0.8, 0.4]);

  // Box 1 Slide-in / out
  const box1X = interpolate(loopFrame, [0, 81, 792, 864, 900], [-130, 0, 0, -130, -130], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const box1Scale = interpolate(loopFrame, [0, 81, 792, 864, 900], [0.9, 1, 1, 0.9, 0.9], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const box1Opacity = interpolate(loopFrame, [0, 81, 792, 864, 900], [0, 1, 1, 0, 0]);

  const box1LabelOpacity = interpolate(loopFrame, [0, 63, 144, 900], [0, 0, 1, 1]);
  const box1LabelY = interpolate(loopFrame, [0, 63, 144, 900], [12, 12, 0, 0]);

  // Box 2 Slide-in / out
  const box2X = interpolate(loopFrame, [0, 45, 126, 792, 864, 900], [-130, -130, 0, 0, -130, -130], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const box2Scale = interpolate(loopFrame, [0, 45, 126, 792, 864, 900], [0.9, 0.9, 1, 1, 0.9, 0.9], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const box2Opacity = interpolate(loopFrame, [0, 45, 126, 792, 864, 900], [0, 0, 1, 1, 0, 0]);

  const box2LabelOpacity = interpolate(loopFrame, [0, 108, 180, 900], [0, 0, 1, 1]);
  const box2LabelY = interpolate(loopFrame, [0, 108, 180, 900], [12, 12, 0, 0]);

  // Subscribe Text Animations
  const subScale = interpolate(
    loopFrame,
    [0, 126, 189, 234, 450, 477, 504, 531, 792, 864, 900],
    [0, 0, 1.18, 1, 1, 1.06, 1.06, 1, 1, 0, 0],
    { easing: Easing.bezier(0.34, 1.56, 0.64, 1) }
  );
  const subRotate = interpolate(
    loopFrame,
    [0, 450, 477, 504, 531, 900],
    [0, 0, -2, 2, 0, 0]
  );
  const subY = interpolate(loopFrame, [0, 126, 189, 792, 864, 900], [20, 20, 0, 0, 20, 20]);
  const subOpacity = interpolate(loopFrame, [0, 126, 189, 792, 864, 900], [0, 0, 1, 1, 0, 0]);
  const subShineX = interpolate(loopFrame % 180, [0, 180], [200, -200]);

  // Circle Wrap Appearance
  const circleScale = interpolate(
    loopFrame,
    [0, 171, 270, 324, 792, 864, 900],
    [0, 0, 1.12, 1, 1, 0, 0],
    { easing: Easing.bezier(0.34, 1.56, 0.64, 1) }
  );
  const circleRotate = interpolate(loopFrame, [0, 171, 270, 792, 864, 900], [-120, -120, 0, 0, 120, 120]);
  const circleOpacity = interpolate(loopFrame, [0, 171, 270, 792, 864, 900], [0, 0, 1, 1, 0, 0]);

  // YouTube Play Button inside Circle (1.5s i.e. 90 frames)
  const ytPlayScale = interpolate(loopFrame % 90, [0, 45, 90], [1, 1.12, 1], { easing: Easing.inOut(Easing.quad) });

  // Ring Pulses inside Circle Wrap (2.5s cycle i.e. 150 frames)
  const ring1Scale = interpolate(loopFrame % 150, [0, 75, 150], [1, 1.07, 1], { easing: Easing.inOut(Easing.quad) });
  const ring1Opacity = interpolate(loopFrame % 150, [0, 75, 150], [0.7, 1, 0.7]);

  const ring2FrameOffset = (loopFrame - 24 + 900) % 150;
  const ring2Scale = interpolate(ring2FrameOffset, [0, 75, 150], [1, 1.07, 1], { easing: Easing.inOut(Easing.quad) });
  const ring2Opacity = interpolate(ring2FrameOffset, [0, 75, 150], [0.7, 1, 0.7]);

  // Arrow Animations
  const arrowOpacity = interpolate(loopFrame, [0, 243, 315, 810, 864, 900], [0, 0, 1, 1, 0, 0]);
  const arrowDashOffset = interpolate(loopFrame, [0, 243, 360, 792, 846, 900], [220, 220, 0, 0, 220, 220]);

  // Follow Section Slide-Up
  const followY = interpolate(loopFrame, [0, 306, 405, 792, 864, 900], [45, 45, 0, 0, 45, 45], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const followOpacity = interpolate(loopFrame, [0, 306, 405, 792, 864, 900], [0, 0, 1, 1, 0, 0]);

  // Social Icons bouncing
  const fbY = interpolate(loopFrame % 150, [0, 75, 150], [0, -6, 0], { easing: Easing.inOut(Easing.quad) });
  const xY = interpolate((loopFrame - 12 + 150) % 150, [0, 75, 150], [0, -6, 0], { easing: Easing.inOut(Easing.quad) });
  const igY = interpolate((loopFrame - 24 + 150) % 150, [0, 75, 150], [0, -6, 0], { easing: Easing.inOut(Easing.quad) });

  return (
    <div
      style={{
        position: 'absolute',
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#000000',
        fontFamily: 'Poppins, Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#0d0a04',
        }}
      >
        {/* ===== BACKGROUND BERLAPIS ===== */}
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(115deg, #0d0a04 0%, #3d2a08 10%, #8a5f15 18%, #e0a92e 25%, #ffe9a8 31%, #c9912b 37%, #1a1206 46%, #5a3c0e 56%, #f0c95e 64%, #ffe9a8 70%, #1a1206 80%, #b8841f 90%, #0d0a04 100%)',
            backgroundSize: '220% 220%',
            transform: `translate(${bgTranslate}%, ${bgTranslate}%)`,
            filter: 'blur(3px) saturate(1.2)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 40% 60% at 30% 40%, rgba(255,220,140,0.25), transparent 60%), radial-gradient(ellipse 50% 50% at 75% 65%, rgba(255,180,60,0.18), transparent 60%)',
            mixBlendMode: 'screen',
            transform: `translate(${bgGlowX}%, ${bgGlowY}%) scale(${bgGlowScale})`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(115deg, transparent 0px, rgba(255, 235, 170, 0.10) 18px, transparent 55px, rgba(0,0,0,0.18) 85px, transparent 125px)',
            backgroundPosition: `${streakPos}px 0`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: `${sweepLeft}%`,
            width: '50%',
            height: '200%',
            background: 'linear-gradient(90deg, transparent, rgba(255,250,220,0.35), transparent)',
            transform: 'rotate(18deg)',
            filter: 'blur(8px)',
          }}
        />

        {/* ===== PARTIKEL BERKILAU ===== */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {SPARKLES.map((sp, i) => {
            const localFrame = (loopFrame - sp.delay + 900) % 900;
            if (localFrame >= sp.duration) return null;

            const progress = localFrame / sp.duration;
            const translateY = interpolate(progress, [0, 0.15, 0.85, 1], [20, 0, -80, -120]);
            const scale = interpolate(progress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.3]);
            const opacity = interpolate(progress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${sp.size}px`,
                  height: `${sp.size}px`,
                  left: `${sp.left}%`,
                  top: `${sp.top}%`,
                  backgroundColor: '#fff7d6',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px #ffe49a, 0 0 16px #ffc24a',
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity,
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* ===== WATERMARK ===== */}
        <div
          style={{
            position: 'absolute',
            left: '1.4%',
            top: '50%',
            transform: 'translateY(-50%) rotate(180deg)',
            writingMode: 'vertical-rl',
            fontSize: '25px',
            fontWeight: 600,
            color: 'rgba(255,250,235,0.6)',
            letterSpacing: '5px',
            textShadow: '0 0 10px rgba(0,0,0,0.6)',
            opacity: watermarkOpacity,
          }}
        >
          SHARE • LIKE • COMMENT
        </div>

        {/* ===== KOTAK VIDEO 1 ===== */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            top: '21%',
            width: '32%',
            height: '27%',
            background: 'linear-gradient(145deg, #15110a, #050403)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.7), inset 0 0 30px rgba(0,0,0,0.85)',
            transform: `translateX(${box1X}%) scale(${box1Scale})`,
            opacity: box1Opacity,
          }}
        >
          {/* Border emas gradient */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '2px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ffe9a8, #c9912b, #6b4710, #ffd970)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              filter: `brightness(${borderBrightness})`,
            }}
          />

          {/* Kilau sweep dalam kotak */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${boxSweepLeft}%`,
              width: '60%',
              height: '100%',
              background: 'linear-gradient(120deg, transparent, rgba(255,225,140,0.20), transparent)',
              transform: 'skewX(-20deg)',
            }}
          />

          {/* Ikon play */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${playScale})`,
              opacity: playOpacity,
              width: 0,
              height: 0,
              borderLeft: '30.7px solid rgba(255,235,180,0.85)',
              borderTop: '19.2px solid transparent',
              borderBottom: '19.2px solid transparent',
              filter: 'drop-shadow(0 0 8px rgba(255,200,80,0.6))',
            }}
          />

          <span
            style={{
              position: 'absolute',
              top: '-53.7px',
              left: '3.8px',
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '1px',
              background: 'linear-gradient(90deg, #fff, #ffe9a8)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 2px 6px rgba(0,0,0,0.7)',
              filter: 'drop-shadow(0 0 6px rgba(255,210,90,0.4))',
              opacity: box1LabelOpacity,
              transform: `translateY(${box1LabelY}px)`,
            }}
          >
            WATCH NEXT
          </span>
        </div>

        {/* ===== KOTAK VIDEO 2 ===== */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            top: '60%',
            width: '32%',
            height: '27%',
            background: 'linear-gradient(145deg, #15110a, #050403)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.7), inset 0 0 30px rgba(0,0,0,0.85)',
            transform: `translateX(${box2X}%) scale(${box2Scale})`,
            opacity: box2Opacity,
          }}
        >
          {/* Border emas gradient */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '2px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ffe9a8, #c9912b, #6b4710, #ffd970)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              filter: `brightness(${borderBrightness})`,
            }}
          />

          {/* Kilau sweep dalam kotak */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${boxSweepLeft}%`,
              width: '60%',
              height: '100%',
              background: 'linear-gradient(120deg, transparent, rgba(255,225,140,0.20), transparent)',
              transform: 'skewX(-20deg)',
            }}
          />

          {/* Ikon play */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${playScale})`,
              opacity: playOpacity,
              width: 0,
              height: 0,
              borderLeft: '30.7px solid rgba(255,235,180,0.85)',
              borderTop: '19.2px solid transparent',
              borderBottom: '19.2px solid transparent',
              filter: 'drop-shadow(0 0 8px rgba(255,200,80,0.6))',
            }}
          />

          <span
            style={{
              position: 'absolute',
              top: '-53.7px',
              left: '3.8px',
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '1px',
              background: 'linear-gradient(90deg, #fff, #ffe9a8)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 2px 6px rgba(0,0,0,0.7)',
              filter: 'drop-shadow(0 0 6px rgba(255,210,90,0.4))',
              opacity: box2LabelOpacity,
              transform: `translateY(${box2LabelY}px)`,
            }}
          >
            RECOMMENDED
          </span>
        </div>

        {/* ===== SUBSCRIBE ===== */}
        <div
          style={{
            position: 'absolute',
            top: '13%',
            right: '7%',
            fontSize: '80.6px',
            fontWeight: 900,
            letterSpacing: '1px',
            backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #fff3c4 35%, #ffd970 50%, #fff3c4 65%, #ffffff 100%)',
            backgroundSize: '200% auto',
            backgroundPosition: `${subShineX}% center`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 0 22px rgba(255,200,80,0.85)) drop-shadow(2px 3px 4px rgba(0,0,0,0.5))',
            transform: `translateY(${subY}px) scale(${subScale}) rotate(${subRotate}deg)`,
            opacity: subOpacity,
          }}
        >
          SUBSCRIBE
        </div>

        {/* ===== LINGKARAN SUBSCRIBE ===== */}
        <div
          style={{
            position: 'absolute',
            top: '37%',
            right: '17%',
            width: '16%',
            aspectRatio: '1',
            transform: `scale(${circleScale}) rotate(${circleRotate}deg)`,
            opacity: circleOpacity,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 35% 28%, #222, #000)',
              borderRadius: '50%',
              boxShadow: '0 0 35px rgba(0,0,0,0.7), inset 0 0 25px rgba(0,0,0,0.9)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Double Glow Rings */}
            <div
              style={{
                position: 'absolute',
                inset: '-6px',
                borderRadius: '50%',
                border: '3px solid rgba(255,210,90,0.8)',
                transform: `scale(${ring1Scale})`,
                opacity: ring1Opacity,
                boxShadow: '0 0 18px rgba(255,200,80,0.5)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '-14px',
                borderRadius: '50%',
                border: '2px solid rgba(255,210,90,0.3)',
                transform: `scale(${ring2Scale})`,
                opacity: ring2Opacity,
                boxShadow: '0 0 18px rgba(255,200,80,0.5)',
              }}
            />

            {/* YouTube Play Logo */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '38.4px solid #ff2d2d',
                borderTop: '25px solid transparent',
                borderBottom: '25px solid transparent',
                marginLeft: '9.6px',
                filter: 'drop-shadow(0 0 10px rgba(255,60,60,0.7))',
                transform: `scale(${ytPlayScale})`,
              }}
            />
          </div>
        </div>

        {/* ===== PANAH ===== */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            right: '12%',
            width: '8%',
            height: '14%',
            opacity: arrowOpacity,
          }}
        >
          <svg viewBox="0 0 100 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ffd970" />
              </linearGradient>
            </defs>
            <path
              d="M 10 5 Q 92 8 80 92 M 80 92 L 60 72 M 80 92 L 97 66"
              style={{
                fill: 'none',
                stroke: 'url(#arrowGrad)',
                strokeWidth: 4.5,
                strokeLinecap: 'round',
                filter: 'drop-shadow(0 0 7px rgba(255,200,80,0.9))',
                strokeDasharray: '220',
                strokeDashoffset: arrowDashOffset,
              }}
            />
          </svg>
        </div>

        {/* ===== FOLLOW US ===== */}
        <div
          style={{
            position: 'absolute',
            bottom: '7%',
            right: '7%',
            textAlign: 'center',
            transform: `translateY(${followY}px)`,
            opacity: followOpacity,
          }}
        >
          <div
            style={{
              fontSize: '26.8px',
              fontWeight: 700,
              background: 'linear-gradient(90deg, #fff, #ffe9a8)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
              marginBottom: '13.4px',
            }}
          >
            Follow Us:
          </div>
          <div
            style={{
              display: 'flex',
              gap: '17.3px',
              justifyContent: 'center',
            }}
          >
            {/* Facebook Icon */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26.8px',
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 0 14px rgba(255,200,80,0.5), inset 0 0 8px rgba(255,255,255,0.2)',
                background: 'linear-gradient(145deg, #1877f2, #0d5bc4)',
                transform: `translateY(${fbY}px)`,
              }}
            >
              f
            </div>

            {/* X Icon */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26.8px',
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 0 14px rgba(255,200,80,0.5), inset 0 0 8px rgba(255,255,255,0.2)',
                background: 'linear-gradient(145deg, #1a1a1a, #000)',
                transform: `translateY(${xY}px)`,
              }}
            >
              𝕏
            </div>

            {/* Instagram Icon */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26.8px',
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 0 14px rgba(255,200,80,0.5), inset 0 0 8px rgba(255,255,255,0.2)',
                background: 'linear-gradient(145deg, #feda75, #d62976 45%, #962fbf 75%, #4f5bd5)',
                transform: `translateY(${igY}px)`,
              }}
            >
              ◎
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumGoldOutro;
// END_OF_FILE