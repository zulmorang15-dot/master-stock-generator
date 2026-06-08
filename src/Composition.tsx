import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { z } from 'zod';

export const myCompSchema = z.object({
  titleText: z.string().default('Quantum Stream'),
});

interface MyCompositionProps {
  titleText: string;
}

const Node: React.FC<{ frame: number; config: any; index: number; total: number }> = ({ frame, config, index, total }) => {
  const normalizedFrame = frame / config.durationInFrames;
  const t = normalizedFrame * Math.PI * 2; // Loop from 0 to 2PI

  const offsetAngle = (index / total) * Math.PI * 2;
  
  const x = Math.sin(t + offsetAngle) * 150 + Math.cos(t * 0.5 + offsetAngle * 0.7) * 80;
  const y = Math.cos(t + offsetAngle * 1.5) * 150 + Math.sin(t * 0.5 + offsetAngle * 0.3) * 80;
  const z = Math.sin(t * 2 + offsetAngle * 2) * 60 - 100;
  
  const scale = interpolate(Math.sin(t * 3 + offsetAngle * 5), [-1, 1], [0.7, 1.3]);
  const opacity = interpolate(Math.sin(t * 4 + offsetAngle * 6), [-1, 1], [0.2, 0.9]);

  const colorHue = interpolate(t + offsetAngle, [0, Math.PI * 2], [200, 280], { extrapolateLeft: 'wrap', extrapolateRight: 'wrap' });

  return (
    <div
      style={{
        position: 'absolute',
        width: '15px',
        height: '15px',
        borderRadius: '50%',
        background: `radial-gradient(circle, hsl(${colorHue}, 100%, 75%) 0%, hsla(${colorHue}, 100%, 50%, 0) 70%)`,
        opacity,
        transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
        filter: `blur(2px)`,
        boxShadow: `0 0 18px hsla(${colorHue}, 100%, 65%, 0.9)`,
      }}
    />
  );
};

const Particle: React.FC<{ frame: number; config: any; index: number }> = ({ frame, config, index }) => {
  const normalizedFrame = frame / config.durationInFrames;
  const t = normalizedFrame * Math.PI * 2; // Loop from 0 to 2PI
  const offset = index * 0.13;

  const x = Math.sin(t * 1.2 + offset) * (180 + index * 5) + Math.cos(t * 0.7 + offset * 0.6) * (100 + index * 3);
  const y = Math.cos(t * 1.1 + offset * 1.5) * (180 + index * 5) + Math.sin(t * 0.8 + offset * 0.9) * (100 + index * 3);
  const z = interpolate(t + offset * 0.1, [0, Math.PI * 2], [-200, 200], { extrapolateLeft: 'wrap', extrapolateRight: 'wrap' });
  const size = interpolate(Math.sin(t * 3 + offset * 2), [-1, 1], [4, 10]);
  const opacity = interpolate(Math.sin(t * 5 + offset * 3), [-1, 1], [0.1, 0.7]);
  const blur = interpolate(Math.abs(z), [0, 200], [0, 4]);

  const colorHue = interpolate(t + offset, [0, Math.PI * 2], [240, 300], { extrapolateLeft: 'wrap', extrapolateRight: 'wrap' });

  return (
    <div
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `hsla(${colorHue}, 100%, 75%, 0.8)`,
        opacity,
        filter: `blur(${blur}px)`,
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
      }}
    />
  );
};

const StreamSegment: React.FC<{ frame: number; config: any; index: number }> = ({ frame, config, index }) => {
  const normalizedFrame = frame / config.durationInFrames;
  const t = normalizedFrame * Math.PI * 2;
  const offset = index * 0.07;

  const x = Math.sin(t * 0.9 + offset) * 200 + Math.cos(t * 0.4 + offset * 1.2) * 120;
  const y = Math.cos(t * 0.8 + offset * 0.8) * 200 + Math.sin(t * 0.3 + offset * 0.5) * 120;
  const z = Math.sin(t * 1.5 + offset * 1.8) * 70 - 150;

  const rotation = interpolate(t * 2 + offset * 3, [0, Math.PI * 2], [0, 360], { extrapolateLeft: 'wrap', extrapolateRight: 'wrap' });
  const scaleX = interpolate(Math.sin(t * 5 + offset * 4), [-1, 1], [0.8, 1.2]);
  const opacity = interpolate(Math.sin(t * 6 + offset * 5), [-1, 1], [0.15, 0.5]);

  const colorHue = interpolate(t + offset, [0, Math.PI * 2], [220, 260], { extrapolateLeft: 'wrap', extrapolateRight: 'wrap' });

  return (
    <div
      style={{
        position: 'absolute',
        width: '100px',
        height: '3px',
        background: `linear-gradient(90deg, transparent 0%, hsla(${colorHue}, 100%, 70%, 0.9) 50%, transparent 100%)`,
        opacity,
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotation}deg) rotateX(${rotation / 2}deg) scaleX(${scaleX})`,
        filter: `blur(0.8px)`,
      }}
    />
  );
};


const MyComposition: React.FC<MyCompositionProps> = ({ titleText }) => {
  const frame = useCurrentFrame();
  const config = useVideoConfig();

  const nodesCount = 12;
  const particlesCount = 40;
  const streamSegmentsCount = 20;

  const textEntranceProgress = spring({ 
    frame: frame - 10, 
    fps: config.fps, 
    config: { damping: 200, stiffness: 2000, mass: 2 }, 
    from: 0, 
    to: 1 
  });

  const textExitProgress = spring({
    frame: frame - (config.durationInFrames - 30), 
    fps: config.fps, 
    config: { damping: 200, stiffness: 2000, mass: 2 }, 
    from: 0, 
    to: 1 
  });

  const opacity = interpolate(textExitProgress, [0, 1], [1, 0]);
  const translateY = interpolate(textExitProgress, [0, 1], [0, -50]);
  const scale = interpolate(textEntranceProgress, [0, 1], [0.8, 1]);
  const blur = interpolate(textEntranceProgress, [0, 1], [10, 0]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '4em',
        fontFamily: 'Roboto Mono, monospace',
        fontWeight: 700,
        color: 'white',
        overflow: 'hidden',
        position: 'relative',
        perspective: '900px',
        textAlign: 'center'
      }}
    >
      {Array.from({ length: streamSegmentsCount }).map((_, i) => (
        <StreamSegment key={`stream-seg-${i}`} frame={frame} config={config} index={i} />
      ))}
      {Array.from({ length: nodesCount }).map((_, i) => (
        <Node key={`node-${i}`} frame={frame} config={config} index={i} total={nodesCount} />
      ))}
      {Array.from({ length: particlesCount }).map((_, i) => (
        <Particle key={`particle-${i}`} frame={frame} config={config} index={i} />
      ))}
      <h1
        style={{
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
          textShadow: '0 0 25px rgba(0,255,255,0.8), 0 0 50px rgba(0,255,255,0.4)',
          zIndex: 10,
          position: 'absolute'
        }}
      >
        {titleText}
      </h1>
    </div>
  );
};

export default MyComposition;