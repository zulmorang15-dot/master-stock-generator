import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic trail points pre-calculated to avoid Math.random() in render
const TRAIL_COUNT = 30;
const STATIC_TRAILS = Array.from({ length: TRAIL_COUNT }, (_, i: number) => {
    const sinX = Math.sin(i * 4.3);
    const cosY = Math.cos(i * 7.1);
    const sinZ = Math.sin(i * 12.8);
    const color = sinX > 0 ? 0x00ffff : 0x0044ff;
    return {
        x: sinX * 1250, // Range -1250 to 1250
        y: cosY * 600,   // Range -600 to 600
        z: sinZ * 1500,  // Range -1500 to 1500
        color: color,
    };
});

export const CinematicSciFiEsportsEndscreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const ringMesh1Ref = useRef<THREE.Mesh | null>(null);
    const ringMesh2Ref = useRef<THREE.Mesh | null>(null);
    const ringMesh3Ref = useRef<THREE.Points | null>(null);
    const gridHelperBottomRef = useRef<THREE.GridHelper | null>(null);
    const gridHelperTopRef = useRef<THREE.GridHelper | null>(null);
    const trailsRef = useRef<THREE.Mesh[]>([]);
    const chunk1Ref = useRef<THREE.Mesh | null>(null);
    const chunk2Ref = useRef<THREE.Mesh | null>(null);

    // Scaling Factor
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Synchronized GSAP equivalent values using frame interpolation
    // 15 seconds loop at 60fps = 900 frames
    const sr1Rotation = interpolate(frame % (fps * 15), [0, fps * 15], [0, 360]);
    const sr2Rotation = interpolate(frame % (fps * 15), [0, fps * 15], [0, -360]);

    // Core pulsing scale & shadow: 3 second full cycle (1.5s yoyo)
    const coreCycleFrame = frame % (fps * 3);
    const coreScale = interpolate(
        coreCycleFrame,
        [0, fps * 1.5, fps * 3],
        [1.0, 1.08, 1.0],
        { easing: Easing.inOut(Easing.sin) }
    );
    const coreGlow = interpolate(
        coreCycleFrame,
        [0, fps * 1.5, fps * 3],
        [20, 60, 20],
        { easing: Easing.inOut(Easing.sin) }
    );

    // Left/Right Video Slot Scanning Lines (3 second duration)
    const slLeftFrame = frame % (fps * 3);
    const slLeftTop = interpolate(slLeftFrame, [0, fps * 3], [-50, 330]);

    const slRightFrame = (frame + fps * 1.5) % (fps * 3);
    const slRightTop = interpolate(slRightFrame, [0, fps * 3], [-50, 330]);

    // Pulse overlay: inner pulse on video slots (3s full cycle)
    const pulseCycleFrame = frame % (fps * 3);
    const pulseOpacity = interpolate(
        pulseCycleFrame,
        [0, fps * 1.5, fps * 3],
        [0.1, 0.4, 0.1],
        { easing: Easing.inOut(Easing.sin) }
    );

    // Border and Glow Breathing on Slots (3s cycle)
    const borderCycleFrame = frame % (fps * 3);
    const slotBorderProgress = interpolate(
        borderCycleFrame,
        [0, fps * 1.5, fps * 3],
        [0, 1, 0],
        { easing: Easing.inOut(Easing.sin) }
    );
    const slotGlow = interpolate(
        borderCycleFrame,
        [0, fps * 1.5, fps * 3],
        [40, 60, 40],
        { easing: Easing.inOut(Easing.sin) }
    );

    const r = Math.round(interpolate(slotBorderProgress, [0, 1], [0, 0]));
    const g = Math.round(interpolate(slotBorderProgress, [0, 1], [255, 179]));
    const b = Math.round(interpolate(slotBorderProgress, [0, 1], [255, 179]));
    const currentBorderColor = `rgb(${r}, ${g}, ${b})`;

    // HUD Bar sliding accents (5s cycle)
    const hudTopCycleFrame = frame % (fps * 5);
    const hudTopLeft = interpolate(
        hudTopCycleFrame,
        [0, fps * 2.5, fps * 5],
        [0, 1100, 0],
        { easing: Easing.inOut(Easing.quad) }
    );

    const hudBottomCycleFrame = frame % (fps * 5);
    const hudBottomRight = interpolate(
        hudBottomCycleFrame,
        [0, fps * 2.5, fps * 5],
        [0, 700, 0],
        { easing: Easing.inOut(Easing.quad) }
    );

    // 1. Three.js Scene Setup (Mount / Unmount)
    useEffect(() => {
        if (!canvasRef.current) return;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1.0);
        renderer.toneMapping = THREE.ReinhardToneMapping;
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x010105, 0.0006);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 1, 5000);
        camera.position.set(0, 0, 800);
        cameraRef.current = camera;

        // Center Holographic Rings
        const centerGroup = new THREE.Group();
        scene.add(centerGroup);

        const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.8 });
        const blueMat = new THREE.MeshBasicMaterial({ color: 0x0033ff, wireframe: true });

        const ringGeo1 = new THREE.TorusGeometry(380, 15, 8, 64);
        const ringMesh1 = new THREE.Mesh(ringGeo1, cyanMat);
        centerGroup.add(ringMesh1);
        ringMesh1Ref.current = ringMesh1;

        const ringGeo2 = new THREE.TorusGeometry(320, 40, 4, 12);
        const ringMesh2 = new THREE.Mesh(ringGeo2, blueMat);
        centerGroup.add(ringMesh2);
        ringMesh2Ref.current = ringMesh2;

        const ringGeo3 = new THREE.TorusGeometry(450, 2, 8, 100);
        const ringMesh3 = new THREE.Points(ringGeo3, new THREE.PointsMaterial({ color: 0x00ffff, size: 4 }));
        centerGroup.add(ringMesh3);
        ringMesh3Ref.current = ringMesh3;

        // Cyberpunk Grids
        const gridHelperBottom = new THREE.GridHelper(6000, 120, 0x00aaff, 0x001133);
        gridHelperBottom.position.y = -400;
        scene.add(gridHelperBottom);
        gridHelperBottomRef.current = gridHelperBottom;

        const gridHelperTop = new THREE.GridHelper(6000, 120, 0x00aaff, 0x001133);
        gridHelperTop.position.y = 400;
        scene.add(gridHelperTop);
        gridHelperTopRef.current = gridHelperTop;

        // Trails
        const trailsGroup = new THREE.Group();
        scene.add(trailsGroup);
        const trailGeo = new THREE.BoxGeometry(8, 8, 400);
        const trails: THREE.Mesh[] = [];

        STATIC_TRAILS.forEach((t: { x: number; y: number; z: number; color: number; }) => {
            const mat = new THREE.MeshBasicMaterial({ color: t.color });
            const trail = new THREE.Mesh(trailGeo, mat);
            trail.position.set(t.x, t.y, t.z);
            trailsGroup.add(trail);
            trails.push(trail);
        });
        trailsRef.current = trails;

        // Geometric Parallax Chunks
        const geoChunks = new THREE.Group();
        scene.add(geoChunks);
        const octaGeo = new THREE.OctahedronGeometry(80, 0);

        const chunk1 = new THREE.Mesh(octaGeo, cyanMat);
        chunk1.position.set(-800, 200, 200);
        geoChunks.add(chunk1);
        chunk1Ref.current = chunk1;

        const chunk2 = new THREE.Mesh(octaGeo, cyanMat);
        chunk2.position.set(800, -200, 100);
        geoChunks.add(chunk2);
        chunk2Ref.current = chunk2;

        return () => {
            renderer.dispose();
            ringGeo1.dispose();
            ringGeo2.dispose();
            ringGeo3.dispose();
            trailGeo.dispose();
            octaGeo.dispose();
            cyanMat.dispose();
            blueMat.dispose();
        };
    }, []);

    // 2. Deterministic Rendering Keyed to Current Frame
    useEffect(() => {
        const time = frame / fps;

        // 1. Center Hologram rotations
        if (ringMesh1Ref.current) {
            ringMesh1Ref.current.rotation.z = time * 0.3;
            ringMesh1Ref.current.rotation.x = Math.sin(time * 0.5) * 0.3;
        }
        if (ringMesh2Ref.current) {
            ringMesh2Ref.current.rotation.z = -time * 0.5;
            ringMesh2Ref.current.rotation.y = Math.cos(time * 0.4) * 0.2;
        }
        if (ringMesh3Ref.current) {
            ringMesh3Ref.current.rotation.z = time * 0.1;
        }

        // 2. Grids motion
        const gridSpeed = 400;
        if (gridHelperBottomRef.current) {
            gridHelperBottomRef.current.position.z = (time * gridSpeed) % 120;
        }
        if (gridHelperTopRef.current) {
            gridHelperTopRef.current.position.z = (time * gridSpeed) % 120;
        }

        // 3. Trails frame-locked translation
        const trailSpeed = 3600; // units/second
        const minZ = -2500;
        const maxZ = 1200;
        const range = maxZ - minZ;
        trailsRef.current.forEach((trail: THREE.Mesh, index: number) => {
            const staticT = STATIC_TRAILS[index];
            const displacement = time * trailSpeed;
            let zPos = staticT.z + displacement;
            zPos = ((zPos - minZ) % range) + minZ;
            trail.position.z = zPos;
        });

        // 4. Parallax geometric chunks
        if (chunk1Ref.current) {
            chunk1Ref.current.rotation.x = time * 0.6;
            chunk1Ref.current.rotation.y = time * 1.2;
            chunk1Ref.current.position.y = 200 + Math.sin(time) * 50;
        }
        if (chunk2Ref.current) {
            chunk2Ref.current.rotation.x = -time * 1.2;
            chunk2Ref.current.rotation.y = -time * 0.6;
            chunk2Ref.current.position.y = -200 + Math.cos(time) * 50;
        }

        // 5. Immersive Cinematic Camera Drift
        if (cameraRef.current) {
            cameraRef.current.position.x = Math.sin(time * 0.4) * 60;
            cameraRef.current.position.y = Math.cos(time * 0.3) * 40;
            cameraRef.current.lookAt(0, 0, 0);
        }

        // 6. Draw Frame
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    }, [frame, fps]);

    // Styles mapped with camelCase keys
    const wrapperStyle: React.CSSProperties = {
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#010103',
        fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
    };

    const canvasStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        zIndex: 1,
        pointerEvents: 'none',
    };

    const uiLayerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        zIndex: 2,
        pointerEvents: 'none',
    };

    const hudBarTopStyle: React.CSSProperties = {
        position: 'absolute',
        height: 6,
        background: '#00ffff',
        boxShadow: '0 0 20px #00ffff',
        left: '50%',
        transform: 'translateX(-50%)',
        top: 120,
        width: 1200,
    };

    const hudAccentTopStyle: React.CSSProperties = {
        position: 'absolute',
        width: 100,
        height: 6,
        background: '#fff',
        boxShadow: '0 0 20px #fff',
        top: 0,
        left: hudTopLeft,
    };

    const hudBarBottomStyle: React.CSSProperties = {
        position: 'absolute',
        height: 6,
        background: '#00ffff',
        boxShadow: '0 0 20px #00ffff',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 120,
        width: 800,
    };

    const hudAccentBottomStyle: React.CSSProperties = {
        position: 'absolute',
        width: 100,
        height: 6,
        background: '#fff',
        boxShadow: '0 0 20px #fff',
        top: 0,
        right: hudBottomRight,
    };

    const hudBracketLeftStyle: React.CSSProperties = {
        position: 'absolute',
        width: 80,
        height: 180,
        border: '6px solid #00ffff',
        top: 450,
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
        left: 40,
        borderRight: 'none',
    };

    const hudBracketRightStyle: React.CSSProperties = {
        position: 'absolute',
        width: 80,
        height: 180,
        border: '6px solid #00ffff',
        top: 450,
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
        right: 40,
        borderLeft: 'none',
    };

    const videoSlotLeftStyle: React.CSSProperties = {
        position: 'absolute',
        width: 580,
        height: 326,
        top: 377,
        border: `6px solid ${currentBorderColor}`,
        boxSizing: 'border-box',
        background: 'rgba(0, 15, 35, 0.45)',
        backdropFilter: 'blur(12px)',
        boxShadow: `0 0 ${slotGlow}px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.15)`,
        overflow: 'hidden',
        left: 100,
    };

    const videoSlotRightStyle: React.CSSProperties = {
        position: 'absolute',
        width: 580,
        height: 326,
        top: 377,
        border: `6px solid ${currentBorderColor}`,
        boxSizing: 'border-box',
        background: 'rgba(0, 15, 35, 0.45)',
        backdropFilter: 'blur(12px)',
        boxShadow: `0 0 ${slotGlow}px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.15)`,
        overflow: 'hidden',
        right: 100,
    };

    const cornerStyle: React.CSSProperties = {
        position: 'absolute',
        width: 50,
        height: 50,
        border: '10px solid transparent',
        zIndex: 3,
    };

    const cornerTlStyle: React.CSSProperties = {
        ...cornerStyle,
        top: -10,
        left: -10,
        borderTopColor: '#fff',
        borderLeftColor: '#fff',
    };

    const cornerBrStyle: React.CSSProperties = {
        ...cornerStyle,
        bottom: -10,
        right: -10,
        borderBottomColor: '#fff',
        borderRightColor: '#fff',
    };

    const cornerTrStyle: React.CSSProperties = {
        ...cornerStyle,
        top: -10,
        right: -10,
        borderTopColor: '#fff',
        borderRightColor: '#fff',
    };

    const cornerBlStyle: React.CSSProperties = {
        ...cornerStyle,
        bottom: -10,
        left: -10,
        borderBottomColor: '#fff',
        borderLeftColor: '#fff',
    };

    const scanlineContainerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    };

    const scanlineStyle = (topVal: number): React.CSSProperties => ({
        position: 'absolute',
        top: topVal,
        left: 0,
        width: '100%',
        height: 50,
        background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.8), transparent)',
        opacity: 0.6,
    });

    const pulseOverlayStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        boxShadow: `inset 0 0 80px rgba(0, 255, 255, ${pulseOpacity})`,
    };

    const subSlotStyle: React.CSSProperties = {
        position: 'absolute',
        width: 380,
        height: 380,
        top: 350,
        left: 770,
        borderRadius: '50%',
        border: '8px solid #0055ff',
        boxShadow: '0 0 80px rgba(0, 85, 255, 0.6), inset 0 0 80px rgba(0, 85, 255, 0.3)',
        background: 'rgba(0, 10, 30, 0.5)',
        backdropFilter: 'blur(15px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const subRing1Style: React.CSSProperties = {
        position: 'absolute',
        width: 420,
        height: 420,
        borderRadius: '50%',
        border: '4px dashed #00ffff',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
        transform: `rotate(${sr1Rotation}deg)`,
    };

    const subRing2Style: React.CSSProperties = {
        position: 'absolute',
        width: 330,
        height: 330,
        borderRadius: '50%',
        border: '6px solid transparent',
        borderTopColor: '#00ffff',
        borderBottomColor: '#00ffff',
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.4)',
        transform: `rotate(${sr2Rotation}deg)`,
    };

    const subCoreStyle: React.CSSProperties = {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 255, 255, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
        border: '3px solid rgba(0, 255, 255, 0.6)',
        transform: `scale(${coreScale})`,
        boxShadow: `0 0 ${coreGlow}px rgba(0, 255, 255, 0.8)`,
    };

    return (
        <div style={wrapperStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />

            <div style={uiLayerStyle}>
                <div style={hudBarTopStyle}>
                    <div style={hudAccentTopStyle} />
                </div>

                <div style={hudBracketLeftStyle} />
                <div style={videoSlotLeftStyle}>
                    <div style={cornerTlStyle} />
                    <div style={cornerBrStyle} />
                    <div style={scanlineContainerStyle}>
                        <div style={scanlineStyle(slLeftTop)} />
                    </div>
                    <div style={pulseOverlayStyle} />
                </div>

                <div style={subSlotStyle}>
                    <div style={subRing1Style} />
                    <div style={subRing2Style} />
                    <div style={subCoreStyle} />
                </div>

                <div style={videoSlotRightStyle}>
                    <div style={cornerTrStyle} />
                    <div style={cornerBlStyle} />
                    <div style={scanlineContainerStyle}>
                        <div style={scanlineStyle(slRightTop)} />
                    </div>
                    <div style={pulseOverlayStyle} />
                </div>
                <div style={hudBracketRightStyle} />

                <div style={hudBarBottomStyle}>
                    <div style={hudAccentBottomStyle} />
                </div>
            </div>
        </div>
    );
};

export default CinematicSciFiEsportsEndscreen;
// END_OF_FILE