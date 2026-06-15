import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLE_COUNT = 1000;
const PARTICLE_POSITIONS = new Float32Array(PARTICLE_COUNT * 3);
const PARTICLE_COLORS = new Float32Array(PARTICLE_COUNT * 3);

// Deterministic Pseudo-Random Generator (LCG)
let seed = 987654321;
function deterministicRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Pre-calculate positions and colors once outside component lifecycle
for (let i = 0; i < PARTICLE_COUNT; i++) {
    PARTICLE_POSITIONS[i * 3] = (deterministicRandom() - 0.5) * 1000;      // X
    PARTICLE_POSITIONS[i * 3 + 1] = (deterministicRandom() - 0.5) * 200;  // Y
    PARTICLE_POSITIONS[i * 3 + 2] = (deterministicRandom() - 0.5) * 1000; // Z

    const isCyan = deterministicRandom() > 0.5;
    if (isCyan) {
        PARTICLE_COLORS[i * 3] = 0.0;     // R
        PARTICLE_COLORS[i * 3 + 1] = 1.0; // G
        PARTICLE_COLORS[i * 3 + 2] = 1.0; // B
    } else {
        PARTICLE_COLORS[i * 3] = 1.0;     // R
        PARTICLE_COLORS[i * 3 + 1] = 0.0; // G
        PARTICLE_COLORS[i * 3 + 2] = 1.0; // B
    }
}

export const HudLandscape: React.FC = () => {
    const { width, height } = useVideoConfig();
    const frame = useCurrentFrame();
    
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const terrainBottomRef = useRef<THREE.Mesh | null>(null);
    const terrainTopRef = useRef<THREE.Mesh | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // 1. Initialize WebGL Scene
    useEffect(() => {
        if (!canvasRef.current) return;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1);
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050010, 0.0025);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 1, 1000);
        camera.position.set(0, 0, 0);
        cameraRef.current = camera;

        // Grid spacing segment: 50 units. Grid overall length: 4000.
        const gridGeometry = new THREE.PlaneGeometry(2000, 4000, 40, 80);
        const positionAttribute = gridGeometry.attributes.position;
        
        // Use a displacement frequency that loops perfectly with a Z movement of 1000 units
        const waveFreq = (2 * Math.PI * 2) / 1000; 
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            const displacement = Math.sin(x * 0.01) * Math.cos(y * waveFreq) * 40;
            positionAttribute.setZ(i, z + displacement);
        }
        gridGeometry.computeVertexNormals();

        const materialCyan = new THREE.MeshBasicMaterial({
            color: 0x00FFFF,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
        });

        const materialMagenta = new THREE.MeshBasicMaterial({
            color: 0xFF00FF,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
        });

        const terrainBottom = new THREE.Mesh(gridGeometry, materialCyan);
        terrainBottom.rotation.x = -Math.PI / 2;
        terrainBottom.position.y = -100;
        scene.add(terrainBottom);
        terrainBottomRef.current = terrainBottom;

        const terrainTop = new THREE.Mesh(gridGeometry, materialMagenta);
        terrainTop.rotation.x = Math.PI / 2;
        terrainTop.position.y = 100;
        scene.add(terrainTop);
        terrainTopRef.current = terrainTop;

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(PARTICLE_POSITIONS.slice(), 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(PARTICLE_COLORS.slice(), 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);
        particlesRef.current = particles;

        return () => {
            renderer.dispose();
            gridGeometry.dispose();
            materialCyan.dispose();
            materialMagenta.dispose();
            particleGeometry.dispose();
            particleMaterial.dispose();
        };
    }, []);

    // 2. Deterministic Render Effect per Frame
    useEffect(() => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

        const totalFrames = 600; // 10s at 60fps
        const progress = (frame % totalFrames) / totalFrames;

        // Perfect looping terrain position Z coordinate shift
        const zOffset = progress * 1000;
        if (terrainBottomRef.current) {
            terrainBottomRef.current.position.z = zOffset;
        }
        if (terrainTopRef.current) {
            terrainTopRef.current.position.z = zOffset;
        }

        // Seamless wrap of particles
        if (particlesRef.current) {
            const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const baseZ = PARTICLE_POSITIONS[i * 3 + 2];
                let z = baseZ + zOffset;
                z = ((z + 500) % 1000);
                if (z < 0) z += 1000;
                z -= 500;
                positions[i * 3 + 2] = z;
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Camera deterministic path matching 10s loop duration
        const angle = progress * Math.PI * 2;
        cameraRef.current.rotation.z = Math.sin(angle) * 0.05;
        cameraRef.current.position.y = Math.sin(angle * 2) * 10;

        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }, [frame]);

    // 3. Flowing path animations mapped perfectly to loop
    const flowLeftOffset = interpolate(frame % 600, [0, 600], [2000, 0]);
    const flowRightOffset = interpolate(frame % 600, [0, 600], [0, -2000]);
    const flowCircleOffset = interpolate(frame % 600, [0, 600], [1000, 0]);
    const flowCircleOffsetRev = interpolate(frame % 600, [0, 600], [0, 1000]);

    // Inline Styling Objects
    const wrapperStyle: React.CSSProperties = {
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#050010',
    };

    const canvasStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        zIndex: 1,
        // High fidelity bloom simulated safely in CSS filter layer
        filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.4)) drop-shadow(0 0 20px rgba(255, 0, 255, 0.2))',
    };

    const glitchStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(rgba(0,255,255,0.03) 50%, rgba(255,0,255,0.03) 50%)',
        backgroundSize: '100% 4px',
        zIndex: 1,
        mixBlendMode: 'screen',
    };

    const uiLayerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        zIndex: 2,
    };

    const hudBoxLeftStyle: React.CSSProperties = {
        position: 'absolute',
        width: 640,
        height: 360,
        top: 300,
        left: 200,
    };

    const hudBoxRightStyle: React.CSSProperties = {
        position: 'absolute',
        width: 640,
        height: 360,
        top: 300,
        right: 200,
    };

    const hudCircleStyle: React.CSSProperties = {
        position: 'absolute',
        width: 250,
        height: 250,
        bottom: 120,
        left: '50%',
        transform: 'translateX(-50%)',
    };

    const greenScreenStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#00FF00',
    };

    const greenScreenRoundStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#00FF00',
        borderRadius: '50%',
    };

    const hudBorderStyle: React.CSSProperties = {
        position: 'absolute',
        top: -10,
        left: -10,
        width: 'calc(100% + 20px)',
        height: 'calc(100% + 20px)',
        overflow: 'visible',
        zIndex: 3,
        filter: 'drop-shadow(0 0 8px #FF00FF) drop-shadow(0 0 15px #00FFFF)',
    };

    return (
        <div style={wrapperStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />
            <div style={glitchStyle} />
            <div style={uiLayerStyle}>
                
                {/* HUD Box Left */}
                <div style={hudBoxLeftStyle}>
                    <div style={greenScreenStyle} />
                    <svg style={hudBorderStyle} viewBox="0 0 660 380">
                        <rect 
                            style={{
                                fill: 'none',
                                strokeWidth: 4,
                                strokeLinecap: 'square',
                                stroke: '#00FFFF',
                                strokeDasharray: '200 1800',
                                strokeDashoffset: flowLeftOffset,
                            }}
                            x="10" 
                            y="10" 
                            width="640" 
                            height="360" 
                        />
                        <rect 
                            style={{
                                fill: 'none',
                                strokeWidth: 4,
                                strokeLinecap: 'square',
                                stroke: '#FF00FF',
                                strokeDasharray: '400 1600',
                                strokeDashoffset: flowRightOffset,
                            }}
                            x="6" 
                            y="6" 
                            width="648" 
                            height="368" 
                        />
                        <circle cx="10" cy="10" r="4" fill="#00FFFF" />
                        <circle cx="650" cy="10" r="4" fill="#00FFFF" />
                        <circle cx="10" cy="370" r="4" fill="#00FFFF" />
                        <circle cx="650" cy="370" r="4" fill="#00FFFF" />
                    </svg>
                </div>

                {/* HUD Box Right */}
                <div style={hudBoxRightStyle}>
                    <div style={greenScreenStyle} />
                    <svg style={hudBorderStyle} viewBox="0 0 660 380">
                        <rect 
                            style={{
                                fill: 'none',
                                strokeWidth: 4,
                                strokeLinecap: 'square',
                                stroke: '#00FFFF',
                                strokeDasharray: '200 1800',
                                strokeDashoffset: flowLeftOffset,
                            }}
                            x="10" 
                            y="10" 
                            width="640" 
                            height="360" 
                        />
                        <rect 
                            style={{
                                fill: 'none',
                                strokeWidth: 4,
                                strokeLinecap: 'square',
                                stroke: '#FF00FF',
                                strokeDasharray: '400 1600',
                                strokeDashoffset: flowRightOffset,
                            }}
                            x="6" 
                            y="6" 
                            width="648" 
                            height="368" 
                        />
                        <circle cx="10" cy="10" r="4" fill="#FF00FF" />
                        <circle cx="650" cy="10" r="4" fill="#FF00FF" />
                        <circle cx="10" cy="370" r="4" fill="#FF00FF" />
                        <circle cx="650" cy="370" r="4" fill="#FF00FF" />
                    </svg>
                </div>

                {/* HUD Circle */}
                <div style={hudCircleStyle}>
                    <div style={greenScreenRoundStyle} />
                    <svg style={hudBorderStyle} viewBox="0 0 270 270">
                        <circle 
                            style={{
                                fill: 'none',
                                strokeWidth: 4,
                                strokeLinecap: 'square',
                                stroke: '#00FFFF',
                                strokeDasharray: '200 1800',
                                strokeDashoffset: flowCircleOffset,
                            }}
                            cx="135" 
                            cy="135" 
                            r="125" 
                        />
                        <circle 
                            style={{
                                fill: 'none',
                                strokeWidth: 4,
                                strokeLinecap: 'square',
                                stroke: '#FF00FF',
                                strokeDasharray: '400 1600',
                                strokeDashoffset: flowCircleOffsetRev,
                            }}
                            cx="135" 
                            cy="135" 
                            r="130" 
                        />
                    </svg>
                </div>

            </div>
        </div>
    );
};

export default HudLandscape;
// END_OF_FILE