import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// PRE-CALCULATED DETERMINISTIC PSEUDO-RANDOM PARTICLES (To bypass banned Math.random inside component)
const DUST_PARTICLES = Array.from({ length: 80 }).map((_, i) => {
  const seedX = Math.sin(i * 143.23) * 1000;
  const seedY = Math.cos(i * 377.12) * 1000;
  const seedSize = Math.sin(i * 92.45) * 1000;
  const seedSpeed = Math.cos(i * 211.89) * 1000;
  const seedPhase = Math.sin(i * 59.11) * 1000;
  
  return {
    x: (seedX - Math.floor(seedX)) * 1920,
    y: (seedY - Math.floor(seedY)) * 1080,
    size: 1.5 + (seedSize - Math.floor(seedSize)) * 4.5,
    speed: 0.4 + (seedSpeed - Math.floor(seedSpeed)) * 1.2,
    phase: (seedPhase - Math.floor(seedPhase)) * Math.PI * 2
  };
});

// Pseudo-3D wireframe core lines for futuristic cyber aesthetic in background
const CORE_WIREFRAME_LINES = Array.from({ length: 32 }).map((_, i) => {
  const angle = (i / 32) * Math.PI * 2;
  const length = 180 + Math.sin(i * 1.5) * 40;
  return { angle, length };
});

const FuturisticEsportsEndScreen = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Resolution adaptation for full 16:9 edge-to-edge content matching
  const ORIGINAL_WIDTH = 1920;
  const ORIGINAL_HEIGHT = 1080;
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Seamless Looping Frame Calculation (based on 20 seconds / 1200 frames loop)
  const LOOP_FRAMES = 1200;
  const loopFrame = frame % LOOP_FRAMES;

  // Grid infinite looping scroll offset
  const gridOffset = interpolate(loopFrame % 120, [0, 120], [0, -80], {
    extrapolateRight: 'clamp',
  });

  // Camera floating viewport drift (Simulating THREE.js camera moves)
  const driftX = Math.sin((loopFrame / LOOP_FRAMES) * Math.PI * 2) * 15;
  const driftY = Math.cos((loopFrame / LOOP_FRAMES) * Math.PI * 2) * 10;
  const driftRotate = Math.sin((loopFrame / LOOP_FRAMES) * Math.PI * 2) * 0.4;

  // Left Placeholder animations
  const scanlineLeftY = interpolate(loopFrame % 240, [0, 240], [-100, 100], {
    extrapolateRight: 'clamp',
  });
  const sweepLeftX = interpolate(loopFrame % 360, [0, 90, 360], [-100, 200, 200], {
    easing: Easing.bezier(0.19, 1, 0.22, 1),
  });

  // Right Placeholder animations (Offset for visual asymmetry)
  const scanlineRightY = interpolate((loopFrame + 120) % 240, [0, 240], [-100, 100], {
    extrapolateRight: 'clamp',
  });
  const sweepRightX = interpolate((loopFrame + 180) % 360, [0, 90, 360], [-100, 200, 200], {
    easing: Easing.bezier(0.19, 1, 0.22, 1),
  });

  // Hologram Rings continuous frame-locked rotations
  const rotateOuter = interpolate(loopFrame % 720, [0, 720], [0, 360]);
  const rotateInner = interpolate(loopFrame % 480, [0, 480], [360, 0]);
  const rotateDashed = interpolate(loopFrame % 1200, [0, 1200], [0, 360]);

  // HUD crosshair subtle continuous scale/opacity pulse
  const crosshairScale = interpolate(Math.sin((loopFrame / 60) * Math.PI * 2), [-1, 1], [1.0, 1.15]);
  const crosshairOpacity = interpolate(Math.sin((loopFrame / 60) * Math.PI * 2), [-1, 1], [0.2, 0.45]);

  return (
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
        backgroundColor: '#010308',
        background: 'radial-gradient(circle at center, #020b1f 0%, #010308 100%)',
      }}
    >
      {/* 1. SEAMLESS FLOATING CAMERA VIEWPORT WRAPPER */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `translate(${driftX}px, ${driftY}px) rotate(${driftRotate}deg)`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
      >
        {/* A. Animated Perspective Cyber Grid Floor */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            bottom: 0,
            perspective: '450px',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '300%',
              height: '300%',
              left: '-100%',
              top: '-100%',
              transform: 'rotateX(78deg)',
              transformOrigin: 'center bottom',
              backgroundImage:
                'linear-gradient(to right, rgba(0, 255, 255, 0.12) 2px, transparent 2px), linear-gradient(to bottom, rgba(0, 255, 255, 0.12) 2px, transparent 2px)',
              backgroundSize: '80px 80px',
              backgroundPosition: `0px ${gridOffset}px`,
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            }}
          />
        </div>

        {/* B. Floating Emissive Dust Particles */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 2,
            mixBlendMode: 'screen',
          }}
        >
          {DUST_PARTICLES.map((particle, i) => {
            const currentY = (particle.y - (loopFrame * particle.speed)) % 1080;
            const finalY = currentY < 0 ? currentY + 1080 : currentY;
            const opacity = interpolate(
              Math.sin((loopFrame * 0.02) + particle.phase),
              [-1, 1],
              [0.15, 0.65]
            );

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: particle.x,
                  top: finalY,
                  width: particle.size,
                  height: particle.size,
                  borderRadius: '50%',
                  backgroundColor: '#00ffff',
                  boxShadow: '0 0 8px #00ffff, 0 0 15px rgba(0,255,255,0.5)',
                  opacity: opacity,
                }}
              />
            );
          })}
        </div>

        {/* C. Pseudo-3D Glowing Holographic Cyber Core behind Center UI */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            zIndex: 2,
            opacity: 0.18,
            mixBlendMode: 'screen',
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 600 600">
            <g transform="translate(300, 300)">
              {CORE_WIREFRAME_LINES.map((line, i) => {
                const rotation = rotateOuter * (Math.PI / 180) + line.angle;
                const endX = Math.cos(rotation) * line.length;
                const endY = Math.sin(rotation) * line.length;
                return (
                  <g key={i}>
                    <line
                      x1={0}
                      y1={0}
                      x2={endX}
                      y2={endY}
                      stroke="#00ffff"
                      strokeWidth="1.5"
                      opacity={0.35}
                    />
                    <circle
                      cx={endX}
                      cy={endY}
                      r="3"
                      fill="#00ffff"
                      boxShadow="0 0 8px #00ffff"
                    />
                  </g>
                );
              })}
              <circle r="120" fill="none" stroke="#0055ff" strokeWidth="2" strokeDasharray="10 15" transform={`rotate(${-rotateInner})`} />
              <circle r="60" fill="none" stroke="#00ffff" strokeWidth="3" transform={`rotate(${rotateDashed})`} />
            </g>
          </svg>
        </div>
      </div>

      {/* 2. MAIN HUD FOREGROUND INTERACTIVE LAYER */}
      <div
        id="ui-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        {/* Cyber HUD Grid Lines & Crosshairs */}
        <div
          className="hud-line"
          style={{
            position: 'absolute',
            top: '150px',
            left: 0,
            width: '100%',
            height: '1px',
            backgroundColor: '#00ffff',
            opacity: 0.2,
            boxShadow: '0 0 10px #00ffff',
          }}
        />
        <div
          className="hud-line"
          style={{
            position: 'absolute',
            bottom: '150px',
            left: 0,
            width: '100%',
            height: '1px',
            backgroundColor: '#00ffff',
            opacity: 0.2,
            boxShadow: '0 0 10px #00ffff',
          }}
        />

        {/* HUD Crosshairs */}
        {[
          { top: 140, left: 140 },
          { top: 140, right: 140 },
          { bottom: 140, left: 140 },
          { bottom: 140, right: 140 },
        ].map((pos, idx) => (
          <div
            key={idx}
            className="hud-crosshair"
            style={{
              position: 'absolute',
              width: '20px',
              height: '20px',
              top: pos.top,
              left: pos.left,
              right: pos.right,
              transform: `scale(${crosshairScale})`,
              opacity: crosshairOpacity,
              transition: 'transform 0.1s linear',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: '100%',
                height: '2px',
                backgroundColor: '#0055ff',
                transform: 'translateY(-50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: '2px',
                height: '100%',
                backgroundColor: '#0055ff',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        ))}

        {/* LEFT PLACEHOLDER BOX */}
        <div
          className="placeholder left"
          style={{
            position: 'absolute',
            width: '580px',
            height: '326px',
            top: '377px',
            left: '140px',
            backgroundColor: 'rgba(0, 15, 30, 0.4)',
            border: '2px solid rgba(0, 255, 255, 0.3)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          {/* Holographic Glowing Corners */}
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3, top: '-2px', left: '-2px', borderTopWidth: '4px', borderLeftWidth: '4px' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3, top: '-2px', right: '-2px', borderTopWidth: '4px', borderRightWidth: '4px' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3, bottom: '-2px', left: '-2px', borderBottomWidth: '4px', borderLeftWidth: '4px' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3, bottom: '-2px', right: '-2px', borderBottomWidth: '4px', borderRightWidth: '4px' }} />

          {/* Scanline Sweep */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.15) 50%, rgba(0, 255, 255, 0) 100%)',
              transform: `translateY(${scanlineLeftY}%)`,
            }}
          />

          {/* Sweeping Highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${sweepLeftX}%`,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
              transform: 'skewX(-25deg)',
            }}
          />
        </div>

        {/* RIGHT PLACEHOLDER BOX */}
        <div
          className="placeholder right"
          style={{
            position: 'absolute',
            width: '580px',
            height: '326px',
            top: '377px',
            right: '140px',
            backgroundColor: 'rgba(0, 15, 30, 0.4)',
            border: '2px solid rgba(0, 255, 255, 0.3)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          {/* Holographic Glowing Corners */}
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3, top: '-2px', left: '-2px', borderTopWidth: '4px', borderLeftWidth: '4px' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3, top: '-2px', right: '-2px', borderTopWidth: '4px', borderRightWidth: '4px' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3, bottom: '-2px', left: '-2px', borderBottomWidth: '4px', borderLeftWidth: '4px' }} />
          <div style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3, bottom: '-2px', right: '-2px', borderBottomWidth: '4px', borderRightWidth: '4px' }} />

          {/* Scanline Sweep */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.15) 50%, rgba(0, 255, 255, 0) 100%)',
              transform: `translateY(${scanlineRightY}%)`,
            }}
          />

          {/* Sweeping Highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${sweepRightX}%`,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
              transform: 'skewX(-25deg)',
            }}
          />
        </div>

        {/* CENTER HOVER SUBSCRIBE SYSTEM */}
        <div
          className="subscribe-center"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '340px',
            height: '340px',
            display: 'flex',
            justifyContent: 'center',
            align-items: 'center',
          }}
        >
          {/* Ring Outer */}
          <div
            className="hologram-ring ring-outer"
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: '2px solid transparent',
              width: '340px',
              height: '340px',
              borderTop: '4px solid #00ffff',
              borderBottom: '4px solid #0055ff',
              boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
              transform: `rotate(${rotateOuter}deg)`,
            }}
          />

          {/* Ring Dashed */}
          <div
            className="hologram-ring ring-dashed"
            style={{
              position: 'absolute',
              borderRadius: '50%',
              width: '310px',
              height: '310px',
              border: '2px dashed rgba(0, 255, 255, 0.5)',
              transform: `rotate(${rotateDashed}deg)`,
            }}
          />

          {/* Ring Inner */}
          <div
            className="hologram-ring ring-inner"
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: '2px solid transparent',
              width: '280px',
              height: '280px',
              borderLeft: '3px solid #0055ff',
              borderRight: '3px solid #00ffff',
              transform: `rotate(${rotateInner}deg)`,
            }}
          />

          {/* Core Interactive Center Grid Plate */}
          <div
            className="subscribe-core"
            style={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'rgba(0, 20, 40, 0.65)',
              border: '4px solid #00ffff',
              boxShadow: '0 0 50px rgba(0, 255, 255, 0.5), inset 0 0 40px rgba(0, 85, 255, 0.5)',
              backdropFilter: 'blur(12px)',
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Highly Premium Cyber Tech Vector Icon inside Subscribe Core */}
            <svg
              width="90"
              height="90"
              viewBox="0 0 100 100"
              style={{
                filter: 'drop-shadow(0px 0px 15px #00ffff)',
              }}
            >
              <defs>
                <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00ffff" />
                  <stop offset="100%" stopColor="#0055ff" />
                </linearGradient>
              </defs>
              {/* Outer target hexagon */}
              <polygon
                points="50,15 80,32 80,68 50,85 20,68 20,32"
                fill="none"
                stroke="url(#cyberGlow)"
                strokeWidth="3.5"
              />
              {/* Inner glowing triangle play symbol */}
              <polygon
                points="42,38 65,50 42,62"
                fill="url(#cyberGlow)"
              />
              <circle cx="50" cy="50" r="41" fill="none" stroke="#00ffff" strokeWidth="1.5" strokeDasharray="5 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticEsportsEndScreen;
// END_OF_FILE