import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CyberpunkEsportsEndscreen: React.FC = () => {
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
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x01020a, 0.004);

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
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT),
      2.5,
      0.6,
      0.1
    );

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
      ring.rotation.x = (i * 0.3) % Math.PI;
      ring.rotation.y = (i * 0.5) % Math.PI;
      ring.scale.setScalar(1 + (i * 0.5));
      ring.position.z = -50 - (i * 20);
      ringsGroup.add(ring);
    }
    scene.add(ringsGroup);
    ringsGroupRef.current = ringsGroup;

    const particleCount = 2000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = ((i / 3) * 0.12345 % 1 - 0.5) * 200;
      particlePositions[i + 1] = ((i / 3) * 0.67890 % 1 - 0.5) * 100;
      particlePositions[i + 2] = ((i / 3) * 0.54321 % 1 - 0.5) * 200;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
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
    if (!sceneRef.current || !cameraRef.current || !composerRef.current) return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const composer = composerRef.current;
    const gridHelper = gridHelperRef.current;
    const gridHelperMagenta = gridHelperMagentaRef.current;
    const ringsGroup = ringsGroupRef.current;
    const particles = particlesRef.current;
    const pointLightCyan = pointLightCyanRef.current;
    const pointLightMagenta = pointLightMagentaRef.current;

    const elapsedTime = frame / fps;

    camera.position.x = Math.sin(elapsedTime * 0.3) * 10;
    camera.position.y = 15 + Math.cos(elapsedTime * 0.4) * 5;
    camera.lookAt(0, 0, 0);

    if (gridHelper) {
      gridHelper.position.z = (elapsedTime * 15) % 6;
    }
    if (gridHelperMagenta) {
      gridHelperMagenta.position.z = (elapsedTime * 15) % 30;
    }

    if (ringsGroup) {
      ringsGroup.rotation.z = elapsedTime * 0.1 * fps / 60;
      ringsGroup.rotation.y = elapsedTime * 0.05 * fps / 60;

      ringsGroup.children.forEach((ring, index) => {
        const mesh = ring as THREE.Mesh;
        mesh.rotation.x = (elapsedTime * 0.2 * (index % 2 === 0 ? 1 : -1) * fps / 60);
      });
    }

    if (particles) {
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const delta = 1 / fps;
      for (let i = 2; i < 2000 * 3; i += 3) {
        positions[i] += 20 * delta;
        if (positions[i] > 80) {
          positions[i] = -150;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }

    if (pointLightCyan) {
      pointLightCyan.intensity = 5 + Math.sin(elapsedTime * 3) * 2;
    }
    if (pointLightMagenta) {
      pointLightMagenta.intensity = 5 + Math.cos(elapsedTime * 2.5) * 2;
    }

    composer.render();
  }, [frame, fps]);

  const localFrame = frame % (fps * 15);

  const scanlineProgress1 = interpolate(
    localFrame,
    [0, fps * 4, fps * 4 + 1],
    [0, 500, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const scanlineProgress2 = interpolate(
    localFrame,
    [fps * 1, fps * 5, fps * 5 + 1],
    [0, 500, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const ringOuterRotation = interpolate(
    localFrame,
    [0, fps * 15],
    [0, 360],
    { extrapolateRight: 'wrap' }
  );

  const ringInnerRotation = interpolate(
    localFrame,
    [0, fps * 15],
    [0, -360],
    { extrapolateRight: 'wrap' }
  );

  const coreGlowScale = interpolate(
    localFrame % (fps * 2),
    [0, fps * 2],
    [0.9, 1.1],
    { easing: Easing.inOut(Easing.ease) }
  );

  const coreGlowOpacity = interpolate(
    localFrame % (fps * 2),
    [0, fps * 2],
    [0.8, 1],
    { easing: Easing.inOut(Easing.ease) }
  );

  const coreGlowBrightness = interpolate(
    localFrame % (fps * 2),
    [0, fps * 2],
    [1, 1.5],
    { easing: Easing.inOut(Easing.ease) }
  );

  const coreTargetAnimFrame = localFrame % fps;
  const coreTargetScale = interpolate(
    coreTargetAnimFrame,
    [0, fps],
    [0, 3],
    { easing: Easing.out(Easing.ease) }
  );
  const coreTargetOpacity = interpolate(
    coreTargetAnimFrame,
    [0, fps],
    [1, 0],
    { easing: Easing.out(Easing.ease) }
  );

  const streak1Progress = interpolate(
    localFrame % (fps * 1.5),
    [0, fps * 1.5],
    [0, ORIGINAL_WIDTH + 1000],
    { easing: Easing.inOut(Easing.quad) }
  );
  const streak1Opacity = interpolate(
    localFrame % (fps * 1.5),
    [0, fps * 0.2, fps * 1.3, fps * 1.5],
    [0, 1, 1, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  const streak2Progress = interpolate(
    (localFrame - fps * 1.2 + fps * 15) % (fps * 15) % (fps * 2.0),
    [0, fps * 2.0],
    [0, ORIGINAL_WIDTH + 1000],
    { easing: Easing.inOut(Easing.quad) }
  );
  const streak2Opacity = interpolate(
    (localFrame - fps * 1.2 + fps * 15) % (fps * 15) % (fps * 2.0),
    [0, fps * 0.2, fps * 1.8, fps * 2.0],
    [0, 1, 1, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  const streak3Progress = interpolate(
    (localFrame - fps * 0.5 + fps * 15) % (fps * 15) % (fps * 1.2),
    [0, fps * 1.2],
    [0, ORIGINAL_WIDTH + 1000],
    { easing: Easing.inOut(Easing.quad) }
  );
  const streak3Opacity = interpolate(
    (localFrame - fps * 0.5 + fps * 15) % (fps * 15) % (fps * 1.2),
    [0, fps * 0.15, fps * 1.05, fps * 1.2],
    [0, 1, 1, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  const placeholderGlowCycle = localFrame % (fps * 2 + Math.floor(fps * 1));
  const placeholderGlowIntensity = interpolate(
    placeholderGlowCycle % (fps * 0.1),
    [0, fps * 0.1],
    [0.4, 0.8],
    { easing: Easing.inOut(Easing.ease) }
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
        background: 'radial-gradient(circle at center, #020412 0%, #000000 100%)'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 338,
            top: 371,
            left: 100,
            background: 'rgba(1, 4, 15, 0.7)',
            border: '3px solid #00ffff',
            boxShadow: `0 0 ${40 + placeholderGlowIntensity * 30}px rgba(0, 255, 255, ${placeholderGlowIntensity}), inset 0 0 ${50 + placeholderGlowIntensity * 30}px rgba(0, 255, 255, ${placeholderGlowIntensity * 0.5})`,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: -4, left: -4, width: 40, height: 40, border: '4px solid #fff', borderRight: 'none', borderBottom: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', top: -4, right: -4, width: 40, height: 40, border: '4px solid #fff', borderLeft: 'none', borderBottom: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', bottom: -4, left: -4, width: 40, height: 40, border: '4px solid #fff', borderRight: 'none', borderTop: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 40, height: 40, border: '4px solid #fff', borderLeft: 'none', borderTop: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              zIndex: 0
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)',
              top: -100,
              zIndex: 1,
              transform: `translateY(${scanlineProgress1}px)`
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
            boxShadow: `0 0 ${40 + placeholderGlowIntensity * 30}px rgba(0, 255, 255, ${placeholderGlowIntensity}), inset 0 0 ${50 + placeholderGlowIntensity * 30}px rgba(0, 255, 255, ${placeholderGlowIntensity * 0.5})`,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'absolute', top: -4, left: -4, width: 40, height: 40, border: '4px solid #fff', borderRight: 'none', borderBottom: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', top: -4, right: -4, width: 40, height: 40, border: '4px solid #fff', borderLeft: 'none', borderBottom: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', bottom: -4, left: -4, width: 40, height: 40, border: '4px solid #fff', borderRight: 'none', borderTop: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 40, height: 40, border: '4px solid #fff', borderLeft: 'none', borderTop: 'none', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2 }} />
          
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              zIndex: 0
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: 100,
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)',
              top: -100,
              zIndex: 1,
              transform: `translateY(${scanlineProgress2}px)`
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
            borderRadius: '50%'
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
              transform: `rotate(${ringOuterRotation}deg)`
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
              transform: `rotate(${ringInnerRotation}deg)`
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
              filter: `brightness(${coreGlowBrightness})`
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
              opacity: coreTargetOpacity
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            height: 2,
            width: 600,
            background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
            borderRadius: '50%',
            top: 250,
            left: -500,
            zIndex: 5,
            opacity: streak1Opacity,
            mixBlendMode: 'screen',
            transform: `translateX(${streak1Progress}px)`
          }}
        />

        <div
          style={{
            position: 'absolute',
            height: 2,
            width: 800,
            background: 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)',
            boxShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff',
            borderRadius: '50%',
            top: 850,
            left: -500,
            zIndex: 5,
            opacity: streak2Opacity,
            mixBlendMode: 'screen',
            transform: `translateX(${streak2Progress}px)`
          }}
        />

        <div
          style={{
            position: 'absolute',
            height: 2,
            width: 500,
            background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
            borderRadius: '50%',
            top: 450,
            left: -500,
            zIndex: 5,
            opacity: streak3Opacity,
            mixBlendMode: 'screen',
            transform: `translateX(${streak3Progress}px)`
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          boxShadow: 'inset 0 0 250px rgba(0, 0, 0, 0.9)',
          zIndex: 20,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default CyberpunkEsportsEndscreen;
// END_OF_FILE