import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const PARTICLE_COUNT = 120;

// Pre-calculated static particle data (deterministic, outside component)
const PARTICLES: { x: number; y: number; size: number; opacity: number; speed: number; drift: number }[] = [];
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const seed1 = (i * 7919 + 12347) % 10000 / 10000;
  const seed2 = (i * 6271 + 9001) % 10000 / 10000;
  const seed3 = (i * 3571 + 5003) % 10000 / 10000;
  const seed4 = (i * 4423 + 7177) % 10000 / 10000;
  const seed5 = (i * 2311 + 3001) % 10000 / 10000;
  PARTICLES.push({
    x: seed1 * 1920,
    y: seed2 * 1080,
    size: seed3 * 3 + 1,
    opacity: seed4 * 0.5 + 0.1,
    speed: seed5 * 0.4 + 0.1,
    drift: ((i * 1337 + 4321) % 10000 / 10000 - 0.5) * 20,
  });
}

// Pre-calculated grid lines (deterministic)
const GRID_LINES_H: number[] = [];
const GRID_LINES_V: number[] = [];
for (let i = 0; i <= 20; i++) {
  GRID_LINES_H.push((i / 20) * 1080);
  GRID_LINES_V.push((i / 20) * 1920);
}

// Pre-calculated ring data
const RING_DATA = [
  { baseY: 680, speedMult: 0.1, sinOffset: 0, scale: 1.0 },
  { baseY: 620, speedMult: 0.15, sinOffset: 1, scale: 0.85 },
  { baseY: 560, speedMult: 0.2, sinOffset: 2, scale: 0.70 },
];

// Deterministic sin approximation using frame
function frameSin(frameAngle: number): number {
  const normalized = ((frameAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const x = normalized / (2 * Math.PI);
  // Taylor-like approximation is fine; use direct trig with frame which is deterministic
  return Math.sin(normalized);
}

const LuxuryFuturisticEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  // ─── CYCLE DURATIONS ─────────────────────────────────────────────────────────
  // ring-outer: 15s, ring-middle: 20s, ring-inner: 10s, pulse: 4s, sweep: 6s
  // card float: 8s cycle (4s yoyo), subzone float: 7s cycle
  // LCM(15,20,10,4,6,8,7) capped at 15s
  const cycleDuration = 12; // 12s master cycle
  const cycleFrames = fps * cycleDuration;
  const localFrame = frame % cycleFrames;
  const t = localFrame / fps; // time in seconds within cycle

  // ─── RING OUTER: 360deg in 15s ───────────────────────────────────────────────
  const ringOuterAngle = (t / 15) * 360;

  // ─── RING MIDDLE: reverse 360deg in 20s ──────────────────────────────────────
  const ringMiddleAngle = -((t / 20) * 360);

  // ─── RING INNER: oscillate (10s ease-in-out alternate) ───────────────────────
  // Map to 0->360 over 10s symmetrically looped over 12s cycle
  const ringInnerLocal = localFrame % (fps * 10);
  const ringInnerAngle = interpolate(
    ringInnerLocal,
    [0, fps * 5, fps * 10],
    [0, 360, 0],
    { easing: Easing.inOut(Easing.sin) }
  );

  // ─── PULSE: scale + glow, 4s ease-in-out symmetric loop ──────────────────────
  const pulseLocal = localFrame % (fps * 4);
  const pulseScale = interpolate(
    pulseLocal,
    [0, fps * 2, fps * 4],
    [1, 1.02, 1],
    { easing: Easing.inOut(Easing.sin) }
  );
  const pulseGlowOpacity = interpolate(
    pulseLocal,
    [0, fps * 2, fps * 4],
    [0.4, 0.7, 0.4],
    { easing: Easing.inOut(Easing.sin) }
  );
  const pulseInnerGlow = interpolate(
    pulseLocal,
    [0, fps * 2, fps * 4],
    [0.2, 0.4, 0.2],
    { easing: Easing.inOut(Easing.sin) }
  );

  // ─── LIGHT SWEEP LEFT CARD: 6s cycle ─────────────────────────────────────────
  // 0% left:-150%, 20% left:200%, 100% left:200%
  // Sweep travels from -150% to 200% in first 20% of 6s (1.2s), then stays
  const sweepLocal = localFrame % (fps * 6);
  const sweepLeftPos = interpolate(
    sweepLocal,
    [0, fps * 1.2, fps * 6],
    [-150, 200, 200],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Right card delayed by 3s — offset by 3s in the 6s cycle
  const sweepRightLocal = (localFrame + fps * 3) % (fps * 6);
  const sweepRightPos = interpolate(
    sweepRightLocal,
    [0, fps * 1.2, fps * 6],
    [-150, 200, 200],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // ─── CARD FLOAT: yoyo 4s → 8s symmetric cycle ────────────────────────────────
  const cardFloatLocal = localFrame % (fps * 8);
  const cardLeftFloat = interpolate(
    cardFloatLocal,
    [0, fps * 4, fps * 8],
    [0, -15, 0],
    { easing: Easing.inOut(Easing.sin) }
  );
  // Right card staggered by 1s
  const cardRightFloatLocal = (localFrame + fps * 1) % (fps * 8);
  const cardRightFloat = interpolate(
    cardRightFloatLocal,
    [0, fps * 4, fps * 8],
    [0, -15, 0],
    { easing: Easing.inOut(Easing.sin) }
  );

  // ─── SUBZONE FLOAT: yoyo 3.5s → 7s symmetric cycle ───────────────────────────
  const subzoneLocal = localFrame % (fps * 7);
  const subzoneFloat = interpolate(
    subzoneLocal,
    [0, fps * 3.5, fps * 7],
    [0, 10, 0],
    { easing: Easing.inOut(Easing.sin) }
  );

  // ─── HUD LINE PULSE ───────────────────────────────────────────────────────────
  const hudLineLocal = localFrame % (fps * 6);
  const hudLineOpacity = interpolate(
    hudLineLocal,
    [0, fps * 3, fps * 6],
    [0.5, 0.8, 0.5],
    { easing: Easing.inOut(Easing.sin) }
  );

  // ─── TITLE FADE-IN ───────────────────────────────────────────────────────────
  const titleOpacity = interpolate(
    frame,
    [0, fps * 1.5],
    [0, 1],
    { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );
  const titleY = interpolate(
    frame,
    [0, fps * 1.5],
    [20, 0],
    { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  // ─── KEYWORDS FADE-IN (staggered) ────────────────────────────────────────────
  const kwOpacity = interpolate(
    frame,
    [fps * 1.0, fps * 2.5],
    [0, 1],
    { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }
  );

  // ─── AMBIENT BACKGROUND PULSE (camera light movement approximation) ───────────
  const bgPulseLocal = localFrame % (fps * 12);
  const bgLightX = interpolate(
    bgPulseLocal,
    [0, fps * 6, fps * 12],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.sin) }
  );

  // ─── 3D RINGS (CSS perspective simulation) ────────────────────────────────────
  // Holographic ring vertical float (sin-based)
  const ring3dSin0 = frameSin((t * 1.0 + RING_DATA[0].sinOffset) * (Math.PI / 3));
  const ring3dSin1 = frameSin((t * 1.0 + RING_DATA[1].sinOffset) * (Math.PI / 3));
  const ring3dSin2 = frameSin((t * 1.0 + RING_DATA[2].sinOffset) * (Math.PI / 3));

  // ─── GRID OPACITY PULSE ──────────────────────────────────────────────────────
  const gridLocal = localFrame % (fps * 8);
  const gridOpacity = interpolate(
    gridLocal,
    [0, fps * 4, fps * 8],
    [0.08, 0.15, 0.08],
    { easing: Easing.inOut(Easing.sin) }
  );

  // ─── PARTICLE ANIMATION ──────────────────────────────────────────────────────
  const particleTime = t; // seconds, deterministic

  return (
    <div
      style={{
        width,
        height,
        background: '#02050a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* MAIN SCALED WRAPPER */}
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
          background: `radial-gradient(circle at ${50 + bgLightX * 10}% 50%, #050b1a 0%, #020408 100%)`,
        }}
      >

        {/* ═══ BACKGROUND LAYER: Simulated 3D Environment ══════════════════════ */}

        {/* Perspective floor with gradient */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '55%',
            background: `linear-gradient(180deg, transparent 0%, rgba(0,4,20,0.8) 40%, #020408 100%)`,
            zIndex: 2,
          }}
        />

        {/* Grid floor — perspective simulation */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '-20%',
            width: '140%',
            height: '50%',
            zIndex: 1,
            opacity: gridOpacity,
            transform: 'perspective(600px) rotateX(70deg)',
            transformOrigin: 'bottom center',
            overflow: 'hidden',
          }}
        >
          {/* Horizontal grid lines */}
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={`h${i}`}
              style={{
                position: 'absolute',
                left: 0,
                width: '100%',
                height: 1,
                top: `${(i / 14) * 100}%`,
                background: i === 0 ? 'rgba(0,240,255,0.6)' : 'rgba(0,68,136,0.8)',
              }}
            />
          ))}
          {/* Vertical grid lines */}
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={`v${i}`}
              style={{
                position: 'absolute',
                top: 0,
                height: '100%',
                width: 1,
                left: `${(i / 19) * 100}%`,
                background: i === 0 || i === 19 ? 'rgba(0,240,255,0.6)' : 'rgba(0,68,136,0.8)',
              }}
            />
          ))}
        </div>

        {/* ═══ HOLOGRAPHIC 3D RINGS (CSS perspective) ══════════════════════════ */}
        {[0, 1, 2].map((idx) => {
          const ringData = RING_DATA[idx];
          const ringRadius = 220 - idx * 40;
          const sinVal = [ring3dSin0, ring3dSin1, ring3dSin2][idx];
          const yPos = ORIGINAL_HEIGHT * 0.45 + sinVal * 15;
          const ringRotZ = idx === 0
            ? (t * ringData.speedMult * 360) % 360
            : idx === 1
              ? -(t * ringData.speedMult * 360) % 360
              : (t * ringData.speedMult * 360) % 360;

          return (
            <div
              key={`3dring${idx}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: yPos,
                width: ringRadius * 2.5,
                height: ringRadius * 0.5,
                marginLeft: -(ringRadius * 2.5) / 2,
                marginTop: -(ringRadius * 0.5) / 2,
                borderRadius: '50%',
                border: `2px solid rgba(0,240,255,${0.3 - idx * 0.05})`,
                boxShadow: `0 0 30px rgba(0,240,255,0.15), 0 0 60px rgba(0,240,255,0.08)`,
                transform: `rotateX(80deg) rotateZ(${ringRotZ}deg)`,
                transformOrigin: 'center center',
                zIndex: 3,
                opacity: 0.6 - idx * 0.1,
              }}
            />
          );
        })}

        {/* ═══ AMBIENT PARTICLES ═══════════════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 4,
            overflow: 'hidden',
          }}
        >
          {PARTICLES.map((p, i) => {
            // Deterministic float: each particle moves at its own speed
            const cycleSeconds = 15; // particle reset cycle
            const particleLocalT = particleTime % cycleSeconds;
            const traveled = (p.speed * particleLocalT * 80);
            const rawY = p.y - traveled;
            const wrappedY = ((rawY % ORIGINAL_HEIGHT) + ORIGINAL_HEIGHT) % ORIGINAL_HEIGHT;
            const driftX = p.x + Math.sin(particleTime * 0.5 + i * 0.3) * p.drift;
            const wrappedX = ((driftX % ORIGINAL_WIDTH) + ORIGINAL_WIDTH) % ORIGINAL_WIDTH;

            return (
              <div
                key={`p${i}`}
                style={{
                  position: 'absolute',
                  left: wrappedX,
                  top: wrappedY,
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(0,240,255,0.7) 40%, transparent 100%)`,
                  opacity: p.opacity,
                  boxShadow: `0 0 ${p.size * 2}px rgba(0,240,255,0.6)`,
                }}
              />
            );
          })}
        </div>

        {/* ═══ AMBIENT LIGHT BLOBS (floor lighting simulation) ════════════════ */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: `${10 + bgLightX * 30}%`,
            width: 400,
            height: 300,
            background: 'radial-gradient(circle, rgba(0,240,255,0.12) 0%, transparent 70%)',
            zIndex: 5,
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: `${10 + bgLightX * 25}%`,
            width: 400,
            height: 300,
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            zIndex: 5,
            filter: 'blur(40px)',
          }}
        />

        {/* ═══ UI LAYER ════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
          }}
        >

          {/* ── HUD LINE TOP ── */}
          <div
            style={{
              position: 'absolute',
              top: 120,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 600,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.5), transparent)',
              opacity: hudLineOpacity,
            }}
          />

          {/* ── HUD LINE BOTTOM ── */}
          <div
            style={{
              position: 'absolute',
              bottom: 120,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 600,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.5), transparent)',
              opacity: hudLineOpacity,
            }}
          />

          {/* ── VIDEO CARD LEFT ── */}
          <div
            style={{
              position: 'absolute',
              width: 600,
              height: 337,
              top: '50%',
              left: 220,
              transform: `translateY(calc(-50% + ${cardLeftFloat}px))`,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,170,255,0.05) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,200,255,0.2)',
              borderRadius: 12,
              boxShadow: `0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 20px rgba(0,150,255,0.1), 0 0 30px rgba(0,150,255,0.15)`,
              overflow: 'hidden',
            }}
          >
            {/* Light sweep */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: `${sweepLeftPos}%`,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                transform: 'skewX(-25deg)',
              }}
            />
            {/* HUD corners */}
            <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTop: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff', borderRadius: 4, opacity: 0.6, boxShadow: '0 0 10px #00f0ff' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTop: '2px solid #00f0ff', borderRight: '2px solid #00f0ff', borderRadius: 4, opacity: 0.6, boxShadow: '0 0 10px #00f0ff' }} />
            <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottom: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff', borderRadius: 4, opacity: 0.6, boxShadow: '0 0 10px #00f0ff' }} />
            <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottom: '2px solid #00f0ff', borderRight: '2px solid #00f0ff', borderRadius: 4, opacity: 0.6, boxShadow: '0 0 10px #00f0ff' }} />

            {/* Card inner content hint */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: '2px solid rgba(0,240,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0,240,255,0.2)',
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '12px solid transparent',
                    borderBottom: '12px solid transparent',
                    borderLeft: '20px solid rgba(0,240,255,0.6)',
                    marginLeft: 4,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── VIDEO CARD RIGHT ── */}
          <div
            style={{
              position: 'absolute',
              width: 600,
              height: 337,
              top: '50%',
              right: 220,
              transform: `translateY(calc(-50% + ${cardRightFloat}px))`,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,170,255,0.05) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,200,255,0.2)',
              borderRadius: 12,
              boxShadow: `0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 20px rgba(0,150,255,0.1), 0 0 30px rgba(0,150,255,0.15)`,
              overflow: 'hidden',
            }}
          >
            {/* Light sweep */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: `${sweepRightPos}%`,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                transform: 'skewX(-25deg)',
              }}
            />
            {/* HUD corners */}
            <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTop: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff', borderRadius: 4, opacity: 0.6, boxShadow: '0 0 10px #00f0ff' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTop: '2px solid #00f0ff', borderRight: '2px solid #00f0ff', borderRadius: 4, opacity: 0.6, boxShadow: '0 0 10px #00f0ff' }} />
            <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottom: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff', borderRadius: 4, opacity: 0.6, boxShadow: '0 0 10px #00f0ff' }} />
            <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottom: '2px solid #00f0ff', borderRight: '2px solid #00f0ff', borderRadius: 4, opacity: 0.6, boxShadow: '0 0 10px #00f0ff' }} />

            {/* Card inner content hint */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: '2px solid rgba(0,240,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0,240,255,0.2)',
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '12px solid transparent',
                    borderBottom: '12px solid transparent',
                    borderLeft: '20px solid rgba(0,240,255,0.6)',
                    marginLeft: 4,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── SUBSCRIBE ZONE (CENTER) ── */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, calc(-50% + ${subzoneFloat}px))`,
              width: 240,
              height: 240,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Ring Outer */}
            <div
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: '50%',
                borderTop: '2px solid #00f0ff',
                borderBottom: '2px solid #ffffff',
                borderLeft: '2px solid transparent',
                borderRight: '2px solid transparent',
                boxShadow: '0 0 40px rgba(0,240,255,0.2)',
                transform: `rotate(${ringOuterAngle}deg)`,
              }}
            />

            {/* Ring Middle (dashed simulation with border) */}
            <div
              style={{
                position: 'absolute',
                width: 190,
                height: 190,
                borderRadius: '50%',
                border: '1px dashed rgba(255,255,255,0.4)',
                transform: `rotate(${ringMiddleAngle}deg)`,
              }}
            />

            {/* Ring Inner */}
            <div
              style={{
                position: 'absolute',
                width: 160,
                height: 160,
                borderRadius: '50%',
                borderLeft: '2px solid rgba(0,200,255,0.8)',
                borderRight: '2px solid rgba(0,200,255,0.8)',
                borderTop: '2px solid transparent',
                borderBottom: '2px solid transparent',
                transform: `rotate(${ringInnerAngle}deg)`,
              }}
            />

            {/* Sub Center */}
            <div
              style={{
                width: 140,
                height: 140,
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,150,255,0.05) 60%, transparent 100%)',
                borderRadius: '50%',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '2px solid rgba(255,255,255,0.5)',
                boxShadow: `0 0 ${pulseGlowOpacity * 60}px rgba(0,240,255,${pulseGlowOpacity}), inset 0 0 ${pulseInnerGlow * 60}px rgba(255,255,255,${pulseInnerGlow})`,
                transform: `scale(${pulseScale})`,
                display: