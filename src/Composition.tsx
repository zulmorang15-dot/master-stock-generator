import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Perfectly deterministic particle setups to support smooth looping (all durations must divide 600 perfectly)
const PARTICLES = [
  { id: 1, left: 8, duration: 150, delay: 35, scale: 1.2, colorType: 0 },
  { id: 2, left: 14, duration: 200, delay: 110, scale: 0.8, colorType: 1 },
  { id: 3, left: 22, duration: 300, delay: 215, scale: 1.5, colorType: 2 },
  { id: 4, left: 29, duration: 120, delay: 15, scale: 0.9, colorType: 0 },
  { id: 5, left: 35, duration: 150, delay: 85, scale: 1.1, colorType: 1 },
  { id: 6, left: 41, duration: 200, delay: 45, scale: 1.6, colorType: 2 },
  { id: 7, left: 47, duration: 300, delay: 160, scale: 0.7, colorType: 0 },
  { id: 8, left: 54, duration: 120, delay: 95, scale: 1.3, colorType: 1 },
  { id: 9, left: 60, duration: 150, delay: 125, scale: 1.0, colorType: 2 },
  { id: 10, left: 66, duration: 200, delay: 5, scale: 1.4, colorType: 0 },
  { id: 11, left: 73, duration: 300, delay: 280, scale: 0.6, colorType: 1 },
  { id: 12, left: 79, duration: 120, delay: 40, scale: 1.2, colorType: 2 },
  { id: 13, left: 85, duration: 150, delay: 65, scale: 1.1, colorType: 0 },
  { id: 14, left: 92, duration: 200, delay: 175, scale: 1.7, colorType: 1 },
  { id: 15, left: 11, duration: 300, delay: 90, scale: 0.8, colorType: 2 },
  { id: 16, left: 19, duration: 120, delay: 70, scale: 1.3, colorType: 0 },
  { id: 17, left: 26, duration: 150, delay: 145, scale: 1.0, colorType: 1 },
  { id: 18, left: 33, duration: 200, delay: 30, scale: 1.5, colorType: 2 },
  { id: 19, left: 38, duration: 300, delay: 220, scale: 0.9, colorType: 0 },
  { id: 20, left: 44, duration: 120, delay: 105, scale: 1.2, colorType: 1 },
  { id: 21, left: 51, duration: 150, delay: 55, scale: 0.5, colorType: 2 },
  { id: 22, left: 57, duration: 200, delay: 135, scale: 1.4, colorType: 0 },
  { id: 23, left: 64, duration: 300, delay: 15, scale: 1.1, colorType: 1 },
  { id: 24, left: 70, duration: 120, delay: 85, scale: 1.6, colorType: 2 },
  { id: 25, left: 77, duration: 150, delay: 115, scale: 0.7, colorType: 0 },
  { id: 26, left: 83, duration: 200, delay: 195, scale: 1.3, colorType: 1 },
  { id: 27, left: 89, duration: 300, delay: 50, scale: 1.0, colorType: 2 },
  { id: 28, left: 95, duration: 120, delay: 25, scale: 1.5, colorType: 0 }
];

const AuroraGlassEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Scale calculations to support high fidelity responsive canvas without letterboxes
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Background Grid motion (75 frames = 2.5 seconds loop)
  const gridFrame = frame % 75;
  const gridY = interpolate(gridFrame, [0, 75], [0, 50], { easing: Easing.linear });

  // Aurora floating motion math (deterministic trigonometry with seamless cycle over 600 frames)
  const float1X = Math.sin((frame / 600) * Math.PI * 2) * 8;
  const float1Y = Math.cos((frame / 600) * Math.PI * 2) * 12;
  const float1Scale = 1 + (Math.sin((frame / 600) * Math.PI * 2) + 1) * 0.075;

  const float2X = Math.sin((frame / 600) * Math.PI * 4) * -10;
  const float2Y = Math.cos((frame / 600) * Math.PI * 4) * -8;
  const float2Scale = 1 + (Math.sin((frame / 600) * Math.PI * 4) + 1) * 0.1;

  const float3X = Math.sin((frame / 600) * Math.PI * 2 + 1) * -6;
  const float3Y = Math.cos((frame / 600) * Math.PI * 2 + 1) * 10;
  const float3Scale = 0.9 + (Math.sin((frame / 600) * Math.PI * 2 + 1) + 1) * 0.1;

  // Central Glass Panel Entrance and Exit timeline mappings
  const panelOpacity = interpolate(frame, [0, 45, 550, 600], [0, 1, 1, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const panelScale = interpolate(frame, [0, 45, 550, 600], [0.85, 0.92, 0.92, 0.85], {
    easing: Easing.inOut(Easing.quad),
  });

  // Glossy Sweep inside Central Glass Panel (150 frames = 5s loop, divides 600 perfectly)
  const sweepFrame = frame % 150;
  const sweepProgress = interpolate(sweepFrame, [0, 90, 150], [200, -100, -100], {
    easing: Easing.inOut(Easing.quad),
  });

  // Conic-Gradient Color Rotation for Avatar (150 frames cycle)
  const avatarHue = interpolate(frame % 150, [0, 150], [0, 360], { easing: Easing.linear });

  // Expanding Pulse Ring from Avatar (75 frames cycle)
  const ringFrame = frame % 75;
  const ringScale = interpolate(ringFrame, [0, 75], [1, 1.5], { easing: Easing.out(Easing.quad) });
  const ringOpacity = interpolate(ringFrame, [0, 75], [0.9, 0], { easing: Easing.out(Easing.quad) });

  // Pulsing CTA Button (75 frames cycle)
  const btnFrame = frame % 75;
  const btnScale = interpolate(btnFrame, [0, 37.5, 75], [1, 1.05, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  const btnShadowBlur = interpolate(btnFrame, [0, 37.5, 75], [18, 32, 18], {
    easing: Easing.inOut(Easing.quad),
  });
  const btnShadowR = 255;
  const btnShadowG = interpolate(btnFrame, [0, 37.5, 75], [107, 184, 107], {
    easing: Easing.inOut(Easing.quad),
  });
  const btnShadowB = interpolate(btnFrame, [0, 37.5, 75], [107, 108, 107], {
    easing: Easing.inOut(Easing.quad),
  });
  const btnShadowA = interpolate(btnFrame, [0, 37.5, 75], [0.5, 0.9, 0.5], {
    easing: Easing.inOut(Easing.quad),
  });

  // Left Slot Timeline (staggered entrance, seamless exit)
  const slotLeftOpacity = interpolate(frame, [0, 15, 60, 540, 585, 600], [0, 0, 1, 1, 0, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const slotLeftY = interpolate(frame, [0, 15, 60, 540, 585, 600], [30, 30, 0, 0, 30, 30], {
    easing: Easing.inOut(Easing.quad),
  });

  // Right Slot Timeline (staggered entrance, seamless exit)
  const slotRightOpacity = interpolate(frame, [0, 25, 70, 530, 575, 600], [0, 0, 1, 1, 0, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const slotRightY = interpolate(frame, [0, 25, 70, 530, 575, 600], [30, 30, 0, 0, 30, 30], {
    easing: Easing.inOut(Easing.quad),
  });

  // Thumbnail Shimmering Overlay (120 frames cycle)
  const shimmerOpacity = interpolate(frame % 120, [0, 60, 120], [0.4, 0.9, 0.4], {
    easing: Easing.inOut(Easing.quad),
  });

  // CSS Styles built with Strict camelCase keys (no compiler crashing)
  const stageStyle: React.CSSProperties = {
    position: 'absolute',
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    background: 'radial-gradient(ellipse at 30% 20%, rgba(47, 243, 224, 0.12), transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(255, 107, 107, 0.14), transparent 55%), linear-gradient(160deg, #04141a 0%, #071f23 50%, #0a0d1a 100%)',
    boxShadow: '0 0 80px rgba(47, 243, 224, 0.15)',
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
  };

  const auroraBase: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(70px)',
    opacity: 0.55,
    mixBlendMode: 'screen',
  };

  const a1Style: React.CSSProperties = {
    ...auroraBase,
    width: '45%',
    aspectRatio: '1',
    background: '#2ff3e0',
    top: '-10%',
    left: '5%',
    transform: `translate(${float1X}%, ${float1Y}%) scale(${float1Scale})`,
  };

  const a2Style: React.CSSProperties = {
    ...auroraBase,
    width: '40%',
    aspectRatio: '1',
    background: '#ff6b6b',
    bottom: '-15%',
    right: '8%',
    transform: `translate(${float2X}%, ${float2Y}%) scale(${float2Scale})`,
  };

  const a3Style: React.CSSProperties = {
    ...auroraBase,
    width: '30%',
    aspectRatio: '1',
    background: '#ffb86c',
    top: '40%',
    left: '40%',
    transform: `translate(${float3X}%, ${float3Y}%) scale(${float3Scale})`,
  };

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%) perspective(400px) rotateX(62deg)',
    width: '200%',
    height: '55%',
    backgroundImage: 'linear-gradient(rgba(47, 243, 224, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(47, 243, 224, 0.25) 1px, transparent 1px)',
    backgroundSize: '50px 50px',
    transformOrigin: 'bottom center',
    WebkitMaskImage: 'linear-gradient(transparent, #000 70%)',
    maskImage: 'linear-gradient(transparent, #000 70%)',
    backgroundPositionY: `${gridY}px`,
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${panelScale})`,
    width: '58%',
    padding: '43px 96px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '22px',
    WebkitBackdropFilter: 'blur(14px)',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '55px',
    opacity: panelOpacity,
    overflow: 'hidden',
  };

  const sweepStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '22px',
    background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 48%, transparent 60%)',
    backgroundSize: '250% 100%',
    backgroundPosition: `${sweepProgress}% 0`,
    pointerEvents: 'none',
  };

  const avatarStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '312px',
    height: '312px',
    borderRadius: '50%',
    background: 'conic-gradient(from 0deg, #2ff3e0, #ffb86c, #ff6b6b, #2ff3e0)',
    padding: '4px',
    position: 'relative',
    filter: `hue-rotate(${avatarHue}deg)`,
    boxShadow: '0 0 30px rgba(47,243,224,0.5), 0 0 50px rgba(255,107,107,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: '58px',
    textShadow: '0 0 12px #2ff3e0',
  };

  const ringStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '-10px',
    borderRadius: '50%',
    border: '2px solid rgba(47,243,224,0.7)',
    transform: `scale(${ringScale})`,
    opacity: ringOpacity,
    pointerEvents: 'none',
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  };

  const h1Style: React.CSSProperties = {
    color: '#fff',
    fontSize: '50px',
    fontWeight: 800,
    letterSpacing: '1px',
    lineHeight: 1.1,
    marginBottom: '15px',
    textShadow: '0 0 18px rgba(47,243,224,0.4)',
  };

  const subBtnStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '15px 45px',
    background: 'linear-gradient(135deg, #ff6b6b, #ffb86c)',
    color: '#1a0a0a',
    fontWeight: 800,
    letterSpacing: '2px',
    fontSize: '26px',
    borderRadius: '40px',
    boxShadow: `0 0 ${btnShadowBlur}px rgba(${btnShadowR}, ${btnShadowG}, ${btnShadowB}, ${btnShadowA})`,
    transform: `scale(${btnScale})`,
    position: 'relative',
  };

  const slotBaseStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '65px',
    width: '500px',
    height: '281px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    WebkitBackdropFilter: 'blur(6px)',
    backdropFilter: 'blur(6px)',
    overflow: 'hidden',
  };

  const slotLeftStyle: React.CSSProperties = {
    ...slotBaseStyle,
    left: '96px',
    opacity: slotLeftOpacity,
    transform: `translateY(${slotLeftY}px)`,
  };

  const slotRightStyle: React.CSSProperties = {
    ...slotBaseStyle,
    right: '96px',
    opacity: slotRightOpacity,
    transform: `translateY(${slotRightY}px)`,
  };

  const slotShimmerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(47,243,224,0.18), rgba(255,107,107,0.18))',
    opacity: shimmerOpacity,
  };

  const slotPlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    width: '110px',
    height: '110px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0a2a2e',
    fontSize: '27px',
    boxShadow: '0 0 14px rgba(255,255,255,0.6)',
  };

  const particlesContainerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  };

  const vignetteStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
  };

  return (
    <div style={stageStyle}>
      {/* Background Aurora Blobs */}
      <div style={a1Style} />
      <div style={a2Style} />
      <div style={a3Style} />

      {/* Retro Grid */}
      <div style={gridStyle} />

      {/* Floating Particles Stream */}
      <div style={particlesContainerStyle}>
        {PARTICLES.map((p) => {
          const pFrame = (frame + p.delay) % p.duration;
          const progress = pFrame / p.duration;
          const yTranslation = interpolate(progress, [0, 1], [1100, -200], {
            easing: Easing.linear,
          });
          const op = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 0.8, 0], {
            easing: Easing.linear,
          });

          let pShadow = '0 0 8px #ff6b6b';
          if (p.colorType === 1) pShadow = '0 0 8px #ffb86c';
          if (p.colorType === 2) pShadow = '0 0 8px #2ff3e0';

          const dotStyle: React.CSSProperties = {
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#fff',
            left: `${p.left}%`,
            top: `${yTranslation}px`,
            opacity: op,
            transform: `scale(${p.scale})`,
            boxShadow: pShadow,
          };

          return <div key={p.id} style={dotStyle} />;
        })}
      </div>

      {/* Center Glass Panel */}
      <div style={panelStyle}>
        <div style={sweepStyle} />
        <div style={avatarStyle}>
          <div style={avatarInnerStyle}>▶</div>
          <span style={ringStyle} />
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

      {/* Bottom Thumbnail Slots */}
      <div style={slotLeftStyle}>
        <div style={slotShimmerStyle} />
        <div style={slotPlayStyle}>▶</div>
      </div>

      <div style={slotRightStyle}>
        <div style={slotShimmerStyle} />
        <div style={slotPlayStyle}>▶</div>
      </div>

      {/* Screen Vignette */}
      <div style={vignetteStyle} />
    </div>
  );
};

export default AuroraGlassEndscreen;
// END_OF_FILE