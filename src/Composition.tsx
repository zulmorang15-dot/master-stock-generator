import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';

export const GlowingHexagon: React.FC<{ addTransparentScene?: boolean }> = ({
  addTransparentScene = false,
}) => {
  const { width, height, durationInFrames } = useVideoConfig();
  const rawFrame = useCurrentFrame();

  const ORIGINAL_WIDTH = 1920;
  const ORIGINAL_HEIGHT = 1080;

  const baseFrames = addTransparentScene ? Math.floor(durationInFrames / 2) : durationInFrames;
  const isTransparentSection = addTransparentScene && rawFrame >= baseFrames;
  const frame = isTransparentSection ? rawFrame - baseFrames : rawFrame;

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Rotate exactly 3 full times (1080 degrees) over the course of the video to ensure a seamless loop.
  const rotation = interpolate(frame, [0, baseFrames], [0, 1080]);

  const bgStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: isTransparentSection ? 'transparent' : '#02111b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const containerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Using CSS drop-shadow filter on a parent wrapper to preserve and correctly render
  // the high-fidelity glow effect, as browser clip-path masks traditional box-shadows.
  const glowWrapperStyle: React.CSSProperties = {
    filter: 'drop-shadow(0 0 40px #10b981)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: `rotate(${rotation}deg)`,
  };

  const hexStyle: React.CSSProperties = {
    width: '250px',
    height: '250px',
    backgroundColor: '#10b981',
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  };

  return (
    <div style={bgStyle}>
      <div style={containerStyle}>
        <div style={glowWrapperStyle}>
          <div id="hex" style={hexStyle} />
        </div>
      </div>
    </div>
  );
};

export default GlowingHexagon;
// END_OF_FILE