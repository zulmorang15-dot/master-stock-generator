import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const DeepOceanFluid: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
    };

    const material = new THREE.ShaderMaterial({
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
        uniform float time;
        uniform vec2 resolution;
        const float PI = 3.141592654;
        const float scale = 0.55;
        
        float cheapNoise(vec3 stp) {
          vec3 p = vec3(stp.st, stp.p);
          vec4 a = vec4(5.0, 7.0, 9.0, 13.0);
          return mix(
            sin(p.z + p.x * a.x + cos(p.x * a.x - p.z)) * cos(p.z + p.y * a.y + cos(p.y * a.x + p.z)),
            sin(1.0 + p.x * a.z + p.z + cos(p.y * a.w - p.z)) * cos(1.0 + p.y * a.w + p.z + cos(p.x * a.x + p.z)),
            0.436
          );
        }
        
        void main() {
          vec2 aR = vec2(resolution.x / resolution.y, 1.0);
          vec2 st = vUv * aR * scale;
          float duration = 20.0;
          float theta = 2.0 * PI * fract(time / duration);
          vec2 move1 = vec2(cos(theta) * 0.35, sin(theta) * 0.45);
          vec2 move2 = vec2(sin(theta * 2.0) * 0.6, cos(theta * 2.0) * 0.4);
          vec2 v1 = vec2(cheapNoise(vec3(st + move1, theta * 2.0)), cheapNoise(vec3(st - move1, theta * 1.0)));
          vec2 v2 = vec2(cheapNoise(vec3(st + v1 + move2, theta * 2.0)), cheapNoise(vec3(st + v1 - move2, theta * 3.0)));
          float n = 0.5 + 0.5 * cheapNoise(vec3(st + v2, theta * 1.0));
          
          vec3 c1 = vec3(0.0, 0.02, 0.08);
          vec3 c2 = vec3(0.0, 0.15, 0.35);
          vec3 c3 = vec3(0.0, 0.5, 0.7);
          vec3 c4 = vec3(0.4, 0.9, 0.85);
          
          vec3 color = mix(c1, c2, clamp((n * n) * 8.0, 0.0, 1.0));
          color = mix(color, c3, clamp(length(v1), 0.0, 1.0));
          color = mix(color, c4, clamp(length(v2.x) * 1.2, 0.0, 1.0));
          
          color /= n * n + n * 7.0;
          color = pow(color, vec3(0.82));
          color *= 1.45;
          
          float vig = 1.0 - length(vUv - 0.5) * 1.0;
          color *= clamp(vig, 0.3, 1.0);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      uniforms: uniforms,
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

  useEffect(() => {
    const renderer = rendererRef.current;
    const material = materialRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (renderer && material && scene && camera) {
      const cycleFrames = 20 * fps; 
      const localFrame = frame % cycleFrames;
      const elapsedTime = localFrame / fps;

      material.uniforms.time.value = elapsedTime;
      renderer.render(scene, camera);
    }
  }, [frame, fps]);

  const containerStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#111',
  };

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
  };

  return (
    <div style={containerStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  );
};

export default DeepOceanFluid;
// END_OF_FILE