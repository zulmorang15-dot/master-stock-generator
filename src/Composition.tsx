import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLE_COUNT = 2000;
const PARTICLE_POSITIONS = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
  PARTICLE_POSITIONS[i] = (Math.random() - 0.5) * 200;
  PARTICLE_POSITIONS[i + 1] = (Math.random() - 0.5) * 100;
  PARTICLE_POSITIONS[i + 2] = (Math.random() - 0.5) * 200;
}

const RING_ROTATIONS = Array.from({ length: 5 }, () => ({
  x: Math.random() * Math.PI,
  y: Math.random() * Math.PI,
}));

const STREAK_DATA = [
  { id: 'streak-1', top: 250, width: 600, speed: 1.5, delay: 0, isMagenta: false },
  { id: 'streak-2', top: 850, width: 800, speed: 2.0, delay: 1.2, isMagenta: true },
  { id: 'streak-3', top: 450, width: 500, speed: 1.2, delay: 0.5, isMagenta: false },
];

const CyberpunkEsportsYoutubeEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const gridHelperMagentaRef = useRef<THREE.GridHelper | null>(null);
  const ringsGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const pointLightCyanRef = useRef<THREE.PointLight | null>(null);
  const pointLightMagentaRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x01020a, 0.004);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
    camera.position.set(0, 15, 60);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(Math.min(2, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.5;
    rendererRef.current = renderer;

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT), 2.5, 0.6, 0.1);
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    const gridHelper = new THREE.GridHelper(300, 100, 0x00ffff, 0x002244);
    gridHelper.position.y = -20;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.4;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const gridHelperMagenta = new THREE.GridHelper(300, 30, 0xff00ff, 0x330033);
    gridHelperMagenta.position.y = -20.1;
    gridHelperMagenta.material.transparent = true;
    gridHelperMagenta.material.opacity = 0.2;
    scene.add(gridHelperMagenta);
    gridHelperMagentaRef.current = gridHelperMagenta;

    const ringsGroup = new THREE.Group();
    const ringGeom = new THREE.TorusGeometry(40, 0.5, 16, 100);
    const matCyan = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const matMagenta = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(ringGeom, i % 2 === 0 ? matCyan : matMagenta);
      ring.rotation.x = RING_ROTATIONS[i].x;
      ring.rotation.y = RING_ROTATIONS[i].y;
      ring.scale.setScalar(1 + i * 0.5);
      ring.position.z = -50 - i * 20;
      ringsGroup.add(ring);
    }
    scene.add(ringsGroup);
    ringsGroupRef.current = ringsGroup;

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(PARTICLE_POSITIONS.slice(), 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    const ambientLight = new THREE.AmbientLight(0x010210);
    scene.add(ambientLight);

    const pointLightCyan = new THREE.PointLight(0x00ffff, 5, 200);
    pointLightCyan.position.set(-50, 20, 0);
    scene.add(pointLightCyan);
    pointLightCyanRef.current = pointLightCyan;

    const pointLightMagenta = new THREE.PointLight(0xff00ff, 5, 200);
    pointLightMagenta.position.set(50, -20, -20);
    scene.add(pointLightMagenta);
    pointLightMagentaRef.current = pointLightMagenta;

    return () => {
      renderer.dispose();
      ringGeom.dispose();
      matCyan.dispose();
      matMagenta.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const composer = composerRef.current;
    const gridHelper = gridHelperRef.current;
    const gridHelperMagenta = gridHelperMagentaRef.current;
    const ringsGroup = ringsGroupRef.current;
    const particles = particlesRef.current;
    const pointLightCyan = pointLightCyanRef.current;
    const pointLightMagenta = pointLightMagentaRef.current;

    if (!scene || !camera || !composer || !gridHelper || !gridHelperMagenta || !ringsGroup || !particles || !pointLightCyan || !pointLightMagenta) return;

    const elapsedTime = frame / fps;
    const cycleDuration = 10;
    const localTime = (frame % (fps * cycleDuration)) / fps;

    camera.position.x = Math.sin(localTime * 0.3) * 10;
    camera.position.y = 15 + Math.cos(localTime * 0.4) * 5;
    camera.lookAt(0, 0, 0);

    gridHelper.position.z = (localTime * 15) % 6;
    gridHelperMagenta.position.z = (localTime * 15) % 30;

    const delta = 1 / fps;
    ringsGroup.rotation.z = (localTime * 0.1);
    ringsGroup.rotation.y = (localTime * 0.05);
    ringsGroup.children.forEach((ring, index) => {
      const baseRotation = RING_ROTATIONS[index].x;
      ring.rotation.x = baseRotation + localTime * 0.2 * (index % 2 === 0 ? 1 : -1);
    });

    const positions = particles.geometry.attributes.position.array as Float32Array;
    for (let i = 2; i < PARTICLE_COUNT * 3; i += 3) {
      const initialZ = PARTICLE_POSITIONS[i];
      const movedZ = initialZ + localTime * 20;
      const range = 230;
      positions[i] = ((movedZ + 150) % range) - 150;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    pointLightCyan.intensity = 5 + Math.sin(localTime * 3) * 2;
    pointLightMagenta.intensity = 5 + Math.cos(localTime * 2.5) * 2;

    composer.render();
  }, [frame, fps]);

  const scanlineProgress = interpolate(frame % (fps * 4), [0, fps * 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scanlineY = interpolate(scanlineProgress, [0, 1], [-100, 500]);

  const placeholderGlitchIntensity = interpolate(
    Math.sin((frame / fps) * Math.PI * 6),
    [-1, 1],
    [0.4, 0.8]
  );

  const ringOuterRotation = interpolate(frame, [0, fps * 8], [0, 360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringInnerRotation = interpolate(frame, [0, fps * 12], [0, -360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const coreGlowProgress = (frame % (fps * 2)) / (fps * 2);
  const coreGlowScale = interpolate(coreGlowProgress, [0, 0.5, 1], [0.9, 1.1, 0.9], {
    easing: Easing.inOut(Easing.ease),
  });
  const coreGlowOpacity = interpolate(coreGlowProgress, [0, 0.5, 1], [0.8, 1, 0.8], {
    easing: Easing.inOut(Easing.ease),
  });
  const coreGlowBrightness = interpolate(coreGlowProgress, [0, 0.5, 1], [1, 1.5, 1], {
    easing: Easing.inOut(Easing.ease),
  });

  const coreTargetProgress = (frame % fps) / fps;
  const coreTargetScale = interpolate(coreTargetProgress, [0, 1], [0, 3]);
  const coreTargetOpacity = interpolate(coreTargetProgress, [0, 1], [1, 0]);

  const renderStreak = (data: typeof STREAK_DATA[0]) => {
    const cycleDuration = 10;
    const adjustedFrame = (frame - data.delay * fps + fps * cycleDuration) % (fps * cycleDuration);
    const progress = adjustedFrame / (fps * data.speed);
    const normalizedProgress = progress % 1;

    const xPos = interpolate(normalizedProgress, [0, 1], [0, ORIGINAL_WIDTH + 1000], {
      easing: Easing.inOut(Easing.quad),
    });
    const opacity = interpolate(normalizedProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    const yOffset = Math.sin((frame / fps) * Math.PI * 2) * 100;

    return (
      <div
        key={data.id}
        style={{
          position: 'absolute',
          height: 2,
          width: data.width,
          background: data.isMagenta
            ? 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)'
            : 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
          boxShadow: data.isMagenta
            ? '0 0 20px #ff00ff, 0 0 40px #ff00ff'
            : '0 0 20px #00ffff, 0 0 40px #00ffff',
          borderRadius: '50%',
          top: data.top + yOffset,
          left: -500,
          zIndex: 5,
          opacity: opacity,
          mixBlendMode: 'screen',
          transform: `translateX(${xPos}px)`,
        }}
      />
    );
  };

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
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />
      
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 338,
            top: 371,
            left: 100,
            background: 'rgba(1, 4, 15, 0.7)',
            border: '3px solid #00ffff',
            boxShadow: `0 0 ${40 + 30 * placeholderGlitchIntensity}px rgba(0, 255, 255, ${placeholderGlitchIntensity}), inset 0 0 ${50 + 30 * placeholderGlitchIntensity}px rgba(0, 255, 255, 0.2)`,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', width: 40, height: 40, top: -4, left: -4, border: '4px solid #fff', borderRight: 'none', borderBottom: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', width: 40, height: 40, top: -4, right: -4, border: '4px solid #fff', borderLeft: 'none', borderBottom: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', width: 40, height: 40, bottom: -4, left: -4, border: '4px solid #fff', borderRight: 'none', borderTop: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', width: 40, height: 40, bottom: -4, right: -4, border: '4px solid #fff', borderLeft: 'none', borderTop: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)',
              top: scanlineY,
              zIndex: 1,
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 338,
            top: 371,
            right: 100,
            background: 'rgba(1, 4, 15, 0.7)',
            border: '3px solid #00ffff',
            boxShadow: `0 0 ${40 + 30 * placeholderGlitchIntensity}px rgba(0, 255, 255, ${placeholderGlitchIntensity}), inset 0 0 ${50 + 30 * placeholderGlitchIntensity}px rgba(0, 255, 255, 0.2)`,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', width: 40, height: 40, top: -4, left: -4, border: '4px solid #fff', borderRight: 'none', borderBottom: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', width: 40, height: 40, top: -4, right: -4, border: '4px solid #fff', borderLeft: 'none', borderBottom: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', width: 40, height: 40, bottom: -4, left: -4, border: '4px solid #fff', borderRight: 'none', borderTop: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', width: 40, height: 40, bottom: -4, right: -4, border: '4px solid #fff', borderLeft: 'none', borderTop: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)',
              top: scanlineY,
              zIndex: 1,
            }}
          />
        </div>

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
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '4px solid transparent',
              borderTop: '4px solid #00ffff',
              borderBottom: '4px solid #00ffff',
              boxShadow: '0 0 30px #00ffff, inset 0 0 20px #00ffff',
              transform: `rotate(${ringOuterRotation}deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              border: '4px dashed #ff00ff',
              boxShadow: '0 0 40px #ff00ff, inset 0 0 20px #ff00ff',
              transform: `rotate(${ringInnerRotation}deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '45%',
              height: '45%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, #ffffff 0%, #00ffff 40%, transparent 70%)',
              boxShadow: '0 0 80px #00ffff, 0 0 120px #00ffff',
              transform: `scale(${coreGlowScale})`,
              opacity: coreGlowOpacity,
              filter: `brightness(${coreGlowBrightness})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '25%',
              height: '25%',
              borderRadius: '50%',
              border: '6px solid #fff',
              boxShadow: '0 0 20px #fff',
              transform: `scale(${coreTargetScale})`,
              opacity: coreTargetOpacity,
            }}
          />
        </div>

        {STREAK_DATA.map((data) => renderStreak(data))}
      </div>

      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          boxShadow: 'inset 0 0 250px rgba(0, 0, 0, 0.9)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default CyberpunkEsportsYoutubeEndscreen;
// END_OF_FILE