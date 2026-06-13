import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Pre-calculated static particle data (deterministic, outside component)
const PARTICLE_COUNT = 120;
const STATIC_PARTICLES: { x: number; y: number; size: number; speed: number; color: string; opacity: number }[] = [];
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const seed1 = (i * 1.7321 + 13.37) % 1;
  const seed2 = (i * 3.1415 + 7.77) % 1;
  const seed3 = (i * 2.6180 + 4.44) % 1;
  const seed4 = (i * 0.9999 + 1.11) % 1;
  const seed5 = (i * 5.4321 + 2.22) % 1;
  STATIC_PARTICLES.push({
    x: seed1 * 1920,
    y: seed2 * 1080,
    size: 1 + seed3 * 3,
    speed: 0.3 + seed4 * 1.2,
    color: seed5 > 0.5 ? '#00ffff' : '#ff00ff',
    opacity: 0.3 + seed3 * 0.7,
  });
}

// Pre-calculated background ring data
const RING_DATA: { rotX: number; rotY: number; scale: number; posZ: number; color: string }[] = [];
for (let i = 0; i < 5; i++) {
  const s1 = (i * 2.3456 + 1.1) % 1;
  const s2 = (i * 1.2345 + 2.2) % 1;
  RING_DATA.push({
    rotX: s1 * Math.PI,
    rotY: s2 * Math.PI,
    scale: 1 + i * 0.5,
    posZ: -50 - i * 20,
    color: i % 2 === 0 ? '#00ffff' : '#ff00ff',
  });
}

// Pre-calculated grid line data
const GRID_LINES_H: number[] = [];
const GRID_LINES_V: number[] = [];
for (let i = 0; i <= 54; i++) GRID_LINES_H.push(i * 20);
for (let i = 0; i <= 96; i++) GRID_LINES_V.push(i * 20);

// Streak configs
const STREAK_CONFIGS = [
  { top: 250, width: 600, color: 'cyan', cycleDuration: 1.5, delay: 0 },
  { top: 850, width: 800, color: 'magenta', cycleDuration: 2.0, delay: 1.2 },
  { top: 450, width: 500, color: 'cyan', cycleDuration: 1.2, delay: 0.5 },
];

// Core target ring pulses - 3 staggered rings
const TARGET_RING_COUNT = 3;

const CyberpunkEsportsEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const totalFrames = 900; // 15s @ 60fps
  const loopFrame = frame % totalFrames;
  const time = loopFrame / fps; // seconds within loop

  // ---- OUTER RING rotation (8s cycle) ----
  const outerRingCycle = fps * 8;
  const outerRingLocalFrame = loopFrame % outerRingCycle;
  const outerRingRotation = interpolate(outerRingLocalFrame, [0, outerRingCycle], [0, 360], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ---- INNER RING rotation (12s cycle, counter-clockwise) ----
  const innerRingCycle = fps * 12;
  const innerRingLocalFrame = loopFrame % innerRingCycle;
  const innerRingRotation = interpolate(innerRingLocalFrame, [0, innerRingCycle], [0, -360], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ---- CORE GLOW pulse (2s ease-in-out alternate) ----
  const corePulseCycle = fps * 2;
  const corePulseLocal = loopFrame % corePulseCycle;
  const corePulseT = corePulseLocal / corePulseCycle;
  // alternate: 0->1->0 symmetrical
  const corePulsePhase = corePulseT < 0.5
    ? interpolate(corePulseLocal, [0, corePulseCycle * 0.5], [0, 1], { easing: Easing.inOut(Easing.sin) })
    : interpolate(corePulseLocal, [corePulseCycle * 0.5, corePulseCycle], [1, 0], { easing: Easing.inOut(Easing.sin) });

  const coreScale = interpolate(corePulsePhase, [0, 1], [0.9, 1.1]);
  const coreOpacity = interpolate(corePulsePhase, [0, 1], [0.8, 1.0]);
  const coreBrightness = interpolate(corePulsePhase, [0, 1], [1, 1.5]);

  // ---- SCANLINE animation (4s linear cycle) ----
  const scanlineCycle = fps * 4;
  const scanline1Local = loopFrame % scanlineCycle;
  const scanlineY1 = interpolate(scanline1Local, [0, scanlineCycle], [-100, 400], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // offset second scanline by half cycle
  const scanline2Local = (loopFrame + Math.floor(scanlineCycle * 0.5)) % scanlineCycle;
  const scanlineY2 = interpolate(scanline2Local, [0, scanlineCycle], [-100, 400], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ---- PLACEHOLDER box shadow pulse ----
  const boxShadowCycle = fps * 2.5;
  const boxShadowLocal = loopFrame % boxShadowCycle;
  const boxShadowPhase = boxShadowLocal < boxShadowCycle * 0.5
    ? interpolate(boxShadowLocal, [0, boxShadowCycle * 0.5], [0, 1], { easing: Easing.inOut(Easing.quad) })
    : interpolate(boxShadowLocal, [boxShadowCycle * 0.5, boxShadowCycle], [1, 0], { easing: Easing.inOut(Easing.quad) });

  const shadowAlpha1 = interpolate(boxShadowPhase, [0, 1], [0.4, 0.8]);
  const shadowAlpha2 = interpolate(boxShadowPhase, [0, 1], [0.2, 0.4]);
  const placeholderBoxShadow = `0 0 40px rgba(0,255,255,${shadowAlpha1}), inset 0 0 50px rgba(0,255,255,${shadowAlpha2})`;

  // ---- BACKGROUND ring group rotation ----
  const bgRingGroupRotZ = (loopFrame / fps) * 0.1; // rad/s
  const bgRingGroupRotY = (loopFrame / fps) * 0.05;

  // ---- CAMERA parallax (simulated as background shift) ----
  const camX = Math.sin(time * 0.3) * 10;
  const camY = Math.cos(time * 0.4) * 5;

  // ---- GRID forward movement (perspective illusion via backgroundPosition) ----
  const gridSpeed = 15;
  const gridCellSize = 20;
  const gridOffsetY = (time * gridSpeed * 0.5) % gridCellSize;

  // ---- POINT LIGHT intensity pulses (CSS glow simulation) ----
  const cyanLightIntensity = 5 + Math.sin(time * 3) * 2;
  const magentaLightIntensity = 5 + Math.cos(time * 2.5) * 2;
  const cyanGlowAlpha = interpolate(cyanLightIntensity, [3, 7], [0.3, 0.8]);
  const magentaGlowAlpha = interpolate(magentaLightIntensity, [3, 7], [0.3, 0.8]);

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
        background: 'radial-gradient(circle at center, #020412 0%, #000000 100%)',
      }}
    >
      {/* ===== WEBGL LAYER REPLACEMENT: CSS 3D Scene ===== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, #01020a 0%, #000000 100%)',
        }}
      >
        {/* Fog overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'radial-gradient(ellipse at center, transparent 20%, rgba(1,2,10,0.6) 100%)',
            zIndex: 50,
          }}
        />

        {/* Cyan ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '30%', left: '-15%',
            width: '60%', height: '60%',
            borderRadius: '50%',
            background: `radial-gradient(circle at center, rgba(0,255,255,${cyanGlowAlpha * 0.15}) 0%, transparent 70%)`,
            zIndex: 2,
          }}
        />
        {/* Magenta ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '10%', left: '60%',
            width: '60%', height: '60%',
            borderRadius: '50%',
            background: `radial-gradient(circle at center, rgba(255,0,255,${magentaGlowAlpha * 0.15}) 0%, transparent 70%)`,
            zIndex: 2,
          }}
        />

        {/* ===== HOLOGRAPHIC GRID FLOOR (CSS perspective simulation) ===== */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '-10%',
            width: '120%',
            height: '65%',
            zIndex: 3,
            transform: 'perspective(800px) rotateX(65deg)',
            transformOrigin: 'bottom center',
          }}
        >
          {/* Cyan grid */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: `${gridCellSize * 3}px ${gridCellSize * 3}px`,
              backgroundPosition: `0px ${gridOffsetY * 3}px`,
              opacity: 0.5,
            }}
          />
          {/* Magenta grid overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `linear-gradient(rgba(255,0,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,255,0.15) 1px, transparent 1px)`,
              backgroundSize: `${gridCellSize * 10}px ${gridCellSize * 10}px`,
              backgroundPosition: `0px ${((time * 15) % (gridCellSize * 10) * 0.5)}px`,
              opacity: 0.4,
            }}
          />
        </div>

        {/* ===== BACKGROUND ROTATING TORUS RINGS (CSS perspective) ===== */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 1,
            height: 1,
            transform: `translate(-50%, -50%) translateX(${camX * 2}px) translateY(${camY * 2}px)`,
            zIndex: 4,
          }}
        >
          {RING_DATA.map((ring, i) => {
            const ringIndivRotX = ring.rotX + bgRingGroupRotZ * (i % 2 === 0 ? 1 : -1) * 0.2;
            const ringIndivRotY = ring.rotY + bgRingGroupRotY;
            const sizeBase = 320 * ring.scale;
            const perspective = 800 - ring.posZ * 3;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: sizeBase,
                  height: sizeBase,
                  top: -sizeBase / 2,
                  left: -sizeBase / 2,
                  borderRadius: '50%',
                  border: `2px solid ${ring.color}`,
                  boxShadow: `0 0 20px ${ring.color}, 0 0 40px ${ring.color}`,
                  opacity: 0.25 - i * 0.03,
                  transform: `perspective(${perspective}px) rotateX(${(ringIndivRotX * 180) / Math.PI + bgRingGroupRotZ * 30}deg) rotateY(${(ringIndivRotY * 180) / Math.PI + bgRingGroupRotY * 20}deg) rotateZ(${bgRingGroupRotZ * 57.3}deg)`,
                }}
              />
            );
          })}
        </div>

        {/* ===== PARTICLES ===== */}
        {STATIC_PARTICLES.map((p, i) => {
          const cycleDur = fps * (10 / p.speed);
          const pLocal = (loopFrame + Math.floor(i * cycleDur / PARTICLE_COUNT)) % Math.floor(cycleDur);
          const pX = (p.x + (pLocal / cycleDur) * 1920) % 1920;
          const pOpacity = interpolate(
            pLocal,
            [0, cycleDur * 0.1, cycleDur * 0.9, cycleDur],
            [0, p.opacity, p.opacity, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: pX,
                top: p.y,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: p.color,
                opacity: pOpacity,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                zIndex: 5,
              }}
            />
          );
        })}
      </div>

      {/* ===== UI LAYER ===== */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* ===== LEFT PLACEHOLDER ===== */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 338,
            top: 371,
            left: 100,
            background: 'rgba(1,4,15,0.7)',
            border: '3px solid #00ffff',
            boxShadow: placeholderBoxShadow,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          {/* Interior grid */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />
          {/* Scanline 1 */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0,255,255,0.4), transparent)',
              top: 0,
              left: 0,
              transform: `translateY(${scanlineY1}px)`,
              zIndex: 1,
            }}
          />
          {/* Corners */}
          {/* TL */}
          <div style={{ position: 'absolute', width: 40, height: 40, top: -4, left: -4, borderTop: '4px solid #fff', borderLeft: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          {/* TR */}
          <div style={{ position: 'absolute', width: 40, height: 40, top: -4, right: -4, borderTop: '4px solid #fff', borderRight: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          {/* BL */}
          <div style={{ position: 'absolute', width: 40, height: 40, bottom: -4, left: -4, borderBottom: '4px solid #fff', borderLeft: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          {/* BR */}
          <div style={{ position: 'absolute', width: 40, height: 40, bottom: -4, right: -4, borderBottom: '4px solid #fff', borderRight: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
        </div>

        {/* ===== RIGHT PLACEHOLDER ===== */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 338,
            top: 371,
            right: 100,
            background: 'rgba(1,4,15,0.7)',
            border: '3px solid #00ffff',
            boxShadow: placeholderBoxShadow,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          {/* Interior grid */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />
          {/* Scanline 2 (offset) */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0,255,255,0.4), transparent)',
              top: 0,
              left: 0,
              transform: `translateY(${scanlineY2}px)`,
              zIndex: 1,
            }}
          />
          {/* Corners */}
          <div style={{ position: 'absolute', width: 40, height: 40, top: -4, left: -4, borderTop: '4px solid #fff', borderLeft: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', width: 40, height: 40, top: -4, right: -4, borderTop: '4px solid #fff', borderRight: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', width: 40, height: 40, bottom: -4, left: -4, borderBottom: '4px solid #fff', borderLeft: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', width: 40, height: 40, bottom: -4, right: -4, borderBottom: '4px solid #fff', borderRight: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
        </div>

        {/* ===== SUBSCRIBE PORTAL (CENTER) ===== */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            left: 780,
            top: 360,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
          }}
        >
          {/* Outer Reactor Ring */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '4px solid transparent',
              borderTop: '4px solid #00ffff',
              borderBottom: '4px solid #00ffff',
              boxShadow: `0 0 30px #00ffff, inset 0 0 20px #00ffff`,
              transform: `rotate(${outerRingRotation}deg)`,
            }}
          />
          {/* Inner Magenta Ring */}
          <div
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              border: '4px dashed #ff00ff',
              boxShadow: '0 0 40px #ff00ff, inset 0 0 20px #ff00ff',
              transform: `rotate(${innerRingRotation}deg)`,
            }}
          />
          {/* Central Holographic Core */}
          <div
            style={{
              position: 'absolute',
              width: '45%',
              height: '45%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, #ffffff 0%, #00ffff 40%, transparent 70%)',
              boxShadow: `0 0 80px #00ffff, 0 0 120px #00ffff`,
              transform: `scale(${coreScale})`,
              opacity: coreOpacity,
              filter: `brightness(${coreBrightness})`,
            }}
          />
          {/* Core Target Rings - 3 staggered rings expanding outward */}
          {Array.from({ length: TARGET_RING_COUNT }).map((_, i) => {
            const targetCycle = fps * 1;
            const offset = Math.floor((targetCycle * i) / TARGET_RING_COUNT);
            const targetLocal = (loopFrame + offset) % targetCycle;
            const targetScale = interpolate(targetLocal, [0, targetCycle], [0, 3], { easing: Easing.out(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const targetOpacity = interpolate(targetLocal, [0, targetCycle], [1, 0], { easing: Easing.out(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '25%',
                  height: '25%',
                  borderRadius: '50%',
                  border: '6px solid #fff',
                  boxShadow: '0 0 20px #fff',
                  transform: `scale(${targetScale})`,
                  opacity: targetOpacity,
                }}
              />
            );
          })}
        </div>

        {/* ===== LIGHT STREAKS ===== */}
        {STREAK_CONFIGS.map((streak, i) => {
          const streakFpsCycle = Math.round(streak.cycleDuration * fps);
          const delayFrames = Math.round(streak.delay * fps);
          const streakLocal = (loopFrame - delayFrames + totalFrames) % totalFrames;
          const streakCycleLocal = streakLocal % streakFpsCycle;

          // power4.inOut: ease in then out
          const streakProgress = interpolate(
            streakCycleLocal,
            [0, streakFpsCycle * 0.5, streakFpsCycle],
            [0, 0.7, 1],
            { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const streakX = interpolate(streakProgress, [0, 1], [-600, ORIGINAL_WIDTH + 400]);
          const streakOpacity = streakCycleLocal < streakFpsCycle * 0.05
            ? interpolate(streakCycleLocal, [0, streakFpsCycle * 0.05], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            : streakCycleLocal > streakFpsCycle * 0.9
            ? interpolate(streakCycleLocal, [streakFpsCycle * 0.9, streakFpsCycle], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            : 1;

          const isMagenta = streak.color === 'magenta';
          const streakBg = isMagenta
            ? 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)'
            : 'linear-gradient(90deg, transparent, #00ffff, #ffffff)';
          const streakShadow = isMagenta
            ? '0 0 20px #ff00ff, 0 0 40px #ff00ff'
            : '0 0 20px #00ffff, 0 0 40px #00ffff';

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                height: 2,
                width: streak.width,
                background: streakBg,
                boxShadow: streakShadow,
                borderRadius: '50%',
                top: streak.top,
                left: 0,
                zIndex: 5,
                opacity: streakOpacity,
                mixBlendMode: 'screen',
                transform: `translateX(${streakX}px)`,
              }}
            />
          );
        })}
      </div>

      {/* ===== VIGNETTE ===== */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          boxShadow: 'inset 0 0 250px rgba(0,0,0,0.9)',
          zIndex: 20,
          pointerEvents: 'none',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
};

export default CyberpunkEsportsEndscreen;
// END_OF_FILE