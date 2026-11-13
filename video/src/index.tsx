import React from "react";
import { Composition, registerRoot } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { Film, TOTAL } from "./scenes/FilmVO";
import { FPS, WIDTH, HEIGHT } from "./theme";

// Load fonts before any frame renders, so text never swaps mid-animation.
loadDisplay("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const Root: React.FC = () => (
  <Composition id="JudgingLocal" component={Film} durationInFrames={TOTAL} fps={FPS} width={WIDTH} height={HEIGHT} />
);

registerRoot(Root);
