import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// CONSTANTS
const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const PARTICLE_COUNT = 600;

// Deterministic Pseudo-Random Generator for Particles
const generateSeededParticles = (count: number) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const randX = Math.sin(i * 12.9898) * 43758.5453 % 1;
    const randY = Math.cos(i * 78.233) * 43758.5453 % 1;
    const randZ = Math.sin(i * 45.123) * 43758.5453 % 1;
    const isCyan = (randX + randY) > 0;
    particles.push({
      x: randX * 1600 - 800, // Range -800 to 800
      y: randY * 300 - 150,  // Range -150 to 150
      z: Math.abs(randZ) * 1000 + 100, // Range 100 to 1100
      color: isCyan ? '#00FFFF' : '#FF00FF',
    });
  }
  return particles;
};

const SEED_PARTICLES = generateSeededParticles(PARTICLE_COUNT);

// 3D Projection Math
const project = (
  x: number,
  y: number,
  z: number,
  cameraY: number,
  rotZ: number,
  width: number,
  height: number
) => {
  const rx = x;
  const ry = y - cameraY;
  const rz = z;

  if (rz <= 10) return null;

  const focal = 750;
  const px = (rx * focal) / rz;
  const py = (ry * focal) / rz;

  const cosR = Math.cos(rotZ);
  const sinR = Math.sin(rotZ);
  const rxRot = px * cosR - py * sinR;
  const ryRot = px * sinR + py * cosR;

  return {
    x: width / 2 + rxRot,
    y: height / 2 + ryRot,
  };
};

export const NeonHudTerrain = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const t = frame / 360; // 12 seconds loop progress (0 to 1)

  // Camera Motion (Symmetrical & Looping)
  const cameraY = Math.sin(t * Math.PI * 4) * 10;
  const cameraRotZ = Math.sin(t * Math.PI * 2) * 0.04;

  // Grid scrolling parameters
  const Z_STEP_CYCLE = 200; // Perfect multiple of grid line spacing
  const WAVE_FREQ = Math.PI / 100;

  // SVG Dash Offset Interpolations
  const strokeDashoffsetCyan = interpolate(frame, [0, 360], [2000, 0], {
    extrapolateRight: 'clamp',
  });
  const strokeDashoffsetMagenta = interpolate(frame, [0, 360], [0, -2000], {
    extrapolateRight: 'clamp',
  });
  const strokeDashoffsetCircleCyan = interpolate(frame, [0, 360], [1000, 0], {
    extrapolateRight: 'clamp',
  });
  const strokeDashoffsetCircleMagenta = interpolate(frame, [0, 360], [0, 1000], {
    extrapolateRight: 'clamp',
  });

  // Canvas drawing logic represented frame-by-frame
  const renderCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#050010';
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Grid Renderer
    const drawGrid = (yBase: number, color: string, isTop: boolean) => {
      // Longitudinal Lines (constant X)
      for (let x = -1000; x <= 1000; x += 100) {
        ctx.beginPath();
        let first = true;
        for (let z = 150; z <= 1500; z += 50) {
          const zPhys = z - t * Z_STEP_CYCLE;
          const waveHeight =
            Math.sin(x * WAVE_FREQ - t * Math.PI * 2) *
            Math.cos(zPhys * WAVE_FREQ) *
            45;
          const y = yBase + (isTop ? -waveHeight : waveHeight);
          const pt = project(x, y, z, cameraY, cameraRotZ, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
          if (pt) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        const opacity = 0.25;
        ctx.strokeStyle = color === 'cyan' ? `rgba(0, 255, 255, ${opacity})` : `rgba(255, 0, 255, ${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Lateral Lines (constant Z)
      for (let z = 150; z <= 1500; z += 100) {
        ctx.beginPath();
        let first = true;
        for (let x = -1000; x <= 1000; x += 50) {
          const zPhys = z - t * Z_STEP_CYCLE;
          const waveHeight =
            Math.sin(x * WAVE_FREQ - t * Math.PI * 2) *
            Math.cos(zPhys * WAVE_FREQ) *
            45;
          const y = yBase + (isTop ? -waveHeight : waveHeight);
          const pt = project(x, y, z, cameraY, cameraRotZ, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
          if (pt) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        const fog = Math.max(0, Math.min(1, (1400 - z) / 1000));
        const opacity = 0.25 * fog;
        ctx.strokeStyle = color === 'cyan' ? `rgba(0, 255, 255, ${opacity})` : `rgba(255, 0, 255, ${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    drawGrid(-100, 'cyan', false);
    drawGrid(100, 'magenta', true);

    // Particles Renderer
    SEED_PARTICLES.forEach((p) => {
      const wrappedZ = ((p.z - t * 1000 - 100) % 1000 + 1000) % 1000 + 100;
      const pt = project(p.x, p.y, wrappedZ, cameraY, cameraRotZ, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
      if (pt) {
        const fog = Math.max(0, Math.min(1, (1000 - wrappedZ) / 800)) * Math.min(1, (wrappedZ - 100) / 100);
        const size = (1 - wrappedZ / 1100) * 3 + 1.2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color === '#00FFFF' ? `rgba(0, 255, 255, ${fog * 0.8})` : `rgba(255, 0, 255, ${fog * 0.8})`;
        ctx.fill();
      }
    });
  };

  return (
    <div
      style={{
        backgroundColor: '#000000',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
          backgroundColor: '#050010',
        }}
      >
        {/* WebGL Emulation Canvas */}
        <canvas
          ref={renderCanvas}
          width={ORIGINAL_WIDTH}
          height={ORIGINAL_HEIGHT}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            zIndex: 1,
          }}
        />

        {/* Glitch Overlay Scanlines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(rgba(0,255,255,0.03) 50%, rgba(255,0,255,0.03) 50%)',
            backgroundSize: '100% 4px',
            zIndex: 1,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />

        {/* UI / HUD Layer */}
        <div
          id="ui-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {/* Left HUD Box */}
          <div
            style={{
              position: 'absolute',
              width: 640,
              height: 360,
              top: 300,
              left: 200,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#00FF00',
              }}
            />
            <svg
              style={{
                position: 'absolute',
                top: -10,
                left: -10,
                width: 'calc(100% + 20px)',
                height: 'calc(100% + 20px)',
                overflow: 'visible',
                zIndex: 3,
                filter: 'drop-shadow(0 0 8px #FF00FF) drop-shadow(0 0 15px #00FFFF)',
              }}
              viewBox="0 0 660 380"
            >
              <rect
                style={{
                  fill: 'none',
                  strokeWidth: 4,
                  strokeLinecap: 'square',
                  stroke: '#00FFFF',
                  strokeDasharray: '200 1800',
                  strokeDashoffset: strokeDashoffsetCyan,
                }}
                x="10"
                y="10"
                width="640"
                height="360"
              />
              <rect
                style={{
                  fill: 'none',
                  strokeWidth: 4,
                  strokeLinecap: 'square',
                  stroke: '#FF00FF',
                  strokeDasharray: '400 1600',
                  strokeDashoffset: strokeDashoffsetMagenta,
                }}
                x="6"
                y="6"
                width="648"
                height="368"
              />
              <circle cx="10" cy="10" r="4" fill="#00FFFF" />
              <circle cx="650" cy="10" r="4" fill="#00FFFF" />
              <circle cx="10" cy="370" r="4" fill="#00FFFF" />
              <circle cx="650" cy="370" r="4" fill="#00FFFF" />
            </svg>
          </div>

          {/* Right HUD Box */}
          <div
            style={{
              position: 'absolute',
              width: 640,
              height: 360,
              top: 300,
              right: 200,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#00FF00',
              }}
            />
            <svg
              style={{
                position: 'absolute',
                top: -10,
                left: -10,
                width: 'calc(100% + 20px)',
                height: 'calc(100% + 20px)',
                overflow: 'visible',
                zIndex: 3,
                filter: 'drop-shadow(0 0 8px #FF00FF) drop-shadow(0 0 15px #00FFFF)',
              }}
              viewBox="0 0 660 380"
            >
              <rect
                style={{
                  fill: 'none',
                  strokeWidth: 4,
                  strokeLinecap: 'square',
                  stroke: '#00FFFF',
                  strokeDasharray: '200 1800',
                  strokeDashoffset: strokeDashoffsetCyan,
                }}
                x="10"
                y="10"
                width="640"
                height="360"
              />
              <rect
                style={{
                  fill: 'none',
                  strokeWidth: 4,
                  strokeLinecap: 'square',
                  stroke: '#FF00FF',
                  strokeDasharray: '400 1600',
                  strokeDashoffset: strokeDashoffsetMagenta,
                }}
                x="6"
                y="6"
                width="648"
                height="368"
              />
              <circle cx="10" cy="10" r="4" fill="#FF00FF" />
              <circle cx="650" cy="10" r="4" fill="#FF00FF" />
              <circle cx="10" cy="370" r="4" fill="#FF00FF" />
              <circle cx="650" cy="370" r="4" fill="#FF00FF" />
            </svg>
          </div>

          {/* Bottom HUD Circle */}
          <div
            style={{
              position: 'absolute',
              width: 250,
              height: 250,
              bottom: 120,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#00FF00',
                borderRadius: '50%',
              }}
            />
            <svg
              style={{
                position: 'absolute',
                top: -10,
                left: -10,
                width: 'calc(100% + 20px)',
                height: 'calc(100% + 20px)',
                overflow: 'visible',
                zIndex: 3,
                filter: 'drop-shadow(0 0 8px #FF00FF) drop-shadow(0 0 15px #00FFFF)',
              }}
              viewBox="0 0 270 270"
            >
              <circle
                style={{
                  fill: 'none',
                  strokeWidth: 4,
                  strokeLinecap: 'square',
                  stroke: '#00FFFF',
                  strokeDasharray: '200 1800',
                  strokeDashoffset: strokeDashoffsetCircleCyan,
                }}
                cx="135"
                cy="135"
                r="125"
              />
              <circle
                style={{
                  fill: 'none',
                  strokeWidth: 4,
                  strokeLinecap: 'square',
                  stroke: '#FF00FF',
                  strokeDasharray: '400 1600',
                  strokeDashoffset: strokeDashoffsetCircleMagenta,
                }}
                cx="135"
                cy="135"
                r="130"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeonHudTerrain;
// END_OF_FILE