import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CyberpunkGamingEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

  const localFrame = frame % (fps * 10);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
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
          background: 'radial-gradient(circle at center, transparent 0%, #030008 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: ORIGINAL_WIDTH,
            height: ORIGINAL_HEIGHT,
            background: 'repeating-linear-gradient(to bottom, rgba(0, 243, 255, 0.03) 0px, rgba(0, 243, 255, 0.03) 2px, transparent 2px, transparent 4px)',
            pointerEvents: 'none',
            boxShadow: 'inset 0 0 150px rgba(188, 19, 254, 0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 160,
            width: 1600,
            height: 1,
            background: '#00f3ff',
            boxShadow: '0 0 10px #00f3ff',
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: 160,
            width: 1600,
            height: 1,
            background: '#00f3ff',
            boxShadow: '0 0 10px #00f3ff',
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 118,
            left: 160,
            width: 4,
            height: 4,
            background: '#bc13fe',
            boxShadow: '0 0 8px #bc13fe',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 118,
            right: 160,
            width: 4,
            height: 4,
            background: '#bc13fe',
            boxShadow: '0 0 8px #bc13fe',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 118,
            left: 160,
            width: 4,
            height: 4,
            background: '#bc13fe',
            boxShadow: '0 0 8px #bc13fe',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 118,
            right: 160,
            width: 4,
            height: 4,
            background: '#bc13fe',
            boxShadow: '0 0 8px #bc13fe',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 360,
            left: 160,
            width: 640,
            height: 360,
            background: 'rgba(0, 15, 30, 0.6)',
            border: '2px solid #00f3ff',
            borderRadius: 12,
            boxShadow: '0 0 25px rgba(0, 243, 255, 0.3), inset 0 0 25px rgba(0, 243, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: 'center center',
              opacity: 0.3,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              border: '2px solid #fff',
              opacity: 0.8,
              top: -2,
              left: -2,
              borderRight: 'none',
              borderBottom: 'none',
              borderRadius: '12px 0 0 0',
              borderColor: '#bc13fe',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              border: '2px solid #fff',
              opacity: 0.8,
              top: -2,
              right: -2,
              borderLeft: 'none',
              borderBottom: 'none',
              borderRadius: '0 12px 0 0',
              borderColor: '#bc13fe',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              border: '2px solid #fff',
              opacity: 0.8,
              bottom: -2,
              left: -2,
              borderRight: 'none',
              borderTop: 'none',
              borderRadius: '0 0 0 12px',
              borderColor: '#bc13fe',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              border: '2px solid #fff',
              opacity: 0.8,
              bottom: -2,
              right: -2,
              borderLeft: 'none',
              borderTop: 'none',
              borderRadius: '0 0 12px 0',
              borderColor: '#bc13fe',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 360,
            right: 160,
            width: 640,
            height: 360,
            background: 'rgba(0, 15, 30, 0.6)',
            border: '2px solid #00f3ff',
            borderRadius: 12,
            boxShadow: '0 0 25px rgba(0, 243, 255, 0.3), inset 0 0 25px rgba(0, 243, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: 'center center',
              opacity: 0.3,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              border: '2px solid #fff',
              opacity: 0.8,
              top: -2,
              left: -2,
              borderRight: 'none',
              borderBottom: 'none',
              borderRadius: '12px 0 0 0',
              borderColor: '#bc13fe',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              border: '2px solid #fff',
              opacity: 0.8,
              top: -2,
              right: -2,
              borderLeft: 'none',
              borderBottom: 'none',
              borderRadius: '0 12px 0 0',
              borderColor: '#bc13fe',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              border: '2px solid #fff',
              opacity: 0.8,
              bottom: -2,
              left: -2,
              borderRight: 'none',
              borderTop: 'none',
              borderRadius: '0 0 0 12px',
              borderColor: '#bc13fe',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              border: '2px solid #fff',
              opacity: 0.8,
              bottom: -2,
              right: -2,
              borderLeft: 'none',
              borderTop: 'none',
              borderRadius: '0 0 12px 0',
              borderColor: '#bc13fe',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 415,
            left: 835,
            width: 250,
            height: 250,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 210,
              height: 210,
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${interpolate(localFrame, [0, 300], [0, 360], { easing: Easing.out(Easing.quad) })}deg)`,
              border: '2px solid transparent',
              borderTop: '2px solid #00f3ff',
              borderBottom: '2px solid #00f3ff',
              boxShadow: '0 10px 20px rgba(0, 243, 255, 0.2)',
              zIndex: 19,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${interpolate(localFrame, [0, 300], [0, -360], { easing: Easing.out(Easing.quad) })}deg)`,
              border: '2px solid transparent',
              borderLeft: '2px dashed #bc13fe',
              borderRight: '2px dashed #bc13fe',
              boxShadow: '-10px 0 20px rgba(188, 19, 254, 0.2)',
              zIndex: 18,
            }}
          />
          <div
            style={{
              width: 180,
              height: 180,
              background: 'rgba(20, 0, 40, 0.7)',
              border: '2px solid #bc13fe',
              borderRadius: '50%',
              boxShadow: `0 0 40px rgba(188, 19, 254, ${interpolate(localFrame, [0, 300], [0.5, 0.8], { easing: Easing.out(Easing.quad) })})`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              position: 'relative',
              zIndex: 20,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            fontSize: 24,
            fontFamily: 'sans-serif',
            color: '#00f3ff',
            opacity: interpolate(localFrame, [0, 100], [0, 1], { easing: Easing.out(Easing.quad) }),
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
            fontFamily: 'sans-serif',
            color: '#00f3ff',
          }}
        >
          {keywordsList.map((keyword) => (
            <div
              key={keyword}
              style={{
                display: 'inline-block',
                margin: '5px',
                padding: '5px',
                border: '1px solid #00f3ff',
                borderRadius: '5px',
                background: 'rgba(0, 243, 255, 0.1)',
              }}
            >
              {keyword}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CyberpunkGamingEndscreen;
// END_OF_FILE