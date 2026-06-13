import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React, { useMemo } from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLES = [
  { left: 5, duration: 150, delay: 12, scale: 1.2, color: '#ff6b6b' },
  { left: 12, duration: 200, delay: 45, scale: 0.8, color: '#ffb86c' },
  { left: 20, duration: 120, delay: 80, scale: 1.5, color: '#2ff3e0' },
  { left: 28, duration: 300, delay: 110, scale: 0.6, color: '#ff6b6b' },
  { left: 35, duration: 150, delay: 5, scale: 1.1, color: '#ffb86c' },
  { left: 42, duration: 200, delay: 190, scale: 1.4, color: '#2ff3e0' },
  { left: 50, duration: 100, delay: 30, scale: 0.9, color: '#2ff3e0' },
  { left: 58, duration: 300, delay: 250, scale: 1.6, color: '#ff6b6b' },
  { left: 65, duration: 150, delay: 95, scale: 0.7, color: '#ffb86c' },
  { left: 72, duration: 120, delay: 15, scale: 1.3, color: '#2ff3e0' },
  { left: 80, duration: 200, delay: 135, scale: 1.0, color: '#ff6b6b' },
  { left: 88, duration: 150, delay: 60, scale: 1.8, color: '#ffb86c' },
  { left: 95, duration: 100, delay: 75, scale: 0.5, color: '#2ff3e0' },
  { left: 8, duration: 300, delay: 150, scale: 1.3, color: '#ff6b6b' },
  { left: 18, duration: 150, delay: 40, scale: 0.9, color: '#ffb86c' },
  { left: 25, duration: 200, delay: 115, scale: 1.1, color: '#2ff3e0' },
  { left: 33, duration: 120, delay: 55, scale: 1.7, color: '#ff6b6b' },
  { left: 47, duration: 100, delay: 90, scale: 0.8, color: '#ffb86c' },
  { left: 55, duration: 150, delay: 130, scale: 1.2, color: '#2ff3e0' },
  { left: 62, duration: 300, delay: 20, scale: 1.5, color: '#ff6b6b' },
  { left: 70, duration: 200, delay: 85, scale: 0.6, color: '#ffb86c' },
  { left: 78, duration: 120, delay: 140, scale: 1.4, color: '#2ff3e0' },
  { left: 85, duration: 150, delay: 200, scale: 1.0, color: '#ff6b6b' },
  { left: 92, duration: 100, delay: 10, scale: 0.7, color: '#ffb86c' },
  { left: 15, duration: 300, delay: 50, scale: 1.2, color: '#2ff3e0' },
  { left: 40, duration: 200, delay: 175, scale: 1.6, color: '#ff6b6b' },
  { left: 68, duration: 150, delay: 110, scale: 0.9, color: '#ffb86c' },
  { left: 83, duration: 120, delay: 65, scale: 1.3, color: '#2ff3e0' }
];

const AuroraGlassEndscreen: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Aurora Float Animations
  // a1 - 300 frame cycle
  const a1Tx = interpolate(frame % 300, [0, 150, 300], [0, ORIGINAL_WIDTH * 0.45 * 0.08, 0], { easing: Easing.inOut(Easing.quad) });
  const a1Ty = interpolate(frame % 300, [0, 150, 300], [0, ORIGINAL_WIDTH * 0.45 * 0.12, 0], { easing: Easing.inOut(Easing.quad) });
  const a1Scale = interpolate(frame % 300, [0, 150, 300], [1, 1.15, 1], { easing: Easing.inOut(Easing.quad) });

  // a2 - 600 frame cycle
  const a2Tx = interpolate(frame % 600, [0, 300, 600], [0, -ORIGINAL_WIDTH * 0.40 * 0.10, 0], { easing: Easing.inOut(Easing.quad) });
  const a2Ty = interpolate(frame % 600, [0, 300, 600], [0, -ORIGINAL_WIDTH * 0.40 * 0.08, 0], { easing: Easing.inOut(Easing.quad) });
  const a2Scale = interpolate(frame % 600, [0, 300, 600], [1, 1.2, 1], { easing: Easing.inOut(Easing.quad) });

  // a3 - 300 frame cycle
  const a3Tx = interpolate(frame % 300, [0, 150, 300], [0, -ORIGINAL_WIDTH * 0.30 * 0.06, 0], { easing: Easing.inOut(Easing.quad) });
  const a3Ty = interpolate(frame % 300, [0, 150, 300], [0, ORIGINAL_WIDTH * 0.30 * 0.10, 0], { easing: Easing.inOut(Easing.quad) });
  const a3Scale = interpolate(frame % 300, [0, 150, 300], [0.9, 1.1, 0.9], { easing: Easing.inOut(Easing.quad) });

  // Grid Floor Scroll Animation (75 frames cycle)
  const gridY = interpolate(frame % 75, [0, 75], [0, 50], { easing: Easing.linear });

  // Central Glass Panel Animation (seamless loop with fade/scale in at start, fade/scale out at end)
  const panelOpacity = interpolate(frame, [0, 30, 570, 600], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const panelScale = interpolate(frame, [0, 30, 570, 600], [0.85 * 0.92, 0.92, 0.92, 0.85 * 0.92], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Panel sweep animation (150 frames cycle)
  const sweepPos = interpolate(frame % 150, [0, 90, 150], [200, -100, -100], { easing: Easing.inOut(Easing.quad) });

  // Avatar spin/glow animation (300 frames cycle)
  const hue = interpolate(frame % 300, [0, 300], [0, 360], { easing: Easing.linear });

  // Avatar Ring Out Animation (60 frames cycle)
  const ringScale = interpolate(frame % 60, [0, 60], [1, 1.5], { easing: Easing.out(Easing.quad) });
  const ringOpacity = interpolate(frame % 60, [0, 60], [0.9, 0], { easing: Easing.out(Easing.quad) });

  // Subscribe Button Pulse Animation (60 frames cycle)
  const btnScale = interpolate(frame % 60, [0, 30, 60], [1, 1.05, 1], { easing: Easing.inOut(Easing.quad) });
  const btnGlowRadius = interpolate(frame % 60, [0, 30, 60], [18, 32, 18], { easing: Easing.inOut(Easing.quad) });
  const btnGlowAlpha = interpolate(frame % 60, [0, 30, 60], [0.5, 0.9, 0.5], { easing: Easing.inOut(Easing.quad) });

  // Thumbnail slots entry/exit animations to match panel
  // Left slot (fade/translate with 9-frame delay)
  const leftSlotOpacity = interpolate(frame, [0, 9, 69, 540, 600], [0, 0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const leftSlotY = interpolate(frame, [0, 9, 69, 540, 600], [30, 30, 0, 0, 30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });

  // Right slot (fade/translate with 15-frame delay)
  const rightSlotOpacity = interpolate(frame, [0, 15, 75, 540, 600], [0, 0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rightSlotY = interpolate(frame, [0, 15, 75, 540, 600], [30, 30, 0, 0, 30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });

  // Slot shimmer animation (120 frames cycle)
  const shimmerOpacity = interpolate(frame % 120, [0, 60, 120], [0.4, 0.9, 0.4], { easing: Easing.inOut(Easing.quad) });

  // Particle Renderer
  const renderedParticles = useMemo(() => {
    return PARTICLES.map((p, i) => {
      const progress = ((frame + p.delay) % p.duration) / p.duration;
      const y = progress * -1200;
      const scale = interpolate(progress, [0, 0.1, 1], [0, p.scale, p.scale * 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

      const dotStyle: React.CSSProperties = {
        position: 'absolute',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: '#fff',
        left: `${p.left}%`,
        bottom: '-10px',
        opacity: opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        boxShadow: `0 0 8px ${p.color}`,
        pointerEvents: 'none',
      };

      return <div key={i} style={dotStyle} />;
    });
  }, [frame]);

  const outerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: '#02080a',
    position: 'relative',
    overflow: 'hidden',
  };

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
  };

  const auroraA1Style: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(70px)',
    opacity: 0.55,
    mixBlendMode: 'screen',
    width: '45%',
    aspectRatio: '1',
    background: '#2ff3e0',
    top: '-10%',
    left: '5%',
    transform: `translate(${a1Tx}px, ${a1Ty}px) scale(${a1Scale})`,
  };

  const auroraA2Style: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(70px)',
    opacity: 0.55,
    mixBlendMode: 'screen',
    width: '40%',
    aspectRatio: '1',
    background: '#ff6b6b',
    bottom: '-15%',
    right: '8%',
    transform: `translate(${a2Tx}px, ${a2Ty}px) scale(${a2Scale})`,
  };

  const auroraA3Style: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(70px)',
    opacity: 0.55,
    mixBlendMode: 'screen',
    width: '30%',
    aspectRatio: '1',
    background: '#ffb86c',
    top: '40%',
    left: '40%',
    transform: `translate(${a3Tx}px, ${a3Ty}px) scale(${a3Scale})`,
  };

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%) perspective(400px) rotateX(62deg)',
    width: '200%',
    height: '55%',
    backgroundImage: `
      linear-gradient(rgba(47,243,224,0.35) 1px, transparent 1px),
      linear-gradient(90deg, rgba(47,243,224,0.25) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    backgroundPosition: `center ${gridY}px`,
    transformOrigin: 'bottom center',
    WebkitMaskImage: 'linear-gradient(transparent, #000 70%)',
    maskImage: 'linear-gradient(transparent, #000 70%)',
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${panelScale})`,
    width: '58%',
    padding: '4% 5%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '22px',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '5%',
    opacity: panelOpacity,
  };

  const sweepStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '22px',
    background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 48%, transparent 60%)',
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
    filter: `hue-rotate(${hue}deg)`,
    boxShadow: '0 0 30px rgba(47,243,224,0.5), 0 0 50px rgba(255,107,107,0.3)',
  };

  const avatarAfterStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '4px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #0d2a2e, #061417)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '36px',
    textShadow: '0 0 12px #2ff3e0',
  };

  const ringStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '-10px',
    borderRadius: '50%',
    border: '2px solid rgba(47,243,224,0.7)',
    transform: `scale(${ringScale})`,
    opacity: ringOpacity,
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  };

  const h1Style: React.CSSProperties = {
    color: '#fff',
    fontSize: '38px',
    fontWeight: 800,
    letterSpacing: '1px',
    lineHeight: 1.1,
    marginBottom: '3%',
    textShadow: '0 0 18px rgba(47,243,224,0.4)',
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
  };

  const subBtnStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '3% 8%',
    background: 'linear-gradient(135deg, #ff6b6b, #ffb86c)',
    color: '#1a0a0a',
    fontWeight: 800,
    letterSpacing: '2px',
    fontSize: '20px',
    borderRadius: '40px',
    boxShadow: `0 0 ${btnGlowRadius}px rgba(255,107,107,${btnGlowAlpha})`,
    position: 'relative',
    transform: `scale(${btnScale})`,
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
  };

  const leftSlotStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '6%',
    width: '26%',
    aspectRatio: '16/9',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    backdropFilter: 'blur(6px)',
    overflow: 'hidden',
    opacity: leftSlotOpacity,
    transform: `translateY(${leftSlotY}px)`,
    left: '5%',
  };

  const rightSlotStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '6%',
    width: '26%',
    aspectRatio: '16/9',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    backdropFilter: 'blur(6px)',
    overflow: 'hidden',
    opacity: rightSlotOpacity,
    transform: `translateY(${rightSlotY}px)`,
    right: '5%',
  };

  const shimmerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(47,243,224,0.18), rgba(255,107,107,0.18))',
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
    background: 'rgba(255,255,255,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a2a2e',
    fontSize: '16px',
    boxShadow: '0 0 14px rgba(255,255,255,0.6)',
  };

  const vignetteStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
  };

  return (
    <div style={outerStyle}>
      <div style={stageStyle}>
        <div style={auroraA1Style} />
        <div style={auroraA2Style} />
        <div style={auroraA3Style} />

        <div style={gridStyle} />

        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {renderedParticles}
        </div>

        {/* Center glass panel */}
        <div style={panelStyle}>
          <div style={sweepStyle} />
          <div style={avatarStyle}>
            <span style={ringStyle} />
            <div style={avatarAfterStyle}>▶</div>
          </div>
          <div style={infoStyle}>
            <h1 style={h1Style}>
              Suka Video Ini?
              <br />
              <span style={{ color: '#2ff3e0' }}>Yuk Subscribe!</span>
            </h1>
            <span style={subBtnStyle}>SUBSCRIBE</span>
          </div>
        </div>

        {/* Bottom thumbnail slots */}
        <div style={leftSlotStyle}>
          <div style={shimmerStyle} />
          <div style={playStyle}>▶</div>
        </div>
        <div style={rightSlotStyle}>
          <div style={shimmerStyle} />
          <div style={playStyle}>▶</div>
        </div>

        <div style={vignetteStyle} />
      </div>
    </div>
  );
};

export default AuroraGlassEndscreen;
// END_OF_FILE