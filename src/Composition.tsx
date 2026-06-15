import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic seedable random for stars to keep output strictly frame-locked and reproducible
const createDeterministicStars = (count: number): Float32Array => {
  let seed = 42;
  const random = (): number => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 0] = (random() - 0.5) * 90;
    pos[i * 3 + 1] = random() * 35; // Positioned above the floor
    pos[i * 3 + 2] = -random() * 140 + 20;
  }
  return pos;
};

export const RetroGridOutro: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const grid2Ref = useRef<THREE.GridHelper | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const starsMaterialRef = useRef<THREE.PointsMaterial | null>(null);

  // Scale factor to preserve 16:9 full-screen aspect ratio without black bars
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Pre-calculated deterministic stars positions
  const starsPositions = useMemo(() => createDeterministicStars(900), []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x02040a, 8, 55);

    const camera = new THREE.PerspectiveCamera(70, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 200);
    camera.position.set(0, 3.2, 12);
    camera.lookAt(0, 1.5, -30);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(1); // Frame-by-frame rendering performance optimization
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setClearColor(0x02040a, 1);

    const makeGrid = (): THREE.GridHelper => {
      const size = 120;
      const div = 60;
      const g = new THREE.GridHelper(size, div, 0x19b6ff, 0x0f6fa0);
      const mat = g.material as THREE.LineBasicMaterial;
      mat.transparent = true;
      mat.opacity = 0.55;
      g.position.y = 0;
      return g;
    };

    const grid = makeGrid();
    const grid2 = makeGrid();
    grid2.position.z = -120;
    scene.add(grid, grid2);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xcfeaff,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(geo, starsMaterial);
    scene.add(stars);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    gridRef.current = grid;
    grid2Ref.current = grid2;
    starsRef.current = stars;
    starsMaterialRef.current = starsMaterial;

    renderer.render(scene, camera);

    return () => {
      renderer.dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      grid2.geometry.dispose();
      (grid2.material as THREE.Material).dispose();
      stars.geometry.dispose();
      starsMaterial.dispose();
    };
  }, [starsPositions]);

  // Frame-locked render loop
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const grid = gridRef.current;
    const grid2 = grid2Ref.current;
    const stars = starsRef.current;
    const starsMaterial = starsMaterialRef.current;

    if (!renderer || !scene || !camera) return;

    const t = frame / fps;
    const speed = 16; // Set to 16 so distance traveled in 15s (240 units) is a multiple of grid span (120) for perfect looping
    const span = 120;

    // Advance floor grid seamlessly
    if (grid) {
      grid.position.z = (t * speed) % span;
    }
    if (grid2) {
      grid2.position.z = ((t * speed) % span) - span;
    }

    // Stars drifting and fading seamlessly (using perfect divisor harmonics for 15s cycle)
    if (stars && starsMaterial) {
      starsMaterial.opacity = 0.6 + 0.3 * Math.sin(t * ((10 * Math.PI) / 15));
      stars.position.z = (t * speed * 0.25) % 30; // 30 is a clean divisor of the 60 total units covered in 15s
    }

    // Cinematic camera bobbing (seamlessly loops with custom harmonic frequencies)
    camera.position.y = 3.2 + Math.sin(t * ((4 * Math.PI) / 15)) * 0.25;
    camera.position.x = Math.sin(t * ((2 * Math.PI) / 15)) * 0.6;
    camera.lookAt(0, 1.5, -30);

    renderer.render(scene, camera);
  }, [frame, fps]);

  // =========================================================================
  // INTERPOLATIONS & EASINGS (Replaces GSAP & CSS animations for frame-safety)
  // =========================================================================

  // 1. SUBSCRIBE PILL ENTRANCE & EXIT (Symmetric and loops perfectly at 15s / 900f)
  const subWrapOpacity = interpolate(frame, [0, 60, 840, 900], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const subWrapX = interpolate(frame, [0, 60, 840, 900], [-200, 0, 0, -200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // SUBSCRIBE PILL PULSE GLOW (loops every 90 frames / 1.5 seconds)
  const subPillPulseGlow = 0.5 + 0.5 * Math.sin((frame / 90) * 2 * Math.PI);
  const subPillGlowRadius1 = interpolate(subPillPulseGlow, [0, 1], [25, 40]);
  const subPillGlowRadius2 = interpolate(subPillPulseGlow, [0, 1], [50, 70]);
  const subPillColor1 = subPillPulseGlow < 0.5 ? '#19b6ff' : '#5ad8ff';
  const subPillColor2 = subPillPulseGlow < 0.5 ? 'rgba(25,182,255,0.5)' : 'rgba(25,182,255,0.7)';
  const subPillBoxShadow = `0 0 ${subPillGlowRadius1}px ${subPillColor1}, 0 0 ${subPillGlowRadius2}px ${subPillColor2}, inset 0 0 30px rgba(0,0,0,0.25)`;

  // 2. TITLE ENTRANCE & EXIT (Delayed entrance, symmetric exit)
  const titleOpacity = interpolate(frame, [12, 72, 828, 888], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const titleX = interpolate(frame, [12, 72, 828, 888], [200, 0, 0, 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // TITLE PULSE GLOW (loops every 100 frames)
  const titlePulseGlow = 0.5 + 0.5 * Math.sin((frame / 100) * 2 * Math.PI);
  const titleGlowRadius = interpolate(titlePulseGlow, [0, 1], [18, 28]);
  const titleGlowColor = titlePulseGlow < 0.5 ? 'rgba(25,182,255,0.9)' : 'rgba(90,216,255,1)';
  const titleWhiteGlow = interpolate(titlePulseGlow, [0, 1], [4, 6]);
  const titleTextShadow = `0 0 ${titleGlowRadius}px ${titleGlowColor}, 0 0 ${titleWhiteGlow}px #fff`;

  // 3. NEXT VIDEO FRAME ENTRANCE & EXIT (Scale & fade, delayed)
  const nextFrameOpacity = interpolate(frame, [30, 90, 810, 870], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const nextFrameScale = interpolate(frame, [30, 90, 810, 870], [0.6, 1.0, 1.0, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.back(1.6),
  });

  // 4. CTA SPANS ENTRANCE, EXIT & PULSES (Staggered offsets, symmetric loop)
  const cta1Opacity = interpolate(frame, [42, 84, 816, 858], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const cta1X = interpolate(frame, [42, 84, 816, 858], [-80, 0, 0, -80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const cta2Opacity = interpolate(frame, [53, 95, 805, 847], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const cta2X = interpolate(frame, [53, 95, 805, 847], [-80, 0, 0, -80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const cta3Opacity = interpolate(frame, [64, 106, 794, 836], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const cta3X = interpolate(frame, [64, 106, 794, 836], [-80, 0, 0, -80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // CTA Pulse glows (loops every 150 frames, cleanly repeating 6 times in 900f)
  const ctaPulseGlow1 = 0.5 + 0.5 * Math.sin(((frame - 0) / 150) * 2 * Math.PI);
  const ctaPulseGlow2 = 0.5 + 0.5 * Math.sin(((frame - 15) / 150) * 2 * Math.PI);
  const ctaPulseGlow3 = 0.5 + 0.5 * Math.sin(((frame - 30) / 150) * 2 * Math.PI);

  const ctaGlowRadius1 = interpolate(ctaPulseGlow1, [0, 1], [14, 24]);
  const ctaGlowColor1 = ctaPulseGlow1 < 0.5 ? 'rgba(25,182,255,0.7)' : 'rgba(90,216,255,1)';
  const ctaTextShadow1 = `0 0 ${ctaGlowRadius1}px ${ctaGlowColor1}, 0 2px 5px rgba(0,0,0,0.6)`;

  const ctaGlowRadius2 = interpolate(ctaPulseGlow2, [0, 1], [14, 24]);
  const ctaGlowColor2 = ctaPulseGlow2 < 0.5 ? 'rgba(25,182,255,0.7)' : 'rgba(90,216,255,1)';
  const ctaTextShadow2 = `0 0 ${ctaGlowRadius2}px ${ctaGlowColor2}, 0 2px 5px rgba(0,0,0,0.6)`;

  const ctaGlowRadius3 = interpolate(ctaPulseGlow3, [0, 1], [14, 24]);
  const ctaGlowColor3 = ctaPulseGlow3 < 0.5 ? 'rgba(25,182,255,0.7)' : 'rgba(90,216,255,1)';
  const ctaTextShadow3 = `0 0 ${ctaGlowRadius3}px ${ctaGlowColor3}, 0 2px 5px rgba(0,0,0,0.6)`;

  // =========================================================================
  // RENDER JSX (Edge-to-edge scalable layout)
  // =========================================================================

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
        fontFamily: "'Arial Black', Arial, sans-serif",
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
        
        {/* SUBSCRIBE pill (kiri atas) */}
        <div
          id="subWrap"
          style={{
            position: 'absolute',
            top: '9%',
            left: '2%',
            width: '44%',
            minWidth: 320,
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'auto',
            opacity: subWrapOpacity,
            transform: `translateX(${subWrapX}px)`,
          }}
        >
          <div
            id="subPill"
            style={{
              position: 'relative',
              flex: 1,
              height: 130,
              background: 'linear-gradient(180deg, #b9bdc1 0%, #8d9296 100%)',
              borderRadius: '80px',
              border: '5px solid #19b6ff',
              boxShadow: subPillBoxShadow,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '6%',
            }}
          >
            <span
              style={{
                color: '#19b6ff',
                fontSize: 44,
                letterSpacing: '1px',
                textShadow: '0 0 12px rgba(25,182,255,0.9), 0 2px 3px rgba(0,0,0,0.4)',
              }}
            >
              SUBSCRIBE
            </span>
            <div
              id="subKnob"
              style={{
                position: 'absolute',
                right: '-4%',
                width: 115,
                height: 115,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 35%, #888 0%, #555 60%, #3a3a3a 100%)',
                border: '6px solid #19b6ff',
                boxShadow: '0 0 30px #19b6ff, inset 0 0 20px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>

        {/* THANKS FOR WATCHING (kanan atas) */}
        <div
          id="title"
          style={{
            position: 'absolute',
            top: '6%',
            right: '3%',
            textAlign: 'right',
            lineHeight: 1.0,
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
          }}
        >
          <h1
            style={{
              color: '#cfe9ff',
              fontSize: 64,
              letterSpacing: '1px',
              textShadow: titleTextShadow,
              margin: 0,
            }}
          >
            THANKS FOR
            <br />
            WATCHING
          </h1>
        </div>

        {/* NEXT VIDEO frame (kanan tengah-bawah) */}
        <div
          id="nextFrame"
          style={{
            position: 'absolute',
            top: '30%',
            right: '3%',
            width: '42%',
            height: 504,
            border: '4px solid #aeb3b7',
            borderRadius: 18,
            backgroundColor: 'rgba(2,8,18,0.15)',
            boxShadow: '0 0 20px rgba(25,182,255,0.5), inset 0 0 30px rgba(25,182,255,0.12)',
            pointerEvents: 'auto',
            opacity: nextFrameOpacity,
            transform: `scale(${nextFrameScale})`,
            transformOrigin: '50% 50%',
          }}
        >
          {/* Cyan glow side tab */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              right: -7,
              width: 7,
              height: '22%',
              backgroundColor: '#19b6ff',
              borderRadius: 4,
              boxShadow: '0 0 12px #19b6ff',
            }}
          />
          <div
            id="nextLabel"
            style={{
              position: 'absolute',
              bottom: '-16%',
              right: 0,
              color: '#fff',
              fontSize: 36,
              textShadow: '0 0 12px rgba(25,182,255,0.6)',
            }}
          >
            Next Video
          </div>
        </div>

        {/* LIKE / COMMENT / SHARE (kiri bawah) */}
        <div
          id="cta"
          style={{
            position: 'absolute',
            bottom: '6%',
            left: '7%',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <span
            style={{
              color: '#fff',
              fontStyle: 'italic',
              fontSize: 36,
              letterSpacing: '2px',
              opacity: cta1Opacity,
              transform: `translateX(${cta1X}px)`,
              textShadow: ctaTextShadow1,
            }}
          >
            LIKE
          </span>
          <span
            style={{
              color: '#fff',
              fontStyle: 'italic',
              fontSize: 36,
              letterSpacing: '2px',
              opacity: cta2Opacity,
              transform: `translateX(${cta2X}px)`,
              textShadow: ctaTextShadow2,
            }}
          >
            COMMENT
          </span>
          <span
            style={{
              color: '#fff',
              fontStyle: 'italic',
              fontSize: 36,
              letterSpacing: '2px',
              opacity: cta3Opacity,
              transform: `translateX(${cta3X}px)`,
              textShadow: ctaTextShadow3,
            }}
          >
            SHARE
          </span>
        </div>

      </div>
    </div>
  );
};

export default RetroGridOutro;
// END_OF_FILE