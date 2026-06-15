import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

// Deterministic seed-based pseudorandom generator for particles to prevent Math.random() drift
const createDeterministicRandom = (seed: number) => {
    let s = seed;
    return () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
};

const rand = createDeterministicRandom(12345);
const PARTICLE_COUNT = 1500;
const PARTICLE_DATA = Array.from({ length: PARTICLE_COUNT }, () => {
    return {
        x: (rand() - 0.5) * 80,
        y: (rand() - 0.5) * 80,
        z: (rand() - 0.5) * 1000,
        random: rand(),
    };
});

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CyberpunkEndScreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const tunnelMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
    const particleMatRef = useRef<THREE.ShaderMaterial | null>(null);

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Three.js Scene Setup (Runs once on mount)
    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.002);

        const camera = new THREE.PerspectiveCamera(85, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
        camera.position.z = 0;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: false,
            antialias: true,
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1);

        // Infinite Volumetric Tunnel Geometry
        const tunnelGeo = new THREE.CylinderGeometry(50, 50, 1000, 32, 64, true);
        tunnelGeo.rotateX(Math.PI / 2);

        const tunnelMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float angle = uv.x * 3.14159 * 2.0;
                    float wave = sin(uv.y * 60.0 - time * 3.14159 * 2.0 * 10.0) * 3.0;
                    pos.x += cos(angle) * wave;
                    pos.y += sin(angle) * wave;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                void main() {
                    vec2 st = vUv;
                    st.y = st.y * 20.0 - time * 20.0; 
                    st.x = st.x * 16.0;

                    vec2 grid = abs(fract(st) - 0.5);
                    float line = smoothstep(0.40, 0.45, max(grid.x, grid.y));

                    vec3 color1 = vec3(0.0, 1.0, 1.0); // Hot Cyan
                    vec3 color2 = vec3(1.0, 0.0, 1.0); // Deep Magenta
                    vec3 color = mix(color1, color2, sin(vUv.y * 10.0 + time * 6.2831) * 0.5 + 0.5);

                    float glitch = step(0.96, fract(sin(dot(floor(st), vec2(12.9898,78.233))) * 43758.5453 + time * 5.0));
                    float brightness = line * (0.3 + glitch * 2.0);

                    float fog = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.8, vUv.y);

                    gl_FragColor = vec4(color * brightness, fog);
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const tunnel = new THREE.Mesh(tunnelGeo, tunnelMaterial);
        scene.add(tunnel);

        // Particle System
        const particleGeo = new THREE.BufferGeometry();
        const posArray = new Float32Array(PARTICLE_COUNT * 3);
        const randomArray = new Float32Array(PARTICLE_COUNT);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const pt = PARTICLE_DATA[i];
            posArray[i * 3] = pt.x;
            posArray[i * 3 + 1] = pt.y;
            posArray[i * 3 + 2] = pt.z;
            randomArray[i] = pt.random;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particleGeo.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));

        const particleMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
            },
            vertexShader: `
                uniform float time;
                attribute float aRandom;
                varying float vAlpha;
                void main() {
                    vec3 pos = position;
                    float speed = 800.0;
                    pos.z += time * speed * (0.5 + aRandom * 0.5);
                    pos.z = mod(pos.z + 500.0, 1000.0) - 500.0;
                    vAlpha = smoothstep(0.0, 0.2, abs(pos.z) / 500.0);
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = (12.0 * aRandom) / -mvPosition.z;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    if(length(coord) > 0.5) discard;
                    gl_FragColor = vec4(1.0, 0.0, 1.0, (1.0 - vAlpha) * 0.9);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        tunnelMaterialRef.current = tunnelMaterial;
        particleMatRef.current = particleMat;

        return () => {
            renderer.dispose();
            tunnelGeo.dispose();
            tunnelMaterial.dispose();
            particleGeo.dispose();
            particleMat.dispose();
        };
    }, []);

    // Deterministic Frame-by-Frame Render Loop
    useEffect(() => {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        const tunnelMat = tunnelMaterialRef.current;
        const particleMat = particleMatRef.current;

        if (!scene || !camera || !renderer || !tunnelMat || !particleMat) return;

        // Sync to a flawless 20.0s seamless loop
        const LOOP_DURATION = 20.0;
        const elapsedTime = frame / fps;
        const normalizedTime = (elapsedTime % LOOP_DURATION) / LOOP_DURATION;

        tunnelMat.uniforms.time.value = normalizedTime;
        particleMat.uniforms.time.value = normalizedTime;

        camera.rotation.z = Math.sin(normalizedTime * Math.PI * 2.0) * 0.1;
        camera.position.x = Math.cos(normalizedTime * Math.PI * 2.0) * 2.0;
        camera.position.y = Math.sin(normalizedTime * Math.PI * 2.0) * 2.0;

        renderer.render(scene, camera);
    }, [frame, fps]);

    // UI Dash & Scale Animation calculations (Frame-Locked and Symmetrical for Looping)
    const localFrame = frame % (fps * 20);

    const lengthRect = 2040;
    const lengthCircle = 659.73;

    // Symmetrical HUD scale animations
    const boxScale = interpolate(
        localFrame,
        [0, 2.5 * fps, 2.6 * fps, 2.9 * fps, 20.0 * fps],
        [1.0, 1.0, 1.02, 1.0, 1.0],
        { easing: Easing.out(Easing.quad) }
    );

    const subScale = interpolate(
        localFrame,
        [0, 8.5 * fps, 8.6 * fps, 8.9 * fps, 20.0 * fps],
        [1.0, 1.0, 1.05, 1.0, 1.0],
        { easing: Easing.out(Easing.quad) }
    );

    // Neon continuous dash offsets
    const offsetCw = interpolate(localFrame, [0, fps * 20], [0, -lengthRect], { easing: Easing.linear });
    const offsetCcw = interpolate(localFrame, [0, fps * 20], [0, lengthRect], { easing: Easing.linear });
    const offsetCircle = interpolate(localFrame, [0, fps * 20], [0, -lengthCircle], { easing: Easing.linear });

    // HUD spin elements
    const rotInner = interpolate(localFrame, [0, fps * 20], [0, 360], { easing: Easing.linear });
    const rotOuter = interpolate(localFrame, [0, fps * 20], [0, -360], { easing: Easing.linear });

    // Styles mapped perfectly matching CSS specifications
    const containerStyle: React.CSSProperties = {
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#000000',
    };

    const canvasStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        zIndex: 1,
        filter: 'contrast(1.1) saturate(1.2)',
    };

    const uiLayerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        zIndex: 2,
    };

    const videoPlaceholderStyle: React.CSSProperties = {
        position: 'absolute',
        width: 640,
        height: 360,
        top: 360,
    };

    const leftBoxStyle: React.CSSProperties = {
        ...videoPlaceholderStyle,
        left: 160,
    };

    const rightBoxStyle: React.CSSProperties = {
        ...videoPlaceholderStyle,
        right: 160,
    };

    const subPlaceholderStyle: React.CSSProperties = {
        position: 'absolute',
        width: 200,
        height: 200,
        left: 860,
        bottom: 100,
    };

    const chromaBoxStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#00FF00',
        boxShadow: 'inset 0 0 0 2px rgba(0, 0, 0, 1)',
    };

    const chromaCircleStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#00FF00',
        borderRadius: '50%',
        boxShadow: 'inset 0 0 0 2px rgba(0, 0, 0, 1)',
    };

    const hudBorderStyle: React.CSSProperties = {
        position: 'absolute',
        top: -30,
        left: -30,
        width: 700,
        height: 420,
        filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.7)) drop-shadow(0 0 4px rgba(255, 0, 255, 0.7))',
    };

    const hudBorderCircleStyle: React.CSSProperties = {
        position: 'absolute',
        top: -30,
        left: -30,
        width: 260,
        height: 260,
        filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.7)) drop-shadow(0 0 4px rgba(255, 0, 255, 0.7))',
    };

    const glitchWrapperStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
    };

    return (
        <div style={containerStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />

            <div style={uiLayerStyle}>
                
                {/* Left Video Placeholder */}
                <div style={{ ...leftBoxStyle, transform: `scale(${boxScale})`, transformOrigin: 'center center' }}>
                    <div style={glitchWrapperStyle}>
                        <svg style={hudBorderStyle} viewBox="0 0 700 420">
                            <path d="M 30 60 L 30 30 L 60 30" fill="none" stroke="#FF00FF" strokeWidth={4} strokeLinecap="square"/>
                            <path d="M 670 60 L 670 30 L 640 30" fill="none" stroke="#FF00FF" strokeWidth={4} strokeLinecap="square"/>
                            <path d="M 30 360 L 30 390 L 60 390" fill="none" stroke="#FF00FF" strokeWidth={4} strokeLinecap="square"/>
                            <path d="M 670 360 L 670 390 L 640 390" fill="none" stroke="#FF00FF" strokeWidth={4} strokeLinecap="square"/>
                            <rect x="25" y="25" width="650" height="370" fill="none" stroke="#00FFFF" strokeWidth={1} opacity="0.3"/>
                            <path 
                                d="M 25 25 h 650 v 370 h -650 z" 
                                fill="none" 
                                stroke="#00FFFF" 
                                strokeWidth={3} 
                                style={{
                                    strokeDasharray: `${lengthRect / 4} ${lengthRect / 4}`,
                                    strokeDashoffset: offsetCw,
                                }}
                            />
                        </svg>
                    </div>
                    <div style={chromaBoxStyle}></div>
                </div>

                {/* Right Video Placeholder */}
                <div style={{ ...rightBoxStyle, transform: `scale(${boxScale})`, transformOrigin: 'center center' }}>
                    <div style={glitchWrapperStyle}>
                        <svg style={hudBorderStyle} viewBox="0 0 700 420">
                            <path d="M 30 60 L 30 30 L 60 30" fill="none" stroke="#FF00FF" strokeWidth={4} strokeLinecap="square"/>
                            <path d="M 670 60 L 670 30 L 640 30" fill="none" stroke="#FF00FF" strokeWidth={4} strokeLinecap="square"/>
                            <path d="M 30 360 L 30 390 L 60 390" fill="none" stroke="#FF00FF" strokeWidth={4} strokeLinecap="square"/>
                            <path d="M 670 360 L 670 390 L 640 390" fill="none" stroke="#FF00FF" strokeWidth={4} strokeLinecap="square"/>
                            <rect x="25" y="25" width="650" height="370" fill="none" stroke="#00FFFF" strokeWidth={1} opacity="0.3"/>
                            <path 
                                d="M 25 25 h 650 v 370 h -650 z" 
                                fill="none" 
                                stroke="#00FFFF" 
                                strokeWidth={3} 
                                style={{
                                    strokeDasharray: `${lengthRect / 4} ${lengthRect / 4}`,
                                    strokeDashoffset: offsetCcw,
                                }}
                            />
                        </svg>
                    </div>
                    <div style={chromaBoxStyle}></div>
                </div>

                {/* Subscriber Placeholder */}
                <div style={{ ...subPlaceholderStyle, transform: `scale(${subScale})`, transformOrigin: 'center center' }}>
                    <div style={glitchWrapperStyle}>
                        <svg style={hudBorderCircleStyle} viewBox="0 0 260 260">
                            <path d="M 130 5 L 130 20 M 130 255 L 130 240 M 5 130 L 20 130 M 255 130 L 240 130" fill="none" stroke="#FF00FF" strokeWidth={4}/>
                            
                            {/* Inner spinning segment ring */}
                            <g style={{ transform: `rotate(${rotInner}deg)`, transformOrigin: "130px 130px" }}>
                                <circle cx="130" cy="130" r="115" fill="none" stroke="#00FFFF" strokeWidth={2} strokeDasharray="20 10 50 20 5 10"/>
                            </g>

                            {/* Outer spinning segment ring */}
                            <g style={{ transform: `rotate(${rotOuter}deg)`, transformOrigin: "130px 130px" }}>
                                <circle cx="130" cy="130" r="125" fill="none" stroke="#FF00FF" strokeWidth={2} strokeDasharray="100 50 30 40"/>
                            </g>

                            {/* Flowing energy ring path */}
                            <circle 
                                cx="130" 
                                cy="130" 
                                r="105" 
                                fill="none" 
                                stroke="#00FFFF" 
                                strokeWidth={3} 
                                style={{
                                    strokeDasharray: `${lengthCircle / 4} ${lengthCircle / 4}`,
                                    strokeDashoffset: offsetCircle,
                                }}
                            />
                        </svg>
                    </div>
                    <div style={chromaCircleStyle}></div>
                </div>

            </div>
        </div>
    );
};

export default CyberpunkEndScreen;
// END_OF_FILE