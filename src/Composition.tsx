import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// Pre-calculated static random elements outside render loop to avoid Math.random() crashes and guarantee determinism.
const DUST_PARTICLES = Array.from({ length: 100 }).map((_, i) => {
    const x = (i * 19.3) % 1920;
    const y = (i * 11.7) % 1080;
    const size = (i % 3) + 1.5;
    const speed = 0.4 + (i % 5) * 0.15;
    const opacity = 0.3 + (i % 4) * 0.15;
    return { x, y, size, speed, opacity };
});

const WAVE_PARTICLES = Array.from({ length: 140 }).map((_, i) => {
    const angle = (i * Math.PI * 2) / 140;
    const radius = 100 + (i % 5) * 60;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const phase = i * 0.2;
    return { x, z, phase };
});

const EsportsEndScreen = () => {
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const ORIGINAL_WIDTH = 1920;
    const ORIGINAL_HEIGHT = 1080;
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Deterministic animation properties
    // 1. Scanline & Sweep translations (5-second cycle for sweep, 4-second cycle for scanline)
    // Height is 326px, width is 580px
    const scanlineY1 = interpolate(frame % 240, [0, 240], [-326, 326]);
    const scanlineY2 = interpolate((frame + 120) % 240, [0, 240], [-326, 326]);

    const sweepX1 = interpolate(frame % 300, [0, 60, 300], [-300, 700, 700]);
    const sweepX2 = interpolate((frame + 180) % 300, [0, 60, 300], [-300, 700, 700]);

    // 2. Camera Drift
    const driftX = interpolate(frame % 600, [0, 300, 600], [0, 12, 0], { easing: Easing.inOut(Easing.quad) });
    const driftY = interpolate(frame % 600, [0, 300, 600], [0, 8, 0], { easing: Easing.inOut(Easing.quad) });
    const driftRot = interpolate(frame % 600, [0, 300, 600], [0, 0.5, 0], { easing: Easing.inOut(Easing.quad) });

    // 3. Grid movement (offset)
    const gridOffset = interpolate(frame % 120, [0, 120], [0, 80]);

    // 4. Core Animations
    const coreRotateY = interpolate(frame % 1200, [0, 1200], [0, 360]);
    const coreRotateX = interpolate(frame % 1200, [0, 1200], [0, 180]);
    const outerCoreRotateY = interpolate(frame % 1200, [0, 1200], [360, 0]);
    const outerCoreRotateZ = interpolate(frame % 1200, [0, 1200], [0, 360]);

    // 5. Hologram Ring Rotations
    const ringOuterRot = interpolate(frame % 600, [0, 600], [0, 360]);
    const ringInnerRot = interpolate(frame % 300, [0, 300], [360, 0]);
    const ringDashedRot = interpolate(frame % 1200, [0, 1200], [0, 360]);

    // 6. Crosshair Pulse
    const crosshairScale = interpolate(frame % 120, [0, 60, 120], [1, 1.15, 1], { easing: Easing.inOut(Easing.quad) });
    const crosshairOpacity = interpolate(frame % 120, [0, 60, 120], [0.3, 0.7, 0.3], { easing: Easing.inOut(Easing.quad) });

    return (
        <div
            style={{
                backgroundColor: '#010308',
                width: ORIGINAL_WIDTH,
                height: ORIGINAL_HEIGHT,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${scaleFactor})`,
                transformOrigin: 'center center',
                overflow: 'hidden',
            }}
        >
            {/* 3D BACKGROUND SIMULATION */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 1,
                    background: 'radial-gradient(circle at center, #020b1f 0%, #010308 100%)',
                    transform: `scale(1.1) translate(${driftX}px, ${driftY}px) rotate(${driftRot}deg)`,
                    transformOrigin: 'center center',
                }}
            >
                {/* Perspective grid floor */}
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        perspective: '600px',
                        perspectiveOrigin: '50% 40%',
                    }}
                >
                    {/* The grid mesh */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '200%',
                            height: '200%',
                            left: '-50%',
                            top: '-30%',
                            backgroundImage: `
                                linear-gradient(to right, rgba(0, 255, 255, 0.12) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(0, 255, 255, 0.12) 1px, transparent 1px)
                            `,
                            backgroundSize: '80px 80px',
                            transform: `rotateX(75deg) translateY(${gridOffset}px)`,
                            transformOrigin: 'center center',
                            maskImage: 'radial-gradient(ellipse at 50% 40%, black 15%, transparent 65%)',
                            WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 15%, transparent 65%)',
                        }}
                    />

                    {/* Particle wave mesh */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            transform: 'rotateX(75deg) translateZ(-60px)',
                            transformStyle: 'preserve-3d',
                            perspectiveOrigin: '50% 50%',
                        }}
                    >
                        {WAVE_PARTICLES.map((p, idx) => {
                            const t = (frame % 1200) / 1200 * Math.PI * 2;
                            const waveHeight = Math.sin(p.phase + t * 4) * 25 + Math.cos(p.phase + t * 2) * 15;
                            return (
                                <div
                                    key={`wave-${idx}`}
                                    style={{
                                        position: 'absolute',
                                        left: `calc(50% + ${p.x}px)`,
                                        top: `calc(50% + ${p.z}px)`,
                                        width: '5px',
                                        height: '5px',
                                        borderRadius: '50%',
                                        backgroundColor: '#00aaff',
                                        opacity: 0.6,
                                        boxShadow: '0 0 10px #00aaff, 0 0 20px #0055ff',
                                        transform: `translate3d(0, 0, ${waveHeight}px)`,
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Emissive Sphere Cores (Simulated behind the main UI) */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '300px',
                        height: '300px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        perspective: '1000px',
                    }}
                >
                    {/* Background Core Wireframe Sphere */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '150px',
                            height: '150px',
                            transform: `rotateY(${coreRotateY}deg) rotateX(${coreRotateX}deg)`,
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible', position: 'absolute' }}>
                            <circle cx="50" cy="50" r="48" fill="none" stroke="#0055ff" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                            <ellipse cx="50" cy="50" rx="48" ry="16" fill="none" stroke="#0055ff" strokeWidth="1" opacity="0.3" />
                            <ellipse cx="50" cy="50" rx="16" ry="48" fill="none" stroke="#0055ff" strokeWidth="1" opacity="0.3" />
                        </svg>
                    </div>

                    {/* Outer Core Icosahedron Wireframe */}
                    <div
                        style={{
                            position: 'absolute',
                            width: '230px',
                            height: '230px',
                            transform: `rotateY(${outerCoreRotateY}deg) rotateZ(${outerCoreRotateZ}deg)`,
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible', position: 'absolute' }}>
                            <polygon points="50,2 93,27 93,73 50,98 7,73 7,27" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.2" />
                            <line x1="50" y1="2" x2="50" y2="98" stroke="#00ffff" strokeWidth="1" opacity="0.15" />
                            <line x1="7" y1="27" x2="93" y2="73" stroke="#00ffff" strokeWidth="1" opacity="0.15" />
                            <line x1="7" y1="73" x2="93" y2="27" stroke="#00ffff" strokeWidth="1" opacity="0.15" />
                        </svg>
                    </div>
                </div>

                {/* Floating Emissive Dust Particles */}
                <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' }}>
                    {DUST_PARTICLES.map((dust, idx) => {
                        const dynamicY = ((dust.y - (frame * dust.speed)) % 1080 + 1080) % 1080;
                        return (
                            <div
                                key={`dust-${idx}`}
                                style={{
                                    position: 'absolute',
                                    left: dust.x,
                                    top: dynamicY,
                                    width: dust.size,
                                    height: dust.size,
                                    borderRadius: '50%',
                                    backgroundColor: '#00ffff',
                                    opacity: dust.opacity,
                                    boxShadow: '0 0 8px #00ffff',
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* UI OVERLAY LAYER */}
            <div
                id="ui-layer"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            >
                {/* HUD Lines */}
                <div className="hud-line" style={{ position: 'absolute', top: '150px', left: 0, width: '100%', height: '1px', opacity: 0.2, background: '#00ffff', boxShadow: '0 0 10px #00ffff' }} />
                <div className="hud-line" style={{ position: 'absolute', bottom: '150px', left: 0, width: '100%', height: '1px', opacity: 0.2, background: '#00ffff', boxShadow: '0 0 10px #00ffff' }} />

                {/* HUD Crosshairs */}
                {/* Top-Left Crosshair */}
                <div
                    className="hud-crosshair"
                    style={{
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        top: '140px',
                        left: '140px',
                        transform: `scale(${crosshairScale})`,
                        opacity: crosshairOpacity,
                    }}
                >
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', backgroundColor: '#0055ff', transform: 'translateY(-50%)' }} />
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '2px', height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }} />
                </div>

                {/* Top-Right Crosshair */}
                <div
                    className="hud-crosshair"
                    style={{
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        top: '140px',
                        right: '140px',
                        transform: `scale(${crosshairScale})`,
                        opacity: crosshairOpacity,
                    }}
                >
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', backgroundColor: '#0055ff', transform: 'translateY(-50%)' }} />
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '2px', height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }} />
                </div>

                {/* Bottom-Left Crosshair */}
                <div
                    className="hud-crosshair"
                    style={{
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        bottom: '140px',
                        left: '140px',
                        transform: `scale(${crosshairScale})`,
                        opacity: crosshairOpacity,
                    }}
                >
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', backgroundColor: '#0055ff', transform: 'translateY(-50%)' }} />
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '2px', height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }} />
                </div>

                {/* Bottom-Right Crosshair */}
                <div
                    className="hud-crosshair"
                    style={{
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        bottom: '140px',
                        right: '140px',
                        transform: `scale(${crosshairScale})`,
                        opacity: crosshairOpacity,
                    }}
                >
                    <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', backgroundColor: '#0055ff', transform: 'translateY(-50%)' }} />
                    <div style={{ position: 'absolute', top: 0, left: '50%', width: '2px', height: '100%', backgroundColor: '#0055ff', transform: 'translateX(-50%)' }} />
                </div>

                {/* LEFT PLACEHOLDER */}
                <div
                    className="placeholder left"
                    style={{
                        position: 'absolute',
                        width: '580px',
                        height: '326px',
                        top: '377px',
                        left: '140px',
                        backgroundColor: 'rgba(0, 15, 30, 0.4)',
                        border: '2px solid rgba(0, 255, 255, 0.3)',
                        boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Holographic Corners */}
                    <div className="corner tl" style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, borderTopWidth: '4px', borderLeftWidth: '4px', top: '-2px', left: '-2px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3 }} />
                    <div className="corner tr" style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, borderTopWidth: '4px', borderRightWidth: '4px', top: '-2px', right: '-2px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3 }} />
                    <div className="corner bl" style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, borderBottomWidth: '4px', borderLeftWidth: '4px', bottom: '-2px', left: '-2px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3 }} />
                    <div className="corner br" style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, borderBottomWidth: '4px', borderRightWidth: '4px', bottom: '-2px', right: '-2px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3 }} />

                    {/* Scanning Sweep/Scanlines */}
                    <div
                        className="scanline"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
                            transform: `translateY(${scanlineY1}px)`,
                        }}
                    />
                    <div
                        className="sweep"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '50%',
                            height: '100%',
                            background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
                            transform: `skewX(-25deg) translateX(${sweepX1}px)`,
                        }}
                    />
                </div>

                {/* RIGHT PLACEHOLDER */}
                <div
                    className="placeholder right"
                    style={{
                        position: 'absolute',
                        width: '580px',
                        height: '326px',
                        top: '377px',
                        right: '140px',
                        backgroundColor: 'rgba(0, 15, 30, 0.4)',
                        border: '2px solid rgba(0, 255, 255, 0.3)',
                        boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 85, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Holographic Corners */}
                    <div className="corner tl" style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, borderTopWidth: '4px', borderLeftWidth: '4px', top: '-2px', left: '-2px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3 }} />
                    <div className="corner tr" style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, borderTopWidth: '4px', borderRightWidth: '4px', top: '-2px', right: '-2px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3 }} />
                    <div className="corner bl" style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, borderBottomWidth: '4px', borderLeftWidth: '4px', bottom: '-2px', left: '-2px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3 }} />
                    <div className="corner br" style={{ position: 'absolute', width: '40px', height: '40px', borderColor: '#00ffff', borderStyle: 'solid', borderWidth: 0, borderBottomWidth: '4px', borderRightWidth: '4px', bottom: '-2px', right: '-2px', boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)', zIndex: 3 }} />

                    {/* Scanning Sweep/Scanlines */}
                    <div
                        className="scanline"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(to bottom, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.1) 50%, rgba(0, 255, 255, 0) 100%)',
                            transform: `translateY(${scanlineY2}px)`,
                        }}
                    />
                    <div
                        className="sweep"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '50%',
                            height: '100%',
                            background: 'linear-gradient(to right, rgba(0, 255, 255, 0) 0%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0) 100%)',
                            transform: `skewX(-25deg) translateX(${sweepX2}px)`,
                        }}
                    />
                </div>

                {/* CENTER SUBSCRIBE AREA */}
                <div
                    className="subscribe-center"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '340px',
                        height: '340px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {/* Outer Hologram Ring */}
                    <div
                        className="hologram-ring ring-outer"
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            border: '2px solid transparent',
                            width: '340px',
                            height: '340px',
                            borderTop: '4px solid #00ffff',
                            borderBottom: '4px solid #0055ff',
                            boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
                            transform: `rotate(${ringOuterRot}deg)`,
                        }}
                    />

                    {/* Dashed Hologram Ring */}
                    <div
                        className="hologram-ring ring-dashed"
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            border: '2px dashed rgba(0, 255, 255, 0.5)',
                            width: '310px',
                            height: '310px',
                            transform: `rotate(${ringDashedRot}deg)`,
                        }}
                    />

                    {/* Inner Hologram Ring */}
                    <div
                        className="hologram-ring ring-inner"
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            border: '2px solid transparent',
                            width: '280px',
                            height: '280px',
                            borderLeft: '3px solid #0055ff',
                            borderRight: '3px solid #00ffff',
                            transform: `rotate(${ringInnerRot}deg)`,
                        }}
                    />

                    {/* Subscribe Core */}
                    <div
                        className="subscribe-core"
                        style={{
                            width: '220px',
                            height: '220px',
                            borderRadius: '50%',
                            background: 'rgba(0, 20, 40, 0.6)',
                            border: '4px solid #00ffff',
                            boxShadow: '0 0 50px rgba(0, 255, 255, 0.5), inset 0 0 40px rgba(0, 85, 255, 0.5)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            position: 'relative',
                            zIndex: 10,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default EsportsEndScreen;
// END_OF_FILE