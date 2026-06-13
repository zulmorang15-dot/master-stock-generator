import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const PARTICLE_COUNT = 120;

// Deterministic particles generated outside of the render function
const createParticles = () => {
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // High-quality deterministic pseudo-random generators
    const x = ((Math.sin(i * 12.9898) * 43758.5453123) % 1) * 1920 - 960;
    const y = ((Math.sin(i * 78.233) * 43758.5453123) % 1) * 1080 - 540;
    const speed = 0.5 + Math.abs((Math.sin(i * 99.123) * 43758.5453123) % 1) * 1.5;
    const size = 1.5 + Math.abs((Math.sin(i * 33.123) * 43758.5453123) % 1) * 4.5;
    const driftOffset = i * 0.1;
    particles.push({ x, y, speed, size, driftOffset });
  }
  return particles;
};

const PARTICLES = createParticles();

const LuxuryFuturisticEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Scale calculations to avoid black bars and fill 16:9 perfectly
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Seamless 15-second loop configuration
  const totalFrames = 15 * fps;
  const localFrame = frame % totalFrames;
  const t = localFrame / totalFrames; // 0.0 -> 1.0 normalized

  // UI Floating Effects (Symmetrical Sinusoidal mappings for perfect seamless looping)
  const cardLeftY = interpolate(Math.sin(t * Math.PI * 2 * 3.75), [-1, 1], [-15, 0]);
  const cardRightY = interpolate(Math.sin((t * Math.PI * 2 * 3.75) + Math.PI / 2), [-1, 1], [-15, 0]);
  const subZoneY = interpolate(Math.sin(t * Math.PI * 2 * 4.285), [-1, 1], [0, 10]);

  // Light Sweeps (5 second cycles perfectly fitting into 15s total)
  const sweepTimeLeft = (localFrame % (5 * fps)) / (5 * fps);
  const sweepLeftX = interpolate(sweepTimeLeft, [0, 0.2, 1], [-150, 200, 200], {
    extrapolateRight: 'clamp',
  });

  const sweepTimeRight = ((localFrame + 2.5 * fps) % (5 * fps)) / (5 * fps);
  const sweepRightX = interpolate(sweepTimeRight, [0, 0.2, 1], [-150, 200, 200], {
    extrapolateRight: 'clamp',
  });

  // Center Subscribe Zone animations
  const outerRot = t * 360;
  const middleRot = -t * 360;
  
  // Alternate ease-in-out rotation for inner ring (returns to 0 at t = 1)
  const innerRotProgress = Math.sin(t * Math.PI);
  const innerRot = interpolate(innerRotProgress, [0, 1], [0, 180]);

  // Pulse effect (scale & shadows)
  const pulseProgress = Math.sin(t * Math.PI * 2 * 4); // 4 full pulses in 15 seconds
  const pulseScale = interpolate(pulseProgress, [-1, 1], [1, 1.02]);
  const pulseShadowIntensity = interpolate(pulseProgress, [-1, 1], [30, 50]);
  const pulseShadowAlpha = interpolate(pulseProgress, [-1, 1], [0.4, 0.7]);
  const pulseInsetIntensity = interpolate(pulseProgress, [-1, 1], [20, 30]);
  const pulseInsetAlpha = interpolate(pulseProgress, [-1, 1], [0.2, 0.4]);

  // Light Positions (Moving volumetric point light highlights)
  const blueLightX = interpolate(Math.sin(t * Math.PI * 2), [-1, 1], [30, 70]);
  const blueLightY = interpolate(Math.sin(t * Math.PI * 2), [-1, 1], [40, 60]);
  const whiteLightX = interpolate(Math.cos(t * Math.PI * 2), [-1, 1], [70, 30]);
  const whiteLightY = interpolate(Math.cos(t * Math.PI * 2), [-1, 1], [60, 30]);

  // Component style objects containing strict camelCase properties
  const mainContainerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    background: 'radial-gradient(circle at center, #050b1a 0%, #020408 100%)',
  };

  const canvasContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    opacity: 0.8,
    overflow: 'hidden',
  };

  const floorStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%',
    background: 'linear-gradient(to top, #02050a 0%, #050b1a 100%)',
    borderTop: '1px solid rgba(0, 240, 255, 0.1)',
    opacity: 0.9,
  };

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: '-50%',
    width: '200%',
    height: '600px',
    backgroundImage: `
      linear-gradient(to right, rgba(0, 240, 255, 0.15) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 240, 255, 0.15) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    transform: 'perspective(500px) rotateX(75deg)',
    transformOrigin: 'center bottom',
    opacity: 0.15,
    maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
    WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
  };

  const perspectiveViewport: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    perspective: '1000px',
    perspectiveOrigin: '50% 30%',
    pointerEvents: 'none',
  };

  const uiLayerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    pointerEvents: 'none',
  };

  const videoCardLeftStyle: React.CSSProperties = {
    position: 'absolute',
    width: '600px',
    height: '337px',
    top: '50%',
    left: '220px',
    transform: `translateY(calc(-50% + ${cardLeftY}px))`,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 170, 255, 0.05) 100%)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(0, 200, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: `
      0 20px 50px rgba(0, 0, 0, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 0 20px rgba(0, 150, 255, 0.1),
      0 0 30px rgba(0, 150, 255, 0.15)
    `,
    overflow: 'hidden',
  };

  const videoCardRightStyle: React.CSSProperties = {
    position: 'absolute',
    width: '600px',
    height: '337px',
    top: '50%',
    right: '220px',
    transform: `translateY(calc(-50% + ${cardRightY}px))`,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 170, 255, 0.05) 100%)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(0, 200, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: `
      0 20px 50px rgba(0, 0, 0, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 0 20px rgba(0, 150, 255, 0.1),
      0 0 30px rgba(0, 150, 255, 0.15)
    `,
    overflow: 'hidden',
  };

  const hudCornerBase: React.CSSProperties = {
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderColor: '#00f0ff',
    borderStyle: 'solid',
    borderRadius: '4px',
    opacity: 0.6,
    boxShadow: '0 0 10px #00f0ff',
  };

  const subscribeZoneStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, calc(-50% + ${subZoneY}px))`,
    width: '240px',
    height: '240px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const subRingStyle: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
  };

  const ringOuterStyle: React.CSSProperties = {
    ...subRingStyle,
    width: '220px',
    height: '220px',
    borderTop: '2px solid #00f0ff',
    borderBottom: '2px solid #ffffff',
    borderLeft: '2px solid transparent',
    borderRight: '2px solid transparent',
    boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)',
    transform: `rotate(${outerRot}deg)`,
  };

  const ringMiddleStyle: React.CSSProperties = {
    ...subRingStyle,
    width: '190px',
    height: '190px',
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    transform: `rotate(${middleRot}deg)`,
  };

  const ringInnerStyle: React.CSSProperties = {
    ...subRingStyle,
    width: '160px',
    height: '160px',
    borderLeft: '2px solid rgba(0, 200, 255, 0.8)',
    borderRight: '2px solid rgba(0, 200, 255, 0.8)',
    borderTop: '2px solid transparent',
    borderBottom: '2px solid transparent',
    transform: `rotate(${innerRot}deg)`,
  };

  const subCenterStyle: React.CSSProperties = {
    width: '140px',
    height: '140px',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0, 150, 255, 0.05) 60%, transparent 100%)',
    borderRadius: '50%',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    transform: `scale(${pulseScale})`,
    boxShadow: `
      0 0 ${pulseShadowIntensity}px rgba(0, 240, 255, ${pulseShadowAlpha}),
      inset 0 0 ${pulseInsetIntensity}px rgba(255, 255, 255, ${pulseInsetAlpha})
    `,
  };

  return (
    <div style={mainContainerStyle}>
      {/* 3D WEBGL SIMULATED BACKGROUND */}
      <div style={canvasContainerStyle}>
        {/* Ambient Floor reflections */}
        <div style={floorStyle} />
        <div style={gridStyle} />

        {/* Floating holographic rings inside simulated 3D perspective viewport */}
        <div style={perspectiveViewport}>
          {[120, 240, 360].map((h, i) => {
            const ringRotZ = t * 360 * (1 + i * 0.5);
            const ringFloatY = Math.sin(t * Math.PI * 2 + i) * 20;
            const ringScale = 1 - (i * 0.15);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '800px',
                  height: '800px',
                  marginLeft: '-400px',
                  marginTop: '-400px',
                  transform: `translate3d(0, ${h + ringFloatY}px, -150px) rotateX(80deg) rotateZ(${ringRotZ}deg) scale(${ringScale})`,
                  transformStyle: 'preserve-3d',
                  pointerEvents: 'none',
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="95"
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="0.4"
                    strokeOpacity="0.35"
                    style={{ filter: 'drop-shadow(0 0 6px #00f0ff)' }}
                  />
                </svg>
              </div>
            );
          })}
        </div>

        {/* Dynamic moving light source highlights */}
        <div
          style={{
            position: 'absolute',
            left: `${blueLightX}%`,
            top: `${blueLightY}%`,
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${whiteLightX}%`,
            top: `${whiteLightY}%`,
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.04) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Volumetric Floating Dust Particles (Seamless Boundary Loop) */}
        {PARTICLES.map((p, idx) => {
          // Continuous looping scroll upward
          const currentY = ((p.y + p.speed * localFrame + 540) % 1080) - 540;
          const currentX = p.x + Math.sin(t * Math.PI * 2 + p.driftOffset) * 15;
          
          // Edge fade in & fade out to remove sharp pops
          const alpha = interpolate(currentY, [-540, -420, 420, 540], [0, 0.55, 0.55, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: currentX + 960,
                top: currentY + 540,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                backgroundColor: '#00f0ff',
                opacity: alpha,
                boxShadow: '0 0 6px #00f0ff',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>

      {/* FOREGROUND INTERACTIVE UI LAYER */}
      <div style={uiLayerStyle}>
        
        {/* Ambient Top & Bottom HUD Lines */}
        <div
          style={{
            position: 'absolute',
            background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.5), transparent)',
            height: '1px',
            width: '600px',
            left: '50%',
            transform: 'translateX(-50%)',
            top: '120px',
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.5), transparent)',
            height: '1px',
            width: '600px',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '120px',
            opacity: 0.5,
          }}
        />

        {/* LEFT VIDEO CARD CARD-LEFT */}
        <div style={videoCardLeftStyle}>
          {/* Light Sweep */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
              transform: 'skewX(-25deg)',
              left: `${sweepLeftX}%`,
            }}
          />
          {/* Top Left Corner */}
          <div style={{ ...hudCornerBase, top: '10px', left: '10px', borderRightWidth: 0, borderBottomWidth: 0, borderTopWidth: '2px', borderLeftWidth: '2px' }} />
          {/* Top Right Corner */}
          <div style={{ ...hudCornerBase, top: '10px', right: '10px', borderLeftWidth: 0, borderBottomWidth: 0, borderTopWidth: '2px', borderRightWidth: '2px' }} />
          {/* Bottom Left Corner */}
          <div style={{ ...hudCornerBase, bottom: '10px', left: '10px', borderRightWidth: 0, borderTopWidth: 0, borderBottomWidth: '2px', borderLeftWidth: '2px' }} />
          {/* Bottom Right Corner */}
          <div style={{ ...hudCornerBase, bottom: '10px', right: '10px', borderLeftWidth: 0, borderTopWidth: 0, borderBottomWidth: '2px', borderRightWidth: '2px' }} />
        </div>

        {/* RIGHT VIDEO CARD CARD-RIGHT */}
        <div style={videoCardRightStyle}>
          {/* Light Sweep */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
              transform: 'skewX(-25deg)',
              left: `${sweepRightX}%`,
            }}
          />
          {/* Top Left Corner */}
          <div style={{ ...hudCornerBase, top: '10px', left: '10px', borderRightWidth: 0, borderBottomWidth: 0, borderTopWidth: '2px', borderLeftWidth: '2px' }} />
          {/* Top Right Corner */}
          <div style={{ ...hudCornerBase, top: '10px', right: '10px', borderLeftWidth: 0, borderBottomWidth: 0, borderTopWidth: '2px', borderRightWidth: '2px' }} />
          {/* Bottom Left Corner */}
          <div style={{ ...hudCornerBase, bottom: '10px', left: '10px', borderRightWidth: 0, borderTopWidth: 0, borderBottomWidth: '2px', borderLeftWidth: '2px' }} />
          {/* Bottom Right Corner */}
          <div style={{ ...hudCornerBase, bottom: '10px', right: '10px', borderLeftWidth: 0, borderTopWidth: 0, borderBottomWidth: '2px', borderRightWidth: '2px' }} />
        </div>

        {/* CENTER SUBSCRIBE ZONE */}
        <div style={subscribeZoneStyle}>
          <div style={ringOuterStyle} />
          <div style={ringMiddleStyle} />
          <div style={ringInnerStyle} />
          <div style={subCenterStyle} />
        </div>

      </div>
    </div>
  );
};

export default LuxuryFuturisticEndscreen;
// END_OF_FILE