import React from 'react';
import { useCurrentFrame, interpolate, AbsoluteFill } from 'remotion';

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const durationInFrames = 150; // A reasonable duration for a loop segment

  const createStream = (index: number) => {
    const delay = index * 10;
    const progress = interpolate(frame - delay, [0, durationInFrames], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'wrap' });

    const xPos = interpolate(progress, [0, 1], [-200, 1920 + 200]);
    const yPos = Math.sin(progress * Math.PI * 2 + index * 0.5) * 200 + 540; // Wavy path

    const scale = interpolate(progress, [0, 0.1, 0.9, 1], [0.5, 1, 1, 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const opacity = interpolate(progress, [0, 0.05, 0.95, 1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    const hue = interpolate(progress + index * 0.1, [0, 1], [240, 300]); // Shift hue slightly
    const color = `hsl(${hue}, 100%, 70%)`;

    return (
      <div
        key={index}
        style={{
          position: 'absolute',
          width: 200,
          height: 10,
          borderRadius: 5,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          boxShadow: `0 0 15px ${color}`,
          transform: `translate(${xPos}px, ${yPos}px) scaleX(${scale})`,
          opacity,
          filter: `blur(1px)`,
          zIndex: 10 + index,
        }}
      />
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A1A', overflow: 'hidden' }}>
      {Array.from({ length: 15 }).map((_, i) => createStream(i))}

      {/* Adding a subtle background grid/dots for context */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundImage: `radial-gradient(circle, #0F0F2F 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.1,
      }} />
    </AbsoluteFill>
  );
};
