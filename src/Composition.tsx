import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const ORIGINAL_WIDTH = 1000; // Original width of the container
const ORIGINAL_HEIGHT = 1000; // Original height of the container
const PARTICLE_COUNT = 50; // Number of particles
const ANIMATION_DURATION = 4; // Duration of floating animation in seconds
const ROTATE_DURATION = 20; // Duration of rotation animation in seconds

const NeonParticlesAnimation: React.FC = () => {
	const { width, height, fps } = useVideoConfig();
	const frame = useCurrentFrame();

	const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

	// Pre-calculated properties for particles
	const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
		const size = Math.random() * 20 + 5;
		const background = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`;
		const top = Math.random() * 100;
		const left = Math.random() * 100;
		const delay = Math.random() * ANIMATION_DURATION;

		return {
			size,
			background,
			top,
			left,
			delay,
		};
	});

	const localFrame = frame % (fps * Math.max(ANIMATION_DURATION, ROTATE_DURATION));

	return (
		<div
			style={{
				position: 'relative',
				width: '100%',
				height: '100%',
				perspective: '1000px',
				transform: `scale(${scaleFactor})`,
			}}
		>
			{particles.map((particle, index) => {
				const floatProgress = (localFrame - particle.delay * fps) / (ANIMATION_DURATION * fps);
				const translateX = interpolate(floatProgress, [0, 0.5, 1], [0, 50, 0]);
				const translateY = interpolate(floatProgress, [0, 0.5, 1], [0, -50, 0]);
				const scale = interpolate(floatProgress, [0, 0.5, 1], [0.5, 1, 0.5]);

				return (
					<div
						key={index}
						style={{
							position: 'absolute',
							width: particle.size,
							height: particle.size,
							background: particle.background,
							top: `${particle.top}%`,
							left: `${particle.left}%`,
							borderRadius: '50%',
							opacity: 0.8,
							transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
						}}
					/>
				);
			})}

			<div
				style={{
					position: 'absolute',
					width: '200px',
					height: '200px',
					background: 'rgba(0, 255, 255, 0.2)',
					border: '2px solid rgba(0, 255, 255, 0.4)',
					boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
					top: '50%',
					left: '50%',
					transform: `translate(-50%, -50%) rotateY(${(localFrame / (ROTATE_DURATION * fps)) * 360}deg)`,
				}}
			/>
		</div>
	);
};

export default NeonParticlesAnimation;