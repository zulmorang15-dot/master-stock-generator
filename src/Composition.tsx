import React from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

export const GlitchCard: React.FC<{ addTransparentScene?: boolean }> = ({
	addTransparentScene = false,
}) => {
	const { width, height, durationInFrames } = useVideoConfig();
	const rawFrame = useCurrentFrame();

	const ORIGINAL_WIDTH = 1920;
	const ORIGINAL_HEIGHT = 1080;

	// Scale factor to support dynamic resolutions seamlessly
	const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

	// Handle dual-scene looping configurations
	const baseFrames = addTransparentScene
		? Math.floor(durationInFrames / 2)
		: durationInFrames;
	const isTransparentSection = addTransparentScene && rawFrame >= baseFrames;
	const frame = isTransparentSection ? rawFrame - baseFrames : rawFrame;

	// Loop math: ensure exactly 5 complete sine cycles for a perfect seamless loop
	const cycles = 5;
	const s = (frame / baseFrames) * Math.PI * 2 * cycles;
	const skewVal = Math.sin(s) * 15;

	// Styles
	const outerWrapperStyle: React.CSSProperties = {
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
		backgroundColor: isTransparentSection ? 'transparent' : '#0d0221',
	};

	const glitchStyle: React.CSSProperties = {
		width: '280px',
		height: '140px',
		background: 'linear-gradient(90deg, #00f0ff, #ff007f)',
		borderRadius: '16px',
		boxShadow: '0 0 50px #00f0ff',
		transform: `skewX(${skewVal}deg)`,
		transformOrigin: 'center center',
	};

	return (
		<div style={outerWrapperStyle}>
			<div style={glitchStyle} />
		</div>
	);
};

export default GlitchCard;
// END_OF_FILE