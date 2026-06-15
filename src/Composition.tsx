import { useVideoConfig, useCurrentFrame } from 'remotion';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const fragmentShaderSource = `
    uniform float uTimeA;
    uniform float uTimeB;
    uniform float uBlend;
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

    // Ribbon generator with integrated high-fidelity glow (simulating UnrealBloomPass)
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
        
        // High contrast glow calculation with two layers of falloff for cinematic glow
        float coreGlow = 0.025 / (abs(line) + 0.015);
        float auraGlow = 0.035 / (abs(line) + 0.12);
        float intensity = coreGlow + auraGlow;
        
        // Subtle pulsing
        float pulse = 0.7 + 0.3 * sin(t * 2.5 + offset * 3.0);
        
        return color * intensity * pulse;
    }

    vec3 getScene(vec2 uv, float t) {
        // Cinematic camera drift
        vec2 driftUv = uv + vec2(sin(t * 0.3), cos(t * 0.2)) * 0.3;
        driftUv *= 1.2; // slight zoom out

        vec3 color = vec3(0.0);

        // Additive blending of holographic light trails
        color += getRibbon(driftUv, t, 0.0, vec3(0.7, 0.1, 0.9)); // Purple
        color += getRibbon(driftUv, t, 1.2, vec3(0.1, 0.9, 0.9)); // Cyan
        color += getRibbon(driftUv, t, 2.4, vec3(0.1, 0.3, 1.0)); // Blue
        color += getRibbon(driftUv, t, 3.6, vec3(1.0, 0.1, 0.3)); // Red

        // Dark black void background ensuring high contrast
        return pow(color, vec3(1.4));
    }

    void main() {
        // Center UVs and fix aspect ratio
        vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
        
        // Render two points in time and blend them for a perfect loop
        vec3 colA = getScene(uv, uTimeA);
        vec3 colB = getScene(uv, uTimeB);
        
        vec3 finalColor = mix(colA, colB, uBlend);
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export const PremiumAbstractNeonShader: React.FC = () => {
    const { width, height, durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Initial WebGL Setup
    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });

        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1); // Lock pixels inside 1920x1080 context to prevent lag

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTimeA: { value: 0.0 },
                uTimeB: { value: 0.0 },
                uBlend: { value: 0.0 },
                uResolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: fragmentShaderSource,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;
        materialRef.current = material;

        return () => {
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    // Frame-locked deterministic rendering
    useEffect(() => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !materialRef.current) return;

        const totalFrames = durationInFrames;
        const progress = frame / totalFrames; // 0.0 to 1.0

        // 15 seconds loop cycle
        const loopDuration = 15.0; 
        const tA = progress * loopDuration * 0.15;
        const tB = (progress - 1.0) * loopDuration * 0.15;
        const blend = progress;

        // Apply updated uniform values
        materialRef.current.uniforms.uTimeA.value = tA;
        materialRef.current.uniforms.uTimeB.value = tB;
        materialRef.current.uniforms.uBlend.value = blend;
        materialRef.current.uniforms.uResolution.value.set(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }, [frame, durationInFrames]);

    return (
        <div
            style={{
                width: ORIGINAL_WIDTH,
                height: ORIGINAL_HEIGHT,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${scaleFactor})`,
                transformOrigin: 'center center',
                overflow: 'hidden',
                backgroundColor: '#000000'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                }}
            />
        </div>
    );
};

export default PremiumAbstractNeonShader;
// END_OF_FILE