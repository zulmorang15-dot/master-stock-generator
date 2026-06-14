import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

const CyberPunkNeonRing: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  const cycleDuration = 12;
  const localFrame = frame % (fps * cycleDuration);

  const ring1Rotation = interpolate(
    localFrame,
    [0, fps * 6, fps * 12],
    [0, 360, 720],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.linear,
    }
  );

  const ring2Rotation = interpolate(
    localFrame,
    [0, fps * 8, fps * 12],
    [0, -360, -540],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.linear,
    }
  );

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
        backgroundColor: '#030008',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          border: '2px solid transparent',
          borderRadius: '50%',
          borderTopColor: '#ff007f',
          borderBottomColor: '#ff007f',
          boxShadow: '0 0 15px #ff007f',
          transform: `rotate(${ring1Rotation}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 250,
          height: 250,
          border: '2px solid transparent',
          borderRadius: '50%',
          borderLeftColor: '#00f0ff',
          borderRightColor: '#00f0ff',
          boxShadow: '0 0 15px #00f0ff',
          transform: `rotate(${ring2Rotation}deg)`,
        }}
      />
      <div
        style={{
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: 5,
          fontWeight: 'bold',
          textShadow: '0 0 10px #00f0ff',
          zIndex: 10,
          fontFamily: 'sans-serif',
        }}
      >
        Cyber Tech
      </div>
    </div>
  );
};

export default CyberPunkNeonRing;
// END_OF_FILE