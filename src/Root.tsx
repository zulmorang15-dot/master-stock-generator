import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { Dashboard } from "./Dashboard";
import React from "react";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. Tampilan Dashboard Utama Kita */}
      <Dashboard />

      {/* 2. Registrasi internal Remotion agar mesin render tahu parameternya */}
      <Composition
        id="Composition"
        component={MyComposition}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};