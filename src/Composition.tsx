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

  // Seamless loop: 150 frames at 30fps
  const localFrame = frame % 150;
  const t = localFrame * (2 * Math.PI / 150);

  // Compute translateY and rotation
  const translateY = Math.sin(t) * 40;
  const rotateDeg = t * 40; // t in rad, but rotate expects degrees; original used t*40 as degrees

  // Scale factor for fullscreen fill
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Background style: transparent if in transparent section, else dark
  const backgroundStyle = isTransparentSection
    ? 'transparent'
    : '#0a0a12';

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
        backgroundColor: backgroundStyle,
      }}
    >
      <div
        id="box"
        style={{
          width: 120,
          height: 120,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
          boxShadow: '0 0 40px rgba(34,211,238,0.5)',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) rotate(${rotateDeg}deg)`,
        }}
      />
    </div>
  );
};

export default GlowingBox;