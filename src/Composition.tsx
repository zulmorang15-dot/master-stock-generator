import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import React from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const YoutubeOutroDiagonalTape: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Background text scrolling: moves -50% of the text width seamlessly over 12 seconds
  const bgTranslateX = interpolate(frame % 360, [0, 360], [0, -50]);

  // Tape animations (0% to -50% for standard, -50% to 0% for reverse)
  const tapeTranslateX = interpolate(frame % 360, [0, 360], [0, -50]);
  const tapeTranslateXReverse = interpolate(frame % 360, [0, 360], [-50, 0]);

  // Floats:
  // Circle float period: 4s (120 frames at 30fps)
  const floatCircleY = Math.sin((frame / 120) * 2 * Math.PI) * 10;
  // Video box float period: 3s (90 frames at 30fps) - fits 4 times in 12s
  const floatVideoY = Math.sin((frame / 90) * 2 * Math.PI) * 10;

  // Pulses:
  // Check label pulse: 2s period (60 frames at 30fps)
  const pulseScaleCenter = interpolate(
    Math.sin((frame / 60) * 2 * Math.PI),
    [-1, 1],
    [1, 1.06]
  );
  // Follow label pulse: 2s period with 0.5s (15 frames) offset
  const pulseScaleFollow = interpolate(
    Math.sin(((frame - 15) / 60) * 2 * Math.PI),
    [-1, 1],
    [1, 1.06]
  );

  // Repeated text structures for seamless scroll
  const tapeTextUnit = "SUBSCRIBE TO MY CHANNEL! ";
  const tapeHalfText = Array(6).fill(tapeTextUnit).join("");

  const bgTextUnit = "SUBSCRIBE TO MY CHANNEL! ";
  const bgHalfText = Array(5).fill(bgTextUnit).join("");

  // Styling maps
  const sceneStyle: React.CSSProperties = {
    position: 'absolute',
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    fontFamily: "'Arial Black', 'Arial', sans-serif",
    background: 'repeating-linear-gradient(135deg, #4a3a5e 0px, #4a3a5e 38px, #463658 38px, #463658 76px)',
  };

  const bgTextStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '-20%',
    transform: 'rotate(-45deg)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    pointerEvents: 'none',
    opacity: 0.12,
  };

  const tapeLayerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: '-30%',
    transform: 'rotate(-30deg)',
    pointerEvents: 'none',
  };

  const tapeStyleBase: React.CSSProperties = {
    position: 'absolute',
    left: '-20%',
    width: '140%',
    height: '105.6px', // 5.5vw equivalent
    backgroundColor: '#f2f021', // --yellow
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
  };

  const tapeSpanStyle: React.CSSProperties = {
    fontSize: '65.28px', // 3.4vw equivalent
    fontWeight: 900,
    color: '#2a1f3a', // --dark-text
    letterSpacing: '1px',
    padding: '0 23.04px', // 1.2vw equivalent
    WebkitTextStroke: '0.5px rgba(0,0,0,0.2)',
  };

  const circleStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '19%',
    width: '403.2px', // 21% of 1920
    height: '403.2px',
    transform: `translate(-50%, calc(-50% + ${floatCircleY}px))`,
    background: 'radial-gradient(circle at 35% 30%, #ff66e0, #ff35d8 70%, #e01ec0)',
    borderRadius: '50%',
    boxShadow: '0 0 35px rgba(255,53,216,0.6), 0 10px 30px rgba(0,0,0,0.4)',
  };

  const videoBoxStyle: React.CSSProperties = {
    position: 'absolute',
    top: '30%',
    right: '7%',
    width: '691.2px', // 36% of 1920
    height: '453.6px', // 42% of 1080
    transform: `translateY(${floatVideoY}px)`,
    background: 'linear-gradient(135deg, #ff66e0, #ff35d8 60%, #e01ec0)',
    boxShadow: '0 0 35px rgba(255,53,216,0.5), 0 12px 35px rgba(0,0,0,0.45)',
  };

  const bracketBeforeStyle: React.CSSProperties = {
    content: "''",
    position: 'absolute',
    width: '30px',
    height: '30px',
    border: '3px solid #ff35d8',
    top: '-10px',
    left: '-10px',
    borderRight: 'none',
    borderBottom: 'none',
  };

  const bracketAfterStyle: React.CSSProperties = {
    content: "''",
    position: 'absolute',
    width: '30px',
    height: '30px',
    border: '3px solid #ff35d8',
    bottom: '-10px',
    right: '-10px',
    borderLeft: 'none',
    borderTop: 'none',
  };

  const checkLabelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '49%',
    left: '43%',
    transform: `translate(-50%, -50%) scale(${pulseScaleCenter})`,
    backgroundColor: '#ff35d8',
    color: '#fff',
    fontSize: '19.2px', // 1vw equivalent
    fontWeight: 900,
    textAlign: 'center',
    padding: '9.6px 21.12px', // 0.5vw 1.1vw equivalent
    borderRadius: '6px',
    lineHeight: '1.3',
    letterSpacing: '1px',
    boxShadow: '0 0 18px rgba(255,53,216,0.6)',
    zIndex: 5,
  };

  const followLabelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '9%',
    right: '7%',
    transform: `scale(${pulseScaleFollow})`,
    backgroundColor: '#ff35d8',
    color: '#fff',
    fontSize: '28.8px', // 1.5vw equivalent
    fontWeight: 900,
    padding: '9.6px 24.96px', // 0.5vw 1.3vw equivalent
    borderRadius: '8px',
    letterSpacing: '1px',
    boxShadow: '0 0 20px rgba(255,53,216,0.7)',
    zIndex: 5,
  };

  return (
    <div style={sceneStyle}>
      {/* Background text */}
      <div style={bgTextStyle}>
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            style={{
              whiteSpace: 'nowrap',
              fontSize: '42.24px', // 2.2vw equivalent
              fontWeight: 900,
              color: '#1a1228',
              letterSpacing: '2px',
              lineHeight: '2.6',
              display: 'flex',
              transform: `translateX(${bgTranslateX}%)`,
            }}
          >
            <span>{bgHalfText}</span>
            <span>{bgHalfText}</span>
          </div>
        ))}
      </div>

      {/* Diagonal tape layer */}
      <div style={tapeLayerStyle}>
        {/* t1 */}
        <div style={{ ...tapeStyleBase, top: '8%' }}>
          <div style={{ display: 'flex', whiteSpace: 'nowrap', transform: `translateX(${tapeTranslateX}%)` }}>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
          </div>
        </div>
        {/* t2 (Reverse) */}
        <div style={{ ...tapeStyleBase, top: '26%' }}>
          <div style={{ display: 'flex', whiteSpace: 'nowrap', transform: `translateX(${tapeTranslateXReverse}%)` }}>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
          </div>
        </div>
        {/* t3 */}
        <div style={{ ...tapeStyleBase, top: '44%' }}>
          <div style={{ display: 'flex', whiteSpace: 'nowrap', transform: `translateX(${tapeTranslateX}%)` }}>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
          </div>
        </div>
        {/* t4 (Reverse) */}
        <div style={{ ...tapeStyleBase, top: '62%' }}>
          <div style={{ display: 'flex', whiteSpace: 'nowrap', transform: `translateX(${tapeTranslateXReverse}%)` }}>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
          </div>
        </div>
        {/* t5 */}
        <div style={{ ...tapeStyleBase, top: '80%' }}>
          <div style={{ display: 'flex', whiteSpace: 'nowrap', transform: `translateX(${tapeTranslateX}%)` }}>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
            <span style={tapeSpanStyle}>{tapeHalfText}</span>
          </div>
        </div>
      </div>

      {/* Pink elements */}
      <div style={circleStyle} />
      <div style={videoBoxStyle}>
        <div style={bracketBeforeStyle} />
        <div style={bracketAfterStyle} />
      </div>

      {/* Labels */}
      <div style={checkLabelStyle}>
        CHECK LATEST<br />VIDEO!
      </div>
      <div style={followLabelStyle}>
        FOLLOW ME!
      </div>
    </div>
  );
};

export default YoutubeOutroDiagonalTape;
// END_OF_FILE