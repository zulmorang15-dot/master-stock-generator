import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const PremiumCinematic = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

  const localFrame = frame % (fps * 10);

  const opacity = interpolate(localFrame, [0, fps * 2], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolate: 'clamp',
  });

  const scale = interpolate(localFrame, [0, fps * 2], [0.5, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolate: 'clamp',
  });

  const rotate = interpolate(localFrame, [0, fps * 5], [0, 360], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  const translate = interpolate(localFrame, [0, fps * 5], [0, 20], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: ORIGINAL_WIDTH,
          height: ORIGINAL_HEIGHT,
          backgroundColor: '#030008',
          boxShadow: '0 0 150px rgba(0,0,0,0.9)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            box-shadow: 'inset 0 0 300px rgba(0, 0, 0, 0.95)',
            background:
              'radial-gradient(circle at 20% 30%, rgba(255, 0, 127, 0.04) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(0, 240, 255, 0.04) 0%, transparent 40%), linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%)',
            backgroundSize: '100% 100%, 100% 100%, 100% 6px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 180,
            left: ORIGINAL_WIDTH / 2 - 600,
            width: 1200,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #9d4edd, #00f0ff, #9d4edd, transparent)',
            opacity: 0.4,
            filter: 'blur(1px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 180,
            left: ORIGINAL_WIDTH / 2 - 600,
            width: 1200,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #9d4edd, #00f0ff, #9d4edd, transparent)',
            opacity: 0.4,
            filter: 'blur(1px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: ORIGINAL_WIDTH / 2 - 350,
            width: 700,
            height: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
              width: `${(localFrame / (fps * 10)) * 100}%`,
              background: 'linear-gradient(90deg, #9d4edd, #ff007f)',
              boxShadow: '0 0 15px #ff007f',
            }}
          />
        </div>
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
              top: 360,
              left: 150,
              width: 640,
              height: 360,
              borderRadius: 20,
              background: 'rgba(10, 5, 18, 0.45)',
              border: '1px solid rgba(157, 78, 221, 0.25)',
              backdropFilter: 'blur(25px)',
              boxShadow:
                '0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 50px rgba(157, 78, 221, 0.05)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: '1px solid #9d4edd',
                borderRadius: 20,
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: 390,
              left: 810,
              width: 300,
              height: 300,
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
                boxShadow:
                  '0 20px 50px rgba(0,0,0,0.6), inset 0 0 30px rgba(157, 78, 221, 0.3), 0 0 60px rgba(157, 78, 221, 0.1)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
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
              top: 360,
              right: 150,
              width: 640,
              height: 360,
              borderRadius: 20,
              background: 'rgba(10, 5, 18, 0.45)',
              border: '1px solid rgba(157, 78, 221, 0.25)',
              backdropFilter: 'blur(25px)',
              boxShadow:
                '0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 50px rgba(157, 78, 221, 0.05)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: '1px solid #9d4edd',
                borderRadius: 20,
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 50,
              left: 50,
              fontSize: 24,
              fontWeight: 'bold',
              color: '#ffffff',
              opacity: opacity,
            }}
          >
            {judul}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 50,
              fontSize: 16,
              color: '#ffffff',
              opacity: opacity,
            }}
          >
            {keywordsList.map((keyword, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'rgba(10, 5, 18, 0.45)',
                  border: '1px solid rgba(157, 78, 221, 0.25)',
                  borderRadius: 10,
                  padding: '5px 10px',
                  display: 'inline-block',
                  marginRight: 10,
                }}
              >
                {keyword}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumCinematic;
// END_OF_FILE