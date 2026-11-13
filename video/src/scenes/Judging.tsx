// Full narration script as black-and-white motion graphics. Static camera.
// Each line's on-screen time is derived from its word count, so timing follows the script.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { theme } from "../theme";
import { GradeAndVignette, Grain, GridBg, Tag, WordReveal } from "../components/Stage";
import { Flame, LabPanel, O2Slider } from "../components/Lab";

type Line = {
  t: string;
  size?: number;
  hero?: string[];
  cue?: string; // stage direction from the script (shown as a tag, not narrated)
  pre?: React.ReactNode;
  post?: React.ReactNode;
};

const PER_WORD = 11; // ~2.7 words per second narration pace
const PAD = 16;
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const lay = (lines: Line[]) => {
  let c = 0;
  return lines.map((l) => {
    const d = l.t.split(" ").length * PER_WORD + PAD;
    const r = { l, from: c, to: c + d };
    c += d;
    return r;
  });
};
const span = (lines: Line[]) => lay(lines).reduce((a, r) => Math.max(a, r.to), 0);

// Shows children only inside [from, to]; springs in, fades out before the next line.
const Show: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from - 2 || frame > to) return null;
  const p = spring({ frame: frame - from, fps, config: theme.spring.smooth });
  const out = interpolate(frame, [to - 10, to], [1, 0], CL);
  return (
    <div
      style={{
        opacity: Math.max(0, Math.min(1, p)) * out,
        transform: `translateY(${interpolate(p, [0, 1], [24, 0], CL)}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        maxWidth: 1500,
      }}
    >
      {children}
    </div>
  );
};

const Lines: React.FC<{ lines: Line[]; size?: number }> = ({ lines, size = 64 }) => (
  <>
    {lay(lines).map((r, i) => (
      <Show key={i} from={r.from} to={r.to}>
        {r.l.pre}
        <WordReveal text={r.l.t} delay={r.from} size={r.l.size ?? size} hero={r.l.hero ?? []} />
        {r.l.post}
      </Show>
    ))}
  </>
);

// Every scene: grid, content, section tag, progress line, grade, grain.
const Stage: React.FC<{ num: string; name: string; dur: number; children: React.ReactNode }> = ({
  num,
  name,
  dur,
  children,
}) => {
  const frame = useCurrentFrame();
  const bar = interpolate(frame, [0, dur], [0, 100], CL);
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <GridBg />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>{children}</AbsoluteFill>
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

// ---------- 01 · HOOK ----------
const hookLines: Line[] = [
  { t: "Imagine you're an astronaut.", size: 96, hero: ["astronaut"] },
  { t: "You're hundreds of kilometres above Earth, aboard the International Space Station." },
  { t: "Suddenly, something catches fire.", size: 84, hero: ["fire"], pre: <Flame shape={0} size={200} /> },
  { t: "On Earth, we know what fire looks like. Hot air rises. Flames stretch upwards. We know how to respond." },
  { t: "But in space?", size: 120, hero: ["space"] },
  { t: "There is no familiar up or down.", size: 72 },
  { t: "The flame doesn't behave the way we expect. It can become almost spherical, burn differently, and even continue burning under conditions where we might expect it to go out." },
  { t: "And here's the frightening part:", size: 72 },
  { t: "You cannot simply evacuate a spacecraft when there's a fire.", size: 80, hero: ["evacuate"] },
  { t: "The people inside depend on us understanding exactly how fire behaves." },
  { t: "So, here's our question:", size: 72 },
  { t: "How can we make better fire-safety decisions when the science itself is scattered, difficult to compare, and inaccessible to most people?", size: 60 },
];

// ---------- 02 · THE PROBLEM ----------
const problemLines: Line[] = [
  { t: "NASA has conducted incredible experiments to understand fire in space." },
  { t: "From experiments aboard the ISS to the Saffire missions, researchers have collected valuable evidence." },
  { t: "But there's a problem.", size: 110, hero: ["problem"] },
  { t: "The evidence is spread across different missions, reports, and experiments." },
  { t: "One experiment records airflow. Another records oxygen concentration. Another may leave important conditions unreported." },
  { t: "It's like trying to compare two experiments when neither one is speaking the same language.", size: 58 },
  { t: "We have the evidence.", size: 80 },
  { t: "But we need a better way to connect it, understand it, and explore it." },
  { t: "And that's where Flammé comes in.", size: 96, hero: ["Flammé"] },
];

// ---------- 03 · INTRODUCING FLAMMÉ ----------
const introLines: Line[] = [
  { t: "Introducing Flammé, developed by Team Flammé from the University of Dhaka.", size: 74, hero: ["Flammé"] },
  { t: "Our vision is simple:", size: 56 },
  { t: "Make space-fire research understandable, comparable, and accessible.", size: 80 },
  { t: "And we started by building two things.", size: 56 },
  {
    t: "A common language for describing experiments, and an interactive laboratory where anyone can explore how fire behaves in space.",
    size: 56,
    post: (
      <div style={{ display: "flex", gap: 24, marginTop: 10 }}>
        <Tag>01 · Common language · 10 conditions</Tag>
        <Tag>02 · Interactive flame lab</Tag>
      </div>
    ),
  },
];

// ---------- 04 · THE DEMONSTRATION (lab on the left, narration on the right) ----------
const demoLines: Line[] = [
  { t: "First, we asked ourselves: What if every space-fire experiment could be described using the same set of conditions?" },
  { t: "So we created a standard catalogue of ten conditions, covering everything from the material being burned to oxygen, airflow, gravity, ignition, and suppression." },
  { t: "This gives us a foundation for comparing experiments consistently." },
  { t: "But we didn't want people to just read about microgravity fire. We wanted them to experience it." },
  { t: "So we built an interactive 3D flame laboratory. Let's take a look.", cue: "Lab ready · gravity 1 g" },
  { t: "Look at that. Instead of the familiar candle-like flame, we see a much more spherical flame.", cue: "Change gravity to microgravity" },
  { t: "As gravity increases, the flame changes shape.", cue: "Increase gravity" },
  { t: "Now the flame begins to weaken.", cue: "Reduce oxygen or airflow" },
  { t: "And we can explore how different suppression agents affect the flame.", cue: "Try suppression" },
  { t: "Every change helps explain how different conditions can influence combustion." },
  {
    t: "Our current flame behaviour is illustrative, not a computational fluid dynamics simulation. It demonstrates expected trends rather than claiming to reproduce NASA experimental measurements.",
    size: 30,
  },
  { t: "But this is our starting point: making an otherwise inaccessible scientific phenomenon something people can actually explore." },
];

const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const L = lay(demoLines);
  const s = (i: number) => L[i].from;
  const ramp = (from: number, len: number) => interpolate(frame, [from, from + len], [0, 1], { ...CL, easing: theme.ease.inOut });

  // Lab state follows the narration: gravity drops (sphere) then returns, oxygen falls, then suppression puts the flame out.
  const toSphere = ramp(s(5), 60) - ramp(s(6), 60);
  const shape = Math.max(0, Math.min(1, toSphere));
  const grav = 1 - ramp(s(5), 60) + ramp(s(6), 60);
  const o2 = 21 - 5 * ramp(s(7), 90);
  const sup = ramp(s(8), 60);
  const oxy = Math.max(0.08, (o2 - 16) / 5) * (1 - sup);
  const status = sup > 0.5 ? "Flame out" : o2 < 18 ? "Weakening" : grav < 0.5 ? "Spherical · microgravity" : "Teardrop · 1 g";
  const lastCue = [...L].reverse().find((r) => r.l.cue && frame >= r.from);

  return (
    <Stage num="04" name="The demonstration" dur={SCENES.demo}>
      <AbsoluteFill style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 90, padding: "0 110px" }}>
        <LabPanel title="Flame lab · illustrative" width={900}>
          <div style={{ height: 470, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <Flame shape={shape} oxygen={oxy} size={320} />
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
          {lastCue && (
            <div style={{ marginTop: 18 }}>
              <Tag>▸ {lastCue.l.cue}</Tag>
            </div>
          )}
        </LabPanel>
        <div style={{ width: 640, display: "flex", justifyContent: "center" }}>
          <Lines lines={demoLines} size={46} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

// ---------- 05 · IMPACT AND FUTURE ----------
const impactLines: Line[] = [
  { t: "But Flammé is bigger than a 3D simulation.", size: 72, hero: ["bigger"] },
  { t: "Imagine a researcher comparing two materials before choosing one for a spacecraft." },
  { t: "Imagine an engineer asking whether a material that extinguishes itself on Earth might continue burning under gentle airflow in microgravity." },
  { t: "Imagine a student in Bangladesh exploring a phenomenon that they would otherwise never have access to." },
  { t: "That's the impact we want to create.", size: 100, hero: ["impact"] },
  { t: "Our next step is to turn Flammé into an evidence-driven research platform.", size: 60 },
  {
    t: "We plan to build a source-linked database of NASA experiments, compare their conditions, identify gaps in existing research, and eventually ground our flame model in real experimental data.",
    size: 52,
    post: (
      <div style={{ display: "flex", gap: 18, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Tag>Source-linked database</Tag>
        <Tag>Compare conditions</Tag>
        <Tag>Find the gaps</Tag>
        <Tag>Ground the model</Tag>
      </div>
    ),
  },
  { t: "We also want to publish our standard reporting format so future experiments can contribute evidence in a consistent way.", size: 56 },
];

// ---------- 06 · CLOSING ----------
const closeLines: Line[] = [
  { t: "Space exploration is about going where humanity has never gone before." },
  { t: "But going further also means preparing for dangers we cannot afford to misunderstand." },
  { t: "Fire doesn't follow our intuition in space.", size: 80 },
  { t: "And safety cannot depend on intuition alone.", size: 90, hero: ["intuition"] },
  { t: "We are Team Flammé from the University of Dhaka.", size: 60 },
  { t: "Flammé — Understanding fire beyond Earth, to protect the people who explore it.", size: 72, hero: ["Understanding"] },
  {
    t: "Thank you.",
    size: 120,
    hero: ["Thank"],
    post: (
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: theme.fonts.mono, fontSize: 22, color: theme.colors.textDim, letterSpacing: "0.06em" }}>
        <span>Flammé · Team Flammé, University of Dhaka</span>
        <span>Not a NASA product. Not NASA-endorsed.</span>
      </div>
    ),
  },
];

export const SCENES = {
  hook: span(hookLines),
  problem: span(problemLines),
  intro: span(introLines),
  demo: span(demoLines),
  impact: span(impactLines),
  close: span(closeLines),
} as const;

const items: Array<[number, React.ReactNode]> = [
  [SCENES.hook, <Stage key="h" num="01" name="The hook" dur={SCENES.hook}><Lines lines={hookLines} /></Stage>],
  [SCENES.problem, <Stage key="p" num="02" name="The problem" dur={SCENES.problem}><Lines lines={problemLines} /></Stage>],
  [SCENES.intro, <Stage key="i" num="03" name="Introducing Flammé" dur={SCENES.intro}><Lines lines={introLines} /></Stage>],
  [SCENES.demo, <Demo key="d" />],
  [SCENES.impact, <Stage key="m" num="05" name="Impact and future" dur={SCENES.impact}><Lines lines={impactLines} /></Stage>],
  [SCENES.close, <Stage key="c" num="06" name="Closing" dur={SCENES.close}><Lines lines={closeLines} /></Stage>],
];

export const Timeline: React.FC = () => {
  let t = 0;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      {items.map(([d, node], i) => {
        const from = t;
        t += d;
        return (
          <Sequence key={i} from={from} durationInFrames={d}>
            {node}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
