import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// DETERMINISTIC RANDOM GENERATION FOR PARTICLES/TRAILS (OUTSIDE COMPONENT)
const SEED = 88;
const random = (i: number) => {
    const x = Math.sin(i * 9876.54) * 10000;
    return x - Math.floor(x);
};

const TRAILS = Array.from({ length: 30 }).map((_, i) => ({
    x: (random(i * 5) - 0.5) * 2000,
    y: (random(i * 5 + 1) - 0.5) * 1000,
    speed: 0.003 + random(i * 5 + 2) * 0.007,
    color: random(i * 5 + 3) > 0.5 ? '#00ffff' : '#0055ff',
    initialProgress: random(i * 5 + 4),
}));

export const CinematicSciFiEsportsEndscreen = () => {
    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();

    const ORIGINAL_WIDTH = 1920;
    const ORIGINAL_HEIGHT = 1080;
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Dynamic looping timeline (15 seconds, matches 900 frames at 60fps)
    const cycleDuration = fps * 15;
    const localFrame = frame % cycleDuration;

    // Camera drift emulation (deterministic sine sweeps)
    const cameraX = Math.sin((localFrame / cycleDuration) * Math.PI * 4) * 45;
    const cameraY = Math.cos((localFrame / cycleDuration) * Math.PI * 3) * 30;

    // Outer thick border breathing (Video slots)
    const borderPulse = Math.sin((localFrame / 90) * Math.PI * 2);
    const borderColor = interpolate(borderPulse, [-1, 1], [0.0, 1.0]);
    const borderGlowColor = `rgba(0, ${Math.floor(179 + borderColor * 76)}, ${Math.floor(179 + borderColor * 76)}, 1)`;
    const borderGlowShadow = interpolate(borderPulse, [-1, 1], [30, 70]);

    // Video Slots Inner Pulse overlay opacity
    const innerPulseLeft = interpolate(
        Math.sin((localFrame / 120) * Math.PI * 2),
        [-1, 1],
        [0.1, 0.45]
    );
    const innerPulseRight = interpolate(
        Math.sin(((localFrame + 60) / 120) * Math.PI * 2),
        [-1, 1],
        [0.1, 0.45]
    );

    // Scanning lines frame calculation
    const leftScanTop = interpolate(
        (localFrame % 180),
        [0, 180],
        [-50, 326]
    );
    const rightScanTop = interpolate(
        ((localFrame + 90) % 180),
        [0, 180],
        [-50, 326]
    );

    // Rotating Hologram Rings
    const sr1Rotation = (localFrame * 0.5) % 360;
    const sr2Rotation = -(localFrame * 0.7) % 360;

    // Sub core pulse
    const coreScale = interpolate(
        Math.sin((localFrame / 90) * Math.PI * 2),
        [-1, 1],
        [0.96, 1.08]
    );
    const coreShadow = interpolate(
        Math.sin((localFrame / 90) * Math.PI * 2),
        [-1, 1],
        [40, 80]
    );

    // HUD Accent horizontal positions
    const topAccentLeft = interpolate(
        Math.sin((localFrame / 240) * Math.PI * 2),
        [-1, 1],
        [0, 1100]
    );
    const bottomAccentRight = interpolate(
        Math.sin((localFrame / 240) * Math.PI * 2),
        [-1, 1],
        [0, 700]
    );

    // Chunks geometric parallax floating paths
    const chunk1Y = 200 + Math.sin((localFrame / 120) * Math.PI * 2) * 45;
    const chunk1RotX = (localFrame * 0.6) % 360;
    const chunk1RotY = (localFrame * 1.2) % 360;

    const chunk2Y = -200 + Math.cos((localFrame / 120) * Math.PI * 2) * 45;
    const chunk2RotX = -(localFrame * 1.2) % 360;
    const chunk2RotY = -(localFrame * 0.6) % 360;

    // Cyberpunk Grid Scrolling Animation (linear looping coordinate)
    const gridShiftY = interpolate(
        (localFrame % 30),
        [0, 30],
        [0, 120]
    );

    return (
        <div
            style={{
                position: 'absolute',
                width: ORIGINAL_WIDTH,
                height: ORIGINAL_HEIGHT,
                backgroundColor: '#010103',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${scaleFactor})`,
                transformOrigin: 'center center',
                overflow: 'hidden',
                color: '#fff',
                fontFamily: `'Segoe UI', Roboto, Helvetica, sans-serif`,
            }}
        >
            {/* 3D WEBGL EMULATION CONTAINER */}
            <div
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    transform: `translate(${cameraX}px, ${cameraY}px)`,
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
            >
                {/* CEILING CYBERPUNK GRID */}
                <div
                    style={{
                        position: 'absolute',
                        width: '6000px',
                        height: '3000px',
                        left: '-2040px',
                        top: '-1500px',
                        backgroundImage: `
                            linear-gradient(to right, rgba(0, 170, 255, 0.15) 2px, transparent 2px),
                            linear-gradient(to bottom, rgba(0, 170, 255, 0.15) 2px, transparent 2px)
                        `,
                        backgroundSize: '120px 120px',
                        backgroundPositionY: `${gridShiftY}px`,
                        transform: 'perspective(1000px) rotateX(-80deg)',
                        transformOrigin: 'center bottom',
                        opacity: 0.8,
                    }}
                />

                {/* FLOOR CYBERPUNK GRID */}
                <div
                    style={{
                        position: 'absolute',
                        width: '6000px',
                        height: '3000px',
                        left: '-2040px',
                        bottom: '-1500px',
                        backgroundImage: `
                            linear-gradient(to right, rgba(0, 170, 255, 0.15) 2px, transparent 2px),
                            linear-gradient(to bottom, rgba(0, 170, 255, 0.15) 2px, transparent 2px)
                        `,
                        backgroundSize: '120px 120px',
                        backgroundPositionY: `${gridShiftY}px`,
                        transform: 'perspective(1000px) rotateX(80deg)',
                        transformOrigin: 'center top',
                        opacity: 0.8,
                    }}
                />

                {/* ENERGY SWEEP TRAILS (Z-DEPTH EMULATION) */}
                <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    {TRAILS.map((trail, index) => {
                        const progress = ((trail.initialProgress + localFrame * trail.speed) % 1);
                        const z = interpolate(progress, [0, 1], [0.1, 3.2]);
                        const x = trail.x * z;
                        const y = trail.y * z;
                        const opacity = interpolate(progress, [0, 0.1, 0.85, 1], [0, 0.75, 0.75, 0]);
                        const scale = z;
                        const heightLength = 150 * z;

                        return (
                            <div
                                key={index}
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    width: 6,
                                    height: heightLength,
                                    backgroundColor: trail.color,
                                    boxShadow: `0 0 20px ${trail.color}`,
                                    transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                                    opacity,
                                    pointerEvents: 'none',
                                }}
                            />
                        );
                    })}
                </div>

                {/* FLOATING GEOMETRIC CHUNKS */}
                {/* Left Wireframe Chunk */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate3d(-800px, ${chunk1Y - 540}px, 0) rotateX(${chunk1RotX}deg) rotateY(${chunk1RotY}deg)`,
                    }}
                >
                    <svg viewBox="-50 -50 100 100" style={{ width: 140, height: 140 }}>
                        <polygon points="0,-40 -35,0 0,20" stroke="#00ffff" fill="rgba(0,255,255,0.1)" strokeWidth={1.5} />
                        <polygon points="0,-40 35,0 0,20" stroke="#00ffff" fill="rgba(0,255,255,0.05)" strokeWidth={1.5} />
                        <polygon points="0,40 -35,0 0,20" stroke="#00ffff" fill="rgba(0,255,255,0.15)" strokeWidth={1.5} />
                        <polygon points="0,40 35,0 0,20" stroke="#00ffff" fill="rgba(0,255,255,0.2)" strokeWidth={1.5} />
                    </svg>
                </div>

                {/* Right Wireframe Chunk */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate3d(800px, ${chunk2Y - 540}px, 0) rotateX(${chunk2RotX}deg) rotateY(${chunk2RotY}deg)`,
                    }}
                >
                    <svg viewBox="-50 -50 100 100" style={{ width: 140, height: 140 }}>
                        <polygon points="0,-40 -35,0 0,20" stroke="#00ffff" fill="rgba(0,255,255,0.1)" strokeWidth={1.5} />
                        <polygon points="0,-40 35,0 0,20" stroke="#00ffff" fill="rgba(0,255,255,0.05)" strokeWidth={1.5} />
                        <polygon points="0,40 -35,0 0,20" stroke="#00ffff" fill="rgba(0,255,255,0.15)" strokeWidth={1.5} />
                        <polygon points="0,40 35,0 0,20" stroke="#00ffff" fill="rgba(0,255,255,0.2)" strokeWidth={1.5} />
                    </svg>
                </div>

                {/* DEPTH VIGNETTE & FOG COUPLING */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle, transparent 35%, rgba(1, 1, 3, 0.95) 90%)',
                        pointerEvents: 'none',
                    }}
                />
            </div>

            {/* UI LAYER OVERLAYS */}
            <div
                id="ui-layer"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 1920,
                    height: 1080,
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            >
                {/* TOP HUD BAR */}
                <div
                    className="hud-bar top"
                    style={{
                        position: 'absolute',
                        height: 6,
                        background: '#00ffff',
                        boxShadow: '0 0 20px #00ffff',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: 120,
                        width: 1200,
                    }}
                >
                    <div
                        className="hud-accent"
                        style={{
                            position: 'absolute',
                            width: 100,
                            height: 6,
                            background: '#fff',
                            boxShadow: '0 0 20px #fff',
                            top: 0,
                            left: topAccentLeft,
                        }}
                    />
                </div>

                {/* LEFT HUD BRACKET */}
                <div
                    className="hud-bracket left"
                    style={{
                        position: 'absolute',
                        width: 80,
                        height: 180,
                        border: '6px solid #00ffff',
                        top: 450,
                        boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
                        left: 40,
                        borderRight: 'none',
                    }}
                />

                {/* LEFT VIDEO SLOT */}
                <div
                    className="video-slot left"
                    style={{
                        position: 'absolute',
                        width: 580,
                        height: 326,
                        top: 377,
                        border: `6px solid ${borderGlowColor}`,
                        boxSizing: 'border-box',
                        background: 'rgba(0, 15, 35, 0.45)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: `0 0 ${borderGlowShadow}px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.15)`,
                        overflow: 'hidden',
                        left: 100,
                    }}
                >
                    <div className="corner corner-tl" style={{ position: 'absolute', width: 50, height: 50, border: '10px solid transparent', zIndex: 3, top: -10, left: -10, borderTopColor: '#fff', borderLeftColor: '#fff' }} />
                    <div className="corner corner-br" style={{ position: 'absolute', width: 50, height: 50, border: '10px solid transparent', zIndex: 3, bottom: -10, right: -10, borderBottomColor: '#fff', borderRightColor: '#fff' }} />
                    <div className="scanline-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
                        <div
                            className="scanline sl-left"
                            style={{
                                position: 'absolute',
                                left: 0,
                                width: '100%',
                                height: 50,
                                background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.8), transparent)',
                                opacity: 0.6,
                                top: leftScanTop,
                            }}
                        />
                    </div>
                    <div
                        className="pulse-overlay po-left"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            boxShadow: `inset 0 0 80px rgba(0, 255, 255, ${innerPulseLeft})`,
                        }}
                    />
                </div>

                {/* SUBSCRIBE CENTERPIECE */}
                <div
                    className="sub-slot"
                    style={{
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
                    }}
                >
                    <div
                        className="sub-ring-1 sr1"
                        style={{
                            position: 'absolute',
                            width: 420,
                            height: 420,
                            borderRadius: '50%',
                            border: '4px dashed #00ffff',
                            boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
                            transform: `rotate(${sr1Rotation}deg)`,
                        }}
                    />
                    <div
                        className="sub-ring-2 sr2"
                        style={{
                            position: 'absolute',
                            width: 330,
                            height: 330,
                            borderRadius: '50%',
                            border: '6px solid transparent',
                            borderTopColor: '#00ffff',
                            borderBottomColor: '#00ffff',
                            boxShadow: '0 0 40px rgba(0, 255, 255, 0.4)',
                            transform: `rotate(${sr2Rotation}deg)`,
                        }}
                    />
                    <div
                        className="sub-core core"
                        style={{
                            position: 'absolute',
                            width: 280,
                            height: 280,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(0, 255, 255, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
                            border: '3px solid rgba(0, 255, 255, 0.6)',
                            transform: `scale(${coreScale})`,
                            boxShadow: `0 0 ${coreShadow}px rgba(0, 255, 255, 0.8)`,
                        }}
                    />
                </div>

                {/* RIGHT VIDEO SLOT */}
                <div
                    className="video-slot right"
                    style={{
                        position: 'absolute',
                        width: 580,
                        height: 326,
                        top: 377,
                        border: `6px solid ${borderGlowColor}`,
                        boxSizing: 'border-box',
                        background: 'rgba(0, 15, 35, 0.45)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: `0 0 ${borderGlowShadow}px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.15)`,
                        overflow: 'hidden',
                        right: 100,
                    }}
                >
                    <div className="corner corner-tr" style={{ position: 'absolute', width: 50, height: 50, border: '10px solid transparent', zIndex: 3, top: -10, right: -10, borderTopColor: '#fff', borderRightColor: '#fff' }} />
                    <div className="corner corner-bl" style={{ position: 'absolute', width: 50, height: 50, border: '10px solid transparent', zIndex: 3, bottom: -10, left: -10, borderBottomColor: '#fff', borderLeftColor: '#fff' }} />
                    <div className="scanline-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
                        <div
                            className="scanline sl-right"
                            style={{
                                position: 'absolute',
                                left: 0,
                                width: '100%',
                                height: 50,
                                background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.8), transparent)',
                                opacity: 0.6,
                                top: rightScanTop,
                            }}
                        />
                    </div>
                    <div
                        className="pulse-overlay po-right"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            boxShadow: `inset 0 0 80px rgba(0, 255, 255, ${innerPulseRight})`,
                        }}
                    />
                </div>

                {/* RIGHT HUD BRACKET */}
                <div
                    className="hud-bracket right"
                    style={{
                        position: 'absolute',
                        width: 80,
                        height: 180,
                        border: '6px solid #00ffff',
                        top: 450,
                        boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
                        right: 40,
                        borderLeft: 'none',
                    }}
                />

                {/* BOTTOM HUD BAR */}
                <div
                    className="hud-bar bottom"
                    style={{
                        position: 'absolute',
                        height: 6,
                        background: '#00ffff',
                        boxShadow: '0 0 20px #00ffff',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bottom: 120,
                        width: 800,
                    }}
                >
                    <div
                        className="hud-accent"
                        style={{
                            position: 'absolute',
                            width: 100,
                            height: 6,
                            background: '#fff',
                            boxShadow: '0 0 20px #fff',
                            top: 0,
                            right: bottomAccentRight,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CinematicSciFiEsportsEndscreen;
// END_OF_FILE