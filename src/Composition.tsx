import React from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const GlowingBox: React.FC<{ addTransparentScene?: boolean }> = ({
	addTransparentScene = false,
}) => {
	const { width, height, durationInFrames } = useVideoConfig();
	const rawFrame = useCurrentFrame();

	const baseFrames = addTransparentScene
		? Math.floor(durationInFrames / 2)
		: durationInFrames;
	const isTransparentSection = addTransparentScene && rawFrame >= baseFrames;
	const frame = isTransparentSection ? rawFrame - baseFrames : rawFrame;

	const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

	// Compute perfectly seamless looping parameters over the base frame duration
	const progress = frame / baseFrames;
	const translateY = Math.sin(progress * Math.PI * 4) * 40; // 2 complete float cycles
	const rotate = progress * 360; // 1 complete rotation

	const wrapperStyle: React.CSSProperties = {
		width: ORIGINAL_WIDTH,
		height: ORIGINAL_HEIGHT,
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: `translate(-50%, -50%) scale(${scaleFactor})`,
		transformOrigin: 'center center',
		overflow: 'hidden',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: isTransparentSection ? 'transparent' : '#0a0a12',
	};

	const boxStyle: React.CSSProperties = {
		width: 120,
		height: 120,
		borderRadius: 24,
		background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
		boxShadow: '0 0 40px rgba(34, 211, 238, 0.5)',
		transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
	};

	return (
		<div style={wrapperStyle}>
			<div style={boxStyle} />
		</div>
	);
};

export default GlowingBox;
// END_OF_FILE