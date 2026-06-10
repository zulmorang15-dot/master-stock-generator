import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic holographic particle generator (Safe module-scope seed)
const PARTICLE_COUNT = 80;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
    const seed = i * 45.32;
    const x = ((Math.sin(seed) + 1) / 2) * ORIGINAL_WIDTH;
    const y = ((Math.cos(seed * 1.5) + 1) / 2) * ORIGINAL_HEIGHT;
    const size = 1.5 + ((Math.sin(seed * 2.3) + 1) / 2) * 3.5;
    const opacity = 0.2 + ((Math.cos(seed * 3.7) + 1) / 2) * 0.5;
    const ampX = 8 + ((Math.sin(seed * 4.1) + 1) / 2) * 15;
    const ampY = 12 + ((Math.cos(seed * 5.9) + 1) / 2) * 20;
    return { x, y, size, opacity, ampX, ampY, seed };
});

const CyberpunkGamingEndscreen = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    // 4K Auto-Fit Landscape Scaling
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

    // Dynamic Safe Input Props Setup
    const inputProps = (getInputProps() as any) || {};
    const judul = inputProps.judul || 'UP NEXT';
    const keywordsList = (inputProps.keywords || 'cyberpunk, gaming, looping, endscreen').split(',');

    // --- ANIMATIONS & INTERPOLATIONS (LOCKED TO 300 FRAMES / 10s SEAMLESS LOOP) ---
    
    // Grid movement loop
    const gridScroll = (frame * 2) % 60; // 60px pattern loop

    // Ambient 3D camera drift (Seamless sinus curve)
    const driftAngle = (frame / 300) * Math.PI * 2;
    const driftX = Math.sin(driftAngle) * 15;
    const driftY = Math.cos(driftAngle) * 8;

    // Loop cycle configurations
    const cycle150 = frame % 150;
    const cycle100 = frame % 100;

    // Left card floating & glow
    const leftFloatY = interpolate(cycle150, [0, 75, 150], [0, -12, 0], {
        easing: Easing.inOut(Easing.quad),
    });
    const leftGlowSize = interpolate(cycle150, [0, 75, 150], [25, 50, 25], {
        easing: Easing.inOut(Easing.quad),
    });
    const leftGlowOpacity = interpolate(cycle150, [0, 75, 150], [0.3, 0.65, 0.3], {
        easing: Easing.inOut(Easing.quad),
    });

    // Right card floating & glow (staggered offset for asymmetry)
    const rightFloatY = interpolate((frame + 45) % 150, [0, 75, 150], [0, -12, 0], {
        easing: Easing.inOut(Easing.quad),
    });
    const rightGlowSize = interpolate((frame + 45) % 150, [0, 75, 150], [25, 50, 25], {
        easing: Easing.inOut(Easing.quad),
    });
    const rightGlowOpacity = interpolate((frame + 45) % 150, [0, 75, 150], [0.3, 0.65, 0.3], {
        easing: Easing.inOut(Easing.quad),
    });

    // Center Subscribe area floating & pulsing
    const centerFloatY = interpolate(cycle100, [0, 50, 100], [0, 10, 0], {
        easing: Easing.inOut(Easing.quad),
    });
    const centerGlowSize = interpolate(cycle100, [0, 50, 100], [40, 70, 40], {
        easing: Easing.inOut(Easing.quad),
    });
    const centerGlowOpacity = interpolate(cycle100, [0, 50, 100], [0.5, 0.85, 0.5], {
        easing: Easing.inOut(Easing.quad),
    });

    // Continuously rotating neon rings (360 degrees over 300 frames)
    const innerRingRotation = interpolate(frame % 300, [0, 300], [0, 360], {
        easing: Easing.linear,
    });
    const outerRingRotation = interpolate(frame % 300, [0, 300], [0, -360], {
        easing: Easing.linear,
    });

    // Subtle ambient opacity pulsing on HUD border lines
    const hudLineOpacity = interpolate(cycle150, [0, 75, 150], [0.6, 0.25, 0.6], {
        easing: Easing.inOut(Easing.quad),
    });

    // Dynamic Text Intro Fade
    const textOpacity = interpolate(frame, [0, 35], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
    });
    const textY = interpolate(frame, [0, 35], [30, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
    });

    // Card internal scanning lines
    const scanLineY = interpolate((frame * 2.5) % 360, [0, 360], [-40, 400], {
        easing: Easing.linear,
    });

    // --- STYLES DEFINITION ---
    const mainWrapperStyle: React.CSSProperties = {
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        backgroundColor: '#030008',
        backgroundImage: 'radial-gradient(circle at center, transparent 0%, #030008 100%)',
        overflow: 'hidden',
    };

    const gridContainerStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        perspective: '800px',
        transformStyle: 'preserve-3d',
        zIndex: 1,
        overflow: 'hidden',
        transform: `translate(${driftX}px, ${driftY}px)`,
    };

    const floorStyle: React.CSSProperties = {
        position: 'absolute',
        width: '200%',
        height: '200%',
        left: '-50%',
        top: '42%',
        transform: 'rotateX(82deg)',
        transformOrigin: 'center top',
        backgroundImage: `
            linear-gradient(rgba(0, 243, 255, 0.12) 2px, transparent 2px),
            linear-gradient(90deg, rgba(0, 243, 255, 0.12) 2px, transparent 2px)
        `,
        backgroundSize: '60px 60px',
        backgroundPosition: `center ${gridScroll}px`,
        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
    };

    const ceilingStyle: React.CSSProperties = {
        position: 'absolute',
        width: '200%',
        height: '200%',
        left: '-50%',
        bottom: '42%',
        transform: 'rotateX(-82deg)',
        transformOrigin: 'center bottom',
        backgroundImage: `
            linear-gradient(rgba(188, 19, 254, 0.12) 2px, transparent 2px),
            linear-gradient(90deg, rgba(188, 19, 254, 0.12) 2px, transparent 2px)
        `,
        backgroundSize: '60px 60px',
        backgroundPosition: `center ${gridScroll}px`,
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
    };

    const vfxOverlayStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        zIndex: 2,
        background: 'repeating-linear-gradient(to bottom, rgba(0, 243, 255, 0.03) 0px, rgba(0, 243, 255, 0.03) 2px, transparent 2px, transparent 4px)',
        pointerEvents: 'none',
        boxShadow: 'inset 0 0 150px rgba(188, 19, 254, 0.15)',
    };

    const placeholderBaseStyle: React.CSSProperties = {
        position: 'absolute',
        zIndex: 10,
        width: 640,
        height: 360,
        top: 360,
        background: 'rgba(0, 15, 30, 0.65)',
        border: '2px solid #00f3ff',
        borderRadius: 12,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    };

    const cornerBaseStyle: React.CSSProperties = {
        position: 'absolute',
        width: 24,
        height: 24,
        borderWidth: 2,
        borderStyle: 'solid',
        opacity: 0.9,
        pointerEvents: 'none',
    };

    const gridOverlayStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundImage: `
            linear-gradient(rgba(0, 243, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 243, 255, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: 'center center',
        opacity: 0.3,
    };

    const hudLineStyle: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: '#00f3ff',
        boxShadow: '0 0 10px #00f3ff',
        opacity: hudLineOpacity,
        zIndex: 5,
    };

    const hudDotStyle: React.CSSProperties = {
        position: 'absolute',
        width: 6,
        height: 6,
        backgroundColor: '#bc13fe',
        boxShadow: '0 0 8px #bc13fe',
        borderRadius: '50%',
        zIndex: 5,
    };

    const subscribeAreaStyle: React.CSSProperties = {
        position: 'absolute',
        width: 360,
        height: 360,
        left: 780,
        top: 360,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
        zIndex: 15,
    };

    const ringBaseStyle: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        left: '50%',
        top: '50%',
    };

    return (
        <div style={mainWrapperStyle}>
            {/* Ambient Background & Grids */}
            <div style={gridContainerStyle}>
                <div style={floorStyle} />
                <div style={ceilingStyle} />
                
                {/* Frame-Locked Holographic Particles */}
                {PARTICLES.map((p, i) => {
                    const angle = (frame / 300) * Math.PI * 2;
                    const pOffsetX = Math.sin(angle + p.seed) * p.ampX;
                    const pOffsetY = Math.cos(angle * 2 + p.seed) * p.ampY;
                    return (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: p.x + pOffsetX,
                                top: p.y + pOffsetY,
                                width: p.size,
                                height: p.size,
                                borderRadius: '50%',
                                backgroundColor: '#00f3ff',
                                boxShadow: '0 0 8px #00f3ff, 0 0 2px #00f3ff',
                                opacity: p.opacity,
                            }}
                        />
                    );
                })}
            </div>

            {/* Post-Process Film Scanline / Fog Overlay */}
            <div style={vfxOverlayStyle} />

            {/* Decorative HUD Lines */}
            <div style={{ ...hudLineStyle, top: 120, left: 160, width: 1600, height: 1 }} />
            <div style={{ ...hudLineStyle, bottom: 120, left: 160, width: 1600, height: 1 }} />
            
            {/* HUD Corner Dots */}
            <div style={{ ...hudDotStyle, top: 118, left: 157 }} />
            <div style={{ ...hudDotStyle, top: 118, right: 157 }} />
            <div style={{ ...hudDotStyle, bottom: 118, left: 157 }} />
            <div style={{ ...hudDotStyle, bottom: 118, right: 157 }} />

            {/* Left Placeholder Card */}
            <div
                style={{
                    ...placeholderBaseStyle,
                    left: 160,
                    transform: `translateY(${leftFloatY}px)`,
                    boxShadow: `0 0 ${leftGlowSize}px rgba(0, 243, 255, ${leftGlowOpacity}), inset 0 0 ${leftGlowSize * 0.6}px rgba(0, 243, 255, ${leftGlowOpacity * 0.5})`,
                }}
            >
                <div style={gridOverlayStyle} />
                
                {/* Scanner VFX */}
                <div style={{
                    position: 'absolute',
                    top: scanLineY,
                    left: 0,
                    width: '100%',
                    height: '3px',
                    background: 'linear-gradient(to right, transparent, #00f3ff, transparent)',
                    boxShadow: '0 0 12px #00f3ff, 0 0 4px #00f3ff',
                    opacity: 0.8,
                    pointerEvents: 'none',
                }} />

                {/* Cyberpunk Play Icon Graphic */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25, filter: 'drop-shadow(0 0 8px #00f3ff)', zIndex: 11 }}>
                    <path d="M8 5V19L19 12L8 5Z" fill="#00f3ff" />
                </svg>

                {/* Corner HUD brackets */}
                <div style={{ ...cornerBaseStyle, top: -2, left: -2, borderRight: 'none', borderBottom: 'none', borderRadius: '12px 0 0 0', borderColor: '#bc13fe' }} />
                <div style={{ ...cornerBaseStyle, top: -2, right: -2, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 12px 0 0', borderColor: '#bc13fe' }} />
                <div style={{ ...cornerBaseStyle, bottom: -2, left: -2, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 12px', borderColor: '#bc13fe' }} />
                <div style={{ ...cornerBaseStyle, bottom: -2, right: -2, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 12px 0', borderColor: '#bc13fe' }} />
            </div>

            {/* Right Placeholder Card */}
            <div
                style={{
                    ...placeholderBaseStyle,
                    right: 160,
                    transform: `translateY(${rightFloatY}px)`,
                    boxShadow: `0 0 ${rightGlowSize}px rgba(0, 243, 255, ${rightGlowOpacity}), inset 0 0 ${rightGlowSize * 0.6}px rgba(0, 243, 255, ${rightGlowOpacity * 0.5})`,
                }}
            >
                <div style={gridOverlayStyle} />

                {/* Scanner VFX */}
                <div style={{
                    position: 'absolute',
                    top: scanLineY,
                    left: 0,
                    width: '100%',
                    height: '3px',
                    background: 'linear-gradient(to right, transparent, #00f3ff, transparent)',
                    boxShadow: '0 0 12px #00f3ff, 0 0 4px #00f3ff',
                    opacity: 0.8,
                    pointerEvents: 'none',
                }} />

                {/* Cyberpunk Play Icon Graphic */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25, filter: 'drop-shadow(0 0 8px #00f3ff)', zIndex: 11 }}>
                    <path d="M8 5V19L19 12L8 5Z" fill="#00f3ff" />
                </svg>

                {/* Corner HUD brackets */}
                <div style={{ ...cornerBaseStyle, top: -2, left: -2, borderRight: 'none', borderBottom: 'none', borderRadius: '12px 0 0 0', borderColor: '#bc13fe' }} />
                <div style={{ ...cornerBaseStyle, top: -2, right: -2, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 12px 0 0', borderColor: '#bc13fe' }} />
                <div style={{ ...cornerBaseStyle, bottom: -2, left: -2, borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 12px', borderColor: '#bc13fe' }} />
                <div style={{ ...cornerBaseStyle, bottom: -2, right: -2, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 12px 0', borderColor: '#bc13fe' }} />
            </div>

            {/* Subscribe Interactive Widget */}
            <div
                style={{
                    ...subscribeAreaStyle,
                    transform: `translateY(${centerFloatY}px)`,
                }}
            >
                {/* Outer Dashed Ring (Counter-rotating) */}
                <div
                    style={{
                        ...ringBaseStyle,
                        width: 240,
                        height: 240,
                        border: '2px solid transparent',
                        borderLeft: '2px dashed #bc13fe',
                        borderRight: '2px dashed #bc13fe',
                        boxShadow: '-10px 0 20px rgba(188, 19, 254, 0.2)',
                        zIndex: 18,
                        transform: `translate(-50%, -50%) rotate(${outerRingRotation}deg)`,
                    }}
                />

                {/* Inner Solid Ring (Rotating) */}
                <div
                    style={{
                        ...ringBaseStyle,
                        width: 210,
                        height: 210,
                        border: '2px solid transparent',
                        borderTop: '2px solid #00f3ff',
                        borderBottom: '2px solid #00f3ff',
                        boxShadow: '0 10px 20px rgba(0, 243, 255, 0.2)',
                        zIndex: 19,
                        transform: `translate(-50%, -50%) rotate(${innerRingRotation}deg)`,
                    }}
                />

                {/* Central Glassmorphic Subscribe Orb */}
                <div
                    style={{
                        ...subscribeCircleStyle,
                        boxShadow: `0 0 ${centerGlowSize}px rgba(188, 19, 254, ${centerGlowOpacity}), inset 0 0 ${centerGlowSize * 0.8}px rgba(188, 19, 254, ${centerGlowOpacity * 0.6})`,
                    }}
                >
                    {/* Glowing brand logo SVG */}
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 12px #bc13fe)' }}>
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#bc13fe" />
                    </svg>
                </div>
            </div>

            {/* Dynamic Typography & Branding (Safe Bottom-Left Positioning) */}
            <div
                style={{
                    position: 'absolute',
                    left: 160,
                    bottom: 45,
                    zIndex: 25,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '46px',
                        fontWeight: 900,
                        color: '#ffffff',
                        textTransform: 'uppercase',
                        letterSpacing: '4px',
                        textShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff, 0 0 30px #bc13fe',
                        marginBottom: '12px',
                        opacity: textOpacity,
                        transform: `translateY(${textY}px)`,
                    }}
                >
                    {judul}
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        opacity: textOpacity,
                        transform: `translateY(${textY}px)`,
                    }}
                >
                    {keywordsList.map((word, index) => (
                        <span
                            key={index}
                            style={{
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                fontSize: '11px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                color: '#00f3ff',
                                backgroundColor: 'rgba(0, 243, 255, 0.1)',
                                border: '1px solid rgba(0, 243, 255, 0.35)',
                                borderRadius: '30px',
                                padding: '5px 14px',
                                letterSpacing: '1.5px',
                                backdropFilter: 'blur(5px)',
                                WebkitBackdropFilter: 'blur(5px)',
                                boxShadow: '0 0 15px rgba(0, 243, 255, 0.2)',
                            }}
                        >
                            {word.trim()}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CyberpunkGamingEndscreen;
// END_OF_FILE