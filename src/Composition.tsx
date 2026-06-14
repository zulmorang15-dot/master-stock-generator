import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLE_COUNT = 2000;

// Deterministic Pseudo-Random Generation
const STATIC_PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
    const r1 = Math.sin(i * 12.9898) * 43758.5453123;
    const r2 = Math.sin(i * 78.233) * 43758.5453123;
    const r3 = Math.sin(i * 99.123) * 43758.5453123;
    const x = (r1 - Math.floor(r1) - 0.5) * 200;
    const y = (r2 - Math.floor(r2) - 0.5) * 100;
    const z = (r3 - Math.floor(r3) - 0.5) * 200;
    return { x, y, z };
});

const RING_ROTATIONS = Array.from({ length: 5 }).map((_, i) => {
    const r1 = Math.sin(i * 45.12) * 1000;
    const r2 = Math.cos(i * 89.23) * 1000;
    return {
        x: (r1 - Math.floor(r1)) * Math.PI,
        y: (r2 - Math.floor(r2)) * Math.PI,
    };
});

const STREAK_Y_OFFSETS = Array.from({ length: 100 }).map((_, i) => {
    const r = Math.sin(i * 14.5) * 1000;
    return (r - Math.floor(r) - 0.5) * 200;
});

export const CyberpunkEsportsEndscreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Canvas & Three.js Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const gridRef = useRef<THREE.GridHelper | null>(null);
    const gridMagentaRef = useRef<THREE.GridHelper | null>(null);
    const ringsGroupRef = useRef<THREE.Group | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const pointLightCyanRef = useRef<THREE.PointLight | null>(null);
    const pointLightMagentaRef = useRef<THREE.PointLight | null>(null);

    // Three.js Scene Initialization
    useEffect(() => {
        if (!canvasRef.current) return;
        const currentCanvas = canvasRef.current;
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x01020a, 0.004);
        
        const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
        camera.position.set(0, 15, 60);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ canvas: currentCanvas, antialias: true, alpha: true });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(2);
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.5;

        // Holographic Grid Floor
        const gridHelper = new THREE.GridHelper(300, 100, 0x00ffff, 0x002244);
        gridHelper.position.y = -20;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.4;
        scene.add(gridHelper);

        const gridHelperMagenta = new THREE.GridHelper(300, 30, 0xff00ff, 0x330033);
        gridHelperMagenta.position.y = -20.1;
        gridHelperMagenta.material.transparent = true;
        gridHelperMagenta.material.opacity = 0.2;
        scene.add(gridHelperMagenta);

        // Massive Rotating Background Rings
        const ringsGroup = new THREE.Group();
        const ringGeom = new THREE.TorusGeometry(40, 0.5, 16, 100);
        const matCyan = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const matMagenta = new THREE.MeshBasicMaterial({ color: 0xff00ff });

        for (let i = 0; i < 5; i++) {
            const ring = new THREE.Mesh(ringGeom, i % 2 === 0 ? matCyan : matMagenta);
            ring.rotation.x = RING_ROTATIONS[i].x;
            ring.rotation.y = RING_ROTATIONS[i].y;
            ring.scale.setScalar(1 + (i * 0.5));
            ring.position.z = -50 - (i * 20);
            ringsGroup.add(ring);
        }
        scene.add(ringsGroup);

        // Volumetric Particles
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particlePositions[i * 3] = STATIC_PARTICLES[i].x;
            particlePositions[i * 3 + 1] = STATIC_PARTICLES[i].y;
            particlePositions[i * 3 + 2] = STATIC_PARTICLES[i].z;
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

        // Ambient & Point Lights
        const ambientLight = new THREE.AmbientLight(0x010210);
        scene.add(ambientLight);

        const pointLightCyan = new THREE.PointLight(0x00ffff, 5, 200);
        pointLightCyan.position.set(-50, 20, 0);
        scene.add(pointLightCyan);

        const pointLightMagenta = new THREE.PointLight(0xff00ff, 5, 200);
        pointLightMagenta.position.set(50, -20, -20);
        scene.add(pointLightMagenta);

        // Store instances
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        gridRef.current = gridHelper;
        gridMagentaRef.current = gridHelperMagenta;
        ringsGroupRef.current = ringsGroup;
        particlesRef.current = particles;
        pointLightCyanRef.current = pointLightCyan;
        pointLightMagentaRef.current = pointLightMagenta;

        renderer.render(scene, camera);

        return () => {
            renderer.dispose();
            ringGeom.dispose();
            matCyan.dispose();
            matMagenta.dispose();
            particleGeometry.dispose();
            particleMaterial.dispose();
        };
    }, []);

    // Frame-Locked Render Effect
    useEffect(() => {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const gridHelper = gridRef.current;
        const gridHelperMagenta = gridMagentaRef.current;
        const ringsGroup = ringsGroupRef.current;
        const particles = particlesRef.current;
        const pointLightCyan = pointLightCyanRef.current;
        const pointLightMagenta = pointLightMagentaRef.current;

        if (!scene || !camera || !renderer) return;

        const elapsedTime = frame / fps;

        // Camera floating loop
        camera.position.x = Math.sin(elapsedTime * 0.3) * 10;
        camera.position.y = 15 + Math.cos(elapsedTime * 0.4) * 5;
        camera.lookAt(0, 0, 0);

        // Seamless Grid Loop
        if (gridHelper) {
            gridHelper.position.z = (elapsedTime * 15) % 6;
        }
        if (gridHelperMagenta) {
            gridHelperMagenta.position.z = (elapsedTime * 15) % 30;
        }

        // Seamless Ring Rotation (Multiples of 2PI over 20s)
        if (ringsGroup) {
            ringsGroup.rotation.z = elapsedTime * (Math.PI * 2 / 20);
            ringsGroup.rotation.y = elapsedTime * (Math.PI * 2 / 20);
            ringsGroup.children.forEach((ring, index) => {
                ring.rotation.x = RING_ROTATIONS[index].x + elapsedTime * (Math.PI * 4 / 20) * (index % 2 === 0 ? 1 : -1);
            });
        }

        // Seamless Particles Loop (wraps over 200 units span smoothly in 20s)
        if (particles) {
            const positions = particles.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const initialZ = STATIC_PARTICLES[i].z;
                positions[i * 3 + 2] = -120 + ((initialZ + 120 + elapsedTime * 10) % 200);
            }
            particles.geometry.attributes.position.needsUpdate = true;
        }

        // Seamless Point Light Intensities
        if (pointLightCyan) {
            pointLightCyan.intensity = 5 + Math.sin(elapsedTime * Math.PI * 2 / 5) * 2;
        }
        if (pointLightMagenta) {
            pointLightMagenta.intensity = 5 + Math.cos(elapsedTime * Math.PI * 2 / 4) * 2;
        }

        renderer.render(scene, camera);
    }, [frame, fps]);

    // UI Frame-Locked Animations
    // 1. Scanning Line Translation
    const scanlineY = interpolate(frame % (fps * 4), [0, fps * 4], [-100, 438], { easing: Easing.linear });

    // 2. High Frequency Hologram Border Pulse (Cyberpunk flicker effect)
    const basePulse = interpolate(frame % 30, [0, 15, 30], [0.4, 0.8, 0.4], { easing: Easing.sin });
    const flickerNoise = Math.sin(frame * 1.5) * 0.15 + Math.cos(frame * 0.7) * 0.1;
    const computedGlow = Math.max(0.3, Math.min(1.0, basePulse + flickerNoise));
    const activeGlowBoxShadow = `0 0 ${30 + computedGlow * 40}px rgba(0, 255, 255, ${computedGlow}), inset 0 0 ${40 + computedGlow * 40}px rgba(0, 255, 255, ${computedGlow * 0.5})`;

    // 3. Reactor Ring Rotations
    const ringOuterRotation = (frame / (fps * 8)) * 360;
    const ringInnerRotation = (frame / (fps * 12)) * -360;

    // 4. Central Hologram Core Pulses
    const coreGlowScale = interpolate(Math.sin((frame / (fps * 2)) * Math.PI * 2), [-1, 1], [0.9, 1.1]);
    const coreGlowBrightness = interpolate(Math.sin((frame / (fps * 2)) * Math.PI * 2), [-1, 1], [1, 1.5]);

    // 5. Target Scaling Ease Loop
    const coreTargetScale = interpolate(frame % fps, [0, fps], [0, 3], { easing: Easing.out(Easing.quad) });
    const coreTargetOpacity = interpolate(frame % fps, [0, fps], [1, 0], { easing: Easing.out(Easing.quad) });

    // 6. Streaks Seamless Cycles
    // Cycle 1 (2.0s loop)
    const cycle1 = (frame / (fps * 2.0)) % 1;
    const streak1X = interpolate(cycle1, [0, 0.75], [-600, ORIGINAL_WIDTH + 1000], { extrapolateRight: "clamp" });
    const streak1Opacity = interpolate(cycle1, [0, 0.1, 0.65, 0.75], [0, 1, 1, 0], { extrapolateRight: "clamp" });
    const streak1Y = STREAK_Y_OFFSETS[Math.floor(frame / (fps * 2.0)) % STREAK_Y_OFFSETS.length];

    // Cycle 2 (2.5s loop)
    const cycle2 = (frame / (fps * 2.5)) % 1;
    const streak2X = interpolate(cycle2, [0, 0.8], [-800, ORIGINAL_WIDTH + 1000], { extrapolateRight: "clamp" });
    const streak2Opacity = interpolate(cycle2, [0, 0.1, 0.7, 0.8], [0, 1, 1, 0], { extrapolateRight: "clamp" });
    const streak2Y = STREAK_Y_OFFSETS[(Math.floor(frame / (fps * 2.5)) + 12) % STREAK_Y_OFFSETS.length];

    // Cycle 3 (1.25s loop)
    const cycle3 = (frame / (fps * 1.25)) % 1;
    const streak3X = interpolate(cycle3, [0, 0.8], [-500, ORIGINAL_WIDTH + 1000], { extrapolateRight: "clamp" });
    const streak3Opacity = interpolate(cycle3, [0, 0.1, 0.7, 0.8], [0, 1, 1, 0], { extrapolateRight: "clamp" });
    const streak3Y = STREAK_Y_OFFSETS[(Math.floor(frame / (fps * 1.25)) + 37) % STREAK_Y_OFFSETS.length];

    // Styles objects to satisfy camelCase criteria
    const appContainerStyle: React.CSSProperties = {
        position: 'absolute',
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, #020412 0%, #000000 100%)',
    };

    const webglCanvasStyle: React.CSSProperties = {
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

    const placeholderStyle = (isLeft: boolean): React.CSSProperties => ({
        position: 'absolute',
        width: 600,
        height: 338,
        top: 371,
        left: isLeft ? 100 : undefined,
        right: !isLeft ? 100 : undefined,
        background: 'rgba(1, 4, 15, 0.7)',
        border: '3px solid #00ffff',
        boxShadow: activeGlowBoxShadow,
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
    });

    const gridPatternStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
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

    const cornerStyle = (position: 'tl' | 'tr' | 'bl' | 'br'): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            width: 40,
            height: 40,
            border: '4px solid #fff',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
            zIndex: 2,
        };
        if (position === 'tl') return { ...base, top: -4, left: -4, borderRight: 'none', borderBottom: 'none' };
        if (position === 'tr') return { ...base, top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' };
        if (position === 'bl') return { ...base, bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' };
        return { ...base, bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' };
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
        transform: `scale(${coreGlowScale})`,
        filter: `brightness(${coreGlowBrightness})`,
    };

    const coreTargetStyle: React.CSSProperties = {
        position: 'absolute',
        width: '25%',
        height: '25%',
        borderRadius: '50%',
        border: '6px solid #fff',
        boxShadow: '0 0 20px #fff',
        transform: `scale(${coreTargetScale})`,
        opacity: coreTargetOpacity,
    };

    const lightStreakStyle = (y: number, x: number, opacity: number, widthVal: number, isMagenta: boolean): React.CSSProperties => ({
        position: 'absolute',
        height: 2,
        width: widthVal,
        background: isMagenta 
            ? 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)'
            : 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
        boxShadow: isMagenta
            ? '0 0 20px #ff00ff, 0 0 40px #ff00ff'
            : '0 0 20px #00ffff, 0 0 40px #00ffff',
        borderRadius: '50%',
        top: y,
        left: 0,
        transform: `translateX(${x}px)`,
        zIndex: 5,
        opacity,
        mixBlendMode: 'screen',
    });

    const vignetteStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        boxShadow: 'inset 0 0 250px rgba(0, 0, 0, 0.9)',
        zIndex: 20,
        pointerEvents: 'none',
    };

    return (
        <div style={appContainerStyle}>
            <canvas ref={canvasRef} style={webglCanvasStyle} />
            
            <div style={uiLayerStyle}>
                
                {/* Left Video Box */}
                <div style={placeholderStyle(true)}>
                    <div style={gridPatternStyle} />
                    <div style={cornerStyle('tl')} />
                    <div style={cornerStyle('tr')} />
                    <div style={cornerStyle('bl')} />
                    <div style={cornerStyle('br')} />
                    <div style={scanlineStyle} />
                </div>

                {/* Right Video Box */}
                <div style={placeholderStyle(false)}>
                    <div style={gridPatternStyle} />
                    <div style={cornerStyle('tl')} />
                    <div style={cornerStyle('tr')} />
                    <div style={cornerStyle('bl')} />
                    <div style={cornerStyle('br')} />
                    <div style={scanlineStyle} />
                </div>

                {/* Central Subscriber Hub */}
                <div style={subscribePortalStyle}>
                    <div style={ringOuterStyle} />
                    <div style={ringInnerStyle} />
                    <div style={coreGlowStyle} />
                    <div style={coreTargetStyle} />
                </div>

                {/* Cyber VFX Sparks / Light Streaks */}
                <div style={lightStreakStyle(250 + streak1Y, streak1X, streak1Opacity, 600, false)} />
                <div style={lightStreakStyle(850 + streak2Y, streak2X, streak2Opacity, 800, true)} />
                <div style={lightStreakStyle(450 + streak3Y, streak3X, streak3Opacity, 500, false)} />
            </div>

            <div style={vignetteStyle} />
        </div>
    );
};

export default CyberpunkEsportsEndscreen;
// END_OF_FILE