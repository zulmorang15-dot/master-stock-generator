import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const CyberspaceBackground: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const pointLight1Ref = useRef<THREE.PointLight | null>(null);
    const pointLight2Ref = useRef<THREE.PointLight | null>(null);
    const floorGeometryRef = useRef<THREE.PlaneGeometry | null>(null);

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // 1. Initialization Effect
    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020205);
        scene.fog = new THREE.FogExp2(0x020205, 0.0007);

        const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 1, 4000);
        camera.position.set(0, 250, 1200);
        camera.lookAt(0, 50, 0);

        const ambientLight = new THREE.AmbientLight(0x111122, 1.5);
        scene.add(ambientLight);

        // Vibrant cyber lights
        const pointLight1 = new THREE.PointLight(0x00ffff, 4, 3000);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff00ff, 4, 3000);
        scene.add(pointLight2);

        const floorGroup = new THREE.Group();
        scene.add(floorGroup);

        const FLOOR_RES = 80;
        const FLOOR_WIDTH = 4500;
        const FLOOR_DEPTH = 4500;

        const floorGeometry = new THREE.PlaneGeometry(FLOOR_WIDTH, FLOOR_DEPTH, FLOOR_RES, FLOOR_RES);

        const solidMaterial = new THREE.MeshPhongMaterial({
            color: 0x050515,
            emissive: 0x000000,
            side: THREE.DoubleSide,
            flatShading: true
        });

        const wireframeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x005577,
            side: THREE.DoubleSide,
            wireframe: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const solidMesh = new THREE.Mesh(floorGeometry, solidMaterial);
        const wireframeMesh = new THREE.Mesh(floorGeometry, wireframeMaterial);

        wireframeMesh.position.z = 2;

        floorGroup.add(solidMesh);
        floorGroup.add(wireframeMesh);

        floorGroup.rotation.x = -Math.PI / 2;
        floorGroup.position.y = -100;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: false,
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        pointLight1Ref.current = pointLight1;
        pointLight2Ref.current = pointLight2;
        floorGeometryRef.current = floorGeometry;

        return () => {
            renderer.dispose();
            solidMaterial.dispose();
            wireframeMaterial.dispose();
            floorGeometry.dispose();
        };
    }, []);

    // 2. Deterministic Render Effect (Frame-Locked Animation Loop)
    useEffect(() => {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const pointLight1 = pointLight1Ref.current;
        const pointLight2 = pointLight2Ref.current;
        const floorGeometry = floorGeometryRef.current;

        if (!scene || !camera || !renderer || !pointLight1 || !pointLight2 || !floorGeometry) return;

        // Perfect looping timeline calculations (10 seconds loop cycle)
        const cycleDuration = 10; 
        const totalCycleFrames = fps * cycleDuration;
        const progress = (frame % totalCycleFrames) / totalCycleFrames;
        const angle = progress * Math.PI * 2;

        // Animated glowing lights orbiting the cyberspace arena
        pointLight1.position.x = Math.cos(angle) * 1500;
        pointLight1.position.y = 300;
        pointLight1.position.z = Math.sin(angle) * 1500;

        pointLight2.position.x = Math.cos(-angle) * 1500;
        pointLight2.position.y = 300;
        pointLight2.position.z = Math.sin(-angle) * 1500;

        // Sine-wave cyber grid displacements
        const positionAttribute = floorGeometry.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);

            const wave1 = Math.sin((vertex.x * 0.003) + angle) * 150;
            const wave2 = Math.cos((vertex.y * 0.003) + angle * 2) * 100;

            positionAttribute.setZ(i, wave1 + wave2);
        }
        positionAttribute.needsUpdate = true;

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
                backgroundColor: '#020205',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    filter: 'drop-shadow(0px 0px 12px rgba(0, 255, 255, 0.45)) drop-shadow(0px 0px 24px rgba(255, 0, 255, 0.35)) saturate(1.3) brightness(1.1)',
                }}
            />
        </div>
    );
};

export default CyberspaceBackground;
// END_OF_FILE