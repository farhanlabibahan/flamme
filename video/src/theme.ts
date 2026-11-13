// theme.ts: black and white. Pure black base, white hero, greys for everything else.
import { Easing } from "remotion";

export const theme = {
  colors: {
    bg: "#000000",
    grid: "rgba(255, 255, 255, 0.14)",
    text: "#EDEDED",
    textDim: "#8C8C8C",
    ember: "#FFFFFF", // hero words (glow)
    emberSoft: "rgba(255, 255, 255, 0.45)",
    cyan: "#FFFFFF", // tags and data
    cyanSoft: "rgba(255, 255, 255, 0.35)",
    danger: "#BDBDBD",
  },
  fonts: {
    display: "Space Grotesk, system-ui, sans-serif",
    mono: "JetBrains Mono, ui-monospace, monospace",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 170, mass: 0.6 },
    smooth: { damping: 22, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
