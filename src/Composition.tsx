import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const cycleDuration = 10; // 10 seconds

const SciFiEndscreen = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const localFrame = frame % (fps * cycleDuration);

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;

  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

  const opacity = interpolate(localFrame, [0, fps], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolate: 'clamp',
  });

  const scanLineLeftY = interpolate(localFrame, [0, fps * 2.5], [0, 356], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  const scanLineRightY = interpolate(localFrame, [0, fps * 3], [0, 356], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  const placeholderBoxShadow = interpolate(localFrame, [0, fps * 1.5], [0, 70], {
    easing: Easing.inOut(Easing.quad),
    extrapolate: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#00040a',
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 250,
          left: 150,
          width: 640,
          height: 360,
          border: '6px solid #00f3ff',
          boxShadow: `0 0 ${placeholderBoxShadow}px rgba(0, 243, 255, 0.8), inset 0 0 60px rgba(0, 243, 255, 0.5)`,
          background: 'rgba(0, 10, 30, 0.4)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 4,
            background: '#00f3ff',
            boxShadow: '0 0 20px #00f3ff, 0 0 40px #00f3ff',
            opacity: 0.8,
            transform: `translateY(${scanLineLeftY}px)`,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 250,
          right: 150,
          width: 640,
          height: 360,
          border: '6px solid #00f3ff',
          boxShadow: `0 0 ${placeholderBoxShadow}px rgba(0, 243, 255, 0.8), inset 0 0 60px rgba(0, 243, 255, 0.5)`,
          background: 'rgba(0, 10, 30, 0.4)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 4,
            background: '#00f3ff',
            boxShadow: '0 0 20px #00f3ff, 0 0 40px #00f3ff',
            opacity: 0.8,
            transform: `translateY(${scanLineRightY}px)`,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 350,
          height: 350,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            border: '4px dashed #0055ff',
            width: 350,
            height: 350,
            borderRadius: '50%',
            boxShadow: '0 0 30px rgba(0, 85, 255, 0.6)',
            transform: `rotate(${localFrame * 0.1}deg)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            border: '12px solid #00f3ff',
            width: 300,
            height: 300,
            borderRadius: '50%',
            boxShadow: '0 0 40px #00f3ff, inset 0 0 20px #00f3ff',
            transform: `rotate(-${localFrame * 0.2}deg)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            border: '6px solid #0055ff',
            width: 240,
            height: 240,
            borderRadius: '50%',
            transform: `rotate(${localFrame * 0.3}deg)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 160,
            height: 160,
            background: 'radial-gradient(circle, #00f3ff 0%, rgba(0, 243, 255, 0) 70%)',
            borderRadius: '50%',
            transform: `scale(${0.9 + Math.sin(localFrame * 0.01) * 0.3})`,
            opacity: 0.6 + Math.sin(localFrame * 0.01) * 0.4,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          fontSize: 36,
          fontWeight: 'bold',
          color: '#00f3ff',
          opacity,
        }}
      >
        {judul}
      </div>
      {keywordsList.map((keyword, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            bottom: 80 + index * 30,
            left: 20,
            fontSize: 18,
            color: '#0055ff',
            backgroundColor: 'rgba(0, 85, 255, 0.2)',
            padding: '4px 8px',
            borderRadius: 8,
          }}
        >
          {keyword}
        </div>
      ))}
    </div>
  );
};

export default SciFiEndscreen;
// END_OF_FILE