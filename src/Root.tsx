import { Composition, getInputProps } from "remotion";
import MyComposition from "./Composition";
import React from "react";

// Safely read studio-props.json using require to avoid TS2732
let studioProps: any = {};
try {
  studioProps = require("./studio-props.json");
} catch (_) {}

export const RemotionRoot: React.FC = () => {
  const inputConfig = (getInputProps() as any) || {};
  const config = { ...studioProps, ...inputConfig };
  
  const baseDuration = Number(config.durationInFrames) || 300;
  const addTransparentScene = config.addTransparentScene === true || config.addTransparentScene === 'true';
  const dynamicDuration = addTransparentScene ? baseDuration * 2 : baseDuration;
  const dynamicFps = Number(config.fps) || 60;

  return (
    <>
      <Composition
        id="Composition"
        component={MyComposition}
        durationInFrames={dynamicDuration}
        fps={dynamicFps}
        width={1920}
        height={1080}
        defaultProps={{ addTransparentScene }}
      />
    </>
  );
};