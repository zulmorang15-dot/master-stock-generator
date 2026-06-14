import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

interface Particle {
  baseX: number;
  baseY: number;
  index: number;
  size: number;
  speedX: number;
  speedY: number;
  hue: number;
  x: number;
  y: number;
}

interface DataNode {
  angle: number;
  radius: number;
  index: number;
  pulsePhase: number;
  x: number;
  y: number;
  pulse: number;
}

interface EnergyWave {
  index: number;
  offset: number;
}

const particleCount = 150;
const staticParticles: Omit<Particle, 'x' | 'y'>[] = [];
for (let i = 0; i < particleCount; i++) {
  const angle = (i / particleCount) * Math.PI * 2;
  const radius = 300 + (i % 3) * 150;
  staticParticles.push({
    baseX: 960 + Math.cos(angle) * radius,
    baseY: 540 + Math.sin(angle) * radius,
    index: i,
    size: 2 + (i % 3),
    speedX: Math.cos(angle * 3) * 0.5,
    speedY: Math.sin(angle * 3) * 0.5,
    hue: (i / particleCount) * 360,
  });
}

const staticDataNodes: Omit<DataNode, 'x' | 'y' | 'pulse'>[] = [];
for (let i = 0; i < 8; i++) {
  staticDataNodes.push({
    angle: (i / 8) * Math.PI * 2,
    radius: 400,
    index: i,
    pulsePhase: i * 0.5,
  });
}

const staticEnergyWaves: EnergyWave[] = [
  { index: 0, offset: 0 },
  { index: 1, offset: 200 },
  { index: 2, offset: 400 },
];

const DigitalSpace: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);

  const cycleDuration = 15;
  const localFrame = frame % (fps * cycleDuration);
  const time = localFrame * (1000 / fps);

  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;
    if (!gridCanvas || !particleCanvas) return;

    const gridCtx = gridCanvas.getContext('2d');
    const ctx = particleCanvas.getContext('2d');
    if (!gridCtx || !ctx) return;

    gridCanvas.width = ORIGINAL_WIDTH;
    gridCanvas.height = ORIGINAL_HEIGHT;
    particleCanvas.width = ORIGINAL_WIDTH;
    particleCanvas.height = ORIGINAL_HEIGHT;

    gridCtx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    ctx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Draw grid
    gridCtx.strokeStyle = 'rgba(0, 242, 254, 0.1)';
    gridCtx.lineWidth = 1;

    const gridSize = 60;
    const offsetX = (localFrame * 0.5) % gridSize;
    const offsetY = (localFrame * 0.5) % gridSize;

    for (let x = -gridSize + offsetX; x < ORIGINAL_WIDTH + gridSize; x += gridSize) {
      gridCtx.beginPath();
      gridCtx.moveTo(x, 0);
      gridCtx.lineTo(x, ORIGINAL_HEIGHT);
      gridCtx.stroke();
    }

    for (let y = -gridSize + offsetY; y < ORIGINAL_HEIGHT + gridSize; y += gridSize) {
      gridCtx.beginPath();
      gridCtx.moveTo(0, y);
      gridCtx.lineTo(ORIGINAL_WIDTH, y);
      gridCtx.stroke();
    }

    // Draw energy waves
    staticEnergyWaves.forEach((wave) => {
      const progress = ((time * 0.0005 + wave.offset) % 1000) / 1000;
      const radius = 100 + progress * 600;
      const opacity = 1 - progress;

      const gradient = ctx.createRadialGradient(960, 540, radius - 20, 960, 540, radius + 20);
      gradient.addColorStop(0, `rgba(79, 172, 254, 0)`);
      gradient.addColorStop(0.5, `rgba(79, 172, 254, ${opacity * 0.4})`);
      gradient.addColorStop(1, `rgba(79, 172, 254, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(960, 540, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Update and draw particles
    const particles: Particle[] = staticParticles.map((sp) => {
      const oscillation = Math.sin(time * 0.001 + sp.index * 0.1) * 30;
      const x = sp.baseX + Math.cos(time * 0.0005 + sp.index) * 100 + oscillation;
      const y = sp.baseY + Math.sin(time * 0.0007 + sp.index) * 100 + oscillation;
      return { ...sp, x, y };
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const opacity = (1 - distance / 150) * 0.3;
          const gradient = ctx.createLinearGradient(
            particles[i].x,
            particles[i].y,
            particles[j].x,
            particles[j].y
          );
          gradient.addColorStop(0, `hsla(${particles[i].hue}, 100%, 60%, ${opacity})`);
          gradient.addColorStop(1, `hsla(${particles[j].hue}, 100%, 60%, ${opacity})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach((particle) => {
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size * 4
      );
      gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 70%, 1)`);
      gradient.addColorStop(0.5, `hsla(${particle.hue}, 100%, 60%, 0.5)`);
      gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${particle.hue}, 100%, 80%, 1)`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Update and draw data nodes
    const dataNodes: DataNode[] = staticDataNodes.map((sdn) => {
      const rotation = time * 0.0003;
      const x = 960 + Math.cos(sdn.angle + rotation) * sdn.radius;
      const y = 540 + Math.sin(sdn.angle + rotation) * sdn.radius;
      const pulse = Math.sin(time * 0.003 + sdn.pulsePhase) * 0.5 + 0.5;
      return { ...sdn, x, y, pulse };
    });

    dataNodes.forEach((node) => {
      const size = 8 + node.pulse * 6;
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 3);
      gradient.addColorStop(0, `rgba(0, 242, 254, ${0.8 * node.pulse})`);
      gradient.addColorStop(1, 'rgba(0, 242, 254, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(0, 242, 254, ${0.8 + node.pulse * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * node.pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 5, 0, Math.PI * 2);
      ctx.stroke();
    });
  }, [localFrame, time]);

  const titleBrightness = interpolate(
    localFrame,
    [0, fps * cycleDuration * 0.5, fps * cycleDuration],
    [1, 1.3, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  const titleShadowBlur = interpolate(
    localFrame,
    [0, fps * cycleDuration * 0.5, fps * cycleDuration],
    [40, 60, 40],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  const subtitleShadowBlur = interpolate(
    localFrame,
    [0, fps * cycleDuration * 0.5, fps * cycleDuration],
    [20, 30, 20],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  const scanLineTop = interpolate(
    localFrame,
    [0, fps * cycleDuration * 0.1, fps * cycleDuration * 0.5, fps * cycleDuration * 0.9, fps * cycleDuration],
    ['20%', '20%', '80%', '80%', '20%'],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  const scanLineOpacity = interpolate(
    localFrame,
    [0, fps * cycleDuration * 0.1, fps * cycleDuration * 0.9, fps * cycleDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  const dataStreamPositions = [
    { left: '15%', delay: 0, color: 'rgba(0, 242, 254, 0.6)' },
    { left: '35%', delay: 0.5, color: 'rgba(255, 8, 68, 0.6)' },
    { left: '55%', delay: 1, color: 'rgba(0, 242, 254, 0.6)' },
    { left: '75%', delay: 1.5, color: 'rgba(138, 43, 226, 0.6)' },
    { left: '85%', delay: 2, color: 'rgba(0, 242, 254, 0.6)' },
  ];

  const orb1Transform = interpolate(
    localFrame,
    [0, fps * cycleDuration * 0.33, fps * cycleDuration * 0.66, fps * cycleDuration],
    [0, 50, -30, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  const orb1TransformY = interpolate(
    localFrame,
    [0, fps * cycleDuration * 0.33, fps * cycleDuration * 0.66, fps * cycleDuration],
    [0, -30, 40, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  const orb2Transform = interpolate(
    localFrame,
    [0, fps * cycleDuration * 0.33, fps * cycleDuration * 0.66, fps * cycleDuration],
    [0, 50, -30, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  const orb2TransformY = interpolate(
    localFrame,
    [0, fps * cycleDuration * 0.33, fps * cycleDuration * 0.66, fps * cycleDuration],
    [0, -30, 40, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) }
  );

  const ring1Rotation = interpolate(
    localFrame,
    [0, fps * cycleDuration],
    [0, 360],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.linear }
  );

  const ring2Rotation = interpolate(
    localFrame,
    [0, fps * cycleDuration],
    [0, -360],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.linear }
  );

  const ring3Rotation = interpolate(
    localFrame,
    [0, fps * cycleDuration],
    [0, 360],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.linear }
  );

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
        background: 'radial-gradient(ellipse at center, #0a0e27 0%, #050716 100%)',
        fontFamily: "'Orbitron', sans-serif",
      }}
    >
      <canvas
        ref={gridCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.3,
        }}
      />
      <canvas
        ref={particleCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
            top: '10%',
            left: '20%',
            transform: `translate(${orb1Transform}px, ${orb1TransformY}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 8, 68, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
            top: '60%',
            right: '15%',
            transform: `translate(${orb2Transform}px, ${orb2TransformY}px)`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 400,
            height: 400,
            border: '1px solid rgba(0, 242, 254, 0.15)',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) rotate(${ring1Rotation}deg)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 600,
            height: 600,
            border: '1px solid rgba(255, 8, 68, 0.15)',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) rotate(${ring2Rotation}deg)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 800,
            height: 800,
            border: '1px solid rgba(138, 43, 226, 0.15)',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) rotate(${ring3Rotation}deg)`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            border: '1px solid rgba(0, 242, 254, 0.3)',
            top: 60,
            left: 60,
            borderRight: 'none',
            borderBottom: 'none',
            boxShadow: '0 0 30px rgba(0, 242, 254, 0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            border: '1px solid rgba(0, 242, 254, 0.3)',
            top: 60,
            right: 60,
            borderLeft: 'none',
            borderBottom: 'none',
            boxShadow: '0 0 30px rgba(255, 8, 68, 0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            border: '1px solid rgba(0, 242, 254, 0.3)',
            bottom: 60,
            left: 60,
            borderRight: 'none',
            borderTop: 'none',
            boxShadow: '0 0 30px rgba(79, 172, 254, 0.2)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            border: '1px solid rgba(0, 242, 254, 0.3)',
            bottom: 60,
            right: 60,
            borderLeft: 'none',
            borderTop: 'none',
            boxShadow: '0 0 30px rgba(138, 43, 226, 0.2)',
          }}
        />

        {dataStreamPositions.map((stream, idx) => {
          const streamDelay = stream.delay * fps;
          const streamDuration = 3 * fps;
          const streamLocalFrame = (localFrame - streamDelay + fps * cycleDuration) % (fps * cycleDuration);

          const streamTop = interpolate(
            streamLocalFrame,
            [0, streamDuration * 0.1, streamDuration * 0.9, streamDuration],
            [-100, -100, 1180, 1180],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.linear }
          );

          const streamOpacity = interpolate(
            streamLocalFrame,
            [0, streamDuration * 0.1, streamDuration * 0.9, streamDuration],
            [0, 0.7, 0.7, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.linear }
          );

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                background:
                  stream.color === 'rgba(255, 8, 68, 0.6)'
                    ? 'linear-gradient(180deg, rgba(255, 8, 68, 0) 0%, rgba(255, 8, 68, 0.6) 50%, rgba(255, 8, 68, 0) 100%)'
                    : stream.color === 'rgba(138, 43, 226, 0.6)'
                    ? 'linear-gradient(180deg, rgba(138, 43, 226, 0) 0%, rgba(138, 43, 226, 0.6) 50%, rgba(138, 43, 226, 0) 100%)'
                    : 'linear-gradient(180deg, rgba(0, 242, 254, 0) 0%, rgba(0, 242, 254, 0.6) 50%, rgba(0, 242, 254, 0) 100%)',
                width: 2,
                height: 100,
                left: stream.left,
                top: streamTop,
                opacity: streamOpacity,
              }}
            />
          );
        })}

        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: 2,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(0, 242, 254, 0.8) 50%, transparent 100%)',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.6)',
            top: scanLineTop,
            opacity: scanLineOpacity,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 80,
            padding: '15px 25px',
            background: 'rgba(10, 14, 39, 0.6)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            borderRadius: 8,
            boxShadow:
              '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: 5,
            }}
          >
            Network Status
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ONLINE
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 120,
            right: 80,
            padding: '15px 25px',
            background: 'rgba(10, 14, 39, 0.6)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            borderRadius: 8,
            boxShadow:
              '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: 5,
            }}
          >
            Data Flow
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            982 GB/s
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: 8,
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #ff0844 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: `brightness(${titleBrightness}) drop-shadow(0 0 ${titleShadowBlur}px rgba(0, 242, 254, 0.6))`,
              marginBottom: 20,
            }}
          >
            DIGITAL SPACE
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 24,
              fontWeight: 300,
              letterSpacing: 4,
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              textShadow: `0 0 ${subtitleShadowBlur}px rgba(79, 172, 254, 0.5)`,
            }}
          >
            Abstract Technology Network
          </p>
        </div>
      </div>
    </div>
  );
};

export default DigitalSpace;
// END_OF_FILE