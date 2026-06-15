import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

interface StreakConfig {
  top: number;
  duration: number; // in frames
  delay: number; // in frames
  thickness: number;
  color: string;
}

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic streak configurations (durations are divisors of 360 to guarantee perfect looping)
const STREAKS_DATA: StreakConfig[] = [
  { top: 12, duration: 180, delay: 0, thickness: 2.5, color: 'rgba(180, 80, 255,' },
  { top: 28, duration: 120, delay: 40, thickness: 1.5, color: 'rgba(120, 40, 255,' },
  { top: 45, duration: 90, delay: 10, thickness: 3.0, color: 'rgba(200, 120, 255,' },
  { top: 62, duration: 180, delay: 120, thickness: 2.0, color: 'rgba(180, 80, 255,' },
  { top: 80, duration: 120, delay: 20, thickness: 1.2, color: 'rgba(120, 40, 255,' },
  { top: 95, duration: 360, delay: 150, thickness: 2.8, color: 'rgba(200, 120, 255,' },
  { top: 5, duration: 180, delay: 70, thickness: 1.8, color: 'rgba(180, 80, 255,' },
  { top: 37, duration: 90, delay: 110, thickness: 2.2, color: 'rgba(200, 120, 255,' },
  { top: 53, duration: 120, delay: 10, thickness: 1.0, color: 'rgba(120, 40, 255,' },
  { top: 71, duration: 180, delay: 180, thickness: 3.5, color: 'rgba(180, 80, 255,' },
  { top: 88, duration: 360, delay: 60, thickness: 1.6, color: 'rgba(200, 120, 255,' },
  { top: 19, duration: 120, delay: 130, thickness: 2.4, color: 'rgba(120, 40, 255,' },
  { top: 33, duration: 180, delay: 50, thickness: 1.3, color: 'rgba(180, 80, 255,' },
  { top: 66, duration: 90, delay: 80, thickness: 2.1, color: 'rgba(200, 120, 255,' },
];

export const NeonYoutubeEndscreen: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Subtle adaptive parallax: streaks container rotation wobble (seamless over 360 frames)
  const wobbleProgress = (frame % 360) / 360;
  const containerRotate = Math.sin(wobbleProgress * Math.PI * 2) * 0.6;

  // Chevron Fill pulsing (4s cycle -> 120 frames)
  const fillProgress = (frame % 120) / 120;
  const fillOpacity = interpolate(
    Math.sin(fillProgress * Math.PI * 2),
    [-1, 1],
    [0.5, 0.9]
  );

  // Chevron Neon Path 1 Animation (4s cycle -> 120 frames)
  const pathProgress1 = (frame % 120) / 120;
  const dashOffset1 = interpolate(
    pathProgress1,
    [0, 0.4, 1],
    [1400, 0, 0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const opacity1 = interpolate(
    pathProgress1,
    [0, 0.4, 1],
    [0.4, 1, 1],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Chevron Neon Path 2 Animation (with 9 frames delay)
  const pathProgress2 = ((frame - 9 + 120) % 120) / 120;
  const dashOffset2 = interpolate(
    pathProgress2,
    [0, 0.4, 1],
    [1400, 0, 0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const opacity2 = interpolate(
    pathProgress2,
    [0, 0.4, 1],
    [0.4, 1, 1],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Glow Dot Coordinate Math along "M 600 0 L 350 280 L 600 560" (4s cycle -> 120 frames)
  const dotProgress = (frame % 120) / 120;
  let dotX = 600;
  let dotY = 0;
  if (dotProgress < 0.5) {
    const p = dotProgress / 0.5;
    dotX = interpolate(p, [0, 1], [600, 350], { easing: Easing.linear });
    dotY = interpolate(p, [0, 1], [0, 280], { easing: Easing.linear });
  } else {
    const p = (dotProgress - 0.5) / 0.5;
    dotX = interpolate(p, [0, 1], [350, 600], { easing: Easing.linear });
    dotY = interpolate(p, [0, 1], [280, 560], { easing: Easing.linear });
  }

  // Map glow dot coordinates cleanly to parent .chevron container (width 110%, offset left -5%)
  const pctX = (dotX / 600) * 110 - 5;
  const pctY = (dotY / 560) * 100;
  const dotOpacity = interpolate(dotProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  // Frame pulse (72 frames -> divisor of 360 for perfect loop)
  const pulseProgress = (frame % 72) / 72;
  const pulseOpacity = interpolate(
    Math.sin(pulseProgress * Math.PI * 2),
    [-1, 1],
    [0.3, 1]
  );
  const pulseGlow = interpolate(
    Math.sin(pulseProgress * Math.PI * 2),
    [-1, 1],
    [4, 14]
  );

  // Neon Frames Entry/Exit (12s cycle -> 360 frames)
  // Top Frame
  const f1Opacity = interpolate(frame, [0, 28, 332, 360], [0, 1, 1, 0], { easing: Easing.inOut(Easing.quad) });
  const f1Scale = interpolate(frame, [0, 28, 332, 360], [0.85, 1, 1, 0.85], { easing: Easing.inOut(Easing.quad) });
  const f1TranslateX = interpolate(frame, [0, 28, 332, 360], [-30, 0, 0, -30], { easing: Easing.inOut(Easing.quad) });

  // Bottom Frame (delayed by 12 frames)
  const f2Frame = (frame - 12 + 360) % 360;
  const f2Opacity = interpolate(f2Frame, [0, 28, 332, 360], [0, 1, 1, 0], { easing: Easing.inOut(Easing.quad) });
  const f2Scale = interpolate(f2Frame, [0, 28, 332, 360], [0.85, 1, 1, 0.85], { easing: Easing.inOut(Easing.quad) });
  const f2TranslateX = interpolate(f2Frame, [0, 28, 332, 360], [-30, 0, 0, -30], { easing: Easing.inOut(Easing.quad) });

  // Circle Avatar entry/exit & ring pulse
  const circleOpacity = interpolate(frame, [0, 36, 331, 360], [0, 1, 1, 0], { easing: Easing.inOut(Easing.quad) });
  const circleScale = interpolate(frame, [0, 36, 50, 310, 331, 360], [0, 1.15, 1, 1, 1, 0], { easing: Easing.inOut(Easing.quad) });

  const ringProgress = (frame % 60) / 60;
  const ringScale = interpolate(ringProgress, [0, 1], [1, 1.4], { easing: Easing.out(Easing.quad) });
  const ringOpacity = interpolate(ringProgress, [0, 1], [0.8, 0], { easing: Easing.out(Easing.quad) });

  // Subscribe button entry/exit & breathing glow (glow pulses every 90 frames -> 3s)
  const subOpacity = interpolate(frame, [0, 47, 324, 360], [0, 1, 1, 0], { easing: Easing.inOut(Easing.quad) });
  const subTranslateY = interpolate(frame, [0, 47, 324, 360], [20, 0, 0, 20], { easing: Easing.inOut(Easing.quad) });
  const subScale = interpolate(frame, [0, 47, 324, 360], [0.9, 1, 1, 0.9], { easing: Easing.inOut(Easing.quad) });

  const subGlowProgress = (frame % 90) / 90;
  const glowIntensity = interpolate(
    Math.sin(subGlowProgress * Math.PI * 2),
    [-1, 1],
    [0, 1]
  );
  const glow1 = interpolate(glowIntensity, [0, 1], [10, 18]);
  const glow2 = interpolate(glowIntensity, [0, 1], [22, 40]);

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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at 70% 50%, #1a0033 0%, #0a0014 60%, #000 100%)',
          boxShadow: '0 0 60px rgba(150, 0, 255, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Background light streaks */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            transform: `rotate(${containerRotate}deg) scale(1.05)`,
            transformOrigin: 'center center',
          }}
        >
          {STREAKS_DATA.map((s: StreakConfig, idx: number) => {
            const localFrame = (frame - s.delay + s.duration * 10) % s.duration;
            const progress = localFrame / s.duration;

            const tx = interpolate(progress, [0, 1], [-20, 120]);
            const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 0.8, 0.4, 0]);

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: '-30%',
                  top: `${s.top}%`,
                  height: `${s.thickness}px`,
                  width: '60%',
                  background: `linear-gradient(90deg, transparent, ${s.color} 0.6), ${s.color} 0.25), transparent)`,
                  transformOrigin: 'left center',
                  transform: `translateX(${tx}%) rotate(-12deg)`,
                  filter: 'blur(1px)',
                  opacity,
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
              className="chevron-fill"
              points="600,0 350,280 600,560 600,0"
              style={{
                fill: 'rgba(120, 20, 200, 0.25)',
                filter: 'drop-shadow(0 0 20px rgba(150, 0, 255, 0.4))',
                opacity: fillOpacity,
              }}
            />
            <path
              className="neon-path"
              d="M 600 0 L 350 280 L 600 560"
              style={{
                fill: 'none',
                stroke: '#b14dff',
                strokeWidth: 3,
                filter: 'drop-shadow(0 0 6px #a020ff) drop-shadow(0 0 14px #7a00ff)',
                strokeDasharray: '1400',
                strokeDashoffset: dashOffset1,
                opacity: opacity1,
              }}
            />
            <path
              className="neon-path"
              d="M 600 90 L 430 280 L 600 470"
              style={{
                fill: 'none',
                stroke: '#b14dff',
                strokeWidth: 3,
                filter: 'drop-shadow(0 0 6px #a020ff) drop-shadow(0 0 14px #7a00ff)',
                strokeDasharray: '1400',
                strokeDashoffset: dashOffset2,
                opacity: opacity2,
              }}
            />
          </svg>

          {/* Glow Dot */}
          <div
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 0 12px #fff, 0 0 24px #c080ff, 0 0 40px #9020ff',
              left: `${pctX}%`,
              top: `${pctY}%`,
              transform: 'translate(-50%, -50%)',
              opacity: dotOpacity,
            }}
          />
        </div>

        {/* Left Neon Frames */}
        {/* Top Frame */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            top: '23%',
            width: '32%',
            height: '26%',
            border: '2px solid #c060ff',
            borderRadius: '6px',
            boxShadow: `0 0 8px #a020ff, 0 0 18px #7a00ff, inset 0 0 8px rgba(160, 60, 255, 0.3)`,
            opacity: f1Opacity,
            transform: `scale(${f1Scale}) translateX(${f1TranslateX}px)`,
          }}
        >
          {/* Inner Glow Pulse */}
          <div
            style={{
              position: 'absolute',
              inset: '-2px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 200, 255, 0.4)',
              opacity: pulseOpacity,
              boxShadow: `0 0 ${pulseGlow}px #c060ff`,
            }}
          />
        </div>

        {/* Bottom Frame */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            top: '56%',
            width: '32%',
            height: '26%',
            border: '2px solid #c060ff',
            borderRadius: '6px',
            boxShadow: `0 0 8px #a020ff, 0 0 18px #7a00ff, inset 0 0 8px rgba(160, 60, 255, 0.3)`,
            opacity: f2Opacity,
            transform: `scale(${f2Scale}) translateX(${f2TranslateX}px)`,
          }}
        >
          {/* Inner Glow Pulse */}
          <div
            style={{
              position: 'absolute',
              inset: '-2px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 200, 255, 0.4)',
              opacity: pulseOpacity,
              boxShadow: `0 0 ${pulseGlow}px #c060ff`,
            }}
          />
        </div>

        {/* Circle Avatar (Perfect 1:1 Aspect locked) */}
        <div
          style={{
            position: 'absolute',
            right: '19%',
            top: '22%',
            width: '14%',
            aspectRatio: '1',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #ffffff, #f0e8ff 60%, #e0d0ff 100%)',
            boxShadow: '0 0 20px #ffffff, 0 0 40px #c080ff, 0 0 70px #9020ff',
            opacity: circleOpacity,
            transform: `scale(${circleScale})`,
          }}
        >
          {/* Ring Pulse */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '50%',
              border: '2px solid rgba(192, 96, 255, 0.6)',
              transform: `scale(${ringScale})`,
              opacity: ringOpacity,
            }}
          />
        </div>

        {/* Subscribe Button */}
        <div
          style={{
            position: 'absolute',
            right: '13.5%',
            top: '53%',
            padding: '1.1% 2.4%',
            background: 'linear-gradient(135deg, #7a00cc, #b020ff)',
            borderRadius: '4px',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '24px',
            letterSpacing: '2px',
            boxShadow: `0 0 ${glow1}px #a020ff, 0 0 ${glow2}px #7a00ff`,
            opacity: subOpacity,
            transform: `translateY(${subTranslateY}px) scale(${subScale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          SUBSCRIBE
        </div>

        {/* Vignette overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default NeonYoutubeEndscreen;
// END_OF_FILE