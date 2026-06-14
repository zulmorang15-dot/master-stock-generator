import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const GalaxyNebulaFluid: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);
    rendererRef.current = renderer;

    // Initialize Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;
    cameraRef.current = camera;

    // Vert shader
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Frag shader
    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float time;
      uniform vec2 resolution;
      const float PI = 3.141592654;
      const float scale = 0.6; // Lebih rapat untuk tekstur debu kosmik
      
      float cheapNoise(vec3 stp){
        vec3 p = vec3(stp.st, stp.p); 
        vec4 a = vec4(5., 7., 9., 13.);
        return mix(
          sin(p.z + p.x * a.x + cos(p.x * a.x - p.z)) * cos(p.z + p.y * a.y + cos(p.y * a.x + p.z)),
          sin(1. + p.x * a.z + p.z + cos(p.y * a.w - p.z)) * cos(1. + p.y * a.w + p.z + cos(p.x * a.x - p.z)),
          0.436
        );
      }
      
      void main(){
        vec2 aR = vec2(resolution.x / resolution.y, 1.);
        vec2 st = vUv * aR * scale;
        float duration = 20.0; // Adjusted from 35.0 to 20.0 to match seamless loop duration
        float theta = 2. * PI * fract(time / duration);
        vec2 move1 = vec2(sin(theta) * 0.4, cos(theta) * 0.4);
        vec2 move2 = vec2(cos(theta * 2.) * 0.6, sin(theta * 2.) * 0.5);
        vec2 v1 = vec2(cheapNoise(vec3(st + move1, theta * 2.)), cheapNoise(vec3(st - move1, theta * 1.)));
        vec2 v2 = vec2(cheapNoise(vec3(st + v1 + move2, theta * 2.)), cheapNoise(vec3(st + v1 - move2, theta * 3.)));
        float n = 0.5 + 0.5 * cheapNoise(vec3(st + v2, theta * 1.));
        
        // PALET GALAKSI
        vec3 c1 = vec3(0.02, 0.0, 0.05);   // Void / Luar angkasa gelap
        vec3 c2 = vec3(0.2, 0.0, 0.4);     // Ungu tua
        vec3 c3 = vec3(0.8, 0.1, 0.5);     // Magenta / Pink nebula
        vec3 c4 = vec3(0.9, 0.85, 1.0);    // Inti cahaya bintang
        
        vec3 color = mix(c1, c2, clamp((n * n) * 8., 0., 1.));
        color = mix(color, c3, clamp(length(v1), 0., 1.));
        color = mix(color, c4, clamp(length(v2.x), 0., 1.));
        color /= n * n + n * 7.; 
        color = pow(color, vec3(0.85)); 
        color *= 1.6;
        
        float vig = 1. - length(vUv - 0.5) * 1.1; 
        color *= clamp(vig, 0.1, 1.);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

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
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // Frame-locked deterministic rendering
  useEffect(() => {
    const material = materialRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (material && renderer && scene && camera) {
      const cycleDuration = 20; // 20 seconds loop period
      const localFrame = frame % (fps * cycleDuration);
      const timeValue = localFrame / fps;

      material.uniforms.time.value = timeValue;
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
    backgroundColor: '#000',
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

export default GalaxyNebulaFluid;
// END_OF_FILE