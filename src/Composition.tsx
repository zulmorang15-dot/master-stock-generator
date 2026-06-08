import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const DURATION = 12; // seconds
const FPS = 60;

const FuturisticDigitalSphere = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  const judul = getInputProps().judul;
  const keywords = getInputProps().keywords.split(',');

  const particleCount = 1500;
  const particleGeometry = {
    positions: new Float32Array(particleCount * 3),
    colors: new Float32Array(particleCount * 3),
  };

  const colorPalette = [
    { r: 0, g: 0.96, b: 1 }, // Cyan neon
    { r: 1, g: 0, b: 0.5 }, // Pink/Magenta neon
    { r: 0.43, g: 0, b: 1 }, // Ungu elektrik
  ];

  for (let i = 0; i < particleCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 4.5; // Radius bola

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    particleGeometry.positions[i * 3] = x;
    particleGeometry.positions[i * 3 + 1] = y;
    particleGeometry.positions[i * 3 + 2] = z;

    const baseColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    particleGeometry.colors[i * 3] = baseColor.r;
    particleGeometry.colors[i * 3 + 1] = baseColor.g;
    particleGeometry.colors[i * 3 + 2] = baseColor.b;
  }

  const createTicketTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  };

  const particleMaterial = {
    size: 0.12,
    map: createTicketTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  };

  const wireGeometry = new THREE.IcosahedronGeometry(4.5, 3);
  const wireMaterial = {
    color: { r: 0, g: 0.96, b: 1 },
    wireframe: true,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
  };

  const bgParticleCount = 800;
  const bgGeometry = {
    positions: new Float32Array(bgParticleCount * 3),
    colors: new Float32Array(bgParticleCount * 3),
  };

  for (let i = 0; i < bgParticleCount; i++) {
    bgGeometry.positions[i * 3] = (Math.random() - 0.5) * 40;
    bgGeometry.positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
    bgGeometry.positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;

    const bgColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    bgGeometry.colors[i * 3] = bgColor.r * 0.6;
    bgGeometry.colors[i * 3 + 1] = bgColor.g * 0.6;
    bgGeometry.colors[i * 3 + 2] = bgColor.b * 0.6;
  }

  const bgMaterial = {
    size: 0.25,
    map: createTicketTexture(),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  };

  const localFrame = frame % (FPS * DURATION);

  const sphereRotationY = interpolate(
    localFrame,
    [0, FPS * DURATION],
    [0, 0.15 * DURATION],
    {
      easing: Easing.linear,
    }
  );

  const sphereRotationX = interpolate(
    localFrame,
    [0, FPS * DURATION],
    [0, 0.08 * DURATION],
    {
      easing: Easing.linear,
    }
  );

  const pulse = interpolate(
    localFrame,
    [0, FPS * DURATION],
    [1, 1 + Math.sin(1.5 * DURATION) * 0.03],
    {
      easing: Easing.linear,
    }
  );

  const wireOpacity = interpolate(
    localFrame,
    [0, FPS * DURATION],
    [0.2, 0.2 + Math.sin(2 * DURATION) * 0.1],
    {
      easing: Easing.linear,
    }
  );

  const bgRotationZ = interpolate(
    localFrame,
    [0, FPS * DURATION],
    [0, -0.02 * DURATION],
    {
      easing: Easing.linear,
    }
  );

  const bgPositions = bgGeometry.positions;
  for (let i = 0; i < bgParticleCount; i++) {
    const x = bgPositions[i * 3];
    const y = bgPositions[i * 3 + 1];

    bgPositions[i * 3 + 2] = Math.sin(localFrame / FPS + x * 0.5) * 0.005;
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
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          perspective: 1000,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transform: `rotateX(${sphereRotationX}rad) rotateY(${sphereRotationY}rad) scale(${pulse})`,
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
            <canvas
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
              ref={(canvas) => {
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);

                  const particleCtx = ctx;
                  particleCtx.beginPath();
                  particleCtx.fillStyle = 'rgba(0, 0, 0, 1)';
                  particleCtx.globalCompositeOperation = 'source-over';

                  for (let i = 0; i < particleCount; i++) {
                    const x = particleGeometry.positions[i * 3] + canvas.width / 2;
                    const y = particleGeometry.positions[i * 3 + 1] + canvas.height / 2;

                    particleCtx.beginPath();
                    particleCtx.arc(x, y, 2, 0, 2 * Math.PI);
                    particleCtx.fillStyle = `rgba(${particleGeometry.colors[i * 3] * 255}, ${particleGeometry.colors[i * 3 + 1] * 255}, ${particleGeometry.colors[i * 3 + 2] * 255}, 1)`;
                    particleCtx.fill();
                  }

                  const wireCtx = ctx;
                  wireCtx.beginPath();
                  wireCtx.strokeStyle = `rgba(0, 96, 255, ${wireOpacity})`;
                  wireCtx.lineWidth = 2;
                  wireCtx.globalCompositeOperation = 'source-over';

                  for (let i = 0; i < wireGeometry.vertices.length; i++) {
                    const x = wireGeometry.vertices[i].x + canvas.width / 2;
                    const y = wireGeometry.vertices[i].y + canvas.height / 2;

                    wireCtx.beginPath();
                    wireCtx.arc(x, y, 2, 0, 2 * Math.PI);
                    wireCtx.fillStyle = `rgba(0, 96, 255, ${wireOpacity})`;
                    wireCtx.fill();

                    if (i < wireGeometry.vertices.length - 1) {
                      const nextX = wireGeometry.vertices[i + 1].x + canvas.width / 2;
                      const nextY = wireGeometry.vertices[i + 1].y + canvas.height / 2;

                      wireCtx.beginPath();
                      wireCtx.moveTo(x, y);
                      wireCtx.lineTo(nextX, nextY);
                      wireCtx.stroke();
                    }
                  }

                  const bgCtx = ctx;
                  bgCtx.beginPath();
                  bgCtx.fillStyle = 'rgba(0, 0, 0, 1)';
                  bgCtx.globalCompositeOperation = 'source-over';

                  for (let i = 0; i < bgParticleCount; i++) {
                    const x = bgPositions[i * 3] + canvas.width / 2;
                    const y = bgPositions[i * 3 + 1] + canvas.height / 2;

                    bgCtx.beginPath();
                    bgCtx.arc(x, y, 2, 0, 2 * Math.PI);
                    bgCtx.fillStyle = `rgba(${bgGeometry.colors[i * 3] * 255 * 0.6}, ${bgGeometry.colors[i * 3 + 1] * 255 * 0.6}, ${bgGeometry.colors[i * 3 + 2] * 255 * 0.6}, 1)`;
                    bgCtx.fill();
                  }
                }
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              fontSize: 24,
              fontFamily: 'Arial',
              color: 'white',
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
              fontFamily: 'Arial',
              color: 'white',
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
    </div>
  );
};

export default FuturisticDigitalSphere;