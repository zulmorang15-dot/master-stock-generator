import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const SEED_WAVE_COUNT = 3000;
const WAVE_POSITIONS = new Float32Array(SEED_WAVE_COUNT * 3);
const WAVE_PHASES = new Float32Array(SEED_WAVE_COUNT);

let seed = 12345;
function pseudoRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

for (let i = 0; i < SEED_WAVE_COUNT; i++) {
    const x = (pseudoRandom() - 0.5) * 200;
    const z = (pseudoRandom() - 0.5) * 200;
    WAVE_POSITIONS[i * 3] = x;
    WAVE_POSITIONS[i * 3 + 1] = 0;
    WAVE_POSITIONS[i * 3 + 2] = z;
    WAVE_PHASES[i] = pseudoRandom() * Math.PI * 2;
}

const SEED_DUST_COUNT = 300;
const DUST_POSITIONS = new Float32Array(SEED_DUST_COUNT * 3);
for (let i = 0; i < SEED_DUST_COUNT; i++) {
    DUST_POSITIONS[i * 3] = (pseudoRandom() - 0.5) * 150;
    DUST_POSITIONS[i * 3 + 1] = (pseudoRandom() - 0.5) * 100;
    DUST_POSITIONS[i * 3 + 2] = (pseudoRandom() - 0.5) * 150;
}

const EsportsEndScreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const gridRef = useRef<THREE.GridHelper | null>(null);
    const waveMeshRef = useRef<THREE.Points | null>(null);
    const backgroundCoreRef = useRef<THREE.Mesh | null>(null);
    const outerCoreRef = useRef<THREE.Mesh | null>(null);
    const dustSystemRef = useRef<THREE.Points | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x010308, 0.003);

        const camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 0.1, 1000);
        camera.position.set(0, 15, 60);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true
        });
        renderer.setSize(1920, 1080);
        renderer.setPixelRatio(1);

        const gridHelper = new THREE.GridHelper(400, 100, 0x00ffff, 0x002266);
        gridHelper.position.y = -15;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.4;
        gridHelper.material.blending = THREE.AdditiveBlending;
        scene.add(gridHelper);

        const waveGeometry = new THREE.BufferGeometry();
        waveGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WAVE_POSITIONS), 3));
        waveGeometry.setAttribute('phase', new THREE.BufferAttribute(new Float32Array(WAVE_PHASES), 1));

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

        const dustGeo = new THREE.BufferGeometry();
        dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(DUST_POSITIONS), 3));
        const dustMat = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.8,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const dustSystem = new THREE.Points(dustGeo, dustMat);
        scene.add(dustSystem);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        gridRef.current = gridHelper;
        waveMeshRef.current = waveMesh;
        backgroundCoreRef.current = backgroundCore;
        outerCoreRef.current = outerCore;
        dustSystemRef.current = dustSystem;

        return () => {
            renderer.dispose();
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
        };
    }, []);

    useEffect(() => {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const gridHelper = gridRef.current;
        const waveMesh = waveMeshRef.current;
        const backgroundCore = backgroundCoreRef.current;
        const outerCore = outerCoreRef.current;
        const dustSystem = dustSystemRef.current;

        if (!scene || !camera || !renderer) return;

        const elapsedTime = frame / fps;

        const camX = Math.sin((elapsedTime / 10) * Math.PI * 2) * 2.5;
        const camY = 15 + Math.cos((elapsedTime / 10) * Math.PI * 2) * 1.5;
        camera.position.set(camX, camY, 60);

        camera.rotation.z = Math.sin((elapsedTime / 20) * Math.PI * 2) * 0.01;
        camera.rotation.x = -0.025 + Math.cos((elapsedTime / 20) * Math.PI * 2) * 0.025;

        if (backgroundCore) {
            backgroundCore.rotation.y = elapsedTime * (Math.PI * 2 / 10);
            backgroundCore.rotation.x = elapsedTime * (Math.PI * 2 / 20);
        }
        if (outerCore) {
            outerCore.rotation.y = -elapsedTime * (Math.PI * 2 / 5);
            outerCore.rotation.z = elapsedTime * (Math.PI * 2 / 10);
        }

        if (gridHelper) {
            gridHelper.position.z = (elapsedTime * 5) % 20;
        }

        if (dustSystem) {
            dustSystem.rotation.y = elapsedTime * (Math.PI * 2 / 20);
        }

        if (waveMesh) {
            const positions = waveMesh.geometry.attributes.position.array as Float32Array;
            const waveTime = elapsedTime % 20;
            const timeTerm1 = waveTime * (Math.PI * 2 / 20) * 10;
            const timeTerm2 = waveTime * (Math.PI * 2 / 20) * 5;

            for (let i = 0; i < SEED_WAVE_COUNT; i++) {
                const x = positions[i * 3];
                const z = positions[i * 3 + 2];
                positions[i * 3 + 1] = Math.sin(x * 0.05 + timeTerm1) * 4 + 
                                     Math.cos(z * 0.05 + timeTerm2) * 4;
            }
            waveMesh.geometry.attributes.position.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }, [frame, fps]);

    const leftScanlineTranslateY = interpolate(
        frame % (fps * 4),
        [0, fps * 4],
        [-100, 100],
        { easing: Easing.linear }
    );

    const rightScanlineTranslateY = interpolate(
        (frame + fps * 2) % (fps * 4),
        [0, fps * 4],
        [-100, 100],
        { easing: Easing.linear }
    );

    const leftSweepProgress = frame % (fps * 5);
    const leftSweepLeft = leftSweepProgress < fps * 1.2
        ? interpolate(leftSweepProgress, [0, fps * 1.2], [-100, 200], { easing: Easing.bezier(0.19, 1, 0.22, 1) })
        : 200;

    const rightSweepProgress = (frame + fps * 2.5) % (fps * 5);
    const rightSweepLeft = rightSweepProgress < fps * 1.2
        ? interpolate(rightSweepProgress, [0, fps * 1.2], [-100, 200], { easing: Easing.bezier(0.19, 1, 0.22, 1) })
        : 200;

    const rotateOuter = interpolate(
        frame % (fps * 10),
        [0, fps * 10],
        [0, 360],
        { easing: Easing.linear }
    );

    const rotateInner = interpolate(
        frame % (fps * 5),
        [0, fps * 5],
        [360, 0],
        { easing: Easing.linear }
    );

    const rotateDashed = interpolate(
        frame % (fps * 20),
        [0, fps * 20],
        [0, 360],
        { easing: Easing.linear }
    );

    const crosshairTime = frame % (fps * 4);
    const crosshairScale = interpolate(
        crosshairTime,
        [0, fps * 2, fps * 4],
        [1, 1.2, 1],
        { easing: Easing.inOut(Easing.quad) }
    );
    const crosshairOpacity = interpolate(
        crosshairTime,
        [0, fps * 2, fps * 4],
        [1, 0.4, 1],
        { easing: Easing.inOut(Easing.quad) }
    );

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
    };

    const placeholderRightStyle: React.CSSProperties = {
        ...placeholderBaseStyle,
        right: 140,
    };

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

    const cornerTlStyle: React.CSSProperties = { ...cornerBaseStyle, top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 };
    const cornerTrStyle: React.CSSProperties = { ...cornerBaseStyle, top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 };
    const cornerBlStyle: React.CSSProperties = { ...cornerBaseStyle, bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 };
    const cornerBrStyle: React.CSSProperties = { ...cornerBaseStyle, bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 };

    const scanlineBaseStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
    };

    const sweepBaseStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        width: '50%',
        height: '100%',
        background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
        transform: 'skewX(-25deg)',
    };

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

    const hologramRingStyle: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        border: '2px solid transparent',
    };

    const ringOuterStyle: React.CSSProperties = {
        ...hologramRingStyle,
        width: 340,
        height: 340,
        borderTop: '4px solid #00ffff',
        borderBottom: '4px solid #0055ff',
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
        transform: `rotate(${rotateOuter}deg)`,
    };

    const ringInnerStyle: React.CSSProperties = {
        ...hologramRingStyle,
        width: 280,
        height: 280,
        borderLeft: '3px solid #0055ff',
        borderRight: '3px solid #00ffff',
        transform: `rotate(${rotateInner}deg)`,
    };

    const ringDashedStyle: React.CSSProperties = {
        ...hologramRingStyle,
        width: 310,
        height: 310,
        border: '2px dashed rgba(0, 255, 255, 0.5)',
        transform: `rotate(${rotateDashed}deg)`,
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

    const hudLineStyle = (positionProps: React.CSSProperties): React.CSSProperties => ({
        position: 'absolute',
        background: '#00ffff',
        opacity: 0.2,
        boxShadow: '0 0 10px #00ffff',
        left: 0,
        width: '100%',
        height: 1,
        ...positionProps,
    });

    const hudCrosshairBaseStyle: React.CSSProperties = {
        position: 'absolute',
        width: 20,
        height: 20,
    };

    const crosshairBeforeStyle: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: 0,
        width: '100%',
        height: 2,
        background: '#0055ff',
        transform: 'translateY(-50%)',
    };

    const crosshairAfterStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: '50%',
        width: 2,
        height: '100%',
        background: '#0055ff',
        transform: 'translateX(-50%)',
    };

    const crosshairStyle = (positionProps: React.CSSProperties): React.CSSProperties => ({
        ...hudCrosshairBaseStyle,
        ...positionProps,
        transform: `scale(${crosshairScale})`,
        opacity: crosshairOpacity,
    });

    return (
        <div style={containerStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />

            <div style={uiLayerStyle}>
                <div style={hudLineStyle({ top: 150 })} />
                <div style={hudLineStyle({ bottom: 150 })} />

                <div style={crosshairStyle({ top: 140, left: 140 })}>
                    <div style={crosshairBeforeStyle} />
                    <div style={crosshairAfterStyle} />
                </div>
                <div style={crosshairStyle({ top: 140, right: 140 })}>
                    <div style={crosshairBeforeStyle} />
                    <div style={crosshairAfterStyle} />
                </div>
                <div style={crosshairStyle({ bottom: 140, left: 140 })}>
                    <div style={crosshairBeforeStyle} />
                    <div style={crosshairAfterStyle} />
                </div>
                <div style={crosshairStyle({ bottom: 140, right: 140 })}>
                    <div style={crosshairBeforeStyle} />
                    <div style={crosshairAfterStyle} />
                </div>

                <div style={placeholderLeftStyle}>
                    <div style={cornerTlStyle} />
                    <div style={cornerTrStyle} />
                    <div style={cornerBlStyle} />
                    <div style={cornerBrStyle} />
                    <div style={{ ...scanlineBaseStyle, transform: `translateY(${leftScanlineTranslateY}%)` }} />
                    <div style={{ ...sweepBaseStyle, left: `${leftSweepLeft}%` }} />
                </div>

                <div style={placeholderRightStyle}>
                    <div style={cornerTlStyle} />
                    <div style={cornerTrStyle} />
                    <div style={cornerBlStyle} />
                    <div style={cornerBrStyle} />
                    <div style={{ ...scanlineBaseStyle, transform: `translateY(${rightScanlineTranslateY}%)` }} />
                    <div style={{ ...sweepBaseStyle, left: `${rightSweepLeft}%` }} />
                </div>

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