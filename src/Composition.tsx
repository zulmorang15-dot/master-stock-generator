import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const PARTICLE_COUNT = 1800;

// Deterministic random generation for consistent renders
const createSeededRandom = (seed: number) => {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
};

const generateStaticParticles = () => {
    const random = createSeededRandom(42);
    const positions = [];
    const phases = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const radius = random() * 55 + 5;
        const theta = random() * Math.PI * 2;
        const z = (random() - 0.5) * 120;
        positions.push(Math.cos(theta) * radius, Math.sin(theta) * radius, z);
        phases.push(random() * Math.PI * 2);
    }
    return {
        positions: new Float32Array(positions),
        phases: new Float32Array(phases),
    };
};

const STATIC_PARTICLES = generateStaticParticles();

const PremiumCinematicEndscreen: React.FC = () => {
    const { width, height } = useVideoConfig();
    const frame = useCurrentFrame();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Initial 3D Scene Setup
    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x020105, 0.015);

        const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
        camera.position.z = 45;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1);

        // Particle System
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STATIC_PARTICLES.positions), 3));

        const pMaterial = new THREE.PointsMaterial({
            color: 0x00f0ff,
            size: 0.35,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const particles = new THREE.Points(particleGeo, pMaterial);
        scene.add(particles);

        // Center Sculptural Torus Knot Mesh
        const complexGeometry = new THREE.TorusKnotGeometry(14, 3.5, 200, 32, 3, 5);
        const meshMaterial = new THREE.MeshStandardMaterial({
            color: 0xff00ff,
            wireframe: true,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0xff00ff,
            emissiveIntensity: 0.45,
        });

        const complexMesh = new THREE.Mesh(complexGeometry, meshMaterial);
        complexMesh.position.set(0, 0, -10);
        scene.add(complexMesh);

        // Lighting Ecosystem
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 2);
        dirLight1.position.set(1, 1, 1).normalize();
        scene.add(dirLight1);

        const pointLight = new THREE.PointLight(0x00f0ff, 3, 100);
        pointLight.position.set(0, 0, 10);
        scene.add(pointLight);

        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;
        particlesRef.current = particles;
        meshRef.current = complexMesh;

        renderer.render(scene, camera);

        return () => {
            renderer.dispose();
            particleGeo.dispose();
            pMaterial.dispose();
            complexGeometry.dispose();
            meshMaterial.dispose();
        };
    }, []);

    // Frame-locked update execution
    useEffect(() => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const particles = particlesRef.current;
        const complexMesh = meshRef.current;

        if (!renderer || !scene || !camera) return;

        // Broadcast camera drift
        const cameraAngleX = (frame / 450) * Math.PI * 2 * 1;
        const cameraAngleY = (frame / 450) * Math.PI * 2 * 2;
        camera.position.x = Math.sin(cameraAngleX) * 2.5;
        camera.position.y = Math.cos(cameraAngleY) * 1.8;
        camera.lookAt(scene.position);

        // Torus knot kinetic rotations
        if (complexMesh) {
            complexMesh.rotation.x = (frame / 450) * Math.PI * 2 * 2;
            complexMesh.rotation.y = (frame / 450) * Math.PI * 2 * 3;
            complexMesh.rotation.z = Math.sin((frame / 450) * Math.PI * 2) * 0.5;
        }

        // Particle fluid matrix computations
        if (particles) {
            const positions = particles.geometry.attributes.position.array as Float32Array;
            const initialPositions = STATIC_PARTICLES.positions;
            const phases = STATIC_PARTICLES.phases;
            const waveAngle = (frame / 450) * Math.PI * 2 * 3;

            let index = 0;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const initialX = initialPositions[index];
                const initialY = initialPositions[index + 1];
                const initialZ = initialPositions[index + 2];

                let z = ((initialZ + 60 + (frame * 0.16)) % 120) - 60;
                positions[index + 2] = z;

                positions[index] = initialX + Math.sin(waveAngle + phases[i]) * 1.5;
                positions[index + 1] = initialY + Math.cos(waveAngle + phases[i]) * 1.5;

                index += 3;
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.rotation.z = (frame / 450) * Math.PI * 2;
        }

        renderer.render(scene, camera);
    }, [frame]);

    // UI Animations (Deterministic timeline interpolation)
    const leftAnim = () => {
        let opacity = 0;
        let scale = 0.8;
        let translateY = 60;

        if (frame < 10) {
            opacity = 0;
            scale = 0.8;
            translateY = 60;
        } else if (frame < 50) {
            const t = (frame - 10) / 40;
            const ease = Easing.out(Easing.quad)(t);
            opacity = ease;
            scale = 0.8 + ease * 0.2;
            translateY = 60 - ease * 60;
        } else if (frame < 410) {
            opacity = 1;
            const floatProgress = (frame - 50) / 360;
            const floatY = Math.sin(floatProgress * Math.PI * 4) * 6;
            translateY = floatY;
            scale = 1.0 + Math.sin(floatProgress * Math.PI * 4) * 0.01;
        } else {
            const t = (frame - 410) / 40;
            const ease = Easing.in(Easing.quad)(t);
            opacity = 1 - ease;
            scale = 1.0 - ease * 0.2;
            translateY = ease * 60;
        }

        return { opacity, scale, translateY };
    };

    const rightAnim = () => {
        let opacity = 0;
        let scale = 0.8;
        let translateY = 60;

        if (frame < 20) {
            opacity = 0;
            scale = 0.8;
            translateY = 60;
        } else if (frame < 60) {
            const t = (frame - 20) / 40;
            const ease = Easing.out(Easing.quad)(t);
            opacity = ease;
            scale = 0.8 + ease * 0.2;
            translateY = 60 - ease * 60;
        } else if (frame < 400) {
            opacity = 1;
            const floatProgress = (frame - 60) / 340;
            const floatY = Math.cos(floatProgress * Math.PI * 4) * 6;
            translateY = floatY;
            scale = 1.0 + Math.cos(floatProgress * Math.PI * 4) * 0.01;
        } else {
            const t = (frame - 400) / 40;
            const ease = Easing.in(Easing.quad)(t);
            opacity = 1 - ease;
            scale = 1.0 - ease * 0.2;
            translateY = ease * 60;
        }

        return { opacity, scale, translateY };
    };

    const subscribeAnim = () => {
        let opacity = 0;
        let scale = 0;

        if (frame < 25) {
            opacity = 0;
            scale = 0;
        } else if (frame < 70) {
            const t = (frame - 25) / 45;
            const ease = Easing.out(Easing.back(1.5))(t);
            opacity = t;
            scale = ease;
        } else if (frame < 390) {
            opacity = 1;
            const pulseProgress = (frame - 70) / 320;
            scale = 1 + Math.sin(pulseProgress * Math.PI * 6) * 0.04;
        } else if (frame < 435) {
            const t = (frame - 390) / 45;
            const ease = Easing.in(Easing.quad)(t);
            opacity = 1 - t;
            scale = 1 - ease;
        } else {
            opacity = 0;
            scale = 0;
        }

        return { opacity, scale };
    };

    const sweepProgress = (frame % 150) / 150;
    const sweepTranslate = interpolate(sweepProgress, [0, 1], [-150, 150]);

    const { opacity: leftOpacity, scale: leftScale, translateY: leftY } = leftAnim();
    const { opacity: rightOpacity, scale: rightScale, translateY: rightY } = rightAnim();
    const { opacity: subOpacity, scale: subScale } = subscribeAnim();

    const ring1Rotation = (frame / 450) * 360;
    const ring2Rotation = -(frame / 450) * 360 * 2;

    // Outer Layout Styles
    const containerStyle: React.CSSProperties = {
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    };

    const basePlaceholderStyle: React.CSSProperties = {
        position: 'absolute',
        width: '620px',
        height: '348px',
        backgroundColor: 'rgba(10, 10, 18, 0.45)',
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        border: '3px solid rgba(0, 240, 255, 0.4)',
        borderRadius: '24px',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.05), 0 0 30px rgba(0, 240, 255, 0.4)',
        overflow: 'hidden',
    };

    const sweepDivStyle: React.CSSProperties = {
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.1) 50%, transparent 55%)',
        transform: `translate(${sweepTranslate}%, ${sweepTranslate}%) rotate(45deg)`,
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

    const subscribeCircleStyle: React.CSSProperties = {
        width: '190px',
        height: '190px',
        backgroundColor: 'rgba(10, 10, 18, 0.45)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '4px solid #00f0ff',
        borderRadius: '50%',
        boxShadow: '0 0 60px rgba(0, 0, 0, 0.9), 0 0 40px #00f0ff, inset 0 0 25px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 5,
        transform: `scale(${subScale})`,
        opacity: subOpacity,
    };

    return (
        <div style={containerStyle}>
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />
            
            <div style={vignetteStyle} />

            <div style={uiLayerStyle}>
                <div
                    id="video-left"
                    style={{
                        ...basePlaceholderStyle,
                        left: '110px',
                        top: '366px',
                        opacity: leftOpacity,
                        transform: `scale(${leftScale}) translateY(${leftY}px)`,
                    }}
                >
                    <div style={sweepDivStyle} />
                </div>

                <div style={subscribeWrapperStyle}>
                    <svg style={{ position: 'absolute', width: 250, height: 250, filter: 'drop-shadow(0 0 8px #ff00ff)', transform: `rotate(${ring1Rotation}deg)` }}>
                        <circle
                            cx="125"
                            cy="125"
                            r="120"
                            fill="transparent"
                            stroke="#ff00ff"
                            strokeWidth="2"
                            strokeDasharray="10 15"
                        />
                    </svg>

                    <svg style={{ position: 'absolute', width: 275, height: 275, filter: 'drop-shadow(0 0 12px #00f0ff)', transform: `rotate(${ring2Rotation}deg)` }}>
                        <circle
                            cx="137.5"
                            cy="137.5"
                            r="132"
                            fill="transparent"
                            stroke="#00f0ff"
                            strokeWidth="1"
                            strokeDasharray="40 180"
                        />
                    </svg>

                    <div style={subscribeCircleStyle} />
                </div>

                <div
                    id="video-right"
                    style={{
                        ...basePlaceholderStyle,
                        right: '110px',
                        top: '366px',
                        opacity: rightOpacity,
                        transform: `scale(${rightScale}) translateY(${rightY}px)`,
                    }}
                >
                    <div style={sweepDivStyle} />
                </div>
            </div>
        </div>
    );
};

export default PremiumCinematicEndscreen;
// END_OF_FILE