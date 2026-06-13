import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const STAR_COUNT = 1000;
const STAR_POSITIONS = (() => {
  const pos = new Float32Array(STAR_COUNT * 3);
  let seed = 12345;
  function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
  for (let i = 0; i < STAR_COUNT; i++) {
    pos[i * 3 + 0] = (random() - 0.5) * 100;
    pos[i * 3 + 1] = (random() - 0.5) * 70;
    pos[i * 3 + 2] = -random() * 150 + 20;
  }
  return pos;
})();

const CYAN = '#19b6ff';
const CYAN_BRIGHT = '#5ad8ff';

export const SplitGridOutro: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridARef = useRef<THREE.GridHelper | null>(null);
  const gridBRef = useRef<THREE.GridHelper | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x02040a, 10, 60);

    const camera = new THREE.PerspectiveCamera(68, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 200);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, -30);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(2);
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setClearColor(0x02040a, 1);

    const makeGrid = () => {
      const g = new THREE.GridHelper(140, 70, 0x5ad8ff, 0x1b8cff);
      const mat = g.material as THREE.LineBasicMaterial;
      mat.transparent = true;
      mat.opacity = 0.6;
      g.rotation.x = Math.PI / 2;
      g.position.y = 0;
      return g;
    };

    const gridA = makeGrid();
    const gridB = makeGrid();
    gridB.position.z = -140;
    gridA.position.x = -6;
    gridB.position.x = -6;
    scene.add(gridA, gridB);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(STAR_POSITIONS, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xdfefff,
      size: 0.4,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    gridARef.current = gridA;
    gridBRef.current = gridB;
    starsRef.current = stars;

    return () => {
      renderer.dispose();
      geo.dispose();
      mat.dispose();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const gridA = gridARef.current;
    const gridB = gridBRef.current;
    const stars = starsRef.current;

    if (!scene || !camera || !renderer || !gridA || !gridB || !stars) return;

    const elapsedTime = frame / fps;
    const speed = 14;
    const span = 140;

    gridA.position.z = (elapsedTime * speed) % span;
    gridB.position.z = ((elapsedTime * speed) % span) - span;

    const starMat = stars.material as THREE.PointsMaterial;
    starMat.opacity = 0.6 + 0.3 * Math.sin(elapsedTime * (Math.PI * 2 / 5));
    stars.position.z = (elapsedTime * 4) % 40;

    camera.position.y = Math.sin(elapsedTime * (Math.PI * 2 / 10)) * 0.4;
    camera.position.x = Math.sin(elapsedTime * (Math.PI * 4 / 10)) * 0.5;
    camera.lookAt(0, 0, -30);

    renderer.render(scene, camera);
  }, [frame, fps]);

  const rightPanelX = interpolate(frame, [0, 30, 270, 300], [300, 0, 0, 300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rightPanelOpacity = interpolate(frame, [0, 30, 270, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const diagLineOpacity = interpolate(frame, [0, 36, 264, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const diagGlowOpacity = interpolate(frame, [0, 36, 264, 300], [0, 0.55, 0.55, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleX = interpolate(frame, [0, 42, 258, 300], [120, 0, 0, 120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleOpacity = interpolate(frame, [0, 42, 258, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titlePulse = Math.sin((frame / 300) * Math.PI * 2 * 3);
  const titleGlow = interpolate(titlePulse, [-1, 1], [18, 32]);
  const titleTextShadow = `0 0 ${titleGlow}px rgba(90, 216, 255, 1), 0 0 4px #fff`;

  const playBtnBaseScale = interpolate(frame, [0, 48, 252, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const playBtnOpacity = interpolate(frame, [0, 48, 252, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const playPulse = Math.sin((frame / 300) * Math.PI * 2 * 6);
  const playBtnScale = playBtnBaseScale * (1 + playPulse * 0.03);

  const glowSpread = interpolate(playPulse, [-1, 1], [35, 65]);
  const glowSpreadOuter = interpolate(playPulse, [-1, 1], [50, 90]);
  const playBtnBoxShadow = `0 0 ${glowSpread}px ${CYAN}, 0 0 ${glowSpreadOuter}px rgba(25, 182, 255, 0.6), inset 0 0 25px rgba(0, 0, 0, 0.55)`;

  const subscribeY = interpolate(frame, [0, 54, 246, 300], [50, 0, 0, 50], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subscribeOpacity = interpolate(frame, [0, 54, 246, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subPulse = Math.sin((frame / 300) * Math.PI * 2 * 5);
  const subGlow1 = interpolate(subPulse, [-1, 1], [22, 40]);
  const subGlow2 = interpolate(subPulse, [-1, 1], [16, 25]);
  const subscribeBoxShadow = `0 0 ${subGlow1}px ${CYAN}, inset 0 0 ${subGlow2}px rgba(25, 182, 255, 0.5)`;

  const ctaOpacity = interpolate(frame, [0, 60, 240, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ctaPulse = Math.sin((frame / 300) * Math.PI * 2 * 4);
  const ctaGlow = interpolate(ctaPulse, [-1, 1], [14, 28]);
  const ctaTextShadow = `0 0 ${ctaGlow}px rgba(90, 216, 255, 1), 0 2px 5px rgba(0, 0, 0, 0.6)`;

  const prevLabelX = interpolate(frame, [0, 45, 255, 300], [-60, 0, 0, -60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const prevLabelOpacity = interpolate(frame, [0, 45, 255, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const nextLabelY = interpolate(frame, [0, 50, 250, 300], [60, 0, 0, 60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const nextLabelOpacity = interpolate(frame, [0, 50, 250, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cornersOpacity = interpolate(frame, [0, 55, 245, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
        background: '#000',
        fontFamily: '"Arial Black", Arial, sans-serif',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'block',
          zIndex: 0,
          width: '100%',
          height: '100%',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: 'polygon(58% 0, 63% 0, 47% 100%, 42% 100%)',
            background: 'linear-gradient(180deg, rgba(90,216,255,0.0), rgba(27,140,255,0.55))',
            opacity: diagGlowOpacity,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: 'polygon(58% 0, 100% 0, 100% 100%, 42% 100%)',
            background: 'radial-gradient(ellipse at 75% 40%, #0a1424 0%, #02040a 70%, #000 100%)',
            transform: `translateX(${rightPanelX}px)`,
            opacity: rightPanelOpacity,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: 'polygon(57.4% 0, 58.6% 0, 42.6% 100%, 41.4% 100%)',
            background: 'linear-gradient(180deg, #5ad8ff, #1b8cff)',
            boxShadow: `0 0 30px ${CYAN}`,
            filter: 'blur(0.4px)',
            opacity: diagLineOpacity,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '5%',
            color: '#fff',
            fontSize: 40,
            letterSpacing: 2,
            writingMode: 'vertical-rl',
            transform: `rotate(180deg) translateX(${prevLabelX}px)`,
            opacity: prevLabelOpacity,
            textShadow: '0 0 12px rgba(25,182,255,0.6), 0 2px 5px rgba(0,0,0,0.6)',
          }}
        >
          Previous Video
        </div>

        <div
          style={{
            position: 'absolute',
            top: '14%',
            left: '46%',
            width: 90,
            height: 220,
            borderRight: `6px solid ${CYAN_BRIGHT}`,
            borderTop: `6px solid ${CYAN_BRIGHT}`,
            boxShadow: `0 0 18px ${CYAN}`,
            filter: 'drop-shadow(0 0 6px ${CYAN})',
            opacity: cornersOpacity,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '38%',
            color: '#fff',
            fontSize: 40,
            letterSpacing: 2,
            writingMode: 'vertical-rl',
            transform: `rotate(180deg) translateY(${nextLabelY}px)`,
            opacity: nextLabelOpacity,
            textShadow: '0 0 12px rgba(90,216,255,0.7), 0 2px 5px rgba(0,0,0,0.6)',
          }}
        >
          Next Video
        </div>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '30%',
            width: 120,
            height: 240,
            borderLeft: `6px solid ${CYAN_BRIGHT}`,
            borderBottom: `6px solid ${CYAN_BRIGHT}`,
            boxShadow: `0 0 18px ${CYAN}`,
            filter: `drop-shadow(0 0 6px ${CYAN})`,
            opacity: cornersOpacity,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '7%',
            right: '4%',
            textAlign: 'right',
            lineHeight: 0.98,
            transform: `translateX(${titleX}px)`,
            opacity: titleOpacity,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: '#dff1ff',
              fontSize: 58,
              letterSpacing: 1,
              textShadow: titleTextShadow,
            }}
          >
            THANKS FOR<br />WATCHING
          </h1>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '26%',
            right: '12%',
            width: 210,
            height: 210,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 38%, #8c9094 0%, #5c6064 55%, #3a3d40 100%)',
            border: `7px solid ${CYAN}`,
            boxShadow: playBtnBoxShadow,
            opacity: playBtnOpacity,
            transform: `scale(${playBtnScale})`,
            transformOrigin: 'center center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '54%',
              transform: 'translate(-50%, -50%)',
              width: 0,
              height: 0,
              borderLeft: '38px solid rgba(255, 255, 255, 0.85)',
              borderTop: '26px solid transparent',
              borderBottom: '26px solid transparent',
              filter: 'drop-shadow(0 0 6px rgba(25, 182, 255, 0.7))',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: '62%',
            right: '13%',
            padding: '20px 55px',
            color: '#fff',
            fontSize: 34,
            letterSpacing: 2,
            background: 'rgba(2, 8, 18, 0.35)',
            border: `4px solid ${CYAN_BRIGHT}`,
            borderRadius: 14,
            boxShadow: subscribeBoxShadow,
            textShadow: '0 0 10px rgba(25, 182, 255, 0.7)',
            transform: `translateY(${subscribeY}px)`,
            opacity: subscribeOpacity,
          }}
        >
          SUBSCRIBE
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            right: '3%',
            color: '#fff',
            fontStyle: 'italic',
            letterSpacing: 2,
            fontSize: 34,
            whiteSpace: 'nowrap',
            textShadow: ctaTextShadow,
            opacity: ctaOpacity,
          }}
        >
          LIKE - COMMENT - SHARE
        </div>
      </div>
    </div>
  );
};

export default SplitGridOutro;
// END_OF_FILE