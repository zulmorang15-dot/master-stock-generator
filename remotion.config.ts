/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Tentukan OpenGL renderer untuk Chromium.
// - Secara default, kita gunakan "swiftshader" (software rendering) agar tidak crash di server RDP/VPS yang tidak punya GPU.
// - Jika server RDP Anda memiliki GPU dan Anda ingin render lebih cepat menggunakan hardware acceleration,
//   tambahkan baris `REMOTION_GL_RENDERER=angle` atau `REMOTION_GL_RENDERER=default` di file .env Anda.
const glRenderer = process.env.REMOTION_GL_RENDERER || "swiftshader";

if (glRenderer !== "default") {
  Config.setChromiumOpenGlRenderer(glRenderer as any);
}

Config.overrideWebpackConfig(enableTailwind);
