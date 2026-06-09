import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CYCLE_DURATION = 12; // seconds, LCM of 3,4,6,12 — capped at 15s

// Pre-calculated static trail data (30 trails) — NO Math.random() inside component
const TRAIL_DATA: { x: number; y: number; z: number; isCyan: boolean }[] = [
  { x: -1100, y: -480, z: -2400, isCyan: true },
  { x: 900, y: 300, z: -1800, isCyan: false },
  { x: -500, y: 550, z: -800, isCyan: true },
  { x: 1200, y: -200, z: -2200, isCyan: true },
  { x: -800, y: -300, z: -1200, isCyan: false },
  { x: 300, y: 480, z: -2800, isCyan: true },
  { x: -1200, y: 100, z: -600, isCyan: false },
  { x: 700, y: -550, z: -2000, isCyan: true },
  { x: -200, y: 200, z: -3000, isCyan: false },
  { x: 1000, y: 400, z: -1400, isCyan: true },
  { x: -600, y: -100, z: -2600, isCyan: true },
  { x: 400, y: -400, z: -400, isCyan: false },
  { x: -1000, y: 550, z: -1600, isCyan: true },
  { x: 800, y: -300, z: -2400, isCyan: false },
  { x: -300, y: 0, z: -1000, isCyan: true },
  { x: 1100, y: 200, z: -2800, isCyan: false },
  { x: -900, y: -400, z: -200, isCyan: true },
  { x: 500, y: 300, z: -3000, isCyan: true },
  { x: -100, y: -550, z: -1800, isCyan: false },
  { x: 1200, y: 100, z: -800, isCyan: true },
  { x: -700, y: 400, z: -2200, isCyan: false },
  { x: 200, y: -200, z: -600, isCyan: true },
  { x: -1100, y: 300, z: -2600, isCyan: false },
  { x: 600, y: -100, z: -1200, isCyan: true },
  { x: -400, y: 550, z: -2000, isCyan: false },
  { x: 1000, y: -500, z: -400, isCyan: true },
  { x: -800, y: 200, z: -1600, isCyan: false },
  { x: 300, y: -350, z: -2400, isCyan: true },
  { x: -200, y: 450, z: -1000, isCyan: false },
  { x: 900, y: -250, z: -2800, isCyan: true },
];

// Pre-calculated particle ring points for center hologram
const PARTICLE_COUNT = 80;
const PARTICLES: { angle: number; radius: number }[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  angle: (i / PARTICLE_COUNT) * Math.PI * 2,
  radius: 220 + Math.sin(i * 0.8) * 18,
}));

// Grid lines for background cyberpunk grid
const GRID_LINES_H = 10;
const GRID_LINES_V = 18;

const CinematicSciFiEsportsEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  const totalFrames = fps * CYCLE_DURATION;
  const localFrame = frame % totalFrames;
  const t = localFrame / fps; // time in seconds within cycle

  // ---- RING 1 rotation (20s cycle, seamless) ----
  const ring1Cycle = 20;
  const ring1Frame = localFrame % (fps * ring1Cycle);
  const ring1Rot = interpolate(ring1Frame, [0, fps * ring1Cycle], [0, 360], { extrapolateRight: 'clamp' });

  // ring1 tilt wobble (sinusoidal, 12s cycle)
  const ring1TiltRad = Math.sin((t / CYCLE_DURATION) * Math.PI * 2) * 0.3;
  const ring1TiltDeg = ring1TiltRad * (180 / Math.PI);

  // ---- RING 2 rotation (15s cycle, counter, seamless) ----
  const ring2Cycle = 15;
  const ring2Frame = localFrame % (fps * ring2Cycle);
  const ring2Rot = interpolate(ring2Frame, [0, fps * ring2Cycle], [0, -360], { extrapolateRight: 'clamp' });

  // ring2 tilt wobble
  const ring2TiltRad = Math.cos((t / CYCLE_DURATION) * Math.PI * 2 * 0.8) * 0.2;
  const ring2TiltDeg = ring2TiltRad * (180 / Math.PI);

  // ---- RING 3 slow rotation (60s mapped to 12s) ----
  const ring3Rot = interpolate(localFrame, [0, totalFrames], [0, (360 * CYCLE_DURATION) / 60], { extrapolateRight: 'clamp' });

  // ---- CORE PULSE (1.5s cycle, seamless) ----
  const corePulseFrames = fps * 3; // 3s full yoyo (1.5 in, 1.5 out)
  const corePulseLocal = localFrame % corePulseFrames;
  const coreScale = interpolate(
    corePulseLocal,
    [0, corePulseFrames / 2, corePulseFrames],
    [1, 1.08, 1],
    { easing: Easing.inOut(Easing.sin) }
  );
  const coreGlow = interpolate(
    corePulseLocal,
    [0, corePulseFrames / 2, corePulseFrames],
    [0, 0.8, 0],
    { easing: Easing.inOut(Easing.sin) }
  );

  // ---- SCANLINE LEFT (3s cycle seamless) ----
  const scanCycleFrames = fps * 3;
  const scanLeftLocal = localFrame % scanCycleFrames;
  const scanLeftTop = interpolate(scanLeftLocal, [0, scanCycleFrames], [-50, 350], { extrapolateRight: 'clamp' });

  // ---- SCANLINE RIGHT (3s cycle, 1.5s offset seamless) ----
  const scanRightOffset = fps * 1.5;
  const scanRightLocal = (localFrame + scanRightOffset) % scanCycleFrames;
  const scanRightTop = interpolate(scanRightLocal, [0, scanCycleFrames], [-50, 350], { extrapolateRight: 'clamp' });

  // ---- VIDEO SLOT PULSE (1.5s cycle) ----
  const slotPulseFrames = fps * 3;
  const slotPulseLocal = localFrame % slotPulseFrames;
  const slotGlowAlpha = interpolate(
    slotPulseLocal,
    [0, slotPulseFrames / 2, slotPulseFrames],
    [0.15, 0.35, 0.15],
    { easing: Easing.inOut(Easing.sin) }
  );
  const slotBorderAlpha = interpolate(
    slotPulseLocal,
    [0, slotPulseFrames / 2, slotPulseFrames],
    [1.0, 0.6, 1.0],
    { easing: Easing.inOut(Easing.sin) }
  );
  const borderCyan = `rgba(0, ${Math.round(255 * slotBorderAlpha)}, ${Math.round(255 * slotBorderAlpha)}, 1)`;

  // ---- HUD TOP ACCENT SLIDE (4s yoyo cycle = 8s total) ----
  const hudTopCycleFrames = fps * 8;
  const hudTopLocal = localFrame % hudTopCycleFrames;
  const hudTopAccentLeft = interpolate(
    hudTopLocal,
    [0, hudTopCycleFrames / 2, hudTopCycleFrames],
    [0, 1100, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  // ---- HUD BOTTOM ACCENT SLIDE (4s yoyo = 8s total) ----
  const hudBotCycleFrames = fps * 8;
  const hudBotLocal = localFrame % hudBotCycleFrames;
  // "right" goes from 0 to 700 and back — we use right property as offset from right edge
  const hudBotAccentRight = interpolate(
    hudBotLocal,
    [0, hudBotCycleFrames / 2, hudBotCycleFrames],
    [0, 700, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  // ---- ENERGY TRAILS Z position ----
  // Each trail moves from its start Z to camera (1200) in a cycle
  // Trail speed: 60 units/frame at 30fps => 1800/s. Full range ~3700 units.
  // Cycle = 3700/1800 ≈ 2.06s. We'll use 12s total cycle and mod each trail individually.
  const trailSpeedPerSecond = 1800; // units/sec
  const trailTotalRange = 3700; // from -2500 to 1200
  const trailCycleSeconds = trailTotalRange / trailSpeedPerSecond; // ~2.056s

  // ---- OCTAHEDRA CHUNK animations ----
  // chunk1: rotation loops, position sines
  // rotation: 0.01 rad/frame at 30fps = 0.3 rad/s x, 0.02*30=0.6 rad/s y
  // cycle for rotation: 2*PI/0.3 ≈ 20.9s x, 2*PI/0.6 ≈ 10.5s y
  // use t directly mod 2PI for seamless
  const chunk1RotX = ((t * 0.3) % (Math.PI * 2)) * (180 / Math.PI);
  const chunk1RotY = ((t * 0.6) % (Math.PI * 2)) * (180 / Math.PI);
  const chunk1Y_norm = Math.sin((t / CYCLE_DURATION) * Math.PI * 2) * 50; // sine over full cycle

  const chunk2RotX = ((-t * 0.6) % (Math.PI * 2)) * (180 / Math.PI);
  const chunk2RotY = ((-t * 0.3) % (Math.PI * 2)) * (180 / Math.PI);
  const chunk2Y_norm = Math.cos((t / CYCLE_DURATION) * Math.PI * 2) * 50;

  // ---- CAMERA DRIFT ----
  // camera.position.x = sin(t*0.4)*60, camera.position.y = cos(t*0.3)*40
  const camDriftX = Math.sin((t / CYCLE_DURATION) * Math.PI * 2 * 0.4 * CYCLE_DURATION) * 60;
  const camDriftY = Math.cos((t / CYCLE_DURATION) * Math.PI * 2 * 0.3 * CYCLE_DURATION) * 40;
  // We'll translate the 3D scene layer slightly to simulate camera drift
  const camDriftXPx = (camDriftX / 800) * 120; // perspective approximation
  const camDriftYPx = (camDriftY / 800) * 80;

  // ---- GRID MOTION (forward) ----
  // gridHelperBottom.position.z = (time * 400) % 120
  // We simulate this as a repeating perspective shift background
  const gridOffsetRaw = (t * 400) % 120;
  const gridOffsetPct = (gridOffsetRaw / 120) * 100;

  // ---- TEXT FADE IN ----
  const textFadeFrames = fps * 1.5;
  const textOpacity = interpolate(frame, [0, textFadeFrames], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // ---- SUB-RING PULSE for inner glow ----
  const subRingGlow = interpolate(
    slotPulseLocal,
    [0, slotPulseFrames / 2, slotPulseFrames],
    [0.5, 0.9, 0.5],
    { easing: Easing.inOut(Easing.sin) }
  );

  return (
    <div
      style={{
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'relative',
        background: '#010103',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
      }}
    >
      {/* ===== LAYER 0: CYBERPUNK GRID BACKGROUND ===== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          overflow: 'hidden',
          transform: `translate(${camDriftXPx * 0.3}px, ${camDriftYPx * 0.3}px)`,
        }}
      >
        {/* Bottom perspective grid */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '-10%',
            width: '120%',
            height: '52%',
            overflow: 'hidden',
          }}
        >
          {/* Horizontal lines */}
          {Array.from({ length: GRID_LINES_H }, (_, i) => {
            const progress = i / (GRID_LINES_H - 1);
            const yPct = progress * 100;
            const perspectiveWidth = 20 + progress * 80;
            const opacity = 0.1 + progress * 0.4;
            return (
              <div
                key={`gh-${i}`}
                style={{
                  position: 'absolute',
                  bottom: `${yPct}%`,
                  left: `${(100 - perspectiveWidth) / 2}%`,
                  width: `${perspectiveWidth}%`,
                  height: '1px',
                  background: `rgba(0, 170, 255, ${opacity})`,
                  boxShadow: `0 0 4px rgba(0, 170, 255, ${opacity * 0.5})`,
                  transform: `translateY(${gridOffsetPct * (1 - progress) * 0.5}%)`,
                }}
              />
            );
          })}
          {/* Vertical lines (perspective) */}
          {Array.from({ length: GRID_LINES_V }, (_, i) => {
            const t_v = i / (GRID_LINES_V - 1);
            const xBottom = t_v * 120 - 10;
            const xTop = 35 + t_v * 30;
            const opacity = 0.08 + Math.abs(t_v - 0.5) * 0.15;
            return (
              <svg
                key={`gv-${i}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
              >
                <line
                  x1={`${xBottom}%`}
                  y1="100%"
                  x2={`${xTop}%`}
                  y2="0%"
                  stroke={`rgba(0, 51, 153, ${opacity})`}
                  strokeWidth="1"
                />
              </svg>
            );
          })}
        </div>

        {/* Top perspective grid (mirrored) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-10%',
            width: '120%',
            height: '52%',
            overflow: 'hidden',
            transform: 'scaleY(-1)',
          }}
        >
          {Array.from({ length: GRID_LINES_H }, (_, i) => {
            const progress = i / (GRID_LINES_H - 1);
            const yPct = progress * 100;
            const perspectiveWidth = 20 + progress * 80;
            const opacity = 0.08 + progress * 0.3;
            return (
              <div
                key={`gth-${i}`}
                style={{
                  position: 'absolute',
                  bottom: `${yPct}%`,
                  left: `${(100 - perspectiveWidth) / 2}%`,
                  width: `${perspectiveWidth}%`,
                  height: '1px',
                  background: `rgba(0, 170, 255, ${opacity})`,
                  transform: `translateY(${gridOffsetPct * (1 - progress) * 0.5}%)`,
                }}
              />
            );
          })}
        </div>

        {/* Ambient fog overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(1,1,5,0) 30%, rgba(1,1,3,0.85) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ===== LAYER 1: ENERGY TRAILS ===== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          overflow: 'hidden',
          pointerEvents: 'none',
          transform: `translate(${camDriftXPx * 0.6}px, ${camDriftYPx * 0.6}px)`,
        }}
      >
        {TRAIL_DATA.map((trail, i) => {
          // Each trail starts at its Z and moves toward camera
          // Cycle based on individual speed phase offset
          const phaseOffset = (i / TRAIL_DATA.length) * trailCycleSeconds;
          const trailT = ((t + phaseOffset) % trailCycleSeconds) / trailCycleSeconds;
          // Z goes from -2500 to 1200
          const trailZ = -2500 + trailT * trailTotalRange;
          // Perspective projection: focal=800
          const focal = 800;
          const zClipped = Math.max(trailZ, -4999);
          const perspective = focal / (focal - zClipped * 0.001 * 100);
          // Skip if behind camera
          if (perspective <= 0) return null;
          const pScale = Math.max(0.02, Math.min(3.0, focal / (focal + Math.abs(zClipped) * 0.3)));
          const screenX = 960 + trail.x * pScale;
          const screenY = 540 + trail.y * pScale;
          const trailLen = Math.max(20, 400 * pScale * 0.8);
          const trailW = Math.max(1, 8 * pScale);
          const trailOpacity = Math.min(0.9, pScale * 0.7);
          const color = trail.isCyan ? '#00ffff' : '#0044ff';
          const glowColor = trail.isCyan ? 'rgba(0,255,255,' : 'rgba(0,68,255,';

          return (
            <div
              key={`trail-${i}`}
              style={{
                position: 'absolute',
                left: screenX - trailW / 2,
                top: screenY - trailLen / 2,
                width: trailW,
                height: trailLen,
                background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
                boxShadow: `0 0 ${trailW * 3}px ${glowColor}0.6)`,
                opacity: trailOpacity,
                borderRadius: 2,
              }}
            />
          );
        })}
      </div>

      {/* ===== LAYER 2: CENTER HOLOGRAPHIC RINGS (3D sim) ===== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
          overflow: 'hidden',
          transform: `translate(${camDriftXPx}px, ${camDriftYPx}px)`,
        }}
      >
        {/* Outer massive ring (torus wireframe sim) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 760,
            height: 760,
            marginLeft: -380,
            marginTop: -380,
            borderRadius: '50%',
            border: '15px solid rgba(0,255,255,0.8)',
            boxShadow: '0 0 60px rgba(0,255,255,0.5), inset 0 0 60px rgba(0,255,255,0.2)',
            transform: `rotate(${ring1Rot}deg) rotateX(${ring1TiltDeg}deg)`,
          }}
        />
        {/* Outer ring inner accent */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 730,
            height: 730,
            marginLeft: -365,
            marginTop: -365,
            borderRadius: '50%',
            border: '3px dashed rgba(0,255,255,0.4)',
            transform: `rotate(${-ring1Rot * 0.7}deg)`,
          }}
        />

        {/* Inner segmented gear ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 640,
            height: 640,
            marginLeft: -320,
            marginTop: -320,
            borderRadius: '50%',
            border: '40px solid rgba(0,51,255,0.85)',
            boxShadow: '0 0 50px rgba(0,51,255,0.6), inset 0 0 40px rgba(0,51,255,0.3)',
            transform: `rotate(${ring2Rot}deg) rotateY(${ring2TiltDeg}deg)`,
          }}
        />
        {/* Gear segments overlay */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 360 + ring2Rot;
          const rad = (angle * Math.PI) / 180;
          const r = 320;
          const cx = 960 + Math.cos(rad) * r;
          const cy = 540 + Math.sin(rad) * r;
          return (
            <div
              key={`gear-${i}`}
              style={{
                position: 'absolute',
                left: cx - 8,
                top: cy - 8,
                width: 16,
                height: 16,
                background: 'rgba(0,51,255,0.9)',
                boxShadow: '0 0 12px rgba(0,51,255,0.8)',
                borderRadius: 2,
                transform: `rotate(${angle}deg)`,
              }}
            />
          );
        })}

        {/* Particle ring (ring3) */}
        {PARTICLES.map((p, i) => {
          const totalRing3Rot = (ring3Rot * Math.PI) / 180;
          const angle = p.angle + totalRing3Rot;
          const r = p.radius * (900 / 450);
          const cx = 960 + Math.cos(angle) * r;
          const cy = 540 + Math.sin(angle) * r * 0.3;
          const pSize = 3 + Math.sin(p.angle * 3) * 1.5;
          const pOpacity = 0.4 + Math.sin(p.angle * 2 + totalRing3Rot) * 0.3;
          return (
            <div
              key={`particle-${i}`}
              style={{
                position: 'absolute',
                left: cx - pSize / 2,
                top: cy - pSize / 2,
                width: pSize,
                height: pSize,
                borderRadius: '50%',
                background: '#00ffff',
                boxShadow: '0 0 6px rgba(0,255,255,0.8)',
                opacity: Math.max(0, Math.min(1, pOpacity)),
              }}
            />
          );
        })}
      </div>

      {/* ===== LAYER 3: SIDE OCTAHEDRA ===== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 3,
          pointerEvents: 'none',
          overflow: 'hidden',
          transform: `translate(${camDriftXPx * 0.8}px, ${camDriftYPx * 0.8}px)`,
        }}
      >
        {/* Chunk 1 — left side */}
        <div
          style={{
            position: 'absolute',
            left: 160,
            top: 540 - 200 - chunk1Y_norm + 200,
            width: 160,
            height: 160,
            transform: `rotateX(${chunk1RotX}deg) rotateY(${chunk1RotY}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Octahedron sim with diamond shape */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 0,
              height: 0,
              borderLeft: '80px solid transparent',
              borderRight: '80px solid transparent',
              borderBottom: '80px solid rgba(0,255,255,0.7)',
              marginLeft: -80,
              marginTop: -80,
              filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.6))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 0,
              height: 0,
              borderLeft: '80px solid transparent',
              borderRight: '80px solid transparent',
              borderTop: '80px solid rgba(0,255,255,0.5)',
              marginLeft: -80,
              marginTop: 0,
              filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.4))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '20%',
              width: '60%',
              height: '60%',
              border: '2px solid rgba(0,255,255,0.3)',
              borderRadius: '50%',
              boxShadow: '0 0 15px rgba(0,255,255,0.3)',
            }}
          />
        </div>

        {/* Chunk 2 — right side */}
        <div
          style={{
            position: 'absolute',
            right: 160,
            top: 540 + 200 - chunk2Y_norm - 80,
            width: 160,
            height: 160,
            transform: `rotateX(${chunk2RotX}deg) rotateY(${chunk2RotY}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 0,
              height: 0,
              borderLeft: '80px solid transparent',
              borderRight: '80px solid transparent',
              borderBottom: '80px solid rgba(0,255,255,0.7)',
              marginLeft: -80,
              marginTop: -80,
              filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.6))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 0,
              height: 0,
              borderLeft: '80px solid transparent',
              borderRight: '80px solid transparent',
              borderTop: '80px solid rgba(0,255,255,0.5)',
              marginLeft: -80,
              marginTop: 0,
              filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.4))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '20%',
              width: '60%',
              height: '60%',
              border: '2px solid rgba(0,255,255,0.3)',
              borderRadius: '50%',
              boxShadow: '0 0 15px rgba(0,255,255,0.3)',
            }}
          />
        </div>
      </div>

      {/* ===== LAYER 4: UI OVERLAY ===== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: ORIGINAL_WIDTH,