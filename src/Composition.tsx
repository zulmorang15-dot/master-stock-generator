import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const vertexShaderSource = `
    uniform float uTime;
    uniform float uFrequency;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    vec3 distort(vec3 p) {
        float t = uTime;
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

const fragmentShaderSource = `
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

export const LiquidChromeEndscreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const liquidRibbonMeshRef = useRef<THREE.Mesh | null>(null);
    const centerRingMeshRef = useRef<THREE.Mesh | null>(null);
    
    const customUniformsRef = useRef<{
        uTime: { value: number };
        uFrequency: { value: number };
        uColorBase: { value: THREE.Color };
        uColorHighlight: { value: THREE.Color };
        uColorGlow: { value: THREE.Color };
    } | null>(null);

    const secondaryUniformsRef = useRef<{
        uTime: { value: number };
        uFrequency: { value: number };
        uColorBase: { value: THREE.Color };
        uColorHighlight: { value: THREE.Color };
        uColorGlow: { value: THREE.Color };
    } | null>(null);

    // Scaling to fit rendering dimension exactly
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Initial WebGL Setup
    useEffect(() => {
        if (!canvasRef.current) return;

        const renderWidth = ORIGINAL_WIDTH;
        const renderHeight = ORIGINAL_HEIGHT;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: false,
        });
        renderer.setSize(renderWidth, renderHeight);
        renderer.setPixelRatio(2);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, renderWidth / renderHeight, 0.1, 100);
        camera.position.set(0, 0, 8);
        cameraRef.current = camera;

        // Unified shader uniforms mapping
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

        const liquidMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            uniforms: customUniforms,
            transparent: true,
            side: THREE.DoubleSide
        });

        const secondaryLiquidMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            uniforms: secondaryUniforms,
            transparent: true,
            side: THREE.DoubleSide
        });

        const liquidRibbonGeo = new THREE.TorusKnotGeometry(2.5, 0.6, 200, 35, 3, 5);
        const centralRingGeo = new THREE.TorusGeometry(1.2, 0.12, 32, 100);

        const liquidRibbonMesh = new THREE.Mesh(liquidRibbonGeo, liquidMaterial);
        scene.add(liquidRibbonMesh);
        liquidRibbonMeshRef.current = liquidRibbonMesh;

        const centerRingMesh = new THREE.Mesh(centralRingGeo, secondaryLiquidMaterial);
        centerRingMesh.position.set(0, 0, 1.5);
        scene.add(centerRingMesh);
        centerRingMeshRef.current = centerRingMesh;

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

    // Deterministic Loop Rendering Loop
    useEffect(() => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const customUniforms = customUniformsRef.current;
        const secondaryUniforms = secondaryUniformsRef.current;
        const liquidRibbonMesh = liquidRibbonMeshRef.current;
        const centerRingMesh = centerRingMeshRef.current;

        if (!renderer || !scene || !camera) return;

        // Perfectly loop-aligned phase mapping (1200 frames loop)
        const shaderTime1 = (2 * Math.PI * 3 * frame) / 1200;
        const shaderTime2 = (2 * Math.PI * 4 * frame) / 1200;

        if (customUniforms) {
            customUniforms.uTime.value = shaderTime1;
        }
        if (secondaryUniforms) {
            secondaryUniforms.uTime.value = shaderTime2;
        }

        // Seamless 3D Rotations
        if (liquidRibbonMesh) {
            liquidRibbonMesh.rotation.x = (2 * Math.PI * 1 * frame) / 1200;
            liquidRibbonMesh.rotation.y = (2 * Math.PI * 1 * frame) / 1200;
            liquidRibbonMesh.rotation.z = Math.sin((2 * Math.PI * 1 * frame) / 1200) * 0.2;
        }

        if (centerRingMesh) {
            centerRingMesh.rotation.x = Math.cos((2 * Math.PI * 2 * frame) / 1200) * 0.3;
            centerRingMesh.rotation.y = Math.sin((2 * Math.PI * 2 * frame) / 1200) * 0.3;
            centerRingMesh.rotation.z = (-2 * Math.PI * 2 * frame) / 1200;
        }

        // Loop-safe simulated drift
        const driftAngle = (2 * Math.PI * frame) / 1200;
        camera.position.x = Math.sin(driftAngle) * 0.15;
        camera.position.y = Math.cos(driftAngle * 2) * 0.05;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }, [frame, fps]);

    // UI Animations & Interactive Demonstration Simulations
    // 4-second (240-frame) clean loop cycles
    const sweepProgress = frame % 240;

    const shineLeft = interpolate(sweepProgress, [0, 80, 240], [-100, 200, 200], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.linear,
    });

    const leftSweepOpacity = interpolate(sweepProgress, [0, 60, 120, 240], [0, 0.6, 0, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.quad),
    });

    const rightSweepOpacity = interpolate(sweepProgress, [0, 100, 160, 240], [0, 0, 0.6, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.quad),
    });

    // Simulated Interactive Hover Phases
    // Left card hovers from frame 120 to 360
    let leftCardScale = 1.0;
    let leftCardTranslateY = 0;
    let leftCardBorderColor = 'rgba(0, 242, 254, 0.15)';
    let leftCardShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 242, 254, 0.05)';

    if (frame >= 120 && frame < 360) {
        const hoverProgress = interpolate(frame, [120, 180, 300, 360], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.quad),
        });
        leftCardScale = interpolate(hoverProgress, [0, 1], [1.0, 1.04]);
        leftCardTranslateY = interpolate(hoverProgress, [0, 1], [0, -4]);
        leftCardBorderColor = `rgba(0, 242, 254, ${interpolate(hoverProgress, [0, 1], [0.15, 0.5])})`;
        leftCardShadow = hoverProgress > 0.5 
            ? '0 30px 60px -10px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 242, 254, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 242, 254, 0.05)';
    }

    // Center subscribe hovers from frame 480 to 720
    let subscribeScale = 1.0;
    let subscribeBorderColor = 'rgba(157, 78, 221, 0.25)';
    let subscribeShadow = '0 0 50px rgba(157, 78, 221, 0.15), inset 0 0 30px rgba(0, 242, 254, 0.05)';

    if (frame >= 480 && frame < 720) {
        const hoverProgress = interpolate(frame, [480, 540, 660, 720], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.quad),
        });
        subscribeScale = interpolate(hoverProgress, [0, 1], [1.0, 1.06]);
        subscribeBorderColor = `rgba(0, 242, 254, ${interpolate(hoverProgress, [0, 1], [0.25, 0.6])})`;
        subscribeShadow = hoverProgress > 0.5
            ? '0 0 60px rgba(0, 242, 254, 0.3), 0 0 30px rgba(157, 78, 221, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)'
            : '0 0 50px rgba(157, 78, 221, 0.15), inset 0 0 30px rgba(0, 242, 254, 0.05)';
    }

    // Right card hovers from frame 840 to 1080
    let rightCardScale = 1.0;
    let rightCardTranslateY = 0;
    let rightCardBorderColor = 'rgba(0, 242, 254, 0.15)';
    let rightCardShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 242, 254, 0.05)';

    if (frame >= 840 && frame < 1080) {
        const hoverProgress = interpolate(frame, [840, 900, 1020, 1080], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.quad),
        });
        rightCardScale = interpolate(hoverProgress, [0, 1], [1.0, 1.04]);
        rightCardTranslateY = interpolate(hoverProgress, [0, 1], [0, -4]);
        rightCardBorderColor = `rgba(0, 242, 254, ${interpolate(hoverProgress, [0, 1], [0.15, 0.5])})`;
        rightCardShadow = hoverProgress > 0.5
            ? '0 30px 60px -10px rgba(0, 0, 0, 0.9), 0 0 50px rgba(0, 242, 254, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 242, 254, 0.05)';
    }

    // Styles objects transformed to CamelCase React Styles
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
        boxShadow: '0 0 100px rgba(0, 0, 0, 0.8)',
    };

    const canvasStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
    };

    const vignetteStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.4) 70%, rgba(2, 2, 6, 0.95) 100%)',
        pointerEvents: 'none',
        zIndex: 2,
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
        padding: '90px',
        pointerEvents: 'none',
    };

    const videoPlaceholderStyle: React.CSSProperties = {
        pointerEvents: 'auto',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)',
        position: 'relative',
        overflow: 'hidden',
    };

    const videoLeftStyle: React.CSSProperties = {
        ...videoPlaceholderStyle,
        gridColumn: '1 / 5',
        gridRow: '4 / 10',
        width: '530px',
        height: '298px',
        alignSelf: 'center',
        transform: `scale(${leftCardScale}) translateY(${leftCardTranslateY}px)`,
        borderColor: leftCardBorderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: leftCardShadow,
    };

    const videoRightStyle: React.CSSProperties = {
        ...videoPlaceholderStyle,
        gridColumn: '9 / 13',
        gridRow: '4 / 10',
        width: '530px',
        height: '298px',
        alignSelf: 'center',
        justifySelf: 'end',
        transform: `scale(${rightCardScale}) translateY(${rightCardTranslateY}px)`,
        borderColor: rightCardBorderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: rightCardShadow,
    };

    const shineStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: `${shineLeft}%`,
        width: '50%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.2), transparent)',
        transform: 'skewX(-25deg)',
    };

    const subscribeContainerStyle: React.CSSProperties = {
        gridColumn: '5 / 9',
        gridRow: '4 / 10',
        placeSelf: 'center',
        width: '240px',
        height: '240px',
        position: 'relative',
        pointerEvents: 'auto',
    };

    const subscribeCoreStyle: React.CSSProperties = {
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${subscribeScale})`,
        borderColor: subscribeBorderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: subscribeShadow,
    };

    const lightSweepStyle = (opacityValue: number): React.CSSProperties => ({
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        background: 'linear-gradient(to bottom, transparent, rgba(0, 242, 254, 0.15), transparent)',
        opacity: opacityValue,
        pointerEvents: 'none',
    });

    return (
        <div style={containerStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />
            
            <div style={vignetteStyle} />

            <div style={uiLayerStyle}>
                <div style={videoLeftStyle} id="card-left">
                    <div style={shineStyle} />
                    <div style={lightSweepStyle(leftSweepOpacity)} />
                </div>

                <div style={subscribeContainerStyle} id="card-center">
                    <div style={subscribeCoreStyle} />
                </div>

                <div style={videoRightStyle} id="card-right">
                    <div style={shineStyle} />
                    <div style={lightSweepStyle(rightSweepOpacity)} />
                </div>
            </div>
        </div>
    );
};

export default LiquidChromeEndscreen;
// END_OF_FILE