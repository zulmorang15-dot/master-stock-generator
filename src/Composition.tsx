import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

// Seeded deterministic pseudo-random function to avoid Math.random() inside the render
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

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
  const starsMaterialRef = useRef<THREE.PointsMaterial | null>(null);

  // Math.min scale calculation for 16:9 fullscreen edge-to-edge cover
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Initial Three.js setup
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x02040a, 10, 60);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(68, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 200);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, -30);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(2);
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setClearColor(0x02040a, 1);
    rendererRef.current = renderer;

    const makeGrid = () => {
      const g = new THREE.GridHelper(140, 70, 0x5ad8ff, 0x1b8cff);
      g.material.transparent = true;
      g.material.opacity = 0.6;
      g.rotation.x = Math.PI / 2;
      g.position.y = 0;
      return g;
    };

    const gridA = makeGrid();
    gridA.position.x = -6;
    scene.add(gridA);
    gridARef.current = gridA;

    const gridB = makeGrid();
    gridB.position.x = -6;
    gridB.position.z = -140;
    scene.add(gridB);
    gridBRef.current = gridB;

    // Generate stars using seeded random coordinates
    const count = 1000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (seededRandom(i * 3 + 0) - 0.5) * 100;
      pos[i * 3 + 1] = (seededRandom(i * 3 + 1) - 0.5) * 70;
      pos[i * 3 + 2] = -seededRandom(i * 3 + 2) * 150 + 20;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
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
    starsRef.current = stars;
    starsMaterialRef.current = mat;

    return () => {
      renderer.dispose();
      gridA.geometry.dispose();
      (gridA.material as THREE.Material).dispose();
      gridB.geometry.dispose();
      (gridB.material as THREE.Material).dispose();
      geo.dispose();
      mat.dispose();
    };
  }, []);

  // 2. Deterministic frame animation updates
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const gridA = gridARef.current;
    const gridB = gridBRef.current;
    const stars = starsRef.current;
    const starsMaterial = starsMaterialRef.current;

    if (!scene || !camera || !renderer || !gridA || !gridB || !stars || !starsMaterial) {
      return;
    }

    const elapsedTime = frame / fps;

    // Seamless loop calculations for 10-second (600 frames at 60fps) timeline
    const gridSpeed = 14;
    const span = 140;
    const gridOffset = (elapsedTime * gridSpeed) % span;
    gridA.position.z = gridOffset;
    gridB.position.z = gridOffset - span;

    const starSpeed = 4;
    stars.position.z = (elapsedTime * starSpeed) % 40;

    // Stars pulsing opacity (exact integer wave frequency over 10s)
    starsMaterial.opacity = 0.6 + 0.3 * Math.sin(elapsedTime * 2 * Math.PI * 2 / 10);

    // Floating camera path that matches perfectly at frame 0 and frame 600
    const angleY = (elapsedTime * 2 * Math.PI * 1) / 10;
    const angleX = (elapsedTime * 2 * Math.PI * 2) / 10;
    camera.position.y = Math.sin(angleY) * 0.4;
    camera.position.x = Math.sin(angleX) * 0.5;
    camera.lookAt(0, 0, -30);

    renderer.render(scene, camera);
  }, [frame, fps]);

  // 3. Staggered GSAP Entrance & Exit animations mapped to Remotion interpolation
  const rightPanelX = interpolate(frame, [0, 60, 540, 600], [300, 0, 0, 300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const rightPanelOpacity = interpolate(frame, [0, 60, 540, 600], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const diagLineOpacity = interpolate(frame, [15, 70, 530, 585], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleX = interpolate(frame, [20, 75, 525, 580], [120, 0, 0, 120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const titleOpacity = interpolate(frame, [20, 75, 525, 580], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const playEntranceScale = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.back(1.7),
  });
  const playExitScale = interpolate(frame, [510, 570], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const playScale = frame < 300 ? playEntranceScale : playExitScale;
  const playOpacity = interpolate(frame, [30, 90, 510, 570], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subY = interpolate(frame, [40, 95, 505, 560], [50, 0, 0, 50], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const subOpacity = interpolate(frame, [40, 95, 505, 560], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaOpacity = interpolate(frame, [50, 105, 495, 550], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const prevLabelX = interpolate(frame, [25, 80, 520, 575], [-60, 0, 0, -60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const prevLabelOpacity = interpolate(frame, [25, 80, 520, 575], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const prevCornerOpacity = interpolate(frame, [45, 100, 500, 555], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const nextLabelY = interpolate(frame, [35, 90, 515, 570], [60, 0, 0, 60], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const nextLabelOpacity = interpolate(frame, [35, 90, 515, 570], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const nextCornerOpacity = interpolate(frame, [55, 110, 490, 545], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 4. Symmetrical loop-aligned continuous pulsing glow values
  const playPulse = 0.5 + 0.5 * Math.sin((frame * 2 * Math.PI * 5) / 600);
  const playGlow1 = interpolate(playPulse, [0, 1], [35, 50]);
  const playGlow2 = interpolate(playPulse, [0, 1], [60, 80]);

  const subPulse = 0.5 + 0.5 * Math.sin((frame * 2 * Math.PI * 6) / 600);
  const subGlow1 = interpolate(subPulse, [0, 1], [22, 40]);
  const subGlow2 = interpolate(subPulse, [0, 1], [16, 22]);

  const titlePulse = 0.5 + 0.5 * Math.sin((frame * 2 * Math.PI * 4) / 600);
  const textShadowGlowValue = interpolate(titlePulse, [0, 1], [18, 28]);

  const ctaPulse = 0.5 + 0.5 * Math.sin((frame * 2 * Math.PI * 3) / 600);
  const ctaTextShadowGlowValue = interpolate(ctaPulse, [0, 1], [14, 26]);

  // CSS Styles converted to camelCase React.CSSProperties
  const containerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#000',
    fontFamily: "'Arial Black', Arial, sans-serif",
  };

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'block',
    zIndex: 0,
  };

  const uiStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 2,
  };

  const rightPanelStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    clipPath: 'polygon(58% 0, 100% 0, 100% 100%, 42% 100%)',
    background: 'radial-gradient(ellipse at 75% 40%, #0a1424 0%, #02040a 70%, #000 100%)',
    transform: `translateX(${rightPanelX}px)`,
    opacity: rightPanelOpacity,
  };

  const diagLineStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    clipPath: 'polygon(57.4% 0, 58.6% 0, 42.6% 100%, 41.4% 100%)',
    background: 'linear-gradient(180deg, #5ad8ff, #1b8cff)',
    boxShadow: '0 0 30px #19b6ff',
    filter: 'blur(0.4px)',
    opacity: diagLineOpacity,
  };

  const diagGlowStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    clipPath: 'polygon(58% 0, 63% 0, 47% 100%, 42% 100%)',
    background: 'linear-gradient(180deg, rgba(90,216,255,0.0), rgba(27,140,255,0.55))',
    opacity: diagLineOpacity,
  };

  const titleStyle: React.CSSProperties = {
    position: 'absolute',
    top: '7.5%',
    right: '4%',
    textAlign: 'right',
    lineHeight: 0.98,
    transform: `translateX(${titleX}px)`,
    opacity: titleOpacity,
  };

  const h1Style: React.CSSProperties = {
    color: '#dff1ff',
    fontSize: '56px',
    letterSpacing: '1px',
    margin: 0,
    textShadow: `0 0 ${textShadowGlowValue}px rgba(25,182,255,0.95), 0 0 4px #fff`,
  };

  const playBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: '26%',
    right: '12%',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 42% 38%, #8c9094 0%, #5c6064 55%, #3a3d40 100%)',
    border: '7px solid #19b6ff',
    boxShadow: `0 0 ${playGlow1}px #19b6ff, 0 0 ${playGlow2}px rgba(25,182,255,0.5), inset 0 0 25px rgba(0,0,0,0.55)`,
    transform: `scale(${playScale})`,
    transformOrigin: '50% 50%',
    opacity: playOpacity,
  };

  const playTriangleStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '54%',
    transform: 'translate(-50%, -50%)',
    borderLeft: '32px solid rgba(255,255,255,0.85)',
    borderTop: '22px solid transparent',
    borderBottom: '22px solid transparent',
    filter: 'drop-shadow(0 0 6px rgba(25,182,255,0.7))',
  };

  const subscribeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '62%',
    right: '13%',
    padding: '16px 48px',
    color: '#fff',
    fontSize: '30px',
    letterSpacing: '2px',
    background: 'rgba(2,8,18,0.35)',
    border: '4px solid #5ad8ff',
    borderRadius: '14px',
    boxShadow: `0 0 ${subGlow1}px #19b6ff, inset 0 0 ${subGlow2}px rgba(25,182,255,0.25)`,
    textShadow: '0 0 10px rgba(25,182,255,0.7)',
    transform: `translateY(${subY}px)`,
    opacity: subOpacity,
  };

  const ctaStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '5%',
    right: '3%',
    color: '#fff',
    fontStyle: 'italic',
    letterSpacing: '2px',
    fontSize: '28px',
    whiteSpace: 'nowrap',
    textShadow: `0 0 ${ctaTextShadowGlowValue}px rgba(25,182,255,0.8), 0 2px 5px rgba(0,0,0,0.6)`,
    opacity: ctaOpacity,
  };

  const prevLabelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '18%',
    left: '5%',
    color: '#fff',
    fontSize: '36px',
    letterSpacing: '2px',
    writingMode: 'vertical-rl',
    transform: `translateX(${prevLabelX}px) rotate(180deg)`,
    textShadow: '0 0 12px rgba(25,182,255,0.6), 0 2px 5px rgba(0,0,0,0.6)',
    opacity: prevLabelOpacity,
  };

  const prevCornerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '14%',
    left: '46%',
    width: '80px',
    height: '220px',
    borderRight: '6px solid #5ad8ff',
    borderTop: '6px solid #5ad8ff',
    boxShadow: '0 0 18px #19b6ff',
    filter: 'drop-shadow(0 0 6px #19b6ff)',
    opacity: prevCornerOpacity,
  };

  const nextLabelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '48%',
    left: '38%',
    color: '#fff',
    fontSize: '36px',
    letterSpacing: '2px',
    writingMode: 'vertical-rl',
    transform: `translateY(${nextLabelY}px) rotate(180deg)`,
    textShadow: '0 0 12px rgba(90,216,255,0.7), 0 2px 5px rgba(0,0,0,0.6)',
    opacity: nextLabelOpacity,
  };

  const nextCornerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '30%',
    width: '100px',
    height: '240px',
    borderLeft: '6px solid #5ad8ff',
    borderBottom: '6px solid #5ad8ff',
    boxShadow: '0 0 18px #19b6ff',
    filter: 'drop-shadow(0 0 6px #19b6ff)',
    opacity: nextCornerOpacity,
  };

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />

      <div style={uiStyle}>
        {/* Diagonal side panels */}
        <div style={diagGlowStyle} />
        <div style={rightPanelStyle} />
        <div style={diagLineStyle} />

        {/* Left Side Video Frames */}
        <div style={prevLabelStyle}>Previous Video</div>
        <div style={prevCornerStyle} />
        <div style={nextLabelStyle}>Next Video</div>
        <div style={nextCornerStyle} />

        {/* Right Side Call To Actions */}
        <div style={titleStyle}>
          <h1 style={h1Style}>
            THANKS FOR
            <br />
            WATCHING
          </h1>
        </div>
        <div style={playBtnStyle}>
          {/* Inner Triangle replacing CSS ::after */}
          <div style={playTriangleStyle} />
        </div>
        <div style={subscribeStyle}>SUBSCRIBE</div>
        <div style={ctaStyle}>LIKE - COMMENT - SHARE</div>
      </div>
    </div>
  );
};

export default SplitGridOutro;
// END_OF_FILE