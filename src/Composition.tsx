The user wants a Remotion component that replicates the provided HTML/JS/Three.js/GSAP scene.
Key constraints:
1.  **Single .tsx file**, starting with the mandatory import line.
2.  **No external libs** (Three.js, GSAP, React import). Must re-implement logic natively in Remotion/React.
3.  **Frame-locked rendering**: Use `useCurrentFrame`, `interpolate`, `Easing`. No `Date.now`, `Math.random` in render, `setInterval`, CSS animations.
4.  **4K Auto-Fit**: `ORIGINAL_WIDTH=1920`, `ORIGINAL_HEIGHT=1080`, scale factor logic.
5.  **Seamless Looping**: LCM of cycles, capped at 15s. Symmetrical interpolation.
6.  **Dynamic Text**: `getInputProps` for title/keywords.
7.  **Visual Parity**: Must look like the HTML output (dark bg, video cards with sweeps, center subscribe rings, Three.js background: floor, grid, rings, particles, lights, camera move).

**Major Challenge**: The original uses Three.js for a 3D background. Remotion runs in a headless Chrome (Puppeteer). We *can* use Three.js inside Remotion if we bundle it, but the prompt says: "Do NOT import from 'three', 'gsap', or any external library." and "NEVER add any import other than the single remotion import line above."

This means I must **re-implement the 3D scene using pure CSS/HTML/Canvas 2D or SVG** inside the Remotion component, simulating the 3D look (floor, grid, rings, particles, lights) with 2D transforms and canvas drawing, OR use a `<canvas>` element and draw the 3D scene manually using Canvas 2D API (software rendering) frame-by-frame.

Given the complexity of the Three.js scene (perspective camera, moving lights, floor reflection, particles, rings), a full software rasterizer in JS inside a Remotion component is extremely heavy and prone to timeout/performance issues in Puppeteer.

However, the prompt says: "The visual output must be a 1:1 mirror of the original HTML, but entirely re-engineered for frame-locked rendering." and "Do NOT import from 'three'".

Strategy: **Simulate the 3D background using layered 2D elements (CSS transforms, Canvas 2D for particles/grid) and Remotion interpolation.** This is the only way to satisfy "No external imports" and "Frame-locked".

**Scene Breakdown & Remotion Implementation Plan:**

1.  **Container**: 1920x1080, scaled to fit viewport (handled by Remotion root usually, but we apply scale factor to wrapper).
2.  **Background Gradient**: Radial gradient (CSS).
3.  **3D Floor/Grid Simulation**:
    *   Floor: A large div with perspective transform (`rotateX`), gradient simulating reflectivity.
    *   Grid: Canvas 2D drawing lines in perspective, animated scrolling.
4.  **Holographic Rings**: 3 Rings. SVG or Canvas circles, scaled/positioned in "3D" (Y position + scale = depth), rotating Z, floating Y.
5.  **Particles**: 1200 particles. Pre-calculate positions/speeds in `static const` array. Render via Canvas 2D (single canvas, clear/draw each frame) for performance. Additive blending via `globalCompositeOperation='lighter'`.
6.  **Lights (Floor Highlights)**: Simulated as large radial gradients (divs or canvas) moving on the "floor" plane.
7.  **Camera Parallax**: Simulated by translating the entire "3D background group" (floor, grid, rings, particles, lights) slightly opposite to camera movement.
8.  **UI Layer (Video Cards, Subscribe Zone)**: Standard React divs with Remotion-driven animations (floating, sweeps, ring rotations, pulse).
9.  **Loop Duration Calculation**:
    *   Card Float: 4s (GSAP yoyo 4s -> 8s full cycle? No, GSAP `duration: 4, yoyo: true, repeat: -1` means 4s up, 4s down = 8s cycle).
    *   Sub Zone Float: 3.5s * 2 = 7s cycle.
    *   Sweep Left: 6s.
    *   Sweep Right: 6s (delay 3s).
    *   Ring Outer Rot: 15s.
    *   Ring Middle Rot: 20s.
    *   Ring Inner Rot: 10s (alternate -> 20s cycle).
    *   Pulse: 4s.
    *   Blue Light: 8s * 2 = 16s.
    *   White Light: 10s * 2 = 20s.
    *   Camera X: 12s * 2 = 24s.
    *   Look Target: 10s * 2 = 20s.
    *   Rings Rot Z: Continuous (0.1, 0.15, 0.2 rad/s). Periods: ~62s, ~41s, ~31s.
    *   Rings Float Y: Sin(time). Period ~6s.
    *   Particles: Continuous drift.

    **LCM Strategy**: Cap at 15s (Requirement 5: "Duration Cap: Between 5 and 15 seconds MAX. Use LCM of all animation cycles. Cap at 15s max.").
    Since exact LCM of all these (8, 7, 6, 15, 20, 20, 4, 16, 20, 24, 20...) is huge, we **must** normalize/adjust cycle durations to fit a common loop duration <= 15s.
    Let's pick **12 seconds (12s)** as the master loop duration. It divides well by 4, 6, 3, 12.
    We will map all animations to fit within 12s (or 10s, or 12s).
    *   Card Float: 4s up/down -> 8s cycle. Fit to 12s? Speed up slightly to 6s cycle (3s up, 3s down). Or 4s cycle (2s up, 2s down). Let's use **4s cycle** (2s up, 2s down) for cards. **6s cycle** for sub-zone (3s up, 3s down).
    *   Sweep: 6s cycle. Perfect.
    *   Rings Rot: Outer 15s -> speed up to 12s (or 6s, 4s, 3s). Middle 20s -> 12s. Inner 20s (alt) -> 12s.
    *   Pulse: 4s -> 4s (fits 12s).
    *   Lights/Camera: Speed up to 12s cycle.
    *   Particles: Loop height in 12s.

    **Decision**: Master Loop = **12 Seconds** (FPS * 12 frames).
    `const DURATION_IN_FRAMES = fps * 12;`
    `const localFrame = frame % DURATION_IN_FRAMES;`

10. **Pre-calculation**:
    *   Particles: 1200 items. `x, y, z, speedY, driftPhase, size, opacity`. Static const array.
    *   Rings: 3 items. Initial Y, Scale, RotSpeed, FloatAmp.
    *   Lights: Paths pre-calculated.

11. **Canvas 2D Rendering**:
    *   Use a `<canvas ref={canvasRef} width={1920} height={1080}>`.
    *   `useEffect` or render-phase drawing? Remotion renders frame by frame. Drawing must happen **during render** (synchronous) or via `useMemo`/`useEffect` with frame dependency.
    *   Best practice in Remotion for Canvas: Draw inside the component body (synchronous) using `useCurrentFrame` to get props, or use a `Canvas` component that takes `frame` as prop and draws in `useLayoutEffect` / `useEffect`. But Remotion docs recommend drawing in a `useEffect` with `frame` dependency, or using the `<Canvas>` component from `@remotion/canvas` (banned import).
    *   **Alternative**: Render particles/rings/grid as **DOM elements** (divs) for simplicity? 1200 divs = bad performance. 3 rings = fine. Grid lines = many divs.
    *   **Best Compromise**: Use a single `<canvas>` for the "Three.js Background" layer (Grid, Particles, Rings, Lights, Floor). Draw it **synchronously in the render phase** using a ref and `useCurrentFrame`. Remotion executes the component function for every frame. We can grab the canvas context and draw immediately. This is deterministic and frame-locked.
    *   *Caveat*: React might batch/skip renders? No, Remotion calls component for every frame.
    *   *Implementation*: `const canvasRef = useRef<HTMLCanvasElement>(null);` -> `const ctx = canvasRef.current?.getContext('2d');` -> `if(ctx) drawBackground(ctx, localFrame, fps, width, height);` inside component body.

12. **Drawing Logic (Canvas 2D)**:
    *   **Coordinate System**: Simulate 3D Perspective.
        *   Camera: `cx, cy, cz` (position), `lookAtX, lookAtY`.
        *   Projection: `scale = focalLength / (focalLength + z)`. `screenX = (x - camX) * scale + centerX`. `screenY = (y - camY) * scale + centerY`.
    *   **Floor**: Draw a large plane at y=-6. Perspective grid lines.
    *   **Grid Helper**: Lines on floor.
    *   **Rings**: Torus -> Project as ellipses (circles scaled by perspective). Rotate Z.
    *   **Particles**: Points. Additive blending (`lighter`).
    *   **Lights**: Radial gradients on floor plane.

    This is a **lot of code** for a single file. I need to write a compact but complete software renderer.

13. **UI Layer (React DOM)**:
    *   Video Cards: Two divs. Floating Y animation (sin/cos). Light Sweep (div moving left->right).
    *   HUD Corners: 4 divs per card (border pieces).
    *   Subscribe Zone: Center. 3 Rings (Rotating Z). Center Circle (Pulse Scale).
    *   HUD Lines: Top/Bottom bars.
    *   Text Overlay: Title + Keywords badges.

14. **Easing Mapping**:
    *   GSAP `sine.inOut` -> `Easing.inOut(Easing.sin)`
    *   GSAP `linear` -> `Easing.linear`
    *   GSAP `ease-in-out` (CSS) -> `Easing.inOut(Easing.quad)` or `Easing.inOut(Easing.sin)`. CSS `ease-in-out` ~= `cubic-bezier(0.42, 0, 0.58, 1)`. Remotion `Easing.inOut(Easing.cubic)` is close. `Easing.inOut(Easing.sin)` is standard sine.
    *   CSS `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard) -> `Easing.bezier(0.4, 0, 0.2, 1)`.

15. **Structure**:
    *   Imports.
    *   Constants (ORIGINAL_W/H, PARTICLE_COUNT, PRECALC DATA).
    *   Component `LuxuryFuturisticEndscreen`.
    *   Hooks: `useVideoConfig`, `useCurrentFrame`.
    *   Input Props.
    *   Loop Frame Calc.
    *   Canvas Ref + Draw Call (Sync).
    *   Return JSX: Wrapper (Scale) -> Canvas (Background) -> UI Layer (Cards, Subscribe, HUD Lines, Text).

**Writing the Code - Mental Draft**:

```tsx
import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

// Constants
const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const MASTER_LOOP_DURATION = 12; // Seconds
const PARTICLE_COUNT = 800; // Reduced for perf, 1200 might be slow in software render

// Pre-calc Particles
const particles = Array.from({length: PARTICLE_COUNT}, (_, i) => {
  // Deterministic pseudo-random via seed/i
  const rand = (seed: number) => { /* simple hash */ };
  return { x: ..., y: ..., z: ..., speedY: ..., drift: ..., size: ..., opacity: ... };
});

// Pre-calc Rings
const ringsData = [ ... ];

// Draw Function
function drawBackground(ctx: CanvasRenderingContext2D, frame: number, fps: number, w: number, h: number) {
  const t = frame / fps;
  // Clear
  // Camera Parallax
  // Draw Floor Grid
  // Draw Rings
  // Draw Particles
  // Draw Light Spots
}

export const LuxuryFuturisticEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
  const localFrame = frame % (fps * MASTER_LOOP_DURATION);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  if (canvasRef.current) {
     const ctx = canvasRef.current.getContext('2d');
     if (ctx) drawBackground(ctx, localFrame, fps, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
  }

  // Input Props
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

  // UI Animations (interpolate)
  // ...

  return (
    <div style={{ transform: `scale(${scaleFactor})`, transformOrigin: 'center center', width: ORIGINAL_WIDTH, height: ORIGINAL_HEIGHT, overflow: 'hidden' }}>
       <canvas ref={canvasRef} width={ORIGINAL_WIDTH} height={ORIGINAL_HEIGHT} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, opacity: 0.8 }} />
       <div className="ui-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
          {/* HUD Lines */}
          {/* Video Cards */}
          {/* Subscribe Zone */}
          {/* Text Overlay */}
       </div>
    </div>
  );
}

export default LuxuryFuturisticEndscreen;
```

**Refining the Canvas Renderer**:
Need a minimal 3D projection.
`focalLength = 500` (approx).
`camZ = 25`, `camY = 5`.
`lookAt` offset.
Projection: `const scale = focalLength / (focalLength + (pointZ - camZ));` (Assuming camera at 0,0,0 looking down -Z? Three.js default: Camera at (0,0,25) looking at (0,0,0). So World Z=0 is at distance 25.
Let's set Camera at `camX, camY, camZ`.
Point World: `px, py, pz`.
Relative: `rx = px - camX`, `ry = py - camY`, `rz = pz - camZ`.
Project: `sx = rx * (fl / rz) + cx`, `sy = ry * (fl / rz) + cy`. (Assuming looking down -Z, so rz negative for visible objects? Three.js camera looks down -Z. So objects at z=0 have rz = -25. fl/rz negative -> flip.
Better: `rz = camZ - pz` (distance). `scale = fl / rz`.
`screenX = (px - camX) * scale + centerX`.
`screenY = (camY - py) * scale + centerY` (Y up).

**Floor Grid**:
Plane at y = -6. Size 200x200. Lines every 2 units (100 lines).
Draw lines in perspective.

**Rings**:
Torus at y = -2, 1, 4. Radius 12, tube 0.02.
Project as Circle (Ellipse). Major axis = Radius * scale. Minor axis = Radius * scale * cos(angleX). Ring is horizontal (rotX=PI/2), so it's a circle in XZ plane. Projected Y depends on camera Y.
Actually, if ring is flat (horizontal), it projects as an ellipse.
Center: (0, ringY, 0).
Scale = fl / (camZ - 0) = fl / camZ.
RadiusScreen = 12 * scale.
YScreen = centerY + (camY - ringY) * scale.
Draw Ellipse: `ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, 2PI)`.
Rotation Z: Rotates the ellipse? No, a circle rotated Z is still a circle. The *texture* rotates. Since we draw wireframe, rotation Z does nothing visually for a circle.
*Correction*: The rings in Three.js are `