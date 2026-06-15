import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

const ORIGINAL_WIDTH = 3840;
const ORIGINAL_HEIGHT = 2160;

interface Fragment {
    offset: number;
    h: number;
    alpha: number;
    isHead: boolean;
    bits: boolean[];
    hexCount: number;
}

interface StreamData {
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

function createStreamData(
    colIndex: number, 
    depthLayer: number, 
    colWidth: number, 
    colors: Array<{ r: number; g: number; b: number }>, 
    rnd: () => number
): StreamData {
    let x = colIndex * colWidth;
    let width = 0;
    let cycles = 0;
    let maxAlpha = 0;
    let glow = 0;

    if (depthLayer === 0) {
        width = colWidth * 0.25;
        cycles = 1;
        maxAlpha = 0.2;
        glow = 1;
    } else if (depthLayer === 1) {
        width = colWidth * 0.5;
        cycles = 2;
        maxAlpha = 0.5;
        glow = 10;
    } else {
        width = colWidth * 0.8;
        cycles = Math.floor(rnd() * 2) + 3; // 3 or 4
        maxAlpha = 1.0;
        glow = 40;
    }

    const baseY = rnd();
    const color = colors[Math.floor(rnd() * colors.length)];
    x += (colWidth - width) / 2;
    const type = Math.floor(rnd() * 4);

    const fragments: Fragment[] = [];
    const numFrags = Math.floor(rnd() * 18) + 10;
    let currentOffset = 0;

    for (let i = 0; i < numFrags; i++) {
        const h = rnd() * 240 + 60;
        const gap = rnd() * 50 + 20;
        const alpha = maxAlpha * Math.pow(1 - (i / numFrags), 1.8);

        const bitPattern: boolean[] = [];
        if (type === 2) {
            for (let b = 0; b < 30; b++) {
                bitPattern.push(rnd() > 0.35);
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

const CyberDataStream: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    // Deterministic stream generator utilizing seeded PRNG
    const streams = useMemo(() => {
        const tempStreams: StreamData[] = [];
        let seed = 987654321;
        const rnd = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        const COLUMNS = 140;
        const COL_WIDTH = Math.floor(ORIGINAL_WIDTH / COLUMNS);
        const COLORS = [
            { r: 255, g: 215, b: 0 },   // Luminous Gold
            { r: 75, g: 0, b: 130 },    // Deep Amethyst Purple
            { r: 255, g: 165, b: 0 },   // Amber Core Highlight
            { r: 180, g: 100, b: 240 }  // Violet Highlight
        ];

        for (let c = 0; c < COLUMNS; c++) {
            // Every column gets a slow background stream
            tempStreams.push(createStreamData(c, 0, COL_WIDTH, COLORS, rnd));

            // 45% chance for a midground stream
            if (rnd() > 0.55) {
                tempStreams.push(createStreamData(c, 1, COL_WIDTH, COLORS, rnd));
            }

            // 25% chance for an intense, fast foreground stream
            if (rnd() > 0.75) {
                tempStreams.push(createStreamData(c, 2, COL_WIDTH, COLORS, rnd));
            }
        }
        return tempStreams;
    }, []);

    const drawHex = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y);
        ctx.lineTo(x + w, y + h * 0.25);
        ctx.lineTo(x + w, y + h * 0.75);
        ctx.lineTo(x + w * 0.5, y + h);
        ctx.lineTo(x, y + h * 0.75);
        ctx.lineTo(x, y + h * 0.25);
        ctx.closePath();
        ctx.fill();
    };

    const renderAt = (ctx: CanvasRenderingContext2D, stream: StreamData, x: number, y: number) => {
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
    };

    const drawStream = (ctx: CanvasRenderingContext2D, stream: StreamData, t: number) => {
        const yNorm = (stream.baseY + t * stream.cycles) % 1.0;
        const yBase = yNorm * ORIGINAL_HEIGHT;

        renderAt(ctx, stream, stream.x, yBase - ORIGINAL_HEIGHT);
        renderAt(ctx, stream, stream.x, yBase);
        renderAt(ctx, stream, stream.x, yBase + ORIGINAL_HEIGHT);
        renderAt(ctx, stream, stream.x, yBase + (ORIGINAL_HEIGHT * 2));
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Perfectly seamless looping time parameter
        const t = (frame % (fps * 10)) / (fps * 10);

        ctx.globalCompositeOperation = 'source-over';

        // Deep purple cinematic background
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

        // Dot matrix background overlay
        ctx.fillStyle = "rgba(50, 20, 80, 0.1)";
        for (let dx = 0; dx < ORIGINAL_WIDTH; dx += 64) {
            for (let dy = 0; dy < ORIGINAL_HEIGHT; dy += 64) {
                ctx.fillRect(dx, dy, 2, 2);
            }
        }

        ctx.globalCompositeOperation = 'screen';

        for (let i = 0; i < streams.length; i++) {
            drawStream(ctx, streams[i], t);
        }
    }, [frame, fps, streams]);

    const containerStyle: React.CSSProperties = {
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
        <div style={containerStyle}>
            <canvas 
                ref={canvasRef} 
                width={ORIGINAL_WIDTH} 
                height={ORIGINAL_HEIGHT} 
                style={{ display: 'block' }}
            />
        </div>
    );
};

export default CyberDataStream;
// END_OF_FILE