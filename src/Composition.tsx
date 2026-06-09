import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { useEffect, useState } from 'react';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const colorPalette = [
  { r: 0, g: 245, b: 255 },
  { r: 255, g: 0, b: 127 },
  { r: 112, g: 0, b: 255 },
];

const particleCount = 1500;
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2.0 * Math.PI;
  const phi = Math.acos(2.0 * v - 1.0);
  const r = 4.5;

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  particlePositions[i * 3] = x;
  particlePositions[i * 3 + 1] = y;
  particlePositions[i * 3 + 2] = z;

  const baseColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  particleColors[i * 3] = baseColor.r / 255;
  particleColors[i * 3 + 1] = baseColor.g / 255;
  particleColors[i * 3 + 2] = baseColor.b / 255;
}

const bgParticleCount = 800;
const bgPositions = new Float32Array(bgParticleCount * 3);
const bgColors = new Float32Array(bgParticleCount * 3);

for (let i = 0; i < bgParticleCount; i++) {
  bgPositions[i * 3] = (Math.random() - 0.5) * 40;
  bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 25;
  bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;

  const bgColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  bgColors[i * 3] = bgColor.r / 255 * 0.6;
  bgColors[i * 3 + 1] = bgColor.g / 255 * 0.6;
  bgColors[i * 3 + 2] = bgColor.b / 255 * 0.6;
}

const FuturisticDigitalSphere = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
  const judul = getInputProps().judul;
  const keywords = getInputProps().keywords;

  const pulse = interpolate(frame, [0, 10, 20], [1, 1.03, 1], {
    easing: Easing.inOut(Easing.quad),
  });

  const wireOpacity = interpolate(frame, [0, 10, 20], [0.2, 0.3, 0.2], {
    easing: Easing.inOut(Easing.quad),
  });

  const bgRotation = interpolate(frame, [0, 10, 20], [0, -0.02, 0], {
    easing: Easing.inOut(Easing.quad),
  });

  const particlePositionsUpdated = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositionsUpdated[i * 3] = particlePositions[i * 3];
    particlePositionsUpdated[i * 3 + 1] = particlePositions[i * 3 + 1];
    particlePositionsUpdated[i * 3 + 2] = particlePositions[i * 3 + 2];
  }

  const bgPositionsUpdated = new Float32Array(bgParticleCount * 3);
  for (let i = 0; i < bgParticleCount; i++) {
    bgPositionsUpdated[i * 3] = bgPositions[i * 3];
    bgPositionsUpdated[i * 3 + 1] = bgPositions[i * 3 + 1];
    bgPositionsUpdated[i * 3 + 2] = bgPositions[i * 3 + 2] + Math.sin(frame * 0.005 + bgPositions[i * 3] * 0.5) * 0.005;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#020208',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scaleFactor})`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <canvas
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transform: `rotateY(${frame * 0.15}deg) rotateX(${frame * 0.08}deg) scale(${pulse})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
              }}
            >
              {Array.from({ length: particleCount }, (_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${particlePositionsUpdated[i * 3 + 1]}px`,
                    left: `${particlePositionsUpdated[i * 3]}px`,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: `rgba(${particleColors[i * 3] * 255}, ${particleColors[i * 3 + 1] * 255}, ${particleColors[i * 3 + 2] * 255}, 1)`,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                opacity: wireOpacity,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100%',
                  height: '100%',
                  border: '1px solid #00f5ff',
                  borderRadius: '50%',
                }}
              />
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: `rotateZ(${bgRotation}deg)`,
            }}
          >
            {Array.from({ length: bgParticleCount }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${bgPositionsUpdated[i * 3 + 1]}px`,
                  left: `${bgPositionsUpdated[i * 3]}px`,
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: `rgba(${bgColors[i * 3] * 255}, ${bgColors[i * 3 + 1] * 255}, ${bgColors[i * 3 + 2] * 255}, 1)`,
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        >
          {judul}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '20px',
            fontSize: '18px',
            color: '#ffffff',
          }}
        >
          {keywords.split(',').map((keyword) => (
            <span
              key={keyword}
              style={{
                padding: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                marginRight: '10px',
              }}
            >
              {keyword.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FuturisticDigitalSphere;