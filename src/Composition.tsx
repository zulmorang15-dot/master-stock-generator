import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// Deterministic particle generation outside component to bypass Math.random() in render
const NUM_DUST_PARTICLES = 80;
const DUST_PARTICLES = Array.from({ length: NUM_DUST_PARTICLES }).map((_, i) => {
  const seed = i * 235.12 + 13.79;
  const x = (seed % 1) * 1920;
  const y = ((seed * 1.6) % 1) * 1080;
  const size = ((seed * 2.3) % 1) * 5 + 2;
  const speedY = ((seed * 3.7) % 1) * 1.2 + 0.4;
  const phase = (seed * 4.9) % (Math.PI * 2);
  const opacity = ((seed * 5.1) % 1) * 0.4 + 0.3;
  return { x, y, size, speedY, phase, opacity };
});

const FuturisticEsportsEndScreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const ORIGINAL_WIDTH = 1920;
  const ORIGINAL_HEIGHT = 1080;
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Absolute seamless looping frame based on 12-second (360 frames @ 30fps) duration
  const loopDuration = 360;
  const localFrame = frame % loopDuration;

  // Frame animations matching keyframes and WebGL rendering of the original code
  // 1. Grid scroll loop (seamless transition every 30 frames)
  const gridScrollY = interpolate(localFrame % 30, [0, 30], [0, 80], {
    extrapolateRight: 'clamp',
  });

  // 2. Center Ring rotations (perfect periods mapping exactly to 360 total loop frame)
  const outerRingRot = interpolate(localFrame, [0, 360], [0, 360]);
  const dashedRingRot = interpolate(localFrame % 180, [0, 180], [0, 360]);
  const innerRingRot = interpolate(localFrame % 120, [0, 120], [360, 0]);

  // 3. Central WebGL core icosahedron rotation proxies
  const outerCoreRot = interpolate(localFrame, [0, 360], [360, 0]);
  const innerCoreRot = interpolate(localFrame % 180, [0, 180], [0, 360]);

  // 4. Panel Sweep Lights (6s periods, matching original sweepLight keyframe timing proportions)
  const leftSweepProgress = interpolate(localFrame % 180, [0, 36, 180], [-100, 200, 200], {
    easing: Easing.bezier(0.19, 1, 0.22, 1),
  });
  const rightSweepProgress = interpolate((localFrame + 90) % 180, [0, 36, 180], [-100, 200, 200], {
    easing: Easing.bezier(0.19, 1, 0.22, 1),
  });

  // 5. Panel Scanlines (4s periods)
  const leftScanlineY = interpolate(localFrame % 120, [0, 120], [-100, 100]);
  const rightScanlineY = interpolate((localFrame + 60) % 120, [0, 120], [-100, 100]);

  // 6. HUD Crosshair subtle pulse (2s period)
  const pulseScale = interpolate(Math.sin((localFrame * Math.PI * 2) / 60), [-1, 1], [0.95, 1.15]);
  const pulseOpacity = interpolate(Math.sin((localFrame * Math.PI * 2) / 60), [-1, 1], [0.3, 0.6]);

  // Wave mathematical generator - driven frame-by-frame and perfectly seamless
  const generateWavePath = (amplitude: number, phaseOffset: number) => {
    const points = [];
    const steps = 40;
    const waveProgress = (localFrame * Math.PI * 2) / 120; // Cycles exactly 3 times inside 360 frames

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * 1920;
      const angle = (i / steps) * Math.PI * 4 + phaseOffset + waveProgress;
      const y = 920 + Math.sin(angle) * amplitude + Math.cos(angle * 0.5) * (amplitude * 0.5);
      points.push(`${x},${y}`);
    }
    return `M ` + points.join(' L ') + ` L 1920,1080 L 0,1080 Z`;
  };

  const cornerBase: React.CSSProperties = {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00ffff',
    borderStyle: 'solid',
    borderWidth: 0,
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
    zIndex: 3,
  };

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
      {/* 3D-EFFECT PERSPECTIVE GRID FLOOR */}
      <div
        style={{
          perspective: '600px',
          perspectiveOrigin: '50% 40%',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <div
          style={{
            transform: 'rotateX(75deg)',
            transformOrigin: '50% 100%',
            position: 'absolute',
            bottom: -200,
            width: '200%',
            left: '-50%',
            height: '900px',
            backgroundImage: `
              linear-gradient(to right, rgba(0, 85, 255, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 255, 255, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: `50% ${gridScrollY}px`,
            maskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 80%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 80%)',
          }}
        />
      </div>

      {/* DETOUR INTEGRATION: HOLOGRAPHIC WAVE GRID (Replaces dynamic ThreeJS particles) */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      >
        <defs>
          <linearGradient id="waveCyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0055ff" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="waveBlueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0055ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#010308" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Holographic Glowing wave fills */}
        <path d={generateWavePath(20, 0)} fill="url(#waveCyanGrad)" stroke="#00ffff" strokeWidth="2" opacity="0.5" />
        <path d={generateWavePath(30, Math.PI / 2)} fill="url(#waveBlueGrad)" stroke="#0055ff" strokeWidth="1.5" opacity="0.3" />
      </svg>

      {/* FLOATING EMISSIVE DUST PARTICLES */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
        {DUST_PARTICLES.map((dust, i) => {
          const currentY = (dust.y - (localFrame * dust.speedY)) % 1080;
          const adjustedY = currentY < 0 ? currentY + 1080 : currentY;
          
          // Seamless border edge fade envelope
          const borderFade = Math.sin((adjustedY / 1080) * Math.PI);
          const opacity = dust.opacity * borderFade;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: dust.x,
                top: adjustedY,
                width: dust.size,
                height: dust.size,
                backgroundColor: '#00ffff',
                borderRadius: '50%',
                opacity,
                boxShadow: '0 0 10px #00ffff',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>

      {/* UI STATIC AND ANIMATED INTERFACE LAYER */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
        
        {/* HUD Elements */}
        <div style={{ position: 'absolute', top: 150, left: 0, width: '100%', height: 1, backgroundColor: '#00ffff', opacity: 0.2, boxShadow: '0 0 10px #00ffff' }} />
        <div style={{ position: 'absolute', bottom: 150, left: 0, width: '100%', height: 1, backgroundColor: '#00ffff', opacity: 0.2, boxShadow: '0 0 10px #00ffff' }} />

        {/* HUD Crosshairs (Pulsing) */}
        { [
            { top: 140, left: 140 },
            { top: 140, right: 140 },
            { bottom: 140, left: 140 },
            { bottom: 140, right: 140 }
          ].map((pos, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                ...pos,
                width: 20,
                height: 20,
                transform: `scale(${pulseScale})`,
                opacity: pulseOpacity,
              }}
            >
              <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 2, backgroundColor: '#0055ff', transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', top: 0, left: '50%', width: 2, height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }} />
            </div>
        ))}

        {/* LEFT PLACEHOLDER */}
        <div
          style={{
            position: 'absolute',
            width: 580,
            height: 326,
            top: 377,
            left: 140,
            backgroundColor: 'rgba(0, 15, 30, 0.4)',
            border: '2px solid rgba(0, 255, 255, 0.3)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ ...cornerBase, top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 }} />
          <div style={{ ...cornerBase, top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 }} />
          <div style={{ ...cornerBase, bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 }} />
          <div style={{ ...cornerBase, bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 }} />
          
          {/* Scanline */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
              transform: `translateY(${leftScanlineY}%)`,
            }}
          />
          {/* Sweep Light */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${leftSweepProgress}%`,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
              transform: 'skewX(-25deg)',
            }}
          />
        </div>

        {/* RIGHT PLACEHOLDER */}
        <div
          style={{
            position: 'absolute',
            width: 580,
            height: 326,
            top: 377,
            right: 140,
            backgroundColor: 'rgba(0, 15, 30, 0.4)',
            border: '2px solid rgba(0, 255, 255, 0.3)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ ...cornerBase, top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 }} />
          <div style={{ ...cornerBase, top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 }} />
          <div style={{ ...cornerBase, bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 }} />
          <div style={{ ...cornerBase, bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 }} />
          
          {/* Scanline */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
              transform: `translateY(${rightScanlineY}%)`,
            }}
          />
          {/* Sweep Light */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${rightSweepProgress}%`,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
              transform: 'skewX(-25deg)',
            }}
          />
        </div>

        {/* CENTER SUBSCRIBE AREA */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 340,
            height: 340,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Pseudo-3D Inner Wireframe Hologram Structure (Replaces background ThreeJS Core) */}
          <svg
            style={{
              position: 'absolute',
              width: 480,
              height: 480,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              opacity: 0.2,
            }}
            viewBox="0 0 100 100"
          >
            {/* Outer wireframe node */}
            <polygon
              points="50,5 90,25 90,75 50,95 10,75 10,25"
              fill="none"
              stroke="#00ffff"
              strokeWidth="0.5"
              style={{
                transformOrigin: '50px 50px',
                transform: `rotate(${outerCoreRot}deg)`,
              }}
            />
            {/* Inner wireframe node */}
            <polygon
              points="50,15 80,32.5 80,67.5 50,85 20,67.5 20,32.5"
              fill="none"
              stroke="#0055ff"
              strokeWidth="0.5"
              style={{
                transformOrigin: '50px 50px',
                transform: `rotate(${innerCoreRot}deg)`,
              }}
            />
          </svg>

          {/* Outer Hologram Ring */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: '2px solid transparent',
              width: 340,
              height: 340,
              borderTop: '4px solid #00ffff',
              borderBottom: '4px solid #0055ff',
              boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
              transform: `rotate(${outerRingRot}deg)`,
            }}
          />

          {/* Dashed Hologram Ring */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: '2px dashed rgba(0, 255, 255, 0.5)',
              width: 310,
              height: 310,
              transform: `rotate(${dashedRingRot}deg)`,
            }}
          />

          {/* Inner Hologram Ring */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: '2px solid transparent',
              width: 280,
              height: 280,
              borderLeft: '3px solid #0055ff',
              borderRight: '3px solid #00ffff',
              transform: `rotate(${innerRingRot}deg)`,
            }}
          />

          {/* Glowing Inner Core (The Subscribe Avatar Target) */}
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'rgba(0, 20, 40, 0.6)',
              border: '4px solid #00ffff',
              boxShadow: '0 0 50px rgba(0, 255, 255, 0.5), inset 0 0 40px rgba(0, 85, 255, 0.5)',
              backdropFilter: 'blur(12px)',
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Holographic Target Vector Elements Inside Core */}
            <svg
              style={{
                width: '70%',
                height: '70%',
                opacity: 0.8,
              }}
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="42" fill="none" stroke="#00ffff" strokeWidth="1" strokeDasharray="3, 3" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="#0055ff" strokeWidth="1.5" />
              <polygon points="50,15 54,32 71,32 57,42 62,59 50,49 38,59 43,42 29,32 46,32" fill="rgba(0, 255, 255, 0.15)" stroke="#00ffff" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="5" fill="#00ffff" />
            </svg>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FuturisticEsportsEndScreen;
// END_OF_FILE