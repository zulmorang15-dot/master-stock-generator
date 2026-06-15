import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float time;
  uniform vec2 resolution;
  const float PI = 3.141592654;
  const float scale = 0.25;

  float cheapNoise(vec3 stp) {
    vec3 p = vec3(stp.st, stp.p);
    vec4 a = vec4(5., 7., 9., 13.);
    return mix(
      sin(p.z + p.x * a.x + cos(p.x * a.x - p.z)) * cos(p.z + p.y * a.y + cos(p.y * a.x + p.z)),
      sin(1. + p.x * a.z + p.z + cos(p.y * a.w - p.z)) * cos(1. + p.y * a.w + p.z + cos(p.x * a.x + p.z)),
      0.436
    );
  }

  void main() {
    vec2 aR = vec2(resolution.x / resolution.y, 1.0);
    vec2 st = vUv * aR * scale;
    float duration = 60.0;
    float theta = 2.0 * PI * fract(time / duration);
    vec2 move1 = vec2(cos(theta) * 0.2, sin(theta) * 0.2);
    vec2 move2 = vec2(sin(theta * 2.0) * 0.3, cos(theta * 2.0) * 0.3);
    vec2 v1 = vec2(cheapNoise(vec3(st + move1, theta * 2.0)), cheapNoise(vec3(st - move1, theta * 1.0)));
    vec2 v2 = vec2(cheapNoise(vec3(st + v1 + move2, theta * 2.0)), cheapNoise(vec3(st + v1 - move2, theta * 3.0)));
    float n = 0.5 + 0.5 * cheapNoise(vec3(st + v2, theta * 1.0));

    // PALET MARMER
    vec3 c1 = vec3(0.05, 0.05, 0.05);  // Urat marmer gelap
    vec3 c2 = vec3(0.7, 0.7, 0.72);    // Abu-abu terang
    vec3 c3 = vec3(0.95, 0.95, 0.95);  // Off-white
    vec3 c4 = vec3(1.0, 0.98, 0.95);   // Putih bersih

    vec3 color = mix(c1, c2, clamp((n * n) * 8.0, 0.0, 1.0));
    color = mix(color, c3, clamp(length(v1), 0.0, 1.0));
    color = mix(color, c4, clamp(length(v2.x), 0.0, 1.0));
    color /= n * n + n * 7.0;
    color = pow(color, vec3(0.7));
    color *= 1.6;

    // Vignette dikurangi agar pinggiran tetap terang layaknya batu
    float vig = 1.0 - length(vUv - 0.5) * 0.6;
    color *= clamp(vig, 0.6, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const LiquidMarbleFluid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  // Responsive full-frame scaling configuration
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Initialize Three.js Scene once on mount
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
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
      },
      depthWrite: false,
      depthTest: false,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // Update uniforms deterministically on frame change and execute render pass
  useEffect(() => {
    if (!rendererRef.current || !materialRef.current || !sceneRef.current || !cameraRef.current) {
      return;
    }

    // Set a flawless 20-second loop duration cycle
    const cycleDuration = 20; // in seconds
    const totalCycleFrames = fps * cycleDuration;
    const localFrame = frame % totalCycleFrames;

    // Scale local time so it perfectly hits 60.0s (one full original loop cycle) at frame 1200
    const mappedTime = (localFrame / totalCycleFrames) * 60.0;

    materialRef.current.uniforms.time.value = mappedTime;
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
        backgroundColor: '#111',
      }}
    >
      <canvas
        ref={canvasRef}
        width={ORIGINAL_WIDTH}
        height={ORIGINAL_HEIGHT}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default LiquidMarbleFluid;
// END_OF_FILE