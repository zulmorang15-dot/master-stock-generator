import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

// Deterministic seed-based particle generator to avoid Math.random() inside render
const PARTICLE_COUNT = 120;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const seedX = Math.sin(i * 12.34) * 960; // Spread across x bounds (-960 to 960)
  const seedY = Math.cos(i * 56.78) * 540; // Spread across y bounds (-540 to 540)
  const size = Math.abs(Math.sin(i * 91.23)) * 8 + 4;
  const speed = 1.0 + Math.abs(Math.cos(i * 34.56)) * 1.5;
  const swayRange = 15 + Math.abs(Math.sin(i * 78.9)) * 25;
  const swayFreq = 0.015 + Math.abs(Math.cos(i * 12.3)) * 0.035;
  const opacity = 0.15 + Math.abs(Math.sin(i * 45.6)) * 0.45;
  return { x: seedX, y: seedY, size, speed, swayRange, swayFreq, opacity, index: i };
});

const ModernLightEndScreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // 4K Auto-Fit Landscape Scaling
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  // Safe Input Props
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'THANKS FOR WATCHING';
  const keywordsList = (inputProps.keywords || 'subscribe, next video, light layout').split(',');

  // Deterministic seamless loop calculation (master duration 10 seconds / 300 frames)
  const masterDuration = 300;
  const localFrame = frame % masterDuration;

  // Seamless rotation animations (master loop 300 frames)
  const outerRotation = interpolate(localFrame, [0, masterDuration], [0, 360], { easing: Easing.linear });
  const middleRotation = interpolate(localFrame, [0, masterDuration], [0, -360], { easing: Easing.linear });

  // Seamless pulse animations (75 frames cycle - divides 300 cleanly)
  const pulse75 = localFrame % 75;
  const innerScale = interpolate(pulse75, [0, 37.5, 75], [1, 1.04, 1], { easing: Easing.inOut(Easing.quad) });
  const innerGlow = interpolate(pulse75, [0, 37.5, 75], [15, 30, 15], { easing: Easing.inOut(Easing.quad) });

  // Floating animations (150 frames cycle - divides 300 cleanly)
  const float150 = localFrame % 150;
  const leftYOffset = interpolate(float150, [0, 75, 150], [0, -10, 0], { easing: Easing.inOut(Easing.quad) });

  // Floating animations (100 frames cycle - divides 300 cleanly)
  const float100 = localFrame % 100;
  const rightYOffset = interpolate(float100, [0, 50, 100], [0, -10, 0], { easing: Easing.inOut(Easing.quad) });

  // Ambient Glow pulse (150 frames cycle)
  const glowScale = interpolate(float150, [0, 75, 150], [1.0, 1.08, 1.0], { easing: Easing.inOut(Easing.quad) });
  const glowOpacity = interpolate(float150, [0, 75, 150], [0.65, 0.95, 0.65], { easing: Easing.inOut(Easing.quad) });

  // Corner highlights blink (50 frames cycle - divides 300 cleanly)
  const blink50 = localFrame % 50;
  const cornerOpacity = interpolate(blink50, [0, 25, 50], [0.4, 0.95, 0.4], { easing: Easing.inOut(Easing.quad) });

  // Text Entrance / Reveal Fade
  const textEntrance = interpolate(Math.min(frame, 35), [0, 35], [0, 1], { easing: Easing.out(Easing.quad) });
  const textY = interpolate(Math.min(frame, 35), [0, 35], [30, 0], { easing: Easing.out(Easing.quad) });

  // Grid background position animation for kinetic seamless scroll (60 frames cycle - divides 300)
  const gridCycle = localFrame % 60;
  const gridPositionOffset = interpolate(gridCycle, [0, 60], [0, 80], { easing: Easing.linear });

  // Container styling
  const wrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #e1e8f0 100%)',
    overflow: 'hidden',
    transform: `scale(${scaleFactor})`,
    transformOrigin: 'center center',
  };

  const viewportStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fa',
  };

  // Re-engineered cinematic grids (replaces Three.js grid floor & ceiling)
  const floorGridStyle: React.CSSProperties = {
    position: 'absolute',
    width: '200%',
    height: '1000px',
    bottom: '-450px',
    left: '-50%',
    transform: 'perspective(450px) rotateX(75deg)',
    transformOrigin: 'center bottom',
    backgroundSize: '80px 80px',
    backgroundImage: `
      linear-gradient(to right, rgba(0, 180, 216, 0.16) 2px, transparent 2px),
      linear-gradient(to bottom, rgba(0, 180, 216, 0.16) 2px, transparent 2px)
    `,
    backgroundPosition: `0px ${gridPositionOffset}px`,
    opacity: 0.65,
  };

  const ceilingGridStyle: React.CSSProperties = {
    position: 'absolute',
    width: '200%',
    height: '1000px',
    top: '-450px',
    left: '-50%',
    transform: 'perspective(450px) rotateX(-75deg)',
    transformOrigin: 'center top',
    backgroundSize: '80px 80px',
    backgroundImage: `
      linear-gradient(to right, rgba(0, 180, 216, 0.16) 2px, transparent 2px),
      linear-gradient(to bottom, rgba(0, 180, 216, 0.16) 2px, transparent 2px)
    `,
    backgroundPosition: `0px ${-gridPositionOffset}px`,
    opacity: 0.65,
  };

  return (
    <div style={viewportStyle}>
      <div style={wrapperStyle}>
        
        {/* Seamless Grid System */}
        <div style={floorGridStyle} />
        <div style={ceilingGridStyle} />

        {/* Deterministic Floating Particles Layer */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
          {PARTICLES.map((p, i) => {
            const rawY = p.y - (localFrame * p.speed);
            const wrappedY = ((rawY + 540) % 1080 + 1080) % 1080;
            const swayX = Math.sin((localFrame * p.swayFreq) + p.index) * p.swayRange;
            const currentX = (p.x + swayX + 960) % 1920;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 180, 216, 0.45)',
                  left: currentX,
                  top: wrappedY,
                  opacity: p.opacity,
                  boxShadow: '0 0 10px rgba(0, 180, 216, 0.3)',
                }}
              />
            );
          })}
        </div>

        {/* Cinematic Vignette */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1920,
            height: 1080,
            background: 'radial-gradient(circle at center, transparent 40%, rgba(225, 232, 240, 0.75) 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Scanlines layer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.015) 50%, rgba(0,0,0,0.015))',
            backgroundSize: '100% 4px',
            zIndex: 4,
            pointerEvents: 'none',
            opacity: 0.5,
          }}
        />

        {/* Main UI Layer */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 3, pointerEvents: 'none' }}>
          
          {/* Ambient Glows */}
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 180, 216, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
              mixBlendMode: 'multiply',
              width: 700,
              height: 700,
              top: 190,
              left: 90,
              transform: `scale(${glowScale})`,
              opacity: glowOpacity,
            }}
          />
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 180, 216, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
              mixBlendMode: 'multiply',
              width: 700,
              height: 700,
              top: 190,
              right: 90,
              transform: `scale(${glowScale})`,
              opacity: glowOpacity,
            }}
          />
          <div
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 180, 216, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
              mixBlendMode: 'multiply',
              width: 500,
              height: 500,
              top: 290,
              left: 710,
              transform: `scale(${glowScale})`,
              opacity: glowOpacity,
            }}
          />

          {/* Left Video Placeholder */}
          <div
            style={{
              position: 'absolute',
              width: 480,
              height: 270,
              top: 405,
              left: 200,
              transform: `translateY(${leftYOffset}px)`,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(0, 180, 216, 0.25)',
              boxShadow: '0 15px 35px rgba(0, 180, 216, 0.08), inset 0 0 20px rgba(255, 255, 255, 0.6)',
            }}
          >
            <div style={{ position: 'absolute', width: 16, height: 16, borderColor: '#00b4d8', borderStyle: 'solid', borderWidth: 0, opacity: cornerOpacity, top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 16 }} />
            <div style={{ position: 'absolute', width: 16, height: 16, borderColor: '#00b4d8', borderStyle: 'solid', borderWidth: 0, opacity: cornerOpacity, top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 16 }} />
            <div style={{ position: 'absolute', width: 16, height: 16, borderColor: '#00b4d8', borderStyle: 'solid', borderWidth: 0, opacity: cornerOpacity, bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 16 }} />
            <div style={{ position: 'absolute', width: 16, height: 16, borderColor: '#00b4d8', borderStyle: 'solid', borderWidth: 0, opacity: cornerOpacity, bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 16 }} />
          </div>

          {/* Right Video Placeholder */}
          <div
            style={{
              position: 'absolute',
              width: 480,
              height: 270,
              top: 405,
              right: 200,
              transform: `translateY(${rightYOffset}px)`,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(0, 180, 216, 0.25)',
              boxShadow: '0 15px 35px rgba(0, 180, 216, 0.08), inset 0 0 20px rgba(255, 255, 255, 0.6)',
            }}
          >
            <div style={{ position: 'absolute', width: 16, height: 16, borderColor: '#00b4d8', borderStyle: 'solid', borderWidth: 0, opacity: cornerOpacity, top: -1, left: -1, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 16 }} />
            <div style={{ position: 'absolute', width: 16, height: 16, borderColor: '#00b4d8', borderStyle: 'solid', borderWidth: 0, opacity: cornerOpacity, top: -1, right: -1, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 16 }} />
            <div style={{ position: 'absolute', width: 16, height: 16, borderColor: '#00b4d8', borderStyle: 'solid', borderWidth: 0, opacity: cornerOpacity, bottom: -1, left: -1, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 16 }} />
            <div style={{ position: 'absolute', width: 16, height: 16, borderColor: '#00b4d8', borderStyle: 'solid', borderWidth: 0, opacity: cornerOpacity, bottom: -1, right: -1, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 16 }} />
          </div>

          {/* Subscribe Ring Layout */}
          <div
            style={{
              position: 'absolute',
              width: 280,
              height: 280,
              top: 400,
              left: 820,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Outer Ring */}
            <div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'transparent',
                width: 260,
                height: 260,
                borderTop: '2px solid rgba(0, 180, 216, 0.6)',
                borderBottom: '2px solid rgba(0, 180, 216, 0.15)',
                boxShadow: '0 0 25px rgba(0, 180, 216, 0.1)',
                transform: `rotate(${outerRotation}deg)`,
              }}
            />

            {/* Middle Ring */}
            <div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                width: 230,
                height: 230,
                border: '1px dashed rgba(0, 180, 216, 0.3)',
                opacity: 0.8,
                transform: `rotate(${middleRotation}deg)`,
              }}
            />

            {/* Inner Ring */}
            <div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                width: 180,
                height: 180,
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '2px solid rgba(0, 180, 216, 0.4)',
                transform: `scale(${innerScale})`,
                boxShadow: `0 10px ${innerGlow}px rgba(0, 180, 216, 0.15), inset 0 0 15px rgba(255, 255, 255, 1)`,
              }}
            />
          </div>

          {/* Elegant Glowing Bottom Left Text Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 90,
              left: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 15,
              opacity: textEntrance,
              transform: `translateY(${textY}px)`,
            }}
          >
            <div
              style={{
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                fontSize: '42px',
                fontWeight: 800,
                color: '#1d3557',
                letterSpacing: '4px',
                textShadow: '0 2px 10px rgba(0, 180, 216, 0.2)',
                textTransform: 'uppercase',
              }}
            >
              {judul}
            </div>
            
            <div
              style={{
                display: 'flex',
                gap: 10,
              }}
            >
              {keywordsList.map((tag, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(0, 180, 216, 0.25)',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    color: '#0077b6',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 10px rgba(0, 180, 216, 0.05)',
                  }}
                >
                  {tag.trim()}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModernLightEndScreen;
// END_OF_FILE