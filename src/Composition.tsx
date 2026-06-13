import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CyberpunkEsportsComponent = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const localFrame = frame % (fps * 15);

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
      }}
    >
      {/* Background */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          background: 'radial-gradient(circle at center, #020412 0%, #000000 100%)',
        }}
      />

      {/* Placeholders */}
      <div
        className="placeholder"
        style={{
          position: 'absolute',
          width: 600,
          height: 338,
          top: 371,
          left: 100,
          backgroundColor: 'rgba(1, 4, 15, 0.7)',
          border: '3px solid #00ffff',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.2)',
          backdropFilter: 'blur(8px)',
          overflow: 'hidden',
        }}
      >
        <div
          className="corner"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            top: -4,
            left: -4,
            border: '4px solid #fff',
            borderRight: 'none',
            borderBottom: 'none',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
          }}
        />
        <div
          className="corner"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            top: -4,
            right: -4,
            border: '4px solid #fff',
            borderLeft: 'none',
            borderBottom: 'none',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
          }}
        />
        <div
          className="corner"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            bottom: -4,
            left: -4,
            border: '4px solid #fff',
            borderRight: 'none',
            borderTop: 'none',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
          }}
        />
        <div
          className="corner"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            bottom: -4,
            right: -4,
            border: '4px solid #fff',
            borderLeft: 'none',
            borderTop: 'none',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
          }}
        />
        <div
          className="scanline"
          style={{
            position: 'absolute',
            width: '100%',
            height: 100,
            top: -100,
            background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)',
            zIndex: 1,
            transform: `translateY(${interpolate(localFrame, [0, 900], [0, 500], { easing: Easing.linear })}px)`,
          }}
        />
      </div>

      <div
        className="placeholder"
        style={{
          position: 'absolute',
          width: 600,
          height: 338,
          top: 371,
          right: 100,
          backgroundColor: 'rgba(1, 4, 15, 0.7)',
          border: '3px solid #00ffff',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.2)',
          backdropFilter: 'blur(8px)',
          overflow: 'hidden',
        }}
      >
        <div
          className="corner"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            top: -4,
            left: -4,
            border: '4px solid #fff',
            borderRight: 'none',
            borderBottom: 'none',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
          }}
        />
        <div
          className="corner"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            top: -4,
            right: -4,
            border: '4px solid #fff',
            borderLeft: 'none',
            borderBottom: 'none',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
          }}
        />
        <div
          className="corner"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            bottom: -4,
            left: -4,
            border: '4px solid #fff',
            borderRight: 'none',
            borderTop: 'none',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
          }}
        />
        <div
          className="corner"
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            bottom: -4,
            right: -4,
            border: '4px solid #fff',
            borderLeft: 'none',
            borderTop: 'none',
            boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
          }}
        />
        <div
          className="scanline"
          style={{
            position: 'absolute',
            width: '100%',
            height: 100,
            top: -100,
            background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)',
            zIndex: 1,
            transform: `translateY(${interpolate(localFrame, [0, 900], [0, 500], { easing: Easing.linear })}px)`,
          }}
        />
      </div>

      {/* Subscribe Portal */}
      <div
        className="subscribe-portal"
        style={{
          position: 'absolute',
          width: 360,
          height: 360,
          left: 780,
          top: 360,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          className="ring-outer"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '4px solid transparent',
            borderTop: '4px solid #00ffff',
            borderBottom: '4px solid #00ffff',
            boxShadow: '0 0 30px #00ffff, inset 0 0 20px #00ffff',
            transform: `rotate(${interpolate(localFrame, [0, 900], [0, 360], { easing: Easing.linear })}deg)`,
          }}
        />
        <div
          className="ring-inner"
          style={{
            position: 'absolute',
            width: '80%',
            height: '80%',
            border: '4px dashed #ff00ff',
            boxShadow: '0 0 40px #ff00ff, inset 0 0 20px #ff00ff',
            transform: `rotate(${interpolate(localFrame, [0, 900], [0, -360], { easing: Easing.linear })}deg)`,
          }}
        />
        <div
          className="core-glow"
          style={{
            position: 'absolute',
            width: '45%',
            height: '45%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, #ffffff 0%, #00ffff 40%, transparent 70%)',
            boxShadow: '0 0 80px #00ffff, 0 0 120px #00ffff',
            transform: `scale(${interpolate(localFrame, [0, 900], [0.9, 1.1], { easing: Easing.inOut(Easing.quad) })})`,
            opacity: interpolate(localFrame, [0, 900], [0.8, 1], { easing: Easing.inOut(Easing.quad) }),
          }}
        />
        <div
          className="core-target"
          style={{
            position: 'absolute',
            width: '25%',
            height: '25%',
            borderRadius: '50%',
            border: '6px solid #fff',
            boxShadow: '0 0 20px #fff',
            transform: `scale(${interpolate(localFrame, [0, 900], [0, 3], { easing: Easing.out(Easing.quad) })})`,
            opacity: interpolate(localFrame, [0, 900], [1, 0], { easing: Easing.out(Easing.quad) }),
          }}
        />
      </div>

      {/* Light Streaks */}
      <div
        className="light-streak"
        style={{
          position: 'absolute',
          height: 2,
          width: 400,
          background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
          boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
          borderRadius: '50%',
          top: 250,
          left: -500,
          zIndex: 5,
          opacity: 0,
          mixBlendMode: 'screen',
          transform: `translateX(${interpolate(localFrame, [0, 900], [0, ORIGINAL_WIDTH + 1000], { easing: Easing.inOut(Easing.quad) })}px)`,
        }}
      />
      <div
        className="light-streak magenta"
        style={{
          position: 'absolute',
          height: 2,
          width: 400,
          background: 'linear-gradient(90deg, transparent, #ff00ff, #ffffff)',
          boxShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff',
          borderRadius: '50%',
          top: 850,
          left: -500,
          zIndex: 5,
          opacity: 0,
          mixBlendMode: 'screen',
          transform: `translateX(${interpolate(localFrame, [0, 900], [0, ORIGINAL_WIDTH + 1000], { easing: Easing.inOut(Easing.quad) })}px)`,
        }}
      />
      <div
        className="light-streak"
        style={{
          position: 'absolute',
          height: 2,
          width: 400,
          background: 'linear-gradient(90deg, transparent, #00ffff, #ffffff)',
          boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
          borderRadius: '50%',
          top: 450,
          left: -500,
          zIndex: 5,
          opacity: 0,
          mixBlendMode: 'screen',
          transform: `translateX(${interpolate(localFrame, [0, 900], [0, ORIGINAL_WIDTH + 1000], { easing: Easing.inOut(Easing.quad) })}px)`,
        }}
      />

      {/* Vignette */}
      <div
        className="vignette"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          boxShadow: 'inset 0 0 250px rgba(0, 0, 0, 0.9)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default CyberpunkEsportsComponent;
// END_OF_FILE