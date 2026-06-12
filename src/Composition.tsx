import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic particles pre-calculated outside the component to avoid Math.random()
const PARTICLE_COUNT = 80;
const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const radius = 150 + Math.abs(Math.sin(i * 987.654)) * 350;
    const x = 960 + Math.cos(angle) * radius;
    const zBase = 540 + Math.sin(angle) * radius * 0.4;
    const phase = (i / PARTICLE_COUNT) * Math.PI * 2;
    const size = 1.5 + Math.abs(Math.cos(i * 123.45)) * 3;
    const opacity = 0.2 + Math.abs(Math.sin(i * 456.78)) * 0.5;
    return { x, zBase, phase, size, opacity };
});

const DUST_COUNT = 40;
const dustParticles = Array.from({ length: DUST_COUNT }).map((_, i) => {
    const x = Math.abs(Math.sin(i * 345.67)) * 1920;
    const yStart = Math.abs(Math.cos(i * 765.43)) * 1080;
    const speed = 0.4 + Math.abs(Math.sin(i * 12.34)) * 1.2;
    const size = 1 + Math.abs(Math.cos(i * 89.12)) * 2;
    const opacity = 0.15 + Math.abs(Math.sin(i * 56.78)) * 0.3;
    return { x, yStart, speed, size, opacity };
});

const HudCrosshair = ({ style }: { style: React.CSSProperties }) => {
    return (
        <div style={{ ...style, position: 'absolute', width: 20, height: 20 }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 2, backgroundColor: '#0055ff', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', top: 0, left: '50%', width: 2, height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }} />
        </div>
    );
};

export const FuturisticEsportsEndScreen = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Grid animation: loop every 30 frames (1 second)
    const gridProgress = (frame % 30) / 30;
    const horizonY = 500;
    const gridHeight = 580;
    const lineCount = 24;

    const perspectiveLines = [];
    for (let i = 0; i <= lineCount; i++) {
        const progress = i / lineCount;
        const xStart = 960;
        const xEnd = -400 + progress * 2720;
        perspectiveLines.push({ xStart, yStart: horizonY, xEnd, yEnd: 1080 });
    }

    const horizontalLines = [];
    const horizontalLineCount = 15;
    for (let i = 0; i < horizontalLineCount; i++) {
        const ratio = (i + gridProgress) / horizontalLineCount;
        const y = horizonY + Math.pow(ratio, 2) * gridHeight;
        horizontalLines.push(y);
    }

    // Rotating Rings Rotations
    const rotateOuterDeg = interpolate(frame % 360, [0, 360], [0, 360]);
    const rotateDashedDeg = interpolate(frame % 360, [0, 360], [0, 360]);
    const rotateInnerDeg = interpolate(frame % 360, [0, 360], [720, 0]);

    // HUD subtle scale pulse
    const hudScale = interpolate(
        frame % 120,
        [0, 60, 120],
        [1, 1.15, 1],
        { easing: Easing.inOut(Easing.sin) }
    );
    const hudOpacity = interpolate(
        frame % 120,
        [0, 60, 120],
        [0.3, 0.6, 0.3],
        { easing: Easing.inOut(Easing.sin) }
    );

    // Scanline & Sweep Positions
    const scanlineLeftY = interpolate(frame % 120, [0, 120], [-100, 100]);
    const scanlineRightY = interpolate((frame + 60) % 120, [0, 120], [-100, 100]);

    const sweepLeftX = interpolate(
        frame % 180,
        [0, 36, 180],
        [-100, 200, 200],
        { easing: Easing.bezier(0.19, 1, 0.22, 1) }
    );
    const sweepRightX = interpolate(
        (frame + 90) % 180,
        [0, 36, 180],
        [-100, 200, 200],
        { easing: Easing.bezier(0.19, 1, 0.22, 1) }
    );

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, #020b1f 0%, #010308 100%)',
    };

    const uiLayerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
    };

    const placeholderBaseStyle: React.CSSProperties = {
        position: 'absolute',
        width: 580,
        height: 326,
        top: 377,
        background: 'rgba(0, 15, 30, 0.4)',
        border: '2px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
    };

    const cornerBaseStyle: React.CSSProperties = {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#00ffff',
        borderStyle: 'solid',
        borderWidth: 0,
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
        zIndex: 3,
    };

    const cornerTL: React.CSSProperties = { ...cornerBaseStyle, top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 };
    const cornerTR: React.CSSProperties = { ...cornerBaseStyle, top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 };
    const cornerBL: React.CSSProperties = { ...cornerBaseStyle, bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 };
    const cornerBR: React.CSSProperties = { ...cornerBaseStyle, bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 };

    return (
        <div style={containerStyle}>
            {/* Holographic grid and particles background */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                <defs>
                    <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00ffff" stopOpacity="0" />
                        <stop offset="20%" stopColor="#0055ff" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#00ffff" stopOpacity="0.5" />
                    </linearGradient>
                </defs>

                {/* Perspective lines */}
                {perspectiveLines.map((line, idx) => (
                    <line
                        key={`p-${idx}`}
                        x1={line.xStart}
                        y1={line.yStart}
                        x2={line.xEnd}
                        y2={line.yEnd}
                        stroke="url(#gridFade)"
                        strokeWidth="1.5"
                    />
                ))}

                {/* Moving horizontal lines */}
                {horizontalLines.map((y, idx) => {
                    const opacity = interpolate(y, [horizonY, 1080], [0, 0.6]);
                    return (
                        <line
                            key={`h-${idx}`}
                            x1="0"
                            y1={y}
                            x2="1920"
                            y2={y}
                            stroke="#00ffff"
                            strokeWidth="1.5"
                            strokeOpacity={opacity}
                        />
                    );
                })}

                {/* Glowing Energy Waves */}
                {particles.map((p, idx) => {
                    const waveCycle = (frame / 360) * Math.PI * 2 * 6;
                    const yOffset = Math.sin(p.phase + waveCycle) * 25;
                    const currentY = p.zBase + yOffset;
                    return (
                        <circle
                            key={`p-dot-${idx}`}
                            cx={p.x}
                            cy={currentY}
                            r={p.size}
                            fill="#00aaff"
                            fillOpacity={p.opacity}
                            style={{ filter: 'drop-shadow(0px 0px 4px #00ffff)' }}
                        />
                    );
                })}

                {/* Floating Emissive Dust */}
                {dustParticles.map((p, idx) => {
                    let y = p.yStart - (frame * p.speed);
                    if (y < 0) {
                        y = 1080 + (y % 1080);
                    }
                    const edgeFade = Math.sin((y / 1080) * Math.PI);
                    const currentOpacity = p.opacity * edgeFade;

                    return (
                        <circle
                            key={`dust-${idx}`}
                            cx={p.x}
                            cy={y}
                            r={p.size}
                            fill="#00ffff"
                            fillOpacity={currentOpacity}
                            style={{ filter: 'drop-shadow(0px 0px 3px #00ffff)' }}
                        />
                    );
                })}
            </svg>

            <div style={uiLayerStyle}>
                <div style={{ position: 'absolute', top: 150, left: 0, width: '100%', height: 1, backgroundColor: '#00ffff', opacity: 0.2 }} />
                <div style={{ position: 'absolute', bottom: 150, left: 0, width: '100%', height: 1, backgroundColor: '#00ffff', opacity: 0.2 }} />
                
                <HudCrosshair style={{ top: 140, left: 140, transform: `scale(${hudScale})`, opacity: hudOpacity }} />
                <HudCrosshair style={{ top: 140, right: 140, transform: `scale(${hudScale})`, opacity: hudOpacity }} />
                <HudCrosshair style={{ bottom: 140, left: 140, transform: `scale(${hudScale})`, opacity: hudOpacity }} />
                <HudCrosshair style={{ bottom: 140, right: 140, transform: `scale(${hudScale})`, opacity: hudOpacity }} />

                {/* LEFT PLACEHOLDER */}
                <div style={{ ...placeholderBaseStyle, left: 140 }}>
                    <div style={cornerTL} />
                    <div style={cornerTR} />
                    <div style={cornerBL} />
                    <div style={cornerBR} />
                    
                    {/* Scanline */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
                        transform: `translateY(${scanlineLeftY}%)`,
                    }} />

                    {/* Sweep */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '50%',
                        height: '100%',
                        background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.25) 50%, rgba(0, 255, 255, 0) 100%)',
                        transform: `skewX(-25deg) translateX(${sweepLeftX}%)`,
                    }} />
                </div>

                {/* RIGHT PLACEHOLDER */}
                <div style={{ ...placeholderBaseStyle, right: 140 }}>
                    <div style={cornerTL} />
                    <div style={cornerTR} />
                    <div style={cornerBL} />
                    <div style={cornerBR} />

                    {/* Scanline */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
                        transform: `translateY(${scanlineRightY}%)`,
                    }} />

                    {/* Sweep */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '50%',
                        height: '100%',
                        background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.25) 50%, rgba(0, 255, 255, 0) 100%)',
                        transform: `skewX(-25deg) translateX(${sweepRightX}%)`,
                    }} />
                </div>

                {/* CENTER SUBSCRIBE AREA */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 340,
                    height: 340,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    {/* Ring Outer */}
                    <div style={{
                        position: 'absolute',
                        borderRadius: '50%',
                        width: 340,
                        height: 340,
                        borderTop: '4px solid #00ffff',
                        borderBottom: '4px solid #0055ff',
                        boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
                        transform: `rotate(${rotateOuterDeg}deg)`,
                    }} />

                    {/* Ring Dashed */}
                    <div style={{
                        position: 'absolute',
                        borderRadius: '50%',
                        width: 310,
                        height: 310,
                        border: '2px dashed rgba(0, 255, 255, 0.5)',
                        transform: `rotate(${rotateDashedDeg}deg)`,
                    }} />

                    {/* Ring Inner */}
                    <div style={{
                        position: 'absolute',
                        borderRadius: '50%',
                        width: 280,
                        height: 280,
                        borderLeft: '3px solid #0055ff',
                        borderRight: '3px solid #00ffff',
                        transform: `rotate(${rotateInnerDeg}deg)`,
                    }} />

                    {/* Holographic wireframe spheres behind core */}
                    <div style={{
                        position: 'absolute',
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        border: '1px solid rgba(0, 255, 255, 0.25)',
                        transform: `rotateY(${rotateOuterDeg}deg) rotateX(45deg)`,
                        transformStyle: 'preserve-3d',
                    }} />
                    <div style={{
                        position: 'absolute',
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        border: '1px solid rgba(0, 85, 255, 0.2)',
                        transform: `rotateX(${rotateOuterDeg}deg) rotateY(45deg)`,
                        transformStyle: 'preserve-3d',
                    }} />

                    {/* Subscribe Core */}
                    <div style={{
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        background: 'rgba(0, 20, 40, 0.6)',
                        border: '4px solid #00ffff',
                        boxShadow: '0 0 50px rgba(0, 255, 255, 0.5), inset 0 0 40px rgba(0, 85, 255, 0.5)',
                        backdropFilter: 'blur(12px)',
                        position: 'relative',
                        zIndex: 10,
                    }} />
                </div>
            </div>
        </div>
    );
};

export default FuturisticEsportsEndScreen;
// END_OF_FILE