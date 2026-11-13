// Black-and-white flame and lab widgets. Illustrative, not a simulation.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

// shape: 0 = teardrop (1 g), 1 = sphere (microgravity). oxygen: 0..1 brightness.
export const Flame: React.FC<{ shape: number; size?: number; oxygen?: number }> = ({
  shape,
  size = 340,
  oxygen = 1,
}) => {
  const frame = useCurrentFrame();
  const flicker = 1 + Math.sin(frame / 2.6) * 0.03 + Math.sin(frame / 1.3) * 0.012;
  const topV = interpolate(shape, [0, 1], [78, 50]);
  const botV = interpolate(shape, [0, 1], [22, 50]);
  const a = Math.max(0.08, oxygen);
  const h = interpolate(shape, [0, 1], [size * 1.35, size]) * flicker * (0.55 + 0.45 * oxygen);
  const w = size * (0.62 + 0.38 * shape);
  return (
    <div style={{ position: "relative", width: w, height: h, transform: `translateY(${-(h - size) * 0.35}px)` }}>
      <div
        style={{
          position: "absolute",
          inset: -size * 0.25,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,255,${0.16 * a}), transparent 62%)`,
          filter: "blur(18px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: `50% 50% 50% 50% / ${topV}% ${topV}% ${botV}% ${botV}%`,
          background: "linear-gradient(180deg, #FFFFFF 0%, #E6E6E6 30%, #9A9A9A 70%, rgba(255,255,255,0.15) 100%)",
          opacity: a,
          boxShadow: `0 0 ${60 * a}px rgba(255,255,255,${0.45 * a}), 0 0 ${140 * a}px rgba(255,255,255,${0.18 * a})`,
        }}
      />
    </div>
  );
};

export const LabPanel: React.FC<{ children: React.ReactNode; title: string; width?: number }> = ({
  children,
  title,
  width = 1000,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: theme.spring.smooth });
  return (
    <div
      style={{
        width,
        padding: 28,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(8,8,8,0.78)",
        boxShadow: "0 40px 120px -20px rgba(0,0,0,0.9), 0 0 60px rgba(255,255,255,0.06)",
        opacity: Math.max(0, Math.min(1, p)),
        transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: 22,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: theme.colors.textDim,
          marginBottom: 18,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
};

export const O2Slider: React.FC<{ value: number }> = ({ value }) => {
  const pct = ((value - 12) / (40 - 12)) * 100;
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: theme.fonts.mono, fontSize: 24, color: theme.colors.textDim }}>
        <span>O₂</span>
        <span style={{ color: "#FFFFFF", fontVariantNumeric: "tabular-nums" }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ position: "relative", height: 10, marginTop: 12, borderRadius: 6, background: "rgba(255,255,255,0.1)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, borderRadius: 6, background: "linear-gradient(90deg, #444, #FFFFFF)", boxShadow: "0 0 16px rgba(255,255,255,0.4)" }} />
        <div style={{ position: "absolute", left: `${pct}%`, top: -8, width: 26, height: 26, marginLeft: -13, borderRadius: 13, background: "#FFFFFF", boxShadow: "0 0 20px rgba(255,255,255,0.7)" }} />
      </div>
    </div>
  );
};
