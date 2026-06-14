import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

interface FragmentSpec {
    offset: number;
    h: number;
    alpha: number;
    isHead: boolean;
    bits: boolean[];
    hexCount: number;
}

interface StreamSpec {
    x: number;
    width: number;
    cycles: number;
    maxAlpha: number;
    glow: number;
    baseY: number;
    color: { r: number; g: number; b: number };
    type: number;
    fragments: FragmentSpec[];
}

const COLORS = [
    { r: 255, g: 215, b: 0 },   // Luminous Gold
    { r: 75, g: 0, b: 130 },    // Deep Amethyst Purple
    { r: 255, g: 165, b: 0 },   // Amber Core Highlight
    { r: 180, g: 100, b: 240 }  // Violet Highlight
];

const COLUMNS = 140;
const W = 3840;
const H = 2160;
const COL_WIDTH = Math.floor(W / COLUMNS);

function createPRNG(seed: number) {
    let s = seed;
    return function() {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
}

const random = createPRNG(98765);

const STREAMS_DATA: StreamSpec[] = [];

function createStreamSpec(colIndex: number, depthLayer: number): StreamSpec {
    let width = 0;
    let cycles = 1;
    let maxAlpha = 0.2;
    let glow = 1;

    if (depthLayer === 0) {
        width = COL_WIDTH * 0.25;
        cycles = 1;
        maxAlpha = 0.2;
        glow = 1;
    } else if (depthLayer === 1) {
        width = COL_WIDTH * 0.5;
        cycles = 2;
        maxAlpha = 0.5;
        glow = 10;
    } else {
        width = COL_WIDTH * 0.8;
        cycles = Math.floor(random() * 2) + 3; // 3 or 4
        maxAlpha = 1.0;
        glow = 40;
    }

    const baseY = random();
    const color = COLORS[Math.floor(random() * COLORS.length)];
    let x = colIndex * COL_WIDTH + (COL_WIDTH - width) / 2;
    const type = Math.floor(random() * 4);

    const fragments: FragmentSpec[] = [];
    const numFrags = Math.floor(random() * 18) + 10; // 10 to 27
    let currentOffset = 0;

    for (let i = 0; i < numFrags; i++) {
        const h = random() * 240 + 60;
        const gap = random() * 50 + 20;
        const alpha = maxAlpha * Math.pow(1 - (i / numFrags), 1.8);
        const bitPattern: boolean[] = [];
        if (type === 2) {
            for (let b = 0; b < 30; b++) {
                bitPattern.push(random() > 0.35);
            }
        }
        let hexCount = 0;
        if (type === 3) {
            hexCount = Math.floor(h / (width * 0.9)) + 1;
        }

        fragments.push({
            offset: currentOffset,
            h,
            alpha,
            isHead: i === 0,
            bits: bitPattern,
            hexCount
        });

        currentOffset += h + gap;
    }

    return {
        x,
        width,
        cycles,
        maxAlpha,
        glow,
        baseY,
        color,
        type,
        fragments
    };
}

// Strictly pre-generate deterministically outside render
for (let c = 0; c < COLUMNS; c++) {
    STREAMS_DATA.push(createStreamSpec(c, 0));
    
    if (random() > 0.55) {
        STREAMS_DATA.push(createStreamSpec(c, 1));
    }
    
    if (random() > 0.75) {
        STREAMS_DATA.push(createStreamSpec(c, 2));
    }
}

function drawHex(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, y);
    ctx.lineTo(x + width, y + height * 0.25);
    ctx.lineTo(x + width, y + height * 0.75);
    ctx.lineTo(x + width * 0.5, y + height);
    ctx.lineTo(x, y + height * 0.75);
    ctx.lineTo(x, y + height * 0.25);
    ctx.closePath();
    ctx.fill();
}

function renderStreamAt(ctx: CanvasRenderingContext2D, stream: StreamSpec, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);

    for (const f of stream.fragments) {
        const yDraw = -f.offset; 
        
        ctx.fillStyle = `rgba(${stream.color.r}, ${stream.color.g}, ${stream.color.b}, ${f.alpha})`;
        
        if (stream.glow > 0) {
            ctx.shadowBlur = f.isHead ? stream.glow : stream.glow * 0.5;
            ctx.shadowColor = `rgb(${stream.color.r}, ${stream.color.g}, ${stream.color.b})`;
            ctx.shadowOffsetX = f.isHead ? 2 : 1;
            ctx.shadowOffsetY = f.isHead ? 2 : 1;
        } else {
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        if (stream.type === 0) {
            ctx.fillRect(0, yDraw - f.h, stream.width, f.h);
        } 
        else if (stream.type === 1) {
            const dashHeight = 5;
            const space = 7;
            for (let dy = 0; dy < f.h; dy += dashHeight + space) {
                const actualH = Math.min(dashHeight, f.h - dy);
                ctx.fillRect(0, yDraw - dy - actualH, stream.width, actualH);
            }
        } 
        else if (stream.type === 2) {
            const laneW = (stream.width / 2) - 3;
            if (laneW > 3) {
                const cellH = laneW;
                const space = 4;
                let bitIndex = 0;
                for (let dy = 0; dy < f.h; dy += cellH + space) {
                    const actualH = Math.min(cellH, f.h - dy);
                    if (f.bits[bitIndex % f.bits.length]) {
                        ctx.fillRect(0, yDraw - dy - actualH, laneW, actualH);
                    }
                    if (f.bits[(bitIndex + 1) % f.bits.length]) {
                        ctx.fillRect(laneW + 6, yDraw - dy - actualH, laneW, actualH);
                    }
                    bitIndex += 2;
                }
            } else {
                ctx.fillRect(0, yDraw - f.h, stream.width, f.h);
            }
        }
        else if (stream.type === 3) {
            const hexW = stream.width;
            const hexH = hexW * 0.866;
            const space = hexH * 0.2;
            let yOffset = 0;
            for (let i = 0; i < f.hexCount; i++) {
                const drawY = yDraw - yOffset - hexH;
                if (drawY + hexH > yDraw - f.h) {
                    drawHex(ctx, 0, drawY, hexW, hexH);
                }
                yOffset += hexH + space;
            }
        }
    }
    ctx.restore();
}

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const CyberDataStreamOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Exactly 20 seconds loop (1200 frames at 60fps)
        const totalLoopFrames = fps * 20; 
        const localFrame = frame % totalLoopFrames;
        const t = localFrame / totalLoopFrames;

        ctx.globalCompositeOperation = 'source-over';

        // Draw deep cinematic gradient background with purple tint
        const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W);
        bgGrad.addColorStop(0, '#1A102A');
        bgGrad.addColorStop(1, '#050308');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Dot matrix overlay
        ctx.fillStyle = "rgba(50, 20, 80, 0.1)";
        for (let dx = 0; dx < W; dx += 64) {
            for (let dy = 0; dy < H; dy += 64) {
                ctx.fillRect(dx, dy, 2, 2);
            }
        }

        ctx.globalCompositeOperation = 'screen';

        for (const stream of STREAMS_DATA) {
            const yNorm = (stream.baseY + t * stream.cycles) % 1.0;
            const yBase = yNorm * H;

            renderStreamAt(ctx, stream, stream.x, yBase - H);
            renderStreamAt(ctx, stream, stream.x, yBase);
            renderStreamAt(ctx, stream, stream.x, yBase + H);
            renderStreamAt(ctx, stream, stream.x, yBase + (H * 2));
        }
    }, [frame, fps]);

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
                backgroundColor: '#050308',
            }}
        >
            <canvas
                ref={canvasRef}
                width={W}
                height={H}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                }}
            />
        </div>
    );
};

export default CyberDataStreamOverlay;
// END_OF_FILE