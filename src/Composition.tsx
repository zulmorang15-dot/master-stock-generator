import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const YoutubeEndScreen: React.FC = () => {
	const { width, height, fps } = useVideoConfig();
	const frame = useCurrentFrame();

	// Calculate scaling to perfectly fit container edge-to-edge
	const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

	// 1. Background Gradient Motion Loop (10s/300f cycle for seamless 30s loop)
	const bgFrame = frame % 300;
	const bgX = interpolate(
		bgFrame,
		[0, 150, 300],
		[0, 100, 0],
		{ easing: Easing.inOut(Easing.quad) }
	);

	// 2. Skewed Decorative Elements Motion Loops
	// Before Element: 15s (450 frames) alternate loop for seamless 30s
	const beforeFrame = frame % 450;
	const beforeX = interpolate(
		beforeFrame,
		[0, 225, 450],
		[-5, 5, -5],
		{ easing: Easing.inOut(Easing.quad) }
	);
	const beforeOpacity = interpolate(
		beforeFrame,
		[0, 225, 450],
		[0.5, 1, 0.5],
		{ easing: Easing.inOut(Easing.quad) }
	);

	// After Element: 7.5s (225 frames) alternate loop for seamless 30s
	const afterFrame = frame % 225;
	const afterX = interpolate(
		afterFrame,
		[0, 112.5, 225],
		[5, -5, 5],
		{ easing: Easing.inOut(Easing.quad) }
	);
	const afterOpacity = interpolate(
		afterFrame,
		[0, 112.5, 225],
		[1, 0.3, 1],
		{ easing: Easing.inOut(Easing.quad) }
	);

	// 3. Border lines around SUBSCRIBE text (2s/60f cycle, delays perfectly offset)
	const borderProgress = frame % 60;

	// Span 1: Top border (moves Left -> Right)
	const span1Left = interpolate(
		borderProgress,
		[0, 30, 60],
		[-100, 100, 100],
		{ extrapolateRight: 'clamp' }
	);

	// Span 2: Right border (moves Top -> Bottom with 15 frames/0.5s delay)
	const span2Progress = (frame + 45) % 60;
	const span2Top = interpolate(
		span2Progress,
		[0, 30, 60],
		[-100, 100, 100],
		{ extrapolateRight: 'clamp' }
	);

	// Span 3: Bottom border (moves Right -> Left with 30 frames/1.0s delay)
	const span3Progress = (frame + 30) % 60;
	const span3Right = interpolate(
		span3Progress,
		[0, 30, 60],
		[-100, 100, 100],
		{ extrapolateRight: 'clamp' }
	);

	// Span 4: Left border (moves Bottom -> Top with 45 frames/1.5s delay)
	const span4Progress = (frame + 15) % 60;
	const span4Bottom = interpolate(
		span4Progress,
		[0, 30, 60],
		[-100, 100, 100],
		{ extrapolateRight: 'clamp' }
	);

	// 4. Meteor Lines (Deterministically pre-calculated/animated per frame)
	// Meteor Line 1: 3s (90f) loop
	const m1Frame = frame % 90;
	const m1X = interpolate(m1Frame, [0, 90], [384, -2880]);
	const m1Opacity = interpolate(m1Frame, [0, 10, 80, 90], [0, 1, 1, 0]);

	// Meteor Line 2: 5s (150f) loop
	const m2Frame = (frame + 45) % 150;
	const m2X = interpolate(m2Frame, [0, 150], [384, -2880]);
	const m2Opacity = interpolate(m2Frame, [0, 15, 135, 150], [0, 1, 1, 0]);

	// Meteor Line 3: 6s (180f) loop
	const m3Frame = (frame + 90) % 180;
	const m3X = interpolate(m3Frame, [0, 180], [384, -2880]);
	const m3Opacity = interpolate(m3Frame, [0, 18, 162, 180], [0, 1, 1, 0]);

	// 5. Interactive Floating / Hover Pulses for dynamic video & profile boxes
	const boxScalePulse = interpolate(
		frame % 150,
		[0, 75, 150],
		[1, 1.03, 1],
		{ easing: Easing.inOut(Easing.quad) }
	);

	const profileScalePulse = interpolate(
		frame % 120,
		[0, 60, 120],
		[1, 1.06, 1],
		{ easing: Easing.inOut(Easing.quad) }
	);

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
				backgroundColor: '#111',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div
				className="end-screen-container"
				style={{
					position: 'relative',
					width: '100%',
					height: '100%',
					background: 'linear-gradient(135deg, #2b0000 0%, #aa0000 25%, #400000 50%, #e60000 75%, #2b0000 100%)',
					backgroundSize: '400% 400%',
					backgroundPosition: `${bgX}% 50%`,
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					boxShadow: '0 0 30px rgba(0,0,0,0.8)',
				}}
			>
				{/* Pseudo-elements rendered as absolute divs */}
				<div
					style={{
						content: "''",
						position: 'absolute',
						zIndex: 0,
						transform: `skewX(-45deg) translateX(${beforeX}%)`,
						width: '200%',
						height: '50%',
						top: '-10%',
						left: '-50%',
						background: 'linear-gradient(90deg, rgba(255,0,0,0) 0%, rgba(200,0,0,0.4) 50%, rgba(255,0,0,0) 100%)',
						opacity: beforeOpacity,
					}}
				/>
				<div
					style={{
						content: "''",
						position: 'absolute',
						zIndex: 0,
						transform: `skewX(-45deg) translateX(${afterX}%)`,
						width: '200%',
						height: '70%',
						bottom: '-20%',
						right: '-50%',
						background: 'linear-gradient(90deg, rgba(150,0,0,0) 0%, rgba(255,0,0,0.2) 50%, rgba(150,0,0,0) 100%)',
						opacity: afterOpacity,
					}}
				/>

				{/* Meteor Lines */}
				<div
					className="bg-line line-1"
					style={{
						position: 'absolute',
						width: '288px',
						height: '3.84px',
						background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
						transform: `rotate(-45deg) translateX(${m1X}px)`,
						top: '-192px',
						right: '192px',
						zIndex: 1,
						opacity: m1Opacity,
					}}
				/>
				<div
					className="bg-line line-2"
					style={{
						position: 'absolute',
						width: '384px',
						height: '3.84px',
						background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
						transform: `rotate(-45deg) translateX(${m2X}px)`,
						top: '192px',
						right: '-192px',
						zIndex: 1,
						opacity: m2Opacity,
					}}
				/>
				<div
					className="bg-line line-3"
					style={{
						position: 'absolute',
						width: '192px',
						height: '3.84px',
						background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
						transform: `rotate(-45deg) translateX(${m3X}px)`,
						top: '-384px',
						right: '960px',
						zIndex: 1,
						opacity: m3Opacity,
					}}
				/>

				{/* Header Wrapper */}
				<div
					className="header-wrapper"
					style={{
						position: 'relative',
						zIndex: 2,
						marginTop: '96px',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<div
						className="subscribe-text"
						style={{
							color: '#ffffff',
							fontFamily: "'Impact', 'Arial Black', sans-serif",
							fontSize: '115.2px',
							fontStyle: 'italic',
							fontWeight: 900,
							letterSpacing: '3.84px',
							textTransform: 'uppercase',
							position: 'relative',
							padding: '28.8px 57.6px',
							overflow: 'hidden',
						}}
					>
						{/* Top Border Span */}
						<span
							style={{
								position: 'absolute',
								background: '#ffffff',
								top: 0,
								left: `${span1Left}%`,
								width: '100%',
								height: '5.76px',
							}}
						/>
						{/* Right Border Span */}
						<span
							style={{
								position: 'absolute',
								background: '#ffffff',
								top: `${span2Top}%`,
								right: 0,
								width: '5.76px',
								height: '100%',
							}}
						/>
						{/* Bottom Border Span */}
						<span
							style={{
								position: 'absolute',
								background: '#ffffff',
								bottom: 0,
								right: `${span3Right}%`,
								width: '100%',
								height: '5.76px',
							}}
						/>
						{/* Left Border Span */}
						<span
							style={{
								position: 'absolute',
								background: '#ffffff',
								bottom: `${span4Bottom}%`,
								left: 0,
								width: '5.76px',
								height: '100%',
							}}
						/>
						SUBSCRIBE
					</div>
				</div>

				{/* Content Area */}
				<div
					className="content-area"
					style={{
						position: 'relative',
						zIndex: 2,
						display: 'flex',
						width: '86%',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginTop: '115.2px',
					}}
				>
					{/* Left Video Box */}
					<div
						className="box-wrapper"
						style={{
							display: 'flex',
							flexDirection: 'column',
							width: '31%',
							transform: `scale(${boxScalePulse})`,
						}}
					>
						<div
							className="video-box"
							style={{
								width: '100%',
								aspectRatio: '16 / 9',
								backgroundColor: '#ffffff',
								borderRadius: '7.68px',
								boxShadow: '0 19.2px 38.4px rgba(0, 0, 0, 0.4)',
							}}
						/>
						<div
							className="label-text text-left"
							style={{
								color: '#ffffff',
								fontSize: '38.4px',
								marginTop: '28.8px',
								fontWeight: 300,
								letterSpacing: '1.92px',
								textTransform: 'uppercase',
								textAlign: 'left',
								fontFamily: "'Arial', sans-serif",
							}}
						>
							WATCH MORE
						</div>
					</div>

					{/* Center Profile Circle */}
					<div
						className="profile-wrapper"
						style={{
							width: '22%',
							display: 'flex',
							justifyContent: 'center',
							marginTop: '-57.6px',
							transform: `scale(${profileScalePulse})`,
						}}
					>
						<div
							className="profile-circle"
							style={{
								width: '100%',
								aspectRatio: '1 / 1',
								backgroundColor: '#ffffff',
								borderRadius: '50%',
								boxShadow: '0 19.2px 38.4px rgba(0, 0, 0, 0.4)',
							}}
						/>
					</div>

					{/* Right Video Box */}
					<div
						className="box-wrapper"
						style={{
							display: 'flex',
							flexDirection: 'column',
							width: '31%',
							transform: `scale(${boxScalePulse})`,
						}}
					>
						<div
							className="video-box"
							style={{
								width: '100%',
								aspectRatio: '16 / 9',
								backgroundColor: '#ffffff',
								borderRadius: '7.68px',
								boxShadow: '0 19.2px 38.4px rgba(0, 0, 0, 0.4)',
							}}
						/>
						<div
							className="label-text text-right"
							style={{
								color: '#ffffff',
								fontSize: '38.4px',
								marginTop: '28.8px',
								fontWeight: 300,
								letterSpacing: '1.92px',
								textTransform: 'uppercase',
								textAlign: 'right',
								fontFamily: "'Arial', sans-serif",
							}}
						>
							MY SUGGESTION
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default YoutubeEndScreen;
// END_OF_FILE