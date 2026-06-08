import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

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

  const rotationY = interpolate(frame, [0, 100], [0, Math.PI * 2], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  const rotationX = interpolate(frame, [0, 100], [0, Math.PI / 4], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  const pulse = interpolate(frame, [0, 50, 100], [1, 1.03, 1], {
    easing: EasingEaseOut(Easing.quadratic),
    extrapolate: 'clamp',
  });

  const wireOpacity = interpolate(frame, [0, 50, 100], [0.2, 0.3, 0.2], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  const bgRotationZ = interpolate(frame, [0, 100], [0, -Math.PI / 100], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  const bgParticlePositions = bgPositions.slice();
  for (let i = 0; i < bgParticleCount; i++) {
    bgParticlePositions[i * 3 + 2] += Math.sin(frame / 50 + bgParticlePositions[i * 3] * 0.5) * 0.005;
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
          boxShadow: '0 0 50px rgba(0, 229, 255, 0.15)',
          background: 'radial-gradient(circle at center, #0a0a26 0%, #020208 100%)',
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
            transform: `rotateY(${rotationY}) rotateX(${rotationX}) scale(${pulse})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          >
            {particlePositions.map((_, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: particlePositions[index * 3 + 1] + 'px',
                  left: particlePositions[index * 3] + 'px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: `rgb(${particleColors[index * 3] * 255}, ${particleColors[index * 3 + 1] * 255}, ${particleColors[index * 3 + 2] * 255})`,
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: wireOpacity,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
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
            transform: `rotateZ(${bgRotationZ})`,
          }}
        >
          {bgParticlePositions.map((_, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: bgParticlePositions[index * 3 + 1] + 'px',
                left: bgParticlePositions[index * 3] + 'px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: `rgb(${bgColors[index * 3] * 255}, ${bgColors[index * 3 + 1] * 255}, ${bgColors[index * 3 + 2] * 255})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FuturisticDigitalSphere;