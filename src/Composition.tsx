import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// Deterministic seed generation for digital cyberpunk particles
const PARTICLE_COUNT = 300;
const SEED_PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const r1 = Math.sin(i * 12.9898) * 43758.5453 % 1;
  const r2 = Math.cos(i * 78.233) * 43758.5453 % 1;
  const r3 = Math.sin(i * 45.123) * 12345.6789 % 1;
  return {
    x: (r1 - 0.5) * 2000,
    y: (r2 - 0.5) * 1500,
    z: Math.abs(r3) * 1000,
    speed: 3 + Math.abs(r1) * 5,
    size: 2 + Math.abs(r2) * 4,
  };
});

// Deterministic structural glitch triggers
const GLITCH_TIMINGS = Array.from({ length: 45 }, (_, i) => {
  const r = Math.sin(i * 99.123) * 43758.5453 % 1;
  return Math.abs(r);
});

export const ProceduralCyberpunkEndScreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const ORIGINAL_WIDTH = 1920;
  const ORIGINAL_HEIGHT = 1080;
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 15-second loop duration
  const LOOP_FRAMES = fps * 15;
  const localFrame = frame % LOOP_FRAMES;
  const progress = localFrame / LOOP_FRAMES;

  // React canvas rendering for infinite cyberpunk tunnel & particles
  const canvasRef = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Apply camera subtle motion/roll
    const cameraRotation = Math.sin(progress * Math.PI * 2.0) * 0.05;
    const cameraX = Math.cos(progress * Math.PI * 2.0) * 15;
    const cameraY = Math.sin(progress * Math.PI * 2.0) * 15;
    const centerX = 960 + cameraX;
    const centerY = 540 + cameraY;

    ctx.save();
    ctx.translate(960, 540);
    ctx.rotate(cameraRotation);
    ctx.translate(-960, -540);

    // 1. Draw Volumetric Tunnel Rings (Infinite Tunnel)
    const NUM_RINGS = 20;
    for (let i = 0; i < NUM_RINGS; i++) {
      const ringProgress = ((i / NUM_RINGS) - progress + 1.0) % 1.0;
      const depth = Math.pow(ringProgress, 2.5); // Perspective scaling
      const radius = depth * 1500;

      // Radial structural wave deformation matching original shader math
      const wave = Math.sin(ringProgress * 40 - progress * Math.PI * 6) * 15 * (1 - depth);
      const finalRadius = radius + wave;

      // Depth Fading / Fog
      const fog = Math.sin(ringProgress * Math.PI) * 0.6;
      if (finalRadius > 10 && fog > 0) {
        // Neon Gradient Color interpolation (Hot Cyan to Deep Magenta)
        const r = Math.floor(interpolate(ringProgress, [0, 1], [0, 255]));
        const g = Math.floor(interpolate(ringProgress, [0, 1], [255, 0]));
        const b = Math.floor(interpolate(ringProgress, [0, 1], [255, 255]));

        // Dual stroke rendering for Unreal Bloom replication
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${fog * 0.25})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, finalRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${fog * 0.9})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, finalRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 2. Draw Tunnel Radial Connectors (Wireframe Grid Lines)
    const NUM_RADIALS = 16;
    for (let j = 0; j < NUM_RADIALS; j++) {
      const angle = (j / NUM_RADIALS) * Math.PI * 2;
      ctx.beginPath();

      for (let s = 0; s <= 30; s++) {
        const stepProgress = s / 30;
        const depth = Math.pow(stepProgress, 2.5);
        const radius = depth * 1500;
        const wave = Math.sin(stepProgress * 40 - progress * Math.PI * 6) * 15 * (1 - depth);
        const finalRadius = radius + wave;

        const px = centerX + Math.cos(angle) * finalRadius;
        const py = centerY + Math.sin(angle) * finalRadius;

        if (s === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      // Draw glowing structural radial line
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 3. Digital Particles (Deterministic wrap-around motion)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = SEED_PARTICLES[i];
      const currentZ = (particle.z - progress * 1000 + 1000) % 1000;
      
      // Infinite perspective projection
      const projFactor = 350 / (currentZ + 1);
      const px = centerX + particle.x * projFactor;
      const py = centerY + particle.y * projFactor;
      const size = particle.size * projFactor * 0.4;

      // Fade visual edges
      const fog = Math.sin((currentZ / 1000) * Math.PI);
      if (px >= 0 && px <= ORIGINAL_WIDTH && py >= 0 && py <= ORIGINAL_HEIGHT && currentZ > 10) {
        ctx.fillStyle = `rgba(255, 0, 255, ${fog * 0.75})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.2, size), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Glitch / Random Digital Overlay Matrix lines
    const glitchSeedIdx = Math.floor(localFrame % GLITCH_TIMINGS.length);
    if (GLITCH_TIMINGS[glitchSeedIdx] > 0.85) {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.12)';
      const barHeight = GLITCH_TIMINGS[glitchSeedIdx] * 40;
      const barY = GLITCH_TIMINGS[(glitchSeedIdx + 1) % GLITCH_TIMINGS.length] * ORIGINAL_HEIGHT;
      ctx.fillRect(0, barY, ORIGINAL_WIDTH, barHeight);
    }

    ctx.restore();
  };

  // GSAP Timeline to Remotion Interpolations
  const boxScale = interpolate(
    localFrame,
    [0, 150, 156, 180, 510, 516, 540, 900],
    [1, 1, 1.02, 1, 1, 1.02, 1, 1],
    {
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const subScale = interpolate(
    localFrame,
    [0, 150, 156, 180, 510, 516, 540, 900],
    [1, 1, 1.01, 1, 1, 1.05, 1, 1],
    {
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Exact CSS inline styles mimicking original HTML definitions
  const bodyStyle: React.CSSProperties = {
    backgroundColor: '#000000',
    margin: 0,
    padding: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  };

  const appContainerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
  };

  const webglCanvasStyle: React.CSSProperties = {
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
  };

  const baseVideoPlaceholderStyle: React.CSSProperties = {
    position: 'absolute',
    width: 640,
    height: 360,
    top: 360,
  };

  const leftBoxStyle: React.CSSProperties = {
    ...baseVideoPlaceholderStyle,
    left: 160,
  };

  const rightBoxStyle: React.CSSProperties = {
    ...baseVideoPlaceholderStyle,
    right: 160,
  };

  const subPlaceholderStyle: React.CSSProperties = {
    position: 'absolute',
    width: 200,
    height: 200,
    left: 860,
    bottom: 100,
  };

  const chromaBoxStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#00FF00',
    boxShadow: 'inset 0 0 0 2px rgba(0, 0, 0, 1)',
  };

  const chromaCircleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: '50%',
    boxShadow: 'inset 0 0 0 2px rgba(0, 0, 0, 1)',
  };

  const hudBorderStyle: React.CSSProperties = {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 700,
    height: 420,
  };

  const hudBorderCircleStyle: React.CSSProperties = {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 260,
    height: 260,
  };

  const glitchWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
  };

  return (
    <div style={bodyStyle}>
      <div id="app-container" style={appContainerStyle}>
        
        {/* Procedural WebGL Simulation via Deterministic high-framerate Canvas 2D */}
        <canvas 
          ref={canvasRef} 
          id="webgl-canvas" 
          width={ORIGINAL_WIDTH} 
          height={ORIGINAL_HEIGHT} 
          style={webglCanvasStyle} 
        />

        <div id="ui-layer" style={uiLayerStyle}>
            
          {/* Left Video Placeholder Component */}
          <div className="video-placeholder left-box" style={leftBoxStyle}>
            <div 
              className="glitch-wrapper box-fx" 
              style={{
                ...glitchWrapperStyle,
                transform: `scale(${boxScale})`,
                transformOrigin: 'center center'
              }}
            >
              <svg className="hud-border" style={hudBorderStyle} viewBox="0 0 700 420" xmlns="http://www.w3.org/2000/svg">
                <path d="M 30 60 L 30 30 L 60 30" fill="none" stroke="#FF00FF" strokeWidth="4" strokeLinecap="square"/>
                <path d="M 670 60 L 670 30 L 640 30" fill="none" stroke="#FF00FF" strokeWidth="4" strokeLinecap="square"/>
                <path d="M 30 360 L 30 390 L 60 390" fill="none" stroke="#FF00FF" strokeWidth="4" strokeLinecap="square"/>
                <path d="M 670 360 L 670 390 L 640 390" fill="none" stroke="#FF00FF" strokeWidth="4" strokeLinecap="square"/>
                <rect x="25" y="25" width="650" height="370" fill="none" stroke="#00FFFF" strokeWidth="1" opacity="0.3"/>
                
                {/* Clockwise energy flowing stroke line */}
                <path 
                  className="energy-line-cw" 
                  d="M 25 25 h 650 v 370 h -650 z" 
                  fill="none" 
                  stroke="#00FFFF" 
                  strokeWidth="3" 
                  strokeDasharray="510 510"
                  strokeDashoffset={-(2040 * progress)}
                />
              </svg>
            </div>
            <div className="chroma-box" style={chromaBoxStyle} />
          </div>

          {/* Right Video Placeholder Component */}
          <div className="video-placeholder right-box" style={rightBoxStyle}>
            <div 
              className="glitch-wrapper box-fx" 
              style={{
                ...glitchWrapperStyle,
                transform: `scale(${boxScale})`,
                transformOrigin: 'center center'
              }}
            >
              <svg className="hud-border" style={hudBorderStyle} viewBox="0 0 700 420" xmlns="http://www.w3.org/2000/svg">
                <path d="M 30 60 L 30 30 L 60 30" fill="none" stroke="#FF00FF" strokeWidth="4" strokeLinecap="square"/>
                <path d="M 670 60 L 670 30 L 640 30" fill="none" stroke="#FF00FF" strokeWidth="4" strokeLinecap="square"/>
                <path d="M 30 360 L 30 390 L 60 390" fill="none" stroke="#FF00FF" strokeWidth="4" strokeLinecap="square"/>
                <path d="M 670 360 L 670 390 L 640 390" fill="none" stroke="#FF00FF" strokeWidth="4" strokeLinecap="square"/>
                <rect x="25" y="25" width="650" height="370" fill="none" stroke="#00FFFF" strokeWidth="1" opacity="0.3"/>
                
                {/* Counter-Clockwise energy flowing stroke line */}
                <path 
                  className="energy-line-ccw" 
                  d="M 25 25 h 650 v 370 h -650 z" 
                  fill="none" 
                  stroke="#00FFFF" 
                  strokeWidth="3" 
                  strokeDasharray="510 510"
                  strokeDashoffset={2040 * progress}
                />
              </svg>
            </div>
            <div className="chroma-box" style={chromaBoxStyle} />
          </div>

          {/* Sub Logo Placeholder Circle Component */}
          <div className="sub-placeholder" style={subPlaceholderStyle}>
            <div 
              className="glitch-wrapper sub-fx" 
              style={{
                ...glitchWrapperStyle,
                transform: `scale(${subScale})`,
                transformOrigin: 'center center'
              }}
            >
              <svg className="hud-border-circle" style={hudBorderCircleStyle} viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
                <path d="M 130 5 L 130 20 M 130 255 L 130 240 M 5 130 L 20 130 M 255 130 L 240 130" fill="none" stroke="#FF00FF" strokeWidth="4"/>
                
                {/* Spin Rings */}
                <g 
                  className="spin-ring-inner"
                  style={{
                    transform: `rotate(${360 * progress}deg)`,
                    transformOrigin: '130px 130px'
                  }}
                >
                  <circle cx="130" cy="130" r="115" fill="none" stroke="#00FFFF" strokeWidth="2" strokeDasharray="20 10 50 20 5 10"/>
                </g>
                <g 
                  className="spin-ring-outer"
                  style={{
                    transform: `rotate(${-360 * progress}deg)`,
                    transformOrigin: '130px 130px'
                  }}
                >
                  <circle cx="130" cy="130" r="125" fill="none" stroke="#FF00FF" strokeWidth="2" strokeDasharray="100 50 30 40"/>
                </g>

                {/* Flowing outer circle path */}
                <circle 
                  className="energy-circle" 
                  cx="130" 
                  cy="130" 
                  r="105" 
                  fill="none" 
                  stroke="#00FFFF" 
                  strokeWidth="3" 
                  strokeDasharray="165 165"
                  strokeDashoffset={-(660 * progress)}
                />
              </svg>
            </div>
            <div className="chroma-circle" style={chromaCircleStyle} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProceduralCyberpunkEndScreen;
// END_OF_FILE