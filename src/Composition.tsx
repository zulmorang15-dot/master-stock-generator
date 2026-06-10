import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic particles pre-calculated outside the component to guarantee seamless frame render
const PARTICLE_COUNT = 100;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  // Use deterministic math (sine of indices) instead of Math.random
  const angleSeed = Math.sin(i * 123.456) * Math.PI * 2;
  const radiusSeedX = 300 + Math.abs(Math.sin(i * 456.789)) * 600;
  const radiusSeedY = 150 + Math.abs(Math.cos(i * 789.123)) * 300;
  const speed = 1 + Math.abs(Math.sin(i * 987.654)) * 2;
  const size = 2 + Math.abs(Math.sin(i * 321.098)) * 5;
  const colorIndex = i % 3;
  const color = colorIndex === 0 ? '#ff007f' : colorIndex === 1 ? '#9d4edd' : '#00f0ff';

  return {
    id: i,
    angleSeed,
    radiusSeedX,
    radiusSeedY,
    speed,
    size,
    color,
  };
});

// Deterministic grid points mapping for wave effect
const GRID_COLS = 21;
const GRID_ROWS = 12;

export const PremiumEndscreen = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Dynamic Text Overlay setup
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'CINEMATIC ENDSCREEN';
  const keywordsList = (inputProps.keywords || 'Neon Loop, Ultra 4K, Cyberpunk, Premium').split(',');

  // Scale computation to fit standard 1920x1080 design workspace beautifully into 4K or target container
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  // Global looping duration logic (10s @ 30fps = 300 frames)
  const totalDuration = 300;
  const localFrame = frame % totalDuration;

  // Floating animations for placeholders
  // Symmetrical loops using sine of progress (0 to 2*PI)
  const leftFloatY = interpolate(
    Math.sin((localFrame / totalDuration) * Math.PI * 4), 
    [-1, 1], 
    [-12, 12]
  );
  const leftFloatRot = interpolate(
    Math.sin((localFrame / totalDuration) * Math.PI * 4), 
    [-1, 1], 
    [-1, 1]
  );

  const rightFloatY = interpolate(
    Math.cos((localFrame / totalDuration) * Math.PI * 4), 
    [-1, 1], 
    [-12, 12]
  );
  const rightFloatRot = interpolate(
    Math.cos((localFrame / totalDuration) * Math.PI * 4), 
    [-1, 1], 
    [-1, 1]
  );

  // Subscribe core pulse animation
  const pulseScale = interpolate(
    Math.sin((localFrame / totalDuration) * Math.PI * 6),
    [-1, 1],
    [0.97, 1.03]
  );

  const glowIntensity = interpolate(
    Math.sin((localFrame / totalDuration) * Math.PI * 6),
    [-1, 1],
    [0.3, 0.7]
  );

  // Tech Ring Rotation (perfect 360 loops over 10 seconds)
  const outerRingRot = interpolate(localFrame, [0, totalDuration], [0, 360]);
  const innerRingRot = interpolate(localFrame, [0, totalDuration], [0, -360]);

  // Video Placeholder Neon Glow pulsing colors
  const neonPulseColor = interpolate(
    Math.sin((localFrame / totalDuration) * Math.PI * 4),
    [-1, 1],
    [0.15, 0.45]
  );

  // Dynamic progress line (0% to 100% loop)
  const progressPercent = (localFrame / totalDuration) * 100;

  // Dynamic Title fade-in sequence
  const titleOpacity = interpolate(
    localFrame,
    [0, 30],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  const titleTranslateY = interpolate(
    localFrame,
    [0, 30],
    [15, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  // Grid wave simulation calculation (Deterministic 2D projection)
  const gridLines: string[] = [];
  // Generate horizontal flowing wave lines
  for (let r = 0; r < GRID_ROWS; r++) {
    const rRatio = r / (GRID_ROWS - 1);
    // Exponential vertical distribution to simulate 3D projection/horizon perspective
    const y = 480 + Math.pow(rRatio, 1.8) * 450;
    let path = '';
    
    for (let c = 0; c < GRID_COLS; c++) {
      const cRatio = c / (GRID_COLS - 1);
      const x = 1920 * cRatio;
      
      // Dynamic sine-wave rippling based on column index and loop frame
      const wavePhase = (cRatio * Math.PI * 3) + ((localFrame / totalDuration) * Math.PI * 2);
      const waveHeight = Math.sin(wavePhase) * (15 * rRatio); // Deeper wave amplitude in foreground
      const finalY = y + waveHeight;

      if (c === 0) {
        path += `M ${x} ${finalY}`;
      } else {
        path += ` L ${x} ${finalY}`;
      }
    }
    gridLines.push(path);
  }

  // Vertical perspective projection lines fanning out
  const verticalGridPaths: string[] = [];
  for (let c = 0; c < GRID_COLS; c++) {
    const cRatio = c / (GRID_COLS - 1);
    let path = '';
    
    for (let r = 0; r < GRID_ROWS; r++) {
      const rRatio = r / (GRID_ROWS - 1);
      const y = 480 + Math.pow(rRatio, 1.8) * 450;
      
      // Keep x converging at horizon (center 960) and spreading out at foreground
      const xOrigin = 960 + (cRatio - 0.5) * 500;
      const xForeground = 960 + (cRatio - 0.5) * 2200;
      const x = interpolate(rRatio, [0, 1], [xOrigin, xForeground]);

      const wavePhase = (cRatio * Math.PI * 3) + ((localFrame / totalDuration) * Math.PI * 2);
      const waveHeight = Math.sin(wavePhase) * (15 * rRatio);
      const finalY = y + waveHeight;

      if (r === 0) {
        path += `M ${x} ${finalY}`;
      } else {
        path += ` L ${x} ${finalY}`;
      }
    }
    verticalGridPaths.push(path);
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#030008',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Master 1920x1080 Container scaled to fit any output resolution automatically */}
      <div
        style={{
          position: 'absolute',
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'center center',
          background: 'radial-gradient(circle at center, #0c051a 0%, #020005 100%)',
          overflow: 'hidden',
          boxShadow: '0 0 150px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Dynamic 2D Wave Grid Layer (Alternative to Three.js) */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            pointerEvents: 'none',
            opacity: 0.25,
          }}
        >
          {gridLines.map((d, idx) => (
            <path
              key={`h-${idx}`}
              d={d}
              fill="none"
              stroke="#9d4edd"
              strokeWidth={1.5}
            />
          ))}
          {verticalGridPaths.map((d, idx) => (
            <path
              key={`v-${idx}`}
              d={d}
              fill="none"
              stroke="#9d4edd"
              strokeWidth={1.2}
            />
          ))}
        </svg>

        {/* Deterministic Cosmic Nebula Particles Rendering */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            pointerEvents: 'none',
          }}
        >
          {PARTICLES.map((p) => {
            // Safe looping orbit calculations
            const angle = p.angleSeed + ((localFrame / totalDuration) * Math.PI * 2 * p.speed);
            const posX = 960 + Math.cos(angle) * p.radiusSeedX;
            const posY = 540 + Math.sin(angle) * p.radiusSeedY;

            return (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: posX,
                  top: posY,
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                  opacity: 0.65,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          })}
        </div>

        {/* Cinematic Vignette Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            boxShadow: 'inset 0 0 300px rgba(0, 0, 0, 0.95)',
            background: `
              radial-gradient(circle at 20% 30%, rgba(255, 0, 127, 0.04) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(0, 240, 255, 0.04) 0%, transparent 40%),
              linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%)
            `,
            backgroundSize: '100% 100%, 100% 100%, 100% 6px',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Ambient Glow Strips */}
        <div
          style={{
            position: 'absolute',
            width: 1200,
            height: 2,
            left: 360,
            top: 180,
            background: 'linear-gradient(90deg, transparent, #9d4edd, #00f0ff, #9d4edd, transparent)',
            opacity: 0.4,
            filter: 'blur(1px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 1200,
            height: 2,
            left: 360,
            bottom: 180,
            background: 'linear-gradient(90deg, transparent, #9d4edd, #00f0ff, #9d4edd, transparent)',
            opacity: 0.4,
            filter: 'blur(1px)',
          }}
        />

        {/* Cinematic Progress Line */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #9d4edd, #ff007f)',
              boxShadow: '0 0 15px #ff007f',
            }}
          />
        </div>

        {/* UI Elements Layer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            zIndex: 5,
          }}
        >
          {/* Section Labels */}
          <div
            style={{
              position: 'absolute',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity: 0.5,
              width: 640,
              textAlign: 'center',
              left: 150,
              top: 315,
              fontFamily: 'Segoe UI, Roboto, sans-serif',
            }}
          >
            Recommended Video
          </div>

          <div
            style={{
              position: 'absolute',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity: 0.5,
              width: 640,
              textAlign: 'center',
              right: 150,
              top: 315,
              fontFamily: 'Segoe UI, Roboto, sans-serif',
            }}
          >
            Best for Viewer
          </div>

          {/* Left Video Placeholder */}
          <div
            style={{
              position: 'absolute',
              width: 640,
              height: 360,
              left: 150,
              top: 360,
              borderRadius: 20,
              backgroundColor: 'rgba(10, 5, 18, 0.45)',
              border: `1px solid rgba(0, 240, 255, ${neonPulseColor})`,
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              boxShadow: `0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 240, 255, ${neonPulseColor * 0.5})`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              transform: `translateY(${leftFloatY}px) rotate(${leftFloatRot}deg)`,
            }}
          >
            {/* Tech Corners */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', width: 30, height: 30, top: -1, left: -1, borderStyle: 'solid', borderColor: '#ff007f', borderWidth: '3px 0 0 3px', borderRadius: '20px 0 0 0', filter: 'drop-shadow(0 0 8px #ff007f)' }} />
              <div style={{ position: 'absolute', width: 30, height: 30, bottom: -1, right: -1, borderStyle: 'solid', borderColor: '#ff007f', borderWidth: '0 3px 3px 0', borderRadius: '0 0 20px 0', filter: 'drop-shadow(0 0 8px #ff007f)' }} />
            </div>
            {/* Glassmorphic Play Icon Accent */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Center Subscribe System */}
          <div
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              top: 390,
              left: 810,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Outer dashed ring rotating */}
            <div
              style={{
                position: 'absolute',
                width: 270,
                height: 270,
                borderRadius: '50%',
                border: '2px dashed #00f0ff',
                opacity: 0.3,
                zIndex: 1,
                transform: `rotate(${outerRingRot}deg)`,
              }}
            />

            {/* Inner dynamic color solid border ring rotating back */}
            <div
              style={{
                position: 'absolute',
                width: 236,
                height: 236,
                borderRadius: '50%',
                border: '3px solid transparent',
                borderTop: '3px solid #ff007f',
                borderBottom: '3px solid #9d4edd',
                filter: 'drop-shadow(0 0 12px #ff007f)',
                zIndex: 2,
                transform: `rotate(${innerRingRot}deg)`,
              }}
            />

            {/* Core subscribe background pulsating in scale and glow */}
            <div
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #1a0b2e 0%, #07020f 100%)',
                border: `2px solid rgba(255, 0, 127, ${glowIntensity})`,
                boxShadow: `0 25px 60px rgba(0,0,0,0.7), inset 0 0 40px rgba(255, 0, 127, ${glowIntensity * 0.6}), 0 0 70px rgba(157, 78, 221, ${glowIntensity * 0.4})`,
                backdropFilter: 'blur(20px)',
                zIndex: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transform: `scale(${pulseScale})`,
              }}
            >
              {/* Core design graphic inner ring */}
              <div
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: '50%',
                  border: '1px dashed rgba(255, 0, 127, 0.3)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* Elegant Play/Bell icon at the center */}
                <svg width="44" height="44" viewBox="0 0 24 24" fill="#ff007f" style={{ filter: 'drop-shadow(0 0 8px #ff007f)' }}>
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Video Placeholder */}
          <div
            style={{
              position: 'absolute',
              width: 640,
              height: 360,
              right: 150,
              top: 360,
              borderRadius: 20,
              backgroundColor: 'rgba(10, 5, 18, 0.45)',
              border: `1px solid rgba(0, 240, 255, ${neonPulseColor})`,
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              boxShadow: `0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 240, 255, ${neonPulseColor * 0.5})`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              transform: `translateY(${rightFloatY}px) rotate(${rightFloatRot}deg)`,
            }}
          >
            {/* Tech Corners */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', width: 30, height: 30, top: -1, left: -1, borderStyle: 'solid', borderColor: '#ff007f', borderWidth: '3px 0 0 3px', borderRadius: '20px 0 0 0', filter: 'drop-shadow(0 0 8px #ff007f)' }} />
              <div style={{ position: 'absolute', width: 30, height: 30, bottom: -1, right: -1, borderStyle: 'solid', borderColor: '#ff007f', borderWidth: '0 3px 3px 0', borderRadius: '0 0 20px 0', filter: 'drop-shadow(0 0 8px #ff007f)' }} />
            </div>
            {/* Glassmorphic Play Icon Accent */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dynamic Glowing Text Overlay (Safe pattern implementation) */}
        <div
          style={{
            position: 'absolute',
            bottom: 110,
            left: 150,
            zIndex: 10,
            fontFamily: 'Segoe UI, Roboto, sans-serif',
            opacity: titleOpacity,
            transform: `translateY(${titleTranslateY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: 2,
              color: '#ffffff',
              textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(255, 0, 127, 0.5), 0 0 20px rgba(157, 78, 221, 0.3)',
              marginBottom: 12,
            }}
          >
            {judul}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {keywordsList.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  color: '#00f0ff',
                  backgroundColor: 'rgba(10, 5, 18, 0.6)',
                  border: '1px solid rgba(157, 78, 221, 0.3)',
                  padding: '4px 12px',
                  borderRadius: 12,
                  backdropFilter: 'blur(5px)',
                  WebkitBackdropFilter: 'blur(5px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumEndscreen;
// END_OF_FILE