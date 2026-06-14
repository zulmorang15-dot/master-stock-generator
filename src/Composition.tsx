import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

// Deterministic Cinematic Theme Setup
const THEME = {
  primaryColor: 0x00f0ff,
  secondaryColor: 0xff00ff,
  bgGradientStart: "#03020c",
  bgGradientEnd: "#000000",
  cssGlow: "#00f0ff",
  cssGlowSec: "#ff00ff",
  glassBg: "rgba(10, 10, 18, 0.45)",
  glassBorder: "rgba(0, 240, 255, 0.4)"
};

const PARTICLE_COUNT = 1000;

// Pre-calculate randomized layout structures outside render loop to maintain deterministic state
const PARTICLE_DATA = Array.from({ length: PARTICLE_COUNT }, () => {
  const radius = Math.random() * 55 + 5;
  const theta = Math.random() * Math.PI * 2;
  const z = (Math.random() - 0.5) * 120;
  const phase = Math.random() * Math.PI * 2;
  return { radius, theta, z, phase };
});

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PremiumCinematicEndscreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const complexMeshRef = useRef<THREE.Mesh | null>(null);

  // Clean scaling calculation to ensure fullscreen coverage with no black bars
  const scaleFactor = Math.max(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const loopDuration = 15; // 15 seconds loop
  const totalFrames = fps * loopDuration;
  const localFrame = frame % totalFrames;
  const elapsedTime = localFrame / fps;
  const loopFreq = (2 * Math.PI) / loopDuration;

  // Cinematic Entry & Exit UI Reveal Animations (Seamless loop pairing)
  const introTransition = interpolate(localFrame, [0, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const outroTransition = interpolate(localFrame, [totalFrames - 45, totalFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const uiTransition = introTransition * outroTransition;

  // Initialize ThreeJS Cinematic Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020105, 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
    camera.position.z = 45;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(2);
    rendererRef.current = renderer;

    // Fluid Vortex Particle System Setup
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    PARTICLE_DATA.forEach((pt, i) => {
      positions[i * 3] = Math.cos(pt.theta) * pt.radius;
      positions[i * 3 + 1] = Math.sin(pt.theta) * pt.radius;
      positions[i * 3 + 2] = pt.z;
    });

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pMaterial = new THREE.PointsMaterial({
      color: THEME.primaryColor,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, pMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Abstract Sculptural Torus Knot Core
    const complexGeometry = new THREE.TorusKnotGeometry(14, 3.5, 200, 32, 3, 5);
    const meshMaterial = new THREE.MeshStandardMaterial({
      color: THEME.secondaryColor,
      wireframe: true,
      roughness: 0.1,
      metalness: 0.9,
      emissive: THEME.secondaryColor,
      emissiveIntensity: 0.45,
    });

    const complexMesh = new THREE.Mesh(complexGeometry, meshMaterial);
    complexMesh.position.set(0, 0, -10);
    scene.add(complexMesh);
    complexMeshRef.current = complexMesh;

    // Lights
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2);
    dirLight1.position.set(1, 1, 1).normalize();
    scene.add(dirLight1);

    const pointLight = new THREE.PointLight(THEME.primaryColor, 3, 100);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    return () => {
      renderer.dispose();
      particleGeo.dispose();
      pMaterial.dispose();
      complexGeometry.dispose();
      meshMaterial.dispose();
    };
  }, []);

  // Frame-Locked Updates
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const particles = particlesRef.current;
    const complexMesh = complexMeshRef.current;

    if (!renderer || !scene || !camera) return;

    // Seamless camera rotation/drift path mapping
    camera.position.x = Math.sin(elapsedTime * loopFreq) * 2.5;
    camera.position.y = Math.cos(elapsedTime * loopFreq) * 1.8;
    camera.lookAt(scene.position);

    // Knot core continuous seamless transformation
    if (complexMesh) {
      complexMesh.rotation.x = elapsedTime * loopFreq * 2;
      complexMesh.rotation.y = elapsedTime * loopFreq * 3;
      complexMesh.rotation.z = Math.sin(elapsedTime * loopFreq) * 0.5;
    }

    // Mathematical dynamic particle stream updates
    if (particles) {
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const zRange = 120;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const pt = PARTICLE_DATA[i];
        let currentZ = pt.z + elapsedTime * 16.0;
        currentZ = ((currentZ + 60) % zRange) - 60; // Clean viewport modulo wrap

        const idx = i * 3;
        positions[idx] = Math.cos(pt.theta) * pt.radius + Math.sin(elapsedTime * loopFreq * 5 + pt.phase) * 1.5;
        positions[idx + 1] = Math.sin(pt.theta) * pt.radius + Math.cos(elapsedTime * loopFreq * 5 + pt.phase) * 1.5;
        positions[idx + 2] = currentZ;
      }

      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.z = elapsedTime * loopFreq;
    }

    renderer.render(scene, camera);
  }, [localFrame, elapsedTime, loopFreq]);

  // Frame-Locked Gradient Sweep (4.5s cycle)
  const sweepFrame = localFrame % (fps * 4.5);
  const sweepPercent = interpolate(sweepFrame, [0, fps * 4.5], [-100, 100], {
    easing: Easing.inOut(Easing.quad),
  });

  // Infinite Ambient Float Mechanics for Placeholders
  const floatYLeft = Math.sin(elapsedTime * loopFreq * 2) * 10;
  const floatYRight = Math.cos(elapsedTime * loopFreq * 2) * 10;
  const floatXLeft = Math.cos(elapsedTime * loopFreq) * 6;
  const floatXRight = -Math.cos(elapsedTime * loopFreq) * 6;

  // Reveal Animations
  const videoYOffset = interpolate(uiTransition, [0, 1], [60, 0]);
  const videoScale = interpolate(uiTransition, [0, 1], [0.8, 1]);
  const subscribeScale = interpolate(uiTransition, [0, 1], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.5, 1.15),
  });

  // Seamless ring rotation coordinates
  const ring1Rotation = (localFrame / totalFrames) * 360;
  const ring2Rotation = 360 - (localFrame / totalFrames) * 360;

  // Style Definitions (Guaranteeing CamelCase JSX compliance)
  const wrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    background: 'radial-gradient(circle at 50% 50%, #0a0616 0%, #020105 100%)',
  };

  const uiLayerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    pointerEvents: 'auto',
    boxSizing: 'border-box',
    padding: '90px',
  };

  const videoPlaceholderBase: React.CSSProperties = {
    position: 'absolute',
    width: '620px',
    height: '348px',
    background: THEME.glassBg,
    backdropFilter: 'blur(25px) saturate(180%)',
    WebkitBackdropFilter: 'blur(25px) saturate(180%)',
    border: `3px solid ${THEME.glassBorder}`,
    borderRadius: '24px',
    boxShadow: `0 0 50px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.05), 0 0 30px ${THEME.glassBorder}`,
    overflow: 'hidden',
  };

  const leftVideoStyle: React.CSSProperties = {
    ...videoPlaceholderBase,
    left: '110px',
    top: '366px',
    transform: `translate(${floatXLeft}px, ${floatYLeft + videoYOffset}px) scale(${videoScale})`,
    opacity: uiTransition,
  };

  const rightVideoStyle: React.CSSProperties = {
    ...videoPlaceholderBase,
    right: '110px',
    top: '366px',
    transform: `translate(${floatXRight}px, ${floatYRight + videoYOffset}px) scale(${videoScale})`,
    opacity: uiTransition,
  };

  const sweepOverlayStyle: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.1) 50%, transparent 55%)',
    transform: `translate(${sweepPercent}%, ${sweepPercent}%) rotate(45deg)`,
    pointerEvents: 'none',
  };

  const subscribeWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '540px',
    transform: 'translate(-50%, -50%)',
    width: '280px',
    height: '280px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const outerRingBaseStyle: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    opacity: 0.6 * uiTransition,
    pointerEvents: 'none',
  };

  const ring1Style: React.CSSProperties = {
    ...outerRingBaseStyle,
    width: '250px',
    height: '250px',
    border: `2px dashed ${THEME.cssGlowSec}`,
    filter: `drop-shadow(0 0 8px ${THEME.cssGlowSec})`,
    transform: `rotate(${ring1Rotation}deg)`,
  };

  const ring2Style: React.CSSProperties = {
    ...outerRingBaseStyle,
    width: '275px',
    height: '275px',
    border: `1px solid ${THEME.cssGlow}`,
    borderImage: `linear-gradient(to right, ${THEME.cssGlow} 40px, transparent 180px) 1`,
    filter: `drop-shadow(0 0 12px ${THEME.cssGlow})`,
    transform: `rotate(${ring2Rotation}deg)`,
  };

  const subscribeCircleStyle: React.CSSProperties = {
    width: '190px',
    height: '190px',
    background: THEME.glassBg,
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    border: `4px solid ${THEME.cssGlow}`,
    borderRadius: '50%',
    boxShadow: `0 0 60px rgba(0, 0, 0, 0.9), 0 0 40px ${THEME.cssGlow}, inset 0 0 25px rgba(255, 255, 255, 0.1)`,
    position: 'relative',
    zIndex: 5,
    cursor: 'pointer',
    transform: `scale(${subscribeScale})`,
    opacity: uiTransition,
  };

  const vignetteStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(2, 1, 5, 0.85) 100%)',
    zIndex: 5,
    pointerEvents: 'none',
  };

  return (
    <div style={wrapperStyle}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />
      <div style={vignetteStyle} />
      <div style={uiLayerStyle}>
        <div style={leftVideoStyle}>
          <div style={sweepOverlayStyle} />
        </div>

        <div style={subscribeWrapperStyle}>
          <div style={ring1Style} />
          <div style={ring2Style} />
          <div style={subscribeCircleStyle} />
        </div>

        <div style={rightVideoStyle}>
          <div style={sweepOverlayStyle} />
        </div>
      </div>
    </div>
  );
};

export default PremiumCinematicEndscreen;
// END_OF_FILE