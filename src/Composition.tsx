import React, { useRef, useEffect } from 'react';
import { useVideoConfig, useCurrentFrame } from 'remotion';

// Strict 4K Dimensions
const ORIGINAL_WIDTH = 3840;
const ORIGINAL_HEIGHT = 2160;

const W = ORIGINAL_WIDTH;
const H = ORIGINAL_HEIGHT;

// System Configuration
const COLUMNS = 140; 
const COL_WIDTH = Math.floor(W / COLUMNS); // ~27px

// Premium Luminous Color Palette
const COLORS = [
    { r: 255, g: 215, b: 0 },   // Luminous Gold
    { r: 75, g: 0, b: 130 },    // Deep Amethyst Purple
    { r: 255, g: 165, b: 0 },   // Amber Core Highlight
    { r: 180, g: 100, b: 240 }  // Violet Highlight
];

// Seeded random helper to ensure deterministic generation
let seed = 987654321;
function deterministicRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

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
    width: number;
    cycles: number;
    maxAlpha: number;
    glow: number;
    baseY: number;
    color: { r: number; g: number; b: number };
    type: number;
    fragments: Fragment[];
}

// Pre-calculate all stream details statically outside the render tree to prevent frame-tearing
const STREAMS: StreamConfig[] = [];

function createStreamConfig(colIndex: number, depthLayer: number): StreamConfig {
    let width = 0;
    let cycles = 0;
    let maxAlpha = 0;
    let glow = 0;

    if (depthLayer === 0) {
        width = COL_WIDTH * 0.25; // 6.75px
        cycles = 1;               // 1 full screen drop per 10s
        maxAlpha = 0.2;          // Very faint
        glow = 1;
    } else if (depthLayer === 1) {
        width = COL_WIDTH * 0.5;  // 13.5px
        cycles = 2;               // 2 drops per 10s
        maxAlpha = 0.5;           // Medium
        glow = 10;
    } else {
        width = COL_WIDTH * 0.8;  // ~21px
        cycles = Math.floor(deterministicRandom() * 2) + 3; // 3 or 4 drops per 10s
        maxAlpha = 1.0;           // Bright
        glow = 40;                // Intense radiant glow
    }

    const baseY = deterministicRandom(); 
    const color = COLORS[Math.floor(deterministicRandom() * COLORS.length)];
    
    let x = colIndex * COL_WIDTH + (COL_WIDTH - width) / 2;
    const type = Math.floor(deterministicRandom() * 4);

    const fragments: Fragment[] = [];
    const numFrags = Math.floor(deterministicRandom() * 18) + 10; // 10 to 28 fragments per stream
    let currentOffset = 0;

    for (let i = 0; i < numFrags; i++) {
        const h = deterministicRandom() * 240 + 60; // Height of this block (60px to 300px)
        const gap = deterministicRandom() * 50 + 20; // Gap before next block
        
        // Opacity decays the further up the tail it goes
        const alpha = maxAlpha * Math.pow(1 - (i / numFrags), 1.8); 
        
        // Pre-calculate randomized parameters
        const bitPattern: boolean[] = [];
        if (type === 2) {
            for (let b = 0; b < 30; b++) {
                bitPattern.push(deterministicRandom() > 0.35); 
            }
        }
        
        let hexCount = 0;
        if (type === 3) {
            hexCount = Math.floor(h / (width * 0.9)) + 1; // Fit hexagons along height
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

// Generate streams across columns, stratified by depth layers
for (let c = 0; c < COLUMNS; c++) {
    // Every column gets a slow background stream
    STREAMS.push(createStreamConfig(c, 0));
    
    // 45% chance for a midground stream
    if (deterministicRandom() > 0.55) {
        STREAMS.push(createStreamConfig(c, 1));
    }
    
    // 25% chance for an intense, fast foreground stream
    if (deterministicRandom() > 0.75) {
        STREAMS.push(createStreamConfig(c, 2));
    }
}

// Hexagon utility
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

function renderAt(ctx: CanvasRenderingContext2D, s: StreamConfig, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);

    for (let f of s.fragments) {
        let yDraw = -f.offset; 
        
        // Set color and dynamic opacity
        ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${f.alpha})`;
        
        // Apply radiant glow effect, strongest on the head
        if (s.glow > 0) {
            ctx.shadowBlur = f.isHead ? s.glow : s.glow * 0.5;
            ctx.shadowColor = `rgb(${s.color.r}, ${s.color.g}, ${s.color.b})`;
            // Add a small offset to the shadow for extra depth
            ctx.shadowOffsetX = f.isHead ? 2 : 1;
            ctx.shadowOffsetY = f.isHead ? 2 : 1;
        } else {
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Render Geometric Abstract Data based on Type
        if (s.type === 0) {
            // TYPE 0: Solid Cryptographic Blocks
            ctx.fillRect(0, yDraw - f.h, s.width, f.h);
        } 
        else if (s.type === 1) {
            // TYPE 1: Horizontal Barcode Dashes
            let dashHeight = 5;
            let space = 7;
            for (let dy = 0; dy < f.h; dy += dashHeight + space) {
                let actualH = Math.min(dashHeight, f.h - dy);
                ctx.fillRect(0, yDraw - dy - actualH, s.width, actualH);
            }
        } 
        else if (s.type === 2) {
            // TYPE 2: Dual-lane Micro-Grid Packets
            let laneW = (s.width / 2) - 3;
            if (laneW > 3) {
                let cellH = laneW;
                let space = 4;
                let bitIndex = 0;
                for (let dy = 0; dy < f.h; dy += cellH + space) {
                    let actualH = Math.min(cellH, f.h - dy);
                    // Left Lane
                    if (f.bits[bitIndex % f.bits.length]) {
                        ctx.fillRect(0, yDraw - dy - actualH, laneW, actualH);
                    }
                    // Right Lane
                    if (f.bits[(bitIndex + 1) % f.bits.length]) {
                        ctx.fillRect(laneW + 6, yDraw - dy - actualH, laneW, actualH);
                    }
                    bitIndex += 2;
                }
            } else {
                ctx.fillRect(0, yDraw - f.h, s.width, f.h);
            }
        }
        else if (s.type === 3) {
            // TYPE 3: Hexagonal Core Packets
            let hexW = s.width;
            let hexH = hexW * 0.866; // Standard hexagon aspect ratio
            let space = hexH * 0.2;
            let yOffset = 0;
            for (let i = 0; i < f.hexCount; i++) {
                let drawY = yDraw - yOffset - hexH;
                if (drawY + hexH > yDraw - f.h) {
                    drawHex(ctx, 0, drawY, hexW, hexH);
                }
                yOffset += hexH + space;
            }
        }
    }
    ctx.restore();
}

function drawStream(ctx: CanvasRenderingContext2D, s: StreamConfig, t: number) {
    // Calculate the true normalized Y based on loop progress and speed multiplier
    let yNorm = (s.baseY + t * s.cycles) % 1.0;
    let yBase = yNorm * H;

    // Draw multiple vertical copies for the seamless wrapping
    renderAt(ctx, s, s.x, yBase - H);
    renderAt(ctx, s, s.x, yBase);
    renderAt(ctx, s, s.x, yBase + H);
    renderAt(ctx, s, s.x, yBase + (H * 2));
}

export const CyberDataStream: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { width, height, fps } = useVideoConfig();
    const frame = useCurrentFrame();

    // Responsive adaptation wrapper styling
    const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Loop cycles seamlessly every 10 seconds (based on fps)
        const loopDurationInFrames = fps * 10;
        const t = (frame % loopDurationInFrames) / loopDurationInFrames;

        // Reset composite mode to draw background
        ctx.globalCompositeOperation = 'source-over';

        // Draw deep cinematic gradient background with purple tint
        const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W);
        bgGrad.addColorStop(0, '#1A102A'); // Lighter purple center
        bgGrad.addColorStop(1, '#050308'); // Dark, purple-black edges
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Add visual micro-grid dot overlay to the background
        ctx.fillStyle = "rgba(50, 20, 80, 0.1)";
        for (let dx = 0; dx < W; dx += 64) {
            for (let dy = 0; dy < H; dy += 64) {
                ctx.fillRect(dx, dy, 2, 2);
            }
        }

        // Set composite mode to Screen for beautiful dynamic neon bloom layering
        ctx.globalCompositeOperation = 'screen';

        // Render all pre-computed streams
        for (let i = 0; i < STREAMS.length; i++) {
            drawStream(ctx, STREAMS[i], t);
        }
    }, [frame, fps]);

    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: '#050308',
        position: 'relative',
        overflow: 'hidden',
    };

    const wrapperStyle: React.CSSProperties = {
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
    };

    return (
        <div style={containerStyle}>
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
        </div>
    );
};

export default CyberDataStream;
// END_OF_FILE