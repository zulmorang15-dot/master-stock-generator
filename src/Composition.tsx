import React from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const FuturisticPcbEndScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Fullscreen 16:9 scaling factor
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Move Grid PCB (10 seconds cycle, perfectly seamless at 300 frames)
  const bgPos80 = interpolate(frame, [0, 300], [0, 80]);
  const bgPos20 = interpolate(frame, [0, 300], [0, 20]);

  // 2. Data sweep pulse (5 seconds cycle, loops 2 times in 10s)
  const sweepFrame = frame % 150;
  const sweepLeft = interpolate(sweepFrame, [0, 150], [-100, 200], {
    easing: Easing.inOut(Easing.quad),
  });
  const sweepOpacity = interpolate(sweepFrame, [0, 30, 120, 150], [0, 1, 1, 0]);

  // 3. Flares breathing pulses (5 seconds cycle, loops 2 times in 10s)
  const flare1Frame = frame % 150;
  const flare1Scale = interpolate(flare1Frame, [0, 75, 150], [1, 1.2, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  const flare1Opacity = interpolate(flare1Frame, [0, 75, 150], [0.5, 1.0, 0.5], {
    easing: Easing.inOut(Easing.quad),
  });

  const flare2Frame = (frame + 60) % 150; // delayed/offset
  const flare2Scale = interpolate(flare2Frame, [0, 75, 150], [1, 1.2, 1], {
    easing: Easing.inOut(Easing.quad),
  });
  const flare2Opacity = interpolate(flare2Frame, [0, 75, 150], [0.5, 1.0, 0.5], {
    easing: Easing.inOut(Easing.quad),
  });

  // 4. Scanners (2.5 seconds cycle, loops 4 times in 10s)
  const scanFrame = frame % 75;
  const scanTop = interpolate(scanFrame, [0, 75], [-100, 200], {
    easing: Easing.inOut(Easing.quad),
  });

  // 5. Placeholders hatch fadeOut, scale increase and solid resolving
  // To preserve absolute seamless looping, we map this transitions smoothly to transition back at the end
  const hatchOpacity = interpolate(
    frame,
    [0, 45, 120, 255, 300],
    [1, 1, 0, 0, 1],
    { easing: Easing.inOut(Easing.quad) }
  );
  
  const hatchScale = interpolate(
    frame,
    [0, 45, 120, 255, 300],
    [1, 1, 1.1, 1.1, 1],
    { easing: Easing.inOut(Easing.quad) }
  );

  const solidBgOpacity = interpolate(
    frame,
    [0, 45, 120, 255, 300],
    [0, 0, 1, 1, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  const glowIntensity = interpolate(
    frame,
    [0, 45, 120, 255, 300],
    [0.5, 0.5, 1.0, 1.0, 0.5],
    { easing: Easing.inOut(Easing.quad) }
  );

  const borderG = Math.round(
    interpolate(frame, [0, 45, 120, 255, 300], [200, 200, 255, 255, 200])
  );
  const borderA = interpolate(
    frame,
    [0, 45, 120, 255, 300],
    [0.8, 0.8, 1.0, 1.0, 0.8]
  );
  const borderColor = `rgba(0, ${borderG}, 255, ${borderA})`;

  // Styling maps
  const mainWrapperStyle: React.CSSProperties = {
    width: ORIGINAL_WIDTH,
    height: ORIGINAL_HEIGHT,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${scaleFactor})`,
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#020510',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const circuitBgStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `
      radial-gradient(circle at 40px 40px, rgba(0, 255, 255, 0.6) 2px, transparent 2px),
      linear-gradient(rgba(0, 200, 255, 0.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 200, 255, 0.15) 1px, transparent 1px),
      linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)
    `,
    backgroundSize: '80px 80px, 80px 80px, 80px 80px, 20px 20px, 20px 20px',
    backgroundPosition: `${bgPos80}px ${bgPos80}px, ${bgPos80}px ${bgPos80}px, ${bgPos80}px ${bgPos80}px, ${bgPos20}px ${bgPos20}px, ${bgPos20}px ${bgPos20}px`,
    zIndex: 1,
  };

  const dataPulseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: `${sweepLeft}%`,
    width: '50%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.15), transparent)',
    transform: 'skewX(-30deg)',
    zIndex: 2,
    opacity: sweepOpacity,
  };

  const vignetteStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 50% 50%, transparent 30%, #020510 90%)',
    zIndex: 3,
  };

  const flare1Style: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(90px)',
    zIndex: 4,
    top: '-15%',
    left: '-5%',
    width: '500px',
    height: '500px',
    background: 'rgba(0, 150, 255, 0.25)',
    transform: `scale(${flare1Scale})`,
    opacity: flare1Opacity,
    transformOrigin: 'center center',
  };

  const flare2Style: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(90px)',
    zIndex: 4,
    bottom: '-15%',
    right: '-5%',
    width: '600px',
    height: '600px',
    background: 'rgba(0, 255, 255, 0.15)',
    transform: `scale(${flare2Scale})`,
    opacity: flare2Opacity,
    transformOrigin: 'center center',
  };

  const endScreenContainerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '50px',
    width: '80%',
    maxWidth: '1200px',
  };

  const placeholderStyle = (isCircle: boolean): React.CSSProperties => {
    const baseShadow = `0 0 ${15 + (glowIntensity - 0.5) * 20}px rgba(0, 200, 255, ${0.5 + (glowIntensity - 0.5) * 0.6})`;
    const insetShadow = `, inset 0 0 ${20 * solidBgOpacity}px rgba(0, 255, 255, ${0.5 * solidBgOpacity})`;
    return {
      position: 'relative',
      border: `2px solid ${borderColor}`,
      boxShadow: `${baseShadow}${insetShadow}`,
      overflow: 'hidden',
      backgroundColor: `rgba(0, 170, 255, ${solidBgOpacity * 0.35})`,
      width: isCircle ? '160px' : '350px',
      height: isCircle ? '160px' : '200px',
      borderRadius: isCircle ? '50%' : '12px',
      flexShrink: isCircle ? 0 : undefined,
    };
  };

  const hatchedPatternStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `repeating-linear-gradient(
      -45deg,
      rgba(0, 200, 255, 0.8) 0,
      rgba(0, 200, 255, 0.8) 4px,
      transparent 4px,
      transparent 10px
    )`,
    transform: `scale(${hatchScale})`,
    opacity: hatchOpacity,
  };

  const scannerStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${scanTop}%`,
    left: 0,
    width: '100%',
    height: '50%',
    background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.8), transparent)',
    opacity: 0.5,
  };

  return (
    <div style={mainWrapperStyle}>
      <div style={circuitBgStyle} />
      <div style={dataPulseStyle} />
      <div style={vignetteStyle} />
      <div style={flare1Style} />
      <div style={flare2Style} />

      <div style={endScreenContainerStyle}>
        <div style={placeholderStyle(false)}>
          <div style={hatchedPatternStyle} />
          <div style={scannerStyle} />
        </div>

        <div style={placeholderStyle(true)}>
          <div style={hatchedPatternStyle} />
          <div style={scannerStyle} />
        </div>

        <div style={placeholderStyle(false)}>
          <div style={hatchedPatternStyle} />
          <div style={scannerStyle} />
        </div>
      </div>
    </div>
  );
};

export default FuturisticPcbEndScreen;
// END_OF_FILE