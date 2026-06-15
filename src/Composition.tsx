import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime1;
  uniform float uTime2;
  uniform float uBlend;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // ── Permutation helpers ──────────────────────────────────────────────
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }

  // ── Classic Perlin 3D ────────────────────────────────────────────────
  float cnoise(vec3 P){
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy  = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000,n100,n010,n110), vec4(n001,n101,n011,n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }

  // ── FBM (fractal Brownian motion) ────────────────────────────────────
  float fbm(vec3 p) {
    float value = 0.0;
    float amp   = 0.5;
    float freq  = 1.0;
    for (int i = 0; i < 6; i++) {
      value += amp * cnoise(p * freq);
      freq  *= 2.0;
      amp   *= 0.5;
    }
    return value;
  }

  // ── Colour palette (cosine) ──────────────────────────────────────────
  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  vec3 getSceneColor(vec2 uv, float t) {
    float ar = uResolution.x / uResolution.y;
    vec2 st = uv;
    st.x *= ar;

    // ── Domain‐warped FBM layers ─────────────────────────────────────
    vec3 q = vec3(st, t);
    float qx = fbm(q);
    float qy = fbm(q + vec3(5.2, 1.3, 2.8));
    float qz = fbm(q + vec3(2.4, 6.1, 4.0));

    vec3 r = vec3(st, t);
    float rx = fbm(r + 4.0 * vec3(qx, qy, qz) + vec3(1.7, 9.2, 0.5));
    float ry = fbm(r + 4.0 * vec3(qx, qy, qz) + vec3(8.3, 2.8, 7.1));
    float rz = fbm(r + 4.0 * vec3(qx, qy, qz) + vec3(3.1, 4.4, 5.9));

    // Third warp pass for extra complexity
    vec3 s = vec3(st, t);
    float f = fbm(s + 3.5 * vec3(rx, ry, rz));

    // ── Deep-sea colour palette: dark teal → electric blue → magenta ──
    float idx = f * 0.5 + 0.5;
    idx = pow(idx, 1.1);

    // Primary palette: midnight ocean
    vec3 colA = palette(
      idx,
      vec3(0.02, 0.03, 0.08),   // dark base
      vec3(0.15, 0.25, 0.45),   // amplitude
      vec3(1.0,  1.0,  1.0 ),   // frequency
      vec3(0.00, 0.20, 0.50)    // phase
    );

    // Accent layer: electric / neon edges
    float edge = smoothstep(0.3, 0.8, abs(f));
    vec3 neon  = palette(
      idx + t * 0.05,
      vec3(0.05, 0.00, 0.12),
      vec3(0.30, 0.20, 0.40),
      vec3(0.80, 1.20, 0.90),
      vec3(0.55, 0.80, 0.30)
    );

    vec3 col = mix(colA, neon, edge * 0.65);

    // ── Thin glowing ridges ──────────────────────────────────────────
    float ridge = 1.0 - abs(f);
    ridge = pow(clamp(ridge, 0.0, 1.0), 18.0);
    col  += ridge * vec3(0.05, 0.25, 0.55) * 1.8;

    // ── Vignette ────────────────────────────────────────────────────
    vec2 vUv2 = uv - 0.5;
    float vign = 1.0 - dot(vUv2, vUv2) * 1.6;
    col *= clamp(vign, 0.0, 1.0);

    // ── Gamma & exposure ────────────────────────────────────────────
    col = pow(max(col, 0.0), vec3(0.85));

    return col;
  }

  void main() {
    vec3 col1 = getSceneColor(vUv, uTime1 * 0.18);
    vec3 col2 = getSceneColor(vUv, uTime2 * 0.18);
    vec3 col = mix(col1, col2, uBlend);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const Displex: React.FC = () => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(1);
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      uTime1: { value: 0.0 },
      uTime2: { value: 0.0 },
      uBlend: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(ORIGINAL_WIDTH, ORIGINAL_HEIGHT) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
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

  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const material = materialRef.current;

    if (renderer && scene && camera && material) {
      const totalDurationSec = durationInFrames / fps;
      const progress = frame / durationInFrames;

      const time1 = progress * totalDurationSec;
      const time2 = time1 - totalDurationSec;
      
      // Use smooth S-curve blend for the loop crossfade to avoid any linear transition artifacts
      const blend = Math.sin(progress * Math.PI * 0.5);

      material.uniforms.uTime1.value = time1;
      material.uniforms.uTime2.value = time2;
      material.uniforms.uBlend.value = blend;

      renderer.render(scene, camera);
    }
  }, [frame, fps, durationInFrames]);

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

export default Displex;
// END_OF_FILE