import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic seed generation for particle positions and speed variables to avoid Math.random() inside rendering
const PARTICLE_COUNT = 20;
const STATIC_PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const size = ((i * 17) % 30) + 10; // 10 to 40
  const x = ((i * 93) % 2000) - 1000; // -1000 to 1000
  const y = ((i * 71) % 1000) - 500;  // -500 to 500
  const z = ((i * 47) % 2000) - 1500; // -1500 to 500
  const speedX = ((i * 13) % 100) / 10000;
  const speedY = ((i * 29) % 100) / 10000;
  // Use index to vary forward speed deterministically
  const speedZ = 2 + ((i * 31) % 10) * 0.4; // speed forward
  const isCyan = i % 2 === 0;
  return { size, x, y, z, speedX, speedY, speedZ, isCyan };
});

export const SciFiEsportsEndscreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const lightRef = useRef<THREE.PointLight | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 15 seconds seamless loop (900 frames at 60fps)
  const totalFrames = fps * 15;
  const loopProgress = (frame % totalFrames) / totalFrames;

  // Initialize Three.js scene once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x00040a, 0.0012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 1, 3000);
    camera.position.set(0, 50, 600);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x00040a);
    rendererRef.current = renderer;

    // Glowing Neon Materials
    const cyanMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x00f3ff,
      emissiveIntensity: 2,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });

    const blueMaterial = new THREE.MeshStandardMaterial({
      color: 0x0055ff,
      emissive: 0x0055ff,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.8,
    });

    // Cyberpunk Floor Grid
    const gridHelper = new THREE.GridHelper(4000, 100, 0x00f3ff, 0x001133);
    gridHelper.position.y = -300;
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach((mat) => {
        mat.opacity = 0.5;
        mat.transparent = true;
      });
    } else {
      gridHelper.material.opacity = 0.5;
      gridHelper.material.transparent = true;
    }
    scene.add(gridHelper);
    gridRef.current = gridHelper;

    // Giant Background Rings
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const torusGeo = new THREE.TorusGeometry(800 - i * 150, 20 + i * 10, 16, 100);
      const torus = new THREE.Mesh(torusGeo, i % 2 === 0 ? cyanMaterial : blueMaterial);
      torus.position.z = -800 + i * 200;
      torus.rotation.x = Math.PI / 2 + i * 0.2;
      scene.add(torus);
      rings.push(torus);
    }
    ringsRef.current = rings;

    // Foreground Geometrical Particles
    const particles: THREE.Mesh[] = [];
    STATIC_PARTICLES.forEach((p) => {
      const geo = new THREE.IcosahedronGeometry(p.size, 0);
      const mat = p.isCyan ? cyanMaterial : blueMaterial;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x, p.y, p.z);
      scene.add(mesh);
      particles.push(mesh);
    });
    particlesRef.current = particles;

    // Scene Lights
    scene.add(new THREE.AmbientLight(0x001122));
    const centerLight = new THREE.PointLight(0x00f3ff, 2, 1000);
    centerLight.position.set(0, 0, 0);
    scene.add(centerLight);
    lightRef.current = centerLight;

    return () => {
      renderer.dispose();
      cyanMaterial.dispose();
      blueMaterial.dispose();
      gridHelper.geometry.dispose();
      rings.forEach((r) => r.geometry.dispose());
      particles.forEach((p) => p.geometry.dispose());
    };
  }, []);

  // Frame update effect (strictly driven by useCurrentFrame() for absolute frame locking)
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    // Camera slow parallax motion (ensure 100% loop synchronization)
    camera.position.x = Math.sin(loopProgress * Math.PI * 2) * 100;
    camera.position.y = 50 + Math.cos(loopProgress * Math.PI * 2) * 50;
    camera.lookAt(0, 0, -500);

    // Floor movement mapped perfectly to tile distance for seamless looping
    if (gridRef.current) {
      gridRef.current.position.z = (loopProgress * 2240) % 40;
    }

    // Animate Torus Rings
    ringsRef.current.forEach((ring, i) => {
      const rotFactorX = 1 + i;
      const rotFactorY = 2 + i;
      const rotFactorZ = 3 + i;
      ring.rotation.x = (Math.PI / 2 + i * 0.2) + loopProgress * Math.PI * 2 * rotFactorX;
      ring.rotation.y = loopProgress * Math.PI * 2 * rotFactorY;
      ring.rotation.z = loopProgress * Math.PI * 2 * rotFactorZ;
    });

    // Animate particles with perfect looping wrapped positions
    particlesRef.current.forEach((mesh, index) => {
      const p = STATIC_PARTICLES[index];
      const totalDistance = 2200;
      let calculatedZ = p.z + loopProgress * totalDistance;
      if (calculatedZ > 700) {
        calculatedZ -= totalDistance;
      }
      mesh.position.z = calculatedZ;

      // Spin rotation
      const rotCycles = 1 + (index % 3);
      mesh.rotation.x = loopProgress * Math.PI * 2 * rotCycles;
      mesh.rotation.y = loopProgress * Math.PI * 2 * rotCycles;
    });

    // Symmetrical pulsating light intense glow
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(loopProgress * Math.PI * 2 * 10) * 1;
    }

    renderer.render(scene, camera);
  }, [frame, fps, loopProgress]);

  // UI Interpolations
  // Breathing glowing border for placeholders
  const shadowSpread = interpolate(
    frame % 180,
    [0, 90, 180],
    [40, 70, 40],
    { easing: Easing.inOut(Easing.quad) }
  );

  const shadowOpacity = interpolate(
    frame % 180,
    [0, 90, 180],
    [0.5, 0.8, 0.5],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Scanline motion loops
  const scanLeftY = interpolate(
    frame % 300,
    [0, 150, 300],
    [0, 356, 0],
    { easing: Easing.linear }
  );

  const scanRightY = interpolate(
    (frame + 75) % 240,
    [0, 120, 240],
    [0, 356, 0],
    { easing: Easing.linear }
  );

  // Symmetrical loops for Center Ring elements
  const ringOuterRotation = interpolate(
    frame % 900,
    [0, 900],
    [0, 360],
    { easing: Easing.linear }
  );

  const ringMiddleRotation = interpolate(
    frame % 300,
    [0, 300],
    [360, 0],
    { easing: Easing.linear }
  );

  const ringInnerRotation = interpolate(
    frame % 180,
    [0, 180],
    [0, 360],
    { easing: Easing.linear }
  );

  const holoCoreScale = interpolate(
    frame % 120,
    [0, 60, 120],
    [0.9, 1.2, 0.9],
    { easing: Easing.inOut(Easing.quad) }
  );

  const holoCoreOpacity = interpolate(
    frame % 120,
    [0, 60, 120],
    [0.6, 1.0, 0.6],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Style objects ensuring strictly camelCase rules
  const containerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    backgroundColor: '#00040a',
    overflow: 'hidden',
  };

  const webglCanvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    zIndex: 1,
    filter: 'brightness(1.1) contrast(1.1) drop-shadow(0 0 25px rgba(0, 243, 255, 0.25))',
  };

  const cinematicBarsStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 20,
    pointerEvents: 'none',
    boxShadow: 'inset 0 150px 100px -100px rgba(0,0,0,0.9), inset 0 -150px 100px -100px rgba(0,0,0,0.9)',
  };

  const uiLayerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    zIndex: 10,
    pointerEvents: 'none',
  };

  const placeholderBaseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 250,
    width: 640,
    height: 360,
    border: '6px solid #00f3ff',
    backgroundColor: 'rgba(0, 10, 30, 0.4)',
    backdropFilter: 'blur(10px)',
    overflow: 'hidden',
    boxShadow: `0 0 ${shadowSpread}px rgba(0, 243, 255, ${shadowOpacity}), inset 0 0 ${shadowSpread}px rgba(0, 243, 255, ${shadowOpacity - 0.2})`,
  };

  const placeholderLeftStyle: React.CSSProperties = {
    ...placeholderBaseStyle,
    left: 150,
  };

  const placeholderRightStyle: React.CSSProperties = {
    ...placeholderBaseStyle,
    right: 150,
  };

  const cornerBeforeStyle: React.CSSProperties = {
    position: 'absolute',
    width: 50,
    height: 50,
    border: '8px solid #00f3ff',
    boxShadow: '0 0 20px #00f3ff',
    top: -4,
    left: -4,
    borderRight: 'none',
    borderBottom: 'none',
  };

  const cornerAfterStyle: React.CSSProperties = {
    position: 'absolute',
    width: 50,
    height: 50,
    border: '8px solid #00f3ff',
    boxShadow: '0 0 20px #00f3ff',
    bottom: -4,
    right: -4,
    borderLeft: 'none',
    borderTop: 'none',
  };

  const scanLineStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 4,
    backgroundColor: '#00f3ff',
    boxShadow: '0 0 20px #00f3ff, 0 0 40px #00f3ff',
    opacity: 0.8,
  };

  const subscribeAreaStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 120,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 350,
    height: 350,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const holoRingBase: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
  };

  const ringOuterStyle: React.CSSProperties = {
    ...holoRingBase,
    width: 350,
    height: 350,
    border: '4px dashed #0055ff',
    boxShadow: '0 0 30px rgba(0, 85, 255, 0.6)',
    transform: `rotate(${ringOuterRotation}deg)`,
  };

  const ringMiddleStyle: React.CSSProperties = {
    ...holoRingBase,
    width: 300,
    height: 300,
    borderTop: '12px solid #00f3ff',
    borderBottom: '12px solid #00f3ff',
    borderLeft: '12px solid transparent',
    borderRight: '12px solid transparent',
    boxShadow: '0 0 40px #00f3ff, inset 0 0 20px #00f3ff',
    transform: `rotate(${ringMiddleRotation}deg)`,
  };

  const ringInnerStyle: React.CSSProperties = {
    ...holoRingBase,
    width: 240,
    height: 240,
    border: '6px solid #0055ff',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    transform: `rotate(${ringInnerRotation}deg)`,
  };

  const holoCoreStyle: React.CSSProperties = {
    width: 160,
    height: 160,
    background: 'radial-gradient(circle, #00f3ff 0%, rgba(0, 243, 255, 0) 70%)',
    borderRadius: '50%',
    transform: `scale(${holoCoreScale})`,
    opacity: holoCoreOpacity,
  };

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} style={webglCanvasStyle} />
      
      <div style={cinematicBarsStyle} />

      <div style={uiLayerStyle}>
        {/* Left Placeholder Area */}
        <div style={placeholderLeftStyle}>
          <div style={cornerBeforeStyle} />
          <div style={{ ...scanLineStyle, transform: `translateY(${scanLeftY}px)` }} />
          <div style={cornerAfterStyle} />
        </div>
        
        {/* Right Placeholder Area */}
        <div style={placeholderRightStyle}>
          <div style={cornerBeforeStyle} />
          <div style={{ ...scanLineStyle, transform: `translateY(${scanRightY}px)` }} />
          <div style={cornerAfterStyle} />
        </div>

        {/* Subscribe Holographic Circle Core */}
        <div style={subscribeAreaStyle}>
          <div style={ringOuterStyle} />
          <div style={ringMiddleStyle} />
          <div style={ringInnerStyle} />
          <div style={holoCoreStyle} />
        </div>
      </div>
    </div>
  );
};

export default SciFiEsportsEndscreen;
// END_OF_FILE