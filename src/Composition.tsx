import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const TUNNEL_LENGTH = 600;
const STAR_COUNT = 800;

// Pre-calculated seed-based pseudo-random star coordinate array to avoid Math.random inside rendering
const STAR_DATA = (() => {
  const arr = new Float32Array(STAR_COUNT * 3);
  let seed = 12345;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < STAR_COUNT; i++) {
    arr[i * 3 + 0] = (random() - 0.5) * 80;
    arr[i * 3 + 1] = (random() - 0.5) * 80;
    arr[i * 3 + 2] = -random() * TUNNEL_LENGTH;
  }
  return arr;
})();

const makeCurve = () => {
  const points = [];
  const segments = 16;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    points.push(
      new THREE.Vector3(
        Math.sin(t * Math.PI * 3) * 18,
        Math.cos(t * Math.PI * 2) * 14,
        -t * TUNNEL_LENGTH
      )
    );
  }
  return new THREE.CatmullRomCurve3(points);
};

const curve = makeCurve();

const TunnelOutro: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const tubeRef = useRef<THREE.Mesh | null>(null);
  const glowRingsRef = useRef<THREE.Mesh[]>([]);
  const starsRef = useRef<THREE.Points | null>(null);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // Initialize Three.js once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, 0.0085);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(2);
    renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    renderer.setClearColor(0x02040a, 1);
    rendererRef.current = renderer;

    // Inside tube wireframe
    const tubeGeo = new THREE.TubeGeometry(curve, 220, 6, 24, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x19b6ff,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);
    tubeRef.current = tube;

    // Outer larger tube
    const outerGeo = new THREE.TubeGeometry(curve, 160, 9, 16, false);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x0a4f7a,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const outerTube = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerTube);

    // Glow gate rings along the curve
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
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(pos.clone().add(tangent));
      scene.add(ring);
      tempRings.push(ring);
    }
    glowRingsRef.current = tempRings;

    // Twinkling background stars
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(STAR_DATA, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xbfeaff,
      size: 0.5,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(geo, mat);
    scene.add(stars);
    starsRef.current = stars;

    return () => {
      tubeGeo.dispose();
      tubeMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      tempRings.forEach((r: THREE.Mesh) => {
        r.geometry.dispose();
        if (Array.isArray(r.material)) {
          r.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          r.material.dispose();
        }
      });
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  // Frame-locked render updates
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    const totalFrames = 15 * fps;
    const time = frame / fps;

    // Symmetrical ping-pong camera fly-through progress for clean loops
    const progress = (frame % totalFrames) / totalFrames;
    const p = 0.5 - 0.5 * Math.cos(progress * 2 * Math.PI);
    const tunnelP = p * 0.9;

    const camPos = curve.getPointAt(tunnelP);
    const lookAtP = Math.min(0.99, tunnelP + 0.02);
    const lookAtPos = curve.getPointAt(lookAtP);

    camera.position.copy(camPos);
    camera.lookAt(lookAtPos);

    // Subtle cinematic camera rolling
    camera.up.set(Math.sin(time * 0.3) * 0.15, 1, 0);

    // Dynamic rotation of wireframe tube
    if (tubeRef.current) {
      tubeRef.current.rotation.z = time * 0.05;
    }

    // Flicker glow gate rings
    glowRingsRef.current.forEach((r: THREE.Mesh, i: number) => {
      if (r.material && 'opacity' in r.material) {
        (r.material as THREE.MeshBasicMaterial).opacity =
          0.4 + 0.4 * Math.abs(Math.sin(time * 1.5 + i * 0.4));
      }
    });

    // Animate star twinkling
    if (starsRef.current && starsRef.current.material) {
      (starsRef.current.material as THREE.PointsMaterial).opacity =
        0.6 + 0.3 * Math.sin(time * 2);
    }

    renderer.render(scene, camera);
  }, [frame, fps]);

  // UI Element Interpolations
  const titleY = interpolate(frame, [0, 45], [-120, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const titleOpacity = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leftFrameX = interpolate(frame, [15, 60], [-150, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const leftFrameOpacity = interpolate(frame, [15, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const rightFrameX = interpolate(frame, [15, 60], [150, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const rightFrameOpacity = interpolate(frame, [15, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const centerScale = interpolate(frame, [25, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.7)),
  });
  const centerOpacity = interpolate(frame, [25, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ringRotation = (frame * 360) / (6 * fps);

  const C = 2 * Math.PI * 42;
  const Cin = 2 * Math.PI * 32;

  const progOffsetPeriod = 2 * fps;
  const progOffsetProgress = (frame % progOffsetPeriod) / progOffsetPeriod;
  const progOffsetFactor = 0.5 - 0.5 * Math.cos(progOffsetProgress * 2 * Math.PI);
  const strokeDashoffsetProg = C - (C - C * 0.15) * progOffsetFactor;

  const innerOffsetPeriod = 1.6 * fps;
  const innerOffsetProgress = (frame % innerOffsetPeriod) / innerOffsetPeriod;
  const innerOffsetFactor = 0.5 - 0.5 * Math.cos(innerOffsetProgress * 2 * Math.PI);
  const strokeDashoffsetInner = Cin - (Cin - Cin * 0.4) * innerOffsetFactor;

  const subY = interpolate(frame, [35, 75], [60, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const subOpacity = interpolate(frame, [35, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subPulsePeriod = 1.4 * fps;
  const subPulseProgress = (frame % subPulsePeriod) / subPulsePeriod;
  const subPulseFactor = 0.5 - 0.5 * Math.cos(subPulseProgress * 2 * Math.PI);

  const subShadowGlow = interpolate(subPulseFactor, [0, 1], [22, 40]);
  const subShadowInnerGlow = interpolate(subPulseFactor, [0, 1], [16, 24]);
  const subScale = interpolate(subPulseFactor, [0, 1], [1, 1.06]);

  const ctaOpacityEntrance = interpolate(frame, [50, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const ctaPulsePeriod = 1.8 * fps;
  const ctaPulseProgress = (frame % ctaPulsePeriod) / ctaPulsePeriod;
  const ctaPulseFactor = 0.5 - 0.5 * Math.cos(ctaPulseProgress * 2 * Math.PI);
  const ctaGlowRadius = interpolate(ctaPulseFactor, [0, 1], [14, 26]);

  // Inline styling setups
  const mainStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    background: '#000',
    fontFamily: "'Arial Black', Arial, sans-serif",
  };

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
  };

  const uiStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 2,
  };

  const titleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: `translateX(-50%) translateY(${titleY}px)`,
    width: '46%',
    minWidth: '380px',
    padding: '18px 30px 28px',
    textAlign: 'center',
    clipPath: 'polygon(6% 0, 94% 0, 100% 100%, 0% 100%)',
    background: 'linear-gradient(180deg, #3a3f44 0%, #23272b 100%)',
    borderBottom: '4px solid #19b6ff',
    boxShadow: '0 0 30px rgba(25,182,255,0.4)',
    opacity: titleOpacity,
  };

  const titleH1Style: React.CSSProperties = {
    color: '#fff',
    fontSize: '40px',
    letterSpacing: '2px',
    lineHeight: '1.05',
    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
    margin: 0,
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
    boxShadow: '0 0 14px #5ad8ff',
  };

  const leftFrameStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '3%',
    transform: `translateY(-50%) translateX(${leftFrameX}px)`,
    width: '26%',
    aspectRatio: '16 / 10',
    border: '3px solid #19b6ff',
    borderRadius: '4px',
    background: 'rgba(2,10,22,0.25)',
    boxShadow: '0 0 18px rgba(25,182,255,0.6), inset 0 0 25px rgba(25,182,255,0.15)',
    pointerEvents: 'auto',
    backdropFilter: 'blur(2px)',
    opacity: leftFrameOpacity,
  };

  const rightFrameStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    right: '3%',
    transform: `translateY(-50%) translateX(${rightFrameX}px)`,
    width: '26%',
    aspectRatio: '16 / 10',
    border: '3px solid #19b6ff',
    borderRadius: '4px',
    background: 'rgba(2,10,22,0.25)',
    boxShadow: '0 0 18px rgba(25,182,255,0.6), inset 0 0 25px rgba(25,182,255,0.15)',
    pointerEvents: 'auto',
    backdropFilter: 'blur(2px)',
    opacity: rightFrameOpacity,
  };

  const labelLeftStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-30px',
    left: '4px',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    fontStyle: 'italic',
    fontSize: '15px',
    textShadow: '0 0 6px rgba(0,0,0,0.8)',
  };

  const labelRightStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-30px',
    right: '4px',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    fontStyle: 'italic',
    fontSize: '15px',
    textShadow: '0 0 6px rgba(0,0,0,0.8)',
  };

  const centerWrapStyle: React.CSSProperties = {
    position: 'absolute',
    top: '47%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${centerScale})`,
    width: '180px',
    height: '180px',
    opacity: centerOpacity,
  };

  const ringStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    transform: `rotate(${ringRotation}deg)`,
    transformOrigin: '50% 50%',
  };

  const ringTrackStyle: React.CSSProperties = {
    fill: 'none',
    strokeLinecap: 'round',
    stroke: 'rgba(255,255,255,0.12)',
    strokeWidth: 5,
  };

  const ringProgStyle: React.CSSProperties = {
    fill: 'none',
    strokeLinecap: 'round',
    stroke: '#19b6ff',
    strokeWidth: 6,
    filter: 'drop-shadow(0 0 6px #19b6ff)',
  };

  const ringInnerStyle: React.CSSProperties = {
    fill: 'none',
    strokeLinecap: 'round',
    stroke: '#fff',
    strokeWidth: 3,
    opacity: 0.9,
  };

  const subscribeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '80%',
    left: '50%',
    transform: `translate(-50%, calc(-50% + ${subY}px)) scale(${subScale})`,
    padding: '14px 42px',
    color: '#fff',
    fontSize: '24px',
    letterSpacing: '2px',
    background: 'rgba(2,8,18,0.4)',
    border: '3px solid #5ad8ff',
    borderRadius: '10px',
    boxShadow: `0 0 ${subShadowGlow}px #19b6ff, inset 0 0 ${subShadowInnerGlow}px rgba(25,182,255,0.25)`,
    pointerEvents: 'auto',
    cursor: 'pointer',
    textShadow: '0 0 10px rgba(25,182,255,0.6)',
    opacity: subOpacity,
  };

  const ctaStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '4%',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff',
    fontStyle: 'italic',
    fontSize: '32px',
    letterSpacing: '3px',
    whiteSpace: 'nowrap',
    textShadow: `0 0 ${ctaGlowRadius}px rgba(90,216,255,1), 0 2px 6px rgba(0,0,0,0.7)`,
    opacity: ctaOpacityEntrance,
  };

  return (
    <div style={mainStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />

      <div style={uiStyle}>
        <div style={titleStyle}>
          <h1 style={titleH1Style}>
            THANKS FOR
            <br />
            WATCHING
          </h1>
          <div style={titleAfterStyle} />
        </div>

        <div style={leftFrameStyle}>
          <span style={labelLeftStyle}>Previous Video</span>
        </div>
        <div style={rightFrameStyle}>
          <span style={labelRightStyle}>Next Video</span>
        </div>

        <div style={centerWrapStyle}>
          <svg style={ringStyle} viewBox="0 0 100 100">
            <circle style={ringTrackStyle} cx="50" cy="50" r="42" />
            <circle
              style={ringProgStyle}
              cx="50"
              cy="50"
              r="42"
              strokeDasharray={C}
              strokeDashoffset={strokeDashoffsetProg}
            />
            <circle
              style={ringInnerStyle}
              cx="50"
              cy="50"
              r="32"
              strokeDasharray={Cin}
              strokeDashoffset={strokeDashoffsetInner}
            />
          </svg>
        </div>

        <div style={subscribeStyle}>SUBSCRIBE</div>
        <div style={ctaStyle}>LIKE - COMMENT - SHARE</div>
      </div>
    </div>
  );
};

export default TunnelOutro;
// END_OF_FILE