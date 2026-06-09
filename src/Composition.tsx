import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const SpinBox = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Stock Video';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

  const cycleDuration = 2;
  const localFrame = frame % (fps * cycleDuration);

  const rotation = interpolate(localFrame, [0, fps * cycleDuration], [0, 360], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  const opacity = interpolate(localFrame, [0, fps * cycleDuration], [1, 1], {
    easing: Easing.linear,
    extrapolate: 'clamp',
  });

  const titleOpacity = interpolate(localFrame, [0, fps * cycleDuration], [0, 1], {
    easing: Easing.in(Easing.quad),
    extrapolate: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          backgroundColor: 'red',
          transform: `rotate(${rotation}deg)`,
          opacity: opacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '0px 0px 10px #fff',
          }}
        >
          {judul}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {keywordsList.map((keyword, index) => (
            <div
              key={index}
              style={{
                padding: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 10,
                fontSize: 16,
                color: '#fff',
              }}
            >
              {keyword.trim()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpinBox;