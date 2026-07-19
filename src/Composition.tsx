import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const GlowingBox: React.FC<{ addTransparentScene?: boolean }> = ({ addTransparentScene = false }) => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const rawFrame = useCurrentFrame();

  // Dual-scene transparent extension
  const baseFrames = addTransparentScene ? Math.floor(durationInFrames / 2) : durationInFrames;
  const isTransparentSection = addTransparentScene && rawFrame >= baseFrames;
  const frame = isTransparentSection ? rawFrame - baseFrames : rawFrame;

  // Seamless loop: 8 seconds at 30fps = 240 frames
  const totalFrames = 240;
  const localFrame = frame % totalFrames;

  // Scale to fill 16:9
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Animation parameters
  const translateY = interpolate(localFrame, [0, totalFrames], [0, 0], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Actually we need sin-based translation. Use interpolate with a custom mapping? Better to compute directly.
  // Use Math.sin with frame-based angle.
  const angle = (localFrame / totalFrames) * 2 * Math.PI;
  const yOffset = Math.sin(angle) * 40;
  const rotation = (localFrame / totalFrames) * 360; // degrees

  const wrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: isTransparentSection ? 'transparent' : '#0a0a12',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const boxStyle: React.CSSProperties = {
    width: 120,
    height: 120,
    borderRadius: 24,
    background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
    boxShadow: '0 0 40px rgba(34,211,238,0.5)',
    transform: `translateY(${yOffset}px) rotate(${rotation}deg)`,
  };

  return (
    <div style={wrapperStyle}>
      <div style={boxStyle} />
    </div>
  );
};

export default GlowingBox;
// END_OF_FILE