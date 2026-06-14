import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const STREAK_COLORS = [
  'rgba(180,80,255,',
  'rgba(120,40,255,',
  'rgba(200,120,255,'
];

const STREAK_PRESETS = [
  { top: 5, dur: 4.5, delay: -1.2, thickness: 1.5, colorIdx: 0 },
  { top: 12, dur: 6.2, delay: -3.4, thickness: 2.5, colorIdx: 1 },
  { top: 20, dur: 5.1, delay: -0.5, thickness: 1.8, colorIdx: 2 },
  { top: 28, dur: 7.8, delay: -5.1, thickness: 3.5, colorIdx: 0 },
  { top: 35, dur: 4.2, delay: -2.3, thickness: 1.2, colorIdx: 1 },
  { top: 43, dur: 5.9, delay: -1.8, thickness: 2.8, colorIdx: 2 },
  { top: 52, dur: 8.3, delay: -4.2, thickness: 2.0, colorIdx: 0 },
  { top: 60, dur: 4.9, delay: -0.9, thickness: 3.0, colorIdx: 1 },
  { top: 68, dur: 6.7, delay: -3.1, thickness: 1.5, colorIdx: 2 },
  { top: 76, dur: 5.3, delay: -2.7, thickness: 2.5, colorIdx: 0 },
  { top: 83, dur: 7.1, delay: -4.8, thickness: 2.2, colorIdx: 1 },
  { top: 90, dur: 4.6, delay: -1.1, thickness: 2.8, colorIdx: 2 },
  { top: 95, dur: 6.0, delay: -3.9, thickness: 1.6, colorIdx: 0 },
  { top: 2, dur: 8.0, delay: -0.2, thickness: 2.2, colorIdx: 1 },
];

const NeonYoutubeEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Parallax angle computation
  const totalFrames = 720; // 12 seconds at 60fps
  const t = (frame / totalFrames) * 2 * Math.PI * 6; // 6 full cycles
  const angle = -12 + Math.sin(t) * 2;
  const containerRot = Math.sin(t) * 0.6;

  // Chevron drawing animations
  const chevronCycle = 360; // 6 seconds per draw/retract loop (fits exactly twice in 12s)
  const cFrame = frame % chevronCycle;
  
  // Path 1
  const pathOffset1 = interpolate(
    cFrame,
    [0, 144, 180, 324, 360],
    [1400, 0, 0, 1400, 1400],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }
  );
  
  // Path 2 delay: 0.3s (18 frames)
  const cFrameDelayed = (frame - 18 + totalFrames) % chevronCycle;
  const pathOffset2 = interpolate(
    cFrameDelayed,
    [0, 144, 180, 324, 360],
    [1400, 0, 0, 1400, 1400],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }
  );

  const pathOpacity1 = interpolate(
    cFrame,
    [0, 144, 180, 324, 360],
    [0.4, 1.0, 1.0, 0.4, 0.4]
  );

  const pathOpacity2 = interpolate(
    cFrameDelayed,
    [0, 144, 180, 324, 360],
    [0.4, 1.0, 1.0, 0.4, 0.4]
  );

  // Chevron Fill Pulse
  const fillOpacity = interpolate(
    frame % 240, // 4-second cycle, fits exactly 3 times in 12s
    [0, 120, 240],
    [0.5, 0.9, 0.5],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Dot Move along chevron (Path: 600,0 -> 350,280 -> 600,560)
  const dotCycle = 240; // 4 seconds per sweep
  const dotProgress = (frame % dotCycle) / dotCycle;
  let dotX = 600;
  let dotY = 0;
  if (dotProgress < 0.5) {
    const segmentProgress = dotProgress / 0.5;
    dotX = interpolate(segmentProgress, [0, 1], [600, 350]);
    dotY = interpolate(segmentProgress, [0, 1], [0, 280]);
  } else {
    const segmentProgress = (dotProgress - 0.5) / 0.5;
    dotX = interpolate(segmentProgress, [0, 1], [350, 600]);
    dotY = interpolate(segmentProgress, [0, 1], [280, 560]);
  }

  const dotOpacity = interpolate(
    dotProgress,
    [0, 0.1, 0.9, 1.0],
    [0, 1, 1, 0]
  );

  // Left neon frames entrance (Seamless 12s loop with fadeout)
  const getFrameAnimation = (f: number) => {
    const wrapped = (f + totalFrames) % totalFrames;
    const opacity = interpolate(wrapped, [0, 58, 662, 720], [0, 1, 1, 0], { easing: Easing.inOut(Easing.quad) });
    const scale = interpolate(wrapped, [0, 58, 662, 720], [0.85, 1, 1, 0.85], { easing: Easing.inOut(Easing.quad) });
    const translateX = interpolate(wrapped, [0, 58, 662, 720], [-30, 0, 0, -30], { easing: Easing.inOut(Easing.quad) });
    return { opacity, transform: `scale(${scale}) translateX(${translateX}px)` };
  };

  const frameTopAnim = getFrameAnimation(frame);
  const frameBottomAnim = getFrameAnimation(frame - 24); // 0.4s delay

  // Frame Pulse
  const framePulseCycle = 144; // 2.4 seconds (fits 5 times in 12s)
  const fPulseFrame = frame % framePulseCycle;
  const framePulseOpacity = interpolate(fPulseFrame, [0, 72, 144], [0.3, 1, 0.3], { easing: Easing.inOut(Easing.quad) });
  const framePulseGlow = interpolate(fPulseFrame, [0, 72, 144], [4, 14, 4], { easing: Easing.inOut(Easing.quad) });

  // Circle avatar entrance
  const circleOpacity = interpolate(
    frame,
    [0, 72, 101, 662, 720],
    [0, 1, 1, 1, 0],
    { easing: Easing.out(Easing.quad) }
  );
  const circleScale = interpolate(
    frame,
    [0, 72, 101, 662, 720],
    [0, 1.15, 1, 1, 0],
    { easing: Easing.out(Easing.quad) }
  );

  // Ring pulse around circle avatar
  const ringCycle = 120; // 2 seconds
  const ringProgress = (frame % ringCycle) / ringCycle;
  const ringScale = interpolate(ringProgress, [0, 1], [1, 1.4], { easing: Easing.inOut(Easing.quad) });
  const ringOpacity = interpolate(ringProgress, [0, 1], [0.8, 0], { easing: Easing.inOut(Easing.quad) });

  // Subscribe button entrance
  const subOpacity = interpolate(frame, [0, 94, 662, 720], [0, 1, 1, 0], { easing: Easing.out(Easing.quad) });
  const subTranslateY = interpolate(frame, [0, 94, 662, 720], [20, 0, 0, 20], { easing: Easing.out(Easing.quad) });
  const subScale = interpolate(frame, [0, 94, 662, 720], [0.9, 1, 1, 0.9], { easing: Easing.out(Easing.quad) });

  // Subscribe button glow breathing
  const subGlowCycle = 180; // 3 seconds
  const subGlowFrame = frame % subGlowCycle;
  const subGlowRadius1 = interpolate(subGlowFrame, [0, 90, 180], [10, 18, 10], { easing: Easing.inOut(Easing.quad) });
  const subGlowRadius2 = interpolate(subGlowFrame, [0, 90, 180], [22, 40, 22], { easing: Easing.inOut(Easing.quad) });

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
        background: 'radial-gradient(ellipse at 70% 50%, #1a0033 0%, #0a0014 60%, #000 100%)',
        boxShadow: '0 0 60px rgba(150, 0, 255, 0.2)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Background light streaks */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          transform: `rotate(${containerRot}deg) scale(1.05)`,
        }}
      >
        {STREAK_PRESETS.map((preset, index) => {
          const color = STREAK_COLORS[preset.colorIdx];
          const progress = ((frame / fps) - preset.delay) / preset.dur;
          const wrappedProgress = progress % 1;
          const translateX = interpolate(wrappedProgress, [0, 1], [-20, 120]);
          const opacity = interpolate(wrappedProgress, [0, 0.1, 0.9, 1], [0, 0.8, 0.4, 0]);

          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: '-30%',
                top: `${preset.top}%`,
                height: `${preset.thickness}px`,
                width: '60%',
                background: `linear-gradient(90deg, transparent, ${color}0.6), ${color}0.25), transparent)`,
                transformOrigin: 'left center',
                filter: 'blur(1px)',
                opacity,
                transform: `translateX(${translateX}%) rotate(${angle}deg)`,
              }}
            />
          );
        })}
      </div>

      {/* Right angled chevron neon path */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '55%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 600 560"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            right: '-5%',
            top: 0,
            width: '110%',
            height: '100%',
          }}
        >
          <polygon
            points="600,0 350,280 600,560 600,0"
            style={{
              fill: 'rgba(120, 20, 200, 0.25)',
              filter: 'drop-shadow(0 0 20px rgba(150, 0, 255, 0.4))',
              opacity: fillOpacity,
            }}
          />
          <path
            d="M 600 0 L 350 280 L 600 560"
            style={{
              fill: 'none',
              stroke: '#b14dff',
              strokeWidth: 3,
              filter: 'drop-shadow(0 0 6px #a020ff) drop-shadow(0 0 14px #7a00ff)',
              strokeDasharray: 1400,
              strokeDashoffset: pathOffset1,
              opacity: pathOpacity1,
            }}
          />
          <path
            d="M 600 90 L 430 280 L 600 470"
            style={{
              fill: 'none',
              stroke: '#b14dff',
              strokeWidth: 3,
              filter: 'drop-shadow(0 0 6px #a020ff) drop-shadow(0 0 14px #7a00ff)',
              strokeDasharray: 1400,
              strokeDashoffset: pathOffset2,
              opacity: pathOpacity2,
            }}
          />
        </svg>

        {/* Glow dot overlay */}
        <div
          style={{
            position: 'absolute',
            right: '-5%',
            top: 0,
            width: '110%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 0 12px #fff, 0 0 24px #c080ff, 0 0 40px #9020ff',
              left: `${(dotX / 600) * 100}%`,
              top: `${(dotY / 560) * 100}%`,
              transform: 'translate(-50%, -50%)',
              opacity: dotOpacity,
            }}
          />
        </div>
      </div>

      {/* Left neon frame - Top */}
      <div
        style={{
          position: 'absolute',
          border: '2px solid #c060ff',
          borderRadius: 6,
          boxShadow: '0 0 8px #a020ff, 0 0 18px #7a00ff, inset 0 0 8px rgba(160, 60, 255, 0.3)',
          left: '8%',
          top: '23%',
          width: '32%',
          height: '26%',
          opacity: frameTopAnim.opacity,
          transform: frameTopAnim.transform,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 6,
            border: '1px solid rgba(255, 200, 255, 0.4)',
            opacity: framePulseOpacity,
            boxShadow: `0 0 ${framePulseGlow}px #c060ff`,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Left neon frame - Bottom */}
      <div
        style={{
          position: 'absolute',
          border: '2px solid #c060ff',
          borderRadius: 6,
          boxShadow: '0 0 8px #a020ff, 0 0 18px #7a00ff, inset 0 0 8px rgba(160, 60, 255, 0.3)',
          left: '8%',
          top: '56%',
          width: '32%',
          height: '26%',
          opacity: frameBottomAnim.opacity,
          transform: frameBottomAnim.transform,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 6,
            border: '1px solid rgba(255, 200, 255, 0.4)',
            opacity: framePulseOpacity,
            boxShadow: `0 0 ${framePulseGlow}px #c060ff`,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Circle avatar */}
      <div
        style={{
          position: 'absolute',
          right: '19%',
          top: '22%',
          width: 268.8,
          height: 268.8,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #ffffff, #f0e8ff 60%, #e0d0ff 100%)',
          boxShadow: '0 0 20px #ffffff, 0 0 40px #c080ff, 0 0 70px #9020ff',
          opacity: circleOpacity,
          transform: `scale(${circleScale})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: '2px solid rgba(192, 96, 255, 0.6)',
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Subscribe button */}
      <div
        style={{
          position: 'absolute',
          right: '13.5%',
          top: '53%',
          padding: '12px 28px',
          background: 'linear-gradient(135deg, #7a00cc, #b020ff)',
          borderRadius: 4,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 24,
          letterSpacing: 2,
          boxShadow: `0 0 ${subGlowRadius1}px #a020ff, 0 0 ${subGlowRadius2}px #7a00ff`,
          opacity: subOpacity,
          transform: `translateY(${subTranslateY}px) scale(${subScale})`,
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        SUBSCRIBE
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default NeonYoutubeEndscreen;
// END_OF_FILE