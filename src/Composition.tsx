import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLE_COUNT = 1200;
const PARTICLE_DATA = (() => {
  const data = [];
  let seed = 42;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    data.push({
      x: (random() - 0.5) * 80,
      y: (random() - 0.5) * 40,
      z: (random() - 0.5) * 40 - 10,
      speed: random() * 0.02 + 0.005,
      driftOffset: random() * 100,
    });
  }
  return data;
})();

export const LuxuryFuturisticEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References for Three.js instances to persist across renders
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const blueLightRef = useRef<THREE.PointLight | null>(null);
  const whiteLightRef = useRef<THREE.PointLight | null>(null);

  // Math-based conversions & layout parameters
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);
  const time = frame / fps;

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050a, 0.02);
    sceneRef.current = scene;

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(45, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
    camera.position.set(0, 5, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);
    rendererRef.current = renderer;

    // 1. Glossy Reflective Floor
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x02050a,
      roughness: 0.1,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -6;
    scene.add(floor);

    // 2. Holographic Floor Grid
    const gridHelper = new THREE.GridHelper(200, 100, 0x00f0ff, 0x004488);
    gridHelper.position.y = -5.9;
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0.15;
      });
    } else {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.15;
    }
    scene.add(gridHelper);

    // 3. Floating Holographic Rings
    const ringGeo = new THREE.TorusGeometry(12, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.3,
    });

    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -2 + i * 3;
      ring.scale.setScalar(1 - i * 0.15);
      scene.add(ring);
      rings.push(ring);
    }
    ringsRef.current = rings;

    // 4. Volumetric Ambient Particles (Dust/Data)
    const particlesGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(PARTICLE_COUNT * 3);

    PARTICLE_DATA.forEach((p, idx) => {
      particlePos[idx * 3] = p.x;
      particlePos[idx * 3 + 1] = p.y;
      particlePos[idx * 3 + 2] = p.z;
    });

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    // Generate a soft glow texture for particles procedurally
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      pGrad.addColorStop(0.3, 'rgba(0, 240, 255, 0.8)');
      pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = pGrad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particlesMat = new THREE.PointsMaterial({
      size: 0.8,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.6,
    });

    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0x004488, 0.5);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x00f0ff, 2, 50);
    blueLight.position.set(-15, -2, -5);
    scene.add(blueLight);
    blueLightRef.current = blueLight;

    const whiteLight = new THREE.PointLight(0xffffff, 1.5, 50);
    whiteLight.position.set(15, -2, -5);
    scene.add(whiteLight);
    whiteLightRef.current = whiteLight;

    // Cleanup on unmount
    return () => {
      renderer.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      gridHelper.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      pTexture.dispose();
    };
  }, []);

  // Frame-locked deterministic updates for Three.js
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const rings = ringsRef.current;
    const particleSystem = particleSystemRef.current;
    const blueLight = blueLightRef.current;
    const whiteLight = whiteLightRef.current;

    if (!scene || !camera || !renderer || !particleSystem || !blueLight || !whiteLight) return;

    // Animate Rings (Looping perfectly over 15 seconds)
    rings.forEach((ring, index) => {
      ring.rotation.z = ((time / 15) * Math.PI * 2) * (index + 1);
      ring.position.y =
        -2 +
        index * 3 +
        Math.sin(((time / 15) * Math.PI * 2 * 3) + (index * Math.PI / 3)) * 0.5;
    });

    // Animate Particles (Looping perfectly over 15 seconds)
    const positions = particleSystem.geometry.attributes.position.array as Float32Array;
    const totalSpan = 40;
    PARTICLE_DATA.forEach((p, idx) => {
      const cycles = Math.ceil(p.speed * 200);
      const speed = (cycles * totalSpan) / 15;
      positions[idx * 3 + 1] = -20 + ((p.y + 20 + speed * time) % totalSpan);
      positions[idx * 3] = p.x + Math.sin(((time / 15) * Math.PI * 2 * 2) + p.driftOffset) * 0.5;
    });
    particleSystem.geometry.attributes.position.needsUpdate = true;

    // Light Movement (Looping perfectly over 15 seconds)
    const lightProgress = Math.sin((time / 15) * Math.PI * 2 * 2);
    blueLight.position.x = -15 + (lightProgress + 1) * 15;
    blueLight.position.z = -5 + (lightProgress + 1) * 5;

    const whiteLightProgress = Math.sin((time / 15) * Math.PI * 2 * 3);
    whiteLight.position.x = 15 - (whiteLightProgress + 1) * 15;
    whiteLight.position.z = -5 + (whiteLightProgress + 1) * 7.5;

    // Camera Parallax (Immersive Loopable Drift)
    const camProgress = (Math.sin((time / 15) * Math.PI * 2) + 1) / 2;
    camera.position.x = camProgress * 2;
    camera.position.y = 5 - camProgress * 0.5;
    camera.lookAt(camProgress * 2, 0, 0);

    renderer.render(scene, camera);
  }, [frame, fps, time]);

  // UI Interpolations & Animations (Deterministic 15s Loops)
  const cardLeftY = Math.sin((time / 15) * Math.PI * 2 * 3) * 7.5;
  const cardRightY = Math.sin(((time / 15) * Math.PI * 2 * 3) + Math.PI / 2) * 7.5;

  const subZoneY = Math.sin((time / 15) * Math.PI * 2 * 4) * 5;

  // Pulse effect parameters
  const pulseVal = Math.sin((time / 15) * Math.PI * 2 * 8);
  const pulseScale = interpolate(pulseVal, [-1, 1], [1, 1.02]);
  const glowRadius = interpolate(pulseVal, [-1, 1], [30, 50]);
  const innerGlowRadius = interpolate(pulseVal, [-1, 1], [20, 30]);

  // Video card sweeps (looping every 5 seconds)
  const sweepCycle = time % 5;
  const sweepProgressLeft = sweepCycle / 5;
  let sweepLeftPos = '200%';
  if (sweepProgressLeft < 0.2) {
    sweepLeftPos = interpolate(sweepProgressLeft, [0, 0.2], [-150, 200]) + '%';
  }

  const rightSweepCycle = (time + 2.5) % 5;
  const sweepProgressRight = rightSweepCycle / 5;
  let sweepRightPos = '200%';
  if (sweepProgressRight < 0.2) {
    sweepRightPos = interpolate(sweepProgressRight, [0, 0.2], [-150, 200]) + '%';
  }

  // Ring angles (seamless looping rotations)
  const outerRingAngle = (time / 15) * 360;
  const middleRingAngle = -(time / 15) * 360;
  const innerRingAngle = Math.sin((time / 15) * Math.PI * 2 * 2) * 90;

  return (
    <div
      id="endscreen-container"
      style={{
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, #050b1a 0%, #020408 100%)',
      }}
    >
      {/* THREE.JS BACKGROUND CANVAS */}
      <canvas
        ref={canvasRef}
        id="webgl-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          opacity: 0.8,
        }}
      />

      {/* UI LAYER */}
      <div
        className="ui-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          className="hud-line top"
          style={{
            position: 'absolute',
            background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.5), transparent)',
            height: '1px',
            width: '600px',
            left: '50%',
            transform: 'translateX(-50%)',
            top: '120px',
            opacity: 0.5,
          }}
        />
        <div
          className="hud-line bottom"
          style={{
            position: 'absolute',
            background: 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.5), transparent)',
            height: '1px',
            width: '600px',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '120px',
            opacity: 0.5,
          }}
        />

        {/* LEFT VIDEO CARD */}
        <div
          className="video-card left"
          id="card-left"
          style={{
            position: 'absolute',
            width: '600px',
            height: '337px',
            top: '50%',
            left: '220px',
            transform: `translateY(calc(-50% + ${cardLeftY}px))`,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 170, 255, 0.05) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 200, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(0, 150, 255, 0.1), 0 0 30px rgba(0, 150, 255, 0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            className="light-sweep"
            style={{
              position: 'absolute',
              top: 0,
              left: sweepLeftPos,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
              transform: 'skewX(-25deg)',
            }}
          />
          <div className="hud-corner top-left" style={{ position: 'absolute', width: '20px', height: '20px', border: '2px solid #00f0ff', borderRadius: '4px', opacity: 0.6, boxShadow: '0 0 10px #00f0ff', top: '10px', left: '10px', borderRight: 'none', borderBottom: 'none' }} />
          <div className="hud-corner top-right" style={{ position: 'absolute', width: '20px', height: '20px', border: '2px solid #00f0ff', borderRadius: '4px', opacity: 0.6, boxShadow: '0 0 10px #00f0ff', top: '10px', right: '10px', borderLeft: 'none', borderBottom: 'none' }} />
          <div className="hud-corner bottom-left" style={{ position: 'absolute', width: '20px', height: '20px', border: '2px solid #00f0ff', borderRadius: '4px', opacity: 0.6, boxShadow: '0 0 10px #00f0ff', bottom: '10px', left: '10px', borderRight: 'none', borderTop: 'none' }} />
          <div className="hud-corner bottom-right" style={{ position: 'absolute', width: '20px', height: '20px', border: '2px solid #00f0ff', borderRadius: '4px', opacity: 0.6, boxShadow: '0 0 10px #00f0ff', bottom: '10px', right: '10px', borderLeft: 'none', borderTop: 'none' }} />
        </div>

        {/* RIGHT VIDEO CARD */}
        <div
          className="video-card right"
          id="card-right"
          style={{
            position: 'absolute',
            width: '600px',
            height: '337px',
            top: '50%',
            right: '220px',
            transform: `translateY(calc(-50% + ${cardRightY}px))`,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 170, 255, 0.05) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 200, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(0, 150, 255, 0.1), 0 0 30px rgba(0, 150, 255, 0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            className="light-sweep"
            style={{
              position: 'absolute',
              top: 0,
              left: sweepRightPos,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
              transform: 'skewX(-25deg)',
            }}
          />
          <div className="hud-corner top-left" style={{ position: 'absolute', width: '20px', height: '20px', border: '2px solid #00f0ff', borderRadius: '4px', opacity: 0.6, boxShadow: '0 0 10px #00f0ff', top: '10px', left: '10px', borderRight: 'none', borderBottom: 'none' }} />
          <div className="hud-corner top-right" style={{ position: 'absolute', width: '20px', height: '20px', border: '2px solid #00f0ff', borderRadius: '4px', opacity: 0.6, boxShadow: '0 0 10px #00f0ff', top: '10px', right: '10px', borderLeft: 'none', borderBottom: 'none' }} />
          <div className="hud-corner bottom-left" style={{ position: 'absolute', width: '20px', height: '20px', border: '2px solid #00f0ff', borderRadius: '4px', opacity: 0.6, boxShadow: '0 0 10px #00f0ff', bottom: '10px', left: '10px', borderRight: 'none', borderTop: 'none' }} />
          <div className="hud-corner bottom-right" style={{ position: 'absolute', width: '20px', height: '20px', border: '2px solid #00f0ff', borderRadius: '4px', opacity: 0.6, boxShadow: '0 0 10px #00f0ff', bottom: '10px', right: '10px', borderLeft: 'none', borderTop: 'none' }} />
        </div>

        {/* CENTER SUBSCRIBE AREA */}
        <div
          className="subscribe-zone"
          id="sub-zone"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '240px',
            height: '240px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: `translate(-50%, calc(-50% + ${subZoneY}px))`,
          }}
        >
          <div
            className="sub-ring ring-outer"
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: '1px solid transparent',
              width: '220px',
              height: '220px',
              borderTop: '2px solid #00f0ff',
              borderBottom: '2px solid #ffffff',
              boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)',
              transform: `rotate(${outerRingAngle}deg)`,
            }}
          />
          <div
            className="sub-ring ring-middle"
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: '1px dashed rgba(255, 255, 255, 0.4)',
              width: '190px',
              height: '190px',
              transform: `rotate(${middleRingAngle}deg)`,
            }}
          />
          <div
            className="sub-ring ring-inner"
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: '1px solid transparent',
              width: '160px',
              height: '160px',
              borderLeft: '2px solid rgba(0, 200, 255, 0.8)',
              borderRight: '2px solid rgba(0, 200, 255, 0.8)',
              transform: `rotate(${innerRingAngle}deg)`,
            }}
          />
          <div
            className="sub-center"
            style={{
              width: '140px',
              height: '140px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0, 150, 255, 0.05) 60%, transparent 100%)',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              transform: `scale(${pulseScale})`,
              boxShadow: `0 0 ${glowRadius}px rgba(0, 240, 255, 0.4), inset 0 0 ${innerGlowRadius}px rgba(255, 255, 255, 0.2)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LuxuryFuturisticEndscreen;
// END_OF_FILE