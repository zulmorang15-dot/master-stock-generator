import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PremiumAbstractNeonShader: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);

    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();

    // Responsive scaling factor to fill 16:9 viewport edge-to-edge
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // 1. Scene & Shader Initialization (Runs once on mount)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Orthographic camera for fullscreen 2D shader plane
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        cameraRef.current = camera;

        // Renderer with strict 1080p target resolution
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1);
        rendererRef.current = renderer;

        // Shader Uniforms
        const uniforms = {
            uTime: { value: 0.0 },
            uResolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) }
        };

        // Custom Shader Material with built-in multi-layered bloom/glow simulation
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec2 uResolution;

                // Simplex 2D noise
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod289(i);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m;
                    m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                // Fractal Brownian Motion for organic liquid feel
                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    vec2 shift = vec2(100.0);
                    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
                    for (int i = 0; i < 5; i++) {
                        value += amplitude * snoise(p);
                        p = rot * p * 2.0 + shift;
                        amplitude *= 0.5;
                    }
                    return value;
                }

                // Ribbon generator with integrated bloom & glow emulation
                vec3 getRibbon(vec2 uv, float t, float offset, vec3 color) {
                    // Animated UV warping
                    vec2 q = vec2(
                        fbm(uv + vec2(0.0, offset) + t * 0.4),
                        fbm(uv + vec2(offset, 0.0) - t * 0.3)
                    );
                    vec2 r = vec2(
                        fbm(q + uv * 2.0 + t * 0.2),
                        fbm(q - uv * 1.5 - t * 0.25)
                    );

                    // Morphing curves
                    float line = sin(r.x * 6.0 + r.y * 4.0 + t * 1.5 + offset * 2.0);
                    
                    // Double-layered glow simulation (emulating UnrealBloomPass)
                    // High-contrast sharp core + soft outer glowing falloff
                    float core = 0.03 / (abs(line) + 0.008);
                    float glow = 0.09 / (abs(line) + 0.14);
                    float intensity = core + glow * 2.0;
                    
                    // Subtle pulsing
                    float pulse = 0.75 + 0.25 * sin(t * 2.5 + offset * 3.0);
                    
                    return color * intensity * pulse;
                }

                void main() {
                    // Center UVs and fix aspect ratio
                    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
                    
                    // Slow flowing time
                    float t = uTime * 0.15;
                    
                    // Cinematic camera drift
                    uv += vec2(sin(t * 0.3), cos(t * 0.2)) * 0.3;
                    uv *= 1.2; // slight zoom out

                    vec3 finalColor = vec3(0.0);

                    // Additive blending of holographic light trails
                    finalColor += getRibbon(uv, t, 0.0, vec3(0.7, 0.1, 0.9)); // Purple
                    finalColor += getRibbon(uv, t, 1.2, vec3(0.1, 0.9, 0.9)); // Cyan
                    finalColor += getRibbon(uv, t, 2.4, vec3(0.1, 0.3, 1.0)); // Blue
                    finalColor += getRibbon(uv, t, 3.6, vec3(1.0, 0.1, 0.3)); // Red

                    // Dark black void background ensuring high contrast
                    finalColor = pow(finalColor, vec3(1.4));

                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false
        });
        materialRef.current = material;

        // Fullscreen Quad Geometry
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Cleanup
        return () => {
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    // 2. Deterministic Render Effect (Triggered on every frame change)
    useEffect(() => {
        const material = materialRef.current;
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;

        if (!material || !renderer || !scene || !camera) return;

        // Loop Duration: exactly 15 seconds (900 frames @ 60fps)
        const totalFrames = 15 * fps;
        const progress = frame / totalFrames;

        // Symmetrical Time Mapping for mathematically absolute seamless looping.
        // Using a smooth sine wave cycle ensures that the beginning (0s) and end (15s) 
        // match perfectly, creating an infinite, seamless ambient motion loop.
        const maxTimeSeconds = 15.0;
        const deterministicTime = Math.sin(progress * Math.PI) * maxTimeSeconds;

        // Update Uniforms
        material.uniforms.uTime.value = deterministicTime;

        // Render Frame
        renderer.render(scene, camera);
    }, [frame, fps]);

    const wrapperStyle: React.CSSProperties = {
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
        display: 'block',
        width: '100%',
        height: '100%',
    };

    return (
        <div style={wrapperStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />
        </div>
    );
};

export default PremiumAbstractNeonShader;
// END_OF_FILE