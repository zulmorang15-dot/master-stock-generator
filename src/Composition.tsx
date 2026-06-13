import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const FuturisticPcbEndScreen: React.FC = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    // Scale logic to preserve 16:9 ratio and fill screen perfectly
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Grid Loop (5 seconds cycle, repeats 3 times perfectly in 15 seconds)
    const gridProgress = (frame % (fps * 5)) / (fps * 5);
    const gridShiftX = gridProgress * 80;
    const gridShiftY = gridProgress * 80;
    const subGridShiftX = gridProgress * 20;
    const subGridShiftY = gridProgress * 20;

    // Data Pulse Loop (3.75 seconds cycle, repeats 4 times perfectly in 15 seconds)
    const pulseProgress = (frame % (fps * 3.75)) / (fps * 3.75);
    const pulseLeft = interpolate(pulseProgress, [0, 1], [-100, 200]) + '%';
    const pulseOpacity = interpolate(pulseProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    // Flares (5 seconds sine-wave cycle for smooth, seamless looping alternate action)
    const flareFactor1 = Math.sin((frame / (fps * 5)) * Math.PI * 2) * 0.5 + 0.5;
    const flareFactor2 = Math.sin(((frame / (fps * 5)) * Math.PI * 2) + Math.PI) * 0.5 + 0.5;

    // Placeholders Transitions (15 seconds total timeline, fully custom-mapped to loop)
    const bgOpacity = interpolate(
        frame,
        [0, 90, 330, 660, 840, 900],
        [0, 0, 0.35, 0.35, 0, 0],
        { easing: Easing.bezier(0.4, 0, 0.2, 1) }
    );

    const glowSize = interpolate(
        frame,
        [0, 90, 330, 660, 840, 900],
        [15, 15, 25, 25, 15, 15],
        { easing: Easing.bezier(0.4, 0, 0.2, 1) }
    );

    const glowOpacity = interpolate(
        frame,
        [0, 90, 330, 660, 840, 900],
        [0.5, 0.5, 0.8, 0.8, 0.5, 0.5],
        { easing: Easing.bezier(0.4, 0, 0.2, 1) }
    );

    const insetGlow = interpolate(
        frame,
        [0, 90, 330, 660, 840, 900],
        [0, 0, 20, 20, 0, 0],
        { easing: Easing.bezier(0.4, 0, 0.2, 1) }
    );

    const borderGreen = interpolate(
        frame,
        [0, 90, 330, 660, 840, 900],
        [200, 200, 255, 255, 200, 200],
        { easing: Easing.bezier(0.4, 0, 0.2, 1) }
    );

    const borderAlpha = interpolate(
        frame,
        [0, 90, 330, 660, 840, 900],
        [0.8, 0.8, 1.0, 1.0, 0.8, 0.8],
        { easing: Easing.bezier(0.4, 0, 0.2, 1) }
    );

    // Hatched Pattern Fade and Scale
    const hatchOpacity = interpolate(
        frame,
        [0, 90, 186, 330, 660, 840, 900],
        [1, 1, 1, 0, 0, 1, 1],
        { easing: Easing.bezier(0.4, 0, 0.2, 1) }
    );

    const hatchScale = interpolate(
        frame,
        [0, 90, 330, 660, 840, 900],
        [1, 1, 1.1, 1.1, 1, 1],
        { easing: Easing.bezier(0.4, 0, 0.2, 1) }
    );

    // Scanner animation loop (Repeats every 5 seconds, 3 times in 15 seconds)
    const scannerProgress = (frame % (fps * 5)) / (fps * 5);
    const scannerTop = interpolate(
        scannerProgress,
        [0, 0.5, 0.501, 1],
        [-100, 200, -100, -100],
        { extrapolateRight: 'clamp' }
    ) + '%';

    const scannerOpacity = interpolate(
        scannerProgress,
        [0, 0.05, 0.45, 0.5, 1],
        [0, 0.5, 0.5, 0, 0],
        { extrapolateRight: 'clamp' }
    );

    // Inline Styles
    const mainWrapperStyle: React.CSSProperties = {
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#020510',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    };

    const circuitBgStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
            radial-gradient(circle at 40px 40px, rgba(0, 255, 255, 0.6) 2px, transparent 2px),
            linear-gradient(rgba(0, 200, 255, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 200, 255, 0.15) 1px, transparent 1px),
            linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px, 80px 80px, 80px 80px, 20px 20px, 20px 20px',
        backgroundPosition: `${gridShiftX}px ${gridShiftY}px, ${gridShiftX}px ${gridShiftY}px, ${gridShiftX}px ${gridShiftY}px, ${subGridShiftX}px ${subGridShiftY}px, ${subGridShiftX}px ${subGridShiftY}px`,
        zIndex: 1,
    };

    const dataPulseStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: pulseLeft,
        width: '50%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.15), transparent)',
        transform: 'skewX(-30deg)',
        zIndex: 2,
        opacity: pulseOpacity,
    };

    const vignetteStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, transparent 30%, #020510 90%)',
        zIndex: 3,
        pointerEvents: 'none',
    };

    const flare1Style: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(90px)',
        zIndex: 4,
        top: '-15%',
        left: '-5%',
        width: '500px',
        height: '500px',
        background: 'rgba(0, 150, 255, 0.25)',
        transform: `scale(${1 + 0.2 * flareFactor1})`,
        opacity: 0.5 + 0.5 * flareFactor1,
    };

    const flare2Style: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(90px)',
        zIndex: 4,
        bottom: '-15%',
        right: '-5%',
        width: '600px',
        height: '600px',
        background: 'rgba(0, 255, 255, 0.15)',
        transform: `scale(${1 + 0.2 * flareFactor2})`,
        opacity: 0.5 + 0.5 * flareFactor2,
    };

    const endScreenContainerStyle: React.CSSProperties = {
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '50px',
        width: '80%',
        maxWidth: '1200px',
    };

    // Shared calculations for placeholders
    const placeholderBaseStyle: React.CSSProperties = {
        position: 'relative',
        border: '2px solid',
        overflow: 'hidden',
        backgroundColor: `rgba(0, 170, 255, ${bgOpacity})`,
        borderColor: `rgba(0, ${borderGreen}, 255, ${borderAlpha})`,
        boxShadow: `0 0 ${glowSize}px rgba(0, 200, 255, ${glowOpacity}), inset 0 0 ${insetGlow}px rgba(0, 255, 255, ${insetGlow > 0 ? 0.5 : 0})`,
    };

    const rectStyle: React.CSSProperties = {
        ...placeholderBaseStyle,
        width: '350px',
        height: '200px',
        borderRadius: '12px',
    };

    const circleStyle: React.CSSProperties = {
        ...placeholderBaseStyle,
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        flexShrink: 0,
    };

    const hatchedPatternStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'repeating-linear-gradient(-45deg, rgba(0, 200, 255, 0.8) 0, rgba(0, 200, 255, 0.8) 4px, transparent 4px, transparent 10px)',
        opacity: hatchOpacity,
        transform: `scale(${hatchScale})`,
    };

    const scannerStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        width: '100%',
        height: '50%',
        background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.8), transparent)',
        top: scannerTop,
        opacity: scannerOpacity,
    };

    return (
        <div style={mainWrapperStyle}>
            <div style={circuitBgStyle} />
            <div style={dataPulseStyle} />
            <div style={vignetteStyle} />
            <div style={flare1Style} />
            <div style={flare2Style} />

            <div style={endScreenContainerStyle}>
                <div style={rectStyle}>
                    <div style={hatchedPatternStyle} />
                    <div style={scannerStyle} />
                </div>

                <div style={circleStyle}>
                    <div style={hatchedPatternStyle} />
                    <div style={scannerStyle} />
                </div>

                <div style={rectStyle}>
                    <div style={hatchedPatternStyle} />
                    <div style={scannerStyle} />
                </div>
            </div>
        </div>
    );
};

export default FuturisticPcbEndScreen;
// END_OF_FILE