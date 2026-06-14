import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const YoutubeOutro: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Moving Background Purple Gradient (12s = 360 frames cycle)
  const bgX = interpolate(
    frame,
    [0, 180, 360],
    [0, 100, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  // 2. Wave Slide Red (4s = 120 frames cycle)
  const localFrameRed = frame % 120;
  const waveRedX = interpolate(
    localFrameRed,
    [0, 120],
    [0, -25],
    { easing: Easing.linear }
  );

  // 3. Wave Slide Green (5s = 150 frames cycle)
  const localFrameGreen = frame % 150;
  const waveGreenX = interpolate(
    localFrameGreen,
    [0, 150],
    [0, -25],
    { easing: Easing.linear }
  );

  // 4. Subscribe Circle Pulse (2s = 60 frames cycle)
  const localFramePulse = frame % 60;
  const pulseSize = interpolate(
    localFramePulse,
    [0, 42, 60],
    [0, 33, 0],
    { easing: Easing.out(Easing.quad) }
  );
  const pulseOpacity = interpolate(
    localFramePulse,
    [0, 42, 60],
    [0.5, 0, 0],
    { easing: Easing.out(Easing.quad) }
  );

  // 5. Subscribe Button Blink (1.5s = 45 frames cycle)
  const localFrameBlink = frame % 45;
  const isBlinking = localFrameBlink >= 36 && localFrameBlink < 43; // ~80% to ~95%
  const subBtnBg = isBlinking ? '#fff' : '#000';
  const subBtnColor = isBlinking ? '#000' : '#fff';

  // 6. Video Boxes Glow (3s = 90 frames cycle)
  // Left Box Glow
  const localFrameLeft = frame % 90;
  const leftGlowSize = interpolate(
    localFrameLeft,
    [0, 45, 90],
    [0, 37.5, 0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const leftInsetGlow = interpolate(
    localFrameLeft,
    [0, 45, 90],
    [0, 30, 0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const leftBorderOpacity = interpolate(
    localFrameLeft,
    [0, 45, 90],
    [0.7, 1.0, 0.7],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Right Box Glow (Offset by 1.5s = 45 frames)
  const localFrameRight = (frame + 45) % 90;
  const rightGlowSize = interpolate(
    localFrameRight,
    [0, 45, 90],
    [0, 37.5, 0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const rightInsetGlow = interpolate(
    localFrameRight,
    [0, 45, 90],
    [0, 30, 0],
    { easing: Easing.inOut(Easing.quad) }
  );
  const rightBorderOpacity = interpolate(
    localFrameRight,
    [0, 45, 90],
    [0.7, 1.0, 0.7],
    { easing: Easing.inOut(Easing.quad) }
  );

  // 7. Play Buttons Pulse (2s = 60 frames cycle)
  const localFramePlay = frame % 60;
  const playScale = interpolate(
    localFramePlay,
    [0, 30, 60],
    [1, 1.2, 1],
    { easing: Easing.inOut(Easing.quad) }
  );
  const playOpacity = interpolate(
    localFramePlay,
    [0, 30, 60],
    [0.4, 1.0, 0.4],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Style configurations
  const stageStyle: React.CSSProperties = {
    position: 'absolute',
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    background: 'linear-gradient(125deg, #6a2c91, #7b2cd8, #4a2370, #8e35b5, #5a2580)',
    backgroundSize: '300% 300%',
    backgroundPosition: `${bgX}% 50%`,
    fontFamily: "'Arial Black', Arial, sans-serif",
  };

  const waveCircleStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-8%',
    left: '4%',
    width: '28%',
    aspectRatio: '1',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#ff3b6b',
  };

  const redSvgStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '-10%',
    width: '130%',
    height: '80%',
    transform: `translate(${waveRedX}%, -50%)`,
  };

  const greenCircleStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-18%',
    right: '2%',
    width: '30%',
    aspectRatio: '1',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#3ddc84',
  };

  const greenSvgStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '-10%',
    width: '130%',
    height: '100%',
    transform: `translateX(${waveGreenX}%)`,
  };

  const cornerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '8%',
    aspectRatio: '1',
    backgroundColor: '#fff',
    borderRadius: '0 100% 0 0',
    opacity: 0.95,
  };

  const subCircleStyle: React.CSSProperties = {
    position: 'absolute',
    top: '8%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '12%',
    aspectRatio: '1',
    borderRadius: '50%',
    border: '4px solid #fff',
    boxShadow: `0 0 0 ${pulseSize}px rgba(255, 255, 255, ${pulseOpacity})`,
  };

  const subBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: subBtnBg,
    color: subBtnColor,
    fontSize: '42px',
    fontWeight: 900,
    letterSpacing: '2px',
    padding: '12px 36px',
    whiteSpace: 'nowrap',
  };

  const leftBoxStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '8%',
    width: '36%',
    aspectRatio: '16/9',
    border: '3px solid',
    borderColor: `rgba(255, 255, 255, ${leftBorderOpacity})`,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    left: '9%',
    boxShadow: `0 0 ${leftGlowSize}px rgba(255, 255, 255, 0.8), inset 0 0 ${leftInsetGlow}px rgba(255, 255, 255, 0.15)`,
  };

  const rightBoxStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '8%',
    width: '36%',
    aspectRatio: '16/9',
    border: '3px solid',
    borderColor: `rgba(255, 255, 255, ${rightBorderOpacity})`,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    right: '9%',
    boxShadow: `0 0 ${rightGlowSize}px rgba(255, 255, 255, 0.8), inset 0 0 ${rightInsetGlow}px rgba(255, 255, 255, 0.15)`,
  };

  const playStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${playScale})`,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '24px 0 24px 40px',
    borderColor: 'transparent transparent transparent rgba(255, 255, 255, 0.5)',
    opacity: playOpacity,
  };

  return (
    <div style={stageStyle}>
      {/* Red wave circle */}
      <div style={waveCircleStyle}>
        <svg viewBox="0 0 200 200" preserveAspectRatio="none" style={redSvgStyle}>
          <g fill="none" stroke="#1a1a2e" strokeWidth="7">
            <path d="M0 20 Q 25 0 50 20 T 100 20 T 150 20 T 200 20 T 250 20" />
            <path d="M0 50 Q 25 30 50 50 T 100 50 T 150 50 T 200 50 T 250 50" />
            <path d="M0 80 Q 25 60 50 80 T 100 80 T 150 80 T 200 80 T 250 80" />
            <path d="M0 110 Q 25 90 50 110 T 100 110 T 150 110 T 200 110 T 250 110" />
            <path d="M0 140 Q 25 120 50 140 T 100 140 T 150 140 T 200 140 T 250 140" />
            <path d="M0 170 Q 25 150 50 170 T 100 170 T 150 170 T 200 170 T 250 170" />
          </g>
        </svg>
      </div>

      {/* Green wave circle */}
      <div style={greenCircleStyle}>
        <svg viewBox="0 0 200 200" preserveAspectRatio="none" style={greenSvgStyle}>
          <g fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="6">
            <path d="M0 30 Q 25 10 50 30 T 100 30 T 150 30 T 200 30 T 250 30" />
            <path d="M0 60 Q 25 40 50 60 T 100 60 T 150 60 T 200 60 T 250 60" />
            <path d="M0 90 Q 25 70 50 90 T 100 90 T 150 90 T 200 90 T 250 90" />
            <path d="M0 120 Q 25 100 50 120 T 100 120 T 150 120 T 200 120 T 250 120" />
            <path d="M0 150 Q 25 130 50 150 T 100 150 T 150 150 T 200 150 T 250 150" />
          </g>
        </svg>
      </div>

      {/* White bottom-left corner */}
      <div style={cornerStyle} />

      {/* Subscribe Circle & Button */}
      <div style={subCircleStyle} />
      <div style={subBtnStyle}>SUBSCRIBE</div>

      {/* Left Video Box */}
      <div style={leftBoxStyle}>
        <div style={playStyle} />
      </div>

      {/* Right Video Box */}
      <div style={rightBoxStyle}>
        <div style={playStyle} />
      </div>
    </div>
  );
};

export default YoutubeOutro;
// END_OF_FILE