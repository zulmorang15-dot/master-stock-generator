import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic Bokeh Generation (Avoids Math.random during render)
const BOKEH_COLORS = ['#ff7a3c', '#ff4d8d', '#3ca0ff', '#ffd23c', '#7d5cff', '#3cffb0', '#ff5c5c', '#5ce1ff'];
const BOKEH_DURATIONS = [4, 5, 10]; // All must divide the total 20s duration seamlessly

const BOKEHS = Array.from({ length: 80 }, (_, i) => {
  const seed1 = Math.sin(i * 12.9898) * 43758.5453;
  const seed2 = Math.cos(i * 78.233) * 43758.5453;
  const r1 = seed1 - Math.floor(seed1);
  const r2 = seed2 - Math.floor(seed2);
  const r3 = ((seed1 + seed2) - Math.floor(seed1 + seed2));

  const size = r1 * 16 + 4; // 4px to 20px
  const color = BOKEH_COLORS[Math.floor(r2 * BOKEH_COLORS.length)];
  const left = r3 * 100;
  const top = r1 * 100;
  const opacity = r2 * 0.5 + 0.3;
  const duration = BOKEH_DURATIONS[Math.floor(r3 * BOKEH_DURATIONS.length)];
  const delay = r1 * duration;

  return { id: i, size, color, left, top, opacity, duration, delay };
});

// Deterministic Sparkles
const SPARKLES = Array.from({ length: 40 }, (_, i) => {
  const seed1 = Math.sin(i * 45.98) * 12345.67;
  const seed2 = Math.cos(i * 98.23) * 54321.12;
  const r1 = seed1 - Math.floor(seed1);
  const r2 = seed2 - Math.floor(seed2);

  const left = r1 * 100;
  const top = r2 * 100;
  const duration = [2, 4, 5][Math.floor(r1 * 3)];
  const delay = r2 * duration;

  return { id: i, left, top, duration, delay };
});

// Deterministic Emojis
const EMOJI_LIST = ['👍', '❤️', '🔔', '➡️', '💬', '🔥', '⭐', '😍', '👏', '🎉', '📺', '💙', '✨', '🚀'];
const EMOJIS = Array.from({ length: 32 }, (_, i) => {
  const seed1 = Math.sin(i * 89.23) * 98765.43;
  const seed2 = Math.cos(i * 23.45) * 12345.67;
  const r1 = seed1 - Math.floor(seed1);
  const r2 = seed2 - Math.floor(seed2);

  const emoji = EMOJI_LIST[Math.floor(r1 * EMOJI_LIST.length)];
  const left = r2 * 100;
  const fontSize = r1 * 1.6 + 1.4; // 1.4vw to 3.0vw scale
  const duration = [5, 10][Math.floor(r2 * 2)];
  const delay = r1 * duration;

  return { id: i, emoji, left, fontSize, duration, delay };
});

const PremiumBokehOutro: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // ===== LOOPING PARAMETERS =====
  // 10s cycle for main structural elements to perfectly loop within the 20s total duration
  const mainCycleFrames = fps * 10; 
  const cycleFrame = frame % mainCycleFrames;
  const cycleProgress = cycleFrame / mainCycleFrames;

  // ===== AURORA BERGERAK (Loop perfectly over 20s) =====
  const auroraRotate = interpolate(frame % (fps * 20), [0, fps * 20], [0, 360]);

  // ===== CENTER GLOW PULSE (Loop perfectly over 5s) =====
  const glowProgress = (frame % (fps * 5)) / (fps * 5);
  const glowScale = interpolate(glowProgress, [0, 0.5, 1], [1, 1.12, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  const glowOpacity = interpolate(glowProgress, [0, 0.5, 1], [0.55, 1, 0.55], {
    easing: Easing.inOut(Easing.quad),
  });

  // ===== GLASSMORPHISM BOX SWEEP (Loop perfectly over 5s) =====
  const sweepProgress = (frame % (fps * 5)) / (fps * 5);
  const sweepLeft = interpolate(sweepProgress, [0, 0.55, 0.80, 1], [-120, -120, 220, 220]);

  // ===== LEFT BOX ANIMATION PROGRESS (popLeft mirror) =====
  const { leftBoxX, leftBoxScale, leftBoxRotate, leftBoxOpacity } = useMemo(() => {
    let x = -70;
    let scale = 0.6;
    let rotate = -6;
    let opacity = 0;

    if (cycleProgress < 0.10) {
      const t = cycleProgress / 0.10;
      const eased = Easing.bezier(0.34, 1.56, 0.64, 1)(t);
      x = interpolate(eased, [0, 1], [-70, 0]);
      scale = interpolate(eased, [0, 1], [0.6, 1]);
      rotate = interpolate(eased, [0, 1], [-6, 0]);
      opacity = interpolate(eased, [0, 1], [0, 1]);
    } else if (cycleProgress < 0.88) {
      x = 0;
      scale = 1;
      rotate = 0;
      opacity = 1;
    } else if (cycleProgress < 0.96) {
      const t = (cycleProgress - 0.88) / 0.08;
      const eased = Easing.bezier(0.34, 1.56, 0.64, 1)(t);
      x = interpolate(eased, [0, 1], [0, -70]);
      scale = interpolate(eased, [0, 1], [1, 0.6]);
      rotate = interpolate(eased, [0, 1], [0, -6]);
      opacity = interpolate(eased, [0, 1], [1, 0]);
    } else {
      x = -70;
      scale = 0.6;
      rotate = -6;
      opacity = 0;
    }

    return { leftBoxX: x, leftBoxScale: scale, leftBoxRotate: rotate, leftBoxOpacity: opacity };
  }, [cycleProgress]);

  // ===== RIGHT BOX ANIMATION PROGRESS (popRight mirror) =====
  const { rightBoxX, rightBoxScale, rightBoxRotate, rightBoxOpacity } = useMemo(() => {
    let x = 70;
    let scale = 0.6;
    let rotate = 6;
    let opacity = 0;

    if (cycleProgress < 0.10) {
      const t = cycleProgress / 0.10;
      const eased = Easing.bezier(0.34, 1.56, 0.64, 1)(t);
      x = interpolate(eased, [0, 1], [70, 0]);
      scale = interpolate(eased, [0, 1], [0.6, 1]);
      rotate = interpolate(eased, [0, 1], [6, 0]);
      opacity = interpolate(eased, [0, 1], [0, 1]);
    } else if (cycleProgress < 0.88) {
      x = 0;
      scale = 1;
      rotate = 0;
      opacity = 1;
    } else if (cycleProgress < 0.96) {
      const t = (cycleProgress - 0.88) / 0.08;
      const eased = Easing.bezier(0.34, 1.56, 0.64, 1)(t);
      x = interpolate(eased, [0, 1], [0, 70]);
      scale = interpolate(eased, [0, 1], [1, 0.6]);
      rotate = interpolate(eased, [0, 1], [0, 6]);
      opacity = interpolate(eased, [0, 1], [1, 0]);
    } else {
      x = 70;
      scale = 0.6;
      rotate = 6;
      opacity = 0;
    }

    return { rightBoxX: x, rightBoxScale: scale, rightBoxRotate: rotate, rightBoxOpacity: opacity };
  }, [cycleProgress]);

  // ===== CENTRAL CIRCLE ANIMATION PROGRESS (circlePop mirror) =====
  const { circleScale, circleRotate, circleOpacity } = useMemo(() => {
    let scale = 0;
    let rotate = -120;
    let opacity = 0;

    if (cycleProgress < 0.12) {
      const t = cycleProgress / 0.12;
      const eased = Easing.bezier(0.34, 1.56, 0.64, 1)(t);
      scale = interpolate(eased, [0, 1], [0, 1.15]);
      rotate = interpolate(eased, [0, 1], [-120, 0]);
      opacity = interpolate(eased, [0, 1], [0, 1]);
    } else if (cycleProgress < 0.18) {
      const t = (cycleProgress - 0.12) / 0.06;
      scale = interpolate(t, [0, 1], [1.15, 1]);
      rotate = 0;
      opacity = 1;
    } else if (cycleProgress < 0.88) {
      scale = 1;
      rotate = 0;
      opacity = 1;
    } else if (cycleProgress < 0.96) {
      const t = (cycleProgress - 0.88) / 0.08;
      scale = interpolate(t, [0, 1], [1, 0]);
      rotate = interpolate(t, [0, 1], [0, 120]);
      opacity = interpolate(t, [0, 1], [1, 0]);
    } else {
      scale = 0;
      rotate = 120;
      opacity = 0;
    }

    return { circleScale: scale, circleRotate: rotate, circleOpacity: opacity };
  }, [cycleProgress]);

  // ===== PLAY BUTTON PULSE =====
  const playProgress = (frame % (fps * 2)) / (fps * 2);
  const playScale = interpolate(playProgress, [0, 0.5, 1], [1, 1.18, 1], {
    easing: Easing.inOut(Easing.quad),
  });

  // ===== RING PULSES (Before & After rings) =====
  const ring1Progress = (frame % (fps * 2)) / (fps * 2);
  const ring1Scale = interpolate(ring1Progress, [0, 1], [1, 1.45]);
  const ring1Opacity = interpolate(ring1Progress, [0, 1], [0.8, 0]);

  const ring2Progress = ((frame + fps * 1) % (fps * 2)) / (fps * 2);
  const ring2Scale = interpolate(ring2Progress, [0, 1], [1, 1.45]);
  const ring2Opacity = interpolate(ring2Progress, [0, 1], [0.8, 0]);

  // ===== SUBSCRIBE TEXT ANIMATION =====
  const textShineX = interpolate(frame % (fps * 4), [0, fps * 4], [0, 300]);
  const { textOpacity, textY } = useMemo(() => {
    let opacity = 0;
    let y = -25;

    if (cycleProgress < 0.14) {
      opacity = 0;
      y = -25;
    } else if (cycleProgress < 0.24) {
      const t = (cycleProgress - 0.14) / 0.10;
      const eased = Easing.out(Easing.quad)(t);
      opacity = interpolate(eased, [0, 1], [0, 1]);
      y = interpolate(eased, [0, 1], [-25, 0]);
    } else if (cycleProgress < 0.88) {
      opacity = 1;
      y = 0;
    } else if (cycleProgress < 0.96) {
      const t = (cycleProgress - 0.88) / 0.08;
      const eased = Easing.in(Easing.quad)(t);
      opacity = interpolate(eased, [0, 1], [1, 0]);
      y = interpolate(eased, [0, 1], [0, -25]);
    } else {
      opacity = 0;
      y = -25;
    }

    return { textOpacity: opacity, textY: y };
  }, [cycleProgress]);

  // ===== BOTTOM ICONS RISE =====
  const { bottomOpacity, bottomY } = useMemo(() => {
    let opacity = 0;
    let y = 45;

    if (cycleProgress < 0.20) {
      opacity = 0;
      y = 45;
    } else if (cycleProgress < 0.32) {
      const t = (cycleProgress - 0.20) / 0.12;
      const eased = Easing.out(Easing.quad)(t);
      opacity = interpolate(eased, [0, 1], [0, 1]);
      y = interpolate(eased, [0, 1], [45, 0]);
    } else if (cycleProgress < 0.88) {
      opacity = 1;
      y = 0;
    } else if (cycleProgress < 0.96) {
      const t = (cycleProgress - 0.88) / 0.08;
      const eased = Easing.in(Easing.quad)(t);
      opacity = interpolate(eased, [0, 1], [1, 0]);
      y = interpolate(eased, [0, 1], [0, 45]);
    } else {
      opacity = 0;
      y = 45;
    }

    return { bottomOpacity: opacity, bottomY: y };
  }, [cycleProgress]);

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
        background: '#000',
        fontFamily: "'Poppins', 'Segoe UI', 'Arial', sans-serif",
      }}
    >
      {/* Outer Scene Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(ellipse at 30% 20%, #2a1a5e 0%, transparent 55%),
            radial-gradient(ellipse at 75% 80%, #0d4a6e 0%, transparent 55%),
            radial-gradient(ellipse at 50% 45%, #1e3a6e 0%, #112347 45%, #0a1530 75%, #03060f 100%)
          `,
        }}
      >
        {/* Aurora Layer */}
        <div
          style={{
            position: 'absolute',
            inset: '-20%',
            background: `conic-gradient(from 0deg at 50% 50%,
              rgba(60,160,255,0.12),
              rgba(125,92,255,0.12),
              rgba(255,77,141,0.12),
              rgba(60,255,176,0.12),
              rgba(60,160,255,0.12))`,
            filter: 'blur(60px)',
            transform: `rotate(${auroraRotate}deg) scale(1.1)`,
          }}
        />

        {/* Center Glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '75%',
            height: '85%',
            transform: `translate(-50%,-50%) scale(${glowScale})`,
            background: 'radial-gradient(ellipse at center, rgba(80,150,255,0.4), transparent 65%)',
            opacity: glowOpacity,
          }}
        />

        {/* Bokeh Container */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {BOKEHS.map((b) => {
            const pFrame = (frame + b.delay * fps) % (b.duration * fps);
            const pProgress = pFrame / (b.duration * fps);

            const yTranslation = interpolate(pProgress, [0, 1], [0, -160]);
            const scale = interpolate(pProgress, [0, 1], [0.4, 1.2]);
            const opacity = interpolate(pProgress, [0, 0.15, 0.85, 1], [0, b.opacity, b.opacity, 0]);

            return (
              <div
                key={b.id}
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  filter: 'blur(1px)',
                  mixBlendMode: 'screen',
                  width: b.size,
                  height: b.size,
                  background: b.color,
                  boxShadow: `0 0 ${b.size * 1.5}px ${b.color}`,
                  left: `${b.left}%`,
                  top: `${b.top}%`,
                  opacity,
                  transform: `translateY(${yTranslation}px) scale(${scale})`,
                }}
              />
            );
          })}
        </div>

        {/* Sparkles Layer */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {SPARKLES.map((s) => {
            const sFrame = (frame + s.delay * fps) % (s.duration * fps);
            const sProgress = sFrame / (s.duration * fps);

            const opacity = interpolate(sProgress, [0, 0.5, 1], [0, 1, 0]);
            const scale = interpolate(sProgress, [0, 0.5, 1], [0.5, 1.4, 0.5]);

            return (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  width: 3,
                  height: 3,
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.9)',
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  opacity,
                  transform: `scale(${scale})`,
                }}
              />
            );
          })}
        </div>

        {/* Emojis Layer */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {EMOJIS.map((e) => {
            const eFrame = (frame + e.delay * fps) % (e.duration * fps);
            const eProgress = eFrame / (e.duration * fps);

            const opacity = interpolate(eProgress, [0, 0.12, 0.88, 1], [0, 0.95, 0.95, 0]);
            const translateY = interpolate(eProgress, [0, 0.12, 0.5, 1], [30, 0, -432, -1026]);
            const rotate = interpolate(eProgress, [0, 0.5, 1], [-12, 12, -10]);
            const scale = interpolate(eProgress, [0, 0.12, 0.5, 1], [0.5, 1, 1.05, 0.7]);

            return (
              <div
                key={e.id}
                style={{
                  position: 'absolute',
                  left: `${e.left}%`,
                  bottom: '-5%',
                  fontSize: `${e.fontSize}vw`,
                  opacity,
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))',
                  transform: `translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                }}
              >
                {e.emoji}
              </div>
            );
          })}
        </div>

        {/* SUBSCRIBE Text */}
        <div
          style={{
            position: 'absolute',
            top: '16%',
            left: '50%',
            transform: `translateX(-50%) translateY(${textY}px)`,
            fontSize: '2.4vw',
            fontWeight: 800,
            letterSpacing: '2px',
            background: 'linear-gradient(90deg, #ff4d8d, #ffd23c, #3ca0ff, #7d5cff, #ff4d8d)',
            backgroundSize: '300% auto',
            backgroundPosition: `${textShineX}% center`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 25px rgba(255,255,255,0.15)',
            opacity: textOpacity,
          }}
        >
          SUBSCRIBE NOW
        </div>

        {/* Video Box Left */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '6%',
            width: '26%',
            height: '37%',
            transform: `translateY(-50%) translateX(${leftBoxX}px) scale(${leftBoxScale}) rotate(${leftBoxRotate}deg)`,
            opacity: leftBoxOpacity,
            background: 'linear-gradient(145deg, rgba(220,235,255,0.18), rgba(120,160,255,0.08))',
            backdropFilter: 'blur(4px)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            borderRadius: '14px',
            boxShadow: '0 0 30px rgba(120,180,255,0.5), 0 10px 45px rgba(0,0,0,0.55), inset 0 0 30px rgba(150,200,255,0.15)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '1vw',
              fontWeight: 600,
              letterSpacing: '1px',
              textShadow: '0 0 10px rgba(120,180,255,0.8)',
              zIndex: 2,
            }}
          >
            ▶ VIDEO 1
          </span>
          <div
            style={{
              content: "''",
              position: 'absolute',
              top: 0,
              left: `${sweepLeft}%`,
              width: '55%',
              height: '100%',
              background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent)',
              transform: 'skewX(-20deg)',
            }}
          />
        </div>

        {/* Video Box Right */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '6%',
            width: '26%',
            height: '37%',
            transform: `translateY(-50%) translateX(${rightBoxX}px) scale(${rightBoxScale}) rotate(${rightBoxRotate}deg)`,
            opacity: rightBoxOpacity,
            background: 'linear-gradient(145deg, rgba(220,235,255,0.18), rgba(120,160,255,0.08))',
            backdropFilter: 'blur(4px)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            borderRadius: '14px',
            boxShadow: '0 0 30px rgba(120,180,255,0.5), 0 10px 45px rgba(0,0,0,0.55), inset 0 0 30px rgba(150,200,255,0.15)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '1vw',
              fontWeight: 600,
              letterSpacing: '1px',
              textShadow: '0 0 10px rgba(120,180,255,0.8)',
              zIndex: 2,
            }}
          >
            ▶ VIDEO 2
          </span>
          <div
            style={{
              content: "''",
              position: 'absolute',
              top: 0,
              left: `${sweepLeft}%`,
              width: '55%',
              height: '100%',
              background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent)',
              transform: 'skewX(-20deg)',
            }}
          />
        </div>

        {/* Center Circle with pulsing play and concentric rings */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '14%',
            aspectRatio: '1',
            transform: `translate(-50%,-50%) scale(${circleScale}) rotate(${circleRotate}deg)`,
            background: 'radial-gradient(circle at 38% 32%, #ffffff, #e8f1ff 55%, #b5d2ff 100%)',
            borderRadius: '50%',
            boxShadow: '0 0 0 4px rgba(255,255,255,0.85), 0 0 45px rgba(140,190,255,0.9), 0 8px 35px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: circleOpacity,
          }}
        >
          {/* Ring 1 (Concentric Pulse) */}
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.55)',
              transform: `scale(${ring1Scale})`,
              opacity: ring1Opacity,
            }}
          />
          {/* Ring 2 (Concentric Pulse Delayed) */}
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              border: '2px solid rgba(120,190,255,0.5)',
              transform: `scale(${ring2Scale})`,
              opacity: ring2Opacity,
            }}
          />
          {/* Play Icon */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '1.7vw solid #ff2d2d',
              borderTop: '1.05vw solid transparent',
              borderBottom: '1.05vw solid transparent',
              marginLeft: '0.45vw',
              filter: 'drop-shadow(0 0 10px rgba(255,60,60,0.7))',
              transform: `scale(${playScale})`,
            }}
          />
        </div>

        {/* Bottom Social Icons */}
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            left: '50%',
            transform: `translateX(-50%) translateY(${bottomY}px)`,
            display: 'flex',
            gap: '1.8vw',
            fontSize: '2.4vw',
            opacity: bottomOpacity,
          }}
        >
          {['👍', '🔔', '➡️', '❤️'].map((ico, idx) => {
            const bounceDelay = idx * 0.15;
            const iconFrame = (frame + bounceDelay * fps) % (fps * 2);
            const iconProgress = iconFrame / (fps * 2);
            const iconY = interpolate(iconProgress, [0, 0.5, 1], [0, -10, 0], {
              easing: Easing.inOut(Easing.quad),
            });
            const iconScale = interpolate(iconProgress, [0, 0.5, 1], [1, 1.15, 1], {
              easing: Easing.inOut(Easing.quad),
            });

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))',
                  transform: `translateY(${iconY}px) scale(${iconScale})`,
                }}
              >
                {ico}
              </span>
            );
          })}
        </div>

        {/* Vignette Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default PremiumBokehOutro;
// END_OF_FILE