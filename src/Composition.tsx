import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PremiumCinematicYouTubeEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

  const localFrame = frame % (fps * 10);

  const progress = interpolate(localFrame, [0, fps * 10], [0, 100], { easing: Easing.linear });

  return (
    <div
      style={{
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
        backgroundColor: '#030008',
        boxShadow: '0 0 150px rgba(0,0,0,0.9)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          boxShadow: 'inset 0 0 300px rgba(0, 0, 0, 0.95)',
          background: `radial-gradient(circle at 20% 30%, rgba(255, 0, 127, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(0, 240, 255, 0.04) 0%, transparent 40%),
            linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%)`,
          backgroundSize: '100% 100%, 100% 100%, 100% 6px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          zIndex: 5,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 640,
            height: 360,
            top: 360,
            left: 150,
            borderRadius: 20,
            background: 'rgba(10, 5, 18, 0.45)',
            border: '1px solid rgba(157, 78, 221, 0.25)',
            backdropFilter: 'blur(25px)',
            boxShadow: `0 30px 60px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 0 50px rgba(157, 78, 221, 0.05)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 30,
                height: 30,
                top: -1,
                left: -1,
                border: '3px solid #ff007f',
                opacity: 0.8,
                filter: 'drop-shadow(0 0 8px #ff007f)',
                borderTopWidth: 3,
                borderLeftWidth: 3,
                borderTopStyle: 'solid',
                borderLeftStyle: 'solid',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 30,
                height: 30,
                bottom: -1,
                right: -1,
                border: '3px solid #ff007f',
                opacity: 0.8,
                filter: 'drop-shadow(0 0 8px #ff007f)',
                borderBottomWidth: 3,
                borderRightWidth: 3,
                borderBottomStyle: 'solid',
                borderRightStyle: 'solid',
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            top: 390,
            left: 810,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 270,
              height: 270,
              borderRadius: 50,
              border: '2px dashed #00f0ff',
              opacity: 0.3,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 236,
              height: 236,
              borderRadius: 50,
              border: '3px solid transparent',
              borderTop: '3px solid #ff007f',
              borderBottom: '3px solid #9d4edd',
              filter: 'drop-shadow(0 0 12px #ff007f)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: 50,
              background: 'radial-gradient(circle at 35% 35%, #1a0b2e 0%, #07020f 100%)',
              border: '2px solid rgba(157, 78, 221, 0.4)',
              boxShadow: `0 20px 50px rgba(0,0,0,0.6),
                inset 0 0 30px rgba(157, 78, 221, 0.3),
                0 0 60px rgba(157, 78, 221, 0.1)`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 170,
                height: 170,
                borderRadius: 50,
                border: '1px dashed rgba(255, 0, 127, 0.3)',
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            width: 640,
            height: 360,
            top: 360,
            right: 150,
            borderRadius: 20,
            background: 'rgba(10, 5, 18, 0.45)',
            border: '1px solid rgba(157, 78, 221, 0.25)',
            backdropFilter: 'blur(25px)',
            boxShadow: `0 30px 60px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 0 50px rgba(157, 78, 221, 0.05)`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 30,
                height: 30,
                top: -1,
                left: -1,
                border: '3px solid #ff007f',
                opacity: 0.8,
                filter: 'drop-shadow(0 0 8px #ff007f)',
                borderTopWidth: 3,
                borderLeftWidth: 3,
                borderTopStyle: 'solid',
                borderLeftStyle: 'solid',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 30,
                height: 30,
                bottom: -1,
                right: -1,
                border: '3px solid #ff007f',
                opacity: 0.8,
                filter: 'drop-shadow(0 0 8px #ff007f)',
                borderBottomWidth: 3,
                borderRightWidth: 3,
                borderBottomStyle: 'solid',
                borderRightStyle: 'solid',
              }}
            />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #9d4edd, #ff007f)',
              boxShadow: '0 0 15px #ff007f',
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
          opacity: interpolate(localFrame, [0, fps], [0, 1], { easing: Easing.out(Easing.quad) }),
        }}
      >
        {judul}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 20,
          fontSize: 14,
          color: 'white',
          opacity: interpolate(localFrame, [0, fps], [0, 1], { easing: Easing.out(Easing.quad) }),
        }}
      >
        {keywordsList.map((keyword, index) => (
          <div
            key={index}
            style={{
              display: 'inline-block',
              padding: '5px 10px',
              margin: '5px',
              borderRadius: 10,
              background: 'rgba(10, 5, 18, 0.45)',
              border: '1px solid rgba(157, 78, 221, 0.25)',
              backdropFilter: 'blur(25px)',
            }}
          >
            {keyword}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PremiumCinematicYouTubeEndscreen;
// END_OF_FILE