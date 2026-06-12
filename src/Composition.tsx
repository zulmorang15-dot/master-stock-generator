import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic particles generated outside the render loop
const PARTICLE_COUNT = 150;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const sin1 = Math.sin(i * 9.13);
  const sin2 = Math.sin(i * 12.45);
  const sin3 = Math.sin(i * 73.18);

  const x = sin1 * 1400; // wide distribution
  const y = sin2 * 450;  // heights
  const zStart = Math.abs(sin3) * 1200 + 100; // initial depth
  const speed = 2 + Math.abs(Math.sin(i * 45.23)) * 4;
  const color = Math.abs(Math.sin(i * 32.11)) > 0.5 ? '#00FFFF' : '#FF00FF';
  return { x, y, zStart, speed, color };
});

const CyberTerrainHud: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Fullscreen calculation matching original aspects with no borders
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Time metrics for infinite 12-second seamless looping (360 frames at 30fps)
  const loopFrames = 360;
  const t = (frame % loopFrames) / loopFrames;

  // Camera animation
  const cameraRotZ = Math.sin(t * Math.PI * 2) * 0.05;
  const cameraY = Math.sin(t * Math.PI * 4) * 10;

  // Grid calculations
  const COLS = 13; 
  const ROWS = 22;
  const FOCAL = 550;
  const CX = 960;
  const CY = 540;

  const zOffset = (frame * 3.5) % 80;
  const waveOffset = (frame * 0.08) % (Math.PI * 2);

  const getProjectedPoint = (c: number, r: number, isTop: boolean) => {
    const X = (c - 6) * 140; 
    const Z = 120 + r * 80 - zOffset;

    // Wave displacement calculations matching the WebGL grid noise
    const waveX = Math.sin(X * 0.0025 + waveOffset) * 45;
    const waveZ = Math.cos(Z * 0.0025 - waveOffset) * 45;
    const wave = waveX * waveZ * 0.015;

    const Y = isTop ? (-220 - wave * 40) : (220 + wave * 40);

    const px = CX + (X * FOCAL) / Z;
    const py = CY + (Y * FOCAL) / Z;
    return { x: px, y: py };
  };

  // Generate bottom grid paths
  const bottomTransPaths: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    let d = '';
    for (let c = 0; c < COLS; c++) {
      const pt = getProjectedPoint(c, r, false);
      if (c === 0) d += `M ${pt.x} ${pt.y}`;
      else d += ` L ${pt.x} ${pt.y}`;
    }
    bottomTransPaths.push(d);
  }

  const bottomLongPaths: string[] = [];
  for (let c = 0; c < COLS; c++) {
    let d = '';
    for (let r = 0; r < ROWS; r++) {
      const pt = getProjectedPoint(c, r, false);
      if (r === 0) d += `M ${pt.x} ${pt.y}`;
      else d += ` L ${pt.x} ${pt.y}`;
    }
    bottomLongPaths.push(d);
  }

  // Generate top grid paths
  const topTransPaths: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    let d = '';
    for (let c = 0; c < COLS; c++) {
      const pt = getProjectedPoint(c, r, true);
      if (c === 0) d += `M ${pt.x} ${pt.y}`;
      else d += ` L ${pt.x} ${pt.y}`;
    }
    topTransPaths.push(d);
  }

  const topLongPaths: string[] = [];
  for (let c = 0; c < COLS; c++) {
    let d = '';
    for (let r = 0; r < ROWS; r++) {
      const pt = getProjectedPoint(c, r, true);
      if (r === 0) d += `M ${pt.x} ${pt.y}`;
      else d += ` L ${pt.x} ${pt.y}`;
    }
    topLongPaths.push(d);
  }

  // Neon dash HUD animation loops
  const flowLeftOffset = interpolate(frame % loopFrames, [0, loopFrames], [2000, 0]);
  const flowRightOffset = interpolate(frame % loopFrames, [0, loopFrames], [0, -2000]);
  const flowCircleOffset = interpolate(frame % loopFrames, [0, loopFrames], [1000, 0]);
  const flowCircleOffsetRev = interpolate(frame % loopFrames, [0, loopFrames], [0, 1000]);

  // Styles definitions
  const appContainerStyle: React.CSSProperties = {
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

  const cameraContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: `rotate(${cameraRotZ}rad) translateY(${cameraY}px)`,
    transformOrigin: 'center center',
  };

  const canvasReplacementStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    zIndex: 1,
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

  const glitchLayerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(rgba(0,255,255,0.03) 50%, rgba(255,0,255,0.03) 50%)',
    backgroundSize: '100% 4px',
    zIndex: 3,
    mixBlendMode: 'screen',
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
    bottom: 120,
    left: '50%',
    transform: 'translateX(-50%)',
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
    ...greenScreenStyle,
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

  return (
    <div style={appContainerStyle}>
      <div style={cameraContainerStyle}>
        {/* Render 3D Wireframe Cyber Terrain via direct SVG mapping */}
        <svg style={canvasReplacementStyle} viewBox={`0 0 ${ORIGINAL_WIDTH} ${ORIGINAL_HEIGHT}`}>
          <defs>
            <linearGradient id="fade-bottom" x1="0" y1="1080" x2="0" y2="540" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#00FFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#00FFFF" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="fade-top" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF00FF" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#FF00FF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FF00FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Bottom Grid Wireframe */}
          {bottomTransPaths.map((d, idx) => (
            <path key={`bt-${idx}`} d={d} fill="none" stroke="url(#fade-bottom)" strokeWidth={1.5} />
          ))}
          {bottomLongPaths.map((d, idx) => (
            <path key={`bl-${idx}`} d={d} fill="none" stroke="url(#fade-bottom)" strokeWidth={1.5} />
          ))}

          {/* Top Grid Wireframe */}
          {topTransPaths.map((d, idx) => (
            <path key={`tt-${idx}`} d={d} fill="none" stroke="url(#fade-top)" strokeWidth={1.5} />
          ))}
          {topLongPaths.map((d, idx) => (
            <path key={`tl-${idx}`} d={d} fill="none" stroke="url(#fade-top)" strokeWidth={1.5} />
          ))}

          {/* Particle Layer mapped deterministically to 3D space */}
          {PARTICLES.map((p, i) => {
            let z = p.zStart - (frame * p.speed);
            z = ((z % 1200) + 1200) % 1200;

            if (z < 30) return null;

            const px = CX + (p.x * FOCAL) / z;
            const py = CY + (p.y * FOCAL) / z;
            const size = Math.max(1, (1 - z / 1200) * 5 + 1);
            const opacity = z > 900 ? (1200 - z) / 300 : z < 200 ? z / 200 : 1;

            return (
              <circle
                key={`p-${i}`}
                cx={px}
                cy={py}
                r={size}
                fill={p.color}
                opacity={opacity * 0.7}
                style={{ mixBlendMode: 'screen' }}
              />
            );
          })}
        </svg>

        <div style={glitchLayerStyle} />

        {/* UI Overlay HUD Layer */}
        <div style={uiLayerStyle}>
          {/* Left HUD Box */}
          <div style={hudBoxLeftStyle}>
            <div style={greenScreenStyle} />
            <svg style={hudBorderStyle} viewBox="0 0 660 380">
              <rect
                className="neon-path cyan"
                x="10"
                y="10"
                width="640"
                height="360"
                fill="none"
                stroke="#00FFFF"
                strokeWidth="4"
                strokeLinecap="square"
                strokeDasharray="200 1800"
                strokeDashoffset={flowLeftOffset}
              />
              <rect
                className="neon-path magenta"
                x="6"
                y="6"
                width="648"
                height="368"
                fill="none"
                stroke="#FF00FF"
                strokeWidth="4"
                strokeLinecap="square"
                strokeDasharray="400 1600"
                strokeDashoffset={flowRightOffset}
              />
              <circle cx="10" cy="10" r="4" fill="#00FFFF" />
              <circle cx="650" cy="10" r="4" fill="#00FFFF" />
              <circle cx="10" cy="370" r="4" fill="#00FFFF" />
              <circle cx="650" cy="370" r="4" fill="#00FFFF" />
            </svg>
          </div>

          {/* Right HUD Box */}
          <div style={hudBoxRightStyle}>
            <div style={greenScreenStyle} />
            <svg style={hudBorderStyle} viewBox="0 0 660 380">
              <rect
                className="neon-path cyan"
                x="10"
                y="10"
                width="640"
                height="360"
                fill="none"
                stroke="#00FFFF"
                strokeWidth="4"
                strokeLinecap="square"
                strokeDasharray="200 1800"
                strokeDashoffset={flowLeftOffset}
              />
              <rect
                className="neon-path magenta"
                x="6"
                y="6"
                width="648"
                height="368"
                fill="none"
                stroke="#FF00FF"
                strokeWidth="4"
                strokeLinecap="square"
                strokeDasharray="400 1600"
                strokeDashoffset={flowRightOffset}
              />
              <circle cx="10" cy="10" r="4" fill="#FF00FF" />
              <circle cx="650" cy="10" r="4" fill="#FF00FF" />
              <circle cx="10" cy="370" r="4" fill="#FF00FF" />
              <circle cx="650" cy="370" r="4" fill="#FF00FF" />
            </svg>
          </div>

          {/* Bottom Center Circular HUD */}
          <div style={hudCircleStyle}>
            <div style={greenScreenRoundStyle} />
            <svg style={hudBorderStyle} viewBox="0 0 270 270">
              <circle
                className="neon-path cyan"
                cx="135"
                cy="135"
                r="125"
                fill="none"
                stroke="#00FFFF"
                strokeWidth="4"
                strokeLinecap="square"
                strokeDasharray="200 800"
                strokeDashoffset={flowCircleOffset}
              />
              <circle
                className="neon-path magenta"
                cx="135"
                cy="135"
                r="130"
                fill="none"
                stroke="#FF00FF"
                strokeWidth="4"
                strokeLinecap="square"
                strokeDasharray="200 800"
                strokeDashoffset={flowCircleOffsetRev}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberTerrainHud;
// END_OF_FILE