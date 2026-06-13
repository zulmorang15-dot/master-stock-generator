import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Pre-calculated static random data (OUTSIDE component — deterministic)
const STAR_COUNT = 600;
const STAR_POSITIONS: number[] = [];
const STAR_SPEEDS: number[] = [];

// Seeded pseudo-random using a simple LCG
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

for (let i = 0; i < STAR_COUNT; i++) {
  STAR_POSITIONS.push((seededRandom(i * 3 + 0) - 0.5) * 30);
  STAR_POSITIONS.push((seededRandom(i * 3 + 1) - 0.5) * 20);
  STAR_POSITIONS.push((seededRandom(i * 3 + 2) - 0.5) * 30);
  STAR_SPEEDS.push(seededRandom(i + 1000) * 0.01 + 0.002);
}

const BOKEH_COUNT = 25;
const BOKEH_DATA: { x: number; y: number; z: number; scale: number; baseOpacity: number; speed: number }[] = [];
for (let i = 0; i < BOKEH_COUNT; i++) {
  BOKEH_DATA.push({
    x: (seededRandom(i * 7 + 200) - 0.5) * 25,
    y: (seededRandom(i * 7 + 201) - 0.5) * 15,
    z: (seededRandom(i * 7 + 202) - 0.5) * 10,
    scale: seededRandom(i * 7 + 203) * 3 + 1,
    baseOpacity: seededRandom(i * 7 + 204) * 0.3 + 0.1,
    speed: seededRandom(i * 7 + 205) * 0.005 + 0.001,
  });
}

function createGlowTextureOffscreen(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(150,200,255,0.4)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const ThanksForWatching: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridLeftRef = useRef<THREE.Group | null>(null);
  const gridRightRef = useRef<THREE.Group | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const starPositionsRef = useRef<Float32Array | null>(null);
  const bokehRef = useRef<THREE.Group | null>(null);
  const ringGroupRef = useRef<THREE.Group | null>(null);
  const ringGlowRef = useRef<THREE.Sprite | null>(null);

  // Initialization effect — runs once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.05);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;

    // Glow texture
    const glowTex = createGlowTextureOffscreen();

    // === Grid ===
    function createGrid(side: number): THREE.Group {
      const group = new THREE.Group();
      const lineMat = new THREE.LineBasicMaterial({ color: 0x1a9ec4, transparent: true, opacity: 0.6 });
      const size = 40;
      const divisions = 25;
      for (let i = 0; i <= divisions; i++) {
        const t = (i / divisions) * size - size / 2;
        const g1 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(t, -size / 2, 0),
          new THREE.Vector3(t, size / 2, 0),
        ]);
        group.add(new THREE.Line(g1, lineMat));
        const g2 = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-size / 2, t, 0),
          new THREE.Vector3(size / 2, t, 0),
        ]);
        group.add(new THREE.Line(g2, lineMat));
      }
      group.position.z = -15;
      group.position.x = side * 12;
      group.rotation.y = side * 0.6;
      return group;
    }
    const gridLeft = createGrid(-1);
    const gridRight = createGrid(1);
    scene.add(gridLeft);
    scene.add(gridRight);
    gridLeftRef.current = gridLeft;
    gridRightRef.current = gridRight;

    // === Stars ===
    const positions = new Float32Array(STAR_POSITIONS);
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starsRef.current = stars;
    starPositionsRef.current = positions;

    // === Bokeh ===
    const bokehGroup = new THREE.Group();
    BOKEH_DATA.forEach((data) => {
      const mat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x66bbff,
        transparent: true,
        opacity: data.baseOpacity,
        blending: THREE.AdditiveBlending,
      });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(data.scale, data.scale, 1);
      sp.position.set(data.x, data.y, data.z);
      bokehGroup.add(sp);
    });
    scene.add(bokehGroup);
    bokehRef.current = bokehGroup;

    // === Ring ===
    const ringGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(1.3, 0.18, 16, 60);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2ee6ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ringGroup.add(ring);
    const diskGeo = new THREE.CircleGeometry(1.0, 40);
    const diskMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    ringGroup.add(new THREE.Mesh(diskGeo, diskMat));
    ringGroup.position.set(7, 0, -2);
    scene.add(ringGroup);
    ringGroupRef.current = ringGroup;

    const glowTex2 = createGlowTextureOffscreen();
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex2,
      color: 0x2ee6ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const ringGlow = new THREE.Sprite(glowMat);
    ringGlow.scale.set(6, 6, 1);
    ringGlow.position.copy(ringGroup.position);
    scene.add(ringGlow);
    ringGlowRef.current = ringGlow;

    // Initial render
    renderer.render(scene, camera);

    return () => {
      renderer.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else (mat as THREE.Material).dispose();
        }
      });
      glowTex.dispose();
      glowTex2.dispose();
    };
  }, []);

  // Deterministic per-frame render effect
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const gridLeft = gridLeftRef.current;
    const gridRight = gridRightRef.current;
    const stars = starsRef.current;
    const bokeh = bokehRef.current;
    const ringGroup = ringGroupRef.current;
    const ringGlow = ringGlowRef.current;
    const starPositions = starPositionsRef.current;

    if (!renderer || !scene || !camera || !gridLeft || !gridRight || !stars || !bokeh || !ringGroup || !ringGlow || !starPositions) return;

    // Cycle: 15 seconds = 900 frames at 60fps
    const cycleDuration = 15;
    const totalCycleFrames = fps * cycleDuration;
    const localFrame = frame % totalCycleFrames;
    const time = (localFrame / fps) * 1.0; // time in seconds within cycle, speed multiplier 1.0 matches original time += 0.01 per frame at 60fps → 0.6 per sec. We match original: time += 0.01 per frame

    // Original increments time by 0.01 each frame (at ~60fps that's 0.6/sec)
    // So elapsedTime in original units = localFrame * 0.01
    const origTime = localFrame * 0.01;

    // === Move stars toward camera deterministically ===
    // Each star moves forward by speeds[i]*5 per frame
    // Position at localFrame: baseZ + speeds[i]*5*localFrame, wrapped at 8 → reset to -20
    const geo = (stars.geometry as THREE.BufferGeometry);
    const pos = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < STAR_COUNT; i++) {
      const baseZ = STAR_POSITIONS[i * 3 + 2];
      const speed = STAR_SPEEDS[i] * 5;
      const range = 8 - (-20); // = 28
      const totalTravel = baseZ + speed * localFrame;
      // Wrap: compute z position with modular arithmetic
      let z = ((totalTravel - (-20)) % range + range) % range + (-20);
      // But we need to check if it ever exceeded 8 during travel
      // Simpler: direct modular position
      pos[i * 3 + 2] = z;
      // Keep x,y from original
      pos[i * 3] = STAR_POSITIONS[i * 3];
      pos[i * 3 + 1] = STAR_POSITIONS[i * 3 + 1];
    }
    geo.attributes.position.needsUpdate = true;

    // === Grid subtle motion ===
    gridLeft.position.z = -15 + Math.sin(origTime) * 0.5;
    gridRight.position.z = -15 + Math.cos(origTime) * 0.5;

    // === Bokeh animation ===
    bokeh.children.forEach((child, idx) => {
      const sp = child as THREE.Sprite;
      const data = BOKEH_DATA[idx];
      // y position: starts at data.y, moves up by data.speed per frame, wraps at 8 → -8
      const range = 8 - (-8); // = 16
      const travelY = data.y + data.speed * localFrame;
      let y = ((travelY - (-8)) % range + range) % range + (-8);
      sp.position.y = y;
      sp.position.x = data.x;
      sp.position.z = data.z;
      sp.material.opacity = 0.1 + Math.abs(Math.sin(origTime + data.x)) * 0.25;
    });

    // === Ring pulse ===
    const pulse = 1 + Math.sin(origTime * 3) * 0.05;
    ringGroup.scale.set(pulse, pulse, pulse);
    (ringGlow.material as THREE.SpriteMaterial).opacity = 0.4 + Math.sin(origTime * 3) * 0.2;

    // === Camera sway ===
    camera.position.x = Math.sin(origTime * 0.3) * 0.3;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }, [frame, fps]);

  // Subscribe button pulse animation — driven by frame
  const cycleDuration = 15;
  const totalCycleFrames = fps * cycleDuration;
  const localFrame = frame % totalCycleFrames;
  const origTime = localFrame * 0.01;

  // pulse: 1.5s period in original CSS (1.5s at 60fps = 90 frames)
  // Using origTime*speed to match CSS: pulse period = 1.5s → angular freq = 2π/1.5
  const pulseCycle = Math.sin((origTime / 1.5) * Math.PI); // normalized -1..1 with 1.5s period equivalent
  // Map 0%/100% → scale 1, 50% → scale 1.06
  const pulseT = (Math.sin(origTime * (2 * Math.PI / 1.5)) + 1) / 2; // 0..1
  const btnScale = interpolate(pulseT, [0, 0.5, 1], [1, 1.06, 1], { easing: Easing.inOut(Easing.sin) });
  const btnGlowOuter = interpolate(pulseT, [0, 0.5, 1], [20, 40, 20], { easing: Easing.inOut(Easing.sin) });
  const btnGlowInnerOpacity = interpolate(pulseT, [0, 0.5, 1], [0.4, 0.7, 0.4], { easing: Easing.inOut(Easing.sin) });
  const btnGlowInner = interpolate(pulseT, [0, 0.5, 1], [15, 25, 15], { easing: Easing.inOut(Easing.sin) });

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
        background: '#000',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
        }}
        width={ORIGINAL_WIDTH}
        height={ORIGINAL_HEIGHT}
      />

      {/* Overlay UI */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* Thanks text */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#fff',
            fontSize: '53.76px', // 2.8vw of 1920
            fontWeight: 900,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            lineHeight: 1.1,
            fontFamily: 'Arial, sans-serif',
          }}
        >
          THANKS FOR
          <br />
          <span
            style={{
              color: '#2ee6ff',
              textShadow: '0 0 15px #2ee6ff, 0 0 30px #2ee6ff',
            }}
          >
            WATCHING
          </span>
        </div>

        {/* Recommended box — top */}
        <div
          style={{
            position: 'absolute',
            left: '2%',
            top: '12%',
            width: '33%',
            height: '38%',
            border: '2px solid rgba(46,230,255,0.7)',
            borderRadius: '8px',
            boxShadow: '0 0 15px rgba(46,230,255,0.5)',
            background: 'rgba(0,30,50,0.15)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '6%',
              left: '8%',
              color: 'rgba(200,200,200,0.6)',
              fontSize: '23.04px', // 1.2vw of 1920
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Recommended Video
          </div>
        </div>

        {/* Recommended box — bottom */}
        <div
          style={{
            position: 'absolute',
            left: '2%',
            top: '52%',
            width: '33%',
            height: '38%',
            border: '2px solid rgba(46,230,255,0.7)',
            borderRadius: '8px',
            boxShadow: '0 0 15px rgba(46,230,255,0.5)',
            background: 'rgba(0,30,50,0.15)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '6%',
              left: '8%',
              color: 'rgba(200,200,200,0.6)',
              fontSize: '23.04px',
              fontWeight: 'bold',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Recommended Video
          </div>
        </div>

        {/* Subscribe button — animated via frame */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${btnScale})`,
            padding: '14px 35px',
            border: '3px solid #2ee6ff',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '30.72px', // 1.6vw of 1920
            fontWeight: 'bold',
            letterSpacing: '2px',
            background: 'rgba(0,20,40,0.4)',
            boxShadow: `0 0 ${btnGlowOuter}px #2ee6ff, inset 0 0 ${btnGlowInner}px rgba(46,230,255,${btnGlowInnerOpacity})`,
            cursor: 'pointer',
            pointerEvents: 'auto',
            fontFamily: 'Arial, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          SUBSCRIBE
        </div>

        {/* Bottom text */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.25)',
            fontSize: '48px', // 2.5vw of 1920
            fontWeight: 900,
            letterSpacing: '6px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          LIKE &nbsp;-&nbsp; COMMENT &nbsp;-&nbsp; SHARE
        </div>
      </div>
    </div>
  );
};

export default ThanksForWatching;
// END_OF_FILE