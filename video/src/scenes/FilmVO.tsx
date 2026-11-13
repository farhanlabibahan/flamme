// Motion graphics synced to the voiceover (public/vo.mp4, 4:49).
// Each beat starts at a voiceover timestamp (seconds, from a Whisper transcription).
// Short key-phrase only; *starred* words render in red. Steady camera: each beat
// slides in from the right and out to the left, then holds still.
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { GradeAndVignette, Grain, GridBg, Tag } from "../components/Stage";
import { Flame, LabPanel, O2Slider } from "../components/Lab";
import {
  Aligned, Astronaut, Capsule, Crew, Danger, Dots, EarthFlame, FlameMorph, FormatDoc, Journey, Mismatch,
  NoUpDown, NotSameLanguage, NumberCard, Orbit, Persona, Pill, PlatformDonut, Question, ReadVsExperience,
  Roadmap, Scatter, TenGrid, TwoThings, Vision, Wordmark, ease,
} from "../components/Viz";

const FPS = 30;
const VO_END = 289.6; // voiceover length in seconds
export const TOTAL = Math.ceil((VO_END + 0.4) * FPS);
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

type Beat = { at: number; text?: string; vis?: React.ReactNode; big?: boolean; lab?: boolean };

function Evidence() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 26, justifyContent: "center", maxWidth: 1300 }}>
      {["ISS · FLEX", "ISS · BASS-II", "Saffire · Cygnus", "Drop towers", "NTRS reports"].map((l, i) => (
        <Pill key={l} label={l} d={i * 6} size={40} />
      ))}
    </div>
  );
}

// ---------- BEATS (start times in seconds of the voiceover) ----------
const BEATS: Beat[] = [
  { at: 1.5, vis: <Astronaut />, text: "Imagine you're an *astronaut*" },
  { at: 4.6, vis: <Orbit />, text: "Hundreds of km above *Earth*" },
  { at: 10.0, vis: <Danger />, text: "Something catches *fire*" },
  { at: 12.7, vis: <EarthFlame />, text: "On *Earth*, we know fire" },
  { at: 20.0, vis: <NoUpDown />, text: "In space: no *up*, no *down*" },
  { at: 23.8, vis: <FlameMorph />, text: "Fire behaves *differently*" },
  { at: 35.2, text: "The *frightening* part", big: true },
  { at: 37.2, vis: <Capsule />, text: "You can't *evacuate*" },
  { at: 41.3, vis: <Crew />, text: "Lives depend on *understanding*" },
  { at: 46.8, text: "Our *question*", big: true },
  { at: 48.4, vis: <Question />, text: "Better fire-safety *decisions*?" },
  { at: 59.0, vis: <NumberCard value={24} label="NASA investigations" />, text: "Incredible NASA *experiments*" },
  { at: 64.8, vis: <Evidence />, text: "Valuable *evidence*" },
  { at: 71.7, text: "But there's a *problem*", big: true },
  { at: 73.7, vis: <Scatter />, text: "Evidence is *scattered*" },
  { at: 78.5, vis: <Mismatch />, text: "Conditions go *unreported*" },
  { at: 86.3, vis: <NotSameLanguage />, text: "Not the same *language*" },
  { at: 92.3, vis: <Scatter converge />, text: "*Connect*. Understand. Explore." },
  { at: 98.7, text: "Enter *Flammé*", big: true },
  { at: 101.7, vis: <Wordmark /> },
  { at: 107.0, text: "Our *vision*", big: true },
  { at: 108.8, vis: <Vision /> },
  { at: 113.4, vis: <TwoThings />, text: "We built *two* things" },
  { at: 127.3, vis: <TenGrid />, text: "One set of *conditions*" },
  { at: 134.8, vis: <TenGrid glow={[0, 3, 5, 2, 7, 9]} />, text: "*10* standard conditions" },
  { at: 150.0, vis: <Aligned />, text: "Compare *consistently*" },
  { at: 155.7, vis: <ReadVsExperience />, text: "Don't read it. *Experience* it." },
  { at: 162.0, lab: true },
  { at: 214.0, text: "Bigger than a *simulation*", big: true },
  { at: 216.8, vis: <Persona kind="researcher" title="Researcher" pills={["Material A", "Material B", "Which is safer?"]} /> },
  { at: 221.2, vis: <Persona kind="engineer" title="Engineer" pills={["Self-extinguishes on Earth", "Gentle airflow · microgravity", "Still burning?"]} /> },
  { at: 230.8, vis: <Persona kind="student" title="Student · Bangladesh" pills={["No lab needed", "Explore it in a browser"]} /> },
  { at: 236.7, vis: <Dots rows={3} cols={14} size={40} />, text: "The *impact*" },
  { at: 238.7, vis: <PlatformDonut />, text: "An evidence-driven *platform*" },
  { at: 243.1, vis: <Roadmap /> },
  { at: 255.2, vis: <FormatDoc />, text: "An open reporting *format*" },
  { at: 264.0, vis: <Journey />, text: "Where humanity has never *gone*" },
  { at: 268.1, vis: <Danger />, text: "Dangers we can't *misunderstand*" },
  { at: 273.5, text: "Fire defies *intuition*", big: true },
  { at: 276.1, text: "Safety can't rely on *intuition*", big: true },
  { at: 278.4, vis: <Wordmark sub="University of Dhaka" /> },
  { at: 282.8, vis: <Wordmark sub="Understanding fire beyond Earth" />, text: "To *protect* the people who explore" },
  { at: 286.7, text: "Thank *you*", big: true },
];

// Lab demo key phrases, timed to the voiceover (seconds).
const LAB: Array<{ at: number; text: string; cue?: string }> = [
  { at: 162.0, text: "An interactive *3D* lab" },
  { at: 166.8, text: "Microgravity: a *spherical* flame", cue: "Gravity → microgravity" },
  { at: 177.1, text: "More gravity, new *shape*", cue: "Increase gravity" },
  { at: 180.5, text: "Less oxygen: it *weakens*", cue: "Reduce oxygen" },
  { at: 184.0, text: "*Suppression* agents", cue: "Try suppression" },
  { at: 187.7, text: "Conditions shape *combustion*" },
  { at: 192.2, text: "*Illustrative*, not a CFD simulation" },
  { at: 205.0, text: "A starting point to *explore*" },
];

// ---------- TEXT ----------
// Clean word reveal; *starred* words are red with a soft red glow.
const KeyText: React.FC<{ text: string; size: number }> = ({ text, size }) => {
  const f = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: Math.round(size * 0.26), maxWidth: 1600 }}>
      {words.map((raw, i) => {
        const hot = raw.includes("*");
        const w = raw.replace(/\*/g, "");
        const p = ease(f, 4 + i * 2, 14);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 20}px)`,
              fontFamily: theme.fonts.display,
              fontSize: size,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.06,
              color: hot ? theme.colors.red : "#F2F2F2",
              textShadow: hot
                ? "0 0 18px rgba(255,59,59,0.55), 0 0 50px rgba(255,59,59,0.25)"
                : "0 0 22px rgba(255,255,255,0.18)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Steady move: slide in from the right, hold still, slide out to the left.
const Slide: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [0, 16], [0, 1], { ...CL, easing: theme.ease.out });
  const outP = interpolate(f, [dur - 10, dur], [0, 1], { ...CL, easing: theme.ease.in });
  const x = (1 - inP) * 140 - outP * 140;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: inP * (1 - outP), transform: `translateX(${x}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

const BeatView: React.FC<{ b: Beat; dur: number }> = ({ b, dur }) => (
  <Slide dur={dur}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 60 }}>
      {b.vis && <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{b.vis}</div>}
      {b.text && <KeyText text={b.text} size={b.big ? 150 : b.vis ? 62 : 96} />}
    </div>
  </Slide>
);

// ---------- LAB DEMO ----------
const LabDemo: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const f = useCurrentFrame();
  const t = (sec: number) => Math.round((sec - start) * FPS);
  const ramp = (sec: number, len = 36) => interpolate(f, [t(sec), t(sec) + len], [0, 1], { ...CL, easing: theme.ease.inOut });
  const shape = Math.max(0, Math.min(1, ramp(168.0) - ramp(177.4)));
  const grav = 1 - ramp(168.0) + ramp(177.4);
  const o2 = 21 - 5 * ramp(180.5, 40);
  const sup = ramp(184.5, 45);
  const oxy = Math.max(0.08, (o2 - 16) / 5) * (1 - sup);
  const status = sup > 0.5 ? "Flame out" : o2 < 18.5 ? "Weakening" : grav < 0.5 ? "Spherical · microgravity" : "Teardrop · 1 g";
  const now = start + f / FPS;
  const cue = [...LAB].reverse().find((l) => l.cue && now >= l.at);
  const inP = interpolate(f, [0, 18], [0, 1], { ...CL, easing: theme.ease.out });
  const outP = interpolate(f, [dur - 10, dur], [0, 1], { ...CL, easing: theme.ease.in });
  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 90,
        padding: "0 100px",
        opacity: inP * (1 - outP),
        transform: `translateX(${(1 - inP) * 140 - outP * 140}px)`,
      }}
    >
      <LabPanel title="Flame lab · illustrative" width={860}>
        <div style={{ height: 460, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Flame shape={shape} oxygen={oxy} size={300} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: theme.fonts.mono, fontSize: 24, color: theme.colors.textDim, marginTop: 8 }}>
          <span>
            Gravity <b style={{ color: "#FFFFFF" }}>{grav.toFixed(2)} g</b>
          </span>
          <span>
            Status <b style={{ color: sup > 0.5 ? theme.colors.red : "#FFFFFF" }}>{status}</b>
          </span>
        </div>
        <O2Slider value={o2} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, fontFamily: theme.fonts.mono, fontSize: 22, color: theme.colors.textDim }}>
          {cue ? <Tag key={cue.at}>▸ {cue.cue}</Tag> : <span />}
          <span>Suppression {sup > 0.05 ? "ON" : "OFF"}</span>
        </div>
      </LabPanel>
      <div style={{ width: 700, height: 600, position: "relative" }}>
        {LAB.map((l, i) => {
          const from = t(l.at);
          const to = i + 1 < LAB.length ? t(LAB[i + 1].at) : dur;
          return (
            <Sequence key={i} from={from} durationInFrames={to - from} layout="none">
              <LabLine text={l.text} dur={to - from} />
            </Sequence>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const LabLine: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 8, dur], [1, 0], CL);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", opacity: out }}>
      <div style={{ width: "100%" }}>
        <KeyText text={text} size={70} />
      </div>
    </div>
  );
};

// ---------- FILM ----------
export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: theme.colors.bg }}>
    <GridBg />
    {BEATS.map((b, i) => {
      const from = Math.round(b.at * FPS);
      const next = i + 1 < BEATS.length ? Math.round(BEATS[i + 1].at * FPS) : TOTAL;
      const dur = next - from;
      return (
        <Sequence key={i} from={from} durationInFrames={dur}>
          {b.lab ? <LabDemo start={b.at} dur={dur} /> : <BeatView b={b} dur={dur} />}
        </Sequence>
      );
    })}
    <GradeAndVignette />
    <Grain />
    <Audio src={staticFile("vo.mp4")} />
  </AbsoluteFill>
);
