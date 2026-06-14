import React from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PARTICLE_CONFIGS = [
    { id: 1, width: 3, height: 15, left: '20%', color: '#00ffff', duration: 300, delay: 0 },
    { id: 2, width: 4, height: 4, left: '80%', color: '#ff00ff', duration: 600, delay: -120 },
    { id: 3, width: 10, height: 2, left: '50%', color: '#ffff00', duration: 150, delay: -60 },
    { id: 4, width: 2, height: 20, left: '35%', color: '#00ffff', duration: 300, delay: -180 },
    { id: 5, width: 5, height: 5, left: '65%', color: '#ff00ff', duration: 300, delay: -240 },
];

export const SynthwaveEndscreen: React.FC = () => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Master Glitch Calculation (600 frames loop)
    const glitchFrame = frame % 600;
    let glitchTx = 0;
    let glitchTy = 0;
    let glitchFilter = 'none';

    if (glitchFrame >= 294 && glitchFrame < 297) {
        // 49% analog
        glitchTx = -3;
        glitchTy = 2;
        glitchFilter = 'drop-shadow(4px 0 0 #00ffff) drop-shadow(-4px 0 0 #ff00ff)';
    } else if (glitchFrame >= 297 && glitchFrame < 300) {
        // 50% analog
        glitchTx = 3;
        glitchTy = -2;
        glitchFilter = 'drop-shadow(-4px 0 0 #00ffff) drop-shadow(4px 0 0 #ff00ff)';
    } else if (glitchFrame >= 582 && glitchFrame < 585) {
        // 97% analog
        glitchTx = 2;
        glitchTy = 3;
        glitchFilter = 'drop-shadow(5px 0 0 #00ffff) drop-shadow(-5px 0 0 #ff00ff)';
    } else if (glitchFrame >= 585 && glitchFrame < 588) {
        // 98% analog
        glitchTx = -4;
        glitchTy = -1;
        glitchFilter = 'drop-shadow(-5px 0 0 #00ffff) drop-shadow(5px 0 0 #ff00ff)';
    }

    // Grid movement loop (300 frames)
    const gridProgress = (frame % 300) / 300;

    // Ambient Lights Loop (300 frames)
    const leftPhase = (frame / 300) * Math.PI * 2;
    const leftLightOpacity = 0.25 + 0.1 * Math.sin(leftPhase);
    const leftLightScale = 1.0 + 0.1 * Math.sin(leftPhase);

    const rightPhase = ((frame + 150) / 300) * Math.PI * 2;
    const rightLightOpacity = 0.25 + 0.1 * Math.sin(rightPhase);
    const rightLightScale = 1.0 + 0.1 * Math.sin(rightPhase);

    // Rotations (300 frames loop / 150 frames loop)
    const rotateLeft = (frame % 300) * (360 / 300);
    const rotateRight = 360 - rotateLeft;
    const rotateSub = (frame % 150) * (360 / 150);

    // Glitch Line jump (300 frames loop)
    const lineFrame = frame % 300;
    let glitchLineOpacity = 0;
    let glitchLineTop = 0;
    if (lineFrame >= 273 && lineFrame < 276) {
        glitchLineOpacity = 1;
        glitchLineTop = 20;
    } else if (lineFrame >= 279 && lineFrame < 282) {
        glitchLineOpacity = 1;
        glitchLineTop = 75;
    } else if (lineFrame >= 285 && lineFrame < 288) {
        glitchLineOpacity = 1;
        glitchLineTop = 40;
    }

    // Styles
    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor}) translate(${glitchTx}px, ${glitchTy}px)`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#050505',
        boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.9)',
        filter: glitchFilter,
    };

    const lightLeftStyle: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0,
        top: '10%',
        left: '5%',
        width: '40%',
        height: '60%',
        background: '#00ffff',
        opacity: leftLightOpacity,
        transform: `scale(${leftLightScale})`,
    };

    const lightRightStyle: React.CSSProperties = {
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0,
        top: '10%',
        right: '5%',
        width: '40%',
        height: '60%',
        background: '#ff00ff',
        opacity: rightLightOpacity,
        transform: `scale(${rightLightScale})`,
    };

    const gridWrapperStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: '-20%',
        left: '-50%',
        width: '200%',
        height: '70%',
        perspective: '800px',
        zIndex: 1,
    };

    const gridSurfaceStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundImage: `
            linear-gradient(to right, rgba(0, 255, 255, 0.2) 2px, transparent 2px),
            linear-gradient(to top, rgba(255, 0, 255, 0.4) 2px, transparent 2px)
        `,
        backgroundSize: '3% 15%',
        transform: 'rotateX(75deg)',
        transformOrigin: 'center top',
        boxShadow: 'inset 0 100px 100px #050505',
        backgroundPositionY: `${gridProgress * 15}%`,
    };

    const particlesStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        zIndex: 5,
    };

    const glitchLineStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '2px',
        background: 'rgba(255, 255, 255, 0.8)',
        boxShadow: '0 0 10px #00ffff, 0 0 10px #ff00ff',
        zIndex: 90,
        opacity: glitchLineOpacity,
        top: `${glitchLineTop}%`,
    };

    const videoLeftStyle: React.CSSProperties = {
        position: 'absolute',
        width: '36%',
        aspectRatio: '16 / 9',
        top: '16%',
        zIndex: 10,
        left: '9%',
    };

    const videoRightStyle: React.CSSProperties = {
        position: 'absolute',
        width: '36%',
        aspectRatio: '16 / 9',
        top: '16%',
        zIndex: 10,
        right: '9%',
    };

    const borderWrapperLeftStyle: React.CSSProperties = {
        position: 'absolute',
        inset: -4,
        background: '#222',
        overflow: 'hidden',
        zIndex: -1,
        boxShadow: '0 0 25px rgba(0, 255, 255, 0.4)',
    };

    const borderWrapperRightStyle: React.CSSProperties = {
        position: 'absolute',
        inset: -4,
        background: '#222',
        overflow: 'hidden',
        zIndex: -1,
        boxShadow: '0 0 25px rgba(255, 0, 255, 0.4)',
    };

    const conicLeftStyle: React.CSSProperties = {
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'conic-gradient(from 0deg, transparent 60%, #00ffff 100%)',
        transform: `rotate(${rotateLeft}deg)`,
    };

    const conicRightStyle: React.CSSProperties = {
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'conic-gradient(from 0deg, transparent 60%, #ff00ff 100%)',
        transform: `rotate(${rotateRight}deg)`,
    };

    const greenScreenRectStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        backgroundColor: '#00FF00',
        zIndex: 2,
    };

    const techCornersStyle: React.CSSProperties = {
        position: 'absolute',
        inset: -10,
        zIndex: 3,
    };

    const techCornerBeforeStyle: React.CSSProperties = {
        position: 'absolute',
        width: 20,
        height: 20,
        border: '2px solid #fff',
        opacity: 0.7,
        top: 0,
        left: 0,
        borderRight: 'none',
        borderBottom: 'none',
    };

    const techCornerAfterStyle: React.CSSProperties = {
        position: 'absolute',
        width: 20,
        height: 20,
        border: '2px solid #fff',
        opacity: 0.7,
        bottom: 0,
        right: 0,
        borderLeft: 'none',
        borderTop: 'none',
    };

    const subscribeBoxStyle: React.CSSProperties = {
        position: 'absolute',
        width: '14%',
        aspectRatio: '1 / 1',
        bottom: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        borderRadius: '50%',
    };

    const borderCircleStyle: React.CSSProperties = {
        position: 'absolute',
        inset: -4,
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 0 30px rgba(255, 255, 0, 0.4)',
        zIndex: -1,
    };

    const conicCircleStyle: React.CSSProperties = {
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'conic-gradient(from 0deg, transparent 40%, #00ffff 60%, #ff00ff 80%, #ffff00 100%)',
        transform: `rotate(${rotateSub}deg)`,
    };

    const greenScreenCircleStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        backgroundColor: '#00FF00',
        borderRadius: '50%',
        zIndex: 2,
    };

    const scanlinesStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0) 2px, rgba(0, 0, 0, 0.2) 3px, rgba(0, 0, 0, 0.2) 4px)',
        zIndex: 100,
        opacity: 0.6,
        pointerEvents: 'none',
    };

    return (
        <div style={containerStyle}>
            <div style={lightLeftStyle} />
            <div style={lightRightStyle} />

            <div style={gridWrapperStyle}>
                <div style={gridSurfaceStyle} />
            </div>

            <div style={particlesStyle}>
                {PARTICLE_CONFIGS.map((p) => {
                    const pFrame = (frame + p.delay + 1200) % p.duration;
                    const progress = pFrame / p.duration;

                    let opacity = 0;
                    if (progress <= 0.1) {
                        opacity = (progress / 0.1) * 0.8;
                    } else if (progress <= 0.9) {
                        opacity = 0.8;
                    } else {
                        opacity = 0.8 - ((progress - 0.9) / 0.1) * 0.8;
                    }

                    const scale = 1.0 - progress * 0.5;
                    const translateY = (1 - progress) * -1180; // Starts below 1080 and floats out of screen

                    return (
                        <div
                            key={p.id}
                            style={{
                                position: 'absolute',
                                width: p.width,
                                height: p.height,
                                left: p.left,
                                bottom: '-10%',
                                backgroundColor: p.color,
                                opacity,
                                transform: `translateY(${translateY}px) scale(${scale})`,
                            }}
                        />
                    );
                })}
            </div>

            <div style={glitchLineStyle} />

            <div style={videoLeftStyle}>
                <div style={borderWrapperLeftStyle}>
                    <div style={conicLeftStyle} />
                </div>
                <div style={greenScreenRectStyle} />
                <div style={techCornersStyle}>
                    <div style={techCornerBeforeStyle} />
                    <div style={techCornerAfterStyle} />
                </div>
            </div>

            <div style={videoRightStyle}>
                <div style={borderWrapperRightStyle}>
                    <div style={conicRightStyle} />
                </div>
                <div style={greenScreenRectStyle} />
                <div style={techCornersStyle}>
                    <div style={techCornerBeforeStyle} />
                    <div style={techCornerAfterStyle} />
                </div>
            </div>

            <div style={subscribeBoxStyle}>
                <div style={borderCircleStyle}>
                    <div style={conicCircleStyle} />
                </div>
                <div style={greenScreenCircleStyle} />
            </div>

            <div style={scanlinesStyle} />
        </div>
    );
};

export default SynthwaveEndscreen;
// END_OF_FILE