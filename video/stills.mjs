// Render many stills from one bundle: node stills.mjs 120 900 1800 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
import os from "os";

const browserExecutable = path.join(os.homedir(), "Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.tsx") });
const composition = await selectComposition({ serveUrl, id: "JudgingLocal", browserExecutable });
console.log("durationInFrames", composition.durationInFrames);
for (const frame of frames) {
  await renderStill({ serveUrl, composition, frame, output: `out/s_${frame}.png`, browserExecutable, scale: 0.5, overwrite: true });
  console.log("ok", frame);
}
