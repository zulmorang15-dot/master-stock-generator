import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const TAPE_TEXT = "SUBSCRIBE TO MY CHANNEL! ";
const BG_WORDS = "SUBSCRIBE TO MY CHANNEL! ";

const bgRowsCount = Array.from({ length: 25 }, (_, i) => i);

const tapeSpanStyle: React.CSSProperties = {
  fontSize: "65px",
  fontWeight: 900,
  color: "#2a1f3a",
  letterSpacing: "2px",
  padding: "0 23px",
  WebkitTextStroke: "1px rgba(0,0,0,0.2)",
};

const tapeStyle: React.CSSProperties = {
  position: "absolute",
  left: "-20%",
  width: "140%",
  height: "106px",
  backgroundColor: "#f2f021",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
};

const BgRow: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const progress = (frame / (fps * 12)) % 1;
  const translatePercent = interpolate(progress, [0, 1], [0, -50]);
  const singleBlock = Array(8).fill(BG_WORDS).join("");

  return (
    <div
      style={{
        whiteSpace: "nowrap",
        fontSize: "42px",
        fontWeight: 900,
        color: "#1a1228",
        letterSpacing: "2px",
        lineHeight: "2.6",
        display: "flex",
        width: "max-content",
        transform: `translateX(${translatePercent}%)`,
      }}
    >
      <span>{singleBlock}</span>
      <span>{singleBlock}</span>
    </div>
  );
};

const Tape: React.FC<{
  style?: React.CSSProperties;
  reverse?: boolean;
  frame: number;
}> = ({ style, reverse, frame }) => {
  const { fps } = useVideoConfig();
  const progress = (frame / (fps * 12)) % 1;
  const translatePercent = reverse
    ? interpolate(progress, [0, 1], [-50, 0])
    : interpolate(progress, [0, 1], [0, -50]);

  const singleBlock = Array(12).fill(TAPE_TEXT).join("");

  return (
    <div style={{ ...tapeStyle, ...style }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          whiteSpace: "nowrap",
          transform: `translateX(${translatePercent}%)`,
          width: "max-content",
        }}
      >
        <span style={tapeSpanStyle}>{singleBlock}</span>
        <span style={tapeSpanStyle}>{singleBlock}</span>
      </div>
    </div>
  );
};

export const YouTubeOutroDiagonalTape: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const circleFloatProgress = (frame % (fps * 4)) / (fps * 4);
  const circleTranslateY = interpolate(
    circleFloatProgress,
    [0, 0.5, 1],
    [0, -20, 0],
    {
      easing: Easing.inOut(Easing.quad),
    }
  );

  const videoFloatProgress = (frame % (fps * 3)) / (fps * 3);
  const videoTranslateY = interpolate(
    videoFloatProgress,
    [0, 0.5, 1],
    [0, -20, 0],
    {
      easing: Easing.inOut(Easing.quad),
    }
  );

  const pulseProgress = (frame % (fps * 2)) / (fps * 2);
  const pulseScale = interpolate(
    pulseProgress,
    [0, 0.5, 1],
    [1, 1.06, 1],
    {
      easing: Easing.inOut(Easing.quad),
    }
  );

  const followPulseProgress = ((frame + (fps * 0.5)) % (fps * 2)) / (fps * 2);
  const followPulseScale = interpolate(
    followPulseProgress,
    [0, 0.5, 1],
    [1, 1.06, 1],
    {
      easing: Easing.inOut(Easing.quad),
    }
  );

  const sceneStyle: React.CSSProperties = {
    position: "absolute",
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    top: "50%",
    left: "50%",
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: "center center",
    overflow: "hidden",
    background: "repeating-linear-gradient(135deg, #4a3a5e 0px, #4a3a5e 38px, #463658 38px, #463658 76px)",
    fontFamily: "'Arial Black', 'Arial', sans-serif",
  };

  const bgTextStyle: React.CSSProperties = {
    position: "absolute",
    inset: "-40%",
    transform: "rotate(-45deg)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    pointerEvents: "none",
    opacity: 0.12,
  };

  const tapeLayerStyle: React.CSSProperties = {
    position: "absolute",
    inset: "-30%",
    transform: "rotate(-30deg)",
    pointerEvents: "none",
  };

  const circleStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "19%",
    width: "403px",
    height: "403px",
    background: "radial-gradient(circle at 35% 30%, #ff66e0, #ff35d8 70%, #e01ec0)",
    borderRadius: "50%",
    boxShadow: "0 0 70px rgba(255,53,216,0.6), 0 20px 60px rgba(0,0,0,0.4)",
    transform: `translate(-50%, -50%) translateY(${circleTranslateY}px)`,
  };

  const videoBoxStyle: React.CSSProperties = {
    position: "absolute",
    top: "30%",
    right: "7%",
    width: "691px",
    height: "454px",
    background: "linear-gradient(135deg, #ff66e0, #ff35d8 60%, #e01ec0)",
    boxShadow: "0 0 70px rgba(255,53,216,0.5), 0 24px 70px rgba(0,0,0,0.45)",
    transform: `translateY(${videoTranslateY}px)`,
  };

  const bracketBeforeStyle: React.CSSProperties = {
    position: "absolute",
    width: "30px",
    height: "30px",
    border: "6px solid #ff35d8",
    top: "-12px",
    left: "-12px",
    borderRight: "none",
    borderBottom: "none",
  };

  const bracketAfterStyle: React.CSSProperties = {
    position: "absolute",
    width: "30px",
    height: "30px",
    border: "6px solid #ff35d8",
    bottom: "-12px",
    right: "-12px",
    borderLeft: "none",
    borderTop: "none",
  };

  const checkLabelStyle: React.CSSProperties = {
    position: "absolute",
    top: "49%",
    left: "43%",
    transform: `translate(-50%, -50%) scale(${pulseScale})`,
    background: "#ff35d8",
    color: "#fff",
    fontSize: "20px",
    fontWeight: 900,
    textAlign: "center",
    padding: "10px 21px",
    borderRadius: "12px",
    lineHeight: "1.3",
    letterSpacing: "2px",
    boxShadow: "0 0 36px rgba(255,53,216,0.6)",
    zIndex: 5,
  };

  const followLabelStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "9%",
    right: "7%",
    transform: `scale(${followPulseScale})`,
    background: "#ff35d8",
    color: "#fff",
    fontSize: "29px",
    fontWeight: 900,
    padding: "10px 25px",
    borderRadius: "16px",
    letterSpacing: "2px",
    boxShadow: "0 0 40px rgba(255,53,216,0.7)",
    zIndex: 5,
  };

  return (
    <div style={sceneStyle}>
      <div style={bgTextStyle}>
        {bgRowsCount.map((index) => (
          <BgRow key={index} frame={frame} />
        ))}
      </div>

      <div style={tapeLayerStyle}>
        <Tape style={{ top: "8%" }} frame={frame} />
        <Tape style={{ top: "26%" }} reverse frame={frame} />
        <Tape style={{ top: "44%" }} frame={frame} />
        <Tape style={{ top: "62%" }} reverse frame={frame} />
        <Tape style={{ top: "80%" }} frame={frame} />
      </div>

      <div style={circleStyle} />
      
      <div style={videoBoxStyle}>
        <div style={bracketBeforeStyle} />
        <div style={bracketAfterStyle} />
      </div>

      <div style={checkLabelStyle}>
        CHECK LATEST
        <br />
        VIDEO!
      </div>
      <div style={followLabelStyle}>FOLLOW ME!</div>
    </div>
  );
};

export default YouTubeOutroDiagonalTape;
// END_OF_FILE