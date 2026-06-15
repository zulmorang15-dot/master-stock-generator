import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

const ORIGINAL_WIDTH = 3840;
const ORIGINAL_HEIGHT = 2160;
const COLUMNS = 140;
const COL_WIDTH = Math.floor(ORIGINAL_WIDTH / COLUMNS);

const COLORS = [
    { r: 255, g: 215, b: 0 },   // Luminous Gold
    { r: 75, g: 0, b: 130 },    // Deep Amethyst Purple
    { r: 255, g: 165, b: 0 },   // Amber Core Highlight
    { r: 180, g: 100, b: 240 }  // Violet Highlight
];

interface Fragment {
    offset: number;
    h: number;
    alpha: number;
    isHead: boolean;
    bits: boolean[];
    hexCount: number;
}

interface StreamConfig {
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

function drawHex(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
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

function createStream(c: number, depthLayer: number, rand: () => number): StreamConfig {
    let x = c * COL_WIDTH;
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
        cycles = Math.floor(rand() * 2) + 3; // 3 or 4
        maxAlpha = 1.0;
        glow = 40;
    }

    const baseY = rand();
    const color = COLORS[Math.floor(rand() * COLORS.length)];
    x += (COL_WIDTH - width) / 2;

    const type = Math.floor(rand() * 4);
    const fragments: Fragment[] = [];
    const numFrags = Math.floor(rand() * 18) + 10;
    let currentOffset = 0;

    for (let i = 0; i < numFrags; i++) {
        const h = rand() * 240 + 60;
        const gap = rand() * 50 + 20;
        const alpha = maxAlpha * Math.pow(1 - i / numFrags, 1.8);

        const bitPattern: boolean[] = [];
        if (type === 2) {
            for (let b = 0; b < 30; b++) {
                bitPattern.push(rand() > 0.35);
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
            hexCount,
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
        fragments,
    };
}

function renderAt(ctx: CanvasRenderingContext2D, s: StreamConfig, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    for (let i = 0; i < s.fragments.length; i++) {
        const f = s.fragments[i];
        const yDraw = -f.offset;

        ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${f.alpha})`;

        if (s.glow > 0) {
            ctx.shadowBlur = f.isHead ? s.glow : s.glow * 0.5;
            ctx.shadowColor = `rgb(${s.color.r}, ${s.color.g}, ${s.color.b})`;
            ctx.shadowOffsetX = f.isHead ? 2 : 1;
            ctx.shadowOffsetY = f.isHead ? 2 : 1;
        } else {
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        if (s.type === 0) {
            ctx.fillRect(0, yDraw - f.h, s.width, f.h);
        } else if (s.type === 1) {
            const dashHeight = 5;
            const space = 7;
            for (let dy = 0; dy < f.h; dy += dashHeight + space) {
                const actualH = Math.min(dashHeight, f.h - dy);
                ctx.fillRect(0, yDraw - dy - actualH, s.width, actualH);
            }
        } else if (s.type === 2) {
            const laneW = (s.width / 2) - 3;
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
                ctx.fillRect(0, yDraw - f.h, s.width, f.h);
            }
        } else if (s.type === 3) {
            const hexW = s.width;
            const hexH = hexW * 0.866;
            const space = hexH * 0.2;
            let yOffset = 0;
            for (let hi = 0; hi < f.hexCount; hi++) {
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

export const LuminousDataStream: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { width, height, durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Precalculate deterministic stream layout based on seeded LGC PRNG
    const streams = useMemo(() => {
        let seed = 98765;
        const rand = (): number => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        const tempStreams: StreamConfig[] = [];
        for (let c = 0; c < COLUMNS; c++) {
            // Layer 0
            tempStreams.push(createStream(c, 0, rand));

            // Layer 1 (45% chance)
            if (rand() > 0.55) {
                tempStreams.push(createStream(c, 1, rand));
            }

            // Layer 2 (25% chance)
            if (rand() > 0.75) {
                tempStreams.push(createStream(c, 2, rand));
            }
        }
        return tempStreams;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
        if (!ctx) return;

        // Strictly normalize time t (0.0 to 1.0) based on frame and duration
        const t = frame / durationInFrames;

        // Reset composite mode to draw background
        ctx.globalCompositeOperation = 'source-over';

        // Draw deep cinematic gradient background with purple tint
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

        // Dot matrix overlay
        ctx.fillStyle = "rgba(50, 20, 80, 0.1)";
        for (let dx = 0; dx < ORIGINAL_WIDTH; dx += 64) {
            for (let dy = 0; dy < ORIGINAL_HEIGHT; dy += 64) {
                ctx.fillRect(dx, dy, 2, 2);
            }
        }

        // Set screen mode for vibrant glow
        ctx.globalCompositeOperation = 'screen';

        // Draw all data streams
        for (let i = 0; i < streams.length; i++) {
            const s = streams[i];
            const yNorm = (s.baseY + t * s.cycles) % 1.0;
            const yBase = yNorm * ORIGINAL_HEIGHT;

            // Render wraps for seamless loop animation
            renderAt(ctx, s, s.x, yBase - ORIGINAL_HEIGHT);
            renderAt(ctx, s, s.x, yBase);
            renderAt(ctx, s, s.x, yBase + ORIGINAL_HEIGHT);
            renderAt(ctx, s, s.x, yBase + (ORIGINAL_HEIGHT * 2));
        }
    }, [frame, durationInFrames, streams]);

    const wrapperStyle: React.CSSProperties = {
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#050308',
    };

    return (
        <div style={wrapperStyle}>
            <canvas
                ref={canvasRef}
                width={ORIGINAL_WIDTH}
                height={ORIGINAL_HEIGHT}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                }}
            />
        </div>
    );
};

export default LuminousDataStream;
// END_OF_FILE