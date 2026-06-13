import React, { useMemo } from 'react';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';

const ORIGINAL_WIDTH = 1920;
const ORIGINAL_HEIGHT = 1080;

export const YoutubeEndScreen: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scaleFactor = Math.min(width / ORIGINAL_WIDTH, height / ORIGINAL_HEIGHT);

  // 1. Background Gradient Motion
  // Cycle duration: 15 seconds = 450 frames (divides 900 perfectly)
  const bgX = interpolate(
    frame % 450,
    [0, 225, 450],
    [0, 100, 0],
    { easing: Easing.inOut(Easing.quad) }
  );

  // 2. Decorative Skewed Bands (Symmetrical 30s Loop)
  // Top band (::before equivalent)
  // Period: 15s one-way = 450 frames. Round-trip: 30s = 900 frames.
  const transXAtas = interpolate(
    frame,
    [0, 450, 900],
    [-5, 5, -5],
    { easing: Easing.inOut(Easing.quad) }
  );
  const opacityAtas = interpolate(
    frame,
    [0, 450, 900],
    [0.5, 1, 0.5],
    { easing: Easing.inOut(Easing.quad) }
  );

  // Bottom band (::after equivalent)
  // Period: 7.5s one-way = 225 frames. Round-trip: 15s = 450 frames.
  const transXBawah = interpolate(
    frame % 450,
    [0, 225, 450],
    [5, -5, 5],
    { easing: Easing.inOut(Easing.quad) }
  );
  const opacityBawah = interpolate(
    frame % 450,
    [0, 225, 450],
    [1, 0.3, 1],
    { easing: Easing.inOut(Easing.quad) }
  );

  // 3. Border Lines around "SUBSCRIBE"
  // Border cycle: 2 seconds = 60 frames
  const borderFrame = frame % 60;
  
  // Span 1: Top Line (0s delay)
  const leftPos1 = interpolate(borderFrame, [0, 30, 60], [-100, 100, 100], { extrapolateRight: 'clamp' });
  
  // Span 2: Right Line (0.5s delay = 15 frames)
  const borderFrame2 = (frame + 45) % 60;
  const topPos2 = interpolate(borderFrame2, [0, 30, 60], [-100, 100, 100], { extrapolateRight: 'clamp' });
  
  // Span 3: Bottom Line (1.0s delay = 30 frames)
  const borderFrame3 = (frame + 30) % 60;
  const rightPos3 = interpolate(borderFrame3, [0, 30, 60], [-100, 100, 100], { extrapolateRight: 'clamp' });
  
  // Span 4: Left Line (1.5s delay = 45 frames)
  const borderFrame4 = (frame + 15) % 60;
  const bottomPos4 = interpolate(borderFrame4, [0, 30, 60], [-100, 100, 100], { extrapolateRight: 'clamp' });

  // 4. Meteor Lines (Symmetrical Loop)
  // Line 1: Period 3s = 90 frames
  const mFrame1 = frame % 90;
  const mX1 = interpolate(mFrame1, [0, 90], [384, -2880]);
  const mOp1 = interpolate(mFrame1, [0, 90], [1, 0]);

  // Line 2: Period 5s = 150 frames. Delay 1.5s = 45 frames
  const mFrame2 = (frame + 105) % 150;
  const mX2 = interpolate(mFrame2, [0, 150], [384, -2880]);
  const mOp2 = interpolate(mFrame2, [0, 150], [1, 0]);

  // Line 3: Period 2.5s = 75 frames. Delay 2.2s = 66 frames
  const mFrame3 = (frame + 9) % 75;
  const mX3 = interpolate(mFrame3, [0, 75], [384, -2880]);
  const mOp3 = interpolate(mFrame3, [0, 75], [1, 0]);

  // 5. Video Boxes Breathing Animation (Period 5s = 150 frames)
  // Left Video
  const scaleLeft = interpolate(frame % 150, [0, 75, 150], [1, 1.04, 1], { easing: Easing.inOut(Easing.quad) });
  const shadowLeft = interpolate(frame % 150, [0, 75, 150], [19.2, 38.4, 19.2]);
  
  // Right Video (Offset phase)
  const scaleRight = interpolate((frame + 75) % 150, [0, 75, 150], [1, 1.04, 1], { easing: Easing.inOut(Easing.quad) });
  const shadowRight = interpolate((frame + 75) % 150, [0, 75, 150], [19.2, 38.4, 19.2]);

  // Profile Circle Breathing (Period 5s = 150 frames, offset phase)
  const scaleProfile = interpolate((frame + 35) % 150, [0, 75, 150], [1, 1.06, 1], { easing: Easing.inOut(Easing.quad) });

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
        backgroundColor: '#111',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 0 30px rgba(0,0,0,0.8)',
      }}
    >
      {/* 1. Dynamic Background Layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #2b0000 0%, #aa0000 25%, #400000 50%, #e60000 75%, #2b0000 100%)',
          backgroundSize: '400% 400%',
          backgroundPosition: `${bgX}% 50%`,
          zIndex: 0,
        }}
      />

      {/* 2. Abstract Red Decorative Waves (Skewed) */}
      <div
        style={{
          position: 'absolute',
          width: '3840px', // 200%
          height: '540px', // 50%
          top: '-108px', // -10%
          left: '-960px', // -50%
          background: 'linear-gradient(90deg, rgba(255,0,0,0) 0%, rgba(200,0,0,0.4) 50%, rgba(255,0,0,0) 100%)',
          transform: `skewX(-45deg) translateX(${transXAtas}%)`,
          opacity: opacityAtas,
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '3840px', // 200%
          height: '756px', // 70%
          bottom: '-216px', // -20%
          right: '-960px', // -50%
          background: 'linear-gradient(90deg, rgba(150,0,0,0) 0%, rgba(255,0,0,0.2) 50%, rgba(150,0,0,0) 100%)',
          transform: `skewX(-45deg) translateX(${transXBawah}%)`,
          opacity: opacityBawah,
          zIndex: 1,
        }}
      />

      {/* 3. Meteor Lines */}
      <div
        style={{
          position: 'absolute',
          width: '288px', // 15cqw
          height: '3.84px', // 0.2cqw
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
          transform: `rotate(-45deg) translateX(${mX1}px)`,
          top: '-192px', // -10cqw
          right: '192px', // 10cqw
          zIndex: 1,
          opacity: mOp1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '384px', // 20cqw
          height: '3.84px', // 0.2cqw
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
          transform: `rotate(-45deg) translateX(${mX2}px)`,
          top: '192px', // 10cqw
          right: '-192px', // -10cqw
          zIndex: 1,
          opacity: mOp2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '192px', // 10cqw
          height: '3.84px', // 0.2cqw
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
          transform: `rotate(-45deg) translateX(${mX3}px)`,
          top: '-384px', // -20cqw
          right: '960px', // 50cqw
          zIndex: 1,
          opacity: mOp3,
        }}
      />

      {/* Header "SUBSCRIBE" Area */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: '96px', // 5cqw
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            color: '#ffffff',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: '115.2px', // 6cqw
            fontStyle: 'italic',
            fontWeight: 900,
            letterSpacing: '3.84px', // 0.2cqw
            textTransform: 'uppercase',
            position: 'relative',
            padding: '28.8px 57.6px', // 1.5cqw 3cqw
            overflow: 'hidden',
          }}
        >
          {/* Animated border lines */}
          <span
            style={{
              position: 'absolute',
              background: '#ffffff',
              top: 0,
              left: `${leftPos1}%`,
              width: '100%',
              height: '5.76px', // 0.3cqw
            }}
          />
          <span
            style={{
              position: 'absolute',
              background: '#ffffff',
              top: `${topPos2}%`,
              right: 0,
              width: '5.76px', // 0.3cqw
              height: '100%',
            }}
          />
          <span
            style={{
              position: 'absolute',
              background: '#ffffff',
              bottom: 0,
              right: `${rightPos3}%`,
              width: '100%',
              height: '5.76px', // 0.3cqw
            }}
          />
          <span
            style={{
              position: 'absolute',
              background: '#ffffff',
              bottom: `${bottomPos4}%`,
              left: 0,
              width: '5.76px', // 0.3cqw
              height: '100%',
            }}
          />
          SUBSCRIBE
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          width: '86%', // 1651.2px
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '115.2px', // 6cqw
        }}
      >
        {/* Left Watch More Box */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '512px', // 31%
          }}
        >
          <div
            style={{
              width: '100%',
              height: '288px', // aspect-ratio 16:9
              backgroundColor: '#ffffff',
              borderRadius: '7.68px', // 0.4cqw
              transform: `scale(${scaleLeft})`,
              boxShadow: `0 ${shadowLeft}px ${shadowLeft * 2}px rgba(0, 0, 0, 0.4)`,
              transformOrigin: 'center center',
            }}
          />
          <div
            style={{
              color: '#ffffff',
              fontSize: '38.4px', // 2cqw
              marginTop: '28.8px', // 1.5cqw
              fontWeight: 300,
              letterSpacing: '1.92px', // 0.1cqw
              textTransform: 'uppercase',
              textAlign: 'left',
              fontFamily: "'Arial', sans-serif",
            }}
          >
            WATCH MORE
          </div>
        </div>

        {/* Center Profile Circle */}
        <div
          style={{
            width: '363px', // 22%
            display: 'flex',
            justifyContent: 'center',
            marginTop: '-57.6px', // -3cqw
          }}
        >
          <div
            style={{
              width: '100%',
              height: '363px', // aspect-ratio 1:1
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              transform: `scale(${scaleProfile})`,
              boxShadow: '0 19.2px 38.4px rgba(0, 0, 0, 0.4)',
              transformOrigin: 'center center',
            }}
          />
        </div>

        {/* Right Suggestion Box */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '512px', // 31%
          }}
        >
          <div
            style={{
              width: '100%',
              height: '288px', // aspect-ratio 16:9
              backgroundColor: '#ffffff',
              borderRadius: '7.68px', // 0.4cqw
              transform: `scale(${scaleRight})`,
              boxShadow: `0 ${shadowRight}px ${shadowRight * 2}px rgba(0, 0, 0, 0.4)`,
              transformOrigin: 'center center',
            }}
          />
          <div
            style={{
              color: '#ffffff',
              fontSize: '38.4px', // 2cqw
              marginTop: '28.8px', // 1.5cqw
              fontWeight: 300,
              letterSpacing: '1.92px', // 0.1cqw
              textTransform: 'uppercase',
              textAlign: 'right',
              fontFamily: "'Arial', sans-serif",
            }}
          >
            MY SUGGESTION
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeEndScreen;
// END_OF_FILE