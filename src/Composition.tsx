import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Pre-calculated deterministic values for Three.js particles (outside component to prevent Math.random during render)
const WAVE_COUNT = 3000;
const waveData = Array.from({ length: WAVE_COUNT }, () => {
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    const phase = Math.random() * Math.PI * 2;
    return { x, z, phase };
});

const DUST_COUNT = 300;
const dustData = Array.from({ length: DUST_COUNT }, () => {
    const x = (Math.random() - 0.5) * 150;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 150;
    return { x, y, z };
});

const FuturisticEsportsEndScreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    // Canvas references for WebGL
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const gridHelperRef = useRef<THREE.GridHelper | null>(null);
    const waveMeshRef = useRef<THREE.Points | null>(null);
    const backgroundCoreRef = useRef<THREE.Mesh | null>(null);
    const outerCoreRef = useRef<THREE.Mesh | null>(null);
    const dustSystemRef = useRef<THREE.Points | null>(null);

    // Scaling Factor
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Initial Three.js setup
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
            antialias: true,
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1);
        rendererRef.current = renderer;

        // A. Cyber Grid Floor
        const gridHelper = new THREE.GridHelper(400, 100, 0x00ffff, 0x002266);
        gridHelper.position.y = -15;
        if (Array.isArray(gridHelper.material)) {
            gridHelper.material.forEach((m) => {
                m.transparent = true;
                m.opacity = 0.4;
                m.blending = THREE.AdditiveBlending;
            });
        } else {
            gridHelper.material.transparent = true;
            gridHelper.material.opacity = 0.4;
            gridHelper.material.blending = THREE.AdditiveBlending;
        }
        scene.add(gridHelper);
        gridHelperRef.current = gridHelper;

        // B. Holographic Energy Wave Particles
        const waveGeometry = new THREE.BufferGeometry();
        const wavePositions = new Float32Array(WAVE_COUNT * 3);
        const wavePhases = new Float32Array(WAVE_COUNT);

        for (let i = 0; i < WAVE_COUNT; i++) {
            wavePositions[i * 3] = waveData[i].x;
            wavePositions[i * 3 + 1] = 0;
            wavePositions[i * 3 + 2] = waveData[i].z;
            wavePhases[i] = waveData[i].phase;
        }

        waveGeometry.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
        waveGeometry.setAttribute('phase', new THREE.BufferAttribute(wavePhases, 1));

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

        // C. Emissive Spheres
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

        // D. Floating Dust
        const dustGeo = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(DUST_COUNT * 3);
        for (let i = 0; i < DUST_COUNT; i++) {
            dustPositions[i * 3] = dustData[i].x;
            dustPositions[i * 3 + 1] = dustData[i].y;
            dustPositions[i * 3 + 2] = dustData[i].z;
        }
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
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
            coreGeo.dispose();
            coreMat.dispose();
            outerCoreGeo.dispose();
            outerCoreMat.dispose();
            waveGeometry.dispose();
            particleMat.dispose();
            dustGeo.dispose();
            dustMat.dispose();
            gridHelper.dispose();
        };
    }, []);

    // Frame-locked deterministic updates for Three.js (no requestAnimationFrame)
    useEffect(() => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const backgroundCore = backgroundCoreRef.current;
        const outerCore = outerCoreRef.current;
        const waveMesh = waveMeshRef.current;
        const gridHelper = gridHelperRef.current;
        const dustSystem = dustSystemRef.current;

        if (!renderer || !scene || !camera) return;

        const elapsedTime = frame / fps;

        // Rotate Core Elements
        if (backgroundCore) {
            backgroundCore.rotation.y = elapsedTime * 0.2;
            backgroundCore.rotation.x = elapsedTime * 0.1;
        }
        if (outerCore) {
            outerCore.rotation.y = -elapsedTime * 0.15;
            outerCore.rotation.z = elapsedTime * 0.1;
        }

        // Animate Wave Heights
        if (waveMesh) {
            const positions = waveMesh.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < WAVE_COUNT; i++) {
                const x = waveData[i].x;
                const z = waveData[i].z;
                const phase = waveData[i].phase;
                positions[i * 3 + 1] =
                    Math.sin((x + elapsedTime * 10) * 0.05 + phase) * 4 +
                    Math.cos((z + elapsedTime * 5) * 0.05 + phase) * 4;
            }
            waveMesh.geometry.attributes.position.needsUpdate = true;
        }

        // Move Grid Floor Loop
        if (gridHelper) {
            gridHelper.position.z = (elapsedTime * 5) % 20;
        }

        // Rotate Dust Particles slowly (perfect 20s seamless wrap)
        if (dustSystem) {
            dustSystem.rotation.y = (elapsedTime / 20) * Math.PI * 2;
        }

        // Camera Drift / Symmetrical looping float
        const cameraAngle = (elapsedTime / 20) * Math.PI * 2;
        camera.position.x = Math.sin(cameraAngle * 2) * 2.5; 
        camera.position.y = 15 + Math.cos(cameraAngle * 2) * 1.5; 
        camera.rotation.z = Math.sin(cameraAngle) * 0.01;
        camera.rotation.x = -0.15 + Math.cos(cameraAngle) * 0.02;

        renderer.render(scene, camera);
    }, [frame, fps]);

    // UI Animations driven completely by useCurrentFrame()

    // Breathing loop for HUD
    const breatheCycle = (frame / 120) * Math.PI * 2; // 2 seconds loop (120 frames at 60fps)
    const hudScale = interpolate(Math.sin(breatheCycle), [-1, 1], [0.95, 1.15]);
    const hudOpacity = interpolate(Math.sin(breatheCycle), [-1, 1], [0.3, 0.6]);

    // Placeholders smooth float (Symmetrical loop)
    const leftFloatY = Math.sin((frame / 240) * Math.PI * 2) * 8; 
    const rightFloatY = Math.cos((frame / 240) * Math.PI * 2) * 8;

    // Scanlines TranslateY looping over 4s (240 frames)
    const scanFrameLeft = frame % 240;
    const scanYLeft = interpolate(scanFrameLeft, [0, 240], [-100, 100]);

    const scanFrameRight = (frame + 120) % 240; // Offset by 2 seconds
    const scanYRight = interpolate(scanFrameRight, [0, 240], [-100, 100]);

    // Sweeps Loop over 6s (360 frames)
    // 0% to 20% maps to -100% to 200%, remainder stays at 200%
    const sweepFrameLeft = frame % 360;
    const sweepXLeft = interpolate(sweepFrameLeft, [0, 72, 360], [-100, 200, 200]);

    const sweepFrameRight = (frame + 180) % 360; // Offset by 3 seconds
    const sweepXRight = interpolate(sweepFrameRight, [0, 72, 360], [-100, 200, 200]);

    // Hologram Ring Rotations
    const ringOuterRotation = interpolate(frame % 720, [0, 720], [0, 360]); // 12s
    const ringInnerRotation = interpolate(frame % 480, [0, 480], [360, 0]); // 8s reverse
    const ringDashedRotation = interpolate(frame % 1200, [0, 1200], [0, 360]); // 20s

    // Center Core Scale Loop
    const centerCoreScale = interpolate(Math.sin((frame / 120) * Math.PI * 2), [-1, 1], [0.98, 1.02]);

    // Shared Styles
    const cornerStyle: React.CSSProperties = {
        position: 'absolute',
        width: '40px',
        height: '40px',
        borderColor: '#00ffff',
        borderStyle: 'solid',
        borderWidth: 0,
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
        zIndex: 3,
    };

    const crosshairStyle: React.CSSProperties = {
        position: 'absolute',
        width: '20px',
        height: '20px',
    };

    return (
        <div
            id="endscreen-container"
            style={{
                position: 'absolute',
                width: ORIGINAL_WIDTH,
                height: ORIGINAL_HEIGHT,
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${scaleFactor})`,
                transformOrigin: 'center center',
                overflow: 'hidden',
                backgroundColor: '#010308',
                background: 'radial-gradient(circle at center, #020b1f 0%, #010308 100%)',
            }}
        >
            <canvas ref={canvasRef} id="webgl-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />

            <div id="ui-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
                
                {/* HUD Lines */}
                <div style={{ position: 'absolute', top: '150px', left: 0, width: '100%', height: '1px', backgroundColor: '#00ffff', opacity: 0.2, boxShadow: '0 0 10px #00ffff' }}></div>
                <div style={{ position: 'absolute', bottom: '150px', left: 0, width: '100%', height: '1px', backgroundColor: '#00ffff', opacity: 0.2, boxShadow: '0 0 10px #00ffff' }}></div>

                {/* HUD Crosshairs */}
                <div style={{ ...crosshairStyle, top: '140px', left: '140px', transform: `scale(${hudScale})`, opacity: hudOpacity }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', backgroundColor: '#0055ff', transform: 'translateY(-50%)' }}></div>
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '2px', height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }}></div>
                </div>
                <div style={{ ...crosshairStyle, top: '140px', right: '140px', transform: `scale(${hudScale})`, opacity: hudOpacity }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', backgroundColor: '#0055ff', transform: 'translateY(-50%)' }}></div>
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '2px', height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }}></div>
                </div>
                <div style={{ ...crosshairStyle, bottom: '140px', left: '140px', transform: `scale(${hudScale})`, opacity: hudOpacity }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', backgroundColor: '#0055ff', transform: 'translateY(-50%)' }}></div>
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '2px', height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }}></div>
                </div>
                <div style={{ ...crosshairStyle, bottom: '140px', right: '140px', transform: `scale(${hudScale})`, opacity: hudOpacity }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', backgroundColor: '#0055ff', transform: 'translateY(-50%)' }}></div>
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '2px', height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }}></div>
                </div>

                {/* Left Placeholder */}
                <div 
                    className="placeholder left"
                    style={{
                        position: 'absolute',
                        width: '580px',
                        height: '326px',
                        top: '377px',
                        left: '140px',
                        background: 'rgba(0, 15, 30, 0.4)',
                        border: '2px solid rgba(0, 255, 255, 0.3)',
                        boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                        overflow: 'hidden',
                        transform: `translateY(${leftFloatY}px)`,
                    }}
                >
                    <div style={{ ...cornerStyle, top: '-2px', left: '-2px', borderTopWidth: '4px', borderLeftWidth: '4px' }}></div>
                    <div style={{ ...cornerStyle, top: '-2px', right: '-2px', borderTopWidth: '4px', borderRightWidth: '4px' }}></div>
                    <div style={{ ...cornerStyle, bottom: '-2px', left: '-2px', borderBottomWidth: '4px', borderLeftWidth: '4px' }}></div>
                    <div style={{ ...cornerStyle, bottom: '-2px', right: '-2px', borderBottomWidth: '4px', borderRightWidth: '4px' }}></div>
                    <div 
                        className="scanline"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
                            transform: `translateY(${scanYLeft}%)`,
                        }}
                    ></div>
                    <div 
                        className="sweep"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '50%',
                            height: '100%',
                            background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
                            transform: `translateX(${sweepXLeft}%) skewX(-25deg)`,
                        }}
                    ></div>
                </div>

                {/* Right Placeholder */}
                <div 
                    className="placeholder right"
                    style={{
                        position: 'absolute',
                        width: '580px',
                        height: '326px',
                        top: '377px',
                        right: '140px',
                        background: 'rgba(0, 15, 30, 0.4)',
                        border: '2px solid rgba(0, 255, 255, 0.3)',
                        boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                        overflow: 'hidden',
                        transform: `translateY(${rightFloatY}px)`,
                    }}
                >
                    <div style={{ ...cornerStyle, top: '-2px', left: '-2px', borderTopWidth: '4px', borderLeftWidth: '4px' }}></div>
                    <div style={{ ...cornerStyle, top: '-2px', right: '-2px', borderTopWidth: '4px', borderRightWidth: '4px' }}></div>
                    <div style={{ ...cornerStyle, bottom: '-2px', left: '-2px', borderBottomWidth: '4px', borderLeftWidth: '4px' }}></div>
                    <div style={{ ...cornerStyle, bottom: '-2px', right: '-2px', borderBottomWidth: '4px', borderRightWidth: '4px' }}></div>
                    <div 
                        className="scanline"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
                            transform: `translateY(${scanYRight}%)`,
                        }}
                    ></div>
                    <div 
                        className="sweep"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '50%',
                            height: '100%',
                            background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
                            transform: `translateX(${sweepXRight}%) skewX(-25deg)`,
                        }}
                    ></div>
                </div>

                {/* Center Subscribe Area */}
                <div 
                    className="subscribe-center"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '340px',
                        height: '340px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {/* Ring Outer */}
                    <div 
                        className="hologram-ring ring-outer"
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            width: '340px',
                            height: '340px',
                            borderTop: '4px solid #00ffff',
                            borderBottom: '4px solid #0055ff',
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
                            transform: `rotate(${ringOuterRotation}deg)`,
                        }}
                    ></div>

                    {/* Ring Dashed */}
                    <div 
                        className="hologram-ring ring-dashed"
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            width: '310px',
                            height: '310px',
                            border: '2px dashed rgba(0, 255, 255, 0.5)',
                            transform: `rotate(${ringDashedRotation}deg)`,
                        }}
                    ></div>

                    {/* Ring Inner */}
                    <div 
                        className="hologram-ring ring-inner"
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            width: '280px',
                            height: '280px',
                            borderLeft: '3px solid #0055ff',
                            borderRight: '3px solid #00ffff',
                            borderTop: '3px solid transparent',
                            borderBottom: '3px solid transparent',
                            transform: `rotate(${ringInnerRotation}deg)`,
                        }}
                    ></div>

                    {/* Core */}
                    <div 
                        className="subscribe-core"
                        style={{
                            width: '220px',
                            height: '220px',
                            borderRadius: '50%',
                            background: 'rgba(0, 20, 40, 0.6)',
                            border: '4px solid #00ffff',
                            boxShadow: '0 0 50px rgba(0, 255, 255, 0.5), inset 0 0 40px rgba(0, 85, 255, 0.5)',
                            backdropFilter: 'blur(12px)',
                            position: 'relative',
                            zIndex: 10,
                            transform: `scale(${centerCoreScale})`,
                        }}
                    ></div>
                </div>

            </div>
        </div>
    );
};

export default FuturisticEsportsEndScreen;
// END_OF_FILE