// Shared visual layers: black grid background, grade, grain, vignette,
// camera rig (dynamic push/pan/roll), and text helpers with glow.
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { theme } from "../theme";

// Layer 1: black background with a perspective grid that drifts forward.
export const GridBg: React.FC<{ tilt?: number }> = ({ tilt = 0 }) => {
  const frame = useCurrentFrame();
  const drift = 0; // steady background (no drifting grid)
  const glowX = 50;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: "-50%",
          right: "-50%",
          top: "38%",
          bottom: "-40%",
          transform: `perspective(700px) rotateX(${62 + tilt}deg)`,
          transformOrigin: "50% 0%",
          backgroundImage: `linear-gradient(${theme.colors.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.grid} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          backgroundPosition: `0px ${drift}px`,
          maskImage: "linear-gradient(to bottom, transparent, black 40%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 40%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          left: `${glowX - 30}%`,
          top: -420,
          background: `radial-gradient(circle, ${theme.colors.emberSoft.replace("0.45", "0.10")}, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  );
};

// Layer 4 + 5: grade and vignette. Always on top of content.
export const GradeAndVignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
      }}
    />
  </AbsoluteFill>
);

// Layer 5: film grain, procedural, no asset file.
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: noise,
        backgroundSize: "200px",
        backgroundPosition: `${(frame * 37) % 200}px ${(frame * 53) % 200}px`,
        opacity: 0.07,
        mixBlendMode: "overlay",
      }}
    />
  );
};

// Dynamic camera: a rig wrapping scene content. Combines a slow idle drift
// with a per-scene move (push-in, lateral dolly, roll, crash zoom).
export type CamMove = "push" | "dollyLeft" | "dollyRight" | "crash" | "orbit" | "pull";

export const Camera: React.FC<{
  move?: CamMove;
  children: React.ReactNode;
  strength?: number;
}> = ({ move = "push", children, strength = 1 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = theme.ease.inOut(t);
  const idleX = Math.sin(frame / 70) * 6 * strength;
  const idleY = Math.cos(frame / 95) * 4 * strength;

  let scale = 1;
  let x = 0;
  let rot = 0;
  switch (move) {
    case "push":
      scale = 1 + 0.12 * eased * strength;
      break;
    case "pull":
      scale = 1.14 - 0.14 * eased * strength;
      break;
    case "dollyLeft":
      x = -90 * eased * strength;
      scale = 1.05;
      break;
    case "dollyRight":
      x = 90 * eased * strength;
      scale = 1.05;
      break;
    case "crash": {
      // fast push-in then settle: the punch-in on a hit
      const k = interpolate(frame, [0, 12, durationInFrames], [1.22, 1.0, 1.04], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: theme.ease.out,
      });
      scale = k;
      break;
    }
    case "orbit":
      rot = -2.2 * eased * strength;
      scale = 1.06;
      break;
  }

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x + idleX}px, ${idleY}px) rotate(${rot}deg) scale(${scale})`,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Glowing headline text. Ember glow on the hero word only.
export const GlowText: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  glow?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 120, color = theme.colors.text, glow, weight = 700, style }) => (
  <div
    style={{
      fontFamily: theme.fonts.display,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: "-0.03em",
      lineHeight: 1.04,
      color,
      textShadow: glow
        ? `0 0 18px ${glow}, 0 0 48px ${glow}`
        : "0 2px 30px rgba(0,0,0,0.5)",
      ...style,
    }}
  >
    {children}
  </div>
);

// Word-by-word reveal with spring, staggered, lift + scale + blur-in.
export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  per?: number;
  size?: number;
  hero?: string[]; // words to highlight in ember
  style?: React.CSSProperties;
}> = ({ text, delay = 0, per = 3, size = 120, hero = [], style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 22,
        justifyContent: "center",
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = spring({
          frame: frame - delay - i * per,
          fps,
          config: theme.spring.snappy,
        });
        const isHero = hero.some((h) => w.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === h.toLowerCase());
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [42, 0])}px) scale(${interpolate(p, [0, 1], [0.92, 1])})`,
              filter: `blur(${interpolate(p, [0, 1], [8, 0])}px)`,
              fontFamily: theme.fonts.display,
              fontSize: size,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.04,
              color: isHero ? theme.colors.ember : theme.colors.text,
              textShadow: isHero
                ? `0 0 16px ${theme.colors.emberSoft}, 0 0 60px ${theme.colors.emberSoft}`
                : "0 2px 30px rgba(0,0,0,0.5)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Small mono label: source tags, lower-thirds, timecodes.
export const Tag: React.FC<{ children: React.ReactNode; color?: string; delay?: number }> = ({
  children,
  color = theme.colors.cyan,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.snappy });
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontFamily: theme.fonts.mono,
        fontSize: 26,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        border: `1.5px solid ${color}`,
        borderRadius: 4,
        padding: "10px 18px",
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px)`,
        boxShadow: `0 0 24px ${color}40`,
        background: "rgba(5,7,11,0.6)",
      }}
    >
      {children}
    </div>
  );
};

// Exit wrapper: fades and lifts over the last N frames of a scene.
export const SceneExit: React.FC<{ frames?: number; children: React.ReactNode }> = ({
  frames = 12,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const start = durationInFrames - frames;
  const o = interpolate(frame, [start, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.in,
  });
  const y = interpolate(frame, [start, durationInFrames - 1], [0, -30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.in,
  });
  return (
    <AbsoluteFill style={{ opacity: o, transform: `translateY(${y}px)` }}>
      {children}
    </AbsoluteFill>
  );
};
