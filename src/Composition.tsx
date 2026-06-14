import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

// Static deterministic pre-calculations for performance and frame-lock reliability
const PILLAR_COORDS = [
  { x: -35, z: -15 }, { x: 35, z: -15 },
  { x: -50, z: 0 }, { x: 50, z: 0 },
  { x: -25, z: -40 }, { x: 25, z: -40 }
];

const FOG_PARTICLES = Array.from({ length: 60 }, (_, i) => {
  const angle = (i / 60) * Math.PI * 2;
  const radius = 20 + (i % 5) * 8;
  return {
    x: Math.cos(angle) * radius + (i % 3 - 1) * 5,
    y: (i % 4) * 6 - 5,
    z: Math.sin(angle) * radius - 15,
  };
});

const STREAK_POSITIONS = Array.from({ length: 8 }, (_, i) => ({
  x: ((i - 3.5) / 4) * 25,
  y: 5 + (i % 3) * 4,
  z: -30
}));

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const FuturisticMechArenaEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const containerRef = useRef<HTMLDivElement>(null);

  // WebGL References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const centralRingsRef = useRef<THREE.Group | null>(null);
  const lightBeamsRef = useRef<{ mesh: THREE.Mesh; initialRot: number; speed: number }[]>([]);
  const fogRef = useRef<THREE.Points | null>(null);
  const pillarsRef = useRef<{ obj: THREE.Group; factor: number }[]>([]);

  // 1. Initialize WebGL Environment once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02050a);
    scene.fog = new THREE.FogExp2(0x030d1a, 0.015);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
    camera.position.set(0, 5, 38);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1526, 1.5);
    scene.add(ambientLight);

    // Powerhouse Point Light Core
    const corePointLight = new THREE.PointLight(0x00f0ff, 6, 60);
    corePointLight.position.set(0, 0, 2);
    scene.add(corePointLight);

    // Arena Spotlight Systems
    const beams: { mesh: THREE.Mesh; initialRot: number; speed: number }[] = [];
    const createArenaSpotlight = (x: number, y: number, z: number, colorCode: number, speedVal: number) => {
      const spotLight = new THREE.SpotLight(colorCode, 8);
      spotLight.position.set(x, y, z);
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.6;
      spotLight.decay = 1.5;
      spotLight.distance = 120;
      spotLight.castShadow = true;
      scene.add(spotLight);

      const beamGeo = new THREE.ConeGeometry(6, 60, 32, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: colorCode,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(x, y / 2, z);
      beamMesh.rotation.x = Math.PI / 1.8;
      scene.add(beamMesh);
      beams.push({ mesh: beamMesh, initialRot: beamMesh.rotation.z, speed: speedVal });
    };

    createArenaSpotlight(-25, 30, -20, 0x00f0ff, 1.0);
    createArenaSpotlight(25, 30, -20, 0x006eff, 1.2);
    lightBeamsRef.current = beams;

    // Laser Grid Setup
    const gridHelper = new THREE.GridHelper(160, 50, 0x00f0ff, 0x002b47);
    gridHelper.position.y = -8;
    const gridMat = gridHelper.material as THREE.Material;
    gridMat.opacity = 0.4;
    gridMat.transparent = true;
    scene.add(gridHelper);

    // Underlying Floor Plane
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x01050d,
      roughness: 0.1,
      metalness: 0.9
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Cybernetic Pillars / Scaffolding
    const pillars: { obj: THREE.Group; factor: number }[] = [];
    const pillarGeo = new THREE.BoxGeometry(4, 45, 4);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x08101d,
      roughness: 0.4,
      metalness: 0.8,
      bumpScale: 0.1
    });
    const neonMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7
    });

    PILLAR_COORDS.forEach((pos, index) => {
      const group = new THREE.Group();
      
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);

      const neonStripGeo = new THREE.BoxGeometry(0.3, 40, 0.4);
      const neonStrip = new THREE.Mesh(neonStripGeo, neonMat);
      neonStrip.position.set(0, 0, 2.05);
      group.add(neonStrip);

      const ringGeo = new THREE.CylinderGeometry(3, 3, 1, 6, 1, true);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x112233, metalness: 0.9, roughness: 0.2 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = (index % 2 === 0) ? 5 : -10;
      group.add(ring);

      group.position.set(pos.x, 10, pos.z);
      scene.add(group);
      pillars.push({ obj: group, factor: index });
    });
    pillarsRef.current = pillars;

    // Central Ring Systems
    const centralRingSystem = new THREE.Group();
    centralRingSystem.position.set(0, 0, -2);
    scene.add(centralRingSystem);
    centralRingsRef.current = centralRingSystem;

    const ringSettings = [
      { rInner: 7, rOuter: 7.6, depth: 1.2, color: 0x0d1b2a, isNeon: false },
      { rInner: 6.2, rOuter: 6.5, depth: 2.0, color: 0x00f0ff, isNeon: true },
      { rInner: 5.0, rOuter: 5.6, depth: 0.6, color: 0x0a1424, isNeon: false },
      { rInner: 4.4, rOuter: 4.6, depth: 1.5, color: 0x006eff, isNeon: true }
    ];

    ringSettings.forEach(set => {
      let mat;
      if (set.isNeon) {
        mat = new THREE.MeshBasicMaterial({
          color: set.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color: set.color,
          metalness: 0.9,
          roughness: 0.2,
          side: THREE.DoubleSide
        });
      }

      const ringGeo = new THREE.CylinderGeometry(set.rOuter, set.rInner, set.depth, 32, 1, true);
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.rotation.x = Math.PI / 2;
      
      const ringContainer = new THREE.Group();
      ringContainer.add(mesh);
      centralRingSystem.add(ringContainer);
    });

    // Volumetric Fog Layers
    const fogGeo = new THREE.BufferGeometry();
    const fogPositions = new Float32Array(60 * 3);
    FOG_PARTICLES.forEach((pt, i) => {
      fogPositions[i * 3] = pt.x;
      fogPositions[i * 3 + 1] = pt.y;
      fogPositions[i * 3 + 2] = pt.z;
    });
    fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPositions, 3));

    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = 64; smokeCanvas.height = 64;
    const smokeCtx = smokeCanvas.getContext('2d');
    if (smokeCtx) {
      const grad = smokeCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      smokeCtx.fillStyle = grad;
      smokeCtx.fillRect(0, 0, 64, 64);
    }
    const smokeTexture = new THREE.CanvasTexture(smokeCanvas);
    const fogMat = new THREE.PointsMaterial({
      size: 24,
      map: smokeTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });
    const volumetricFog = new THREE.Points(fogGeo, fogMat);
    scene.add(volumetricFog);
    fogRef.current = volumetricFog;

    // Anamorphic Light Streaks
    const streakGeo = new THREE.BufferGeometry();
    const streakPositions = new Float32Array(8 * 3);
    STREAK_POSITIONS.forEach((pt, i) => {
      streakPositions[i * 3] = pt.x;
      streakPositions[i * 3 + 1] = pt.y;
      streakPositions[i * 3 + 2] = pt.z;
    });
    streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));

    const streakCanvas = document.createElement('canvas');
    streakCanvas.width = 256; streakCanvas.height = 16;
    const streakCtx = streakCanvas.getContext('2d');
    if (streakCtx) {
      const grad = streakCtx.createRadialGradient(128, 8, 0, 128, 8, 128);
      grad.addColorStop(0, 'rgba(0, 110, 255, 0.6)');
      grad.addColorStop(0.5, 'rgba(0, 240, 255, 0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      streakCtx.fillStyle = grad;
      streakCtx.fillRect(0, 0, 256, 16);
    }
    const streakTexture = new THREE.CanvasTexture(streakCanvas);
    const streakMat = new THREE.PointsMaterial({
      size: 40,
      map: streakTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });
    const streaks = new THREE.Points(streakGeo, streakMat);
    scene.add(streaks);

    // Kickoff render
    renderer.render(scene, camera);

    return () => {
      renderer.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      pillarGeo.dispose();
      pillarMat.dispose();
      neonMat.dispose();
      fogGeo.dispose();
      fogMat.dispose();
      streakGeo.dispose();
      streakMat.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // 2. Dynamic Update loop strictly mapped to current Frame
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const centralRingSystem = centralRingsRef.current;
    if (!scene || !camera || !renderer) return;

    const elapsedTime = frame / fps;
    const TWO_PI = Math.PI * 2;
    const loopDuration = 15; // 15 Seconds seamless loop
    const baseFreq = TWO_PI / loopDuration;

    // Symmetrical Ambient Camera float mechanics
    camera.position.y = 5 + Math.sin(elapsedTime * baseFreq * 1) * 0.4;
    camera.position.x = Math.cos(elapsedTime * baseFreq * 1) * 0.3;
    camera.lookAt(0, 2, 0);

    // Continuous Core Rings Spin Calculations (Loop mathematically absolute)
    if (centralRingSystem) {
      const rotSpeeds = [1, -2, 0.5, -1.5];
      centralRingSystem.children.forEach((child, idx) => {
        const turns = rotSpeeds[idx % rotSpeeds.length];
        child.rotation.z = (elapsedTime / loopDuration) * turns * TWO_PI;
      });

      // Ambient dynamic scale pulsations
      const pulseVal = 1 + Math.sin(elapsedTime * baseFreq * 4) * 0.03;
      centralRingSystem.scale.set(pulseVal, pulseVal, pulseVal);
    }

    // Spotlights Synchronization
    lightBeamsRef.current.forEach((beam, idx) => {
      const sweepCycles = idx === 0 ? 2 : 3;
      beam.mesh.rotation.z = beam.initialRot + Math.sin(elapsedTime * baseFreq * sweepCycles) * 0.4;
    });

    // Volumetric Smoke Drift Drift updates
    const fog = fogRef.current;
    if (fog) {
      const positions = fog.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const driftCycles = 1 + (i % 3);
        positions[i] = FOG_PARTICLES[i / 3].x + Math.sin(elapsedTime * baseFreq * driftCycles) * 1.5;
        positions[i + 1] = FOG_PARTICLES[i / 3].y + Math.cos(elapsedTime * baseFreq * driftCycles) * 1.0;
      }
      fog.geometry.attributes.position.needsUpdate = true;
    }

    // Industrial pillars breathing cycles
    pillarsRef.current.forEach(pillar => {
      pillar.obj.position.y = 10 + Math.sin(elapsedTime * baseFreq * 2 + pillar.factor) * 0.4;
    });

    renderer.render(scene, camera);
  }, [frame, fps]);

  // 3. Cinematic Entrance & Symmetrical Outro Interpolations (0-1.5s intro, 13.5-15s outro)
  const totalFrames = fps * 15;
  const transitionDuration = fps * 1.5;

  const transitionFactor = interpolate(
    frame,
    [0, transitionDuration, totalFrames - transitionDuration, totalFrames],
    [0, 1, 1, 0],
    {
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    }
  );

  const placeholderY = interpolate(transitionFactor, [0, 1], [600, 0]);
  const placeholderOpacity = transitionFactor;
  const cornerScale = interpolate(transitionFactor, [0, 1], [1.8, 1]);
  const cornerOpacity = interpolate(transitionFactor, [0, 1], [0, 0.3]);

  // 4. Constant Loop-Driven CSS Animations (Shine & Rotating Circles)
  const shineProgress = (frame % (fps * 4)) / (fps * 4);
  const shinePos = interpolate(shineProgress, [0, 1], [-100, 100]);

  const hudRot1 = (frame / totalFrames) * 360 * 1;
  const hudRot2 = -(frame / totalFrames) * 360 * 2;
  const hudRot3 = (frame / totalFrames) * 360 * 4;

  const placeholderAmbientFloat = Math.sin((frame / fps) * (Math.PI * 2 / 15) * 2) * 5;

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
        backgroundColor: '#02050a',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Three.js Render Target */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* Cinematic HUD Overlay Canvas */}
      <div
        id="hud-layer"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            background: 'radial-gradient(circle at center, transparent 30%, rgba(2, 5, 10, 0.4) 70%, rgba(0, 0, 0, 0.9) 100%), linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.4) 100%)',
            zIndex: 5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
            backgroundSize: '100% 4px, 6px 100%',
            opacity: 0.25,
            zIndex: 6,
          }}
        />

        {/* Outer Symmetrical Framing elements */}
        <div
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderWidth: 4,
            borderStyle: 'solid',
            borderColor: '#00f0ff',
            top: 40,
            left: 40,
            borderRight: 'none',
            borderBottom: 'none',
            opacity: cornerOpacity,
            transform: `scale(${cornerScale})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderWidth: 4,
            borderStyle: 'solid',
            borderColor: '#00f0ff',
            top: 40,
            right: 40,
            borderLeft: 'none',
            borderBottom: 'none',
            opacity: cornerOpacity,
            transform: `scale(${cornerScale})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderWidth: 4,
            borderStyle: 'solid',
            borderColor: '#00f0ff',
            bottom: 40,
            left: 40,
            borderRight: 'none',
            borderTop: 'none',
            opacity: cornerOpacity,
            transform: `scale(${cornerScale})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderWidth: 4,
            borderStyle: 'solid',
            borderColor: '#00f0ff',
            bottom: 40,
            right: 40,
            borderLeft: 'none',
            borderTop: 'none',
            opacity: cornerOpacity,
            transform: `scale(${cornerScale})`,
          }}
        />

        {/* Left Side Video Slot */}
        <div
          style={{
            position: 'absolute',
            width: 520,
            height: 292,
            backgroundColor: 'rgba(3, 12, 26, 0.4)',
            border: '3px solid rgba(0, 240, 255, 0.4)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.15), inset 0 0 40px rgba(0, 110, 255, 0.2)',
            backdropFilter: 'blur(4px)',
            top: 380,
            left: 160,
            overflow: 'hidden',
            opacity: placeholderOpacity,
            transform: `translateY(${placeholderY + placeholderAmbientFloat}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, transparent 48%, rgba(0, 240, 255, 0.3) 50%, transparent 52%)',
              backgroundSize: '200% 200%',
              backgroundPosition: `${shinePos}% ${shinePos}%`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -15,
              left: -15,
              right: -15,
              bottom: -15,
              border: '1px solid rgba(0, 110, 255, 0.2)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'absolute', width: 20, height: 20, borderWidth: 3, borderStyle: 'solid', borderColor: '#00f0ff', top: -3, left: -3, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 20, height: 20, borderWidth: 3, borderStyle: 'solid', borderColor: '#00f0ff', top: -3, right: -3, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 20, height: 20, borderWidth: 3, borderStyle: 'solid', borderColor: '#00f0ff', bottom: -3, left: -3, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', width: 20, height: 20, borderWidth: 3, borderStyle: 'solid', borderColor: '#00f0ff', bottom: -3, right: -3, borderLeft: 'none', borderTop: 'none' }} />
        </div>

        {/* Right Side Video Slot */}
        <div
          style={{
            position: 'absolute',
            width: 520,
            height: 292,
            backgroundColor: 'rgba(3, 12, 26, 0.4)',
            border: '3px solid rgba(0, 240, 255, 0.4)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.15), inset 0 0 40px rgba(0, 110, 255, 0.2)',
            backdropFilter: 'blur(4px)',
            top: 380,
            right: 160,
            overflow: 'hidden',
            opacity: placeholderOpacity,
            transform: `translateY(${placeholderY + -placeholderAmbientFloat}px)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, transparent 48%, rgba(0, 240, 255, 0.3) 50%, transparent 52%)',
              backgroundSize: '200% 200%',
              backgroundPosition: `${shinePos}% ${shinePos}%`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -15,
              left: -15,
              right: -15,
              bottom: -15,
              border: '1px solid rgba(0, 110, 255, 0.2)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'absolute', width: 20, height: 20, borderWidth: 3, borderStyle: 'solid', borderColor: '#00f0ff', top: -3, left: -3, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 20, height: 20, borderWidth: 3, borderStyle: 'solid', borderColor: '#00f0ff', top: -3, right: -3, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', width: 20, height: 20, borderWidth: 3, borderStyle: 'solid', borderColor: '#00f0ff', bottom: -3, left: -3, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', width: 20, height: 20, borderWidth: 3, borderStyle: 'solid', borderColor: '#00f0ff', bottom: -3, right: -3, borderLeft: 'none', borderTop: 'none' }} />
        </div>

        {/* Central Complex Subscribe Interface */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 240,
            height: 240,
            opacity: placeholderOpacity,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Inner Dashboard Concentric Rings */}
            <div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: '2px dashed rgba(0, 240, 255, 0.6)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
                width: '100%',
                height: '100%',
                borderStyle: 'dotted',
                transform: `rotate(${hudRot1}deg)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: '2px dashed rgba(0, 240, 255, 0.6)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
                width: '85%',
                height: '85%',
                borderColor: '#006eff',
                borderWidth: 1,
                borderStyle: 'dashed',
                transform: `rotate(${hudRot2}deg)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: '2px dashed rgba(0, 240, 255, 0.6)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
                width: '70%',
                height: '70%',
                borderStyle: 'double',
                borderWidth: 4,
                transform: `rotate(${hudRot3}deg)`,
              }}
            />

            {/* Industrial crosshairs */}
            <div
              style={{
                position: 'absolute',
                backgroundColor: 'rgba(0, 240, 255, 0.5)',
                width: 40,
                height: 2,
                top: '50%',
                left: 'calc(50% - 20px)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                backgroundColor: 'rgba(0, 240, 255, 0.5)',
                width: 2,
                height: 40,
                top: 'calc(50% - 20px)',
                left: '50%',
              }}
            />
          </div>
        </div>

        {/* Scenic Bottom Emissive Bar decoration */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #00f0ff, #006eff, #00f0ff, transparent)',
            boxShadow: '0 0 15px #00f0ff',
            opacity: placeholderOpacity,
          }}
        />
      </div>
    </div>
  );
};

export default FuturisticMechArenaEndscreen;
// END_OF_FILE