import { useVideoConfig, useCurrentFrame } from 'remotion';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const FlowingOrganicInk: React.FC = () => {
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

    // 1. Initialize Renderer with absolute resolution to keep rendering consistent
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);
    rendererRef.current = renderer;

    // 2. Setup Orthographic Camera to draw a direct 2D screen quad
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 3. Define uniforms matching original HTML Shader
    const uniforms = {
      time: { value: 0.0 },
      resolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
    };

    // 4. Create Geometry & Shader Material
    const geometry = new THREE.PlaneGeometry(2, 2);
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

        void main() {
          // 1. Menyesuaikan rasio aspek layar 16:9
          vec2 aR = vec2(resolution.x / resolution.y, 1.0);
          vec2 uv = (vUv - 0.5) * aR;
          
          // 2. Trik Loop Waktu (Perfect Loop)
          float duration = 20.0; // Waktu satu putaran aliran
          float t = fract(time / duration); // Bergerak dari 0.0 ke 1.0
          
          // 3. EFEK MENGALIR (Flowing)
          // Mendorong fluida bergerak secara linear (diagonal ke atas-kanan).
          // Pergeseran sejauh persis 2.0 * PI menjamin bentuk akhirnya kembali sama persis seperti awal (loop).
          vec2 flowDir = vec2(1.0, 1.0); 
          vec2 flowOffset = flowDir * (t * 2.0 * PI); 
          
          // Gerakan mengaduk internal agar tidak sekadar bergeser seperti gambar datar
          float theta = t * 2.0 * PI;
          vec2 swirl = vec2(cos(theta), sin(theta)) * 0.6;
          
          // Skala dan titik awal aliran
          vec2 p = (uv * 3.5) + flowOffset;

          // 4. Simulasi Fluid (Domain Warping)
          for(float i = 1.0; i < 7.0; i++) {
            vec2 newp = p;
            // 'i' selalu bilangan bulat. Memastikan kelipatan gelombang tidak merusak loop.
            newp.x += 0.7 / i * sin(i * p.y + swirl.x + PI * 0.25);
            newp.y += 0.7 / i * cos(i * p.x + swirl.y - PI * 0.25);
            p = newp;
          }

          // 5. LAPISAN WARNA ORGANIK (Tanpa Garis Lurus/Dipole)
          // Menggunakan perkalian bilangan bulat agar pergeseran 2*PI dari 'flowOffset' tetap loop.
          float layer1 = sin(p.x) * cos(p.y);
          float layer2 = sin(p.x - p.y) * cos(p.x + p.y);
          float layer3 = sin(p.x * 2.0 + p.y);
          float layer4 = cos(p.y * 2.0 - p.x);

          // 6. Pencampuran Warna Padat dan Penuh Layar
          vec3 col = vec3(0.06, 0.03, 0.15); // Warna dasar gelap ungu kebiruan (mengisi ruang antar tinta)

          // Smoothstep memuluskan gradasi warna (-1 ke 1) menjadi (0 ke 1) dengan mulus
          col += vec3(0.00, 0.75, 0.95) * smoothstep(-1.0, 1.0, layer1); // Cyan
          col += vec3(0.95, 0.15, 0.55) * smoothstep(-1.0, 1.0, layer2); // Magenta
          col += vec3(1.00, 0.65, 0.00) * smoothstep(-1.0, 1.0, layer3); // Orange/Emas
          col += vec3(0.20, 0.10, 0.85) * smoothstep(-1.0, 1.0, layer4); // Biru

          // 7. Penyesuaian Kecerahan & Saturasi
          col /= 2.2; // Menekan cahaya berlebih saat warna bertumpuk
          col = pow(col, vec3(0.92)); // Menarik warna mid-tone agar lebih cerah
          col *= 1.35; // Intensitas akhir layar

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      uniforms: uniforms,
      depthWrite: false,
      depthTest: false,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Initial render
    renderer.render(scene, camera);

    // Cleanup resources to prevent WebGL memory leaks
    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // 5. Frame-locked deterministic rendering loop
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const material = materialRef.current;

    if (renderer && scene && camera && material) {
      // Symmetrical Loop Duration logic: exactly 20 seconds loop duration
      const totalFrames = fps * 20; 
      const progress = (frame % totalFrames) / totalFrames;
      const deterministicTime = progress * 20.0;

      material.uniforms.time.value = deterministicTime;
      renderer.render(scene, camera);
    }
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
        backgroundColor: '#000',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#111',
          position: 'relative',
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

export default FlowingOrganicInk;
// END_OF_FILE