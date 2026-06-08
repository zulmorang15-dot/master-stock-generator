import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { getInputProps } from './input';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const colorPalette = [
  { r: 0, g: 255, b: 255 }, // Cyan neon
  { r: 255, g: 0, b: 127 }, // Pink/Magenta neon
  { r: 112, g: 0, b: 255 }, // Ungu elektrik
];

const particleCount = 1500;
const particleGeometry = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2.0 * Math.PI;
  const phi = Math.acos(2.0 * v - 1.0);
  const r = 4.5; // Radius bola

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  particleGeometry[i * 3] = x;
  particleGeometry[i * 3 + 1] = y;
  particleGeometry[i * 3 + 2] = z;

  const baseColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  particleColors[i * 3] = baseColor.r / 255;
  particleColors[i * 3 + 1] = baseColor.g / 255;
  particleColors[i * 3 + 2] = baseColor.b / 255;
}

const bgParticleCount = 800;
const bgGeometry = new Float32Array(bgParticleCount * 3);
const bgColors = new Float32Array(bgParticleCount * 3);

for (let i = 0; i < bgParticleCount; i++) {
  bgGeometry[i * 3] = (Math.random() - 0.5) * 40;
  bgGeometry[i * 3 + 1] = (Math.random() - 0.5) * 25;
  bgGeometry[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10; // Berada di belakang objek utama

  const bgColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  bgColors[i * 3] = bgColor.r / 255 * 0.6; // Dibuat sedikit lebih redup agar kontras
  bgColors[i * 3 + 1] = bgColor.g / 255 * 0.6;
  bgColors[i * 3 + 2] = bgColor.b / 255 * 0.6;
}

const cycleDuration = 8; // Durasi siklus animasi

export default function FuturisticDigitalSphere() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
  const judul = getInputProps().judul;
  const keywords = getInputProps().keywords.split(',');

  const sphereRotationY = interpolate(frame, [0, cycleDuration], [0, Math.PI * 2], {
    easing: Easing.linear,
  });
  const sphereRotationX = interpolate(frame, [0, cycleDuration], [0, Math.PI * 1.5], {
    easing: Easing.linear,
  });

  const pulse = interpolate(frame, [0, cycleDuration], [1, 1.03], {
    easing: Easing.sinusoidal,
  });

  const wireOpacity = interpolate(frame, [0, cycleDuration], [0.2, 0.3], {
    easing: Easing.sinusoidal,
  });

  const bgRotationZ = interpolate(frame, [0, cycleDuration], [0, -Math.PI * 2], {
    easing: Easing.linear,
  });

  const localFrame = frame % (cycleDuration * 30);

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
              transform: `rotateY(${sphereRotationY}rad) rotateX(${sphereRotationX}rad) scale(${pulse})`,
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
              {particleGeometry.map((_, index) => (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    top: particleGeometry[index * 3 + 1] + ORIGINAL_HEIGHT / 2,
                    left: particleGeometry[index * 3] + ORIGINAL_WIDTH / 2,
                    width: 10,
                    height: 10,
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
              }}
            >
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
                viewBox={`0 0 ${ORIGINAL_WIDTH} ${ORIGINAL_HEIGHT}`}
              >
                <g
                  style={{
                    transform: `rotateY(${sphereRotationY}rad) rotateX(${sphereRotationX}rad)`,
                  }}
                >
                  <polyline
                    points={`0,${ORIGINAL_HEIGHT / 2} ${ORIGINAL_WIDTH / 2},0 ${ORIGINAL_WIDTH},${ORIGINAL_HEIGHT / 2}`}
                    stroke="#00f5ff"
                    strokeWidth={2}
                    fill="none"
                  />
                </g>
              </svg>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: `rotateZ(${bgRotationZ}rad)`,
            }}
          >
            {bgGeometry.map((_, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: bgGeometry[index * 3 + 1] + ORIGINAL_HEIGHT / 2,
                  left: bgGeometry[index * 3] + ORIGINAL_WIDTH / 2,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: `rgb(${bgColors[index * 3] * 255}, ${bgColors[index * 3 + 1] * 255}, ${bgColors[index * 3 + 2] * 255})`,
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            fontSize: 24,
            fontWeight: 'bold',
            color: '#ffffff',
          }}
        >
          {judul}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 20,
            fontSize: 18,
            color: '#ffffff',
          }}
        >
          {keywords.map((keyword, index) => (
            <span key={index} style={{ marginRight: 10 }}>
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}