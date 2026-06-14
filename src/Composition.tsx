import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const COLORS = ['#ff7a3c', '#ff4d8d', '#3ca0ff', '#ffd23c', '#7d5cff', '#3cffb0', '#ff5c5c', '#5ce1ff'];
const EMOJIS = ['👍', '❤️', '🔔', '➡️', '💬', '🔥', '⭐', '😍', '👏', '🎉', '📺', '💙', '✨', '🚀'];

const seedRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const BOKEH_DATA = Array.from({ length: 80 }).map((_, i) => {
  const r1 = seedRandom(i * 7 + 12);
  const r2 = seedRandom(i * 13 + 34);
  const r3 = seedRandom(i * 29 + 56);
  const r4 = seedRandom(i * 41 + 78);
  const r5 = seedRandom(i * 53 + 90);
  const r6 = seedRandom(i * 67 + 123);

  const size = r1 * 16 + 4;
  const color = COLORS[Math.floor(r2 * COLORS.length)];
  const left = r3 * 100;
  const top = r4 * 100;
  const opacity = r5 * 0.5 + 0.3;
  const duration = Math.floor((r6 * 6 + 5) * 60);
  const delay = Math.floor(seedRandom(i * 73 + 456) * duration);

  return { size, color, left, top, opacity, duration, delay };
});

const SPARKLE_DATA = Array.from({ length: 40 }).map((_, i) => {
  const r1 = seedRandom(i * 11 + 500);
  const r2 = seedRandom(i * 17 + 600);
  const r3 = seedRandom(i * 23 + 700);
  const r4 = seedRandom(i * 31 + 800);

  const left = r1 * 100;
  const top = r2 * 100;
  const duration = Math.floor((r3 * 3 + 1.5) * 60);
  const delay = Math.floor(r4 * duration);

  return { left, top, duration, delay };
});

const EMOJI_DATA = Array.from({ length: 32 }).map((_, i) => {
  const r1 = seedRandom(i * 19 + 1000);
  const r2 = seedRandom(i * 29 + 1100);
  const r3 = seedRandom(i * 37 + 1200);
  const r4 = seedRandom(i * 47 + 1300);

  const emoji = EMOJIS[Math.floor(r1 * EMOJIS.length)];
  const left = r2 * 100;
  const size = r3 * 1.6 + 1.4;
  const duration = Math.floor((r4 * 6 + 7) * 60);
  const delay = Math.floor(seedRandom(i * 59 + 1400) * duration);

  return { emoji, left, size, duration, delay };
});

const popEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

export const PremiumYoutubeOutro: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const loopFrame = frame % 1200;

  const auroraRotation = interpolate(loopFrame, [0, 1200], [0, 360]);

  const glowFrame = loopFrame % 300;
  const glowScale = interpolate(glowFrame, [0, 150, 300], [1, 1.12, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  const glowOpacity = interpolate(glowFrame, [0, 150, 300], [0.55, 1, 0.55], {
    easing: Easing.inOut(Easing.quad),
  });

  const textOpacity = interpolate(loopFrame, [0, 168, 288, 1056, 1152, 1200], [0, 0, 1, 1, 0, 0]);
  const textTranslateY = interpolate(loopFrame, [0, 168, 288, 1056, 1152, 1200], [-25, -25, 0, 0, -25, -25], {
    easing: Easing.out(Easing.quad),
  });
  const textBgPos = interpolate(loopFrame, [0, 1200], [0, 300]);

  const boxOpacity = interpolate(loopFrame, [0, 120, 1056, 1152, 1200], [0, 1, 1, 0, 0]);
  const boxScale = interpolate(loopFrame, [0, 120, 1056, 1152, 1200], [0.6, 1, 1, 0.6, 0.6], {
    easing: popEasing,
  });

  const boxLeftTranslateX = interpolate(loopFrame, [0, 120, 1056, 1152, 1200], [-70, 0, 0, -70, -70], {
    easing: popEasing,
  });
  const boxLeftRotate = interpolate(loopFrame, [0, 120, 1056, 1152, 1200], [-6, 0, 0, -6, -6], {
    easing: popEasing,
  });

  const boxRightTranslateX = interpolate(loopFrame, [0, 120, 1056, 1152, 1200], [70, 0, 0, 70, 70], {
    easing: popEasing,
  });
  const boxRightRotate = interpolate(loopFrame, [0, 120, 1056, 1152, 1200],  [6, 0, 0, 6, 6], {
    easing: popEasing,
  });

  const sweepFrame = loopFrame % 300;
  const sweepLeft = interpolate(sweepFrame, [0, 165, 240, 300], [-120, -120, 220, 220]);

  const centerCircleOpacity = interpolate(loopFrame, [0, 144, 1056, 1152, 1200], [0, 1, 1, 0, 0]);
  const centerCircleScale = interpolate(loopFrame, [0, 144, 216, 1056, 1152, 1200], [0, 1.15, 1, 1, 0, 0], {
    easing: popEasing,
  });
  const centerCircleRotate = interpolate(loopFrame, [0, 144, 1056, 1152, 1200], [-120, 0, 0, 120, 120], {
    easing: popEasing,
  });

  const ring1Frame = loopFrame % 120;
  const ring1Scale = interpolate(ring1Frame, [0, 120], [1, 1.45], { easing: Easing.inOut(Easing.quad) });
  const ring1Opacity = interpolate(ring1Frame, [0, 120], [0.8, 0], { easing: Easing.inOut(Easing.quad) });

  const ring2Frame = (loopFrame + 60) % 120;
  const ring2Scale = interpolate(ring2Frame, [0, 120], [1, 1.45], { easing: Easing.inOut(Easing.quad) });
  const ring2Opacity = interpolate(ring2Frame, [0, 120], [0.5, 0], { easing: Easing.inOut(Easing.quad) });

  const playPulseFrame = loopFrame % 75;
  const playButtonScale = interpolate(playPulseFrame, [0, 37.5, 75], [1, 1.18, 1], {
    easing: Easing.inOut(Easing.quad),
  });

  const bottomRiseOpacity = interpolate(loopFrame, [0, 240, 384, 1056, 1152, 1200], [0, 0, 1, 1, 0, 0]);
  const bottomRiseTranslateY = interpolate(loopFrame, [0, 240, 384, 1056, 1152, 1200], [45, 45, 0, 0, 45, 45], {
    easing: Easing.out(Easing.quad),
  });

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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: `
            radial-gradient(ellipse at 30% 20%, #2a1a5e 0%, transparent 55%),
            radial-gradient(ellipse at 75% 80%, #0d4a6e 0%, transparent 55%),
            radial-gradient(ellipse at 50% 45%, #1e3a6e 0%, #112347 45%, #0a1530 75%, #03060f 100%)
          `,
        }}
      >
        {/* AURORA BERGERAK */}
        <div
          style={{
            position: 'absolute',
            inset: '-20%',
            background: `
              conic-gradient(from 0deg at 50% 50%,
                rgba(60,160,255,0.12),
                rgba(125,92,255,0.12),
                rgba(255,77,141,0.12),
                rgba(60,255,176,0.12),
                rgba(60,160,255,0.12))
            `,
            filter: 'blur(60px)',
            transform: `rotate(${auroraRotation}deg) scale(1.1)`,
          }}
        />

        {/* Glow tengah */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '75%',
            height: '85%',
            transform: `translate(-50%, -50%) scale(${glowScale})`,
            background: 'radial-gradient(ellipse at center, rgba(80,150,255,0.4), transparent 65%)',
            opacity: glowOpacity,
          }}
        />

        {/* BOKEH */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
          }}
        >
          {BOKEH_DATA.map((item, idx) => {
            const pFrame = (loopFrame + item.delay) % item.duration;
            const yOffset = interpolate(pFrame, [0, item.duration], [0, -160]);
            const scale = interpolate(pFrame, [0, item.duration], [0.4, 1.2]);
            const opacity = interpolate(
              pFrame,
              [0, item.duration * 0.15, item.duration * 0.85, item.duration],
              [0, item.opacity, item.opacity, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            return (
              <div
                key={`bokeh-${idx}`}
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  filter: 'blur(1px)',
                  mixBlendMode: 'screen',
                  width: item.size,
                  height: item.size,
                  background: item.color,
                  boxShadow: `0 0 ${item.size * 1.5}px ${item.color}`,
                  left: `${item.left}%`,
                  top: `${item.top}%`,
                  opacity,
                  transform: `translateY(${yOffset}px) scale(${scale})`,
                }}
              />
            );
          })}

          {/* SPARKLES */}
          {SPARKLE_DATA.map((item, idx) => {
            const sFrame = (loopFrame + item.delay) % item.duration;
            const scale = interpolate(sFrame, [0, item.duration * 0.5, item.duration], [0.5, 1.4, 0.5], {
              easing: Easing.inOut(Easing.quad),
            });
            const opacity = interpolate(sFrame, [0, item.duration * 0.5, item.duration], [0, 1, 0], {
              easing: Easing.inOut(Easing.quad),
            });

            return (
              <div
                key={`sparkle-${idx}`}
                style={{
                  position: 'absolute',
                  width: '3px',
                  height: '3px',
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px 2px rgba(255,255,255,0.9)',
                  left: `${item.left}%`,
                  top: `${item.top}%`,
                  opacity,
                  transform: `scale(${scale})`,
                }}
              />
            );
          })}
        </div>

        {/* EMOJI LAYER */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {EMOJI_DATA.map((item, idx) => {
            const eFrame = (loopFrame + item.delay) % item.duration;
            const translateY = interpolate(
              eFrame,
              [0, item.duration * 0.12, item.duration * 0.5, item.duration],
              [30, 0, -432, -1026]
            );
            const scale = interpolate(
              eFrame,
              [0, item.duration * 0.12, item.duration * 0.5, item.duration],
              [0.5, 1, 1.05, 0.7]
            );
            const rotate = interpolate(
              eFrame,
              [0, item.duration * 0.12, item.duration * 0.5, item.duration],
              [-12, 0, 12, -10]
            );
            const opacity = interpolate(
              eFrame,
              [0, item.duration * 0.12, item.duration * 0.88, item.duration],
              [0, 0.95, 0.95, 0]
            );

            return (
              <div
                key={`emoji-${idx}`}
                style={{
                  position: 'absolute',
                  fontSize: `${item.size}vw`,
                  left: `${item.left}%`,
                  bottom: '-5%',
                  opacity,
                  transform: `translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))',
                }}
              >
                {item.emoji}
              </div>
            );
          })}
        </div>

        {/* SUBSCRIBE TEXT */}
        <div
          style={{
            position: 'absolute',
            top: '16%',
            left: '50%',
            transform: `translateX(-50%) translateY(${textTranslateY}px)`,
            opacity: textOpacity,
            fontSize: '46.08px',
            fontWeight: 800,
            letterSpacing: '2px',
            background: 'linear-gradient(90deg, #ff4d8d, #ffd23c, #3ca0ff, #7d5cff, #ff4d8d)',
            backgroundSize: '300% auto',
            backgroundPosition: `${textBgPos}% center`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 25px rgba(255,255,255,0.15)',
          }}
        >
          SUBSCRIBE NOW
        </div>

        {/* VIDEO BOX LEFT */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '115.2px',
            width: '499.2px',
            height: '399.6px',
            background: 'linear-gradient(145deg, rgba(220,235,255,0.18), rgba(120,160,255,0.08))',
            backdropFilter: 'blur(4px)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            borderRadius: '14px',
            boxShadow:
              '0 0 30px rgba(120,180,255,0.5), 0 10px 45px rgba(0,0,0,0.55), inset 0 0 30px rgba(150,200,255,0.15)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: boxOpacity,
            transform: `translateY(-50%) translateX(${boxLeftTranslateX}px) scale(${boxScale}) rotate(${boxLeftRotate}deg)`,
            transformOrigin: 'center center',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '19.2px',
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

        {/* VIDEO BOX RIGHT */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '115.2px',
            width: '499.2px',
            height: '399.6px',
            background: 'linear-gradient(145deg, rgba(220,235,255,0.18), rgba(120,160,255,0.08))',
            backdropFilter: 'blur(4px)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            borderRadius: '14px',
            boxShadow:
              '0 0 30px rgba(120,180,255,0.5), 0 10px 45px rgba(0,0,0,0.55), inset 0 0 30px rgba(150,200,255,0.15)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: boxOpacity,
            transform: `translateY(-50%) translateX(${boxRightTranslateX}px) scale(${boxScale}) rotate(${boxRightRotate}deg)`,
            transformOrigin: 'center center',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '19.2px',
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

        {/* CENTER PLAY BUTTON CIRCLE */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '268.8px',
            height: '268.8px',
            transform: `translate(-50%, -50%) scale(${centerCircleScale}) rotate(${centerCircleRotate}deg)`,
            opacity: centerCircleOpacity,
            background: 'radial-gradient(circle at 38% 32%, #ffffff, #e8f1ff 55%, #b5d2ff 100%)',
            borderRadius: '50%',
            boxShadow:
              '0 0 0 4px rgba(255,255,255,0.85), 0 0 45px rgba(140,190,255,0.9), 0 8px 35px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer Pulse Rings */}
          <div
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.55)',
              transform: `scale(${ring1Scale})`,
              opacity: ring1Opacity,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              border: '2px solid rgba(120,190,255,0.5)',
              transform: `scale(${ring2Scale})`,
              opacity: ring2Opacity,
            }}
          />

          {/* YT Play Triangle */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '32.64px solid #ff2d2d',
              borderTop: '20.16px solid transparent',
              borderBottom: '20.16px solid transparent',
              marginLeft: '8.64px',
              filter: 'drop-shadow(0 0 10px rgba(255,60,60,0.7))',
              transform: `scale(${playButtonScale})`,
            }}
          />
        </div>

        {/* BOTTOM ICONS ROW */}
        <div
          style={{
            position: 'absolute',
            bottom: '64.8px',
            left: '50%',
            transform: `translateX(-50%) translateY(${bottomRiseTranslateY}px)`,
            opacity: bottomRiseOpacity,
            display: 'flex',
            gap: '34.56px',
            fontSize: '46.08px',
          }}
        >
          {['👍', '🔔', '➡️', '❤️'].map((icon, i) => {
            const bounceFrame = (loopFrame + i * 9) % 120;
            const iconY = interpolate(bounceFrame, [0, 60, 120], [0, -10, 0], {
              easing: Easing.inOut(Easing.quad),
            });
            const iconScale = interpolate(bounceFrame, [0, 60, 120], [1, 1.15, 1], {
              easing: Easing.inOut(Easing.quad),
            });

            return (
              <span
                key={`icon-${i}`}
                style={{
                  display: 'inline-block',
                  transform: `translateY(${iconY}px) scale(${iconScale})`,
                  filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))',
                }}
              >
                {icon}
              </span>
            );
          })}
        </div>

        {/* VIGNETTE */}
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

export default PremiumYoutubeOutro;
// END_OF_FILE