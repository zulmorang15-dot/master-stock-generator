import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic Sparkles properties pre-calculated outside render to avoid Math.random()
const SPARKLES = [
  { id: 1, top: '15%', left: '22%', delay: 12, duration: 60 },
  { id: 2, top: '45%', left: '8%', delay: 45, duration: 55 },
  { id: 3, top: '78%', left: '33%', delay: 5, duration: 62 },
  { id: 4, top: '23%', left: '67%', delay: 28, duration: 50 },
  { id: 5, top: '60%', left: '85%', delay: 18, duration: 58 },
  { id: 6, top: '88%', left: '12%', delay: 33, duration: 48 },
  { id: 7, top: '10%', left: '50%', delay: 50, duration: 65 },
  { id: 8, top: '35%', left: '92%', delay: 8, duration: 52 },
  { id: 9, top: '52%', left: '48%', delay: 22, duration: 60 },
  { id: 10, top: '82%', left: '70%', delay: 40, duration: 54 },
  { id: 11, top: '28%', left: '15%', delay: 15, duration: 56 },
  { id: 12, top: '68%', left: '25%', delay: 30, duration: 64 },
  { id: 13, top: '12%', left: '80%', delay: 2, duration: 50 },
  { id: 14, top: '90%', left: '55%', delay: 25, duration: 58 },
  { id: 15, top: '40%', left: '38%', delay: 37, duration: 62 },
  { id: 16, top: '74%', left: '95%', delay: 11, duration: 46 },
  { id: 17, top: '5%', left: '30%', delay: 48, duration: 55 },
  { id: 18, top: '58%', left: '3%', delay: 20, duration: 50 },
  { id: 19, top: '32%', left: '58%', delay: 35, duration: 60 },
  { id: 20, top: '85%', left: '42%', delay: 14, duration: 66 },
  { id: 21, top: '20%', left: '45%', delay: 29, duration: 52 },
  { id: 22, top: '63%', left: '77%', delay: 42, duration: 57 },
  { id: 23, top: '95%', left: '88%', delay: 7, duration: 61 },
  { id: 24, top: '48%', left: '62%', delay: 53, duration: 49 },
  { id: 25, top: '18%', left: '97%', delay: 1, duration: 63 }
];

const bgWords = "SUBSCRIBE TO MY CHANNEL! ";
const repeatedBgLine = bgWords.repeat(8);
const tapeText = "SUBSCRIBE TO MY CHANNEL! ";

export const DiagonalTapeOutro: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Scene Background Shift: Loop 20s (600 frames) symmetrically
  const bgPos = interpolate(
    frame,
    [0, 300, 600],
    [0, 100, 0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const backgroundPosition = `${bgPos}% ${bgPos}%`;

  // 2. Samar Background Text Opacity & Translation Loop
  const bgTextOpacity = interpolate(
    frame % 150,
    [0, 75, 150],
    [0.10, 0.18, 0.10],
    { easing: Easing.inOut(Easing.quad) }
  );

  const bgTextScroll = interpolate(
    frame,
    [0, 300, 600],
    [0, -200, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  // 3. Diagonal Tapes Sliding Transitions
  const getTapeTransition = (frame: number, delay: number) => {
    const entranceStart = delay;
    const entranceEnd = delay + 25;
    const exitStart = 575 - (21 - delay);
    const exitEnd = 600 - (21 - delay);

    let opacity = 0;
    let translateX = -60;

    if (frame >= entranceStart && frame < exitStart) {
      opacity = interpolate(frame, [entranceStart, entranceEnd], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      });
      translateX = interpolate(frame, [entranceStart, entranceEnd], [-60, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      });
    } else if (frame >= exitStart) {
      opacity = interpolate(frame, [exitStart, exitEnd], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.in(Easing.quad),
      });
      translateX = interpolate(frame, [exitStart, exitEnd], [0, -60], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.in(Easing.quad),
      });
    }

    return { opacity, transform: `translateX(${translateX}px)` };
  };

  // 4. Diagonal Tapes Scroll Movements (Loop seamlessly every 300 frames)
  const scrollPercent = interpolate(frame % 300, [0, 300], [0, -50]);
  const scrollPercentRev = interpolate(frame % 300, [0, 300], [-50, 0]);

  // 5. Circle Life, Float and Glow animations (Seamlessly Symmetrical)
  const circleLifeProgress = () => {
    if (frame < 45) {
      return interpolate(frame, [15, 45], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      });
    } else if (frame > 555) {
      return interpolate(frame, [555, 585], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.in(Easing.quad),
      });
    }
    return 1;
  };

  const circleScale = circleLifeProgress();

  const floatFrame = frame % 150;
  const circleTranslateY = interpolate(floatFrame, [0, 75, 150], [0, -14, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const circleRotate = interpolate(floatFrame, [0, 75, 150], [0, 8, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  const glowFrame = frame % 75;
  const glowRadius = interpolate(glowFrame, [0, 37.5, 75], [25, 55, 25], {
    easing: Easing.inOut(Easing.quad),
  });

  // 6. Video Box Life, Float, Gradient and Bracket Blinks
  let boxLife = 0;
  let boxTranslateX = 80;
  let boxRotate = 6;
  let boxScale = 0.85;

  if (frame >= 20 && frame <= 545) {
    boxLife = interpolate(frame, [20, 55], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    boxTranslateX = interpolate(frame, [20, 55], [80, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    boxRotate = interpolate(frame, [20, 55], [6, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    boxScale = interpolate(frame, [20, 55], [0.85, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
  } else if (frame > 545) {
    boxLife = interpolate(frame, [545, 580], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
    boxTranslateX = interpolate(frame, [545, 580], [0, 80], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
    boxRotate = interpolate(frame, [545, 580], [0, 6], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
    boxScale = interpolate(frame, [545, 580], [1, 0.85], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
  }

  const boxFloatFrame = frame % 180;
  const boxFloatY = interpolate(boxFloatFrame, [0, 90, 180], [0, -12, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const boxFloatRot = interpolate(boxFloatFrame, [0, 90, 180], [0, -2, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  const gradFrame = frame % 150;
  const gradX = interpolate(gradFrame, [0, 75, 150], [0, 100, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  const blinkFrame = frame % 60;
  const bracketOpacity1 = interpolate(blinkFrame, [0, 30, 60], [1, 0.4, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  const bracketOffset1 = interpolate(blinkFrame, [0, 30, 60], [0, -3, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  const blinkFrameDelayed = (frame + 24) % 60;
  const bracketOpacity2 = interpolate(blinkFrameDelayed, [0, 30, 60], [1, 0.4, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  const bracketOffset2 = interpolate(blinkFrameDelayed, [0, 30, 60], [0, -3, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  // 7. Check Label Pop & Swing Swing
  const swingFrame = frame % 120;
  const swingRot = interpolate(swingFrame, [0, 30, 60, 90, 120], [0, 3, 0, -3, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const swingScale = interpolate(swingFrame, [0, 30, 60, 90, 120], [1, 1.05, 1, 1.05, 1], {
    easing: Easing.inOut(Easing.quad),
  });

  let labelLifeScale = 0;
  let labelLifeRot = -15;
  let labelOpacity = 0;

  if (frame >= 36 && frame <= 540) {
    labelOpacity = interpolate(frame, [36, 54], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    labelLifeScale = interpolate(frame, [36, 54], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    labelLifeRot = interpolate(frame, [36, 54], [-15, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
  } else if (frame > 540) {
    labelOpacity = interpolate(frame, [540, 558], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    labelLifeScale = interpolate(frame, [540, 558], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
    labelLifeRot = interpolate(frame, [540, 558], [0, -15], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
  }

  // 8. Follow Label Pop & Bounce
  const bounceFrame = frame % 60;
  const bounceY = interpolate(bounceFrame, [0, 18, 30, 39, 60], [0, -12, 0, -5, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const bounceScale = interpolate(bounceFrame, [0, 18, 30, 39, 60], [1, 1.08, 1, 1.03, 1], {
    easing: Easing.inOut(Easing.quad),
  });

  let followLifeScale = 0;
  let followLifeY = 40;
  let followOpacity = 0;

  if (frame >= 42 && frame <= 535) {
    followOpacity = interpolate(frame, [42, 63], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    followLifeScale = interpolate(frame, [42, 63], [0.7, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
    followLifeY = interpolate(frame, [42, 63], [40, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    });
  } else if (frame > 535) {
    followOpacity = interpolate(frame, [535, 556], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    followLifeScale = interpolate(frame, [535, 556], [1, 0.7], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
    followLifeY = interpolate(frame, [535, 556], [0, 40], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
  }

  // Tape JSX Elements creation
  const renderTapeSpans = () => {
    return Array.from({ length: 12 }).map((_, i) => (
      <span
        key={i}
        style={{
          fontSize: '65.28px',
          fontWeight: 900,
          color: '#2a1f3a',
          letterSpacing: '1px',
          padding: '0 23.04px',
          WebkitTextStroke: '0.5px rgba(0,0,0,0.2)',
        }}
      >
        {tapeText}
      </span>
    ));
  };

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
        fontFamily: "'Arial Black', 'Arial', sans-serif",
        backgroundColor: '#000',
      }}
    >
      {/* Background with repeating gradient and shift */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'repeating-linear-gradient(135deg, #4a3a5e 0px, #4a3a5e 38px, #463658 38px, #463658 76px)',
          backgroundSize: '200% 200%',
          backgroundPosition: backgroundPosition,
        }}
      >
        {/* Background Text samar */}
        <div
          style={{
            position: 'absolute',
            inset: '-20%',
            transform: `rotate(-45deg) translateX(${bgTextScroll}px)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            pointerEvents: 'none',
            opacity: bgTextOpacity,
          }}
        >
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '42.24px',
                fontWeight: 900,
                color: '#1a1228',
                letterSpacing: '2px',
                lineHeight: 2.6,
              }}
            >
              {repeatedBgLine}
            </div>
          ))}
        </div>

        {/* Diagonal Yellow Tapes */}
        <div
          style={{
            position: 'absolute',
            inset: '-30%',
            transform: 'rotate(-30deg)',
            pointerEvents: 'none',
          }}
        >
          {/* Tape 1 (t1) */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '-20%',
              width: '140%',
              height: '105.6px',
              backgroundColor: '#f2f021',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
              ...getTapeTransition(frame, 3),
            }}
          >
            <div
              style={{
                display: 'flex',
                whiteSpace: 'nowrap',
                transform: `translateX(${scrollPercent}%)`,
              }}
            >
              {renderTapeSpans()}
            </div>
          </div>

          {/* Tape 2 (t2 reverse) */}
          <div
            style={{
              position: 'absolute',
              top: '26%',
              left: '-20%',
              width: '140%',
              height: '105.6px',
              backgroundColor: '#f2f021',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
              ...getTapeTransition(frame, 8),
            }}
          >
            <div
              style={{
                display: 'flex',
                whiteSpace: 'nowrap',
                transform: `translateX(${scrollPercentRev}%)`,
              }}
            >
              {renderTapeSpans()}
            </div>
          </div>

          {/* Tape 3 (t3) */}
          <div
            style={{
              position: 'absolute',
              top: '44%',
              left: '-20%',
              width: '140%',
              height: '105.6px',
              backgroundColor: '#f2f021',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
              ...getTapeTransition(frame, 12),
            }}
          >
            <div
              style={{
                display: 'flex',
                whiteSpace: 'nowrap',
                transform: `translateX(${scrollPercent}%)`,
              }}
            >
              {renderTapeSpans()}
            </div>
          </div>

          {/* Tape 4 (t4 reverse) */}
          <div
            style={{
              position: 'absolute',
              top: '62%',
              left: '-20%',
              width: '140%',
              height: '105.6px',
              backgroundColor: '#f2f021',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
              ...getTapeTransition(frame, 17),
            }}
          >
            <div
              style={{
                display: 'flex',
                whiteSpace: 'nowrap',
                transform: `translateX(${scrollPercentRev}%)`,
              }}
            >
              {renderTapeSpans()}
            </div>
          </div>

          {/* Tape 5 (t5) */}
          <div
            style={{
              position: 'absolute',
              top: '80%',
              left: '-20%',
              width: '140%',
              height: '105.6px',
              backgroundColor: '#f2f021',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
              ...getTapeTransition(frame, 21),
            }}
          >
            <div
              style={{
                display: 'flex',
                whiteSpace: 'nowrap',
                transform: `translateX(${scrollPercent}%)`,
              }}
            >
              {renderTapeSpans()}
            </div>
          </div>
        </div>

        {/* Pink Circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '19%',
            width: '403px',
            height: '403px',
            background: 'radial-gradient(circle at 35% 30%, #ff66e0, #ff35d8 70%, #e01ec0)',
            borderRadius: '50%',
            boxShadow: `0 0 ${glowRadius}px rgba(255,53,216,0.6), 0 10px 30px rgba(0,0,0,0.4)`,
            transform: `translate(-50%, -50%) scale(${circleScale}) translateY(${circleTranslateY}px) rotate(${circleRotate}deg)`,
          }}
        />

        {/* Pink Video Box */}
        <div
          style={{
            position: 'absolute',
            top: '324px',
            right: '134.4px',
            width: '691.2px',
            height: '453.6px',
            background: 'linear-gradient(135deg, #ff66e0, #ff35d8 60%, #e01ec0)',
            backgroundSize: '200% 200%',
            backgroundPosition: `${gradX}% 50%`,
            boxShadow: '0 0 35px rgba(255,53,216,0.5), 0 12px 35px rgba(0,0,0,0.45)',
            transformOrigin: 'center',
            opacity: boxLife,
            transform: `translate(${boxTranslateX}px, ${boxFloatY}px) rotate(${boxRotate + boxFloatRot}deg) scale(${boxScale})`,
          }}
        >
          {/* Bracket Before (Top Left) */}
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              width: '30px',
              height: '30px',
              borderWidth: '3px 0 0 3px',
              borderStyle: 'solid',
              borderColor: '#ff35d8',
              opacity: bracketOpacity1,
              transform: `translate(${bracketOffset1}px, ${bracketOffset1}px)`,
            }}
          />
          {/* Bracket After (Bottom Right) */}
          <div
            style={{
              position: 'absolute',
              bottom: '-10px',
              right: '-10px',
              width: '30px',
              height: '30px',
              borderWidth: '0 3px 3px 0',
              borderStyle: 'solid',
              borderColor: '#ff35d8',
              opacity: bracketOpacity2,
              transform: `translate(${bracketOffset2}px, ${bracketOffset2}px)`,
            }}
          />
        </div>

        {/* Check Label */}
        <div
          style={{
            position: 'absolute',
            top: '49%',
            left: '43%',
            backgroundColor: '#ff35d8',
            color: '#fff',
            fontSize: '19.2px',
            fontWeight: 900,
            textAlign: 'center',
            padding: '9.6px 21.12px',
            borderRadius: '6px',
            lineHeight: 1.3,
            letterSpacing: '1px',
            boxShadow: '0 0 18px rgba(255,53,216,0.6)',
            zIndex: 5,
            opacity: labelOpacity,
            transform: `translate(-50%, -50%) rotate(${labelLifeRot + swingRot}deg) scale(${labelLifeScale * swingScale})`,
          }}
        >
          CHECK LATEST<br />VIDEO!
        </div>

        {/* Follow Label */}
        <div
          style={{
            position: 'absolute',
            bottom: '97.2px',
            right: '134.4px',
            backgroundColor: '#ff35d8',
            color: '#fff',
            fontSize: '28.8px',
            fontWeight: 900,
            padding: '9.6px 24.96px',
            borderRadius: '8px',
            letterSpacing: '1px',
            boxShadow: '0 0 20px rgba(255,53,216,0.7)',
            zIndex: 5,
            opacity: followOpacity,
            transform: `translateY(${followLifeY + bounceY}px) scale(${followLifeScale * bounceScale})`,
          }}
        >
          FOLLOW ME!
        </div>

        {/* Sparkling Particles */}
        {SPARKLES.map((s) => {
          const sparkleFrame = (frame + s.delay) % s.duration;
          const halfDuration = s.duration / 2;
          const sOpacity = interpolate(sparkleFrame, [0, halfDuration, s.duration], [0, 1, 0], {
            easing: Easing.inOut(Easing.quad),
          });
          const sScale = interpolate(sparkleFrame, [0, halfDuration, s.duration], [0, 1.4, 0], {
            easing: Easing.inOut(Easing.quad),
          });

          return (
            <div
              key={s.id}
              style={{
                position: 'absolute',
                top: s.top,
                left: s.left,
                width: '8px',
                height: '8px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                pointerEvents: 'none',
                boxShadow: '0 0 8px #fff, 0 0 16px #ff66e0',
                opacity: sOpacity,
                transform: `scale(${sScale})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DiagonalTapeOutro;
// END_OF_FILE