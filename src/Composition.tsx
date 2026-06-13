import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const TAPE_TEXT = "SUBSCRIBE TO MY CHANNEL! ";
const TAPE_REPEAT = 12;
const BG_WORDS = "SUBSCRIBE TO MY CHANNEL! ";
const BG_ROWS = 25;
const BG_COLS = 8;

const tapeTextContent = Array.from({ length: TAPE_REPEAT }, (_, i) => TAPE_TEXT).join('');
const bgRowContent = Array.from({ length: BG_COLS }, () => BG_WORDS).join('');

const SPARKLES: { top: number; left: number; delay: number; duration: number }[] = [
  { top: 7.2, left: 14.5, delay: 0.3, duration: 2.1 },
  { top: 23.1, left: 82.3, delay: 1.1, duration: 2.8 },
  { top: 55.4, left: 47.6, delay: 0.7, duration: 1.9 },
  { top: 88.9, left: 61.2, delay: 1.5, duration: 2.4 },
  { top: 12.0, left: 33.8, delay: 0.2, duration: 3.1 },
  { top: 44.3, left: 91.7, delay: 0.9, duration: 2.0 },
  { top: 67.8, left: 5.3, delay: 1.7, duration: 2.6 },
  { top: 31.5, left: 72.1, delay: 0.4, duration: 1.7 },
  { top: 78.2, left: 28.4, delay: 1.3, duration: 2.3 },
  { top: 4.6, left: 56.9, delay: 0.6, duration: 2.9 },
  { top: 92.1, left: 43.2, delay: 1.8, duration: 1.6 },
  { top: 19.7, left: 8.1, delay: 0.1, duration: 2.2 },
  { top: 60.3, left: 66.5, delay: 1.2, duration: 3.2 },
  { top: 37.8, left: 19.4, delay: 0.8, duration: 1.8 },
  { top: 83.5, left: 88.7, delay: 1.6, duration: 2.5 },
  { top: 2.9, left: 37.2, delay: 0.5, duration: 2.7 },
  { top: 49.1, left: 77.8, delay: 1.0, duration: 1.5 },
  { top: 73.6, left: 52.3, delay: 1.4, duration: 2.1 },
  { top: 15.4, left: 95.6, delay: 0.3, duration: 3.3 },
  { top: 96.2, left: 22.1, delay: 1.9, duration: 2.0 },
  { top: 28.7, left: 44.9, delay: 0.7, duration: 2.4 },
  { top: 52.0, left: 11.3, delay: 1.1, duration: 1.9 },
  { top: 41.5, left: 59.8, delay: 0.4, duration: 2.8 },
  { top: 86.3, left: 35.6, delay: 1.6, duration: 2.2 },
  { top: 64.9, left: 84.2, delay: 0.9, duration: 3.0 },
];

const TAPE_CONFIGS = [
  { topPct: 8, delay: 0.1, reverse: false },
  { topPct: 26, delay: 0.25, reverse: true },
  { topPct: 44, delay: 0.4, reverse: false },
  { topPct: 62, delay: 0.55, reverse: true },
  { topPct: 80, delay: 0.7, reverse: false },
];

const YouTubeOutroDiagonalTape: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const totalFrames = 600;
  const localFrame = frame % totalFrames;
  const t = localFrame / totalFrames;

  // bgShift: 20s loop — background-position shift (simulated via translateX/Y on a pseudo-element approach)
  // We simulate via a subtle offset on the bg layer
  const bgShiftT = localFrame / (fps * 20);
  const bgOffsetX = interpolate(
    bgShiftT,
    [0, 0.5, 1],
    [0, 100, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const bgOffsetY = interpolate(
    bgShiftT,
    [0, 0.5, 1],
    [0, 100, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // bgScroll: 30s linear — translateX(-100px) over 30s
  const bgScrollCycle = fps * 30;
  const bgScrollLocal = localFrame % bgScrollCycle;
  const bgScrollX = interpolate(bgScrollLocal, [0, bgScrollCycle], [0, -100], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // bgPulse: 6s ease-in-out — opacity 0.10 <-> 0.18
  const bgPulseCycle = fps * 6;
  const bgPulseLocal = localFrame % bgPulseCycle;
  const bgOpacity = interpolate(
    bgPulseLocal,
    [0, bgPulseCycle * 0.5, bgPulseCycle],
    [0.10, 0.18, 0.10],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Tape slide in: 0.8s ease forwards (one-shot, no loop needed — use clamp)
  const tapeSlideFrames = Math.round(0.8 * fps);

  // tapeMove: 12s linear — translateX(-50%)
  const tapeCycle = fps * 12;
  const tapeMoveLocal = localFrame % tapeCycle;
  const tapeMoveX = interpolate(tapeMoveLocal, [0, tapeCycle], [0, -50], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // circleIn: 0.9s cubic-bezier(.34,1.56,.64,1)
  const circleInFrames = Math.round(0.9 * fps);
  const circleInProgress = Math.min(localFrame / circleInFrames, 1);
  const circleInScale = interpolate(circleInProgress, [0, 1], [0, 1], {
    easing: Easing.out(Easing.back(1.56)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const circleInOpacity = interpolate(circleInProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // circleFloat: 5s ease-in-out infinite (starts at 0.9s)
  const circleFloatCycle = fps * 5;
  const circleFloatStart = Math.round(0.9 * fps);
  const circleFloatLocal = Math.max(0, localFrame - circleFloatStart) % circleFloatCycle;
  const circleFloatY = interpolate(
    circleFloatLocal,
    [0, circleFloatCycle * 0.5, circleFloatCycle],
    [0, -14, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const circleFloatRot = interpolate(
    circleFloatLocal,
    [0, circleFloatCycle * 0.5, circleFloatCycle],
    [0, 8, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // glowPulse: 2.5s ease-in-out infinite
  const glowCycle = fps * 2.5;
  const glowLocal = localFrame % glowCycle;
  const glowSize = interpolate(
    glowLocal,
    [0, glowCycle * 0.5, glowCycle],
    [25, 55, 25],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const glowAlpha = interpolate(
    glowLocal,
    [0, glowCycle * 0.5, glowCycle],
    [0.5, 0.95, 0.5],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // boxIn: 1s cubic-bezier(.34,1.56,.64,1)
  const boxInFrames = Math.round(1.0 * fps);
  const boxInProgress = Math.min(localFrame / boxInFrames, 1);
  const boxInOpacity = interpolate(boxInProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const boxInX = interpolate(boxInProgress, [0, 1], [80, 0], {
    easing: Easing.out(Easing.back(1.56)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const boxInRot = interpolate(boxInProgress, [0, 1], [6, 0], {
    easing: Easing.out(Easing.back(1.56)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const boxInScale = interpolate(boxInProgress, [0, 1], [0.85, 1], {
    easing: Easing.out(Easing.back(1.56)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // boxFloat: 6s ease-in-out infinite (starts at 1s)
  const boxFloatCycle = fps * 6;
  const boxFloatStart = Math.round(1.0 * fps);
  const boxFloatLocal = Math.max(0, localFrame - boxFloatStart) % boxFloatCycle;
  const boxFloatY = interpolate(
    boxFloatLocal,
    [0, boxFloatCycle * 0.5, boxFloatCycle],
    [0, -12, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const boxFloatRot = interpolate(
    boxFloatLocal,
    [0, boxFloatCycle * 0.5, boxFloatCycle],
    [0, -2, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // gradMove: 8s ease infinite — background-position 0%50% -> 100%50%
  const gradCycle = fps * 8;
  const gradLocal = localFrame % gradCycle;
  const gradPos = interpolate(
    gradLocal,
    [0, gradCycle * 0.5, gradCycle],
    [0, 100, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // bracketBlink: 1.6s ease-in-out infinite
  const bracketCycle = fps * 1.6;
  const bracketLocal = localFrame % bracketCycle;
  const bracketOpacity = interpolate(
    bracketLocal,
    [0, bracketCycle * 0.5, bracketCycle],
    [1, 0.4, 1],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const bracketTranslate = interpolate(
    bracketLocal,
    [0, bracketCycle * 0.5, bracketCycle],
    [0, -3, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // bracket2 delayed by 0.8s
  const bracket2Local = (localFrame + Math.round(0.8 * fps)) % bracketCycle;
  const bracket2Opacity = interpolate(
    bracket2Local,
    [0, bracketCycle * 0.5, bracketCycle],
    [1, 0.4, 1],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const bracket2Translate = interpolate(
    bracket2Local,
    [0, bracketCycle * 0.5, bracketCycle],
    [0, -3, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // labelPop: 0.6s cubic-bezier(.34,1.56,.64,1) at 1.2s delay
  const labelPopStart = Math.round(1.2 * fps);
  const labelPopFrames = Math.round(0.6 * fps);
  const labelPopProgress = Math.min(Math.max(localFrame - labelPopStart, 0) / labelPopFrames, 1);
  const labelPopOpacity = interpolate(labelPopProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelPopScale = interpolate(labelPopProgress, [0, 1], [0, 1], {
    easing: Easing.out(Easing.back(1.56)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelPopRot = interpolate(labelPopProgress, [0, 1], [-15, 0], {
    easing: Easing.out(Easing.back(1.56)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // swing: 3s ease-in-out infinite at 1.8s
  const swingCycle = fps * 3;
  const swingStart = Math.round(1.8 * fps);
  const swingLocal = Math.max(0, localFrame - swingStart) % swingCycle;
  const swingRot = interpolate(
    swingLocal,
    [0, swingCycle * 0.25, swingCycle * 0.75, swingCycle],
    [0, 3, -3, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const swingScale = interpolate(
    swingLocal,
    [0, swingCycle * 0.25, swingCycle * 0.75, swingCycle],
    [1, 1.05, 1.05, 1],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // followIn: 0.7s at 1.4s delay
  const followStart = Math.round(1.4 * fps);
  const followFrames = Math.round(0.7 * fps);
  const followProgress = Math.min(Math.max(localFrame - followStart, 0) / followFrames, 1);
  const followOpacity = interpolate(followProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const followY = interpolate(followProgress, [0, 1], [40, 0], {
    easing: Easing.out(Easing.back(1.56)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const followScale = interpolate(followProgress, [0, 1], [0.7, 1], {
    easing: Easing.out(Easing.back(1.56)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // bounce: 2.2s at 2.1s
  const bounceCycle = fps * 2.2;
  const bounceStart = Math.round(2.1 * fps);
  const bounceLocal = Math.max(0, localFrame - bounceStart) % bounceCycle;
  const bounceY = interpolate(
    bounceLocal,
    [0, bounceCycle * 0.3, bounceCycle * 0.5, bounceCycle * 0.65, bounceCycle],
    [0, -12, 0, -5, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const bounceScale = interpolate(
    bounceLocal,
    [0, bounceCycle * 0.3, bounceCycle * 0.5, bounceCycle * 0.65, bounceCycle],
    [1, 1.08, 1, 1.03, 1],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Combined label transform (apply pop first, then swing after)
  const labelTransform = labelPopProgress < 1
    ? `translate(-50%, -50%) scale(${labelPopScale}) rotate(${labelPopRot}deg)`
    : `translate(-50%, -50%) rotate(${swingRot}deg) scale(${swingScale})`;

  const followTransform = followProgress < 1
    ? `translateY(${followY}px) scale(${followScale})`
    : `translateY(${bounceY}px) scale(${bounceScale})`;

  const circleTransform = circleInProgress < 1
    ? `translate(-50%, -50%) scale(${circleInScale})`
    : `translate(-50%, -50%) translateY(${circleFloatY}px) rotate(${circleFloatRot}deg)`;

  const boxTransform = boxInProgress < 1
    ? `translateX(${boxInX}px) rotate(${boxInRot}deg) scale(${boxInScale})`
    : `translateY(${boxFloatY}px) rotate(${boxFloatRot}deg)`;

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
      }}
    >
      {/* Scene */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          overflow: 'hidden',
          background: `repeating-linear-gradient(135deg, #4a3a5e 0px, #4a3a5e 38px, #463658 38px, #463658 76px)`,
          backgroundSize: `${200 + bgOffsetX * 2}% ${200 + bgOffsetY * 2}%`,
          backgroundPosition: `${bgOffsetX}% ${bgOffsetY}%`,
          fontFamily: "'Arial Black', 'Arial', sans-serif",
        }}
      >
        {/* Background teks samar */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            right: '-20%',
            bottom: '-20%',
            transform: `rotate(-45deg) translateX(${bgScrollX}px)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            pointerEvents: 'none',
            opacity: bgOpacity,
          }}
        >
          {Array.from({ length: BG_ROWS }, (_, i) => (
            <div
              key={i}
              style={{
                whiteSpace: 'nowrap',
                fontSize: 42,
                fontWeight: 900,
                color: '#1a1228',
                letterSpacing: 2,
                lineHeight: 2.6,
                fontFamily: "'Arial Black', 'Arial', sans-serif",
              }}
            >
              {bgRowContent}
            </div>
          ))}
        </div>

        {/* Tape layer */}
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            left: '-30%',
            right: '-30%',
            bottom: '-30%',
            transform: 'rotate(-30deg)',
            pointerEvents: 'none',
          }}
        >
          {TAPE_CONFIGS.map((tape, idx) => {
            const delayFrames = Math.round(tape.delay * fps);
            const slideProgress = Math.min(Math.max(localFrame - delayFrames, 0) / tapeSlideFrames, 1);
            const tapeOpacity = interpolate(slideProgress, [0, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const tapeSlideX = interpolate(slideProgress, [0, 1], [-60, 0], {
              easing: Easing.out(Easing.quad),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            const scrollX = tape.reverse ? -tapeMoveX : tapeMoveX;

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: '-20%',
                  top: `${tape.topPct}%`,
                  width: '140%',
                  height: 106,
                  background: '#f2f021',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                  opacity: tapeOpacity,
                  transform: `translateX(${tapeSlideX}px)`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    whiteSpace: 'nowrap',
                    transform: `translateX(${scrollX}%)`,
                  }}
                >
                  {Array.from({ length: TAPE_REPEAT * 2 }, (_, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 65,
                        fontWeight: 900,
                        color: '#2a1f3a',
                        letterSpacing: 1,
                        padding: '0 23px',
                        fontFamily: "'Arial Black', 'Arial', sans-serif",
                        WebkitTextStroke: '0.5px rgba(0,0,0,0.2)',
                      }}
                    >
                      {TAPE_TEXT}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '19%',
            width: 403,
            height: 403,
            background: 'radial-gradient(circle at 35% 30%, #ff66e0, #ff35d8 70%, #e01ec0)',
            borderRadius: '50%',
            boxShadow: `0 0 ${glowSize}px rgba(255,53,216,${glowAlpha}), 0 10px 30px rgba(0,0,0,0.4)`,
            transform: circleTransform,
            opacity: circleInOpacity,
          }}
        />

        {/* Video box */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '7%',
            width: '36%',
            height: '42%',
            background: `linear-gradient(135deg, #ff66e0 ${gradPos * 0.6}%, #ff35d8 60%, #e01ec0)`,
            backgroundSize: '200% 200%',
            boxShadow: '0 0 35px rgba(255,53,216,0.5), 0 12px 35px rgba(0,0,0,0.45)',
            transformOrigin: 'center',
            transform: boxTransform,
            opacity: boxInOpacity,
          }}
        >
          {/* bracket before (top-left) */}
          <div
            style={{
              content: "''",
              position: 'absolute',
              top: -10,
              left: -10,
              width: 30,
              height: 30,
              borderTop: '3px solid #ff35d8',
              borderLeft: '3px solid #ff35d8',
              opacity: bracketOpacity,
              transform: `translate(${bracketTranslate}px, ${bracketTranslate}px)`,
            }}
          />
          {/* bracket after (bottom-right) */}
          <div
            style={{
              content: "''",
              position: 'absolute',
              bottom: -10,
              right: -10,
              width: 30,
              height: 30,
              borderBottom: '3px solid #ff35d8',
              borderRight: '3px solid #ff35d8',
              opacity: bracket2Opacity,
              transform: `translate(${bracket2Translate}px, ${bracket2Translate}px)`,
            }}
          />
        </div>

        {/* Check label */}
        <div
          style={{
            position: 'absolute',
            top: '49%',
            left: '43%',
            background: '#ff35d8',
            color: '#fff',
            fontSize: 19,
            fontWeight: 900,
            textAlign: 'center',
            padding: '10px 21px',
            borderRadius: 6,
            lineHeight: 1.3,
            letterSpacing: 1,
            boxShadow: '0 0 18px rgba(255,53,216,0.6)',
            zIndex: 5,
            transform: labelTransform,
            opacity: labelPopOpacity,
            fontFamily: "'Arial Black', 'Arial', sans-serif",
          }}
        >
          CHECK LATEST<br />VIDEO!
        </div>

        {/* Follow label */}
        <div
          style={{
            position: 'absolute',
            bottom: '9%',
            right: '7%',
            background: '#ff35d8',
            color: '#fff',
            fontSize: 29,
            fontWeight: 900,
            padding: '10px 25px',
            borderRadius: 8,
            letterSpacing: 1,
            boxShadow: '0 0 20px rgba(255,53,216,0.7)',
            zIndex: 5,
            transform: followTransform,
            opacity: followOpacity,
            fontFamily: "'Arial Black', 'Arial', sans-serif",
          }}
        >
          FOLLOW ME!
        </div>

        {/* Sparkles */}
        {SPARKLES.map((sp, i) => {
          const spDurationFrames = sp.duration * fps;
          const spDelayFrames = sp.delay * fps;
          const spCycleLocal = (localFrame + (spDurationFrames - spDelayFrames)) % spDurationFrames;
          const spProgress = spCycleLocal / spDurationFrames;
          const spOpacity = interpolate(
            spProgress,
            [0, 0.5, 1],
            [0, 1, 0],
            { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const spScale = interpolate(
            spProgress,
            [0, 0.5, 1],
            [0, 1.4, 0],
            { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${sp.top}%`,
                left: `${sp.left}%`,
                width: 8,
                height: 8,
                background: '#fff',
                borderRadius: '50%',
                pointerEvents: 'none',
                boxShadow: '0 0 8px #fff, 0 0 16px #ff66e0',
                opacity: spOpacity,
                transform: `scale(${spScale})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default YouTubeOutroDiagonalTape;
// END_OF_FILE