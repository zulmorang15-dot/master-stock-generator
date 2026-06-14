import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Pre-calculated deterministic star positions to avoid Math.random() in rendering
const STAR_COUNT = 1200;
const STAR_DATA = (() => {
  const arr = [];
  let seed = 12345;
  function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
  for (let i = 0; i < STAR_COUNT; i++) {
    arr.push({
      x: (random() - 0.5) * 80,
      y: (random() - 0.5) * 80,
      z: -random() * 600
    });
  }
  return arr;
})();

const tunnelLength = 600;

function makeCurve() {
  const points = [];
  const segments = 16;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    points.push(new THREE.Vector3(
      Math.sin(t * Math.PI * 3) * 18,    // Left-right winding
      Math.cos(t * Math.PI * 2) * 14,    // Up-down winding
      -t * tunnelLength                  // Forward movement
    ));
  }
  return new THREE.CatmullRomCurve3(points);
}

export const ThreeTunnelOutro: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const tubeRef = useRef<THREE.Mesh | null>(null);
  const glowRingsRef = useRef<THREE.Mesh[]>([]);
  const starsRef = useRef<THREE.Points | null>(null);
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Entrance Interpolations
  const titleY = interpolate(frame, [0, 60], [-120, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad)
  });
  const titleOpacity = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const frameLeftX = interpolate(frame, [18, 78], [-150, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad)
  });
  const frameLeftOpacity = interpolate(frame, [18, 78], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const frameRightX = interpolate(frame, [18, 78], [150, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad)
  });
  const frameRightOpacity = interpolate(frame, [18, 78], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const centerScale = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.7))
  });
  const centerOpacity = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const subY = interpolate(frame, [42, 90], [60, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad)
  });
  const subOpacity = interpolate(frame, [42, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const ctaOpacity = interpolate(frame, [60, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad)
  });

  // 2. Looping / Pulse Interpolations (Fitted perfectly to 900 frame cycle)
  // 90 frames = 1.5s (perfectly divides 900)
  const subPulse = interpolate(frame % 90, [0, 45, 90], [0, 1, 0], {
    easing: Easing.inOut(Easing.quad)
  });
  
  // 100 frames = 1.67s (perfectly divides 900)
  const ctaPulse = interpolate(frame % 100, [0, 50, 100], [0, 1, 0], {
    easing: Easing.inOut(Easing.quad)
  });

  // 300 frames = 5s (perfectly divides 900)
  const ringRotation = ((frame * 360) / 300) % 360;

  // 150 frames = 2.5s (perfectly divides 900)
  const ringProgPulse = interpolate(frame % 150, [0, 75, 150], [0, 1, 0], {
    easing: Easing.inOut(Easing.quad)
  });

  // 90 frames = 1.5s (perfectly divides 900)
  const ringInnerPulse = interpolate(frame % 90, [0, 45, 90], [0, 1, 0], {
    easing: Easing.inOut(Easing.quad)
  });

  const C = 2 * Math.PI * 42;
  const Cin = 2 * Math.PI * 32;
  const progOffset = interpolate(ringProgPulse, [0, 1], [C, C * 0.15]);
  const innerOffset = interpolate(ringInnerPulse, [0, 1], [Cin, Cin * 0.4]);

  const subBoxShadow = interpolate(
    subPulse,
    [0, 1],
    [22, 40]
  );
  const subInsetShadow = interpolate(
    subPulse,
    [0, 1],
    [16, 24]
  );

  const ctaGlow = interpolate(
    ctaPulse,
    [0, 1],
    [14, 26]
  );

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, 0.0085);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false
    });
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x02040a, 1);
    rendererRef.current = renderer;

    const curve = makeCurve();
    curveRef.current = curve;

    // Tube wireframe
    const tubeGeo = new THREE.TubeGeometry(curve, 220, 6, 24, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x19b6ff,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);
    tubeRef.current = tube;

    // Outer tube dimmer wireframe
    const outerGeo = new THREE.TubeGeometry(curve, 160, 9, 16, false);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x0a4f7a,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const outerTube = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerTube);

    // Glowing Gates/Rings
    const ringCount = 24;
    const tempRings: THREE.Mesh[] = [];
    for (let i = 0; i < ringCount; i++) {
      const t = i / ringCount;
      const pos = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      const ringGeo = new THREE.TorusGeometry(5.5, 0.12, 8, 40);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x5ad8ff : 0x19b6ff,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().add(tangent));
      scene.add(ring);
      tempRings.push(ring);
    }
    glowRingsRef.current = tempRings;

    // Star systems
    const starGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(STAR_DATA.length * 3);
    for (let i = 0; i < STAR_DATA.length; i++) {
      posArray[i * 3 + 0] = STAR_DATA[i].x;
      posArray[i * 3 + 1] = STAR_DATA[i].y;
      posArray[i * 3 + 2] = STAR_DATA[i].z;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xbfeaff,
      size: 0.5,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starsRef.current = stars;

    return () => {
      renderer.dispose();
      tubeGeo.dispose();
      tubeMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      tempRings.forEach(ring => {
        ring.geometry.dispose();
        if (Array.isArray(ring.material)) {
          ring.material.forEach(m => m.dispose());
        } else {
          ring.material.dispose();
        }
      });
      starGeo.dispose();
      starMat.dispose();
    };
  }, []);

  // Frame-locked render updates
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const tube = tubeRef.current;
    const glowRings = glowRingsRef.current;
    const stars = starsRef.current;
    const curve = curveRef.current;

    if (!scene || !camera || !renderer || !tube || !curve) return;

    const time = frame / fps;
    const loopDuration = 15; // Exact matching duration to guarantee flawless loops
    const p = (time % loopDuration) / loopDuration;

    const camPos = curve.getPointAt(p);
    const lookAtPos = curve.getPointAt((p + 0.02) % 1.0);

    camera.position.copy(camPos);
    camera.lookAt(lookAtPos);

    camera.up.set(Math.sin(time * 0.3) * 0.15, 1, 0);

    tube.rotation.z = time * 0.05;

    glowRings.forEach((r, i) => {
      const mat = r.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.4 + 0.4 * Math.abs(Math.sin(time * 1.5 + i * 0.4));
      }
    });

    if (stars) {
      const mat = stars.material as THREE.PointsMaterial;
      if (mat) {
        mat.opacity = 0.6 + 0.3 * Math.sin(time * 2);
      }
    }

    renderer.render(scene, camera);
  }, [frame, fps]);

  const stageStyle: React.CSSProperties = {
    position: 'absolute',
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#000',
    fontFamily: "'Arial Black', Arial, sans-serif"
  };

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'block'
  };

  const uiStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 2
  };

  const titleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: `translateX(-50%) translateY(${titleY}px)`,
    opacity: titleOpacity,
    width: '46%',
    minWidth: '380px',
    padding: '18px 30px 28px',
    textAlign: 'center',
    clipPath: 'polygon(6% 0, 94% 0, 100% 100%, 0% 100%)',
    background: 'linear-gradient(180deg, #3a3f44 0%, #23272b 100%)',
    borderBottom: '4px solid #19b6ff',
    boxShadow: '0 0 30px rgba(25,182,255,0.4)'
  };

  const h1Style: React.CSSProperties = {
    color: '#fff',
    fontSize: '44px',
    letterSpacing: '2px',
    lineHeight: '1.05',
    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
    margin: 0
  };

  const titleAfterStyle: React.CSSProperties = {
    content: '""',
    position: 'absolute',
    left: '20%',
    right: '20%',
    bottom: '-4px',
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #5ad8ff, #fff, #5ad8ff, transparent)',
    filter: 'blur(1px)',
    boxShadow: '0 0 14px #5ad8ff'
  };

  const leftFrameStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: `translateY(-50%) translateX(${frameLeftX}px)`,
    opacity: frameLeftOpacity,
    width: '26%',
    aspectRatio: '16 / 10',
    border: '3px solid #19b6ff',
    borderRadius: '4px',
    background: 'rgba(2,10,22,0.25)',
    boxShadow: '0 0 18px rgba(25,182,255,0.6), inset 0 0 25px rgba(25,182,255,0.15)',
    pointerEvents: 'auto',
    backdropFilter: 'blur(2px)',
    left: '3%'
  };

  const rightFrameStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: `translateY(-50%) translateX(${frameRightX}px)`,
    opacity: frameRightOpacity,
    width: '26%',
    aspectRatio: '16 / 10',
    border: '3px solid #19b6ff',
    borderRadius: '4px',
    background: 'rgba(2,10,22,0.25)',
    boxShadow: '0 0 18px rgba(25,182,255,0.6), inset 0 0 25px rgba(25,182,255,0.15)',
    pointerEvents: 'auto',
    backdropFilter: 'blur(2px)',
    right: '3%'
  };

  const leftLabelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-30px',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    fontStyle: 'italic',
    fontSize: '16px',
    textShadow: '0 0 6px rgba(0,0,0,0.8)',
    left: '4px'
  };

  const rightLabelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-30px',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    fontStyle: 'italic',
    fontSize: '16px',
    textShadow: '0 0 6px rgba(0,0,0,0.8)',
    right: '4px'
  };

  const centerWrapStyle: React.CSSProperties = {
    position: 'absolute',
    top: '47%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${centerScale})`,
    opacity: centerOpacity,
    width: '160px',
    height: '160px'
  };

  const ringStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    transform: `rotate(${ringRotation - 90}deg)`
  };

  const subscribeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '80%',
    left: '50%',
    transform: `translate(-50%, -50%) translateY(${subY}px)`,
    opacity: subOpacity,
    padding: '14px 42px',
    color: '#fff',
    fontSize: '26px',
    letterSpacing: '2px',
    background: 'rgba(2,8,18,0.4)',
    border: '3px solid #5ad8ff',
    borderRadius: '10px',
    boxShadow: `0 0 ${subBoxShadow}px #19b6ff, inset 0 0 ${subInsetShadow}px rgba(25,182,255,0.25)`,
    pointerEvents: 'auto',
    cursor: 'pointer',
    textShadow: '0 0 10px rgba(25,182,255,0.6)',
    textAlign: 'center'
  };

  const ctaStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '4%',
    left: '50%',
    transform: 'translateX(-50%)',
    opacity: ctaOpacity,
    color: '#fff',
    fontStyle: 'italic',
    fontSize: '36px',
    letterSpacing: '3px',
    whiteSpace: 'nowrap',
    textShadow: `0 0 ${ctaGlow}px rgba(90,216,255,1), 0 2px 6px rgba(0,0,0,0.7)`
  };

  return (
    <div style={stageStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />

      <div style={uiStyle}>
        <div style={titleStyle}>
          <h1 style={h1Style}>THANKS FOR<br />WATCHING</h1>
          <div style={titleAfterStyle} />
        </div>

        <div style={leftFrameStyle}>
          <span style={leftLabelStyle}>Previous Video</span>
        </div>

        <div style={rightFrameStyle}>
          <span style={rightLabelStyle}>Next Video</span>
        </div>

        <div style={centerWrapStyle}>
          <svg style={ringStyle} viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              style={{
                fill: 'none',
                strokeLinecap: 'round',
                stroke: 'rgba(255,255,255,0.12)',
                strokeWidth: 5
              }}
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              style={{
                fill: 'none',
                strokeLinecap: 'round',
                stroke: '#19b6ff',
                strokeWidth: 6,
                filter: 'drop-shadow(0 0 6px #19b6ff)',
                strokeDasharray: `${C}`,
                strokeDashoffset: progOffset
              }}
            />
            <circle
              cx="50"
              cy="50"
              r="32"
              style={{
                fill: 'none',
                strokeLinecap: 'round',
                stroke: '#fff',
                strokeWidth: 3,
                opacity: 0.9,
                strokeDasharray: `${Cin}`,
                strokeDashoffset: innerOffset
              }}
            />
          </svg>
        </div>

        <div style={subscribeStyle}>SUBSCRIBE</div>
        <div style={ctaStyle}>LIKE - COMMENT - SHARE</div>
      </div>
    </div>
  );
};

export default ThreeTunnelOutro;
// END_OF_FILE