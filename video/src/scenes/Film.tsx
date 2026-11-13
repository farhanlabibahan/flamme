// Full script as black-and-white motion graphics: visuals on most lines,
// clean word reveals, a gentle camera move per beat. Fits 240 s.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { GradeAndVignette, Grain, GridBg, Tag } from "../components/Stage";
import { Flame, LabPanel, O2Slider } from "../components/Lab";
import {
  Aligned, Astronaut, Capsule, CleanText, Crew, Danger, Dots, EarthFlame, FlameMorph, FormatDoc, Journey,
  Mismatch, NoUpDown, NotSameLanguage, NumberCard, Orbit, Persona, Pill, PlatformDonut, Question,
  ReadVsExperience, Roadmap, Scatter, TenGrid, TwoThings, Vision, Wordmark, ease,
} from "../components/Viz";

type Beat = { t: string; hero?: string[]; vis?: React.ReactNode; size?: number; cue?: string };
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ---------------- SCRIPT ----------------
const hook: Beat[] = [
  { t: "Imagine you're an astronaut.", hero: ["astronaut"], vis: <Astronaut /> },
  { t: "You're hundreds of kilometres above Earth, aboard the International Space Station.", vis: <Orbit /> },
  { t: "Suddenly, something catches fire.", hero: ["fire"], vis: <Danger /> },
  { t: "On Earth, we know what fire looks like. Hot air rises. Flames stretch upwards. We know how to respond.", vis: <EarthFlame /> },
  { t: "But in space?", hero: ["space"], size: 150 },
  { t: "There is no familiar up or down.", hero: ["up", "down"], vis: <NoUpDown /> },
  { t: "The flame doesn't behave the way we expect. It can become almost spherical, burn differently, and even continue burning under conditions where we might expect it to go out.", vis: <FlameMorph /> },
  { t: "And here's the frightening part:", hero: ["frightening"], size: 100 },
  { t: "You cannot simply evacuate a spacecraft when there's a fire.", hero: ["evacuate"], vis: <Capsule /> },
  { t: "The people inside depend on us understanding exactly how fire behaves.", vis: <Crew /> },
  { t: "So, here's our question:", hero: ["question"], size: 110 },
  { t: "How can we make better fire-safety decisions when the science itself is scattered, difficult to compare, and inaccessible to most people?", vis: <Question /> },
];

const problem: Beat[] = [
  { t: "NASA has conducted incredible experiments to understand fire in space.", vis: <NumberCard value={24} label="NASA investigations in our catalogue" /> },
  { t: "From experiments aboard the ISS to the Saffire missions, researchers have collected valuable evidence.", vis: <Evidence /> },
  { t: "But there's a problem.", hero: ["problem"], size: 140 },
  { t: "The evidence is spread across different missions, reports, and experiments.", hero: ["spread"], vis: <Scatter /> },
  { t: "One experiment records airflow. Another records oxygen concentration. Another may leave important conditions unreported.", vis: <Mismatch /> },
  { t: "It's like trying to compare two experiments when neither one is speaking the same language.", vis: <NotSameLanguage /> },
  { t: "We have the evidence.", hero: ["evidence"], vis: <Dots rows={3} cols={12} size={42} /> },
  { t: "But we need a better way to connect it, understand it, and explore it.", hero: ["connect"], vis: <Scatter converge /> },
  { t: "And that's where Flammé comes in.", hero: ["Flammé"], size: 120 },
];

const intro: Beat[] = [
  { t: "Introducing Flammé, developed by Team Flammé from the University of Dhaka.", vis: <Wordmark /> },
  { t: "Our vision is simple:", size: 110 },
  { t: "Make space-fire research understandable, comparable, and accessible.", vis: <Vision /> },
  { t: "And we started by building two things.", hero: ["two"], size: 100 },
  { t: "A common language for describing experiments, and an interactive laboratory where anyone can explore how fire behaves in space.", vis: <TwoThings /> },
];

const demoA: Beat[] = [
  { t: "First, we asked ourselves: What if every space-fire experiment could be described using the same set of conditions?", hero: ["same"], vis: <TenGrid /> },
  { t: "So we created a standard catalogue of ten conditions, covering everything from the material being burned to oxygen, airflow, gravity, ignition, and suppression.", vis: <TenGrid glow={[0, 3, 5, 2, 7, 9]} /> },
  { t: "This gives us a foundation for comparing experiments consistently.", vis: <Aligned /> },
  { t: "But we didn't want people to just read about microgravity fire. We wanted them to experience it.", hero: ["experience"], vis: <ReadVsExperience /> },
];

const demoB: Beat[] = [
  { t: "So we built an interactive 3D flame laboratory. Let's take a look.", cue: "Lab ready · gravity 1 g" },
  { t: "Look at that. Instead of the familiar candle-like flame, we see a much more spherical flame.", hero: ["spherical"], cue: "Change gravity to microgravity" },
  { t: "As gravity increases, the flame changes shape.", hero: ["shape"], cue: "Increase gravity" },
  { t: "Now the flame begins to weaken.", hero: ["weaken"], cue: "Reduce oxygen or airflow" },
  { t: "And we can explore how different suppression agents affect the flame.", hero: ["suppression"], cue: "Try suppression" },
  { t: "Every change helps explain how different conditions can influence combustion." },
  { t: "Our current flame behaviour is illustrative, not a computational fluid dynamics simulation. It demonstrates expected trends rather than claiming to reproduce NASA experimental measurements.", size: 34 },
  { t: "But this is our starting point: making an otherwise inaccessible scientific phenomenon something people can actually explore.", hero: ["explore"] },
];

const impact: Beat[] = [
  { t: "But Flammé is bigger than a 3D simulation.", hero: ["bigger"], size: 110 },
  { t: "Imagine a researcher comparing two materials before choosing one for a spacecraft.", vis: <Persona kind="researcher" title="Researcher" pills={["Material A", "Material B", "Which is safer?"]} /> },
  { t: "Imagine an engineer asking whether a material that extinguishes itself on Earth might continue burning under gentle airflow in microgravity.", vis: <Persona kind="engineer" title="Engineer" pills={["Self-extinguishes on Earth", "Gentle airflow · microgravity", "Still burning?"]} /> },
  { t: "Imagine a student in Bangladesh exploring a phenomenon that they would otherwise never have access to.", vis: <Persona kind="student" title="Student · Bangladesh" pills={["No lab needed", "Explore it in a browser"]} /> },
  { t: "That's the impact we want to create.", hero: ["impact"], vis: <Dots rows={3} cols={14} size={40} /> },
  { t: "Our next step is to turn Flammé into an evidence-driven research platform.", hero: ["evidence-driven"], vis: <PlatformDonut /> },
  { t: "We plan to build a source-linked database of NASA experiments, compare their conditions, identify gaps in existing research, and eventually ground our flame model in real experimental data.", vis: <Roadmap /> },
  { t: "We also want to publish our standard reporting format so future experiments can contribute evidence in a consistent way.", vis: <FormatDoc /> },
];

const closing: Beat[] = [
  { t: "Space exploration is about going where humanity has never gone before.", vis: <Journey /> },
  { t: "But going further also means preparing for dangers we cannot afford to misunderstand.", hero: ["dangers"], vis: <Danger /> },
  { t: "Fire doesn't follow our intuition in space.", hero: ["intuition"], size: 110 },
  { t: "And safety cannot depend on intuition alone.", hero: ["safety"], size: 110 },
  { t: "We are Team Flammé from the University of Dhaka.", vis: <Wordmark sub="University of Dhaka" /> },
  { t: "Flammé — Understanding fire beyond Earth, to protect the people who explore it.", hero: ["Understanding", "protect"], vis: <Wordmark sub="Understanding fire beyond Earth" /> },
  { t: "Thank you.", hero: ["Thank", "you."], size: 160 },
];

function Evidence() {
  const labels = ["ISS · FLEX", "ISS · BASS-II", "Saffire · Cygnus", "Drop towers", "NTRS reports"];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 26, justifyContent: "center", maxWidth: 1300 }}>
      {labels.map((l, i) => (
        <Pill key={l} label={l} d={i * 8} size={40} />
      ))}
    </div>
  );
}

// ---------------- TIMING (auto-fit to 238 s) ----------------
const SECTIONS: Array<{ num: string; name: string; beats: Beat[]; lab?: boolean }> = [
  { num: "01", name: "The hook", beats: hook },
  { num: "02", name: "The problem", beats: problem },
  { num: "03", name: "Introducing Flammé", beats: intro },
  { num: "04", name: "The demonstration", beats: demoA },
  { num: "04", name: "The demonstration", beats: demoB, lab: true },
  { num: "05", name: "Impact and future", beats: impact },
  { num: "06", name: "Closing", beats: closing },
];
const TARGET = 238 * 30;
const PAD = 14;
const words = (b: Beat) => b.t.split(" ").length;
const allBeats = SECTIONS.flatMap((s) => s.beats);
const PER_WORD = (TARGET - PAD * allBeats.length) / allBeats.reduce((a, b) => a + words(b), 0);
const lay = (beats: Beat[]) => {
  let c = 0;
  return beats.map((b) => {
    const d = Math.round(words(b) * PER_WORD + PAD);
    const r = { b, from: c, dur: d };
    c += d;
    return r;
  });
};
const sectionLen = (beats: Beat[]) => lay(beats).reduce((a, r) => a + r.dur, 0);
export const TOTAL = SECTIONS.reduce((a, s) => a + sectionLen(s.beats), 0);

// ---------------- RENDERING ----------------
const autoSize = (b: Beat) => {
  if (b.size) return b.size;
  const n = words(b);
  if (b.vis) return n > 18 ? 40 : n > 10 ? 48 : 58;
  return n <= 5 ? 130 : n <= 10 ? 90 : 62;
};

// One beat: visual + caption, with its own slow camera move and a quick exit.
const BeatView: React.FC<{ b: Beat; dur: number; idx: number }> = ({ b, dur, idx }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, dur], [0, 1], { ...CL, easing: theme.ease.inOut });
  const moves = [
    { s0: 1.0, s1: 1.07, x0: 0, x1: 0, r0: 0, r1: 0 },
    { s0: 1.08, s1: 1.0, x0: 0, x1: 0, r0: 0, r1: 0 },
    { s0: 1.04, s1: 1.04, x0: 40, x1: -40, r0: -4, r1: 4 },
    { s0: 1.04, s1: 1.04, x0: -40, x1: 40, r0: 4, r1: -4 },
  ];
  const m = moves[idx % moves.length];
  const s = m.s0 + (m.s1 - m.s0) * t;
  const x = m.x0 + (m.x1 - m.x0) * t;
  const ry = m.r0 + (m.r1 - m.r0) * t;
  const out = interpolate(f, [dur - 9, dur], [1, 0], CL);
  const outY = interpolate(f, [dur - 9, dur], [0, -14], CL);
  const size = autoSize(b);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1600 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 54,
          opacity: out,
          transform: `translate(${x}px, ${outY}px) rotateY(${ry}deg) scale(${s})`,
        }}
      >
        {b.vis && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420 }}>{b.vis}</div>}
        <CleanText text={b.t} size={size} hero={b.hero} maxWidth={b.vis ? 1500 : 1600} />
      </div>
    </AbsoluteFill>
  );
};

const Frame: React.FC<{ num: string; name: string; dur: number; children: React.ReactNode }> = ({ num, name, dur, children }) => {
  const f = useCurrentFrame();
  const bar = interpolate(f, [0, dur], [0, 100], CL);
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <GridBg />
      {children}
      <div style={{ position: "absolute", top: 56, left: 80 }}>
        <Tag>
          {num} · {name}
        </Tag>
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: `${bar}%`, background: "#FFFFFF", boxShadow: "0 0 16px #FFFFFF" }} />
      <GradeAndVignette />
      <Grain />
    </AbsoluteFill>
  );
};

const Beats: React.FC<{ beats: Beat[]; offset: number }> = ({ beats, offset }) => (
  <>
    {lay(beats).map((r, i) => (
      <Sequence key={i} from={r.from} durationInFrames={r.dur}>
        <BeatView b={r.b} dur={r.dur} idx={i + offset} />
      </Sequence>
    ))}
  </>
);

// Lab demo: the lab panel stays on the left; its state follows the narration lines on the right.
const LabDemo: React.FC = () => {
  const f = useCurrentFrame();
  const L = lay(demoB);
  const s = (i: number) => L[i].from + 6;
  const ramp = (from: number, len = 36) => interpolate(f, [from, from + len], [0, 1], { ...CL, easing: theme.ease.inOut });
  const toSphere = ramp(s(1)) - ramp(s(2));
  const grav = 1 - ramp(s(1)) + ramp(s(2));
  const o2 = 21 - 5 * ramp(s(3), 60);
  const sup = ramp(s(4), 45);
  const oxy = Math.max(0.08, (o2 - 16) / 5) * (1 - sup);
  const status = sup > 0.5 ? "Flame out" : o2 < 18.5 ? "Weakening" : grav < 0.5 ? "Spherical · microgravity" : "Teardrop · 1 g";
  const cueIdx = [...L].map((r, i) => ({ r, i })).reverse().find(({ r }) => r.b.cue && f >= r.from);
  const panelIn = ease(f, 0, 24);
  return (
    <AbsoluteFill style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 80, padding: "0 100px" }}>
      <div style={{ opacity: panelIn, transform: `translateX(${(1 - panelIn) * -40}px) perspective(1600px) rotateY(${6 - 4 * Math.sin(f / 200)}deg)` }}>
        <LabPanel title="Flame lab · illustrative" width={860}>
          <div style={{ height: 460, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Flame shape={Math.max(0, Math.min(1, toSphere))} oxygen={oxy} size={300} />
            {sup > 0 && (
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle, rgba(255,255,255,${0.12 * sup}), transparent 60%)` }} />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: theme.fonts.mono, fontSize: 24, color: theme.colors.textDim, marginTop: 8 }}>
            <span>
              Gravity <b style={{ color: "#FFFFFF" }}>{grav.toFixed(2)} g</b>
            </span>
            <span>
              Status <b style={{ color: "#FFFFFF" }}>{status}</b>
            </span>
          </div>
          <O2Slider value={o2} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, fontFamily: theme.fonts.mono, fontSize: 22, color: theme.colors.textDim }}>
            {cueIdx ? <Tag key={cueIdx.i}>▸ {cueIdx.r.b.cue}</Tag> : <span />}
            <span>Suppression {sup > 0.05 ? "ON" : "OFF"}</span>
          </div>
        </LabPanel>
      </div>
      <div style={{ width: 700, height: 700, position: "relative" }}>
        {L.map((r, i) => (
          <Sequence key={i} from={r.from} durationInFrames={r.dur} layout="none">
            <LabLine b={r.b} dur={r.dur} />
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const LabLine: React.FC<{ b: Beat; dur: number }> = ({ b, dur }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 9, dur], [1, 0], CL);
  const n = words(b);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", opacity: out }}>
      <CleanText text={b.t} size={b.size ?? (n > 14 ? 46 : 58)} hero={b.hero} maxWidth={700} align="flex-start" />
    </div>
  );
};

export const Film: React.FC = () => {
  let t = 0;
  let beatCount = 0;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      {SECTIONS.map((sec, i) => {
        const d = sectionLen(sec.beats);
        const from = t;
        t += d;
        const offset = beatCount;
        beatCount += sec.beats.length;
        return (
          <Sequence key={i} from={from} durationInFrames={d}>
            <Frame num={sec.num} name={sec.name} dur={d}>
              {sec.lab ? <LabDemo /> : <Beats beats={sec.beats} offset={offset} />}
            </Frame>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
