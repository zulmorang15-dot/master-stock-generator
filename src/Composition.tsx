import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const CYCLE_DURATION = 10;

const particleData = Array.from({ length: 2000 }, () => ({
  x: (Math.random() - 0.5) * 200,
  y: (Math.random() - 0.5) * 100,
  z: (Math.random() - 0.5) * 200,
}));

const ringData = Array.from({ length: 5 }, (_, i) => ({
  rotX: Math.random() * Math.PI,
  rotY: Math.random() * Math.PI,
  scale: 1 + i * 0.5,
  posZ: -50 - i * 20,
  isCyan: i % 2 === 0,
}));

const streakData = [
  { top: 250, width: 600, speed: 1.5, delay: 0, magenta: false },
  { top: 850, width: 800, speed: 2.0, delay: 1.2, magenta: true },
  { top: 450, width: 500, speed: 1.2, delay: 0.5, magenta: false },
];

const CyberpunkEsportsEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);
  const localFrame = frame % (fps * CYCLE_DURATION);
  const elapsedTime = localFrame / fps;

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

    ringData.forEach((data) => {
      const ring = new THREE.Mesh(ringGeom, data.isCyan ? matCyan : matMagenta);
      ring.rotation.x = data.rotX;
      ring.rotation.y = data.rotY;
      ring.scale.setScalar(data.scale);
      ring.position.z = data.posZ;
      ringsGroup.add(ring);
    });
    scene.add(ringsGroup);
    ringsGroupRef.current = ringsGroup;

    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleData.length * 3);
    particleData.forEach((p, i) => {
      particlePositions[i * 3] = p.x;
      particlePositions[i * 3 + 1] = p.y;
      particlePositions[i * 3 + 2] = p.z;
    });
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
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

    camera.position.x = Math.sin(elapsedTime * 0.3) * 10;
    camera.position.y = 15 + Math.cos(elapsedTime * 0.4) * 5;
    camera.lookAt(0, 0, 0);

    gridHelper.position.z = (elapsedTime * 15) % 6;
    gridHelperMagenta.position.z = (elapsedTime * 15) % 30;

    ringsGroup.rotation.z = (elapsedTime * 0.1 * fps) / fps;
    ringsGroup.rotation.y = (elapsedTime * 0.05 * fps) / fps;

    ringsGroup.children.forEach((ring, index) => {
      const dir = index % 2 === 0 ? 1 : -1;
      ring.rotation.x = ringData[index].rotX + elapsedTime * 0.2 * dir;
    });

    const positions = particles.geometry.attributes.position.array as Float32Array;
    particleData.forEach((p, i) => {
      const baseZ = p.z;
      const newZ = baseZ + (elapsedTime * 20) % 230;
      positions[i * 3 + 2] = newZ > 80 ? newZ - 230 : newZ;
    });
    particles.geometry.attributes.position.needsUpdate = true;

    pointLightCyan.intensity = 5 + Math.sin(elapsedTime * 3) * 2;
    pointLightMagenta.intensity = 5 + Math.cos(elapsedTime * 2.5) * 2;

    composer.render();
  }, [localFrame, elapsedTime, fps]);

  const scanlineY = interpolate(
    localFrame,
    [0, fps * 4, fps * CYCLE_DURATION],
    [0, 500, 500],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.linear,
    }
  );

  const ringOuterRotation = interpolate(
    localFrame,
    [0, fps * 8, fps * CYCLE_DURATION],
    [0, 360, 360 + (360 * (CYCLE_DURATION - 8) / 8)],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.linear,
    }
  );

  const ringInnerRotation = interpolate(
    localFrame,
    [0, fps * 12, fps * CYCLE_DURATION],
    [0, -360, -360 - (360 * (CYCLE_DURATION - 12) / 12)],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.linear,
    }
  );

  const coreScale = interpolate(
    localFrame % (fps * 2),
    [0, fps * 2],
    [0.9, 1.1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    }
  );

  const coreOpacity = interpolate(
    localFrame % (fps * 2),
    [0, fps * 2],
    [0.8, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    }
  );

  const coreBrightness = interpolate(
    localFrame % (fps * 2),
    [0, fps * 2],
    [1, 1.5],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    }
  );

  const targetScale = interpolate(
    localFrame % fps,
    [0, fps],
    [0, 3],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.ease),
    }
  );

  const targetOpacity = interpolate(
    localFrame % fps,
    [0, fps],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.ease),
    }
  );

  const placeholderGlowIntensity = interpolate(
    localFrame % (fps * 0.2),
    [0, fps * 0.1, fps * 0.2],
    [0.4, 0.8, 0.4],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    }
  );

  const containerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    background: 'radial-gradient(circle at center, #020412 0%, #000000 100%)',
  };

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  };

  const uiLayerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    pointerEvents: 'none',
  };

  const placeholderBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: 600,
    height: 338,
    top: 371,
    background: 'rgba(1, 4, 15, 0.7)',
    border: '3px solid #00ffff',
    boxShadow: `0 0 ${40 + placeholderGlowIntensity * 30}px rgba(0, 255, 255, ${placeholderGlowIntensity}), inset 0 0 ${50 + placeholderGlowIntensity * 30}px rgba(0, 255, 255, ${placeholderGlowIntensity * 0.5})`,
    backdropFilter: 'blur(8px)',
    overflow: 'hidden',
  };

  const placeholderLeftStyle: React.CSSProperties = {
    ...placeholderBaseStyle,
    left: 100,
  };

  const placeholderRightStyle: React.CSSProperties = {
    ...placeholderBaseStyle,
    right: 100,
  };

  const cornerBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: 40,
    height: 40,
    border: '4px solid #fff',
    boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
    zIndex: 2,
  };

  const cornerTLStyle: React.CSSProperties = {
    ...cornerBaseStyle,
    top: -4,
    left: -4,
    borderRight: 'none',
    borderBottom: 'none',
  };

  const cornerTRStyle: React.CSSProperties = {
    ...cornerBaseStyle,
    top: -4,
    right: -4,
    borderLeft: 'none',
    borderBottom: 'none',
  };

  const cornerBLStyle: React.CSSProperties = {
    ...cornerBaseStyle,
    bottom: -4,
    left: -4,
    borderRight: 'none',
    borderTop: 'none',
  };

  const cornerBRStyle: React.CSSProperties = {
    ...cornerBaseStyle,
    bottom: -4,
    right: -4,
    borderLeft: 'none',
    borderTop: 'none',
  };

  const placeholderBeforeStyle: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    zIndex: 0,
  };

  const scanlineStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: 100,
    background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)',
    top: -100,
    zIndex: 1,
    transform: `translateY(${scanlineY}px)`,
  };

  const subscribePortalStyle: React.CSSProperties = {
    position: 'absolute',
    width: 360,
    height: 360,
    left: 780,
    top: 360,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
  };

  const ringOuterStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '4px solid transparent',
    borderTop: '4px solid #00ffff',
    borderBottom: '4px solid #00ffff',
    boxShadow: '0 0 30px #00ffff, inset 0 0 20px #00ffff',
    transform: `rotate(${ringOuterRotation}deg)`,
  };

  const ringInnerStyle: React.CSSProperties = {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: '50%',
    border: '4px dashed #ff00ff',
    boxShadow: '0 0 40px #ff00ff, inset 0 0 20px #ff00ff',
    transform: `rotate(${ringInnerRotation}deg)`,
  };

  const coreGlowStyle: React.CSSProperties = {
    position: 'absolute',
    width: '45%',
    height: '45%',
    borderRadius: '50%',
    background: 'radial-gradient(circle at center, #ffffff 0%, #00ffff 40%, transparent 70%)',
    boxShadow: '0 0 80px #00ffff, 0 0 120px #00ffff',
    transform: `scale(${coreScale})`,
    opacity: coreOpacity,
    filter: `brightness(${coreBrightness})`,
  };

  const coreTargetStyle: React.CSSProperties = {
    position: 'absolute',
    width: '25%',
    height: '25%',
    borderRadius: '50%',
    border: '6px solid #fff',
    boxShadow: '0 0 20px #fff',
    transform: `scale(${targetScale})`,
    opacity: targetOpacity,
  };

  const vignetteStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    boxShadow: 'inset 0 0 250px rgba(0, 0, 0, 0.9)',
    zIndex: 20,
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <div style={uiLayerStyle}>
        <div style={placeholderLeftStyle}>
          <div style={cornerTLStyle}></div>
          <div style={cornerTRStyle}></div>
          <div style={cornerBLStyle}></div>
          <div style={cornerBRStyle}></div>
          <div style={placeholderBeforeStyle}></div>
          <div style={scanlineStyle}></div>
        </div>
        <div style={placeholderRightStyle}>
          <div style={cornerTLStyle}></div>
          <div style={cornerTRStyle}></div>
          <div style={cornerBLStyle}></div>
          <div style={cornerBRStyle}></div>
          <div style={placeholderBeforeStyle}></div>
          <div style={scanlineStyle}></div>
        </div>
        <div style={subscribePortalStyle}>
          <div style={ringOuterStyle}></div>
          <div style={ringInnerStyle}></div>
          <div style={coreGlowStyle}></div>
          <div style={coreTargetStyle}></div>
        </div>
        {streakData.map((streak, index) => {
          const totalDuration = fps * CYCLE_DURATION;
          const startFrame = fps * streak.delay;
          const animDuration = fps * streak.speed;
          const cycleFrames = startFrame + animDuration;
          const adjustedFrame = (localFrame - startFrame + totalDuration) % totalDuration;

          const streakX = interpolate(
            adjustedFrame,
            [0, animDuration],
            [-streak.width, ORIGINAL_WIDTH + 1000],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.inOut(Easing.quad),
            }
          );

          const streakOpacity = interpolate(
            adjustedFrame,
            [0, animDuration * 0.1, animDuration * 0.9, animDuration],
            [0, 1, 1, 0],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.inOut(Easing.quad),
            }
          );

          const streakStyle: React.CSSProperties = {
            position: 'absolute',
            height: 2,
            width: streak.width,
            background: streak.magenta
              ? 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)'
              : 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
            boxShadow: streak.magenta
              ? '0 0 20px #ff00ff, 0 0 40px #ff00ff'
              : '0 0 20px #00ffff, 0 0 40px #00ffff',
            borderRadius: '50%',
            top: streak.top,
            left: streakX,
            zIndex: 5,
            opacity: streakOpacity,
            mixBlendMode: 'screen',
          };

          return <div key={index} style={streakStyle}></div>;
        })}
      </div>
      <div style={vignetteStyle}></div>
    </div>
  );
};

export default CyberpunkEsportsEndscreen;
// END_OF_FILE