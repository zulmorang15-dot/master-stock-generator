import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const R = 34;
const w = R * 2;
const h = Math.sqrt(3) * R;
const hSpacing = w * 0.75;

interface Hex {
  x: number;
  y: number;
  base: number;
  phase: number;
  spd: number;
}

const STATIC_HEXES: Hex[] = (() => {
  const list: Hex[] = [];
  const cols = Math.ceil(ORIGINAL_WIDTH / hSpacing) + 2;
  const rows = Math.ceil(ORIGINAL_HEIGHT / h) + 2;

  let seed = 12345;
  function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  for (let col = -1; col < cols; col++) {
    for (let row = -1; row < rows; row++) {
      const x = col * hSpacing;
      const y = row * h + (col % 2 !== 0 ? h / 2 : 0);
      const dx = (x - ORIGINAL_WIDTH * 0.5) / (ORIGINAL_WIDTH * 0.5);
      const dy = (y - ORIGINAL_HEIGHT * 0.4) / (ORIGINAL_HEIGHT * 0.5);
      const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const base = 0.10 + (1 - dist) * 0.30;
      const phase = random() * Math.PI * 2;
      const spd = 0.4 + random() * 1.2;
      list.push({ x, y, base, phase, spd });
    }
  }
  return list;
})();

const EndScreenPro: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    const t = frame * 0.02;

    STATIC_HEXES.forEach(hx => {
      const flick = 0.5 + 0.5 * Math.sin(t * hx.spd + hx.phase);
      const alpha = hx.base * 0.4 + hx.base * flick;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i);
        const px = hx.x + R * Math.cos(a);
        const py = hx.y + R * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(90, 165, 225, ${alpha})`;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(150, 210, 255, ${alpha * 0.6})`;
      ctx.stroke();
    });
  }, [frame]);

  const floatACycle = 150;
  const localFrameA = frame % floatACycle;
  const txA = interpolate(localFrameA, [0, 75, 150], [0, 15, 0], { easing: Easing.inOut(Easing.quad) });
  const tyA = interpolate(localFrameA, [0, 75, 150], [0, 15, 0], { easing: Easing.inOut(Easing.quad) });
  const rotA = interpolate(localFrameA, [0, 75, 150], [0, 8, 0], { easing: Easing.inOut(Easing.quad) });

  const floatBCycle = 225;
  const localFrameB = (225 - (frame % floatBCycle)) % floatBCycle;
  const txB = interpolate(localFrameB, [0, 112.5, 225], [0, 15, 0], { easing: Easing.inOut(Easing.quad) });
  const tyB = interpolate(localFrameB, [0, 112.5, 225], [0, 15, 0], { easing: Easing.inOut(Easing.quad) });
  const rotB = interpolate(localFrameB, [0, 112.5, 225], [0, 8, 0], { easing: Easing.inOut(Easing.quad) });

  const blinkCycle = 45;
  const getBlinkOpacity = (index: number) => {
    const delay = index * 6;
    const localFrame = (frame - delay + 450) % blinkCycle;
    return interpolate(localFrame, [0, 22.5, 45], [1, 0.2, 1], { easing: Easing.inOut(Easing.quad) });
  };

  const titleInProgress = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.2, 1.4, 0.4, 1) });
  const inOpacity = interpolate(titleInProgress, [0, 1], [0, 1]);
  const inY = interpolate(titleInProgress, [0, 1], [-60, 0]);
  const inScale = interpolate(titleInProgress, [0, 1], [0.6, 1]);
  const inRot = interpolate(titleInProgress, [0, 1], [-4, 0]);

  const wiggleLocalFrame = frame % 150;
  const wiggleY = interpolate(wiggleLocalFrame, [0, 37.5, 112.5, 150], [0, -6, -4, 0], { easing: Easing.inOut(Easing.quad) });
  const wiggleRot = interpolate(wiggleLocalFrame, [0, 37.5, 112.5, 150], [0, -1, 1, 0], { easing: Easing.inOut(Easing.quad) });

  const text = "THANKS FOR WATCHING";
  const chars = Array.from(text);

  const popProgressL = interpolate(frame, [9, 39], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const scaleL = interpolate(popProgressL, [0, 1], [0.7, 1]);
  const translateYL = interpolate(popProgressL, [0, 1], [40, 0]);
  const opacityL = interpolate(popProgressL, [0, 1], [0, 1]);

  const popProgressR = interpolate(frame, [15, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const scaleR = interpolate(popProgressR, [0, 1], [0.7, 1]);
  const translateYR = interpolate(popProgressR, [0, 1], [40, 0]);
  const opacityR = interpolate(popProgressR, [0, 1], [0, 1]);

  const getGlowStyle = (progress: number, shadowRad: number) => {
    const r = Math.round(255 - 6 * progress);
    const g = Math.round(255 - 123 * progress);
    const b = Math.round(255 - 181 * progress);
    const a = 0.25 + 0.55 * progress;
    return {
      boxShadow: `0 0 ${shadowRad}px rgba(${r}, ${g}, ${b}, ${a})`,
      borderColor: `rgb(${r}, ${g}, ${b})`
    };
  };

  const pL = interpolate(frame % 75, [0, 37.5, 75], [0, 1, 0]);
  const radL = interpolate(frame % 75, [0, 37.5, 75], [20, 45, 20]);
  const glowStyleL = getGlowStyle(pL, radL);

  const pR = interpolate((frame - 18 + 450) % 75, [0, 37.5, 75], [0, 1, 0]);
  const radR = interpolate((frame - 18 + 450) % 75, [0, 37.5, 75], [20, 45, 20]);
  const glowStyleR = getGlowStyle(pR, radR);

  const shineX = interpolate(frame % 90, [0, 54, 90], [-100, 200, 200]);

  const spinRot = interpolate(frame % 450, [0, 450], [0, 360]);
  const revSpinRot = interpolate(frame % 450, [0, 450], [360, 0]);

  const pPulse = interpolate(frame % 75, [0, 37.5, 75], [0, 1, 0]);
  const pulseShadow = interpolate(frame % 75, [0, 37.5, 75], [25, 55, 25]);
  const rP = Math.round(255 - 6 * pPulse);
  const gP = Math.round(255 - 123 * pPulse);
  const bP = Math.round(255 - 181 * pPulse);
  const aP = 0.3 + 0.6 * pPulse;
  const circlePulseStyle = {
    boxShadow: `0 0 ${pulseShadow}px rgba(${rP}, ${gP}, ${bP}, ${aP})`,
  };

  const popL = interpolate(frame, [18, 48], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const opL = interpolate(popL, [0, 1], [0, 1]);
  const txButtonL = interpolate(popL, [0, 1], [-80, 0]);

  const popR = interpolate(frame, [24, 54], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const opR = interpolate(popR, [0, 1], [0, 1]);
  const txButtonR = interpolate(popR, [0, 1], [80, 0]);

  const jellyFrameL = (frame - 48 + 450) % 75;
  const scaleXL = interpolate(jellyFrameL, [0, 22.5, 45, 75], [1, 1.12, 0.95, 1], { easing: Easing.inOut(Easing.quad) });
  const scaleYL = interpolate(jellyFrameL, [0, 22.5, 45, 75], [1, 0.88, 1.05, 1], { easing: Easing.inOut(Easing.quad) });

  const jellyFrameR = (frame - 54 + 450) % 75;
  const scaleXR = interpolate(jellyFrameR, [0, 22.5, 45, 75], [1, 1.12, 0.95, 1], { easing: Easing.inOut(Easing.quad) });
  const scaleYR = interpolate(jellyFrameR, [0, 22.5, 45, 75], [1, 0.88, 1.05, 1], { easing: Easing.inOut(Easing.quad) });

  const subFrame = frame % 45;
  const subScale = interpolate(subFrame, [0, 18, 31.5, 45], [1, 1.14, 0.97, 1], { easing: Easing.inOut(Easing.quad) });
  const subY = interpolate(subFrame, [0, 18, 31.5, 45], [0, -6, 0, 0], { easing: Easing.inOut(Easing.quad) });

  const cursorFrame = frame % 60;
  const cursorY = interpolate(cursorFrame, [0, 30, 60], [0, -12, 0], { easing: Easing.inOut(Easing.quad) });
  const cursorScale = interpolate(cursorFrame, [0, 30, 60], [1, 0.85, 1], { easing: Easing.inOut(Easing.quad) });

  const progWidth = interpolate(frame, [0, 450], [0, 100]);

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
        background: 'radial-gradient(circle at 50% 38%, #1a5f9e 0%, #0d3f6e 55%, #07294a 100%)',
        fontFamily: "'Arial Black', Arial, sans-serif",
      }}
    >
      <canvas
        ref={canvasRef}
        width={ORIGINAL_WIDTH}
        height={ORIGINAL_HEIGHT}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
        }}
      />

      {/* Top Left Blob (Float A) */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          top: -110,
          left: -110,
          transform: `translate(${txA}px, ${tyA}px) rotate(${rotA}deg)`,
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ff9248, #f3722c)',
            boxShadow: '0 0 60px rgba(243,114,44,0.7)',
          }}
        />
      </div>

      {/* Top Right Blob (Float B) */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          top: -90,
          right: -90,
          transform: `translate(${txB}px, ${tyB}px) rotate(${rotB}deg)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 300,
            height: 300,
            border: '16px solid #f9844a',
            borderRadius: '50%',
            opacity: 0.9,
          }}
        />
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #3b94d4, #1f6bb0)',
          }}
        />
      </div>

      {/* Bottom Left Blob (Float B) */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          bottom: -110,
          left: -110,
          transform: `translate(${txB}px, ${tyB}px) rotate(${rotB}deg)`,
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #3b94d4, #1f6bb0)',
          }}
        />
      </div>

      {/* Bottom Right Blob (Float A) */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          bottom: -110,
          right: -110,
          transform: `translate(${txA}px, ${tyA}px) rotate(${rotA}deg)`,
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ff9248, #f3722c)',
            boxShadow: '0 0 60px rgba(243,114,44,0.7)',
          }}
        />
      </div>

      {/* Deco D1 */}
      <div style={{ position: 'absolute', zIndex: 4, display: 'flex', gap: 6, top: 60, left: '38%' }}>
        <span style={{ width: 5, height: 24, background: '#f3722c', transform: 'skewX(-20deg)', opacity: getBlinkOpacity(0) }} />
        <span style={{ width: 5, height: 24, background: '#f3722c', transform: 'skewX(-20deg)', opacity: getBlinkOpacity(1) }} />
        <span style={{ width: 5, height: 24, background: '#f3722c', transform: 'skewX(-20deg)', opacity: getBlinkOpacity(2) }} />
      </div>

      {/* Deco D2 */}
      <div style={{ position: 'absolute', zIndex: 4, display: 'flex', gap: 6, bottom: 80, right: '36%' }}>
        <span style={{ width: 5, height: 24, background: '#f3722c', transform: 'skewX(-20deg)', opacity: getBlinkOpacity(0) }} />
        <span style={{ width: 5, height: 24, background: '#f3722c', transform: 'skewX(-20deg)', opacity: getBlinkOpacity(1) }} />
        <span style={{ width: 5, height: 24, background: '#f3722c', transform: 'skewX(-20deg)', opacity: getBlinkOpacity(2) }} />
      </div>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          width: '100%',
          textAlign: 'center',
          zIndex: 6,
          fontSize: '104px',
          fontWeight: 900,
          fontStyle: 'italic',
          color: '#fff',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textShadow: '4px 4px 0 #f3722c, -1px -1px 0 #277fc4, 0 0 30px rgba(255,255,255,0.4)',
          WebkitTextStroke: '1px #0b3a66',
          opacity: inOpacity,
          transform: `translateY(${inY + wiggleY}px) scale(${inScale}) rotate(${inRot + wiggleRot}deg)`,
        }}
      >
        {chars.map((ch, i) => {
          const bounceCycle = 75;
          const charDelay = i * 2.1;
          const charLocalFrame = (frame - charDelay + 450) % bounceCycle;
          const charY = interpolate(
            charLocalFrame,
            [0, bounceCycle * 0.5, bounceCycle],
            [0, -10, 0],
            { easing: Easing.inOut(Easing.quad) }
          );

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `translateY(${charY}px)`,
              }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          );
        })}
      </div>

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          top: '32%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '88%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 6,
        }}
      >
        {/* Video Frame Left */}
        <div
          style={{
            width: '33%',
            height: 270,
            border: '4px dashed #fff',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.07)',
            position: 'relative',
            overflow: 'hidden',
            opacity: opacityL,
            transform: `translateY(${translateYL}px) scale(${scaleL})`,
            ...glowStyleL,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
              transform: `translateX(${shineX}%)`,
            }}
          />
        </div>

        {/* Center Circle */}
        <div
          style={{
            width: 216,
            height: 216,
            border: '4px dashed #fff',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            position: 'relative',
            transform: `rotate(${spinRot}deg)`,
            ...circlePulseStyle,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 58,
              color: '#f9844a',
              textShadow: '0 0 15px #f9844a',
              transform: `rotate(${revSpinRot}deg)`,
            }}
          >
            ▶
          </div>
        </div>

        {/* Video Frame Right */}
        <div
          style={{
            width: '33%',
            height: 270,
            border: '4px dashed #fff',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.07)',
            position: 'relative',
            overflow: 'hidden',
            opacity: opacityR,
            transform: `translateY(${translateYR}px) scale(${scaleR})`,
            ...glowStyleR,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
              transform: `translateX(${shineX}%)`,
            }}
          />
        </div>
      </div>

      {/* Watch Next Button */}
      <div
        style={{
          position: 'absolute',
          zIndex: 7,
          color: '#fff',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 29,
          textTransform: 'uppercase',
          padding: '10px 26px',
          borderRadius: '8px 22px 8px 22px',
          background: 'linear-gradient(90deg, #f3722c, #f9844a)',
          boxShadow: '0 0 25px rgba(243,114,44,0.6)',
          bottom: '13%',
          left: '5%',
          opacity: opL,
          transform: `skewX(-8deg) translateX(${txButtonL}px) scale(${scaleXL}, ${scaleYL})`,
        }}
      >
        <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>Watch Next</span>
      </div>

      {/* Recommended Button */}
      <div
        style={{
          position: 'absolute',
          zIndex: 7,
          color: '#fff',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 29,
          textTransform: 'uppercase',
          padding: '10px 26px',
          borderRadius: '8px 22px 8px 22px',
          background: 'linear-gradient(90deg, #f3722c, #f9844a)',
          boxShadow: '0 0 25px rgba(243,114,44,0.6)',
          bottom: '13%',
          right: '5%',
          opacity: opR,
          transform: `skewX(-8deg) translateX(${txButtonR}px) scale(${scaleXR}, ${scaleYR})`,
        }}
      >
        <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>Recommended</span>
      </div>

      {/* Subscribe Text */}
      <div
        style={{
          position: 'absolute',
          bottom: '4%',
          left: '50%',
          zIndex: 7,
          color: '#fff',
          fontSize: 61,
          fontWeight: 900,
          fontStyle: 'italic',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          textShadow: '3px 3px 0 #f3722c, 0 0 25px rgba(243,114,44,0.8)',
          transform: `translateX(-50%) skewX(-8deg) scale(${subScale}) translateY(${subY}px)`,
        }}
      >
        Subscribe
      </div>

      {/* Cursor Hand */}
      <div
        style={{
          position: 'absolute',
          bottom: '9%',
          left: '50%',
          zIndex: 8,
          fontSize: 46,
          color: '#fff',
          transform: `translateX(40%) translateY(${cursorY}px) scale(${cursorScale})`,
          filter: 'drop-shadow(0 0 8px #f9844a)',
        }}
      >
        👆
      </div>

      {/* Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 5,
          background: '#f9844a',
          boxShadow: '0 0 12px #f9844a',
          zIndex: 10,
          width: `${progWidth}%`,
        }}
      />
    </div>
  );
};

export default EndScreenPro;
// END_OF_FILE