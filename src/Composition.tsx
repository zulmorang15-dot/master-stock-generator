import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

// --- DETERMINISTIC PARTICLE GENERATOR ---
// Generate pseudo-random parameters based on seed index so that offline frame rendering is 100% stable.
interface ParticleSeed {
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    phase: number;
    freq: number;
}

const PARTICLE_COUNT = 150;
const SEEDS: ParticleSeed[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const pseudoRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };
    const randX = pseudoRandom(i * 12.34);
    const randY = pseudoRandom(i * 56.78);
    const randSize = pseudoRandom(i * 90.12);
    const randColor = pseudoRandom(i * 34.56);
    const randSpeedX = pseudoRandom(i * 78.90);
    const randSpeedY = pseudoRandom(i * 12.89);
    const randPhase = pseudoRandom(i * 45.67);
    const randFreq = pseudoRandom(i * 89.01);

    return {
        x: randX * 1920,
        y: randY * 1080,
        size: randSize * 1.5 + 0.5,
        color: randColor > 0.5 ? '#00e5ff' : '#d900ff',
        speedX: (randSpeedX - 0.5) * 0.8,
        speedY: (randSpeedY - 0.5) * 0.8,
        phase: randPhase * Math.PI * 2,
        freq: randFreq * 0.05 + 0.02,
    };
});

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CyberpunkUI: React.FC = () => {
    const { width, height } = useVideoConfig();
    const frame = useCurrentFrame();

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Canvas particle render effect
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

        SEEDS.forEach((p) => {
            // Compute deterministic position updated strictly by the frame index
            let x = (p.x + p.speedX * frame) % ORIGINAL_WIDTH;
            if (x < 0) x += ORIGINAL_WIDTH;
            let y = (p.y + p.speedY * frame) % ORIGINAL_HEIGHT;
            if (y < 0) y += ORIGINAL_HEIGHT;

            // Seamlessly oscillate opacity within 1200 frames (20s @ 60fps)
            // Frequency is normalized using integer factors of 1200 to loop perfectly
            const k = Math.floor(p.freq * 20) + 1; 
            const opacity = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(p.phase + frame * (k * 2 * Math.PI / 1200)));

            ctx.globalAlpha = opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }, [frame]);

    // Vortex Rotation periods calculated to loop cleanly within 1200 frames.
    // 600, 300, 240, 150 frames are all clean factors of 1200 (20 seconds @ 60fps)
    const spinCoreDeg = (frame % 600) * (360 / 600);
    const spinCyan1Deg = (frame % 300) * (360 / 300);
    const spinMag1Deg = -1 * ((frame % 240) * (360 / 240));
    const spinCyan2Deg = (frame % 150) * (360 / 150);

    // Subtle scale pulsing on the entire portal element to add motion fidelity
    const portalPulse = 1.0 + 0.02 * Math.sin(frame * (4 * Math.PI / 300));

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
                backgroundColor: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {/* Main Cyberpunk Container with Aspect Ratio and Glow Borders */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, #0a0216 0%, #05010a 100%)',
                    overflow: 'hidden',
                    boxShadow: '0 0 50px rgba(0, 0, 0, 1)',
                }}
            >
                {/* 1. BACKGROUND LAYERS */}
                
                {/* Micro Hexagonal Structural Grid */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='69.28203230275509' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 17.32050807568877l-20 11.547005383792516L0 17.32050807568877V-5.773502691896258l20-11.547005383792516 20 11.547005383792516V17.32050807568877zm0 46.18802153517006l-20 11.547005383792516-20-11.547005383792516V40.414513459481295l20-11.547005383792516 20 11.547005383792516v23.094010767585034z' fill='rgba%280, 229, 255, 0.04%29' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                        backgroundSize: '30px 52px',
                        zIndex: 1,
                    }}
                />

                {/* Cyber Scan / Speed Lines */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'repeating-linear-gradient(to bottom, transparent, transparent 49.5%, rgba(0, 229, 255, 0.05) 50%, transparent 50.5%)',
                        backgroundSize: '100% 20px',
                        opacity: 0.6,
                        zIndex: 2,
                    }}
                />

                {/* Interactive Starfield & Particle Dust */}
                <canvas
                    ref={canvasRef}
                    width={ORIGINAL_WIDTH}
                    height={ORIGINAL_HEIGHT}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 3,
                    }}
                />

                {/* 2. MAIN INTERACTIVE LAYOUT CONTENT */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6% 8%',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* LEFT PANEL - TARGETING / UI MONITORS */}
                    <div
                        style={{
                            width: '44%',
                            height: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-evenly',
                        }}
                    >
                        {/* Box 1 */}
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '16 / 9',
                                borderRadius: '4px',
                                border: '2px solid transparent',
                                background: 'linear-gradient(#05010a, #05010a) padding-box, linear-gradient(135deg, #00e5ff 0%, #d900ff 100%) border-box',
                                boxShadow: '0 0 10px rgba(0, 229, 255, 0.2), inset 0 0 15px rgba(217, 0, 255, 0.1)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Inner Grid / Reticle Lines (representing HUD UI) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    border: '1px solid rgba(0, 229, 255, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ width: '40%', height: '40%', border: '1px dashed rgba(217, 0, 255, 0.2)', borderRadius: '50%' }} />
                            </div>

                            {/* Node Crosshairs */}
                            <div style={{ position: 'absolute', backgroundColor: '#00e5ff', boxShadow: '0 0 8px #00e5ff', zIndex: 2, top: '-2px', left: '8%', width: '12px', height: '2px' }} />
                            <div style={{ position: 'absolute', backgroundColor: '#00e5ff', boxShadow: '0 0 8px #00e5ff', zIndex: 2, top: '15%', left: '-2px', width: '2px', height: '12px' }} />
                            
                            <div style={{ position: 'absolute', backgroundColor: '#d900ff', boxShadow: '0 0 8px #d900ff', zIndex: 2, bottom: '-2px', right: '8%', width: '12px', height: '2px' }} />
                            <div style={{ position: 'absolute', backgroundColor: '#d900ff', boxShadow: '0 0 8px #d900ff', zIndex: 2, bottom: '15%', right: '-2px', width: '2px', height: '12px' }} />
                        </div>

                        {/* Box 2 */}
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '16 / 9',
                                borderRadius: '4px',
                                border: '2px solid transparent',
                                background: 'linear-gradient(#05010a, #05010a) padding-box, linear-gradient(135deg, #00e5ff 0%, #d900ff 100%) border-box',
                                boxShadow: '0 0 10px rgba(0, 229, 255, 0.2), inset 0 0 15px rgba(217, 0, 255, 0.1)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Inner Grid / Reticle Lines */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    border: '1px solid rgba(0, 229, 255, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{ width: '60%', height: '1px', backgroundColor: 'rgba(0, 229, 255, 0.15)' }} />
                                <div style={{ height: '60%', width: '1px', backgroundColor: 'rgba(0, 229, 255, 0.15)', position: 'absolute' }} />
                            </div>

                            {/* Node Crosshairs */}
                            <div style={{ position: 'absolute', backgroundColor: '#00e5ff', boxShadow: '0 0 8px #00e5ff', zIndex: 2, top: '-2px', left: '8%', width: '12px', height: '2px' }} />
                            <div style={{ position: 'absolute', backgroundColor: '#00e5ff', boxShadow: '0 0 8px #00e5ff', zIndex: 2, top: '15%', left: '-2px', width: '2px', height: '12px' }} />
                            
                            <div style={{ position: 'absolute', backgroundColor: '#d900ff', boxShadow: '0 0 8px #d900ff', zIndex: 2, bottom: '-2px', right: '8%', width: '12px', height: '2px' }} />
                            <div style={{ position: 'absolute', backgroundColor: '#d900ff', boxShadow: '0 0 8px #d900ff', zIndex: 2, bottom: '15%', right: '-2px', width: '2px', height: '12px' }} />
                        </div>
                    </div>

                    {/* RIGHT PANEL - COMPLEX ANOMALY VORTEX PORTAL */}
                    <div
                        style={{
                            width: '45%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: '90%',
                                aspectRatio: '1 / 1',
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transform: `scale(${portalPulse})`,
                            }}
                        >
                            {/* Ambient External Portal Glow */}
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, transparent 50%, rgba(0, 229, 255, 0.1) 65%, transparent 75%)',
                                    position: 'absolute',
                                }}
                            />

                            {/* Hard-surface Portal Cybernetic Containment Ring */}
                            <div
                                style={{
                                    width: '90%',
                                    height: '90%',
                                    borderRadius: '50%',
                                    border: '2px solid transparent',
                                    background: 'linear-gradient(#05010a, #05010a) padding-box, linear-gradient(135deg, #00e5ff 20%, #d900ff 80%) border-box',
                                    boxShadow: '0 0 20px rgba(0, 229, 255, 0.4), inset 0 0 25px rgba(217, 0, 255, 0.4)',
                                    position: 'absolute',
                                    zIndex: 5,
                                }}
                            />

                            {/* Animated Conic Glow Aura */}
                            <div
                                style={{
                                    width: '105%',
                                    height: '105%',
                                    position: 'absolute',
                                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(0, 229, 255, 0.25) 15%, transparent 30%, rgba(217, 0, 255, 0.25) 60%, transparent 80%)',
                                    borderRadius: '50%',
                                    filter: 'blur(12px)',
                                    transform: `rotate(${spinCoreDeg}deg)`,
                                }}
                            />

                            {/* Outer Cyan Organic Plasma Filament */}
                            <div
                                style={{
                                    position: 'absolute',
                                    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                                    mixBlendMode: 'screen',
                                    opacity: 0.8,
                                    width: '85%',
                                    height: '85%',
                                    border: '3px solid #00e5ff',
                                    filter: 'blur(4px)',
                                    transform: `rotate(${spinCyan1Deg}deg)`,
                                }}
                            />

                            {/* Middle Magenta Organic Plasma Filament (Counter-rotating) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    borderRadius: '50% 50% 30% 70% / 60% 40% 70% 30%',
                                    mixBlendMode: 'screen',
                                    opacity: 0.8,
                                    width: '75%',
                                    height: '75%',
                                    border: '4px solid #d900ff',
                                    filter: 'blur(5px)',
                                    transform: `rotate(${spinMag1Deg}deg)`,
                                }}
                            />

                            {/* Deep Core Cyan Plasma Filament */}
                            <div
                                style={{
                                    position: 'absolute',
                                    borderRadius: '60% 40% 50% 50% / 30% 60% 40% 70%',
                                    mixBlendMode: 'screen',
                                    opacity: 0.8,
                                    width: '65%',
                                    height: '65%',
                                    border: '2px solid #00e5ff',
                                    filter: 'blur(3px)',
                                    transform: `rotate(${spinCyan2Deg}deg)`,
                                }}
                            />

                            {/* Singularity / Center Black Hole */}
                            <div
                                style={{
                                    width: '55%',
                                    height: '55%',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, #000000 40%, #05010a 70%, transparent 100%)',
                                    position: 'absolute',
                                    zIndex: 4,
                                    boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 1)',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CyberpunkUI;
// END_OF_FILE