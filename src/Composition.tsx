import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

// Define static dimensions for consistent fullscreen scale math
const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic Wave Particles Pre-calculation
const WAVE_COUNT = 3000;
const WAVE_X_Z_PHASES = Array.from({ length: WAVE_COUNT }, (_, idx) => {
    // Standard deterministic pseudo-random sequences
    const x = (((idx * 17.31) % 40) - 20) * 5;
    const z = (((idx * 29.73) % 40) - 20) * 5;
    const phase = ((idx * 3.1415) % (Math.PI * 2));
    return { x, z, phase };
});

// Deterministic Dust Particles Pre-calculation
const DUST_COUNT = 300;
const DUST_POSITIONS = Array.from({ length: DUST_COUNT }, (_, idx) => {
    const x = (((idx * 43.19) % 150) - 75);
    const y = (((idx * 71.83) % 100) - 50);
    const z = (((idx * 113.27) % 150) - 75);
    return { x, y, z };
});

const FuturisticEsportsEndScreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const gridHelperRef = useRef<THREE.GridHelper | null>(null);
    const waveMeshRef = useRef<THREE.Points | null>(null);
    const backgroundCoreRef = useRef<THREE.Mesh | null>(null);
    const outerCoreRef = useRef<THREE.Mesh | null>(null);
    const dustSystemRef = useRef<THREE.Points | null>(null);

    // Dynamic scale factor calculation for filling the rendering target canvas
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Initialize Three.js environment once on mount
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.fog = new THREE.FogExp2(0x010308, 0.003);

        const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
        camera.position.set(0, 15, 60);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1);
        rendererRef.current = renderer;

        // Animated Cyber Grid Floor
        const gridHelper = new THREE.GridHelper(400, 100, 0x00ffff, 0x002266);
        gridHelper.position.y = -15;
        if (gridHelper.material instanceof THREE.Material) {
            gridHelper.material.transparent = true;
            gridHelper.material.opacity = 0.4;
            gridHelper.material.blending = THREE.AdditiveBlending;
        }
        scene.add(gridHelper);
        gridHelperRef.current = gridHelper;

        // Wave Particle Grid Setup
        const waveGeometry = new THREE.BufferGeometry();
        const wavePositionsArr = new Float32Array(WAVE_COUNT * 3);
        WAVE_X_Z_PHASES.forEach((p, idx) => {
            wavePositionsArr[idx * 3] = p.x;
            wavePositionsArr[idx * 3 + 1] = 0;
            wavePositionsArr[idx * 3 + 2] = p.z;
        });
        waveGeometry.setAttribute('position', new THREE.BufferAttribute(wavePositionsArr, 3));

        const particleMat = new THREE.PointsMaterial({
            color: 0x00aaff,
            size: 0.6,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const waveMesh = new THREE.Points(waveGeometry, particleMat);
        waveMesh.position.y = -10;
        scene.add(waveMesh);
        waveMeshRef.current = waveMesh;

        // Cyber Center Core Spheres
        const coreGeo = new THREE.SphereGeometry(8, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x0055ff,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
        });
        const backgroundCore = new THREE.Mesh(coreGeo, coreMat);
        scene.add(backgroundCore);
        backgroundCoreRef.current = backgroundCore;

        const outerCoreGeo = new THREE.IcosahedronGeometry(14, 1);
        const outerCoreMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
        });
        const outerCore = new THREE.Mesh(outerCoreGeo, outerCoreMat);
        scene.add(outerCore);
        outerCoreRef.current = outerCore;

        // Holographic Floating Dust
        const dustGeo = new THREE.BufferGeometry();
        const dustPositionsArr = new Float32Array(DUST_COUNT * 3);
        DUST_POSITIONS.forEach((p, idx) => {
            dustPositionsArr[idx * 3] = p.x;
            dustPositionsArr[idx * 3 + 1] = p.y;
            dustPositionsArr[idx * 3 + 2] = p.z;
        });
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositionsArr, 3));

        const dustMat = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.8,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });
        const dustSystem = new THREE.Points(dustGeo, dustMat);
        scene.add(dustSystem);
        dustSystemRef.current = dustSystem;

        return () => {
            renderer.dispose();
            gridHelper.geometry.dispose();
            if (Array.isArray(gridHelper.material)) {
                gridHelper.material.forEach((m) => m.dispose());
            } else {
                gridHelper.material.dispose();
            }
            waveGeometry.dispose();
            particleMat.dispose();
            coreGeo.dispose();
            coreMat.dispose();
            outerCoreGeo.dispose();
            outerCoreMat.dispose();
            dustGeo.dispose();
            dustMat.dispose();
        };
    }, []);

    // Deterministic Frame Render Effect (Ensures frame-locking, eliminates drift and jitter)
    useEffect(() => {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const backgroundCore = backgroundCoreRef.current;
        const outerCore = outerCoreRef.current;
        const waveMesh = waveMeshRef.current;
        const gridHelper = gridHelperRef.current;
        const dustSystem = dustSystemRef.current;

        if (!scene || !camera || !renderer || !backgroundCore || !outerCore || !waveMesh || !gridHelper || !dustSystem) {
            return;
        }

        const elapsedTime = frame / fps;

        // Loop aligned rotations
        backgroundCore.rotation.y = elapsedTime * 0.2;
        backgroundCore.rotation.x = elapsedTime * 0.1;

        outerCore.rotation.y = -elapsedTime * 0.15;
        outerCore.rotation.z = elapsedTime * 0.1;

        // Dynamic 3D Camera Loop Pathing (20 seconds precise duration)
        const cycleRatio = (frame / (fps * 20)) * Math.PI * 2;
        camera.position.x = Math.sin(cycleRatio) * 5;
        camera.position.y = 15 + Math.cos(cycleRatio) * 3;
        camera.position.z = 60;
        camera.rotation.z = Math.sin(cycleRatio) * 0.02;
        camera.rotation.x = -0.05 + Math.cos(cycleRatio) * 0.02;

        // Wave heights calculations matching standard CSS/JS deterministic curves
        const positions = waveMesh.geometry.attributes.position.array as Float32Array;
        const tWave1 = (frame / (fps * 20)) * Math.PI * 2 * 30;
        const tWave2 = (frame / (fps * 20)) * Math.PI * 2 * 15;

        for (let i = 0; i < WAVE_COUNT; i++) {
            const x = WAVE_X_Z_PHASES[i].x;
            const z = WAVE_X_Z_PHASES[i].z;
            positions[i * 3 + 1] = Math.sin(x * 0.05 + tWave1) * 4 + Math.cos(z * 0.05 + tWave2) * 4;
        }
        waveMesh.geometry.attributes.position.needsUpdate = true;

        // Move Grid Forward continuously (seamlessly loops step size)
        const gridStep = 4;
        gridHelper.position.z = (elapsedTime * 5) % gridStep;

        // Dust Slow Rotation
        const dustAngle = (frame / (fps * 20)) * Math.PI * 2 * 2;
        dustSystem.rotation.y = dustAngle;

        renderer.render(scene, camera);
    }, [frame, fps]);

    // Precise UI Timings (Driven natively via Remotion interpolation)
    const scanFrameLeft = frame % (fps * 4);
    const scanFrameRight = (frame + fps * 2) % (fps * 4);
    const scanYLeft = interpolate(scanFrameLeft, [0, fps * 4], [-100, 100]);
    const scanYRight = interpolate(scanFrameRight, [0, fps * 4], [-100, 100]);

    const sweepFrameLeft = frame % (fps * 6);
    const sweepFrameRight = (frame + fps * 3) % (fps * 6);
    const sweepXLeft = interpolate(sweepFrameLeft, [0, fps * 1.2, fps * 6], [-100, 200, 200], { easing: Easing.bezier(0.19, 1, 0.22, 1) });
    const sweepXRight = interpolate(sweepFrameRight, [0, fps * 1.2, fps * 6], [-100, 200, 200], { easing: Easing.bezier(0.19, 1, 0.22, 1) });

    const outerRot = interpolate(frame % (fps * 12), [0, fps * 12], [0, 360]);
    const innerRot = interpolate(frame % (fps * 8), [0, fps * 8], [360, 0]);
    const dashedRot = interpolate(frame % (fps * 20), [0, fps * 20], [0, 360]);

    const crosshairPulse = frame % (fps * 2);
    const crosshairScale = interpolate(crosshairPulse, [0, fps * 1, fps * 2], [1.0, 1.2, 1.0], { easing: Easing.inOut(Easing.quad) });
    const crosshairOpacity = interpolate(crosshairPulse, [0, fps * 1, fps * 2], [0.5, 0.4, 0.5], { easing: Easing.inOut(Easing.quad) });

    const hoverLeftY = interpolate(frame % (fps * 6), [0, fps * 3, fps * 6], [-8, 8, -8], { easing: Easing.inOut(Easing.quad) });
    const hoverRightY = interpolate((frame + fps * 3) % (fps * 6), [0, fps * 3, fps * 6], [-8, 8, -8], { easing: Easing.inOut(Easing.quad) });

    const subPulseFrame = frame % (fps * 4);
    const subPulseScale = interpolate(subPulseFrame, [0, fps * 2, fps * 4], [1.0, 1.04, 1.0], { easing: Easing.inOut(Easing.quad) });

    // CSS styling presets re-engineered into safe inline Javascript camelCased styles
    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        transformOrigin: 'center center',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, #020b1f 0%, #010308 100%)',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
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
        zIndex: 2,
        pointerEvents: 'none',
    };

    const getPlaceholderStyle = (isLeft: boolean, hoverY: number): React.CSSProperties => ({
        position: 'absolute',
        width: 580,
        height: 326,
        top: 377 + hoverY,
        background: 'rgba(0, 15, 30, 0.4)',
        border: '2px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
        left: isLeft ? 140 : undefined,
        right: !isLeft ? 140 : undefined,
    });

    const cornerBaseStyle: React.CSSProperties = {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#00ffff',
        borderStyle: 'solid',
        borderWidth: 0,
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
        zIndex: 3,
    };

    const tlStyle: React.CSSProperties = { ...cornerBaseStyle, top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 };
    const trStyle: React.CSSProperties = { ...cornerBaseStyle, top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 };
    const blStyle: React.CSSProperties = { ...cornerBaseStyle, bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 };
    const brStyle: React.CSSProperties = { ...cornerBaseStyle, bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 };

    const scanlineStyle = (yPercent: number): React.CSSProperties => ({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
        transform: `translateY(${yPercent}%)`,
    });

    const sweepStyle = (leftPercent: number): React.CSSProperties => ({
        position: 'absolute',
        top: 0,
        left: `${leftPercent}%`,
        width: '50%',
        height: '100%',
        background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
        transform: 'skewX(-25deg)',
    });

    const subscribeCenterStyle = (pulseScale: number): React.CSSProperties => ({
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${pulseScale})`,
        width: 340,
        height: 340,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    });

    const hologramRingBaseStyle: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        border: '2px solid transparent',
    };

    const ringOuterStyle = (rot: number): React.CSSProperties => ({
        ...hologramRingBaseStyle,
        width: 340,
        height: 340,
        borderTop: '4px solid #00ffff',
        borderBottom: '4px solid #0055ff',
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
        transform: `rotate(${rot}deg)`,
    });

    const ringInnerStyle = (rot: number): React.CSSProperties => ({
        ...hologramRingBaseStyle,
        width: 280,
        height: 280,
        borderLeft: '3px solid #0055ff',
        borderRight: '3px solid #00ffff',
        transform: `rotate(${rot}deg)`,
    });

    const ringDashedStyle = (rot: number): React.CSSProperties => ({
        ...hologramRingBaseStyle,
        width: 310,
        height: 310,
        border: '2px dashed rgba(0, 255, 255, 0.5)',
        transform: `rotate(${rot}deg)`,
    });

    const subscribeCoreStyle: React.CSSProperties = {
        width: 220,
        height: 220,
        borderRadius: '50%',
        background: 'rgba(0, 20, 40, 0.6)',
        border: '4px solid #00ffff',
        boxShadow: '0 0 50px rgba(0, 255, 255, 0.5), inset 0 0 40px rgba(0, 85, 255, 0.5)',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        zIndex: 10,
    };

    const hudLineStyle = (custom: React.CSSProperties): React.CSSProperties => ({
        position: 'absolute',
        background: '#00ffff',
        opacity: 0.2,
        boxShadow: '0 0 10px #00ffff',
        ...custom,
    });

    const hudCrosshairStyle = (custom: React.CSSProperties, scale: number, opacity: number): React.CSSProperties => ({
        position: 'absolute',
        width: 20,
        height: 20,
        transform: `scale(${scale})`,
        opacity,
        ...custom,
    });

    const crosshairHorizontal: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: 0,
        width: '100%',
        height: 2,
        background: '#0055ff',
        transform: 'translateY(-50%)',
    };

    const crosshairVertical: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: '50%',
        width: 2,
        height: '100%',
        background: '#0055ff',
        transform: 'translateX(-50%)',
    };

    return (
        <div style={containerStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />

            <div style={uiLayerStyle}>
                {/* Horizontal HUD Guide Lines */}
                <div style={hudLineStyle({ top: '150px', left: 0, width: '100%', height: '1px' })} />
                <div style={hudLineStyle({ bottom: '150px', left: 0, width: '100%', height: '1px' })} />

                {/* HUD Corners Crosshairs */}
                <div style={hudCrosshairStyle({ top: '140px', left: '140px' }, crosshairScale, crosshairOpacity)}>
                    <div style={crosshairHorizontal} />
                    <div style={crosshairVertical} />
                </div>
                <div style={hudCrosshairStyle({ top: '140px', right: '140px' }, crosshairScale, crosshairOpacity)}>
                    <div style={crosshairHorizontal} />
                    <div style={crosshairVertical} />
                </div>
                <div style={hudCrosshairStyle({ bottom: '140px', left: '140px' }, crosshairScale, crosshairOpacity)}>
                    <div style={crosshairHorizontal} />
                    <div style={crosshairVertical} />
                </div>
                <div style={hudCrosshairStyle({ bottom: '140px', right: '140px' }, crosshairScale, crosshairOpacity)}>
                    <div style={crosshairHorizontal} />
                    <div style={crosshairVertical} />
                </div>

                {/* Left Placement Window */}
                <div style={getPlaceholderStyle(true, hoverLeftY)}>
                    <div style={tlStyle} />
                    <div style={trStyle} />
                    <div style={blStyle} />
                    <div style={brStyle} />
                    <div style={scanlineStyle(scanYLeft)} />
                    <div style={sweepStyle(sweepXLeft)} />
                </div>

                {/* Right Placement Window */}
                <div style={getPlaceholderStyle(false, hoverRightY)}>
                    <div style={tlStyle} />
                    <div style={trStyle} />
                    <div style={blStyle} />
                    <div style={brStyle} />
                    <div style={scanlineStyle(scanYRight)} />
                    <div style={sweepStyle(sweepXRight)} />
                </div>

                {/* Centered Futuristic Interactive Hub */}
                <div style={subscribeCenterStyle(subPulseScale)}>
                    <div style={ringOuterStyle(outerRot)} />
                    <div style={ringDashedStyle(dashedRot)} />
                    <div style={ringInnerStyle(innerRot)} />
                    <div style={subscribeCoreStyle} />
                </div>
            </div>
        </div>
    );
};

export default FuturisticEsportsEndScreen;
// END_OF_FILE