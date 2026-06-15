import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic Pseudo-Random Generator to ensure absolute frame-locking
const lcg = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

const randomGenerator = lcg(12345);
const SPARKLES = Array.from({ length: 35 }).map((_, i) => {
  const size = randomGenerator() * 3 + 2; // 2px to 5px
  const left = randomGenerator() * 100; // 0% to 100%
  const top = randomGenerator() * 100; // 0% to 100%
  const delay = randomGenerator() * 900; // 0 to 900 frames
  const duration = randomGenerator() * 240 + 300; // 300 to 540 frames (5s to 9s)
  return { id: i, size, left, top, delay, duration };
});

export const YoutubeOutroPremiumGold: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Ensure 15 seconds loop duration (900 frames at 60fps)
  const totalDuration = fps * 15;
  const loopFrame = frame % totalDuration;

  // Fit 16:9 canvas
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Background move animation (loops seamlessly within 15s)
  const bgTx = interpolate(loopFrame, [0, 450, 900], [0, -22, 0]);
  const bgTy = interpolate(loopFrame, [0, 450, 900], [0, -22, 0]);

  // Glow drift animation
  const glowX = interpolate(loopFrame, [0, 450, 900], [-3, 4, -3]);
  const glowY = interpolate(loopFrame, [0, 450, 900], [-2, 3, -2]);
  const glowScale = interpolate(loopFrame, [0, 450, 900], [1, 1.1, 1]);

  // Streaks linear loop (loops every 5 seconds -> 300 frames)
  const streakPos = interpolate(loopFrame % 300, [0, 300], [0, 420]);

  // Light Sweep (loops every 5 seconds -> 300 frames)
  const lightSweepLeft = interpolate(loopFrame % 300, [0, 165, 240, 300], [-60, -60, 160, 160]);

  // Watermark pulse (loops every 5 seconds -> 300 frames)
  const watermarkOpacity = interpolate(loopFrame % 300, [0, 150, 300], [0.4, 0.8, 0.4]);

  // Box borders brightness (loops every 5 seconds -> 300 frames)
  const borderBrightness = interpolate(loopFrame % 300, [0, 150, 300], [1, 1.5, 1]);

  // Box interior sweep (loops every 5 seconds -> 300 frames)
  const boxSweepLeft = interpolate(loopFrame % 300, [0, 180, 246, 300], [-120, -120, 220, 220]);

  // Play icon pulse (loops every 1.5 seconds -> 90 frames)
  const playScale = interpolate(loopFrame % 90, [0, 45, 90], [1, 1.15, 1]);
  const playOpacity = interpolate(loopFrame % 90, [0, 45, 90], [0.85, 1, 0.85]);

  // Piecewise slide-in and slide-out for Box 1 (WATCH NEXT)
  const box1Props = useMemo(() => {
    const ease = Easing.bezier(0.22, 1, 0.36, 1);
    if (loopFrame < 81) {
      const t = interpolate(loopFrame, [0, 81], [0, 1]);
      const eased = ease(t);
      return {
        translateX: interpolate(eased, [0, 1], [-130, 0]),
        scale: interpolate(eased, [0, 1], [0.9, 1]),
        opacity: interpolate(eased, [0, 1], [0, 1]),
      };
    } else if (loopFrame < 792) {
      return { translateX: 0, scale: 1, opacity: 1 };
    } else if (loopFrame < 864) {
      const t = interpolate(loopFrame, [792, 864], [0, 1]);
      const eased = ease(t);
      return {
        translateX: interpolate(eased, [0, 1], [0, -130]),
        scale: interpolate(eased, [0, 1], [1, 0.9]),
        opacity: interpolate(eased, [0, 1], [1, 0]),
      };
    } else {
      return { translateX: -130, scale: 0.9, opacity: 0 };
    }
  }, [loopFrame]);

  // Piecewise slide-in and slide-out for Box 2 (RECOMMENDED)
  const box2Props = useMemo(() => {
    const ease = Easing.bezier(0.22, 1, 0.36, 1);
    if (loopFrame < 45) {
      return { translateX: -130, scale: 0.9, opacity: 0 };
    } else if (loopFrame < 126) {
      const t = interpolate(loopFrame, [45, 126], [0, 1]);
      const eased = ease(t);
      return {
        translateX: interpolate(eased, [0, 1], [-130, 0]),
        scale: interpolate(eased, [0, 1], [0.9, 1]),
        opacity: interpolate(eased, [0, 1], [0, 1]),
      };
    } else if (loopFrame < 792) {
      return { translateX: 0, scale: 1, opacity: 1 };
    } else if (loopFrame < 864) {
      const t = interpolate(loopFrame, [792, 864], [0, 1]);
      const eased = ease(t);
      return {
        translateX: interpolate(eased, [0, 1], [0, -130]),
        scale: interpolate(eased, [0, 1], [1, 0.9]),
        opacity: interpolate(eased, [0, 1], [1, 0]),
      };
    } else {
      return { translateX: -130, scale: 0.9, opacity: 0 };
    }
  }, [loopFrame]);

  // Labels transitions
  const label1Opacity = interpolate(loopFrame, [0, 63, 144, 900], [0, 0, 1, 1]);
  const label1Y = interpolate(loopFrame, [0, 63, 144, 900], [12, 12, 0, 0]);

  const label2Opacity = interpolate(loopFrame, [0, 108, 180, 900], [0, 0, 1, 1]);
  const label2Y = interpolate(loopFrame, [0, 108, 180, 900], [12, 12, 0, 0]);

  // SUBSCRIBE entry and pop physics (mapped completely across 15 seconds)
  const subScale = interpolate(
    loopFrame,
    [0, 126, 189, 234, 450, 477, 504, 531, 792, 864, 900],
    [0, 0, 1.18, 1, 1, 1.06, 1.06, 1, 1, 0, 0]
  );
  const subTranslateY = interpolate(
    loopFrame,
    [0, 126, 189, 792, 864, 900],
    [20, 20, 0, 0, 20, 20]
  );
  const subOpacity = interpolate(
    loopFrame,
    [0, 126, 189, 792, 864, 900],
    [0, 0, 1, 1, 0, 0]
  );
  const subRotate = interpolate(
    loopFrame,
    [0, 450, 477, 504, 531, 900],
    [0, 0, -2, 2, 0, 0]
  );

  // Subscribe shine layout shift (loops every 3s -> 180 frames)
  const subShinePos = interpolate(loopFrame % 180, [0, 180], [200, -200]);

  // Circle wrapping entry animation (15s cycle)
  const circleScale = interpolate(
    loopFrame,
    [0, 171, 270, 324, 792, 864, 900],
    [0, 0, 1.12, 1, 1, 0, 0]
  );
  const circleRotate = interpolate(
    loopFrame,
    [0, 171, 270, 792, 864, 900],
    [-120, -120, 0, 0, 120, 120]
  );
  const circleOpacity = interpolate(
    loopFrame,
    [0, 171, 270, 792, 864, 900],
    [0, 0, 1, 1, 0, 0]
  );

  // Play button pulsation inside subscribe logo (loops every 1.5 seconds -> 90 frames)
  const ytPlayScale = interpolate(loopFrame % 90, [0, 45, 90], [1, 1.12, 1]);

  // Triple ring pulse (loops every 1.5 seconds -> 90 frames)
  const ringScale1 = interpolate(loopFrame % 90, [0, 45, 90], [1, 1.07, 1]);
  const ringOpacity1 = interpolate(loopFrame % 90, [0, 45, 90], [0.7, 1, 0.7]);
  const ringShadow1 = interpolate(loopFrame % 90, [0, 45, 90], [18, 35, 18]);

  const ringFrame2 = (loopFrame - 24 + 900) % 90;
  const ringScale2 = interpolate(ringFrame2, [0, 45, 90], [1, 1.07, 1]);
  const ringOpacity2 = interpolate(ringFrame2, [0, 45, 90], [0.7, 1, 0.7]);
  const ringShadow2 = interpolate(ringFrame2, [0, 45, 90], [18, 35, 18]);

  // Arrow drawing and fade animations
  const arrowOpacity = interpolate(
    loopFrame,
    [0, 243, 315, 810, 864, 900],
    [0, 0, 1, 1, 0, 0]
  );
  const arrowDashOffset = interpolate(
    loopFrame,
    [0, 243, 360, 792, 846, 900],
    [220, 220, 0, 0, 220, 220]
  );

  // Follow Us popup block
  const followTranslateY = interpolate(
    loopFrame,
    [0, 306, 405, 792, 864, 900],
    [45, 45, 0, 0, 45, 45]
  );
  const followOpacity = interpolate(
    loopFrame,
    [0, 306, 405, 792, 864, 900],
    [0, 0, 1, 1, 0, 0]
  );

  // Social icons bouncing (loops every 2.5 seconds -> 150 frames)
  const iconY1 = interpolate(loopFrame % 150, [0, 75, 150], [0, -6, 0]);
  const iconY2 = interpolate((loopFrame - 12 + 150) % 150, [0, 75, 150], [0, -6, 0]);
  const iconY3 = interpolate((loopFrame - 24 + 150) % 150, [0, 75, 150], [0, -6, 0]);

  // Main canvas wrapper with 16:9 proportional scale fitting without black borders
  const sceneStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#0d0a04',
    fontFamily: "'Poppins', 'Arial', sans-serif"
  };

  return (
    <div style={sceneStyle}>
      {/* Background with multiple gradient filters */}
      <div
        style={{
          position: 'absolute',
          inset: '-50%',
          width: '200%',
          height: '200%',
          background: `linear-gradient(
            115deg,
            #0d0a04 0%,
            #3d2a08 10%,
            #8a5f15 18%,
            #e0a92e 25%,
            #ffe9a8 31%,
            #c9912b 37%,
            #1a1206 46%,
            #5a3c0e 56%,
            #f0c95e 64%,
            #ffe9a8 70%,
            #1a1206 80%,
            #b8841f 90%,
            #0d0a04 100%
          )`,
          backgroundSize: '220% 220%',
          transform: `translate(${bgTx}%, ${bgTy}%)`,
          filter: 'blur(3px) saturate(1.2)',
        }}
      />

      {/* Glow Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 40% 60% at 30% 40%, rgba(255,220,140,0.25), transparent 60%),
                      radial-gradient(ellipse 50% 50% at 75% 65%, rgba(255,180,60,0.18), transparent 60%)`,
          mixBlendMode: 'screen',
          transform: `translate(${glowX}%, ${glowY}%) scale(${glowScale})`,
        }}
      />

      {/* Streaks Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            115deg,
            transparent 0px,
            rgba(255, 235, 170, 0.10) 18px,
            transparent 55px,
            rgba(0,0,0,0.18) 85px,
            transparent 125px
          )`,
          backgroundPosition: `${streakPos}px 0px`,
        }}
      />

      {/* Dynamic light sweep */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: `${lightSweepLeft}%`,
          width: '50%',
          height: '200%',
          background: 'linear-gradient(90deg, transparent, rgba(255,250,220,0.35), transparent)',
          transform: 'rotate(18deg)',
          filter: 'blur(8px)',
        }}
      />

      {/* Sparkles dynamic list */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {SPARKLES.map((sparkle) => {
          const sparkleLifeFrame = (loopFrame - sparkle.delay + totalDuration) % totalDuration;
          if (sparkleLifeFrame >= sparkle.duration) return null;

          const t = sparkleLifeFrame / sparkle.duration;

          let opacity = 0;
          if (t < 0.15) {
            opacity = t / 0.15;
          } else if (t < 0.85) {
            opacity = 1;
          } else {
            opacity = 1 - (t - 0.85) / 0.15;
          }

          let scale = 1;
          if (t < 0.15) {
            scale = t / 0.15;
          } else if (t >= 0.85) {
            scale = 1 - ((t - 0.85) / 0.15) * 0.7;
          }

          const yPos = 20 - 140 * t;

          return (
            <div
              key={sparkle.id}
              style={{
                position: 'absolute',
                width: `${sparkle.size}px`,
                height: `${sparkle.size}px`,
                left: `${sparkle.left}%`,
                top: `${sparkle.top}%`,
                backgroundColor: '#fff7d6',
                borderRadius: '50%',
                boxShadow: '0 0 8px #ffe49a, 0 0 16px #ffc24a',
                opacity,
                transform: `translateY(${yPos}px) scale(${scale})`,
              }}
            />
          );
        })}
      </div>

      {/* Ambient Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Side Watermark */}
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

      {/* Box 1 Video Container */}
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
          transform: `translateX(${box1Props.translateX}%) scale(${box1Props.scale})`,
          opacity: box1Props.opacity,
        }}
      >
        {/* Animated Gold Outer Ring Mask */}
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
            pointerEvents: 'none',
          }}
        />
        {/* Interior highlight glide */}
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
        <span
          style={{
            position: 'absolute',
            top: '-54px',
            left: '4px',
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '1px',
            background: 'linear-gradient(90deg, #fff, #ffe9a8)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 2px 6px rgba(0,0,0,0.7)',
            filter: 'drop-shadow(0 0 6px rgba(255,210,90,0.4))',
            opacity: label1Opacity,
            transform: `translateY(${label1Y}px)`,
          }}
        >
          WATCH NEXT
        </span>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${playScale})`,
            opacity: playOpacity,
            width: 0,
            height: 0,
            borderLeft: '31px solid rgba(255,235,180,0.85)',
            borderTop: '19px solid transparent',
            borderBottom: '19px solid transparent',
            filter: 'drop-shadow(0 0 8px rgba(255,200,80,0.6))',
          }}
        />
      </div>

      {/* Box 2 Video Container */}
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
          transform: `translateX(${box2Props.translateX}%) scale(${box2Props.scale})`,
          opacity: box2Props.opacity,
        }}
      >
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
            pointerEvents: 'none',
          }}
        />
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
        <span
          style={{
            position: 'absolute',
            top: '-54px',
            left: '4px',
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '1px',
            background: 'linear-gradient(90deg, #fff, #ffe9a8)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 2px 6px rgba(0,0,0,0.7)',
            filter: 'drop-shadow(0 0 6px rgba(255,210,90,0.4))',
            opacity: label2Opacity,
            transform: `translateY(${label2Y}px)`,
          }}
        >
          RECOMMENDED
        </span>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${playScale})`,
            opacity: playOpacity,
            width: 0,
            height: 0,
            borderLeft: '31px solid rgba(255,235,180,0.85)',
            borderTop: '19px solid transparent',
            borderBottom: '19px solid transparent',
            filter: 'drop-shadow(0 0 8px rgba(255,200,80,0.6))',
          }}
        />
      </div>

      {/* SUBSCRIBE Static Text Block */}
      <div
        style={{
          position: 'absolute',
          top: '13%',
          right: '7%',
          fontSize: '81px',
          fontWeight: 900,
          letterSpacing: '1px',
          background: 'linear-gradient(90deg, #ffffff 0%, #fff3c4 35%, #ffd970 50%, #fff3c4 65%, #ffffff 100%)',
          backgroundSize: '200% auto',
          backgroundPosition: `${subShinePos}% center`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 0 22px rgba(255,200,80,0.85)) drop-shadow(2px 3px 4px rgba(0,0,0,0.5))',
          transform: `scale(${subScale}) translateY(${subTranslateY}px) rotate(${subRotate}deg)`,
          opacity: subOpacity,
        }}
      >
        SUBSCRIBE
      </div>

      {/* Outer YouTube Subscribe Circle with dynamic radial animations */}
      <div
        style={{
          position: 'absolute',
          top: '37%',
          right: '17%',
          width: '307px',
          height: '307px',
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
          {/* Inner Red Play Logo */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '38px solid #ff2d2d',
              borderTop: '25px solid transparent',
              borderBottom: '25px solid transparent',
              marginLeft: '10px',
              filter: 'drop-shadow(0 0 10px rgba(255,60,60,0.7))',
              transform: `scale(${ytPlayScale})`,
            }}
          />

          {/* Golden Ambient Rings */}
          <div
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: '3px solid rgba(255,210,90,0.8)',
              transform: `scale(${ringScale1})`,
              opacity: ringOpacity1,
              boxShadow: `0 0 ${ringShadow1}px rgba(255,200,80,0.5)`,
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: '-14px',
              borderRadius: '50%',
              border: '2px solid rgba(255,210,90,0.3)',
              transform: `scale(${ringScale2})`,
              opacity: ringOpacity2,
              boxShadow: `0 0 ${ringShadow2}px rgba(255,200,80,0.5)`,
            }}
          />
        </div>
      </div>

      {/* SVG Path Animated Arrow pointing from top-right to bottom-left */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          right: '12%',
          width: '154px',
          height: '151px',
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
            fill="none"
            stroke="url(#arrowGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="220"
            strokeDashoffset={arrowDashOffset}
            style={{
              filter: 'drop-shadow(0 0 7px rgba(255,200,80,0.9))',
            }}
          />
        </svg>
      </div>

      {/* Lower Follow Us Widget */}
      <div
        style={{
          position: 'absolute',
          bottom: '7%',
          right: '7%',
          textAlign: 'center',
          transform: `translateY(${followTranslateY}px)`,
          opacity: followOpacity,
        }}
      >
        <div
          style={{
            fontSize: '27px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #fff, #ffe9a8)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
            marginBottom: '13px',
          }}
        >
          Follow Us:
        </div>
        <div style={{ display: 'flex', gap: '17px', justifyContent: 'center' }}>
          {/* FB */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '27px',
              fontWeight: 'bold',
              color: '#fff',
              background: 'linear-gradient(145deg, #1877f2, #0d5bc4)',
              boxShadow: '0 0 14px rgba(255,200,80,0.5), inset 0 0 8px rgba(255,255,255,0.2)',
              transform: `translateY(${iconY1}px)`,
            }}
          >
            f
          </div>
          {/* X */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '27px',
              fontWeight: 'bold',
              color: '#fff',
              background: 'linear-gradient(145deg, #1a1a1a, #000)',
              boxShadow: '0 0 14px rgba(255,200,80,0.5), inset 0 0 8px rgba(255,255,255,0.2)',
              transform: `translateY(${iconY2}px)`,
            }}
          >
            𝕏
          </div>
          {/* IG */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '27px',
              fontWeight: 'bold',
              color: '#fff',
              background: 'linear-gradient(145deg, #feda75, #d62976 45%, #962fbf 75%, #4f5bd5)',
              boxShadow: '0 0 14px rgba(255,200,80,0.5), inset 0 0 8px rgba(255,255,255,0.2)',
              transform: `translateY(${iconY3}px)`,
            }}
          >
            ◎
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeOutroPremiumGold;
// END_OF_FILE