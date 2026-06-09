import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const CYCLE_DURATION = 8;

const CyberPunkNeonRingAnimation: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Cyber Tech';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
  const localFrame = frame % (fps * CYCLE_DURATION);

  const rotate1 = interpolate(
    localFrame,
    [0, fps * 6],
    [0, 360],
    { extrapolateRight: 'clamp' }
  );

  const rotate2 = interpolate(
    localFrame,
    [0, fps * 8],
    [360, 0],
    { extrapolateRight: 'clamp' }
  );

  const glowOpacity = interpolate(
    Math.sin((localFrame / (fps * CYCLE_DURATION)) * Math.PI * 2),
    [-1, 1],
    [0.6, 1]
  );

  return (
    <div style={{
      width,
      height,
      backgroundColor: '#030008',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
      backgroundImage: `radial-gradient(circle at center, #0a001a 0%, #030008 100%)`,
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
        position: 'relative',
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'absolute',
          width: 200,
          height: 200,
          border: '2px solid transparent',
          borderTopColor: '#ff007f',
          borderBottomColor: '#ff007f',
          borderRadius: '50%',
          boxShadow: `0 0 15px rgba(255, 0, 127, ${glowOpacity})`,
          transform: `rotate(${rotate1}deg)`,
        }} />
        
        <div style={{
          position: 'absolute',
          width: 250,
          height: 250,
          border: '2px solid transparent',
          borderLeftColor: '#00f0ff',
          borderRightColor: '#00f0ff',
          borderRadius: '50%',
          boxShadow: `0 0 15px rgba(0, 240, 255, ${glowOpacity})`,
          transform: `rotate(${rotate2}deg)`,
        }} />

        <div style={{
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: '5px',
          fontWeight: 'bold',
          textShadow: '0 0 10px #00f0ff',
          zIndex: 10,
          fontSize: '48px'
        }}>
          {judul}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          display: 'flex',
          gap: '10px',
          zIndex: 20
        }}>
          {keywordsList.map((word, i) => (
            <div key={i} style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '4px',
              color: '#00f0ff',
              fontSize: '14px',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              textTransform: 'lowercase'
            }}>
              {word.trim()}
            </div>
          ))}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 60,
          left: 80,
          color: '#ffffff',
          fontSize: '24px',
          fontWeight: 'bold',
          opacity: 0.8,
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {judul}
        </div>
      </div>
    </div>
  );
};

export default CyberPunkNeonRingAnimation;