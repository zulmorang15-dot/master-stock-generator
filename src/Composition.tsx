import { useVideoConfig, useCurrentFrame, interpolate, Easing, getInputProps } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;
const CYCLE_DURATION = 8;

const CyberPunkNeonRingAnimation: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT) * 0.85;
  
  const localFrame = frame % (fps * CYCLE_DURATION);
  const inputProps = (getInputProps() as any) || {};
  const judul = inputProps.judul || 'Cyber Tech';
  const keywordsList = (inputProps.keywords || 'motion, abstract, loop').split(',');

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

  const ringStyle: React.CSSProperties = {
    position: 'absolute',
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: '2px',
    transformOrigin: 'center center',
  };

  return (
    <div style={{
      width,
      height,
      backgroundColor: '#030008',
      backgroundImage: 'radial-gradient(circle at center, #0d001a 0%, #030008 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center center',
        position: 'relative',
        width: ORIGINAL_WIDTH,
        height: ORIGINAL_HEIGHT,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{
          ...ringStyle,
          width: 200,
          height: 200,
          borderTopColor: '#ff007f',
          borderBottomColor: '#ff007f',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          boxShadow: '0 0 15px #ff007f',
          transform: `rotate(${rotate1}deg)`,
        }} />
        
        <div style={{
          ...ringStyle,
          width: 250,
          height: 250,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: '#00f0ff',
          borderRightColor: '#00f0ff',
          boxShadow: '0 0 15px #00f0ff',
          transform: `rotate(${rotate2}deg)`,
        }} />

        <div style={{
          position: 'absolute',
          color: '#ffffff',
          textTransform: 'uppercase',
          letterSpacing: '5px',
          fontWeight: 'bold',
          textShadow: '0 0 10px #00f0ff',
          zIndex: 10,
          fontSize: '48px',
        }}>
          {judul}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 60,
          left: 60,
          display: 'flex',
          gap: '10px',
          zIndex: 20,
        }}>
          {keywordsList.map((tag, i) => (
            <div key={i} style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '8px 16px',
              borderRadius: '4px',
              color: '#00f0ff',
              fontSize: '14px',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              textTransform: 'lowercase',
              fontWeight: '500',
            }}>
              {tag.trim()}
            </div>
          ))}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 60,
          left: 60,
          fontSize: '24px',
          color: '#fff',
          fontWeight: 'bold',
          opacity: 0.8,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '10px'
        }}>
          {judul}
        </div>
      </div>
    </div>
  );
};

export default CyberPunkNeonRingAnimation;