import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic seed generation for particles outside component function
const PARTICLE_COUNT = 250;
const SEED_PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  // Deterministic pseudo-random coordinates
  const r1 = Math.sin(i * 12.9898 + 437.58) * 43758.5453 % 1;
  const r2 = Math.sin(i * 78.233 + 241.12) * 43758.5453 % 1;
  const r3 = Math.sin(i * 45.123 + 903.45) * 43758.5453 % 1;
  return {
    x: (r1 - 0.5) * 1800,
    y: (r2 - 0.5) * 350,
    z: Math.abs(r3) * 1900 + 100, // Depth between 100 and 2000
    color: i % 2 === 0 ? '#00FFFF' : '#FF00FF',
  };
});

const SynthwaveHudViewport = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Synchronized camera paths mapping perfectly to 10s (600 frames at 60fps) loop
  const cameraRotateZ = Math.sin((frame / 600) * Math.PI * 2) * 0.05;
  const cameraPosY = Math.sin((frame / 600) * Math.PI * 4) * 12;

  const cosRot = Math.cos(cameraRotateZ);
  const sinRot = Math.sin(cameraRotateZ);
  const focalLength = 550;

  // Projection helper function
  const project = (x: number, y: number, z: number) => {
    const xRel = x;
    const yRel = y - cameraPosY;
    const zRel = z;

    // Camera roll matrix multiplication
    const xRot = xRel * cosRot - yRel * sinRot;
    const yRot = xRel * sinRot + yRel * cosRot;

    // Apply focal depth projection
    const px = (xRot * focalLength) / zRel + ORIGINAL_WIDTH / 2;
    const py = (yRot * focalLength) / zRel + ORIGINAL_HEIGHT / 2;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  };

  // Generate seamless looping grid geometry
  let bottomPath = '';
  let topPath = '';

  const xMin = -1400;
  const xMax = 1400;
  const xStep = 100;
  const zMin = 100;
  const zMax = 2100;
  const zStep = 100;

  // Loops perfectly because it shifts by exactly 2 full grid segments in 600 frames
  const zOffset = (frame / 600) * zStep * 2; 

  // Longitudinal lines (running front-to-back)
  for (let x = xMin; x <= xMax; x += xStep) {
    let bottomSubPath = '';
    let topSubPath = '';
    for (let zBase = zMin; zBase <= zMax; zBase += zStep) {
      const z = zBase - zOffset;
      if (z < 60) continue;
      
      const waveAngle = (frame / 600) * Math.PI * 2 * 2;
      const disp = Math.sin(x * 0.0035) * Math.cos(zBase * 0.0035 - waveAngle) * 45;
      
      const bPt = project(x, -115 + disp, z);
      const tPt = project(x, 115 - disp, z);
      
      if (bottomSubPath === '') {
        bottomSubPath = `M ${bPt}`;
        topSubPath = `M ${tPt}`;
      } else {
        bottomSubPath += ` L ${bPt}`;
        topSubPath += ` L ${tPt}`;
      }
    }
    bottomPath += ' ' + bottomSubPath;
    topPath += ' ' + topSubPath;
  }

  // Transverse lines (running left-to-right)
  for (let zBase = zMin; zBase <= zMax; zBase += zStep) {
    const z = zBase - zOffset;
    if (z < 60) continue;
    let bottomSubPath = '';
    let topSubPath = '';
    for (let x = xMin; x <= xMax; x += xStep) {
      const waveAngle = (frame / 600) * Math.PI * 2 * 2;
      const disp = Math.sin(x * 0.0035) * Math.cos(zBase * 0.0035 - waveAngle) * 45;

      const bPt = project(x, -115 + disp, z);
      const tPt = project(x, 115 - disp, z);

      if (bottomSubPath === '') {
        bottomSubPath = `M ${bPt}`;
        topSubPath = `M ${tPt}`;
      } else {
        bottomSubPath += ` L ${bPt}`;
        topSubPath += ` L ${tPt}`;
      }
    }
    bottomPath += ' ' + bottomSubPath;
    topPath += ' ' + topSubPath;
  }

  // Floating particles projection and deterministic loop wrap
  const projectedParticles = SEED_PARTICLES.map((p) => {
    let zParticle = p.z - (frame / 600) * 1900;
    if (zParticle < 50) {
      zParticle += 1900;
    }

    const xRel = p.x;
    const yRel = p.y - cameraPosY;
    const zRel = zParticle;

    const xRot = xRel * cosRot - yRel * sinRot;
    const yRot = xRel * sinRot + yRel * cosRot;

    const px = (xRot * focalLength) / zRel + ORIGINAL_WIDTH / 2;
    const py = (yRot * focalLength) / zRel + ORIGINAL_HEIGHT / 2;

    const size = Math.max(0.5, (focalLength / zRel) * 2.0);
    
    let opacity = 0.8;
    if (zRel > 1500) {
      opacity = interpolate(zRel, [1500, 2000], [0.8, 0], { extrapolateRight: 'clamp' });
    } else if (zRel < 200) {
      opacity = interpolate(zRel, [50, 200], [0, 0.8], { extrapolateLeft: 'clamp' });
    }

    return { x: px, y: py, size, color: p.color, opacity };
  }).filter(p => p.x >= -50 && p.x <= ORIGINAL_WIDTH + 50 && p.y >= -50 && p.y <= ORIGINAL_HEIGHT + 50);

  // SVG Glow flow offsets
  const strokeDashoffsetFlowLeft = interpolate(frame % 600, [0, 600], [2000, 0]);
  const strokeDashoffsetFlowRight = interpolate(frame % 600, [0, 600], [0, -2000]);
  const strokeDashoffsetFlowCircle = interpolate(frame % 600, [0, 600], [1000, 0]);
  const strokeDashoffsetFlowCircleRev = interpolate(frame % 600, [0, 600], [0, 1000]);

  // Styles defined using React camelCase properties
  const mainWrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#050010',
  };

  const uiLayerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    zIndex: 2,
    pointerEvents: 'none',
  };

  const hudBoxLeftStyle: React.CSSProperties = {
    position: 'absolute',
    width: 640,
    height: 360,
    top: 300,
    left: 200,
  };

  const hudBoxRightStyle: React.CSSProperties = {
    position: 'absolute',
    width: 640,
    height: 360,
    top: 300,
    right: 200,
  };

  const hudCircleStyle: React.CSSProperties = {
    position: 'absolute',
    width: 250,
    height: 250,
    top: 710,
    left: 835, // Exact 1920/2 - 250/2 center
  };

  const greenScreenStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#00FF00',
  };

  const greenScreenRoundStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: '50%',
  };

  const hudBorderStyle: React.CSSProperties = {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 'calc(100% + 20px)',
    height: 'calc(100% + 20px)',
    overflow: 'visible',
    zIndex: 3,
    filter: 'drop-shadow(0 0 8px #FF00FF) drop-shadow(0 0 15px #00FFFF)',
  };

  const neonPathCyan: React.CSSProperties = {
    fill: 'none',
    strokeWidth: 4,
    strokeLinecap: 'square',
    stroke: '#00FFFF',
    strokeDasharray: '200 1800',
  };

  const neonPathMagenta: React.CSSProperties = {
    fill: 'none',
    strokeWidth: 4,
    strokeLinecap: 'square',
    stroke: '#FF00FF',
    strokeDasharray: '400 1600',
  };

  const glitchLayerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(rgba(0,255,255,0.03) 50%, rgba(255,0,255,0.03) 50%)',
    backgroundSize: '100% 4px',
    zIndex: 1,
    mixBlendMode: 'screen',
  };

  return (
    <div style={mainWrapperStyle}>
      {/* Projected Vector Synthwave Terrain and Sky rendering */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: ORIGINAL_WIDTH, height: ORIGINAL_HEIGHT, zIndex: 1, background: '#050010' }}>
        <defs>
          <radialGradient id="skyFog" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1b0033" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#050010" stopOpacity={1} />
          </radialGradient>
        </defs>
        
        <rect width={ORIGINAL_WIDTH} height={ORIGINAL_HEIGHT} fill="url(#skyFog)" />
        
        {/* Wireframe grids rendering with SVG filter glows */}
        <path d={bottomPath} style={{ ...neonPathCyan, strokeDasharray: undefined, strokeWidth: 1.5, opacity: 0.35, filter: 'drop-shadow(0 0 6px #00FFFF)' }} />
        <path d={topPath} style={{ ...neonPathMagenta, strokeDasharray: undefined, strokeWidth: 1.5, opacity: 0.35, filter: 'drop-shadow(0 0 6px #FF00FF)' }} />

        {/* 3D Depth Sorted Floating Starfield */}
        {projectedParticles.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={pt.size}
            fill={pt.color}
            opacity={pt.opacity}
            style={{ filter: `drop-shadow(0 0 ${pt.size * 1.5}px ${pt.color})` }}
          />
        ))}
      </svg>

      {/* Retro-cyber scanlines overlays */}
      <div style={glitchLayerStyle} />

      {/* Top Graphic Interface layer */}
      <div style={uiLayerStyle}>
        
        {/* Box Left */}
        <div style={hudBoxLeftStyle} id="box-left">
          <div style={greenScreenStyle} />
          <svg style={hudBorderStyle} viewBox="0 0 660 380">
            <rect 
              style={{ ...neonPathCyan, strokeDashoffset: strokeDashoffsetFlowLeft }} 
              x="10" 
              y="10" 
              width="640" 
              height="360" 
            />
            <rect 
              style={{ ...neonPathMagenta, strokeDashoffset: strokeDashoffsetFlowRight }} 
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

        {/* Box Right */}
        <div style={hudBoxRightStyle} id="box-right">
          <div style={greenScreenStyle} />
          <svg style={hudBorderStyle} viewBox="0 0 660 380">
            <rect 
              style={{ ...neonPathCyan, strokeDashoffset: strokeDashoffsetFlowLeft }} 
              x="10" 
              y="10" 
              width="640" 
              height="360" 
            />
            <rect 
              style={{ ...neonPathMagenta, strokeDashoffset: strokeDashoffsetFlowRight }} 
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

        {/* HUD Sub Circle */}
        <div style={hudCircleStyle} id="circle-sub">
          <div style={greenScreenRoundStyle} />
          <svg style={hudBorderStyle} viewBox="0 0 270 270">
            <circle 
              style={{ ...neonPathCyan, strokeDasharray: '200 800', strokeDashoffset: strokeDashoffsetFlowCircle }} 
              cx="135" 
              cy="135" 
              r="125" 
            />
            <circle 
              style={{ ...neonPathMagenta, strokeDasharray: '400 600', strokeDashoffset: strokeDashoffsetFlowCircleRev }} 
              cx="135" 
              cy="135" 
              r="130" 
            />
          </svg>
        </div>

      </div>
    </div>
  );
};

export default SynthwaveHudViewport;
// END_OF_FILE