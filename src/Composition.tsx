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

    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvasRef.current,
            antialias: false, 
            alpha: true,
            powerPreference: "high-performance" 
        });
        renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
        renderer.setPixelRatio(1);

        // Shader Uniforms
        const uniforms = {
            uTime: { value: 0.0 },
            uLoopDuration: { value: 15.0 },
            uResolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) }
        };

        // Custom Shader Material
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uLoopDuration;
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

                // Ribbon generator
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
                    
                    // High contrast glow calculation
                    float intensity = 0.025 / (abs(line) + 0.015);
                    
                    // High-fidelity integrated Bloom layer emulator (simulates UnrealBloomPass)
                    float bloomIntensity = 0.06 / (abs(line) + 0.12);
                    
                    // Subtle pulsing
                    float pulse = 0.7 + 0.3 * sin(t * 2.5 + offset * 3.0);
                    
                    return color * (intensity + bloomIntensity * 1.8) * pulse;
                }

                vec3 renderScene(vec2 fragCoord, float timeVal) {
                    // Center UVs and fix aspect ratio
                    vec2 uv = (fragCoord - 0.5 * uResolution.xy) / uResolution.y;
                    
                    // Slow flowing time
                    float t = timeVal * 0.15;
                    
                    // Cinematic camera drift
                    uv += vec2(sin(t * 0.3), cos(t * 0.2)) * 0.3;
                    uv *= 1.2; // slight zoom out

                    vec3 color = vec3(0.0);

                    // Additive blending of holographic light trails
                    color += getRibbon(uv, t, 0.0, vec3(0.7, 0.1, 0.9)); // Purple
                    color += getRibbon(uv, t, 1.2, vec3(0.1, 0.9, 0.9)); // Cyan
                    color += getRibbon(uv, t, 2.4, vec3(0.1, 0.3, 1.0)); // Blue
                    color += getRibbon(uv, t, 3.6, vec3(1.0, 0.1, 0.3)); // Red

                    // Dark black void background ensuring high contrast
                    return pow(color, vec3(1.4));
                }

                void main() {
                    float blend = smoothstep(0.0, 1.0, uTime / uLoopDuration);
                    
                    vec3 col1 = renderScene(gl_FragCoord.xy, uTime);
                    vec3 col2 = renderScene(gl_FragCoord.xy, uTime - uLoopDuration);
                    
                    vec3 finalColor = mix(col1, col2, blend);
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false
        });

        // Fullscreen Quad Geometry
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        materialRef.current = material;

        return () => {
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    // Frame-locked update effect
    useEffect(() => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !materialRef.current) return;

        const totalFrames = 900; // 15 seconds at 60fps
        const loopDuration = totalFrames / fps;
        const elapsedTime = (frame % totalFrames) / fps;

        materialRef.current.uniforms.uTime.value = elapsedTime;
        materialRef.current.uniforms.uLoopDuration.value = loopDuration;

        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }, [frame, fps]);

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
                backgroundColor: '#000000',
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