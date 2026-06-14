import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const FLOOR_RES = 80;
const FLOOR_WIDTH = 4500;
const FLOOR_DEPTH = 4500;

const CyberspaceBackground: React.FC = () => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep references to Three.js objects
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const floorGeometryRef = useRef<THREE.PlaneGeometry | null>(null);
  const pointLight1Ref = useRef<THREE.PointLight | null>(null);
  const pointLight2Ref = useRef<THREE.PointLight | null>(null);

  // Scaling logic to maintain aspect ratio with no black bars
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Initialize Three.js Scene (Runs once)
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    scene.fog = new THREE.FogExp2(0x020205, 0.0007);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 1, 4000);
    camera.position.set(0, 250, 1200);
    camera.lookAt(0, 50, 0);
    cameraRef.current = camera;

    const ambientLight = new THREE.AmbientLight(0x111122, 1.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 4, 3000);
    scene.add(pointLight1);
    pointLight1Ref.current = pointLight1;

    const pointLight2 = new THREE.PointLight(0xff00ff, 4, 3000);
    scene.add(pointLight2);
    pointLight2Ref.current = pointLight2;

    const floorGroup = new THREE.Group();
    scene.add(floorGroup);

    const floorGeometry = new THREE.PlaneGeometry(FLOOR_WIDTH, FLOOR_DEPTH, FLOOR_RES, FLOOR_RES);
    floorGeometryRef.current = floorGeometry;

    const solidMaterial = new THREE.MeshPhongMaterial({
      color: 0x050515,
      emissive: 0x000000,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    // Multiple wireframe layers to simulate a rich glowing neon bloom effect
    const wireframeMaterial1 = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x005577,
      side: THREE.DoubleSide,
      wireframe: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const wireframeMaterial2 = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      emissive: 0x002244,
      side: THREE.DoubleSide,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const wireframeMaterial3 = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      emissive: 0x440044,
      side: THREE.DoubleSide,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });

    const solidMesh = new THREE.Mesh(floorGeometry, solidMaterial);
    const wireframeMesh1 = new THREE.Mesh(floorGeometry, wireframeMaterial1);
    const wireframeMesh2 = new THREE.Mesh(floorGeometry, wireframeMaterial2);
    const wireframeMesh3 = new THREE.Mesh(floorGeometry, wireframeMaterial3);

    wireframeMesh1.position.z = 2;
    wireframeMesh2.position.z = 4;
    wireframeMesh2.scale.set(1.002, 1.002, 1.002);
    wireframeMesh3.position.z = 6;
    wireframeMesh3.scale.set(1.004, 1.004, 1.004);

    floorGroup.add(solidMesh);
    floorGroup.add(wireframeMesh1);
    floorGroup.add(wireframeMesh2);
    floorGroup.add(wireframeMesh3);

    floorGroup.rotation.x = -Math.PI / 2;
    floorGroup.position.y = -100;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);
    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      floorGeometry.dispose();
      solidMaterial.dispose();
      wireframeMaterial1.dispose();
      wireframeMaterial2.dispose();
      wireframeMaterial3.dispose();
    };
  }, []);

  // Frame-locked render loop matching exact loop cycle of the video
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const floorGeometry = floorGeometryRef.current;
    const pointLight1 = pointLight1Ref.current;
    const pointLight2 = pointLight2Ref.current;

    if (!scene || !camera || !renderer || !floorGeometry || !pointLight1 || !pointLight2) return;

    // Symmetrical progress looping over durationInFrames to prevent frame jumps
    const progress = frame / durationInFrames;
    const angle = progress * Math.PI * 2;

    // Replicate lights circular orbit
    pointLight1.position.x = Math.cos(angle) * 1500;
    pointLight1.position.y = 300;
    pointLight1.position.z = Math.sin(angle) * 1500;

    pointLight2.position.x = Math.cos(-angle) * 1500;
    pointLight2.position.y = 300;
    pointLight2.position.z = Math.sin(-angle) * 1500;

    // Wave computation for mesh vertices
    const positionAttribute = floorGeometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);

      const wave1 = Math.sin(vertex.x * 0.003 + angle) * 150;
      const wave2 = Math.cos(vertex.y * 0.003 + angle * 2) * 100;

      positionAttribute.setZ(i, wave1 + wave2);
    }
    positionAttribute.needsUpdate = true;
    floorGeometry.computeVertexNormals();

    // Deterministically draw the current frame
    renderer.render(scene, camera);
  }, [frame, durationInFrames]);

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
        backgroundColor: '#020205',
      }}
    >
      <div
        id="canvas-container"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
};

export default CyberspaceBackground;
// END_OF_FILE