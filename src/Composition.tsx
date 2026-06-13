import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React, { useMemo } from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic streak data generator (bypasses Math.random at render time)
const STREAK_COUNT = 14;
const STREAKS_DATA = Array.from({ length: STREAK_COUNT }, (_, i) => {
  const colors = [
    'rgba(180, 80, 255,',
    'rgba(120, 40, 255,',
    'rgba(200, 120, 255,',
  ];
  // Deterministic pseudo-random generation using math sine seeds
  const seed = Math.sin(i + 1) * 10000;
  const randomVal = seed - Math.floor(seed);

  const seed2 = Math.cos(i + 1) * 10000;
  const randomVal2 = seed2 - Math.floor(seed2);

  const seed3 = Math.sin(i * 2) * 10000;
  const randomVal3 = seed3 - Math.floor(seed3);

  return {
    id: i,
    top: randomVal * 100, // percentage
    duration: 4 + randomVal2 * 5, // 4s to 9s
    delay: -randomVal3 * 9, // negative offset up to 9s
    thickness: 1 + randomVal * 2.5, // 1px to 3.5px
    colorBase: colors[Math.floor(randomVal * colors.length)],
  };
});

export const NeonYouTubeEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Scale factor to maintain 16:9 ratio in 4K or other viewports
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Background streaks adaptive parallax rotation (loops perfectly over 12s / 360 frames)
  const streaksRotation = Math.sin(frame * ((2 * Math.PI) / 360)) * 0.6;

  // Chevron drawing animation (alternate loop over 4s -> 120 frames)
  const chevronLocalFrame = frame % 120;
  const chevronProgress = chevronLocalFrame / 120;
  const pAlt1 = chevronProgress < 0.5 
    ? interpolate(chevronProgress, [0, 0.5], [0, 1], { easing: Easing.inOut(Easing.quad) })
    : interpolate(chevronProgress, [0.5, 1], [1, 0], { easing: Easing.inOut(Easing.quad) });

  const strokeDashoffset1 = 1400 - (1400 * pAlt1);
  const strokeOpacity1 = interpolate(pAlt1, [0, 1], [0.4, 1]);

  // Chevron 2 path (delay by 0.3s -> 9 frames)
  const chevronLocalFrame2 = (frame - 9 + 120) % 120;
  const chevronProgress2 = chevronLocalFrame2 / 120;
  const pAlt2 = chevronProgress2 < 0.5
    ? interpolate(chevronProgress2, [0, 0.5], [0, 1], { easing: Easing.inOut(Easing.quad) })
    : interpolate(chevronProgress2, [0.5, 1], [1, 0], { easing: Easing.inOut(Easing.quad) });

  const strokeDashoffset2 = 1400 - (1400 * pAlt2);
  const strokeOpacity2 = interpolate(pAlt2, [0, 1], [0.4, 1]);

  // Chevron Fill Pulse (alternate loop over 4s -> 120 frames)
  const fillLocalFrame = frame % 120;
  const fillProgress = fillLocalFrame / 120;
  const fillOpacity = fillProgress < 0.5
    ? interpolate(fillProgress, [0, 0.5], [0.5, 0.9], { easing: Easing.inOut(Easing.quad) })
    : interpolate(fillProgress, [0.5, 1], [0.9, 0.5], { easing: Easing.inOut(Easing.quad) });

  // Glow dot movement (4s -> 120 frames cycle along chevron path)
  const dotLocalFrame = frame % 120;
  const dotProgress = dotLocalFrame / 120;
  let dotX = 600;
  let dotY = 0;
  if (dotProgress < 0.5) {
    const p = dotProgress / 0.5;
    dotX = interpolate(p, [0, 1], [600, 350]);
    dotY = interpolate(p, [0, 1], [0, 280]);
  } else {
    const p = (dotProgress - 0.5) / 0.5;
    dotX = interpolate(p, [0, 1], [350, 600]);
    dotY = interpolate(p, [0, 1], [280, 560]);
  }
  const dotOpacity = interpolate(dotProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  // Neon frames scale & opacity calculations (timeline 12s -> 360 frames)
  const getFrameMotion = (f: number) => {
    const progress = f / 360;
    let scale = 1;
    let translateX = 0;
    let opacity = 0;
    if (progress < 0.08) {
      const p = progress / 0.08;
      scale = interpolate(p, [0, 1], [0.85, 1], { easing: Easing.out(Easing.quad) });
      translateX = interpolate(p, [0, 1], [-30, 0], { easing: Easing.out(Easing.quad) });
      opacity = interpolate(p, [0, 1], [0, 1]);
    } else if (progress <= 0.92) {
      scale = 1;
      translateX = 0;
      opacity = 1;
    } else {
      const p = (progress - 0.92) / 0.08;
      scale = interpolate(p, [0, 1], [1, 0.85], { easing: Easing.in(Easing.quad) });
      translateX = interpolate(p, [0, 1], [0, -30], { easing: Easing.in(Easing.quad) });
      opacity = interpolate(p, [0, 1], [1, 0]);
    }
    return { scale, translateX, opacity };
  };

  const topFrameMotion = getFrameMotion(frame);
  const bottomFrameLocalFrame = (frame - 12 + 360) % 360; // Delayed by 12 frames (0.4s)
  const bottomFrameMotion = getFrameMotion(bottomFrameLocalFrame);

  // Frame internal pulsing animation (2.4s -> 72 frames loop for seamless fit in 12s)
  const framePulseLocal = frame % 72;
  const framePulseProgress = framePulseLocal / 72;
  const framePulseOpacity = framePulseProgress < 0.5
    ? interpolate(framePulseProgress, [0, 0.5], [0.3, 1], { easing: Easing.inOut(Easing.quad) })
    : interpolate(framePulseProgress, [0.5, 1], [1, 0.3], { easing: Easing.inOut(Easing.quad) });
  const framePulseShadow = framePulseProgress < 0.5
    ? interpolate(framePulseProgress, [0, 0.5], [4, 14])
    : interpolate(framePulseProgress, [0.5, 1], [14, 4]);

  // Circle Avatar Pop sequence (timeline 12s -> 360 frames)
  const getCircleMotion = (f: number) => {
    const progress = f / 360;
    let scale = 1;
    let opacity = 0;
    if (progress < 0.10) {
      const p = progress / 0.10;
      scale = interpolate(p, [0, 1], [0, 1.15], { easing: Easing.out(Easing.quad) });
      opacity = interpolate(p, [0, 1], [0, 1]);
    } else if (progress < 0.14) {
      const p = (progress - 0.10) / 0.04;
      scale = interpolate(p, [0, 1], [1.15, 1], { easing: Easing.inOut(Easing.quad) });
      opacity = 1;
    } else if (progress <= 0.92) {
      scale = 1;
      opacity = 1;
    } else {
      const p = (progress - 0.92) / 0.08;
      scale = interpolate(p, [0, 1], [1, 0], { easing: Easing.in(Easing.quad) });
      opacity = interpolate(p, [0, 1], [1, 0]);
    }
    return { scale, opacity };
  };

  const circleMotion = getCircleMotion(frame);

  // Circle internal ring pulse animation (2s -> 60 frames loop)
  const ringLocalFrame = frame % 60;
  const ringProgress = ringLocalFrame / 60;
  const ringScale = interpolate(ringProgress, [0, 1], [1, 1.4], { easing: Easing.out(Easing.quad) });
  const ringOpacity = interpolate(ringProgress, [0, 1], [0.8, 0]);

  // Subscribe button motion logic (timeline 12s -> 360 frames)
  const getSubscribeMotion = (f: number) => {
    const progress = f / 360;
    let scale = 1;
    let translateY = 0;
    let opacity = 0;
    if (progress < 0.13) {
      const p = progress / 0.13;
      scale = interpolate(p, [0, 1], [0.9, 1], { easing: Easing.out(Easing.quad) });
      translateY = interpolate(p, [0, 1], [20, 0], { easing: Easing.out(Easing.quad) });
      opacity = interpolate(p, [0, 1], [0, 1]);
    } else if (progress <= 0.92) {
      scale = 1;
      translateY = 0;
      opacity = 1;
    } else {
      const p = (progress - 0.92) / 0.08;
      scale = interpolate(p, [0, 1], [1, 0.9], { easing: Easing.in(Easing.quad) });
      translateY = interpolate(p, [0, 1], [0, 20], { easing: Easing.in(Easing.quad) });
      opacity = interpolate(p, [0, 1], [1, 0]);
    }
    return { scale, translateY, opacity };
  };

  const subscribeMotion = getSubscribeMotion(frame);

  // Subscribe breathing glow effect (2s -> 60 frames loop)
  const subGlowLocal = frame % 60;
  const subGlowProgress = subGlowLocal / 60;
  const shadowProgress = subGlowProgress < 0.5
    ? interpolate(subGlowProgress, [0, 0.5], [0, 1], { easing: Easing.inOut(Easing.quad) })
    : interpolate(subGlowProgress, [0.5, 1], [1, 0], { easing: Easing.inOut(Easing.quad) });

  const shadow1Blur = interpolate(shadowProgress, [0, 1], [10, 18]);
  const shadow2Blur = interpolate(shadowProgress, [0, 1], [22, 40]);

  // Main high-fidelity styling variables
  const stageStyle: React.CSSProperties = {
    position: 'absolute',
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    background: 'radial-gradient(ellipse at 70% 50%, #1a0033 0%, #0a0014 60%, #000 100%)',
    overflow: 'hidden',
    boxShadow: '0 0 60px rgba(150, 0, 255, 0.2)',
  };

  const streaksStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    transform: `rotate(${streaksRotation}deg) scale(1.05)`,
  };

  const chevronStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '55%',
    height: '100%',
    overflow: 'hidden',
  };

  const chevronSvgStyle: React.CSSProperties = {
    position: 'absolute',
    right: '-5%',
    top: 0,
    width: '110%',
    height: '100%',
  };

  const frameBaseStyle: React.CSSProperties = {
    position: 'absolute',
    border: '2px solid #c060ff',
    borderRadius: '6px',
    boxShadow: '0 0 8px #a020ff, 0 0 18px #7a00ff, inset 0 0 8px rgba(160, 60, 255, 0.3)',
    transformOrigin: 'center center',
  };

  const frameTopStyle: React.CSSProperties = {
    ...frameBaseStyle,
    left: '8%',
    top: '23%',
    width: '32%',
    height: '26%',
    opacity: topFrameMotion.opacity,
    transform: `scale(${topFrameMotion.scale}) translateX(${topFrameMotion.translateX}px)`,
  };

  const frameBottomStyle: React.CSSProperties = {
    ...frameBaseStyle,
    left: '8%',
    top: '56%',
    width: '32%',
    height: '26%',
    opacity: bottomFrameMotion.opacity,
    transform: `scale(${bottomFrameMotion.scale}) translateX(${bottomFrameMotion.translateX}px)`,
  };

  const innerFramePulseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '-2px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 200, 255, 0.4)',
    opacity: framePulseOpacity,
    boxShadow: `0 0 ${framePulseShadow}px #d080ff`,
  };

  const circleStyle: React.CSSProperties = {
    position: 'absolute',
    right: '19%',
    top: '22%',
    width: '14%',
    aspectRatio: '1',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #ffffff, #f0e8ff 60%, #e0d0ff 100%)',
    boxShadow: '0 0 20px #ffffff, 0 0 40px #c080ff, 0 0 70px #9020ff',
    opacity: circleMotion.opacity,
    transform: `scale(${circleMotion.scale})`,
  };

  const circleRingStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '-8px',
    borderRadius: '50%',
    border: '2px solid rgba(192, 96, 255, 0.6)',
    transform: `scale(${ringScale})`,
    opacity: ringOpacity,
  };

  const subscribeStyle: React.CSSProperties = {
    position: 'absolute',
    right: '13.5%',
    top: '53%',
    padding: '1.1% 2.4%',
    background: 'linear-gradient(135deg, #7a00cc, #b020ff)',
    borderRadius: '4px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '27px', // Scaled relative to 1920x1080
    letterSpacing: '2px',
    boxShadow: `0 0 ${shadow1Blur}px #a020ff, 0 0 ${shadow2Blur}px #7a00ff`,
    opacity: subscribeMotion.opacity,
    transform: `translateY(${subscribeMotion.translateY}px) scale(${subscribeMotion.scale})`,
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const glowDotStyle: React.CSSProperties = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 0 12px #fff, 0 0 24px #c080ff, 0 0 40px #9020ff',
    left: `${dotX}px`,
    top: `${dotY}px`,
    opacity: dotOpacity,
    transform: 'translate(-50%, -50%)',
  };

  const vignetteStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
    pointerEvents: 'none',
  };

  return (
    <div style={{ backgroundColor: '#000', width: '100%', height: '100%', position: 'relative' }}>
      <div style={stageStyle}>
        {/* Background light streaks */}
        <div style={streaksStyle}>
          {STREAKS_DATA.map((s) => {
            const streakFrames = s.duration * fps;
            const offsetFrames = s.delay * fps;
            let localStreakFrame = (frame - offsetFrames) % streakFrames;
            if (localStreakFrame < 0) {
              localStreakFrame += streakFrames;
            }
            const progress = localStreakFrame / streakFrames;

            const translateX = interpolate(progress, [0, 1], [-20, 120]);
            const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 0.8, 0.4, 0]);

            return (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  left: '-30%',
                  top: `${s.top}%`,
                  height: `${s.thickness}px`,
                  width: '60%',
                  background: `linear-gradient(90deg, transparent, ${s.colorBase}0.6), ${s.colorBase}0.25), transparent)`,
                  transformOrigin: 'left center',
                  filter: 'blur(1px)',
                  transform: `translateX(${translateX}%) rotate(-12deg)`,
                  opacity: opacity,
                }}
              />
            );
          })}
        </div>

        {/* Right angled chevron neon path */}
        <div style={chevronStyle}>
          <svg style={chevronSvgStyle} viewBox="0 0 600 560" preserveAspectRatio="none">
            <polygon
              style={{
                fill: 'rgba(120, 20, 200, 0.25)',
                filter: 'drop-shadow(0 0 20px rgba(150, 0, 255, 0.4))',
                opacity: fillOpacity,
              }}
              points="600,0 350,280 600,560 600,0"
            />
            <path
              style={{
                fill: 'none',
                stroke: '#b14dff',
                strokeWidth: 3,
                filter: 'drop-shadow(0 0 6px #a020ff) drop-shadow(0 0 14px #7a00ff)',
                strokeDasharray: '1400',
                strokeDashoffset: strokeDashoffset1,
                opacity: strokeOpacity1,
              }}
              d="M 600 0 L 350 280 L 600 560"
            />
            <path
              style={{
                fill: 'none',
                stroke: '#b14dff',
                strokeWidth: 3,
                filter: 'drop-shadow(0 0 6px #a020ff) drop-shadow(0 0 14px #7a00ff)',
                strokeDasharray: '1400',
                strokeDashoffset: strokeDashoffset2,
                opacity: strokeOpacity2,
              }}
              d="M 600 90 L 430 280 L 600 470"
            />
          </svg>
          <div style={glowDotStyle} />
        </div>

        {/* Left neon frames */}
        <div style={frameTopStyle}>
          <div style={innerFramePulseStyle} />
        </div>
        <div style={frameBottomStyle}>
          <div style={innerFramePulseStyle} />
        </div>

        {/* Circle avatar */}
        <div style={circleStyle}>
          <div style={circleRingStyle} />
        </div>

        {/* Subscribe button */}
        <div style={subscribeStyle}>SUBSCRIBE</div>

        <div style={vignetteStyle} />
      </div>
    </div>
  );
};

export default NeonYouTubeEndscreen;
// END_OF_FILE