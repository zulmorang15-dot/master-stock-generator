import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

// Strict 4K Dimensions
const ORIGINAL_WIDTH = 3840;
const ORIGINAL_HEIGHT = 2160;
const COLUMNS = 140;
const COL_WIDTH = Math.floor(ORIGINAL_WIDTH / COLUMNS); // ~27px

// Premium Luminous Color Palette (RGB for dynamic opacity control)
const COLORS = [
    { r: 255, g: 215, b: 0 },   // Luminous Gold
    { r: 75, g: 0, b: 130 },    // Deep Amethyst Purple
    { r: 255, g: 165, b: 0 },   // Amber Core Highlight
    { r: 180, g: 100, b: 240 }  // Violet Highlight
];

// Seed-based Deterministic Random Generator (LCG)
// Ensures reproducible visual state during frame-by-frame renders
function createDeterministicRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

const rand = createDeterministicRandom(10139);

interface Fragment {
    offset: number;
    h: number;
    alpha: number;
    isHead: boolean;
    bits: boolean[];
    hexCount: number;
}

interface StreamInfo {
    x: number;
    depthLayer: number;
    width: number;
    cycles: number;
    maxAlpha: number;
    glow: number;
    baseY: number;
    color: { r: number; g: number; b: number };
    type: number;
    fragments: Fragment[];
}

// Generate the static layout configurations outside the render scope to keep drawing deterministic
const STREAMS_DATA: StreamInfo[] = [];

function generateStream(colIndex: number, depthLayer: number, nextRand: () => number): StreamInfo {
    let x = colIndex * COL_WIDTH;
    let width = 0;
    let cycles = 0;
    let maxAlpha = 0;
    let glow = 0;

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
        cycles = Math.floor(nextRand() * 2) + 3; // 3 or 4
        maxAlpha = 1.0;
        glow = 40;
    }

    const baseY = nextRand();
    const color = COLORS[Math.floor(nextRand() * COLORS.length)];
    x += (COL_WIDTH - width) / 2;

    const type = Math.floor(nextRand() * 4);
    const fragments: Fragment[] = [];
    const numFrags = Math.floor(nextRand() * 18) + 10; // 10 to 28
    let currentOffset = 0;

    for (let i = 0; i < numFrags; i++) {
        const h = nextRand() * 240 + 60;
        const gap = nextRand() * 50 + 20;
        const alpha = maxAlpha * Math.pow(1 - (i / numFrags), 1.8);

        const bits: boolean[] = [];
        if (type === 2) {
            for (let b = 0; b < 30; b++) {
                bits.push(nextRand() > 0.35);
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
            bits,
            hexCount
        });

        currentOffset += h + gap;
    }

    return {
        x,
        depthLayer,
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

// Populate deterministic streams
for (let c = 0; c < COLUMNS; c++) {
    // Background Layer
    STREAMS_DATA.push(generateStream(c, 0, rand));

    // Midground Layer (45% probability)
    if (rand() > 0.55) {
        STREAMS_DATA.push(generateStream(c, 1, rand));
    }

    // Foreground Layer (25% probability)
    if (rand() > 0.75) {
        STREAMS_DATA.push(generateStream(c, 2, rand));
    }
}

// Draw a single perfect hexagon
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

// Render data streams into canvas viewport coordinates
function renderStreamAt(ctx: CanvasRenderingContext2D, stream: StreamInfo, x: number, y: number) {
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
        } else if (stream.type === 1) {
            const dashHeight = 5;
            const space = 7;
            for (let dy = 0; dy < f.h; dy += dashHeight + space) {
                const actualH = Math.min(dashHeight, f.h - dy);
                ctx.fillRect(0, yDraw - dy - actualH, stream.width, actualH);
            }
        } else if (stream.type === 2) {
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
        } else if (stream.type === 3) {
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

export const CyberDataStreamOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    // Scale dynamically to fill outer container with 16:9 ratio
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Reset composition & render deep background
        ctx.globalCompositeOperation = 'source-over';

        const bgGrad = ctx.createRadialGradient(
            ORIGINAL_WIDTH / 2,
            ORIGINAL_HEIGHT / 2,
            0,
            ORIGINAL_WIDTH / 2,
            ORIGINAL_HEIGHT / 2,
            ORIGINAL_WIDTH
        );
        bgGrad.addColorStop(0, '#1A102A');
        bgGrad.addColorStop(1, '#050308');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

        // Dot Matrix Background Pattern Overlay
        ctx.fillStyle = 'rgba(50, 20, 80, 0.1)';
        for (let dx = 0; dx < ORIGINAL_WIDTH; dx += 64) {
            for (let dy = 0; dy < ORIGINAL_HEIGHT; dy += 64) {
                ctx.fillRect(dx, dy, 2, 2);
            }
        }

        // Composite Mode Screen for Luminous Visual Glows
        ctx.globalCompositeOperation = 'screen';

        // Map looping state deterministically over 10 seconds cycles (600 frames at 60fps)
        // Loops perfectly twice across a 20-second (1200 frames) total composition duration
        const t = (frame % 600) / 600;

        for (const stream of STREAMS_DATA) {
            const yNorm = (stream.baseY + t * stream.cycles) % 1.0;
            const yBase = yNorm * ORIGINAL_HEIGHT;

            // Quad-draw vertical stack offsets to enable flawless infinite boundary transitions
            renderStreamAt(ctx, stream, stream.x, yBase - ORIGINAL_HEIGHT);
            renderStreamAt(ctx, stream, stream.x, yBase);
            renderStreamAt(ctx, stream, stream.x, yBase + ORIGINAL_HEIGHT);
            renderStreamAt(ctx, stream, stream.x, yBase + (ORIGINAL_HEIGHT * 2));
        }
    }, [frame]);

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
                width={ORIGINAL_WIDTH}
                height={ORIGINAL_HEIGHT}
                style={{
                    display: 'block',
                    width: ORIGINAL_WIDTH,
                    height: ORIGINAL_HEIGHT,
                }}
            />
        </div>
    );
};

export default CyberDataStreamOverlay;
// END_OF_FILE