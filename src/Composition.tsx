import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import * as THREE from 'three';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic static positions for 30 trails to replace Math.random() inside component render
const STATIC_TRAILS = Array.from({ length: 30 }, (_, i) => {
	const sin1 = Math.sin(i * 1.45) * 1250;
	const cos1 = Math.cos(i * 2.87) * 600;
	const sin2 = Math.sin(i * 9.12) * 1500;
	const isCyan = (i % 2) === 0;
	return {
		x: sin1,
		y: cos1,
		z: sin2,
		color: isCyan ? 0x00ffff : 0x0044ff,
	};
});

export const SciFiEsportsEndscreen: React.FC = () => {
	const { width, height, fps } = useVideoConfig();
	const frame = useCurrentFrame();

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

	// Refs to hold Three.js animated elements
	const ringMesh1Ref = useRef<THREE.Mesh | null>(null);
	const ringMesh2Ref = useRef<THREE.Mesh | null>(null);
	const ringMesh3Ref = useRef<THREE.Points | null>(null);
	const gridHelperBottomRef = useRef<THREE.GridHelper | null>(null);
	const gridHelperTopRef = useRef<THREE.GridHelper | null>(null);
	const trailsRef = useRef<THREE.Mesh[]>([]);
	const chunk1Ref = useRef<THREE.Mesh | null>(null);
	const chunk2Ref = useRef<THREE.Mesh | null>(null);

	// 1. Scale layout to match container exactly without black bars
	const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

	// 2. Initialize Three.js Scene (Once on mount)
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance',
		});
		renderer.setSize(ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
		renderer.setPixelRatio(1.0);
		renderer.toneMapping = THREE.ReinhardToneMapping;
		rendererRef.current = renderer;

		const scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0x010105, 0.0006);
		sceneRef.current = scene;

		const camera = new THREE.PerspectiveCamera(60, ORIGINAL_WIDTH / ORIGINAL_HEIGHT, 1, 5000);
		camera.position.set(0, 0, 800);
		cameraRef.current = camera;

		const geometries: THREE.BufferGeometry[] = [];
		const materials: THREE.Material[] = [];

		const cyanMat = new THREE.MeshBasicMaterial({
			color: 0x00ffff,
			wireframe: true,
			transparent: true,
			opacity: 0.8,
		});
		const blueMat = new THREE.MeshBasicMaterial({ color: 0x0033ff, wireframe: true });
		materials.push(cyanMat, blueMat);

		// Massive Center Holographic Rings
		const centerGroup = new THREE.Group();
		scene.add(centerGroup);

		const ringGeo1 = new THREE.TorusGeometry(380, 15, 8, 64);
		const ringMesh1 = new THREE.Mesh(ringGeo1, cyanMat);
		centerGroup.add(ringMesh1);
		ringMesh1Ref.current = ringMesh1;
		geometries.push(ringGeo1);

		const ringGeo2 = new THREE.TorusGeometry(320, 40, 4, 12);
		const ringMesh2 = new THREE.Mesh(ringGeo2, blueMat);
		centerGroup.add(ringMesh2);
		ringMesh2Ref.current = ringMesh2;
		geometries.push(ringGeo2);

		const ringGeo3 = new THREE.TorusGeometry(450, 2, 8, 100);
		const ptsMat = new THREE.PointsMaterial({ color: 0x00ffff, size: 4 });
		const ringMesh3 = new THREE.Points(ringGeo3, ptsMat);
		centerGroup.add(ringMesh3);
		ringMesh3Ref.current = ringMesh3;
		geometries.push(ringGeo3);
		materials.push(ptsMat);

		// Moving Cyberpunk Grid Floors and Ceilings
		const gridHelperBottom = new THREE.GridHelper(6000, 120, 0x00aaff, 0x001133);
		gridHelperBottom.position.y = -400;
		scene.add(gridHelperBottom);
		gridHelperBottomRef.current = gridHelperBottom;

		const gridHelperTop = new THREE.GridHelper(6000, 120, 0x00aaff, 0x001133);
		gridHelperTop.position.y = 400;
		scene.add(gridHelperTop);
		gridHelperTopRef.current = gridHelperTop;

		// High-Speed Energy Trails
		const trailGeo = new THREE.BoxGeometry(8, 8, 400);
		geometries.push(trailGeo);

		const trailsList: THREE.Mesh[] = [];
		STATIC_TRAILS.forEach((trailData: any) => {
			const trailMat = new THREE.MeshBasicMaterial({ color: trailData.color });
			materials.push(trailMat);
			const trailMesh = new THREE.Mesh(trailGeo, trailMat);
			trailMesh.position.set(trailData.x, trailData.y, trailData.z);
			scene.add(trailMesh);
			trailsList.push(trailMesh);
		});
		trailsRef.current = trailsList;

		// Side Parallax Octahedrons
		const octaGeo = new THREE.OctahedronGeometry(80, 0);
		geometries.push(octaGeo);

		const chunk1 = new THREE.Mesh(octaGeo, cyanMat);
		chunk1.position.set(-800, 200, 200);
		scene.add(chunk1);
		chunk1Ref.current = chunk1;

		const chunk2 = new THREE.Mesh(octaGeo, cyanMat);
		chunk2.position.set(800, -200, 100);
		scene.add(chunk2);
		chunk2Ref.current = chunk2;

		return () => {
			// Memory clean-up for high-fidelity multi-threaded headless rendering
			geometries.forEach((geo: any) => geo.dispose());
			materials.forEach((mat: any) => mat.dispose());
			renderer.dispose();
		};
	}, []);

	// 3. Frame-locked Three.js updates driven strictly by current frame
	useEffect(() => {
		const renderer = rendererRef.current;
		const scene = sceneRef.current;
		const camera = cameraRef.current;

		if (!renderer || !scene || !camera) return;

		const time = frame / fps;

		// Rotate holographic rings deterministically
		if (ringMesh1Ref.current) {
			ringMesh1Ref.current.rotation.z = time * 0.3;
			ringMesh1Ref.current.rotation.x = Math.sin(time * 0.5) * 0.3;
		}

		if (ringMesh2Ref.current) {
			ringMesh2Ref.current.rotation.z = -time * 0.5;
			ringMesh2Ref.current.rotation.y = Math.cos(time * 0.4) * 0.2;
		}

		if (ringMesh3Ref.current) {
			ringMesh3Ref.current.rotation.z = time * 0.1;
		}

		// Environment floor movement (seamlessly repeating grid lines)
		const gridSpeed = 400;
		if (gridHelperBottomRef.current) {
			gridHelperBottomRef.current.position.z = (time * gridSpeed) % 120;
		}
		if (gridHelperTopRef.current) {
			gridHelperTopRef.current.position.z = (time * gridSpeed) % 120;
		}

		// Update Z-Axis energy trails
		const trailSpeedPerFrame = 60;
		const travelRange = 3700; // Total Z-travel space (-2500 to 1200)
		trailsRef.current.forEach((trail, index) => {
			const staticData = STATIC_TRAILS[index];
			const absoluteOffset = frame * trailSpeedPerFrame;
			const calculatedZ = staticData.z + absoluteOffset;
			// Keep Z position bound and loop within travel limit
			const boundedZ = ((calculatedZ + 2500) % travelRange) - 2500;
			trail.position.z = boundedZ;
		});

		// Parallax flying geometric shapes
		if (chunk1Ref.current) {
			chunk1Ref.current.rotation.x = time * 0.6;
			chunk1Ref.current.rotation.y = time * 1.2;
			chunk1Ref.current.position.y = 200 + Math.sin(time) * 50;
		}

		if (chunk2Ref.current) {
			chunk2Ref.current.rotation.x = -time * 1.2;
			chunk2Ref.current.rotation.y = -time * 0.6;
			chunk2Ref.current.position.y = -200 + Math.cos(time) * 50;
		}

		// Immersive Camera Drift
		camera.position.x = Math.sin(time * 0.4) * 60;
		camera.position.y = Math.cos(time * 0.3) * 40;
		camera.lookAt(0, 0, 0);

		renderer.render(scene, camera);
	}, [frame, fps]);

	// 4. Calculations for loop-safe CSS-like animations
	// Pulsing rate constants
	const corePulseProgress = Math.sin((frame / 90) * 2 * Math.PI); // Fits exactly into 15s (900 frames)
	const coreScale = interpolate(corePulseProgress, [-1, 1], [1, 1.08]);
	const coreGlow = interpolate(corePulseProgress, [-1, 1], [40, 60]);

	// Scanning line positions (180 frames loop duration)
	const leftScanlineTop = interpolate(frame % 180, [0, 180], [-50, 350]);
	const rightScanlineTop = interpolate((frame + 90) % 180, [0, 180], [-50, 350]);

	// Video Slot borders breathing animation (90 frames loop duration)
	const slotBreathe = Math.sin((frame / 90) * 2 * Math.PI);
	const slotGlowIntensity = interpolate(slotBreathe, [-1, 1], [40, 60]);
	const slotInnerGlow = interpolate(slotBreathe, [-1, 1], [15, 20]);
	const bGreen = Math.round(interpolate(slotBreathe, [-1, 1], [179, 255]));
	const bBlue = Math.round(interpolate(slotBreathe, [-1, 1], [179, 255]));
	const slotBorderColor = `rgb(0, ${bGreen}, ${bBlue})`;

	// Sliding HUD Accents (300 frames loop duration, yoyo equivalent built-in)
	const hudAccentProgress = Math.abs(Math.sin((frame / 300) * Math.PI));
	const topAccentLeft = interpolate(hudAccentProgress, [0, 1], [0, 1100]);
	const bottomAccentRight = interpolate(hudAccentProgress, [0, 1], [0, 700]);

	// Inner pulse of slots (120 frames loop duration)
	const slotPulseShadow = interpolate(
		Math.sin((frame / 120) * 2 * Math.PI),
		[-1, 1],
		[40, 80]
	);

	// Styles definitions conforming with camelCase keys and absolute centering
	const scaleWrapperStyle: React.CSSProperties = {
		position: 'absolute',
		top: '50%',
		left: '50%',
		width: ORIGINAL_WIDTH,
		height: ORIGINAL_HEIGHT,
		transform: `translate(-50%, -50%) scale(${scaleFactor})`,
		transformOrigin: 'center center',
		overflow: 'hidden',
		backgroundColor: '#010103',
	};

	const canvasStyle: React.CSSProperties = {
		position: 'absolute',
		top: 0,
		left: 0,
		width: ORIGINAL_WIDTH,
		height: ORIGINAL_HEIGHT,
		zIndex: 1,
		pointerEvents: 'none',
	};

	const uiLayerStyle: React.CSSProperties = {
		position: 'absolute',
		top: 0,
		left: 0,
		width: ORIGINAL_WIDTH,
		height: ORIGINAL_HEIGHT,
		zIndex: 2,
		pointerEvents: 'none',
	};

	const hudBarTopStyle: React.CSSProperties = {
		position: 'absolute',
		height: 6,
		background: '#00ffff',
		boxShadow: '0 0 20px #00ffff',
		left: '50%',
		transform: 'translateX(-50%)',
		top: 120,
		width: 1200,
	};

	const hudBarBottomStyle: React.CSSProperties = {
		position: 'absolute',
		height: 6,
		background: '#00ffff',
		boxShadow: '0 0 20px #00ffff',
		left: '50%',
		transform: 'translateX(-50%)',
		bottom: 120,
		width: 800,
	};

	const hudAccentTopStyle: React.CSSProperties = {
		position: 'absolute',
		width: 100,
		height: 6,
		background: '#fff',
		boxShadow: '0 0 20px #fff',
		top: 0,
		left: topAccentLeft,
	};

	const hudAccentBottomStyle: React.CSSProperties = {
		position: 'absolute',
		width: 100,
		height: 6,
		background: '#fff',
		boxShadow: '0 0 20px #fff',
		top: 0,
		right: bottomAccentRight,
	};

	const hudBracketLeftStyle: React.CSSProperties = {
		position: 'absolute',
		width: 80,
		height: 180,
		border: '6px solid #00ffff',
		top: 450,
		boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
		left: 40,
		borderRight: 'none',
	};

	const hudBracketRightStyle: React.CSSProperties = {
		position: 'absolute',
		width: 80,
		height: 180,
		border: '6px solid #00ffff',
		top: 450,
		boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
		right: 40,
		borderLeft: 'none',
	};

	const videoSlotLeftStyle: React.CSSProperties = {
		position: 'absolute',
		width: 580,
		height: 326,
		top: 377,
		border: `6px solid ${slotBorderColor}`,
		boxSizing: 'border-box',
		background: 'rgba(0, 15, 35, 0.45)',
		backdropFilter: 'blur(12px)',
		boxShadow: `0 0 ${slotGlowIntensity}px rgba(0, 255, 255, 0.4), inset 0 0 ${slotInnerGlow}px rgba(0, 255, 255, 0.15)`,
		overflow: 'hidden',
		left: 100,
	};

	const videoSlotRightStyle: React.CSSProperties = {
		position: 'absolute',
		width: 580,
		height: 326,
		top: 377,
		border: `6px solid ${slotBorderColor}`,
		boxSizing: 'border-box',
		background: 'rgba(0, 15, 35, 0.45)',
		backdropFilter: 'blur(12px)',
		boxShadow: `0 0 ${slotGlowIntensity}px rgba(0, 255, 255, 0.4), inset 0 0 ${slotInnerGlow}px rgba(0, 255, 255, 0.15)`,
		overflow: 'hidden',
		right: 100,
	};

	const cornerTlStyle: React.CSSProperties = {
		position: 'absolute',
		width: 50,
		height: 50,
		border: '10px solid transparent',
		zIndex: 3,
		top: -10,
		left: -10,
		borderTopColor: '#fff',
		borderLeftColor: '#fff',
	};

	const cornerBrStyle: React.CSSProperties = {
		position: 'absolute',
		width: 50,
		height: 50,
		border: '10px solid transparent',
		zIndex: 3,
		bottom: -10,
		right: -10,
		borderBottomColor: '#fff',
		borderRightColor: '#fff',
	};

	const cornerTrStyle: React.CSSProperties = {
		position: 'absolute',
		width: 50,
		height: 50,
		border: '10px solid transparent',
		zIndex: 3,
		top: -10,
		right: -10,
		borderTopColor: '#fff',
		borderRightColor: '#fff',
	};

	const cornerBlStyle: React.CSSProperties = {
		position: 'absolute',
		width: 50,
		height: 50,
		border: '10px solid transparent',
		zIndex: 3,
		bottom: -10,
		left: -10,
		borderBottomColor: '#fff',
		borderLeftColor: '#fff',
	};

	const scanlineContainerStyle: React.CSSProperties = {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		overflow: 'hidden',
	};

	const scanlineLeftStyle: React.CSSProperties = {
		position: 'absolute',
		top: leftScanlineTop,
		left: 0,
		width: '100%',
		height: 50,
		background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.8), transparent)',
		opacity: 0.6,
	};

	const scanlineRightStyle: React.CSSProperties = {
		position: 'absolute',
		top: rightScanlineTop,
		left: 0,
		width: '100%',
		height: 50,
		background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.8), transparent)',
		opacity: 0.6,
	};

	const pulseOverlayStyle: React.CSSProperties = {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		boxShadow: `inset 0 0 ${slotPulseShadow}px rgba(0, 255, 255, 0.3)`,
	};

	const subSlotStyle: React.CSSProperties = {
		position: 'absolute',
		width: 380,
		height: 380,
		top: 350,
		left: 770,
		borderRadius: '50%',
		border: '8px solid #0055ff',
		boxShadow: '0 0 80px rgba(0, 85, 255, 0.6), inset 0 0 80px rgba(0, 85, 255, 0.3)',
		background: 'rgba(0, 10, 30, 0.5)',
		backdropFilter: 'blur(15px)',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	};

	const subRing1Style: React.CSSProperties = {
		position: 'absolute',
		width: 420,
		height: 420,
		borderRadius: '50%',
		border: '4px dashed #00ffff',
		boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
		transform: `rotate(${interpolate(frame % 900, [0, 900], [0, 360])}deg)`,
	};

	const subRing2Style: React.CSSProperties = {
		position: 'absolute',
		width: 330,
		height: 330,
		borderRadius: '50%',
		border: '6px solid transparent',
		borderTopColor: '#00ffff',
		borderBottomColor: '#00ffff',
		boxShadow: '0 0 40px rgba(0, 255, 255, 0.4)',
		transform: `rotate(${interpolate(frame % 900, [0, 900], [0, -360])}deg)`,
	};

	const subCoreStyle: React.CSSProperties = {
		position: 'absolute',
		width: 280,
		height: 280,
		borderRadius: '50%',
		background: 'radial-gradient(circle, rgba(0, 255, 255, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
		border: '3px solid rgba(0, 255, 255, 0.6)',
		transform: `scale(${coreScale})`,
		boxShadow: `0 0 ${coreGlow}px rgba(0, 255, 255, 0.8)`,
	};

	return (
		<div style={scaleWrapperStyle}>
			<canvas ref={canvasRef} style={canvasStyle} />

			<div style={uiLayerStyle}>
				<div style={hudBarTopStyle}>
					<div style={hudAccentTopStyle} />
				</div>

				<div style={hudBracketLeftStyle} />

				<div style={videoSlotLeftStyle}>
					<div style={cornerTlStyle} />
					<div style={cornerBrStyle} />
					<div style={scanlineContainerStyle}>
						<div style={scanlineLeftStyle} />
					</div>
					<div style={pulseOverlayStyle} />
				</div>

				<div style={subSlotStyle}>
					<div style={subRing1Style} />
					<div style={subRing2Style} />
					<div style={subCoreStyle} />
				</div>

				<div style={videoSlotRightStyle}>
					<div style={cornerTrStyle} />
					<div style={cornerBlStyle} />
					<div style={scanlineContainerStyle}>
						<div style={scanlineRightStyle} />
					</div>
					<div style={pulseOverlayStyle} />
				</div>

				<div style={hudBracketRightStyle} />

				<div style={hudBarBottomStyle}>
					<div style={hudAccentBottomStyle} />
				</div>
			</div>
		</div>
	);
};

export default SciFiEsportsEndscreen;
// END_OF_FILE