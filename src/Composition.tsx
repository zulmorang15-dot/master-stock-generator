import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const PARTICLE_COUNT = 1600;

// Deterministic pseudo-random sequence to avoid Math.random() inside rendering
const particleData = (() => {
  const data = [];
  let seed = 12345;
  const rnd = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  const TWO_PI = Math.PI * 2;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = 4500 * rnd() - 2250;
    const y = -100 + rnd() * 800;
    const z = 5000 * rnd() - 2500;
    data.push({
      x,
      y,
      z,
      baseY: y,
      phase: rnd() * TWO_PI,
      amp: 40 + rnd() * 90,
    });
  }
  return data;
})();

export const CyberspaceWireframeLiquidWave: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const pointLight2Ref = useRef<THREE.PointLight | null>(null);
  const floorGeometryRef = useRef<THREE.PlaneGeometry | null>(null);
  const basePositionsRef = useRef<number[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const moverGroupRef = useRef<THREE.Group | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    if (!canvasRef.current) return;

    const FLOOR_RES = 80;
    const FLOOR_WIDTH = 3600;
    const FLOOR_DEPTH = 4800;
    const ASPECT = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060f, 0.00050);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, ASPECT, 1, 6000);
    camera.position.set(0, 520, 2650);
    cameraRef.current = camera;

    // 2. Lights
    const hemisphereLight = new THREE.HemisphereLight(0x18324a, 0x0a0a14, 0.6);
    scene.add(hemisphereLight);

    const centerLight = new THREE.SpotLight(0x00e5ff, 1.2);
    centerLight.position.set(0, 1200, 2000);
    centerLight.penumbra = 1;
    centerLight.decay = 2;
    scene.add(centerLight);

    const pointLight = new THREE.PointLight(0x00f0ff, 2.0, 6000);
    pointLight.position.z = 200;
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    const pointLight2 = new THREE.PointLight(0xff2e97, 1.8, 6000);
    pointLight2.position.z = 200;
    scene.add(pointLight2);
    pointLight2Ref.current = pointLight2;

    // 3. Water Surface Grid
    const floorGroup = new THREE.Group();
    const moverGroup = new THREE.Group();
    scene.add(moverGroup);
    moverGroupRef.current = moverGroup;

    const floorGeometry = new THREE.PlaneGeometry(
      FLOOR_WIDTH + 1800,
      FLOOR_DEPTH,
      FLOOR_RES,
      FLOOR_RES
    );
    floorGeometryRef.current = floorGeometry;

    // Save initial coordinates for wave animations
    const basePositions: number[] = [];
    const posAttr = floorGeometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      basePositions.push(posAttr.getX(i), posAttr.getY(i));
    }
    basePositionsRef.current = basePositions;

    const solidMaterial = new THREE.MeshPhongMaterial({
      color: 0x07101f,
      emissive: 0x040a18,
      side: THREE.DoubleSide,
      shininess: 60,
      flatShading: true,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x35f0ff,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });

    const floorMesh = new THREE.Mesh(floorGeometry, solidMaterial);
    const floorMesh2 = new THREE.Mesh(floorGeometry, wireframeMaterial);

    floorMesh2.position.y = 14;
    floorMesh2.position.z = 4;

    floorGroup.add(floorMesh);
    floorGroup.add(floorMesh2);
    scene.add(floorGroup);

    floorMesh.rotation.x = Math.PI / 1.62;
    floorMesh2.rotation.x = Math.PI / 1.62;
    floorGroup.position.y = 120;

    // 4. Floating Particles (deterministic seeded loop)
    const pGeometry = new THREE.BufferGeometry();
    const pVertices: number[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pVertices.push(particleData[i].x, particleData[i].y, particleData[i].z);
    }
    pGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pVertices, 3));

    const pMaterial = new THREE.PointsMaterial({
      color: 0x9fe8ff,
      size: 7,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(pGeometry, pMaterial);
    moverGroup.add(particles);
    particlesRef.current = particles;

    // 5. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(2);
    renderer.setClearColor(0x05060f, 1);
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      floorGeometry.dispose();
      solidMaterial.dispose();
      wireframeMaterial.dispose();
      pGeometry.dispose();
      pMaterial.dispose();
    };
  }, []);

  // Frame-locked deterministic renderer effect
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const pointLight = pointLightRef.current;
    const pointLight2 = pointLight2Ref.current;
    const floorGeometry = floorGeometryRef.current;
    const particles = particlesRef.current;
    const moverGroup = moverGroupRef.current;

    if (
      !scene ||
      !camera ||
      !renderer ||
      !pointLight ||
      !pointLight2 ||
      !floorGeometry ||
      !particles ||
      !moverGroup
    ) {
      return;
    }

    const LOOP_DURATION = 15.0; // 15s seamless loop window
    const TWO_PI = Math.PI * 2;
    const OMEGA = TWO_PI / LOOP_DURATION;

    const t = (frame / fps) % LOOP_DURATION;
    const phase = OMEGA * t;

    // Moving neon orbital lights
    pointLight.position.x = 2600 * Math.cos(phase);
    pointLight.position.z = 2600 * Math.sin(phase);
    pointLight.position.y = 350 + 200 * Math.sin(phase);

    pointLight2.position.x = 2000 * Math.cos(-phase - Math.PI);
    pointLight2.position.z = 2000 * Math.sin(-phase - Math.PI);
    pointLight2.position.y = 350 + 200 * Math.cos(phase);

    // Cinematographic camera parallax
    camera.position.x = Math.sin(phase) * 180;
    camera.position.y = 520 + Math.sin(phase * 2) * 60;
    camera.lookAt(0, 80, 0);

    // Grid liquid wave displacement simulation
    const basePositions = basePositionsRef.current;
    if (basePositions.length > 0) {
      const positionAttribute = floorGeometry.attributes.position;
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = basePositions[i * 2];
        const y = basePositions[i * 2 + 1];

        const wave1 = Math.sin(x * 0.0026 + phase) * 110;
        const wave2 = Math.cos(y * 0.0023 + phase) * 110;
        const wave3 = Math.sin((x + y) * 0.0017 + phase * 2.0) * 55;

        positionAttribute.setZ(i, wave1 + wave2 + wave3);
      }
      positionAttribute.needsUpdate = true;
      floorGeometry.computeVertexNormals();
    }

    // Floating particle motion
    const pPos = particles.geometry.attributes.position;
    const array = pPos.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const s = particleData[i];
      array[i * 3 + 1] = s.baseY + Math.sin(phase + s.phase) * s.amp;
    }
    pPos.needsUpdate = true;

    // Micro drift forward/backward
    moverGroup.position.z = Math.sin(phase) * 500;

    // Paint frame
    renderer.render(scene, camera);
  }, [frame, fps]);

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
        backgroundColor: '#05060f',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          boxShadow: '0 0 60px rgba(0, 200, 255, 0.15)',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};

export default CyberspaceWireframeLiquidWave;
// END_OF_FILE