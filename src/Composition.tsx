import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const CYCLE_DURATION = 15;

const particleCount = 2000;
const particlePositionsStatic = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i += 3) {
  particlePositionsStatic[i] = (Math.random() - 0.5) * 200;
  particlePositionsStatic[i + 1] = (Math.random() - 0.5) * 100;
  particlePositionsStatic[i + 2] = (Math.random() - 0.5) * 200;
}

const CyberpunkEsportsEndscreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
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
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.scale.setScalar(1 + i * 0.5);
      ring.position.z = -50 - i * 20;
      ringsGroup.add(ring);
    }
    scene.add(ringsGroup);
    ringsGroupRef.current = ringsGroup;

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositionsStatic.slice(), 3));
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
    const renderer = rendererRef.current;
    const gridHelper = gridHelperRef.current;
    const gridHelperMagenta = gridHelperMagentaRef.current;
    const ringsGroup = ringsGroupRef.current;
    const particles = particlesRef.current;
    const pointLightCyan = pointLightCyanRef.current;
    const pointLightMagenta = pointLightMagentaRef.current;

    if (!scene || !camera || !renderer || !gridHelper || !gridHelperMagenta || !ringsGroup || !particles || !pointLightCyan || !pointLightMagenta) return;

    const elapsedTime = frame / fps;
    const loopTime = elapsedTime % CYCLE_DURATION;

    camera.position.x = Math.sin(loopTime * 0.3) * 10;
    camera.position.y = 15 + Math.cos(loopTime * 0.4) * 5;
    camera.lookAt(0, 0, 0);

    gridHelper.position.z = (loopTime * 15) % 6;
    gridHelperMagenta.position.z = (loopTime * 15) % 30;

    ringsGroup.rotation.z = (loopTime * 0.1 * 60) % (2 * Math.PI);
    ringsGroup.rotation.y = (loopTime * 0.05 * 60) % (2 * Math.PI);
    ringsGroup.children.forEach((ring, index) => {
      const meshRing = ring as THREE.Mesh;
      meshRing.rotation.x = ((loopTime * 0.2 * 60 * (index % 2 === 0 ? 1 : -1)) % (2 * Math.PI));
    });

    const positions = particles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const originalZ = particlePositionsStatic[idx + 2];
      const delta = loopTime / CYCLE_DURATION;
      positions[idx + 2] = originalZ + (20 * loopTime);
      if (positions[idx + 2] > 80) {
        const cycles = Math.floor((positions[idx + 2] - 80) / 230);
        positions[idx + 2] = originalZ + (20 * loopTime) - (cycles + 1) * 230;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;

    pointLightCyan.intensity = 5 + Math.sin(loopTime * 3) * 2;
    pointLightMagenta.intensity = 5 + Math.cos(loopTime * 2.5) * 2;

    renderer.render(scene, camera);
  }, [frame, fps]);

  const localFrame = frame % (fps * CYCLE_DURATION);

  const scanlineTranslateY = interpolate(
    localFrame,
    [0, fps * 4, fps * CYCLE_DURATION],
    [0, 500, 500],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const ringOuterRotation = interpolate(
    localFrame,
    [0, fps * 8, fps * CYCLE_DURATION],
    [0, 360, 360 * (CYCLE_DURATION / 8)],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const ringInnerRotation = interpolate(
    localFrame,
    [0, fps * 12, fps * CYCLE_DURATION],
    [0, -360, -360 * (CYCLE_DURATION / 12)],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const coreGlowProgress = (localFrame % (fps * 2)) / (fps * 2);
  const coreGlowScale = interpolate(
    coreGlowProgress,
    [0, 0.5, 1],
    [0.9, 1.1, 0.9],
    { easing: Easing.inOut(Easing.ease) }
  );
  const coreGlowOpacity = interpolate(
    coreGlowProgress,
    [0, 0.5, 1],
    [0.8, 1, 0.8],
    { easing: Easing.inOut(Easing.ease) }
  );
  const coreGlowBrightness = interpolate(
    coreGlowProgress,
    [0, 0.5, 1],
    [1, 1.5, 1],
    { easing: Easing.inOut(Easing.ease) }
  );

  const coreTargetProgress = (localFrame % fps) / fps;
  const coreTargetScale = interpolate(
    coreTargetProgress,
    [0, 1],
    [0, 3],
    { easing: Easing.out(Easing.ease) }
  );
  const coreTargetOpacity = interpolate(
    coreTargetProgress,
    [0, 1],
    [1, 0],
    { easing: Easing.out(Easing.ease) }
  );

  const streak1Duration = fps * 1.5;
  const streak1LocalFrame = localFrame % (streak1Duration + fps * 0);
  const streak1X = interpolate(
    streak1LocalFrame,
    [0, streak1Duration],
    [0, ORIGINAL_WIDTH + 1000],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const streak1Opacity = interpolate(
    streak1LocalFrame,
    [0, streak1Duration * 0.1, streak1Duration * 0.9, streak1Duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const streak2Duration = fps * 2.0;
  const streak2LocalFrame = (localFrame - fps * 1.2 + fps * CYCLE_DURATION) % (streak2Duration + fps * 1.2);
  const streak2X = interpolate(
    streak2LocalFrame,
    [0, streak2Duration],
    [0, ORIGINAL_WIDTH + 1000],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const streak2Opacity = interpolate(
    streak2LocalFrame,
    [0, streak2Duration * 0.1, streak2Duration * 0.9, streak2Duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const streak3Duration = fps * 1.2;
  const streak3LocalFrame = (localFrame - fps * 0.5 + fps * CYCLE_DURATION) % (streak3Duration + fps * 0.5);
  const streak3X = interpolate(
    streak3LocalFrame,
    [0, streak3Duration],
    [0, ORIGINAL_WIDTH + 1000],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const streak3Opacity = interpolate(
    streak3LocalFrame,
    [0, streak3Duration * 0.1, streak3Duration * 0.9, streak3Duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const placeholderGlowCycle = (localFrame % 60) / 60;
  const placeholderGlowIntensity = interpolate(
    placeholderGlowCycle,
    [0, 0.5, 1],
    [0.4, 0.8, 0.4],
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
        background: 'radial-gradient(circle at center, #020412 0%, #000000 100%)',
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
          zIndex: 1,
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
          pointerEvents: 'none',
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
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -4, left: -4, width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', top: -4, right: -4, width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', bottom: -4, left: -4, width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, borderLeft: 'none', borderTop: 'none' }} />
          <div
            style={{
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
              top: -100,
              zIndex: 1,
              transform: `translateY(${scanlineTranslateY}px)`,
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
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -4, left: -4, width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', top: -4, right: -4, width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ position: 'absolute', bottom: -4, left: -4, width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 40, height: 40, border: '4px solid #fff', boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff', zIndex: 2, borderLeft: 'none', borderTop: 'none' }} />
          <div
            style={{
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
              top: -100,
              zIndex: 1,
              transform: `translateY(${scanlineTranslateY}px)`,
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
            transform: `translateX(${streak1X}px)`,
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
            transform: `translateX(${streak2X}px)`,
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
            transform: `translateX(${streak3X}px)`,
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
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default CyberpunkEsportsEndscreen;
// END_OF_FILE