import React, { useRef, useEffect, useMemo } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

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

interface StreamData {
    x: number;
    width: number;
    cycles: number;
    maxAlpha: number;
    glow: number;
    baseY: number;
    color: { r: number, g: number, b: number };
    type: number;
    fragments: Fragment[];
}

const drawHex = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.beginPath();
    ctx.moveTo(x + width * 0.5, y);
    ctx.lineTo(x + width, y + height * 0.25);
    ctx.lineTo(x + width, y + height * 0.75);
    ctx.lineTo(x + width * 0.5, y + height);
    ctx.lineTo(x, y + height * 0.75);
    ctx.lineTo(x, y + height * 0.25);
    ctx.closePath();
    ctx.fill();
};

const drawGlowRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, g: number, b: number, alpha: number) => {
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`;
    ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.35})`;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
};

const renderStreamAt = (ctx: CanvasRenderingContext2D, s: StreamData, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);

    s.fragments.forEach((f: Fragment) => {
        const yDraw = -f.offset;
        const r = s.color.r;
        const g = s.color.g;
        const b = s.color.b;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${f.alpha})`;

        if (s.type === 0) {
            if (s.glow > 0 && f.isHead) {
                drawGlowRect(ctx, 0, yDraw - f.h, s.width, f.h, r, g, b, f.alpha);
            }
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${f.alpha})`;
            ctx.fillRect(0, yDraw - f.h, s.width, f.h);
        } 
        else if (s.type === 1) {
            const dashHeight = 5;
            const space = 7;
            for (let dy = 0; dy < f.h; dy += dashHeight + space) {
                const actualH = Math.min(dashHeight, f.h - dy);
                const drawY = yDraw - dy - actualH;
                if (s.glow > 0 && f.isHead) {
                    drawGlowRect(ctx, 0, drawY, s.width, actualH, r, g, b, f.alpha);
                }
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${f.alpha})`;
                ctx.fillRect(0, drawY, s.width, actualH);
            }
        } 
        else if (s.type === 2) {
            const laneW = (s.width / 2) - 3;
            if (laneW > 3) {
                const cellH = laneW;
                const space = 4;
                let bitIndex = 0;
                for (let dy = 0; dy < f.h; dy += cellH + space) {
                    const actualH = Math.min(cellH, f.h - dy);
                    const drawY = yDraw - dy - actualH;
                    
                    if (f.bits[bitIndex % f.bits.length]) {
                        if (s.glow > 0 && f.isHead) {
                            drawGlowRect(ctx, 0, drawY, laneW, actualH, r, g, b, f.alpha);
                        }
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${f.alpha})`;
                        ctx.fillRect(0, drawY, laneW, actualH);
                    }
                    
                    if (f.bits[(bitIndex + 1) % f.bits.length]) {
                        if (s.glow > 0 && f.isHead) {
                            drawGlowRect(ctx, laneW + 6, drawY, laneW, actualH, r, g, b, f.alpha);
                        }
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${f.alpha})`;
                        ctx.fillRect(laneW + 6, drawY, laneW, actualH);
                    }
                    bitIndex += 2;
                }
            } else {
                if (s.glow > 0 && f.isHead) {
                    drawGlowRect(ctx, 0, yDraw - f.h, s.width, f.h, r, g, b, f.alpha);
                }
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${f.alpha})`;
                ctx.fillRect(0, yDraw - f.h, s.width, f.h);
            }
        } 
        else if (s.type === 3) {
            const hexW = s.width;
            const hexH = hexW * 0.866;
            const space = hexH * 0.2;
            let yOffset = 0;
            for (let i = 0; i < f.hexCount; i++) {
                const drawY = yDraw - yOffset - hexH;
                if (drawY + hexH > yDraw - f.h) {
                    if (s.glow > 0 && f.isHead) {
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${f.alpha * 0.15})`;
                        drawHex(ctx, -2, drawY - 2, hexW + 4, hexH + 4);
                    }
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${f.alpha})`;
                    drawHex(ctx, 0, drawY, hexW, hexH);
                }
                yOffset += hexH + space;
            }
        }
    });

    ctx.restore();
};

const drawStream = (ctx: CanvasRenderingContext2D, s: StreamData, t: number, H: number) => {
    const yNorm = (s.baseY + t * s.cycles) % 1.0;
    const yBase = yNorm * H;

    renderStreamAt(ctx, s, s.x, yBase - H);
    renderStreamAt(ctx, s, s.x, yBase);
    renderStreamAt(ctx, s, s.x, yBase + H);
    renderStreamAt(ctx, s, s.x, yBase + (H * 2));
};

export const PremiumCyberDataStream: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    const columns = 90; 
    const colWidth = Math.floor(ORIGINAL_WIDTH / columns);

    const streams = useMemo<StreamData[]>(() => {
        const list: StreamData[] = [];
        let seed = 98765;
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        for (let c = 0; c < columns; c++) {
            const layers = [0];
            if (random() > 0.55) layers.push(1);
            if (random() > 0.75) layers.push(2);

            layers.forEach((depthLayer: number) => {
                let streamWidth = 0;
                let cycles = 1;
                let maxAlpha = 0.2;
                let glow = 0;

                if (depthLayer === 0) {
                    streamWidth = colWidth * 0.25;
                    cycles = 1; 
                    maxAlpha = 0.15;
                    glow = 0;
                } else if (depthLayer === 1) {
                    streamWidth = colWidth * 0.5;
                    cycles = 2;
                    maxAlpha = 0.45;
                    glow = 4;
                } else {
                    streamWidth = colWidth * 0.8;
                    cycles = Math.floor(random() * 2) + 3; 
                    maxAlpha = 0.95;
                    glow = 12;
                }

                const baseY = random();
                const colorIndex = Math.floor(random() * COLORS.length);
                const color = COLORS[colorIndex];
                let x = c * colWidth + (colWidth - streamWidth) / 2;

                const type = Math.floor(random() * 4); 
                const fragments: Fragment[] = [];
                const numFrags = Math.floor(random() * 14) + 8; 
                let currentOffset = 0;

                for (let i = 0; i < numFrags; i++) {
                    const h = random() * 120 + 30; 
                    const gap = random() * 25 + 10;
                    const alpha = maxAlpha * Math.pow(1 - (i / numFrags), 1.8);

                    const bits: boolean[] = [];
                    if (type === 2) {
                        for (let b = 0; b < 20; b++) {
                            bits.push(random() > 0.35);
                        }
                    }

                    let hexCount = 0;
                    if (type === 3) {
                        hexCount = Math.floor(h / (streamWidth * 0.9)) + 1;
                    }

                    fragments.push({
                        offset: currentOffset,
                        h,
                        alpha,
                        isHead: i === 0,
                        bits,
                        hexCount,
                    });

                    currentOffset += h + gap;
                }

                list.push({
                    x,
                    width: streamWidth,
                    cycles,
                    maxAlpha,
                    glow,
                    baseY,
                    color,
                    type,
                    fragments,
                });
            });
        }
        return list;
    }, [colWidth, columns]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
        if (!ctx) return;

        const cycleDuration = 10; 
        const totalFramesPerCycle = fps * cycleDuration;
        const currentCycleFrame = frame % totalFramesPerCycle;
        const t = currentCycleFrame / totalFramesPerCycle; 

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

        ctx.fillStyle = "rgba(50, 20, 80, 0.08)";
        for (let dx = 0; dx < ORIGINAL_WIDTH; dx += 64) {
            for (let dy = 0; dy < ORIGINAL_HEIGHT; dy += 64) {
                ctx.fillRect(dx, dy, 2, 2);
            }
        }

        ctx.globalCompositeOperation = 'screen';

        streams.forEach((s: StreamData) => {
            drawStream(ctx, s, t, ORIGINAL_HEIGHT);
        });

    }, [frame, fps, streams]);

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
        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#050308' }}>
            <div style={wrapperStyle}>
                <canvas
                    ref={canvasRef}
                    width={ORIGINAL_WIDTH}
                    height={ORIGINAL_HEIGHT}
                    style={{ display: 'block', width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
};

export default PremiumCyberDataStream;
// END_OF_FILE