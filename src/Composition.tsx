import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic static particle calculation
const PARTICLE_COUNT = 28;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  // Deterministic pseudo-random values based on index
  const sin1 = Math.sin(i * 12345.67) * 0.5 + 0.5;
  const sin2 = Math.sin(i * 98765.43) * 0.5 + 0.5;
  const sin3 = Math.sin(i * 45678.12) * 0.5 + 0.5;

  const left = sin1 * 100; // 0 to 100%
  const scale = 0.5 + sin2 * 1.6; // 0.5 to 2.1

  // Perfect divisors of 600 frames to ensure flawless seamless looping
  const lifetimes = [100, 120, 150, 200, 300];
  const lifetime = lifetimes[Math.floor(sin3 * lifetimes.length) % lifetimes.length];

  // Starting offset frame (0 to lifetime - 1)
  const startDelay = Math.floor(sin1 * lifetime);

  const colorType = i % 3; // 0 = cyan, 1 = coral, 2 = peach

  return { id: i, left, scale, lifetime, startDelay, colorType };
});

const AuroraGlassEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // 16:9 scale fit container calculations
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // --- Animation Calculations ---

  // 1. Grid scroll: 2.5s cycle = 75 frames (75 divides 600 perfectly)
  const gridProgress = (frame % 75) / 75;
  const gridY = interpolate(gridProgress, [0, 1], [0, 50], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 2. Aurora floating animations
  // a1: 10s cycle (300 frames)
  const a1Progress = (frame % 300) / 300;
  const a1X = interpolate(a1Progress, [0, 0.5, 1], [0, 8, 0], { easing: Easing.inOut(Easing.quad) });
  const a1Y = interpolate(a1Progress, [0, 0.5, 1], [0, 12, 0], { easing: Easing.inOut(Easing.quad) });
  const a1Scale = interpolate(a1Progress, [0, 0.5, 1], [1, 1.15, 1], { easing: Easing.inOut(Easing.quad) });

  // a2: 20s cycle (600 frames)
  const a2Progress = frame / 600;
  const a2X = interpolate(a2Progress, [0, 0.5, 1], [0, -10, 0], { easing: Easing.inOut(Easing.quad) });
  const a2Y = interpolate(a2Progress, [0, 0.5, 1], [0, -8, 0], { easing: Easing.inOut(Easing.quad) });
  const a2Scale = interpolate(a2Progress, [0, 0.5, 1], [1, 1.2, 1], { easing: Easing.inOut(Easing.quad) });

  // a3: 5s cycle (150 frames)
  const a3Progress = (frame % 150) / 150;
  const a3X = interpolate(a3Progress, [0, 0.5, 1], [0, -6, 0], { easing: Easing.inOut(Easing.quad) });
  const a3Y = interpolate(a3Progress, [0, 0.5, 1], [0, 10, 0], { easing: Easing.inOut(Easing.quad) });
  const a3Scale = interpolate(a3Progress, [0, 0.5, 1], [0.9, 1.1, 0.9], { easing: Easing.inOut(Easing.quad) });

  // 3. Central Glass Panel In/Out (Seamless loop over 20 seconds / 600 frames)
  // Transition in during first 30 frames, transition out during last 30 frames
  const panelOpacity = interpolate(
    frame,
    [0, 30, 570, 600],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const panelScale = interpolate(
    frame,
    [0, 30, 570, 600],
    [0.85, 1, 1, 0.85],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  // Glossy sweep: 5s cycle (150 frames)
  const sweepProgress = frame % 150;
  const sweepPos = interpolate(sweepProgress, [0, 90, 150], [200, -100, -100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 4. Avatar Animations
  // Spin glow (hue rotate): 5s cycle (150 frames)
  const avatarHue = interpolate((frame % 150) / 150, [0, 1], [0, 360]);

  // Ring out: 2s cycle (60 frames)
  const ringProgress = (frame % 60) / 60;
  const ringScale = interpolate(ringProgress, [0, 1], [1, 1.5], { easing: Easing.out(Easing.quad) });
  // Fade in at the start to loop perfectly without instant pop
  const ringOpacity = interpolate(ringProgress, [0, 0.1, 1], [0, 0.9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 5. Subscribe Button Pulse
  // Pulse: 2s cycle (60 frames)
  const pulseProgress = (frame % 60) / 60;
  const btnScale = interpolate(pulseProgress, [0, 0.5, 1], [1, 1.05, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  const shadowSpread = interpolate(pulseProgress, [0, 0.5, 1], [18, 32, 18]);
  const shadowColorStr = pulseProgress < 0.5
    ? `rgba(255, ${interpolate(pulseProgress, [0, 0.5], [107, 184])}, ${interpolate(pulseProgress, [0, 0.5], [107, 108])}, ${interpolate(pulseProgress, [0, 0.5], [0.5, 0.9])})`
    : `rgba(255, ${interpolate(pulseProgress, [0.5, 1], [184, 107])}, ${interpolate(pulseProgress, [0.5, 1], [108, 107])}, ${interpolate(pulseProgress, [0.5, 1], [0.9, 0.5])})`;

  // 6. Slot Animations (Staggered entries and seamless exits)
  // Left slot starts at frame 9. Ends transition by frame 39. Exits frame 561-591.
  const leftOpacity = interpolate(
    frame,
    [9, 39, 561, 591],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const leftY = interpolate(
    frame,
    [9, 39, 561, 591],
    [30, 0, 0, 30],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  // Right slot starts at frame 15. Ends transition by frame 45. Exits frame 555-585.
  const rightOpacity = interpolate(
    frame,
    [15, 45, 555, 585],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const rightY = interpolate(
    frame,
    [15, 45, 555, 585],
    [30, 0, 0, 30],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  // Slot shimmer: 4s cycle (120 frames)
  const shimmerOpacity = interpolate((frame % 120) / 120, [0, 0.5, 1], [0.4, 0.9, 0.4]);

  // --- Inline Styles (CamelCase Rules Checked) ---

  const stageStyle: React.CSSProperties = {
    position: 'absolute',
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(47,243,224,0.12), transparent 50%),
      radial-gradient(ellipse at 80% 90%, rgba(255,107,107,0.14), transparent 55%),
      linear-gradient(160deg, #04141a 0%, #071f23 50%, #0a0d1a 100%)
    `,
    boxShadow: '0 0 80px rgba(47,243,224,0.15)',
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
  };

  const a1Style: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(70px)',
    opacity: 0.55,
    mixBlendMode: 'screen',
    width: '45%',
    aspectRatio: '1',
    backgroundColor: '#2ff3e0',
    top: '-10%',
    left: '5%',
    transform: `translate(${a1X}%, ${a1Y}%) scale(${a1Scale})`,
  };

  const a2Style: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(70px)',
    opacity: 0.55,
    mixBlendMode: 'screen',
    width: '40%',
    aspectRatio: '1',
    backgroundColor: '#ff6b6b',
    bottom: '-15%',
    right: '8%',
    transform: `translate(${a2X}%, ${a2Y}%) scale(${a2Scale})`,
  };

  const a3Style: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(70px)',
    opacity: 0.55,
    mixBlendMode: 'screen',
    width: '30%',
    aspectRatio: '1',
    backgroundColor: '#ffb86c',
    top: '40%',
    left: '40%',
    transform: `translate(${a3X}%, ${a3Y}%) scale(${a3Scale})`,
  };

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%) perspective(400px) rotateX(62deg)',
    width: '200%',
    height: '55%',
    backgroundImage: `
      linear-gradient(rgba(47, 243, 224, 0.35) 1px, transparent 1px),
      linear-gradient(90deg, rgba(47, 243, 224, 0.25) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    transformOrigin: 'bottom center',
    maskImage: 'linear-gradient(transparent, #000 70%)',
    WebkitMaskImage: 'linear-gradient(transparent, #000 70%)',
    backgroundPositionY: `${gridY}px`,
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${panelScale})`,
    width: '58%',
    padding: '4% 5%',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '22px',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '5%',
    opacity: panelOpacity,
    boxSizing: 'border-box',
  };

  const panelSweepStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '22px',
    background: 'linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.18) 48%, transparent 60%)',
    backgroundSize: '250% 100%',
    backgroundPosition: `${sweepPos}% 0%`,
    pointerEvents: 'none',
  };

  const avatarStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '28%',
    aspectRatio: '1',
    borderRadius: '50%',
    background: 'conic-gradient(from 0deg, #2ff3e0, #ffb86c, #ff6b6b, #2ff3e0)',
    padding: '4px',
    position: 'relative',
    filter: `hue-rotate(${avatarHue}deg)`,
    boxShadow: '0 0 30px rgba(47, 243, 224, 0.5), 0 0 50px rgba(255, 107, 107, 0.3)',
    boxSizing: 'border-box',
  };

  const avatarInnerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '4px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #0d2a2e, #061417)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '34px',
    fontWeight: 'bold',
    textShadow: '0 0 12px #2ff3e0',
    zIndex: 1,
  };

  const ringStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '-10px',
    borderRadius: '50%',
    border: '2px solid rgba(47, 243, 224, 0.7)',
    transform: `scale(${ringScale})`,
    opacity: ringOpacity,
    pointerEvents: 'none',
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  };

  const h1Style: React.CSSProperties = {
    color: '#fff',
    fontSize: '34px',
    fontWeight: 800,
    letterSpacing: '1px',
    lineHeight: 1.1,
    marginBottom: '3%',
    textShadow: '0 0 18px rgba(47, 243, 224, 0.4)',
  };

  const subBtnStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #ff6b6b, #ffb86c)',
    color: '#1a0a0a',
    fontWeight: 800,
    letterSpacing: '2px',
    fontSize: '18px',
    borderRadius: '40px',
    boxShadow: `0 0 ${shadowSpread}px ${shadowColorStr}`,
    transform: `scale(${btnScale})`,
    position: 'relative',
  };

  const getSlotStyle = (isLeft: boolean, opacity: number, translateY: number): React.CSSProperties => ({
    position: 'absolute',
    bottom: '6%',
    width: '26%',
    aspectRatio: '16/9',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(6px)',
    overflow: 'hidden',
    opacity,
    transform: `translateY(${translateY}px)`,
    left: isLeft ? '5%' : undefined,
    right: !isLeft ? '5%' : undefined,
    boxSizing: 'border-box',
  });

  const slotShimmerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(47, 243, 224, 0.18), rgba(255, 107, 107, 0.18))',
    opacity: shimmerOpacity,
  };

  const playStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '22%',
    aspectRatio: '1',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a2a2e',
    fontSize: '16px',
    boxShadow: '0 0 14px rgba(255, 255, 255, 0.6)',
  };

  const particlesStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  };

  const vignetteStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%)',
  };

  return (
    <div style={stageStyle}>
      {/* Background Aurora Blobs */}
      <div style={a1Style} />
      <div style={a2Style} />
      <div style={a3Style} />

      {/* Retro Perspective Grid Floor */}
      <div style={gridStyle} />

      {/* Floating Particles */}
      <div style={particlesStyle}>
        {PARTICLES.map((p) => {
          const pProgress = ((frame + p.startDelay) % p.lifetime) / p.lifetime;

          const pY = interpolate(pProgress, [0, 1], [0, -1200], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const pScale = interpolate(pProgress, [0, 0.1, 1], [0, p.scale, 0.5 * p.scale], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const pOpacity = interpolate(pProgress, [0, 0.1, 0.9, 1], [0, 1, 0.8, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          // Determine particle shadow/color type
          let shadowColor = '0 0 8px #2ff3e0';
          if (p.colorType === 1) shadowColor = '0 0 8px #ff6b6b';
          else if (p.colorType === 2) shadowColor = '0 0 8px #ffb86c';

          const dotStyle: React.CSSProperties = {
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            left: `${p.left}%`,
            bottom: '-10px',
            transform: `translateY(${pY}px) scale(${pScale})`,
            opacity: pOpacity,
            boxShadow: shadowColor,
          };

          return <div key={p.id} style={dotStyle} />;
        })}
      </div>

      {/* Center Glass Panel */}
      <div style={panelStyle}>
        <div style={panelSweepStyle} />
        <div style={avatarStyle}>
          <div style={avatarInnerStyle}>▶</div>
          <span style={ringStyle} />
        </div>
        <div style={infoStyle}>
          <h1 style={h1Style}>
            Suka Video Ini?<br />
            <span style={{ color: '#2ff3e0' }}>Yuk Subscribe!</span>
          </h1>
          <span style={subBtnStyle}>SUBSCRIBE</span>
        </div>
      </div>

      {/* Bottom Thumbnail Slots */}
      <div style={getSlotStyle(true, leftOpacity, leftY)}>
        <div style={slotShimmerStyle} />
        <div style={playStyle}>▶</div>
      </div>
      <div style={getSlotStyle(false, rightOpacity, rightY)}>
        <div style={slotShimmerStyle} />
        <div style={playStyle}>▶</div>
      </div>

      {/* Vignette Overlay */}
      <div style={vignetteStyle} />
    </div>
  );
};

export default AuroraGlassEndscreen;
// END_OF_FILE