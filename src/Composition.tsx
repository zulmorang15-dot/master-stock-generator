import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const NUM_NODES = 25;
const NUM_PARTICLES = 50;

const NODES_DATA = Array.from({ length: NUM_NODES }).map((_, i) => ({
  x: Math.random() * 80 + 10,
  y: Math.random() * 80 + 10,
  id: i,
}));

const PARTICLES_DATA = Array.from({ length: NUM_PARTICLES }).map((_, i) => ({
  startNodeIndex: Math.floor(Math.random() * NODES_DATA.length),
  endNodeIndex: Math.floor(Math.random() * NODES_DATA.length),
  offset: Math.random() * 2 * Math.PI,
  speed: 0.5 + Math.random() * 0.5,
  size: 3 + Math.random() * 3,
  color: `hsl(${200 + Math.random() * 60}, 100%, 70%)`,
}));

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const loopProgress = (frame % durationInFrames) / durationInFrames;

  return (
    <AbsoluteFill>
      {NODES_DATA.map((node1, i) =>
        NODES_DATA.map((node2, j) => {
          if (i >= j) return null;

          const dist = Math.sqrt(
            Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2)
          );
          if (dist > 40) return null;

          const opacity = interpolate(
            Math.sin(loopProgress * 2 * Math.PI * 2 + i * 0.5),
            [-1, 1],
            [0.1, 0.4],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={`${node1.id}-${node2.id}`}
              style={{
                position: 'absolute',
                left: `${(node1.x + node2.x) / 2}%`,
                top: `${(node1.y + node2.y) / 2}%`,
                width: `${dist}%`,
                height: 2,
                backgroundColor: `rgba(100, 200, 255, ${opacity})`,
                transformOrigin: 'left center',
                transform: `translate(-50%, -50%) rotate(${Math.atan2(
                  node2.y - node1.y,
                  node2.x - node1.x
                ) *
                  (180 / Math.PI)}deg)`,
              }}
            />
          );
        })
      )}

      {NODES_DATA.map((node, i) => {
        const scale = interpolate(
          Math.sin(loopProgress * 2 * Math.PI * 3 + i * 0.3),
          [-1, 1],
          [0.8, 1.2],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const opacity = interpolate(
          Math.sin(loopProgress * 2 * Math.PI * 2 + i * 0.5),
          [-1, 1],
          [0.5, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        return (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: `rgb(100, 200, 255)`,
              boxShadow: `0 0 15px 5px rgba(100, 200, 255, ${opacity})`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              zIndex: 1,
            }}
          />
        );
      })}

      {PARTICLES_DATA.map((particle, i) => {
        const startNode = NODES_DATA[particle.startNodeIndex];
        const endNode = NODES_DATA[particle.endNodeIndex];
        if (!startNode || !endNode) return null;

        const p = (loopProgress * particle.speed + particle.offset / (2 * Math.PI)) % 1;

        const x = interpolate(p, [0, 1], [startNode.x, endNode.x]);
        const y = interpolate(p, [0, 1], [startNode.y, endNode.y]);

        const opacity = interpolate(p, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const scale = interpolate(p, [0, 0.5, 1], [0.5, 1.2, 0.5], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={`particle-${i}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size + 5}px ${particle.size}px ${particle.color}`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              zIndex: 2,
            }}
          />
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%)`,
          fontFamily: 'monospace',
          fontSize: '40px',
          color: 'rgba(255, 255, 255, 0.1)',
          opacity: interpolate(frame, [0, 30, durationInFrames - 30, durationInFrames], [0, 0.1, 0.1, 0], {easing: Easing.easeOutCubic}),
          textShadow: '0 0 10px rgba(255,255,255,0.2)',
          zIndex: 3,
        }}
      >
        DATA_STREAM
      </div>
    </AbsoluteFill>
  );
};
