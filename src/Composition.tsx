import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const SunsetDunes: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Seamlessly match the exact 15.0 second loop
  const LOOP_DURATION = 15.0;

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT, false);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const uniforms = {
      uTime: { value: 0 },
      uLoop: { value: LOOP_DURATION },
      uResolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
      uMode: { value: 1 },
      uC0: { value: new THREE.Vector3(0.95, 0.45, 0.20) },
      uC1: { value: new THREE.Vector3(0.98, 0.65, 0.30) },
      uC2: { value: new THREE.Vector3(0.99, 0.80, 0.45) },
      uC3: { value: new THREE.Vector3(0.85, 0.30, 0.45) },
      uC4: { value: new THREE.Vector3(0.55, 0.18, 0.40) },
      uC5: { value: new THREE.Vector3(0.30, 0.10, 0.30) },
      uCD: { value: new THREE.Vector3(0.10, 0.04, 0.08) },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime, uLoop;
        uniform vec2 uResolution;
        uniform int uMode;
        uniform vec3 uC0, uC1, uC2, uC3, uC4, uC5, uCD;
        #define TAU 6.28318530718
        
        float ph() {
          return (uTime / uLoop) * TAU;
        }
        
        float inf(vec2 uv, vec2 c, float r) {
          return 1.0 - smoothstep(0.0, r, length(uv - c));
        }
        
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
        
        float smoothGrain(vec2 uv, float p) {
          float t = p / TAU;
          float f = fract(t * 24.0);
          float i = floor(t * 24.0);
          vec2 g = uv * uResolution * 0.9;
          return (mix(hash(g + i), hash(g + i + 1.0), smoothstep(0.0, 1.0, f))) * 2.0 - 1.0;
        }
        
        void main() {
          vec2 uv = vUv;
          float p = ph();
          vec2 wuv = uv;
          if (uMode == 1 || uMode == 2) {
            float w1 = noise(uv * 3.0 + vec2(cos(p), sin(p)) * 0.6);
            float w2 = noise(uv * 3.0 + vec2(cos(p + 2.0), sin(p + 1.3)) * 0.6 + 5.0);
            wuv += (vec2(w1, w2) - 0.5) * 0.35;
          }
          vec2 c0 = vec2(0.28 + 0.10 * cos(p), 0.70 + 0.08 * sin(p));
          vec2 c1 = vec2(0.40 + 0.09 * cos(p + 1.2), 0.78 + 0.07 * sin(p + 0.6));
          vec2 c2 = vec2(0.82 + 0.08 * cos(p + 2.0), 0.55 + 0.10 * sin(p + 1.5));
          vec2 c3 = vec2(0.68 + 0.07 * cos(p + 3.1), 0.42 + 0.09 * sin(p + 2.4));
          vec2 c4 = vec2(0.74 + 0.06 * cos(p + 4.0), 0.50 + 0.06 * sin(p + 3.3));
          vec2 c5 = vec2(0.18 + 0.09 * cos(p + 5.0), 0.30 + 0.08 * sin(p + 4.2));
          vec2 cd = vec2(0.30 + 0.08 * cos(p + 0.7), 0.10 + 0.07 * sin(p + 5.1));
          
          float r = 0.55 + 0.06 * sin(p);
          vec3 col = uCD;
          col = mix(col, uC0, clamp(inf(wuv, c0, r + 0.05), 0.0, 1.0));
          col = mix(col, uC1, clamp(inf(wuv, c1, r), 0.0, 1.0) * 0.95);
          col = mix(col, uC5, clamp(inf(wuv, c5, r - 0.05), 0.0, 1.0) * 0.9);
          col = mix(col, uC3, clamp(inf(wuv, c3, r - 0.08), 0.0, 1.0) * 0.95);
          col = mix(col, uC4, clamp(inf(wuv, c4, r - 0.18), 0.0, 1.0) * 0.85);
          col = mix(col, uC2, clamp(inf(wuv, c2, r + 0.02), 0.0, 1.0) * 0.95);
          col = mix(col, uCD, clamp(inf(wuv, cd, 0.32), 0.0, 1.0) * 0.55);
          
          float lum = dot(col, vec3(0.299, 0.587, 0.114));
          if (uMode == 2) {
            col = mix(vec3(lum), col, 1.45);
            col += col * col * 0.35;
            col = pow(col, vec3(0.88));
          } else {
            col = mix(vec3(lum), col, 1.20);
            col = pow(col, vec3(0.95));
          }
          
          vec2 vd = uv - 0.5;
          vd.x *= uResolution.x / uResolution.y;
          float vig = pow(1.0 - smoothstep(0.45, 0.95, length(vd)), 1.4);
          col *= mix(0.55, 1.0, vig);
          col += smoothGrain(uv, p) * mix(0.06, 0.025, lum);
          
          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `,
    });

    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // Frame-locked deterministic updates
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const material = materialRef.current;

    if (!renderer || !scene || !camera || !material) return;

    // Time increment computed purely from frames to maintain locking
    const elapsedTime = frame / fps;
    const uTimeValue = elapsedTime % LOOP_DURATION;

    material.uniforms.uTime.value = uTimeValue;
    material.uniforms.uResolution.value.set(width, height);

    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }, [frame, fps, width, height]);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const stageStyle: React.CSSProperties = {
    position: 'absolute',
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    boxShadow: '0 30px 90px rgba(0,0,0,0.65)',
    backgroundColor: '#06050a',
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    left: '14px',
    bottom: '12px',
    color: 'rgba(255,255,255,0.55)',
    fontSize: '12px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    pointerEvents: 'none',
    mixBlendMode: 'overlay',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  return (
    <div style={stageStyle}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={labelStyle}>03 · Sunset Dunes</div>
    </div>
  );
};

export default SunsetDunes;
// END_OF_FILE