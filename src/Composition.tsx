import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const FuturisticDigitalSphere = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  const colorPalette = [
    { r: 0, g: 245, b: 255 }, // Cyan neon
    { r: 255, g: 0, b: 127 }, // Pink/Magenta neon
    { r: 112, g: 0, b: 255 }, // Ungu elektrik
  ];

  const particleCount = 1500;
  const particlePositions = new Float32Array(particleCount * 3);
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
    bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10; // Berada di belakang objek utama

    const bgColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    bgColors[i * 3] = bgColor.r / 255 * 0.6; // Dibuat sedikit lebih redup agar kontras
    bgColors[i * 3 + 1] = bgColor.g / 255 * 0.6;
    bgColors[i * 3 + 2] = bgColor.b / 255 * 0.6;
  }

  const pulse = interpolate(
    frame,
    [0, 100],
    [1, 1.03],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolate: 'clamp',
    }
  );

  const wireOpacity = interpolate(
    frame,
    [0, 100],
    [0.2, 0.3],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolate: 'clamp',
    }
  );

  const bgZ = interpolate(
    frame,
    [0, 100],
    [0, Math.PI * 2],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolate: 'clamp',
    }
  );

  const judul = 'Futuristic Digital Sphere';
  const keywords = 'futuristic, digital, sphere, neon, particles';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center',
        backgroundColor: '#020208',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          overflow: 'hidden',
          boxSizing: 'border-box',
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
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotateY(${interpolate(
                frame,
                [0, 100],
                [0, Math.PI * 2],
                {
                  easing: Easing.bezier(0.4, 0, 0.2, 1),
                  extrapolate: 'clamp',
                }
              )}) rotateX(${interpolate(
                frame,
                [0, 100],
                [0, Math.PI * 2],
                {
                  easing: Easing.bezier(0.4, 0, 0.2, 1),
                  extrapolate: 'clamp',
                }
              )}) scale(${pulse})`,
              transformStyle: 'preserve-3d',
            }}
          >
            {Array.from({ length: particleCount }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: `rgba(${particleColors[i * 3] * 255}, ${particleColors[i * 3 + 1] * 255}, ${particleColors[i * 3 + 2] * 255}, 1)`,
                  left: `${particlePositions[i * 3]}px`,
                  top: `${particlePositions[i * 3 + 1]}px`,
                  transform: `translateZ(${particlePositions[i * 3 + 2]}px)`,
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                border: '1px solid #00f5ff',
                borderRadius: '50%',
                opacity: wireOpacity,
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: bgParticleCount }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: `rgba(${bgColors[i * 3] * 255}, ${bgColors[i * 3 + 1] * 255}, ${bgColors[i * 3 + 2] * 255}, 1)`,
                  left: `${bgPositions[i * 3]}px`,
                  top: `${bgPositions[i * 3 + 1]}px`,
                  transform: `translateZ(${bgPositions[i * 3 + 2]}px) rotateZ(${bgZ})`,
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
            <span key={keyword} style={{ marginRight: '10px' }}>
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FuturisticDigitalSphere;