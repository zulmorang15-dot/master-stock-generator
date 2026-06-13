import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const MechArena = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const localFrame = frame % (fps * 15);
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

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
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#030812',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            background: `radial-gradient(circle at center, transparent 30%, rgba(2, 5, 10, 0.4) 70%, rgba(0, 0, 0, 0.9) 100%), linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.4) 100%)`,
            zIndex: 5,
          }}
        />
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            background: `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))`,
            backgroundSize: '100% 4px, 6px 100%',
            opacity: 0.25,
            zIndex: 6,
          }}
        />
        <div
          style={{
            width: 180,
            height: 180,
            border: '4px solid #00f0ff',
            opacity: 0.3,
            position: 'absolute',
            top: 40,
            left: 40,
          }}
        />
        <div
          style={{
            width: 180,
            height: 180,
            border: '4px solid #00f0ff',
            opacity: 0.3,
            position: 'absolute',
            top: 40,
            right: 40,
          }}
        />
        <div
          style={{
            width: 180,
            height: 180,
            border: '4px solid #00f0ff',
            opacity: 0.3,
            position: 'absolute',
            bottom: 40,
            left: 40,
          }}
        />
        <div
          style={{
            width: 180,
            height: 180,
            border: '4px solid #00f0ff',
            opacity: 0.3,
            position: 'absolute',
            bottom: 40,
            right: 40,
          }}
        />
        <div
          style={{
            width: 520,
            height: 292,
            backgroundColor: 'rgba(3, 12, 26, 0.4)',
            border: '3px solid rgba(0, 240, 255, 0.4)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.15), inset 0 0 40px rgba(0, 110, 255, 0.2)',
            backdropFilter: 'blur(4px)',
            position: 'absolute',
            top: 380,
            left: 160,
            pointerEvents: 'auto',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(45deg, transparent 48%, rgba(0, 240, 255, 0.3) 50%, transparent 52%)`,
              backgroundSize: '200% 200%',
              animation: 'shine 4s infinite linear',
            }}
          />
        </div>
        <div
          style={{
            width: 520,
            height: 292,
            backgroundColor: 'rgba(3, 12, 26, 0.4)',
            border: '3px solid rgba(0, 240, 255, 0.4)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.15), inset 0 0 40px rgba(0, 110, 255, 0.2)',
            backdropFilter: 'blur(4px)',
            position: 'absolute',
            top: 380,
            right: 160,
            pointerEvents: 'auto',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(45deg, transparent 48%, rgba(0, 240, 255, 0.3) 50%, transparent 52%)`,
              backgroundSize: '200% 200%',
              animation: 'shine 4s infinite linear',
            }}
          />
        </div>
        <div
          style={{
            width: 240,
            height: 240,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                border: '2px dashed rgba(0, 240, 255, 0.6)',
                borderRadius: '50%',
                animation: 'rotateCW 20s linear infinite',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
              }}
            />
            <div
              style={{
                width: '85%',
                height: '85%',
                border: '1px solid #006eff',
                borderRadius: '50%',
                animation: 'rotateCW 15s linear infinite reverse',
              }}
            />
            <div
              style={{
                width: '70%',
                height: '70%',
                border: '4px double',
                borderRadius: '50%',
                animation: 'rotateCW 8s linear infinite',
              }}
            />
            <div
              style={{
                width: 40,
                height: 2,
                backgroundColor: 'rgba(0, 240, 255, 0.5)',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div
              style={{
                width: 2,
                height: 40,
                backgroundColor: 'rgba(0, 240, 255, 0.5)',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        </div>
        <div
          style={{
            width: 600,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #00f0ff, #006eff, #00f0ff, transparent)',
            boxShadow: '0 0 15px #00f0ff',
            position: 'absolute',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    </div>
  );
};

export default MechArena;
// END_OF_FILE