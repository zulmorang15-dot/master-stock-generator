import { Composition, getInputProps } from "remotion";
import MyComposition from "./Composition";
import { Dashboard } from "./Dashboard";
import React from "react";


export const RemotionRoot: React.FC = () => {
  // Membaca durasi dinamis yang dikirim dari cloud, jika tidak ada default-nya 150 frame
  const config = (getInputProps() as any) || {};
  const dynamicDuration = config.durationInFrames || 150;
  const dynamicFps = config.fps || 30;

  return (
    <>
      <Dashboard />
      <Composition
        id="Composition"
        component={MyComposition}
        durationInFrames={dynamicDuration} // <-- Sekarang durasinya dinamis!
        fps={dynamicFps}
        width={1920}
        height={1080}
      />
    </>
  );
};