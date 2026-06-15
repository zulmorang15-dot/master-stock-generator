import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Pre-calculate stars outside rendering loop to ensure deterministic frame rendering
const STAR_COUNT = 600;
const STAR_DATA = Array.from({ length: STAR_COUNT }, () => {
  const x = (Math.random() - 0.5) * 30;
  const y = (Math.random() - 0.5) * 20;
  const zStart = Math.random() * 28;
  const loops = Math.floor(Math.random() * 4) + 1;
  const speed = (28 * loops) / (900 * 5); // perfect 15-second loop quantization
  return { x, y, zStart, speed };
});

// Pre-calculate bokeh particles
const BOKEH_COUNT = 25;
const BOKEH_DATA = Array.from({ length: BOKEH_COUNT }, () => {
  const x = (Math.random() - 0.5) * 25;
  const yStart = Math.random() * 16;
  const z = (Math.random() - 0.5) * 10;
  const scale = Math.random() * 3 + 1;
  const loops = Math.floor(Math.random() * 3) + 1;
  const speed = (16 * loops) / 900; // perfect 15-second loop quantization
  const opacityBase = Math.random() * 0.3 + 0.1;
  return { x, yStart, z, scale, speed, opacityBase };
});

const createGlowTexture = () => {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(150,200,255,0.4)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(c);
};

const createGrid = (side: number) => {
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
  return { group };
};

export const ThanksForWatching: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const starGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const gridLeftRef = useRef<THREE.Group | null>(null);
  const gridRightRef = useRef<THREE.Group | null>(null);
  const bokehSpritesRef = useRef<THREE.Sprite[]>([]);
  const ringGroupRef = useRef<THREE.Group | null>(null);
  const ringGlowMatRef = useRef<THREE.SpriteMaterial | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.05);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;

    const leftGridObj = createGrid(-1);
    const rightGridObj = createGrid(1);
    scene.add(leftGridObj.group);
    scene.add(rightGridObj.group);
    gridLeftRef.current = leftGridObj.group;
    gridRightRef.current = rightGridObj.group;

    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = STAR_DATA[i].x;
      positions[i * 3 + 1] = STAR_DATA[i].y;
      positions[i * 3 + 2] = -20 + (STAR_DATA[i].zStart % 28);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeoRef.current = starGeo;

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    const glowTex = createGlowTexture();

    const bokehGroup = new THREE.Group();
    const sprites: THREE.Sprite[] = [];
    BOKEH_DATA.forEach((data) => {
      const mat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x66bbff,
        transparent: true,
        opacity: data.opacityBase,
        blending: THREE.AdditiveBlending,
      });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(data.scale, data.scale, 1);
      sp.position.set(data.x, -8 + (data.yStart % 16), data.z);
      bokehGroup.add(sp);
      sprites.push(sp);
    });
    scene.add(bokehGroup);
    bokehSpritesRef.current = sprites;

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

    const ringGlowMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0x2ee6ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    ringGlowMatRef.current = ringGlowMat;
    const ringGlow = new THREE.Sprite(ringGlowMat);
    ringGlow.scale.set(6, 6, 1);
    ringGlow.position.copy(ringGroup.position);
    scene.add(ringGlow);

    return () => {
      renderer.dispose();
      glowTex.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        } else if (obj instanceof THREE.Line) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        } else if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        } else if (obj instanceof THREE.Sprite) {
          obj.material.dispose();
        }
      });
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    // K = 10 ensures coefficient scales (1.0, 3.0, 0.3) evaluate to exact integers over 15s (900 frames)
    const K = 10;
    const time = (frame / 900) * Math.PI * 2 * K;

    const starGeo = starGeoRef.current;
    if (starGeo) {
      const positions = starGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < STAR_COUNT; i++) {
        const sData = STAR_DATA[i];
        const z = -20 + ((sData.zStart + frame * sData.speed * 5) % 28);
        positions[i * 3 + 2] = z;
      }
      starGeo.attributes.position.needsUpdate = true;
    }

    const gridLeft = gridLeftRef.current;
    const gridRight = gridRightRef.current;
    if (gridLeft) {
      gridLeft.position.z = -15 + Math.sin(time) * 0.5;
    }
    if (gridRight) {
      gridRight.position.z = -15 + Math.cos(time) * 0.5;
    }

    const sprites = bokehSpritesRef.current;
    sprites.forEach((sp, idx) => {
      const data = BOKEH_DATA[idx];
      const y = -8 + ((data.yStart + frame * data.speed) % 16);
      sp.position.y = y;
      sp.material.opacity = 0.1 + Math.abs(Math.sin(time + data.x)) * 0.25;
    });

    const ringGroup = ringGroupRef.current;
    if (ringGroup) {
      const pulse = 1 + Math.sin(time * 3) * 0.05;
      ringGroup.scale.set(pulse, pulse, pulse);
    }

    const ringGlowMat = ringGlowMatRef.current;
    if (ringGlowMat) {
      ringGlowMat.opacity = 0.4 + Math.sin(time * 3) * 0.2;
    }

    camera.position.x = Math.sin(time * 0.3) * 0.3;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }, [frame]);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const pulseFrame = frame % 90;
  const pulseScale = interpolate(pulseFrame, [0, 45, 90], [1, 1.06, 1], { easing: Easing.inOut(Easing.quad) });
  const glowRadius = interpolate(pulseFrame, [0, 45, 90], [20, 40, 20], { easing: Easing.inOut(Easing.quad) });
  const insetGlow = interpolate(pulseFrame, [0, 45, 90], [15, 25, 15], { easing: Easing.inOut(Easing.quad) });
  const insetOpacity = interpolate(pulseFrame, [0, 45, 90], [0.4, 0.7, 0.4], { easing: Easing.inOut(Easing.quad) });

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
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
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
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#fff',
            fontSize: '54px',
            fontWeight: 900,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          THANKS FOR<br />
          <span
            style={{
              color: '#2ee6ff',
              textShadow: '0 0 15px #2ee6ff, 0 0 30px #2ee6ff',
            }}
          >
            WATCHING
          </span>
        </div>

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
              fontSize: '23px',
              fontWeight: 'bold',
            }}
          >
            Recommended Video
          </div>
        </div>

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
              fontSize: '23px',
              fontWeight: 'bold',
            }}
          >
            Recommended Video
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${pulseScale})`,
            padding: '14px 35px',
            border: '3px solid #2ee6ff',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '31px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            background: 'rgba(0,20,40,0.4)',
            boxShadow: `0 0 ${glowRadius}px #2ee6ff, inset 0 0 ${insetGlow}px rgba(46,230,255,${insetOpacity})`,
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
        >
          SUBSCRIBE
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.25)',
            fontSize: '48px',
            fontWeight: 900,
            letterSpacing: '6px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
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