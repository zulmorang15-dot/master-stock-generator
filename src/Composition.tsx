import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CyberpunkEsports = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);
  const localFrame = frame % (fps * 12);

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
        backgroundColor: '#010105',
      }}
    >
      {/* WebGL Layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      >
        {/* Background Rings */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: `rotateZ(${(localFrame / fps) * 360}deg)`,
          }}
        >
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  border: '4px solid transparent',
                  borderTop: '4px solid #00ffff',
                  borderBottom: '4px solid #00ffff',
                  boxShadow: '0 0 30px #00ffff, inset 0 0 20px #00ffff',
                  transform: `scale(${1 + (index * 0.5)}) rotateZ(${
                    (localFrame / fps) * 360 * (index % 2 === 0 ? 1 : -1)
                  }deg)`,
                }}
              />
            ))}
        </div>
        {/* Inner Magenta Ring */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '4px dashed #ff00ff',
            boxShadow: '0 0 40px #ff00ff, inset 0 0 20px #ff00ff',
            transform: `rotateZ(${-((localFrame / fps) * 360)}deg) scale(0.8)`,
          }}
        />
        {/* Central Holographic Core */}
        <div
          style={{
            position: 'absolute',
            width: '45%',
            height: '45%',
            borderRadius: '50%',
            background: `radial-gradient(circle at center, #ffffff 0%, #00ffff 40%, transparent 70%)`,
            boxShadow: '0 0 80px #00ffff, 0 0 120px #00ffff',
            transform: `scale(${interpolate(
              localFrame,
              [0, fps * 2],
              [0.9, 1.1],
              {
                easing: Easing.inOut(Easing.quad),
                extrapolate: 'clamp',
              }
            )})`,
            opacity: interpolate(
              localFrame,
              [0, fps * 2],
              [0.8, 1],
              {
                easing: Easing.inOut(Easing.quad),
                extrapolate: 'clamp',
              }
            ),
          }}
        />
        {/* Core Target Rings */}
        <div
          style={{
            position: 'absolute',
            width: '25%',
            height: '25%',
            borderRadius: '50%',
            border: '6px solid #fff',
            boxShadow: '0 0 20px #fff',
            transform: `scale(${interpolate(
              localFrame,
              [0, fps * 1],
              [0, 3],
              {
                easing: Easing.out(Easing.quad),
                extrapolate: 'clamp',
              }
            )})`,
            opacity: interpolate(
              localFrame,
              [0, fps * 1],
              [1, 0],
              {
                easing: Easing.out(Easing.quad),
                extrapolate: 'clamp',
              }
            ),
          }}
        />
      </div>
      {/* UI Layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* Video Placeholders */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '338px',
            top: '371px',
            left: '100px',
            background: 'rgba(1, 4, 15, 0.7)',
            border: '3px solid #00ffff',
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          {/* Glowing Tech Corners */}
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              border: '4px solid #fff',
              boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
              zIndex: 2,
              top: '-4px',
              left: '-4px',
              borderRight: 'none',
              borderBottom: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              border: '4px solid #fff',
              boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
              zIndex: 2,
              top: '-4px',
              right: '-4px',
              borderLeft: 'none',
              borderBottom: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              border: '4px solid #fff',
              boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
              zIndex: 2,
              bottom: '-4px',
              left: '-4px',
              borderRight: 'none',
              borderTop: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              border: '4px solid #fff',
              boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
              zIndex: 2,
              bottom: '-4px',
              right: '-4px',
              borderLeft: 'none',
              borderTop: 'none',
            }}
          />
          {/* Interior Grid */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />
          {/* Moving Scanline */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100px',
              background: `linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)`,
              transform: `translateY(${(localFrame / fps) * 500}px)`,
              zIndex: 1,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '338px',
            top: '371px',
            right: '100px',
            background: 'rgba(1, 4, 15, 0.7)',
            border: '3px solid #00ffff',
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
        >
          {/* Glowing Tech Corners */}
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              border: '4px solid #fff',
              boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
              zIndex: 2,
              top: '-4px',
              left: '-4px',
              borderRight: 'none',
              borderBottom: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              border: '4px solid #fff',
              boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
              zIndex: 2,
              top: '-4px',
              right: '-4px',
              borderLeft: 'none',
              borderBottom: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              border: '4px solid #fff',
              boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
              zIndex: 2,
              bottom: '-4px',
              left: '-4px',
              borderRight: 'none',
              borderTop: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              border: '4px solid #fff',
              boxShadow: '0 0 15px #00ffff, 0 0 30px #00ffff',
              zIndex: 2,
              bottom: '-4px',
              right: '-4px',
              borderLeft: 'none',
              borderTop: 'none',
            }}
          />
          {/* Interior Grid */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              zIndex: 0,
            }}
          />
          {/* Moving Scanline */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100px',
              background: `linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.4), transparent)`,
              transform: `translateY(${(localFrame / fps) * 500}px)`,
              zIndex: 1,
            }}
          />
        </div>
        {/* Subscribe Portal */}
        <div
          style={{
            position: 'absolute',
            width: '360px',
            height: '360px',
            left: '780px',
            top: '360px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Outer Reactor Ring */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: '4px solid transparent',
              borderTop: '4px solid #00ffff',
              borderBottom: '4px solid #00ffff',
              boxShadow: '0 0 30px #00ffff, inset 0 0 20px #00ffff',
              transform: `rotateZ(${(localFrame / fps) * 360}deg)`,
            }}
          />
          {/* Inner Magenta Ring */}
          <div
            style={{
              position: 'absolute',
              width: '80%',
              height: '80%',
              border: '4px dashed #ff00ff',
              boxShadow: '0 0 40px #ff00ff, inset 0 0 20px #ff00ff',
              transform: `rotateZ(${-((localFrame / fps) * 360)}deg)`,
            }}
          />
          {/* Central Holographic Core */}
          <div
            style={{
              position: 'absolute',
              width: '45%',
              height: '45%',
              borderRadius: '50%',
              background: `radial-gradient(circle at center, #ffffff 0%, #00ffff 40%, transparent 70%)`,
              boxShadow: '0 0 80px #00ffff, 0 0 120px #00ffff',
              transform: `scale(${interpolate(
                localFrame,
                [0, fps * 2],
                [0.9, 1.1],
                {
                  easing: Easing.inOut(Easing.quad),
                  extrapolate: 'clamp',
                }
              )})`,
              opacity: interpolate(
                localFrame,
                [0, fps * 2],
                [0.8, 1],
                {
                  easing: Easing.inOut(Easing.quad),
                  extrapolate: 'clamp',
                }
              ),
            }}
          />
          {/* Core Target Rings */}
          <div
            style={{
              position: 'absolute',
              width: '25%',
              height: '25%',
              borderRadius: '50%',
              border: '6px solid #fff',
              boxShadow: '0 0 20px #fff',
              transform: `scale(${interpolate(
                localFrame,
                [0, fps * 1],
                [0, 3],
                {
                  easing: Easing.out(Easing.quad),
                  extrapolate: 'clamp',
                }
              )})`,
              opacity: interpolate(
                localFrame,
                [0, fps * 1],
                [1, 0],
                {
                  easing: Easing.out(Easing.quad),
                  extrapolate: 'clamp',
                }
              ),
            }}
          />
        </div>
        {/* Light Streaks */}
        <div
          style={{
            position: 'absolute',
            height: '2px',
            width: '600px',
            background: `linear-gradient(90deg, transparent, #00ffff, #ffffff)`,
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
            transform: `translateX(${(localFrame / fps) * 1000}px)`,
            top: '250px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            height: '2px',
            width: '800px',
            background: `linear-gradient(90deg, transparent, #ff00ff, #ffffff)`,
            boxShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff',
            transform: `translateX(${(localFrame / fps) * 1000}px)`,
            top: '850px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            height: '2px',
            width: '500px',
            background: `linear-gradient(90deg, transparent, #00ffff, #ffffff)`,
            boxShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
            transform: `translateX(${(localFrame / fps) * 1000}px)`,
            top: '450px',
          }}
        />
      </div>
      {/* Vignette */}
      <div
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

export default CyberpunkEsports;
// END_OF_FILE