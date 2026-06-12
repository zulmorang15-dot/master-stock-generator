import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_VERTICES: [number, number, number][] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
].map(([x, y, z]) => {
  const len = Math.sqrt(x * x + y * y + z * z);
  return [x / len * 110, y / len * 110, z / len * 110];
}) as any;

const ICO_EDGES: [number, number][] = [];
for (let i = 0; i < 12; i++) {
  for (let j = i + 1; j < 12; j++) {
    const dx = ICO_VERTICES[i][0] - ICO_VERTICES[j][0];
    const dy = ICO_VERTICES[i][1] - ICO_VERTICES[j][1];
    const dz = ICO_VERTICES[i][2] - ICO_VERTICES[j][2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 150) {
      ICO_EDGES.push([i, j]);
    }
  }
}

const SEED_WAVE_COUNT = 1200;
const WAVE_PARTICLES = Array.from({ length: SEED_WAVE_COUNT }, (_, i) => {
  const x = Math.sin(i * 12345.67) * 600;
  const z = Math.abs(Math.cos(i * 98765.43)) * 800 + 100;
  const phase = Math.sin(i * 33333.33) * Math.PI * 2;
  return { x, z, phase };
});

const SEED_DUST_COUNT = 150;
const DUST_PARTICLES = Array.from({ length: SEED_DUST_COUNT }, (_, i) => {
  const x = Math.sin(i * 54321.12) * 800;
  const y = Math.sin(i * 32145.67) * 400;
  const z = Math.abs(Math.cos(i * 78912.34)) * 900 + 100;
  return { x, y, z };
});

const CanvasBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#010308';
    ctx.fillRect(0, 0, 1920, 1080);

    const grad = ctx.createRadialGradient(960, 540, 50, 960, 540, 1000);
    grad.addColorStop(0, '#020b1f');
    grad.addColorStop(1, '#010308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    const t = (frame % 360) / 360;

    const camAngle = t * Math.PI * 2;
    const camX = Math.sin(camAngle) * 30;
    const camY = Math.cos(camAngle) * 15;

    const cx = 960 + camX;
    const cy = 540 + camY;

    const gridT = (frame % 30) / 30;
    const gridSpacing = 60;
    const gridOffset = gridT * gridSpacing;

    ctx.strokeStyle = 'rgba(0, 85, 255, 0.12)';
    ctx.lineWidth = 2;

    const gridYWorld = 220;
    for (let xWorld = -1800; xWorld <= 1800; xWorld += 150) {
      const zStart = 80;
      const zEnd = 1000;

      const scaleStart = 600 / zStart;
      const x1 = cx + xWorld * scaleStart;
      const y1 = cy + gridYWorld * scaleStart;

      const scaleEnd = 600 / zEnd;
      const x2 = cx + xWorld * scaleEnd;
      const y2 = cy + gridYWorld * scaleEnd;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    for (let i = 1; i <= 20; i++) {
      const z = i * gridSpacing - gridOffset;
      if (z <= 40) continue;
      const scale = 600 / z;
      const y = cy + gridYWorld * scale;

      const xLeft = cx - 2000 * scale;
      const xRight = cx + 2000 * scale;

      const alpha = Math.min(0.35, (1000 - z) / 900) * 0.4;
      ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(xLeft, y);
      ctx.lineTo(xRight, y);
      ctx.stroke();
    }

    WAVE_PARTICLES.forEach((p) => {
      const waveY = Math.sin((p.x * 0.006) + (t * Math.PI * 2) + p.phase) * 20 +
                    Math.cos((p.z * 0.005) + (t * Math.PI * 4)) * 20;
      const yWorld = gridYWorld - 30 + waveY;

      const scale = 600 / p.z;
      const sx = cx + p.x * scale;
      const sy = cy + yWorld * scale;

      if (sx >= 0 && sx <= 1920 && sy >= 0 && sy <= 1080) {
        const alpha = Math.min(0.6, (900 - p.z) / 800) * 0.7;
        ctx.fillStyle = `rgba(0, 170, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, 1.8 * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const icoRotX = t * Math.PI * 2;
    const icoRotY = -t * Math.PI * 2;

    const projectedIcoVerts: [number, number][] = [];
    ICO_VERTICES.forEach(([vx, vy, vz]) => {
      let y1 = vy * Math.cos(icoRotX) - vz * Math.sin(icoRotX);
      let z1 = vy * Math.sin(icoRotX) + vz * Math.cos(icoRotX);
      let x2 = vx * Math.cos(icoRotY) - z1 * Math.sin(icoRotY);
      let z2 = vx * Math.sin(icoRotY) + z1 * Math.cos(icoRotY);

      const worldZ = z2 + 450;
      const scale = 600 / worldZ;
      const sx = cx + x2 * scale;
      const sy = cy + y1 * scale;
      projectedIcoVerts.push([sx, sy]);
    });

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ICO_EDGES.forEach(([i, j]) => {
      const [x1, y1] = projectedIcoVerts[i];
      const [x2, y2] = projectedIcoVerts[j];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    for (let radius = 40; radius <= 100; radius += 30) {
      const rotZ = t * Math.PI * (radius === 40 ? 2 : -3);
      ctx.strokeStyle = radius === 40 ? 'rgba(0, 85, 255, 0.35)' : 'rgba(0, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotZ);
      ctx.scale(1, 0.4);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    DUST_PARTICLES.forEach((p) => {
      let z = p.z - (t * 400);
      if (z < 100) z += 900;

      const scale = 600 / z;
      const sx = cx + p.x * scale;
      const sy = cy + p.y * scale;

      if (sx >= 0 && sx <= 1920 && sy >= 0 && sy <= 1080) {
        const alpha = Math.min(0.5, (1000 - z) / 900) * 0.8;
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, 2.5 * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    });

  }, [frame]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  );
};

const HudCrosshair: React.FC<{ style: React.CSSProperties }> = ({ style }) => {
  const frame = useCurrentFrame();
  const pulse = Math.sin((frame / 30) * Math.PI) * 0.5 + 0.5;
  const scale = 1.0 + pulse * 0.15;
  const opacity = 0.4 + pulse * 0.4;

  return (
    <div
      style={{
        position: 'absolute',
        width: 20,
        height: 20,
        transform: `scale(${scale})`,
        opacity,
        ...style,
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
  );
};

const FuturisticEsportsEndScreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const containerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#010308',
  };

  const uiLayerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
    pointerEvents: 'none',
  };

  const hudLineTop: React.CSSProperties = {
    position: 'absolute',
    background: '#00ffff',
    opacity: 0.2,
    boxShadow: '0 0 10px #00ffff',
    top: 150,
    left: 0,
    width: '100%',
    height: 1,
  };

  const hudLineBottom: React.CSSProperties = {
    position: 'absolute',
    background: '#00ffff',
    opacity: 0.2,
    boxShadow: '0 0 10px #00ffff',
    bottom: 150,
    left: 0,
    width: '100%',
    height: 1,
  };

  const placeholderBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: 580,
    height: 326,
    top: 377,
    background: 'rgba(0, 15, 30, 0.4)',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
    backdropFilter: 'blur(8px)',
    overflow: 'hidden',
  };

  const floatOffset = Math.sin((frame / 360) * Math.PI * 2) * 8;

  const placeholderLeftStyle: React.CSSProperties = {
    ...placeholderBaseStyle,
    left: 140,
    transform: `translateY(${floatOffset}px)`,
  };

  const placeholderRightStyle: React.CSSProperties = {
    ...placeholderBaseStyle,
    right: 140,
    transform: `translateY(${-floatOffset}px)`,
  };

  const cornerBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00ffff',
    borderStyle: 'solid',
    borderWidth: 0,
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
    zIndex: 3,
  };

  const cornerTL: React.CSSProperties = { ...cornerBaseStyle, top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 };
  const cornerTR: React.CSSProperties = { ...cornerBaseStyle, top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 };
  const cornerBL: React.CSSProperties = { ...cornerBaseStyle, bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 };
  const cornerBR: React.CSSProperties = { ...cornerBaseStyle, bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 };

  const scanlineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
  };

  const sweepStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    width: '50%',
    height: '100%',
    background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
    transform: 'skewX(-25deg)',
  };

  const scanFrameLeft = frame % 120;
  const scanYLeft = interpolate(scanFrameLeft, [0, 120], [-100, 100]);

  const scanFrameRight = (frame + 60) % 120;
  const scanYRight = interpolate(scanFrameRight, [0, 120], [-100, 100]);

  const sweepFrameLeft = frame % 180;
  const sweepLeftPos = interpolate(sweepFrameLeft, [0, 36, 180], [-100, 200, 200], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.19, 1, 0.22, 1),
  });

  const sweepFrameRight = (frame + 90) % 180;
  const sweepRightPos = interpolate(sweepFrameRight, [0, 36, 180], [-100, 200, 200], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.19, 1, 0.22, 1),
  });

  const subscribeCenterStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 340,
    height: 340,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const hologramRingStyle: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    border: '2px solid transparent',
  };

  const rotateOuter = (frame / 360) * 360;
  const ringOuterStyle: React.CSSProperties = {
    ...hologramRingStyle,
    width: 340,
    height: 340,
    borderTop: '4px solid #00ffff',
    borderBottom: '4px solid #0055ff',
    boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
    transform: `rotate(${rotateOuter}deg)`,
  };

  const rotateInner = -((frame % 180) / 180) * 360;
  const ringInnerStyle: React.CSSProperties = {
    ...hologramRingStyle,
    width: 280,
    height: 280,
    borderLeft: '3px solid #0055ff',
    borderRight: '3px solid #00ffff',
    transform: `rotate(${rotateInner}deg)`,
  };

  const rotateDashed = ((frame % 120) / 120) * 360;
  const ringDashedStyle: React.CSSProperties = {
    ...hologramRingStyle,
    width: 310,
    height: 310,
    border: '2px dashed rgba(0, 255, 255, 0.5)',
    transform: `rotate(${rotateDashed}deg)`,
  };

  const subscribeCoreStyle: React.CSSProperties = {
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'rgba(0, 20, 40, 0.6)',
    border: '4px solid #00ffff',
    boxShadow: '0 0 50px rgba(0, 255, 255, 0.5), inset 0 0 40px rgba(0, 85, 255, 0.5)',
    backdropFilter: 'blur(12px)',
    position: 'relative',
    zIndex: 10,
  };

  return (
    <div style={containerStyle}>
      <CanvasBackground />

      <div style={uiLayerStyle}>
        <div style={hudLineTop} />
        <div style={hudLineBottom} />

        <HudCrosshair style={{ top: 140, left: 140 }} />
        <HudCrosshair style={{ top: 140, right: 140 }} />
        <HudCrosshair style={{ bottom: 140, left: 140 }} />
        <HudCrosshair style={{ bottom: 140, right: 140 }} />

        <div style={placeholderLeftStyle}>
          <div style={cornerTL} />
          <div style={cornerTR} />
          <div style={cornerBL} />
          <div style={cornerBR} />
          <div style={{ ...scanlineStyle, transform: `translateY(${scanYLeft}%)` }} />
          <div style={{ ...sweepStyle, left: `${sweepLeftPos}%` }} />
        </div>

        <div style={placeholderRightStyle}>
          <div style={cornerTL} />
          <div style={cornerTR} />
          <div style={cornerBL} />
          <div style={cornerBR} />
          <div style={{ ...scanlineStyle, transform: `translateY(${scanYRight}%)` }} />
          <div style={{ ...sweepStyle, left: `${sweepRightPos}%` }} />
        </div>

        <div style={subscribeCenterStyle}>
          <div style={ringOuterStyle} />
          <div style={ringDashedStyle} />
          <div style={ringInnerStyle} />
          <div style={subscribeCoreStyle} />
        </div>
      </div>
    </div>
  );
};

export default FuturisticEsportsEndScreen;
// END_OF_FILE