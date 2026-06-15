import { useVideoConfig, useCurrentFrame } from 'remotion';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const ElegantLiquidGradient: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const uniformsRef = useRef<{ [key: string]: THREE.IUniform } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT, false);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const LOOP = 15.0; // Match seamless 15 seconds loop

    const uniforms = {
      uTime:       { value: 0 },
      uLoop:       { value: LOOP },
      uResolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
      uColBlue:    { value: new THREE.Vector3(0.22, 0.34, 0.82) },
      uColPurple:  { value: new THREE.Vector3(0.62, 0.24, 0.78) },
      uColPink:    { value: new THREE.Vector3(0.93, 0.40, 0.66) },
      uColOrange:  { value: new THREE.Vector3(0.97, 0.62, 0.22) },
      uColPeach:   { value: new THREE.Vector3(0.99, 0.85, 0.78) },
      uColRed:     { value: new THREE.Vector3(0.83, 0.16, 0.34) },
      uColDark:    { value: new THREE.Vector3(0.07, 0.05, 0.10) },
    };
    uniformsRef.current = uniforms;

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
        uniform vec2  uResolution;
        uniform vec3  uColBlue, uColPurple, uColPink, uColOrange, uColPeach, uColRed, uColDark;
        #define TAU 6.28318530718

        float ph(){ return (uTime / uLoop) * TAU; }

        float inf(vec2 uv, vec2 c, float r){
          return 1.0 - smoothstep(0.0, r, length(uv - c));
        }

        // ---- Hash & noise untuk grain halus ----
        float hash(vec2 p){
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        // Grain seamless: blend 2 frame noise secara periodik (tanpa loncatan)
        float smoothGrain(vec2 uv, float p){
          // dua "seed" yang berputar dalam satu loop
          float t  = p / TAU;                 // 0..1 dalam loop
          float f  = fract(t * 24.0);         // sub-frame untuk variasi cepat
          float i  = floor(t * 24.0);
          vec2 g   = uv * uResolution * 0.9;
          float n1 = hash(g + i);
          float n2 = hash(g + i + 1.0);
          // smoothstep blend → tidak ada patahan antar frame
          float n  = mix(n1, n2, smoothstep(0.0, 1.0, f));
          return n * 2.0 - 1.0;
        }

        void main(){
          vec2 uv = vUv;
          float p = ph();

          vec2 cBlue   = vec2(0.28 + 0.10*cos(p),          0.70 + 0.08*sin(p));
          vec2 cPurple = vec2(0.40 + 0.09*cos(p + 1.2),    0.78 + 0.07*sin(p + 0.6));
          vec2 cPink   = vec2(0.82 + 0.08*cos(p + 2.0),    0.55 + 0.10*sin(p + 1.5));
          vec2 cOrange = vec2(0.68 + 0.07*cos(p + 3.1),    0.42 + 0.09*sin(p + 2.4));
          vec2 cPeach  = vec2(0.74 + 0.06*cos(p + 4.0),    0.50 + 0.06*sin(p + 3.3));
          vec2 cRed    = vec2(0.18 + 0.09*cos(p + 5.0),    0.30 + 0.08*sin(p + 4.2));
          vec2 cDark   = vec2(0.30 + 0.08*cos(p + 0.7),    0.10 + 0.07*sin(p + 5.1));

          float r = 0.55 + 0.06 * sin(p);

          vec3 col = uColDark;
          col = mix(col, uColBlue,   clamp(inf(uv, cBlue,   r + 0.05), 0.0, 1.0));
          col = mix(col, uColPurple, clamp(inf(uv, cPurple, r),        0.0, 1.0) * 0.95);
          col = mix(col, uColRed,    clamp(inf(uv, cRed,    r - 0.05), 0.0, 1.0) * 0.9);
          col = mix(col, uColOrange, clamp(inf(uv, cOrange, r - 0.08), 0.0, 1.0) * 0.95);
          col = mix(col, uColPeach,  clamp(inf(uv, cPeach,  r - 0.18), 0.0, 1.0) * 0.85);
          col = mix(col, uColPink,   clamp(inf(uv, cPink,   r + 0.02), 0.0, 1.0) * 0.95);

          col = mix(col, uColDark, clamp(inf(uv, cDark, 0.32), 0.0, 1.0) * 0.55);

          // saturasi & gamma
          float lum = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(vec3(lum), col, 1.20);
          col = pow(col, vec3(0.95));

          // ---- VIGNETTE SINEMATIK (radial, halus, warm falloff) ----
          vec2 vd = uv - 0.5;
          vd.x *= uResolution.x / uResolution.y; // koreksi aspek → vignette bulat sempurna
          float dist = length(vd);
          float vig = 1.0 - smoothstep(0.45, 0.95, dist);
          vig = pow(vig, 1.4);                 // falloff lebih lembut & dalam
          col *= mix(0.55, 1.0, vig);          // pojok lebih gelap untuk kesan premium

          // ---- GRAIN HALUS & SEAMLESS ----
          float g = smoothGrain(uv, p);
          // grain lebih terlihat di area gelap, halus di terang (film-like)
          float grainAmt = mix(0.06, 0.025, lum);
          col += g * grainAmt;

          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !uniformsRef.current) {
      return;
    }

    const LOOP = 15.0; // Exactly match 15 seconds
    const elapsedTime = (frame / fps) % LOOP;

    uniformsRef.current.uTime.value = elapsedTime;

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
        backgroundColor: '#08060d',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
};

export default ElegantLiquidGradient;
// END_OF_FILE