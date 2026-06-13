import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const YouTubeOutroTemplate: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Fullscreen 16:9 scaling logic
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Background Gradient loop (12 seconds)
  const bgX = interpolate(frame, [0, 180, 360], [0, 100, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  // Red Wave Circle slide (4 seconds loop)
  const localFrameRed = frame % (fps * 4);
  const redX = interpolate(localFrameRed, [0, fps * 4], [0, -25], {
    extrapolateRight: 'clamp',
  });

  // Green Wave Circle slide (Adjusted to 4 seconds for flawless 12s loop)
  const localFrameGreen = frame % (fps * 4);
  const greenX = interpolate(localFrameGreen, [0, fps * 4], [0, -25], {
    extrapolateRight: 'clamp',
  });

  // Subscribe Circle pulse (2 seconds loop)
  const localFramePulse = frame % (fps * 2);
  const pulseSpread = interpolate(localFramePulse, [0, fps * 1.4, fps * 2], [0, 33, 33]);
  const pulseOpacity = interpolate(localFramePulse, [0, fps * 1.4, fps * 2], [0.5, 0, 0]);

  // Subscribe Button blink (1.5 seconds loop)
  const localFrameBlink = frame % (fps * 1.5);
  const isBlinking = localFrameBlink >= (fps * 1.2) && localFrameBlink < (fps * 1.425);

  // Video Boxes glow (3 seconds loop)
  const localFrameLeft = frame % (fps * 3);
  const localFrameRight = (frame + (fps * 1.5)) % (fps * 3);

  const glowLeft = interpolate(localFrameLeft, [0, fps * 1.5, fps * 3], [0, 1, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const glowRight = interpolate(localFrameRight, [0, fps * 1.5, fps * 3], [0, 1, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  // Play button pulse (2 seconds loop)
  const localFramePlay = frame % (fps * 2);
  const playProgress = interpolate(localFramePlay, [0, fps * 1, fps * 2], [0, 1, 0], {
    easing: Easing.inOut(Easing.quad),
  });
  const playOpacity = 0.4 + playProgress * 0.6;
  const playScale = 1 + playProgress * 0.2;

  // Custom Styles
  const containerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
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
    transform: `translate(${redX}%, -50%)`,
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
    top: '0',
    left: '-10%',
    width: '130%',
    height: '100%',
    transform: `translateX(${greenX}%)`,
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
    boxShadow: `0 0 0 ${pulseSpread}px rgba(255, 255, 255, ${pulseOpacity})`,
  };

  const subBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: isBlinking ? '#fff' : '#000',
    color: isBlinking ? '#000' : '#fff',
    fontSize: '28px',
    fontWeight: 900,
    letterSpacing: '2px',
    padding: '8px 24px',
    whiteSpace: 'nowrap',
  };

  const getBoxStyle = (glowVal: number, side: 'left' | 'right'): React.CSSProperties => {
    return {
      position: 'absolute',
      bottom: '8%',
      width: '36%',
      aspectRatio: '16/9',
      border: `3px solid rgba(255, 255, 255, ${0.7 + glowVal * 0.3})`,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      boxShadow: `0 0 ${glowVal * 25}px rgba(255, 255, 255, ${0.2 + glowVal * 0.6}), inset 0 0 ${glowVal * 20}px rgba(255, 255, 255, ${glowVal * 0.15})`,
      left: side === 'left' ? '9%' : undefined,
      right: side === 'right' ? '9%' : undefined,
    };
  };

  const playStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${playScale})`,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '12px 0 12px 20px',
    borderColor: `transparent transparent transparent rgba(255, 255, 255, ${playOpacity})`,
  };

  return (
    <div style={containerStyle}>
      {/* Red Wave Circle */}
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

      {/* Green Wave Circle */}
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

      {/* White corner */}
      <div style={cornerStyle} />

      {/* Subscribe elements */}
      <div style={subCircleStyle} />
      <div style={subBtnStyle}>SUBSCRIBE</div>

      {/* Video boxes */}
      <div style={getBoxStyle(glowLeft, 'left')}>
        <div style={playStyle} />
      </div>
      <div style={getBoxStyle(glowRight, 'right')}>
        <div style={playStyle} />
      </div>
    </div>
  );
};

export default YouTubeOutroTemplate;
// END_OF_FILE