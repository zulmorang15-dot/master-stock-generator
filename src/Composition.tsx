import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const HudCrosshair: React.FC<{ style: React.CSSProperties; scale: number; opacity: number }> = ({ style, scale, opacity }) => {
    const combinedStyle: React.CSSProperties = {
        position: 'absolute',
        width: 20,
        height: 20,
        transform: `scale(${scale})`,
        opacity: opacity,
        ...style,
    };
    return (
        <div style={combinedStyle}>
            <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: '100%',
                height: 2,
                backgroundColor: '#0055ff',
                transform: 'translateY(-50%)'
            }} />
            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: 2,
                height: '100%',
                backgroundColor: '#0055ff',
                transform: 'translateX(-50%)'
            }} />
        </div>
    );
};

const EsportsEndScreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const gridHelperRef = useRef<THREE.GridHelper | null>(null);
    const waveMeshRef = useRef<THREE.Points | null>(null);
    const backgroundCoreRef = useRef<THREE.Mesh | null>(null);
    const outerCoreRef = useRef<THREE.Mesh | null>(null);
    const dustSystemRef = useRef<THREE.Points | null>(null);

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);
    const elapsedTime = frame / fps;

    // --- Three.js Environment Setup ---
    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x010308, 0.003);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
        camera.position.set(0, 15, 60);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1);
        rendererRef.current = renderer;

        // Seeded deterministic random generator for particles/dust setup
        let seed = 98765;
        const detRandom = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        // A. Cyber Grid Floor
        const gridHelper = new THREE.GridHelper(400, 100, 0x00ffff, 0x002266);
        gridHelper.position.y = -15;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.4;
        gridHelper.material.blending = THREE.AdditiveBlending;
        scene.add(gridHelper);
        gridHelperRef.current = gridHelper;

        // B. Holographic Energy Wave (Sine Particles)
        const waveCount = 5000;
        const wavePositions = new Float32Array(waveCount * 3);
        for (let i = 0; i < waveCount; i++) {
            const x = (detRandom() - 0.5) * 200;
            const z = (detRandom() - 0.5) * 200;
            wavePositions[i * 3] = x;
            wavePositions[i * 3 + 1] = 0;
            wavePositions[i * 3 + 2] = z;
        }
        const waveGeometry = new THREE.BufferGeometry();
        waveGeometry.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x00aaff,
            size: 0.6,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const waveMesh = new THREE.Points(waveGeometry, particleMat);
        waveMesh.position.y = -10;
        scene.add(waveMesh);
        waveMeshRef.current = waveMesh;

        // C. Center Core Emissive Spheres
        const coreGeo = new THREE.SphereGeometry(8, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x0055ff,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
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
            blending: THREE.AdditiveBlending
        });
        const outerCore = new THREE.Mesh(outerCoreGeo, outerCoreMat);
        scene.add(outerCore);
        outerCoreRef.current = outerCore;

        // D. Floating Emissive Dust
        const dustGeo = new THREE.BufferGeometry();
        const dustPos = [];
        for (let i = 0; i < 300; i++) {
            dustPos.push((detRandom() - 0.5) * 150);
            dustPos.push((detRandom() - 0.5) * 100);
            dustPos.push((detRandom() - 0.5) * 150);
        }
        dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
        const dustMat = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.8,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const dustSystem = new THREE.Points(dustGeo, dustMat);
        scene.add(dustSystem);
        dustSystemRef.current = dustSystem;

        return () => {
            gridHelper.geometry.dispose();
            (gridHelper.material as THREE.Material).dispose();
            waveGeometry.dispose();
            particleMat.dispose();
            coreGeo.dispose();
            coreMat.dispose();
            outerCoreGeo.dispose();
            outerCoreMat.dispose();
            dustGeo.dispose();
            dustMat.dispose();
            renderer.dispose();
        };
    }, []);

    // --- Deterministic Render Effect ---
    useEffect(() => {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        if (!scene || !camera || !renderer) return;

        // Camera Motion (Perfect 20s seamless loop)
        camera.position.x = Math.sin((elapsedTime / 20) * Math.PI * 2) * 2.5;
        camera.position.y = 15 + (Math.sin((elapsedTime / 10) * Math.PI * 2) + 1) * 1.5;
        camera.rotation.z = Math.sin((elapsedTime / 20) * Math.PI * 2) * 0.01;
        camera.rotation.x = -0.05 + Math.cos((elapsedTime / 20) * Math.PI * 2) * 0.01;

        // Cores Rotation
        if (backgroundCoreRef.current) {
            backgroundCoreRef.current.rotation.y = elapsedTime * 0.2;
            backgroundCoreRef.current.rotation.x = elapsedTime * 0.1;
        }
        if (outerCoreRef.current) {
            outerCoreRef.current.rotation.y = -elapsedTime * 0.15;
            outerCoreRef.current.rotation.z = elapsedTime * 0.1;
        }

        // Animated Wave Heights
        if (waveMeshRef.current) {
            const positions = waveMeshRef.current.geometry.attributes.position.array as Float32Array;
            const waveCount = 5000;
            for (let i = 0; i < waveCount; i++) {
                const x = positions[i * 3];
                const z = positions[i * 3 + 2];
                positions[i * 3 + 1] = Math.sin((x + elapsedTime * 10) * 0.05) * 4 +
                                     Math.cos((z + elapsedTime * 5) * 0.05) * 4;
            }
            waveMeshRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Infinite Grid Movement
        if (gridHelperRef.current) {
            gridHelperRef.current.position.z = (elapsedTime * 5) % 20;
        }

        // Dust rotation
        if (dustSystemRef.current) {
            dustSystemRef.current.rotation.y = elapsedTime * 0.03;
        }

        renderer.render(scene, camera);
    }, [frame, fps, elapsedTime]);

    // --- Dynamic UI Calculations (Looping UI) ---

    // Subtle floating animation for placeholders (10s cycle)
    const floatOffsetL = Math.sin((elapsedTime / 10) * Math.PI * 2) * 6;
    const floatOffsetR = Math.sin(((elapsedTime + 5) / 10) * Math.PI * 2) * 6;

    // Scanline translation (4s cycle)
    const scanProgressL = (elapsedTime % 4) / 4;
    const scanY_L = interpolate(scanProgressL, [0, 1], [-100, 100]);

    const scanProgressR = ((elapsedTime + 2) % 4) / 4;
    const scanY_R = interpolate(scanProgressR, [0, 1], [-100, 100]);

    // Sweeping energy line (5s cycle, sweeps across first 2 seconds, rests for 3)
    const sweepProgressL = (elapsedTime % 5) / 5;
    const sweepX_L = sweepProgressL < 0.4 ? interpolate(sweepProgressL, [0, 0.4], [-100, 200]) : 200;

    const sweepProgressR = ((elapsedTime + 3) % 5) / 5;
    const sweepX_R = sweepProgressR < 0.4 ? interpolate(sweepProgressR, [0, 0.4], [-100, 200]) : 200;

    // Center Subscriber Ring Rotations (Using divisors of 20s for perfect loop)
    const outerAngle = (elapsedTime / 10) * 360;
    const innerAngle = -(elapsedTime / 5) * 360;
    const dashedAngle = (elapsedTime / 20) * 360;

    // HUD Crosshair subtle pulse (2s cycle)
    const crosshairScale = 1.0 + (Math.sin((elapsedTime / 2) * Math.PI * 2) + 1) * 0.1;
    const crosshairOpacity = 0.4 + (Math.sin((elapsedTime / 2) * Math.PI * 2) + 1) * 0.1;

    // --- Style Objects ---
    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, #020b1f 0%, #010308 100%)',
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

    const placeholderBaseStyle: React.CSSProperties = {
        position: 'absolute',
        width: 580,
        height: 326,
        top: 377,
        background: 'rgba(0, 15, 30, 0.4)',
        border: '2px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
    };

    const placeholderLeftStyle: React.CSSProperties = {
        ...placeholderBaseStyle,
        left: 140,
        transform: `translateY(${floatOffsetL}px)`,
    };

    const placeholderRightStyle: React.CSSProperties = {
        ...placeholderBaseStyle,
        right: 140,
        transform: `translateY(${floatOffsetR}px)`,
    };

    const cornerStyle = (top?: number | string, bottom?: number | string, left?: number | string, right?: number | string, borderStyleObj?: React.CSSProperties): React.CSSProperties => ({
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#00ffff',
        borderStyle: 'solid',
        borderWidth: 0,
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
        zIndex: 3,
        top,
        bottom,
        left,
        right,
        ...borderStyleObj
    });

    const scanlineStyle = (yProgress: number): React.CSSProperties => ({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
        transform: `translateY(${yProgress}%)`,
    });

    const sweepStyle = (xProgress: number): React.CSSProperties => ({
        position: 'absolute',
        top: 0,
        left: `${xProgress}%`,
        width: '50%',
        height: '100%',
        background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
        transform: 'skewX(-25deg)',
    });

    const subscribeCenterStyle: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 340,
        height: 340,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const ringOuterStyle: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        border: '2px solid transparent',
        width: 340,
        height: 340,
        borderTop: '4px solid #00ffff',
        borderBottom: '4px solid #0055ff',
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
        transform: `rotate(${outerAngle}deg)`,
    };

    const ringInnerStyle: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        border: '2px solid transparent',
        width: 280,
        height: 280,
        borderLeft: '3px solid #0055ff',
        borderRight: '3px solid #00ffff',
        transform: `rotate(${innerAngle}deg)`,
    };

    const ringDashedStyle: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        width: 310,
        height: 310,
        border: '2px dashed rgba(0, 255, 255, 0.5)',
        transform: `rotate(${dashedAngle}deg)`,
    };

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

    const hudLineStyle = (top?: number, bottom?: number): React.CSSProperties => ({
        position: 'absolute',
        background: '#00ffff',
        opacity: 0.2,
        boxShadow: '0 0 10px #00ffff',
        left: 0,
        width: '100%',
        height: 1,
        top,
        bottom,
    });

    return (
        <div id="endscreen-container" style={containerStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />

            <div id="ui-layer" style={uiLayerStyle}>
                <div style={hudLineStyle(150, undefined)} />
                <div style={hudLineStyle(undefined, 150)} />

                <HudCrosshair style={{ top: 140, left: 140 }} scale={crosshairScale} opacity={crosshairOpacity} />
                <HudCrosshair style={{ top: 140, right: 140 }} scale={crosshairScale} opacity={crosshairOpacity} />
                <HudCrosshair style={{ bottom: 140, left: 140 }} scale={crosshairScale} opacity={crosshairOpacity} />
                <HudCrosshair style={{ bottom: 140, right: 140 }} scale={crosshairScale} opacity={crosshairOpacity} />

                {/* Left Placement Window */}
                <div style={placeholderLeftStyle}>
                    <div style={cornerStyle(-2, undefined, -2, undefined, { borderTopWidth: 4, borderLeftWidth: 4 })} />
                    <div style={cornerStyle(-2, undefined, undefined, -2, { borderTopWidth: 4, borderRightWidth: 4 })} />
                    <div style={cornerStyle(undefined, -2, -2, undefined, { borderBottomWidth: 4, borderLeftWidth: 4 })} />
                    <div style={cornerStyle(undefined, -2, undefined, -2, { borderBottomWidth: 4, borderRightWidth: 4 })} />
                    <div style={scanlineStyle(scanY_L)} />
                    <div style={sweepStyle(sweepX_L)} />
                </div>

                {/* Right Placement Window */}
                <div style={placeholderRightStyle}>
                    <div style={cornerStyle(-2, undefined, -2, undefined, { borderTopWidth: 4, borderLeftWidth: 4 })} />
                    <div style={cornerStyle(-2, undefined, undefined, -2, { borderTopWidth: 4, borderRightWidth: 4 })} />
                    <div style={cornerStyle(undefined, -2, -2, undefined, { borderBottomWidth: 4, borderLeftWidth: 4 })} />
                    <div style={cornerStyle(undefined, -2, undefined, -2, { borderBottomWidth: 4, borderRightWidth: 4 })} />
                    <div style={scanlineStyle(scanY_R)} />
                    <div style={sweepStyle(sweepX_R)} />
                </div>

                {/* Center Subscribe Core */}
                <div style={subscribeCenterStyle}>
                    <div style={ringOuterStyle} />
                    <div style={ringDashedStyle} />
                    <div style={ringInnerStyle} />
                    <div style={subscribeCoreStyle} />
                </div>
            </div>
        </div>
    );
};

export default EsportsEndScreen;
// END_OF_FILE