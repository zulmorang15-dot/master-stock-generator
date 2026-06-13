import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Custom shaders
const vertexShader = `
    uniform float uTime;
    uniform float uFrequency;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    vec3 distort(vec3 p) {
        float t = uTime * 0.4;
        p.x += sin(p.y * uFrequency + t) * 0.25;
        p.y += cos(p.z * uFrequency + t * 1.2) * 0.25;
        p.z += sin(p.x * uFrequency + t * 0.8) * 0.20;
        p.x += cos(p.z * 4.0 + t * 2.0) * 0.05;
        p.y += sin(p.x * 4.0 + t * 1.5) * 0.05;
        return p;
    }

    void main() {
        vUv = uv;
        vec3 stablePosition = position;
        vec3 displacedPosition = distort(stablePosition);
        
        float delta = 0.01;
        vec3 pX = distort(stablePosition + vec3(delta, 0.0, 0.0));
        vec3 pY = distort(stablePosition + vec3(0.0, delta, 0.0));
        vec3 normalOut = normalize(cross(pX - displacedPosition, pY - displacedPosition));
        
        vNormal = normalize(normalMatrix * normalOut);
        vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    uniform vec3 uColorBase;
    uniform vec3 uColorHighlight;
    uniform vec3 uColorGlow;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
        
        vec3 lightDir1 = normalize(vec3(2.0, 3.0, 4.0));
        vec3 lightDir2 = normalize(vec3(-3.0, -2.0, 2.0));
        
        float diffuse1 = max(dot(normal, lightDir1), 0.0);
        float diffuse2 = max(dot(normal, lightDir2), 0.0);
        
        vec3 reflectDir = reflect(-lightDir1, normal);
        float spec = pow(max(dot(reflectDir, viewDir), 0.0), 32.0);
        
        vec3 chromeSurface = mix(uColorBase, uColorHighlight, normal.z * 0.5 + 0.5);
        chromeSurface += vec3(fresnel * 0.6) * uColorGlow;
        
        vec3 finalColor = chromeSurface + (diffuse1 * 0.1) + (diffuse2 * vec3(0.0, 0.3, 0.4)) + (spec * 0.7);
        
        gl_FragColor = vec4(finalColor, 0.92);
    }
`;

export const PremiumLiquidChromeEndscreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const ribbonMeshRef = useRef<THREE.Mesh | null>(null);
    const centerRingMeshRef = useRef<THREE.Mesh | null>(null);
    const customUniformsRef = useRef<any>(null);
    const secondaryUniformsRef = useRef<any>(null);

    // Three.js Scene Setup (Once on Mount)
    useEffect(() => {
        if (!canvasRef.current) return;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: false
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(2);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 100);
        camera.position.set(0, 0, 8);
        cameraRef.current = camera;

        // Custom Liquid Chrome Geometries
        const liquidRibbonGeo = new THREE.TorusKnotGeometry(2.5, 0.6, 200, 35, 3, 5);
        const centralRingGeo = new THREE.TorusGeometry(1.2, 0.12, 32, 100);

        // Uniforms Mapping
        const customUniforms = {
            uTime: { value: 0 },
            uFrequency: { value: 1.5 },
            uColorBase: { value: new THREE.Color('#080d1a') },
            uColorHighlight: { value: new THREE.Color('#c2d6ff') },
            uColorGlow: { value: new THREE.Color('#00f2fe') }
        };
        customUniformsRef.current = customUniforms;

        const secondaryUniforms = {
            uTime: { value: 0 },
            uFrequency: { value: 2.2 },
            uColorBase: { value: new THREE.Color('#05030a') },
            uColorHighlight: { value: new THREE.Color('#9d4edd') },
            uColorGlow: { value: new THREE.Color('#00f2fe') }
        };
        secondaryUniformsRef.current = secondaryUniforms;

        // Custom Shader Materials
        const liquidMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: customUniforms,
            transparent: true,
            side: THREE.DoubleSide
        });

        const secondaryLiquidMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: secondaryUniforms,
            transparent: true,
            side: THREE.DoubleSide
        });

        // Assemble Meshes
        const liquidRibbonMesh = new THREE.Mesh(liquidRibbonGeo, liquidMaterial);
        scene.add(liquidRibbonMesh);
        ribbonMeshRef.current = liquidRibbonMesh;

        const centerRingMesh = new THREE.Mesh(centralRingGeo, secondaryLiquidMaterial);
        centerRingMesh.position.set(0, 0, 1.5);
        scene.add(centerRingMesh);
        centerRingMeshRef.current = centerRingMesh;

        // Volumetric Stage Lights Setup
        const ambientLight = new THREE.AmbientLight('#020205', 0.5);
        scene.add(ambientLight);

        const pointLightCyan = new THREE.PointLight('#00f2fe', 3, 15);
        pointLightCyan.position.set(-4, 3, 2);
        scene.add(pointLightCyan);

        const pointLightPurple = new THREE.PointLight('#7b2cbf', 4, 15);
        pointLightPurple.position.set(4, -3, 2);
        scene.add(pointLightPurple);

        return () => {
            renderer.dispose();
            liquidRibbonGeo.dispose();
            centralRingGeo.dispose();
            liquidMaterial.dispose();
            secondaryLiquidMaterial.dispose();
        };
    }, []);

    // Deterministic WebGL Render Cycle (Executed on every frame change)
    useEffect(() => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const ribbon = ribbonMeshRef.current;
        const ring = centerRingMeshRef.current;
        const customUniforms = customUniformsRef.current;
        const secondaryUniforms = secondaryUniformsRef.current;

        if (!renderer || !scene || !camera || !ribbon || !ring || !customUniforms || !secondaryUniforms) return;

        // Compute flawless seamless loop coordinates (20 seconds = 1200 frames total loop window)
        const totalFrames = 1200;
        const loopTime = (frame % totalFrames) / fps;

        // Drive custom shaders deterministically
        customUniforms.uTime.value = loopTime;
        secondaryUniforms.uTime.value = loopTime * 1.3;

        // Mesh rotation mathematics matching original behavior exactly
        ribbon.rotation.x = loopTime * 0.12;
        ribbon.rotation.y = loopTime * 0.15;
        ribbon.rotation.z = Math.sin(loopTime * 0.05) * 0.2;

        ring.rotation.x = Math.cos(loopTime * 0.2) * 0.3;
        ring.rotation.y = Math.sin(loopTime * 0.2) * 0.3;
        ring.rotation.z = -loopTime * 0.4;

        // Camera Drifting Path Coordinates loop mathematically
        const targetCamX = Math.sin(loopTime * 0.3) * 0.3;
        const targetCamY = Math.cos(loopTime * 0.3) * 0.2;
        camera.position.x += (targetCamX - camera.position.x) * 0.05;
        camera.position.y += (targetCamY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }, [frame, fps]);

    // UI Element Animation & Styling Calculations (Deterministic & Symmetrical Loops)
    const leftScale = interpolate(
        Math.sin((frame / 60) * Math.PI),
        [-1, 1],
        [1.0, 1.02]
    );

    const rightScale = interpolate(
        Math.sin((frame / 60) * Math.PI + Math.PI),
        [-1, 1],
        [1.0, 1.02]
    );

    const centerScale = interpolate(
        Math.sin((frame / 120) * Math.PI),
        [-1, 1],
        [0.98, 1.03]
    );

    // Light Sweeps Opacity (Simulating original stagger timeline loop)
    const sweepOpacityLeft = interpolate(
        (frame + 0) % 240,
        [0, 45, 90, 135, 240],
        [0, 0.6, 0, 0, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const sweepOpacityRight = interpolate(
        (frame + 96) % 240,
        [0, 45, 90, 135, 240],
        [0, 0.6, 0, 0, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Diagonal Shine movement
    const shinePosLeft = interpolate(
        (frame + 0) % 240,
        [0, 90, 240],
        [-100, 200, 200],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const shinePosRight = interpolate(
        (frame + 96) % 240,
        [0, 90, 240],
        [-100, 200, 200],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Inline Style Declarations
    const containerStyle: React.CSSProperties = {
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        backgroundColor: '#030307',
        overflow: 'hidden',
        boxShadow: '0 0 100px rgba(0, 0, 0, 0.8)'
    };

    const canvasStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
    };

    const vignetteStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.4) 70%, rgba(2, 2, 6, 0.95) 100%)',
        pointerEvents: 'none',
        zIndex: 2
    };

    const uiLayerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 3,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'repeat(12, 1fr)',
        padding: 90,
        pointerEvents: 'none'
    };

    const videoBaseStyle: React.CSSProperties = {
        pointerEvents: 'auto',
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        border: '2px solid rgba(0, 242, 254, 0.15)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 242, 254, 0.05)',
        position: 'relative',
        overflow: 'hidden'
    };

    const videoLeftStyle: React.CSSProperties = {
        ...videoBaseStyle,
        gridColumn: '1 / 5',
        gridRow: '4 / 10',
        width: 530,
        height: 298,
        alignSelf: 'center',
        transform: `scale(${leftScale}) translateY(-2px)`,
    };

    const videoRightStyle: React.CSSProperties = {
        ...videoBaseStyle,
        gridColumn: '9 / 13',
        gridRow: '4 / 10',
        width: 530,
        height: 298,
        alignSelf: 'center',
        justifySelf: 'end',
        transform: `scale(${rightScale}) translateY(-2px)`,
    };

    const subscribeContainerStyle: React.CSSProperties = {
        gridColumn: '5 / 9',
        gridRow: '4 / 10',
        placeSelf: 'center',
        width: 240,
        height: 240,
        position: 'relative',
        pointerEvents: 'auto',
        transform: `scale(${centerScale})`
    };

    const subscribeCoreStyle: React.CSSProperties = {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '2px solid rgba(157, 78, 221, 0.25)',
        boxShadow: '0 0 50px rgba(157, 78, 221, 0.15), inset 0 0 30px rgba(0, 242, 254, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const lightSweepStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        background: 'linear-gradient(to bottom, transparent, rgba(0, 242, 254, 0.03), transparent)',
        pointerEvents: 'none'
    };

    return (
        <div style={containerStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />
            <div style={vignetteStyle} />
            <div style={uiLayerStyle}>
                
                <div style={videoLeftStyle} id="card-left">
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: `${shinePosLeft}%`,
                        width: '50%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.2), transparent)',
                        transform: 'skewX(-25deg)'
                    }} />
                    <div style={{ ...lightSweepStyle, opacity: sweepOpacityLeft }} />
                </div>

                <div style={subscribeContainerStyle} id="card-center">
                    <div style={subscribeCoreStyle} />
                </div>

                <div style={videoRightStyle} id="card-right">
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: `${shinePosRight}%`,
                        width: '50%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.2), transparent)',
                        transform: 'skewX(-25deg)'
                    }} />
                    <div style={{ ...lightSweepStyle, opacity: sweepOpacityRight }} />
                </div>

            </div>
        </div>
    );
};

export default PremiumLiquidChromeEndscreen;
// END_OF_FILE