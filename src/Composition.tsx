import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CYAN = '#00ffff';
const MAGENTA = '#ff00ff';
const YELLOW = '#ffff00';
const BG_COLOR = '#050505';
const KEY_COLOR = '#00FF00';

// Pre-calculated particle data (static, outside component)
const PARTICLES = [
  { width: 3, height: 15, left: '20%', color: CYAN, duration: 5, delay: 0 },
  { width: 4, height: 4, left: '80%', color: MAGENTA, duration: 10, delay: 2 },
  { width: 10, height: 2, left: '50%', color: YELLOW, duration: 2.5, delay: 1 },
  { width: 2, height: 20, left: '35%', color: CYAN, duration: 5, delay: 3 },
  { width: 5, height: 5, left: '65%', color: MAGENTA, duration: 5, delay: 4 },
];

const SynthwaveGreenScreenOverlay: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const totalFrames = 360; // 12s at 30fps
  const localFrame = frame % totalFrames;

  // --- GRID MOVE ANIMATION ---
  // gridMove: 5s cycle, background-position: 0 0 -> 0 15%
  const gridCycleFrames = 5 * fps;
  const gridLocalFrame = localFrame % gridCycleFrames;
  const gridBgPosY = interpolate(gridLocalFrame, [0, gridCycleFrames], [0, 15], {
    easing: Easing.linear,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // --- AMBIENT LIGHT PULSE ---
  // pulse: 5s ease-in-out alternate, 0% opacity:0.15 scale:0.9 -> 100% opacity:0.35 scale:1.1
  const pulseCycleFrames = 5 * fps; // full cycle = 10s (alternate means 5s each way)
  // left light: no delay
  const pulseLeftLocal = localFrame % (pulseCycleFrames * 2);
  const pulseLeftT = pulseLeftLocal < pulseCycleFrames
    ? pulseLeftLocal / pulseCycleFrames
    : 1 - (pulseLeftLocal - pulseCycleFrames) / pulseCycleFrames;
  const pulseLeftOpacity = 0.15 + (0.35 - 0.15) * pulseLeftT;
  const pulseLeftScale = 0.9 + (1.1 - 0.9) * pulseLeftT;

  // right light: delay -2.5s means offset by 2.5s = 75 frames
  const pulseRightOffset = 75;
  const pulseRightLocal = (localFrame + pulseRightOffset) % (pulseCycleFrames * 2);
  const pulseRightT = pulseRightLocal < pulseCycleFrames
    ? pulseRightLocal / pulseCycleFrames
    : 1 - (pulseRightLocal - pulseCycleFrames) / pulseCycleFrames;
  const pulseRightOpacity = 0.15 + (0.35 - 0.15) * pulseRightT;
  const pulseRightScale = 0.9 + (1.1 - 0.9) * pulseRightT;

  // --- ROTATE BORDER (left video box) ---
  // rotateBorder: 5s linear, 0->360deg
  const rotateBorderLeftCycle = 5 * fps;
  const rotateBorderLeftLocal = localFrame % rotateBorderLeftCycle;
  const rotateBorderLeftDeg = interpolate(
    rotateBorderLeftLocal,
    [0, rotateBorderLeftCycle],
    [0, 360],
    { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // rotateBorder right: reverse direction (5s)
  const rotateBorderRightDeg = -rotateBorderLeftDeg;

  // --- ROTATE BORDER CIRCLE ---
  // rotateBorder 2.5s linear
  const rotateBorderCircleCycle = 2.5 * fps;
  const rotateBorderCircleLocal = localFrame % rotateBorderCircleCycle;
  const rotateBorderCircleDeg = interpolate(
    rotateBorderCircleLocal,
    [0, rotateBorderCircleCycle],
    [0, 360],
    { easing: Easing.linear, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // --- MASTER GLITCH ---
  // masterGlitch: 10s cycle (use 12s = totalFrames for seamless loop)
  // Keyframes: 0%,48%,51%,96%,100% = no glitch; 49%=glitch1; 50%=glitch2; 97%=glitch3; 98%=glitch4
  const glitchProgress = localFrame / totalFrames; // 0 to 1 over 360 frames

  let glitchX = 0;
  let glitchY = 0;
  let glitchFilter = 'none';

  if (glitchProgress >= 0.49 && glitchProgress < 0.495) {
    glitchX = -3;
    glitchY = 2;
    glitchFilter = `drop-shadow(4px 0 0 ${CYAN}) drop-shadow(-4px 0 0 ${MAGENTA})`;
  } else if (glitchProgress >= 0.495 && glitchProgress < 0.51) {
    glitchX = 3;
    glitchY = -2;
    glitchFilter = `drop-shadow(-4px 0 0 ${CYAN}) drop-shadow(4px 0 0 ${MAGENTA})`;
  } else if (glitchProgress >= 0.97 && glitchProgress < 0.975) {
    glitchX = 2;
    glitchY = 3;
    glitchFilter = `drop-shadow(5px 0 0 ${CYAN}) drop-shadow(-5px 0 0 ${MAGENTA})`;
  } else if (glitchProgress >= 0.975 && glitchProgress < 0.985) {
    glitchX = -4;
    glitchY = -1;
    glitchFilter = `drop-shadow(-5px 0 0 ${CYAN}) drop-shadow(5px 0 0 ${MAGENTA})`;
  }

  // --- GLITCH LINE (scanlineJump) ---
  // scanlineJump: 5s cycle
  // 0-90%: opacity:0, top:0
  // 91%: opacity:1, top:20%
  // 92%: opacity:0, top:20%
  // 93%: opacity:1, top:75%
  // 94%: opacity:0, top:75%
  // 95%: opacity:1, top:40%
  // 96%: opacity:0, top:40%
  // 100%: opacity:0
  const glitchLineCycle = 5 * fps; // 150 frames
  const glitchLineLocal = localFrame % glitchLineCycle;
  const glitchLineProgress = glitchLineLocal / glitchLineCycle;

  let glitchLineOpacity = 0;
  let glitchLineTop = '0%';

  if (glitchLineProgress >= 0.91 && glitchLineProgress < 0.92) {
    glitchLineOpacity = 1;
    glitchLineTop = '20%';
  } else if (glitchLineProgress >= 0.92 && glitchLineProgress < 0.93) {
    glitchLineOpacity = 0;
    glitchLineTop = '20%';
  } else if (glitchLineProgress >= 0.93 && glitchLineProgress < 0.94) {
    glitchLineOpacity = 1;
    glitchLineTop = '75%';
  } else if (glitchLineProgress >= 0.94 && glitchLineProgress < 0.95) {
    glitchLineOpacity = 0;
    glitchLineTop = '75%';
  } else if (glitchLineProgress >= 0.95 && glitchLineProgress < 0.96) {
    glitchLineOpacity = 1;
    glitchLineTop = '40%';
  } else if (glitchLineProgress >= 0.96 && glitchLineProgress < 1.0) {
    glitchLineOpacity = 0;
    glitchLineTop = '40%';
  }

  // --- PARTICLES ---
  const particleAnimations = PARTICLES.map((p) => {
    const durationFrames = p.duration * fps;
    const delayFrames = p.delay * fps;
    const adjustedFrame = (localFrame + delayFrames) % durationFrames;
    const t = adjustedFrame / durationFrames;

    // floatUp: 0%: translateY(0) scale(1) opacity:0; 10%: opacity:0.8; 90%: opacity:0.8; 100%: translateY(-1080px) scale(0.5) opacity:0
    const translateY = interpolate(t, [0, 1], [0, -ORIGINAL_HEIGHT], {
      easing: Easing.linear,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    const scaleVal = interpolate(t, [0, 1], [1, 0.5], {
      easing: Easing.linear,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    let opacity = 0;
    if (t < 0.1) {
      opacity = interpolate(t, [0, 0.1], [0, 0.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    } else if (t <= 0.9) {
      opacity = 0.8;
    } else {
      opacity = interpolate(t, [0.9, 1], [0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    }

    return { translateY, scaleVal, opacity };
  });

  // Video box dimensions: 36% of 1920 = 691.2px wide, aspect 16:9 = 388.8px tall
  const videoBoxWidth = ORIGINAL_WIDTH * 0.36;
  const videoBoxHeight = videoBoxWidth * (9 / 16);

  // Subscribe box: 14% of 1920 = 268.8px
  const subscribeSize = ORIGINAL_WIDTH * 0.14;

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
      }}
    >
      {/* Main container with glitch */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: BG_COLOR,
          overflow: 'hidden',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)',
          transform: `translate(${glitchX}px, ${glitchY}px)`,
          filter: glitchFilter,
          width: '100%',
          height: '100%',
        }}
      >
        {/* Ambient Light Left */}
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
            background: CYAN,
            transform: `scale(${pulseLeftScale})`,
            transformOrigin: 'center center',
          }}
        />

        {/* Ambient Light Right */}
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
            background: MAGENTA,
            transform: `scale(${pulseRightScale})`,
            transformOrigin: 'center center',
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
              backgroundImage: `linear-gradient(to right, rgba(0,255,255,0.2) 2px, transparent 2px), linear-gradient(to top, rgba(255,0,255,0.4) 2px, transparent 2px)`,
              backgroundSize: '3% 15%',
              backgroundPosition: `0 ${gridBgPosY}%`,
              transform: 'rotateX(75deg)',
              transformOrigin: 'center top',
              boxShadow: `inset 0 100px 100px ${BG_COLOR}`,
            }}
          />
        </div>

        {/* Particles */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
          }}
        >
          {PARTICLES.map((p, i) => {
            const anim = particleAnimations[i];
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: p.width,
                  height: p.height,
                  left: p.left,
                  bottom: '-10%',
                  background: p.color,
                  opacity: anim.opacity,
                  transform: `translateY(${anim.translateY}px) scale(${anim.scaleVal})`,
                  transformOrigin: 'center center',
                }}
              />
            );
          })}
        </div>

        {/* Glitch Line */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: 2,
            background: 'rgba(255,255,255,0.8)',
            boxShadow: `0 0 10px ${CYAN}, 0 0 10px ${MAGENTA}`,
            zIndex: 90,
            opacity: glitchLineOpacity,
            top: glitchLineTop,
          }}
        />

        {/* Video Box Left */}
        <div
          style={{
            position: 'absolute',
            width: videoBoxWidth,
            height: videoBoxHeight,
            top: '16%',
            left: '9%',
            zIndex: 10,
          }}
        >
          {/* Border Wrapper Left - rotating conic gradient */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              background: '#222',
              overflow: 'hidden',
              zIndex: -1,
              boxShadow: '0 0 25px rgba(0,255,255,0.4)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `conic-gradient(from ${rotateBorderLeftDeg}deg, transparent 60%, ${CYAN} 100%)`,
              }}
            />
          </div>
          {/* Green Screen Rect */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: KEY_COLOR,
              zIndex: 2,
            }}
          />
          {/* Tech Corners - Top Left */}
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: -10,
              right: -10,
              bottom: -10,
              zIndex: 3,
            }}
          >
            {/* Top-left corner */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 20,
                height: 20,
                borderTop: '2px solid #fff',
                borderLeft: '2px solid #fff',
                opacity: 0.7,
              }}
            />
            {/* Bottom-right corner */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 20,
                height: 20,
                borderBottom: '2px solid #fff',
                borderRight: '2px solid #fff',
                opacity: 0.7,
              }}
            />
          </div>
        </div>

        {/* Video Box Right */}
        <div
          style={{
            position: 'absolute',
            width: videoBoxWidth,
            height: videoBoxHeight,
            top: '16%',
            right: '9%',
            zIndex: 10,
          }}
        >
          {/* Border Wrapper Right - rotating conic gradient reverse */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              background: '#222',
              overflow: 'hidden',
              zIndex: -1,
              boxShadow: '0 0 25px rgba(255,0,255,0.4)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `conic-gradient(from ${rotateBorderRightDeg}deg, transparent 60%, ${MAGENTA} 100%)`,
              }}
            />
          </div>
          {/* Green Screen Rect */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: KEY_COLOR,
              zIndex: 2,
            }}
          />
          {/* Tech Corners */}
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: -10,
              right: -10,
              bottom: -10,
              zIndex: 3,
            }}
          >
            {/* Top-left corner */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 20,
                height: 20,
                borderTop: '2px solid #fff',
                borderLeft: '2px solid #fff',
                opacity: 0.7,
              }}
            />
            {/* Bottom-right corner */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 20,
                height: 20,
                borderBottom: '2px solid #fff',
                borderRight: '2px solid #fff',
                opacity: 0.7,
              }}
            />
          </div>
        </div>

        {/* Subscribe Box */}
        <div
          style={{
            position: 'absolute',
            width: subscribeSize,
            height: subscribeSize,
            bottom: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            borderRadius: '50%',
          }}
        >
          {/* Border Circle */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 0 30px rgba(255,255,0,0.4)',
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
                background: `conic-gradient(from ${rotateBorderCircleDeg}deg, transparent 40%, ${CYAN} 60%, ${MAGENTA} 80%, ${YELLOW} 100%)`,
              }}
            />
          </div>
          {/* Green Screen Circle */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: KEY_COLOR,
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
            background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 2px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 4px)',
            zIndex: 100,
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
};

export default SynthwaveGreenScreenOverlay;
// END_OF_FILE