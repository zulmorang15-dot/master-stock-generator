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
  const float scale = 0.45;

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
    float duration = 20.0; // Match precisely with the 20-second Remotion composition loop
    float theta = 2.0 * PI * fract(time / duration);
    
    vec2 move1 = vec2(cos(theta) * 0.35, sin(theta) * 0.35);
    vec2 move2 = vec2(sin(theta * 2.0) * 0.55, cos(theta * 2.0) * 0.55);
    
    vec2 v1 = vec2(cheapNoise(vec3(st + move1, theta * 2.0)), cheapNoise(vec3(st - move1, theta * 1.0)));
    vec2 v2 = vec2(cheapNoise(vec3(st + v1 + move2, theta * 2.0)), cheapNoise(vec3(st + v1 - move2, theta * 3.0)));
    
    float n = 0.5 + 0.5 * cheapNoise(vec3(st + v2, theta * 1.0));
    
    // PALET EMAS (GOLD PALETTE)
    vec3 c1 = vec3(0.02, 0.015, 0.0);  // Gold-tinted dark black
    vec3 c2 = vec3(0.35, 0.2, 0.02);   // Dark amber
    vec3 c3 = vec3(0.85, 0.6, 0.15);   // Rich gold
    vec3 c4 = vec3(1.0, 0.9, 0.6);     // Bright gold sheen
    
    vec3 color = mix(c1, c2, clamp((n * n) * 8.0, 0.0, 1.0));
    color = mix(color, c3, clamp(length(v1), 0.0, 1.0));
    color = mix(color, c4, clamp(length(v2.x), 0.0, 1.0));
    
    color /= n * n + n * 7.0;
    color = pow(color, vec3(0.85));
    color *= 1.4;
    
    float vig = 1.0 - length(vUv - 0.5) * 0.9;
    color *= clamp(vig, 0.35, 1.0);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const GoldLuxuryFluid: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Refs to hold Three.js instances across renders
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Initialize Three.js WebGL context
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene and flat orthographic camera for 2D full screen rendering
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Create Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);

    // Geometry matches the full screen coordinates
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Material setup
    const uniforms = {
      time: { value: 0.0 },
      resolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Assign refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    materialRef.current = material;

    // Cleanup resources
    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // Frame-locked update effect
  useEffect(() => {
    if (
      !rendererRef.current ||
      !sceneRef.current ||
      !cameraRef.current ||
      !materialRef.current
    ) {
      return;
    }

    // Deterministic elapsed time calculated strictly from the frame
    const elapsedTime = frame / fps;

    // Update uniform values
    materialRef.current.uniforms.time.value = elapsedTime;
    materialRef.current.uniforms.resolution.value.set(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    // Draw the frame deterministically
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [frame, fps]);

  // Maintain proper edge-to-edge scaling with NO black bars
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

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
    display: 'block',
    width: '100%',
    height: '100%',
  };

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  );
};

export default GoldLuxuryFluid;
// END_OF_FILE