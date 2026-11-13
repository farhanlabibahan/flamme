// Black-and-white "glass" visual library: pills, number cards, dot grids,
// donut, orbit, flame geometry, document cards, personas, roadmap.
// Every component animates from frame 0 of its own <Sequence>.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { Flame } from "./Lab";

const FONT = theme.fonts.display;
const MONO = theme.fonts.mono;
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Eased 0..1 from frame d over len frames. No springs, so no overshoot or jitter.
export const ease = (f: number, d: number, len = 16) =>
  interpolate(f, [d, d + len], [0, 1], { ...CL, easing: theme.ease.out });
const inOut = (f: number, d: number, len: number) =>
  interpolate(f, [d, d + len], [0, 1], { ...CL, easing: theme.ease.inOut });

export const glass: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.24)",
  borderRadius: 24,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.28), 0 0 40px rgba(255,255,255,0.07), 0 30px 80px -20px rgba(0,0,0,0.9)",
  backdropFilter: "blur(10px)",
};
const glowText = "0 0 14px rgba(255,255,255,0.55), 0 0 40px rgba(255,255,255,0.25)";

// Clean word reveal: eased opacity + lift, 2-frame stagger, no blur, no overshoot.
const norm = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
export const CleanText: React.FC<{ text: string; size: number; hero?: string[]; maxWidth?: number; align?: "center" | "flex-start" }> = ({
  text,
  size,
  hero = [],
  maxWidth = 1500,
  align = "center",
}) => {
  const f = useCurrentFrame();
  const heroSet = hero.map(norm);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: align, columnGap: Math.round(size * 0.27), rowGap: Math.round(size * 0.1), maxWidth }}>
      {text.split(" ").map((w, i) => {
        const p = ease(f, 3 + i * 2, 14);
        const isH = heroSet.includes(norm(w));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 22}px)`,
              fontFamily: FONT,
              fontSize: size,
              fontWeight: isH ? 700 : 600,
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
              color: isH ? "#FFFFFF" : "#E4E4E4",
              textShadow: isH ? glowText : "0 0 24px rgba(255,255,255,0.14)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Generic entrance wrapper.
export const Pop: React.FC<{ d?: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number }> = ({
  d = 0,
  children,
  style,
  dy = 26,
}) => {
  const f = useCurrentFrame();
  const p = ease(f, d, 18);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * dy}px) scale(${0.94 + 0.06 * p})`, ...style }}>{children}</div>;
};

export const Pill: React.FC<{ label: string; d?: number; size?: number }> = ({ label, d = 0, size = 30 }) => (
  <Pop d={d} dy={16}>
    <div style={{ ...glass, borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 14, padding: `${size * 0.5}px ${size * 0.9}px` }}>
      <span style={{ width: size * 0.32, height: size * 0.32, borderRadius: "50%", background: "#fff", boxShadow: "0 0 12px #fff" }} />
      <span style={{ fontFamily: FONT, fontSize: size, fontWeight: 500, color: "#fff", textShadow: glowText, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  </Pop>
);

const Dashed: React.FC<{ w: number }> = ({ w }) => (
  <div style={{ width: w, height: 3, opacity: 0.55, backgroundImage: "repeating-linear-gradient(90deg,#fff 0 18px,transparent 18px 32px)" }} />
);

export const NumberCard: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const f = useCurrentFrame();
  const p = ease(f, 0, 24);
  const n = Math.round(value * ease(f, 6, 45));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
      <Dashed w={360 * p} />
      <Pop>
        <div style={{ ...glass, padding: "26px 70px", textAlign: "center" }}>
          <div style={{ fontFamily: FONT, fontSize: 190, fontWeight: 700, lineHeight: 1, color: "#fff", textShadow: glowText, fontVariantNumeric: "tabular-nums" }}>{n}</div>
          <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 500, color: "#fff", marginTop: 6 }}>{label}</div>
        </div>
      </Pop>
      <Dashed w={360 * p} />
    </div>
  );
};

export const Dots: React.FC<{ rows?: number; cols?: number; size?: number }> = ({ rows = 2, cols = 10, size = 46 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: size * 0.45 }}>
      {Array.from({ length: rows * cols }).map((_, i) => {
        const p = ease(f, 4 + i * 1.6, 14);
        const pulse = 0.85 + 0.15 * Math.sin((f - i * 3) / 9);
        return (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, #fff, #bdbdbd 60%, #7a7a7a)",
              boxShadow: `0 0 ${18 * pulse}px rgba(255,255,255,${0.55 * pulse})`,
              opacity: p,
              transform: `translateY(${(1 - p) * -20}px) scale(${0.6 + 0.4 * p})`,
            }}
          />
        );
      })}
    </div>
  );
};

// Earth with the ISS travelling on a tilted orbit.
export const Orbit: React.FC = () => {
  const f = useCurrentFrame();
  const p = ease(f, 0, 30);
  const cx = 700, cy = 300, rx = 520, ry = 140, tilt = (-12 * Math.PI) / 180;
  const a = f / 45 + 0.6;
  const x0 = rx * Math.cos(a), y0 = ry * Math.sin(a);
  const x = cx + x0 * Math.cos(tilt) - y0 * Math.sin(tilt);
  const y = cy + x0 * Math.sin(tilt) + y0 * Math.cos(tilt);
  const behind = Math.sin(a) < 0;
  const iss = (
    <div style={{ position: "absolute", left: x - 45, top: y - 18, zIndex: behind ? 1 : 3, opacity: (behind ? 0.45 : 1) * p }}>
      <svg width="90" height="36" viewBox="0 0 90 36" style={{ filter: "drop-shadow(0 0 8px #fff)" }}>
        <rect x="0" y="4" width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" />
        <rect x="62" y="4" width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" />
        <line x1="28" y1="18" x2="62" y2="18" stroke="#fff" strokeWidth="3" />
        <rect x="38" y="10" width="14" height="16" rx="3" fill="#fff" />
      </svg>
    </div>
  );
  return (
    <div style={{ position: "relative", width: 1400, height: 600, opacity: p }}>
      <div style={{ position: "absolute", left: cx - rx, top: cy - ry, width: rx * 2, height: ry * 2, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.35)", transform: "rotate(-12deg)", zIndex: 1 }} />
      <div
        style={{
          position: "absolute",
          left: cx - 200,
          top: cy - 200,
          width: 400,
          height: 400,
          borderRadius: "50%",
          zIndex: 2,
          background: "radial-gradient(circle at 34% 30%, #ffffff 0%, #a8a8a8 22%, #3a3a3a 55%, #080808 78%)",
          boxShadow: "0 0 90px rgba(255,255,255,0.22), inset -30px -30px 80px rgba(0,0,0,0.8)",
          transform: `rotate(${f / 8}deg)`,
        }}
      />
      {iss}
      <div style={{ position: "absolute", right: 0, top: 40, zIndex: 4 }}>
        <Pill label="ISS · ~400 km up" d={18} />
      </div>
    </div>
  );
};

const Arrow: React.FC<{ rot: number; len?: number; label?: string; d?: number }> = ({ rot, len = 190, label, d = 0 }) => {
  const f = useCurrentFrame();
  const p = ease(f, d, 20);
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, transform: `rotate(${rot}deg)` }}>
      <div style={{ position: "absolute", left: 80, top: -2, width: len * p, height: 4, background: "#fff", boxShadow: "0 0 10px #fff", opacity: 0.85 }} />
      <div style={{ position: "absolute", left: 80 + len * p - 6, top: -10, width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: "20px solid #fff", opacity: p }} />
      {label && (
        <div style={{ position: "absolute", left: 80 + len + 26, top: -18, transform: `rotate(${-rot}deg)`, fontFamily: MONO, fontSize: 30, color: "#fff", opacity: p, textShadow: glowText }}>{label}</div>
      )}
    </div>
  );
};

// Earth flame with rising hot air.
export const EarthFlame: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
      <Pop>
        <div style={{ ...glass, width: 460, height: 520, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 60, position: "relative", overflow: "hidden" }}>
          {[0, 1, 2].map((i) => {
            const t = ((f + i * 25) % 75) / 75;
            return (
              <div key={i} style={{ position: "absolute", left: 120 + i * 110, bottom: 80 + t * 360, width: 4, height: 50, background: "linear-gradient(#fff, transparent)", opacity: Math.sin(t * Math.PI) * 0.8 }} />
            );
          })}
          <Flame shape={0} size={210} />
        </div>
      </Pop>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: "flex-start" }}>
        <Pill label="Hot air rises" d={14} />
        <Pill label="Flames stretch up" d={30} />
        <Pill label="We know how to respond" d={46} />
      </div>
    </div>
  );
};

// No up or down: arrows in all directions around a floating sphere flame.
export const NoUpDown: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "relative", width: 900, height: 520 }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) rotate(${f / 3}deg)` }}>
        <Flame shape={1} size={120} />
      </div>
      {[0, 90, 180, 270].map((r, i) => (
        <Arrow key={r} rot={r - 90 + Math.sin(f / 30) * 6} len={100} d={6 + i * 6} label={["up?", "?", "down?", "?"][i]} />
      ))}
    </div>
  );
};

// Teardrop morphing into a sphere, with three behaviour pills.
export const FlameMorph: React.FC = () => {
  const f = useCurrentFrame();
  const shape = inOut(f, 20, 70);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
      <Pop>
        <div style={{ ...glass, width: 520, height: 520, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Flame shape={shape} size={240} />
        </div>
      </Pop>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: "flex-start" }}>
        <Pill label="Almost spherical" d={40} />
        <Pill label="Burns differently" d={90} />
        <Pill label="Can keep burning" d={140} />
      </div>
    </div>
  );
};

// Spacecraft outline with the exit crossed out.
export const Capsule: React.FC = () => {
  const f = useCurrentFrame();
  const p = ease(f, 0, 24);
  const x = ease(f, 26, 20);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      <svg width="900" height="320" viewBox="0 0 900 320" style={{ filter: "drop-shadow(0 0 14px rgba(255,255,255,0.5))", opacity: p }}>
        <rect x="20" y="40" width="760" height="240" rx="120" fill="rgba(255,255,255,0.05)" stroke="#fff" strokeWidth="3" strokeDasharray="2100" strokeDashoffset={2100 * (1 - p)} />
        {[180, 300, 420].map((cx) => (
          <circle key={cx} cx={cx} cy="160" r="34" fill="none" stroke="#fff" strokeWidth="2" opacity={p} />
        ))}
        <rect x="600" y="95" width="110" height="130" rx="10" fill="none" stroke="#fff" strokeWidth="3" />
        <text x="655" y="168" textAnchor="middle" fill="#fff" fontFamily={MONO} fontSize="26">EXIT</text>
        <line x1="585" y1="80" x2={585 + 140 * x} y2={80 + 160 * x} stroke="#fff" strokeWidth="7" strokeLinecap="round" />
        <line x1="725" y1="80" x2={725 - 140 * x} y2={80 + 160 * x} stroke="#fff" strokeWidth="7" strokeLinecap="round" />
        <path d="M780 160 L880 120 L880 200 Z" fill="none" stroke="#fff" strokeWidth="3" opacity={p} />
      </svg>
      <Pill label="Nowhere to evacuate to" d={40} />
    </div>
  );
};

const Head: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 60 60">
    <circle cx="30" cy="22" r="11" fill="#fff" />
    <path d="M10 56 C10 40 20 34 30 34 C40 34 50 40 50 56 Z" fill="#fff" />
  </svg>
);

export const Avatar: React.FC<{ size?: number; d?: number; children?: React.ReactNode; ring?: boolean }> = ({ size = 150, d = 0, children, ring }) => {
  const f = useCurrentFrame();
  return (
    <Pop d={d}>
      <div
        style={{
          ...glass,
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: ring ? "3px solid #fff" : glass.border,
          boxShadow: ring ? `0 0 ${30 + 10 * Math.sin(f / 12)}px rgba(255,255,255,0.5), inset 0 1px 0 rgba(255,255,255,0.3)` : glass.boxShadow,
        }}
      >
        {children ?? <Head size={size} />}
      </div>
    </Pop>
  );
};

// Astronaut helmet glyph.
export const Helmet: React.FC<{ size?: number }> = ({ size = 200 }) => (
  <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="5" />
    <rect x="24" y="34" width="52" height="30" rx="15" fill="#fff" opacity="0.9" />
    <rect x="30" y="39" width="18" height="8" rx="4" fill="#000" opacity="0.5" />
    <rect x="40" y="88" width="20" height="8" rx="3" fill="#fff" />
  </svg>
);

export const Astronaut: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
    <Avatar size={280} ring>
      <Helmet size={280} />
    </Avatar>
    <Pill label="You · on board the ISS" d={20} />
  </div>
);

export const Crew: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
      {[130, 160, 220, 160, 130].map((s, i) => (
        <Avatar key={i} size={s} d={Math.abs(i - 2) * 8} ring={i === 2} />
      ))}
    </div>
    <Pill label="They depend on us" d={34} />
  </div>
);

export const Question: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "relative", width: 1300, height: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Pop>
        <div style={{ ...glass, width: 330, height: 330, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${Math.sin(f / 25) * 6}px)` }}>
          <span style={{ fontFamily: FONT, fontSize: 250, fontWeight: 700, color: "#fff", textShadow: glowText, lineHeight: 1 }}>?</span>
        </div>
      </Pop>
      <div style={{ position: "absolute", left: 40, top: 110 }}><Pill label="Scattered" d={20} /></div>
      <div style={{ position: "absolute", right: 30, top: 200 }}><Pill label="Hard to compare" d={40} /></div>
      <div style={{ position: "absolute", left: 140, bottom: 70 }}><Pill label="Inaccessible" d={60} /></div>
    </div>
  );
};

const DocCard: React.FC<{ label: string; w?: number }> = ({ label, w = 300 }) => (
  <div style={{ ...glass, width: w, padding: "22px 24px", borderRadius: 18 }}>
    <div style={{ fontFamily: MONO, fontSize: 22, color: "#fff", letterSpacing: "0.04em", marginBottom: 16, textShadow: glowText }}>{label}</div>
    {[1, 0.8, 0.9, 0.55].map((k, i) => (
      <div key={i} style={{ height: 8, width: `${k * 100}%`, borderRadius: 4, background: "rgba(255,255,255,0.22)", marginTop: 10 }} />
    ))}
  </div>
);

const SCATTER = [
  { l: "ISS · FLEX", x: -470, y: -170, r: -8 },
  { l: "ISS · BASS-II", x: 60, y: -215, r: 5 },
  { l: "Saffire · Cygnus", x: 430, y: -95, r: -4 },
  { l: "Drop tower", x: -420, y: 120, r: 6 },
  { l: "Parabolic flight", x: 10, y: 150, r: -6 },
  { l: "NTRS report", x: 430, y: 175, r: 9 },
];

// Evidence cards scattered across the frame; with converge, they fly into one Flammé node.
export const Scatter: React.FC<{ converge?: boolean }> = ({ converge }) => {
  const f = useCurrentFrame();
  const c = converge ? inOut(f, 40, 60) : 0;
  const hub = converge ? ease(f, 85, 20) : 0;
  return (
    <div style={{ position: "relative", width: 1500, height: 600 }}>
      {converge && (
        <svg width="1500" height="600" style={{ position: "absolute", inset: 0, opacity: 1 - c }}>
          {SCATTER.map((s, i) => (
            <line key={i} x1={750 + s.x} y1={300 + s.y} x2={750} y2={300} stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="8 10" />
          ))}
        </svg>
      )}
      {SCATTER.map((s, i) => {
        const p = ease(f, i * 5, 18);
        const fl = Math.sin((f + i * 20) / 28) * 6;
        const x = s.x * (1 - c), y = s.y * (1 - c) + fl;
        return (
          <div key={s.l} style={{ position: "absolute", left: 750 + x - 150, top: 300 + y - 70, opacity: p * (1 - c * 0.9), transform: `rotate(${s.r * (1 - c)}deg) scale(${(0.9 + 0.1 * p) * (1 - 0.5 * c)})` }}>
            <DocCard label={s.l} />
          </div>
        );
      })}
      {converge && (
        <div style={{ position: "absolute", left: 750 - 170, top: 300 - 70, opacity: hub, transform: `scale(${0.8 + 0.2 * hub})` }}>
          <div style={{ ...glass, width: 340, height: 140, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", boxShadow: "0 0 50px rgba(255,255,255,0.4)" }}>
            <span style={{ fontFamily: FONT, fontSize: 64, fontWeight: 700, color: "#fff", textShadow: glowText }}>Flammé</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Three experiments, three different sets of reported fields.
export const Mismatch: React.FC = () => {
  const cards = [
    { n: "Experiment A", rows: [["Oxygen", "21 %"], ["Airflow", "—"], ["Pressure", "101 kPa"]] },
    { n: "Experiment B", rows: [["Oxygen", "—"], ["Airflow", "5 cm/s"], ["Pressure", "—"]] },
    { n: "Experiment C", rows: [["Oxygen", "17.5 %"], ["Airflow", "?"], ["Pressure", "not reported"]] },
  ];
  return (
    <div style={{ display: "flex", gap: 40 }}>
      {cards.map((c, i) => (
        <Pop key={c.n} d={i * 10}>
          <div style={{ ...glass, width: 420, padding: "28px 30px" }}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: "#9a9a9a", marginBottom: 18, letterSpacing: "0.06em" }}>{c.n.toUpperCase()}</div>
            {c.rows.map(([k, v], j) => {
              const missing = v === "—" || v === "?" || v === "not reported";
              return (
                <Pop key={k} d={i * 10 + 14 + j * 8} dy={10}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                    <span style={{ fontFamily: FONT, fontSize: 32, color: "#cfcfcf" }}>{k}</span>
                    <span style={{ fontFamily: MONO, fontSize: 30, color: missing ? "#5f5f5f" : "#fff", textShadow: missing ? "none" : glowText }}>{v}</span>
                  </div>
                </Pop>
              );
            })}
          </div>
        </Pop>
      ))}
    </div>
  );
};

export const NotSameLanguage: React.FC = () => {
  const f = useCurrentFrame();
  const bubble = (t: string, d: number) => (
    <Pop d={d}>
      <div style={{ ...glass, padding: "40px 54px", borderRadius: "34px 34px 34px 6px" }}>
        <span style={{ fontFamily: MONO, fontSize: 46, color: "#fff", textShadow: glowText }}>{t}</span>
      </div>
    </Pop>
  );
  const p = ease(f, 26, 16);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
      {bubble("O₂ = 21 %", 0)}
      <span style={{ fontFamily: FONT, fontSize: 170, fontWeight: 700, color: "#fff", textShadow: glowText, opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}>≠</span>
      {bubble("atmosphere: air", 12)}
    </div>
  );
};

const FLAME_PATH =
  "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z";

export const Wordmark: React.FC<{ sub?: string }> = ({ sub = "Team Flammé · University of Dhaka" }) => {
  const f = useCurrentFrame();
  const p = ease(f, 0, 24);
  const draw = ease(f, 0, 40);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36, opacity: p, transform: `scale(${0.92 + 0.08 * p})` }}>
        <svg width="170" height="170" viewBox="0 0 24 24" style={{ filter: `drop-shadow(0 0 ${14 + 6 * Math.sin(f / 10)}px rgba(255,255,255,0.8))` }}>
          <path d={FLAME_PATH} fill="none" stroke="#fff" strokeWidth="0.9" pathLength={100} strokeDasharray="100" strokeDashoffset={100 * (1 - draw)} />
          <path d={FLAME_PATH} fill="#fff" opacity={ease(f, 26, 20) * 0.9} transform="translate(12 12) scale(.55) translate(-12 -12)" />
        </svg>
        <span style={{ fontFamily: FONT, fontSize: 190, fontWeight: 700, letterSpacing: "-0.04em", color: "#fff", textShadow: glowText }}>Flammé</span>
      </div>
      <Pill label={sub} d={30} />
    </div>
  );
};

export const Vision: React.FC = () => (
  <div style={{ display: "flex", gap: 36 }}>
    {["Understandable", "Comparable", "Accessible"].map((w, i) => (
      <Pop key={w} d={i * 12}>
        <div style={{ ...glass, width: 420, padding: "44px 30px", textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 26, color: "#8c8c8c" }}>0{i + 1}</div>
          <div style={{ fontFamily: FONT, fontSize: 50, fontWeight: 700, color: "#fff", marginTop: 14, textShadow: glowText }}>{w}</div>
        </div>
      </Pop>
    ))}
  </div>
);

export const TwoThings: React.FC = () => (
  <div style={{ display: "flex", gap: 50 }}>
    <Pop>
      <div style={{ ...glass, width: 620, height: 470, padding: 40, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 26, color: "#8c8c8c" }}>01</div>
          <div style={{ fontFamily: FONT, fontSize: 56, fontWeight: 700, color: "#fff", textShadow: glowText, marginTop: 8 }}>A common language</div>
          <div style={{ fontFamily: FONT, fontSize: 32, color: "#bdbdbd", marginTop: 8 }}>10 standard conditions</div>
        </div>
        <Dots rows={2} cols={5} size={44} />
      </div>
    </Pop>
    <Pop d={14}>
      <div style={{ ...glass, width: 620, height: 470, padding: 40, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 26, color: "#8c8c8c" }}>02</div>
          <div style={{ fontFamily: FONT, fontSize: 56, fontWeight: 700, color: "#fff", textShadow: glowText, marginTop: 8 }}>An interactive lab</div>
          <div style={{ fontFamily: FONT, fontSize: 32, color: "#bdbdbd", marginTop: 8 }}>Explore fire in space</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Flame shape={1} size={140} />
        </div>
      </div>
    </Pop>
  </div>
);

// The ten real conditions from the Flammé reporting schema (src/pages/ModelPage.jsx).
export const CONDITIONS = [
  "Material / fuel",
  "Sample geometry",
  "Gravity",
  "Oxygen",
  "Total pressure",
  "Forced airflow",
  "Flow direction",
  "Ignition",
  "Initial temperature",
  "Suppression",
];

export const TenGrid: React.FC<{ glow?: number[] }> = ({ glow = [] }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 290px)", gap: 24 }}>
      {CONDITIONS.map((c, i) => {
        const lit = glow.includes(i) && f > 30 + glow.indexOf(i) * 10;
        return (
          <Pop key={c} d={i * 4}>
            <div
              style={{
                ...glass,
                height: 170,
                padding: "22px 24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: lit ? "2px solid #fff" : glass.border,
                boxShadow: lit ? "0 0 40px rgba(255,255,255,0.35)" : glass.boxShadow,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 24, color: "#8c8c8c" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: FONT, fontSize: 34, fontWeight: 600, color: "#fff", textShadow: lit ? glowText : "none" }}>{c}</span>
            </div>
          </Pop>
        );
      })}
    </div>
  );
};

// Two records aligned field by field.
export const Aligned: React.FC = () => {
  const f = useCurrentFrame();
  const rows = CONDITIONS.slice(2, 7);
  const col = (title: string, d: number) => (
    <Pop d={d}>
      <div style={{ ...glass, width: 430, padding: "26px 30px" }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: "#8c8c8c", marginBottom: 10 }}>{title}</div>
        {rows.map((r) => (
          <div key={r} style={{ fontFamily: FONT, fontSize: 32, color: "#fff", padding: "11px 0", borderTop: "1px solid rgba(255,255,255,0.12)" }}>{r}</div>
        ))}
      </div>
    </Pop>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {col("RECORD A", 0)}
      <div style={{ display: "flex", flexDirection: "column", gap: 47, marginTop: 50 }}>
        {rows.map((r, i) => (
          <div key={r} style={{ width: 240 * ease(f, 20 + i * 6, 16), height: 3, background: "#fff", boxShadow: "0 0 10px #fff", opacity: 0.8 }} />
        ))}
      </div>
      {col("RECORD B", 10)}
    </div>
  );
};

export const ReadVsExperience: React.FC = () => {
  const f = useCurrentFrame();
  const strike = ease(f, 40, 20);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
      <Pop>
        <div style={{ position: "relative", opacity: 1 - 0.5 * strike }}>
          <DocCard label="Read about it" w={420} />
          <div style={{ position: "absolute", left: -10, top: "50%", width: 440 * strike, height: 5, background: "#fff", boxShadow: "0 0 10px #fff" }} />
        </div>
      </Pop>
      <span style={{ fontFamily: FONT, fontSize: 110, color: "#fff", opacity: ease(f, 50, 14) }}>→</span>
      <Pop d={56}>
        <div style={{ ...glass, width: 420, height: 380, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, border: "2px solid #fff" }}>
          <Flame shape={1} size={170} />
          <span style={{ fontFamily: FONT, fontSize: 44, fontWeight: 700, color: "#fff", textShadow: glowText }}>Experience it</span>
        </div>
      </Pop>
    </div>
  );
};

const Glyph: React.FC<{ kind: "researcher" | "engineer" | "student" }> = ({ kind }) => (
  <svg width="140" height="140" viewBox="0 0 100 100" style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.7))" }}>
    {kind === "researcher" && <path d="M38 14 H62 M42 14 V42 L22 82 Q20 88 27 88 H73 Q80 88 78 82 L58 42 V14" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />}
    {kind === "researcher" && <path d="M30 70 H70 L76 84 H24 Z" fill="#fff" opacity="0.8" />}
    {kind === "engineer" && (
      <g>
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="45" y="8" width="10" height="18" rx="2" fill="#fff" transform={`rotate(${i * 45} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="27" fill="none" stroke="#fff" strokeWidth="9" />
      </g>
    )}
    {kind === "student" && (
      <g>
        <path d="M50 22 L92 40 L50 58 L8 40 Z" fill="#fff" />
        <path d="M26 48 V68 Q50 82 74 68 V48" fill="none" stroke="#fff" strokeWidth="5" />
        <line x1="88" y1="42" x2="88" y2="70" stroke="#fff" strokeWidth="4" />
      </g>
    )}
  </svg>
);

export const Persona: React.FC<{ kind: "researcher" | "engineer" | "student"; title: string; pills: string[] }> = ({ kind, title, pills }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <Avatar size={290} ring>
        <Glyph kind={kind} />
      </Avatar>
      <Pill label={title} d={14} size={34} />
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: "flex-start" }}>
      {pills.map((p, i) => (
        <Pill key={p} label={p} d={30 + i * 22} />
      ))}
    </div>
  </div>
);

// Four equal parts of the planned platform (labels only, no data).
export const PlatformDonut: React.FC = () => {
  const f = useCurrentFrame();
  const r = 190, C = 2 * Math.PI * r;
  const shades = ["#FFFFFF", "#BDBDBD", "#7E7E7E", "#4A4A4A"];
  const labels = ["Source-linked database", "Compare conditions", "Find the gaps", "Grounded model"];
  const pos: React.CSSProperties[] = [
    { right: 0, top: 40 },
    { right: 0, bottom: 60 },
    { left: 0, bottom: 60 },
    { left: 0, top: 40 },
  ];
  return (
    <div style={{ position: "relative", width: 1450, height: 600 }}>
      <svg width="500" height="500" viewBox="0 0 500 500" style={{ position: "absolute", left: 475, top: 50, transform: `rotate(${-90 + f / 6}deg)`, filter: "drop-shadow(0 0 22px rgba(255,255,255,0.3))" }}>
        {shades.map((s, i) => {
          const p = ease(f, i * 10, 26);
          return (
            <circle key={i} cx="250" cy="250" r={r} fill="none" stroke={s} strokeWidth="90" strokeDasharray={`${(C / 4 - 6) * p} ${C}`} strokeDashoffset={-(C / 4) * i} />
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 475, top: 50, width: 500, height: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: FONT, fontSize: 52, fontWeight: 700, color: "#fff", textShadow: glowText, opacity: ease(f, 30, 20) }}>Flammé</span>
      </div>
      {labels.map((l, i) => (
        <div key={l} style={{ position: "absolute", ...pos[i] }}>
          <Pill label={l} d={20 + i * 12} />
        </div>
      ))}
    </div>
  );
};

export const Roadmap: React.FC = () => {
  const f = useCurrentFrame();
  const steps = ["Source-linked database", "Compare conditions", "Identify gaps", "Ground the model"];
  const fill = inOut(f, 10, 150);
  return (
    <div style={{ position: "relative", width: 1500, height: 420 }}>
      <div style={{ position: "absolute", left: 150, right: 150, top: 120, height: 3, opacity: 0.35, backgroundImage: "repeating-linear-gradient(90deg,#fff 0 16px,transparent 16px 28px)" }} />
      <div style={{ position: "absolute", left: 150, top: 120, height: 3, width: 1200 * fill, background: "#fff", boxShadow: "0 0 14px #fff" }} />
      {steps.map((s, i) => {
        const x = 150 + i * 400;
        const lit = fill * 3 >= i - 0.01;
        const p = ease(f, 10 + i * 50, 18);
        return (
          <div key={s} style={{ position: "absolute", left: x - 160, top: 70, width: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", ...glass, border: lit ? "3px solid #fff" : glass.border, boxShadow: lit ? "0 0 36px rgba(255,255,255,0.55)" : glass.boxShadow, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: 32, color: "#fff" }}>{i + 1}</span>
            </div>
            <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 600, color: "#fff", textAlign: "center", opacity: 0.35 + 0.65 * p, textShadow: lit ? glowText : "none" }}>{s}</div>
          </div>
        );
      })}
    </div>
  );
};

const KEYS = ["material", "geometry_mm", "gravity", "oxygen_pct", "pressure_kpa", "airflow_cm_s", "flow_direction", "ignition", "initial_temp", "suppression"];
export const FormatDoc: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {["Future experiment", "Future experiment", "Future experiment"].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Pill label={l} d={40 + i * 14} size={26} />
            <div style={{ width: 120 * ease(f, 50 + i * 14, 18), height: 3, background: "#fff", boxShadow: "0 0 8px #fff" }} />
          </div>
        ))}
      </div>
      <Pop>
        <div style={{ ...glass, width: 560, padding: "28px 34px" }}>
          <div style={{ fontFamily: MONO, fontSize: 24, color: "#fff", marginBottom: 14, textShadow: glowText }}>flamme-record.schema.json</div>
          {KEYS.map((k, i) => (
            <div key={k} style={{ fontFamily: MONO, fontSize: 24, color: "#bdbdbd", padding: "5px 0", opacity: ease(f, 8 + i * 3, 12) }}>
              <span style={{ color: "#6f6f6f" }}>{String(i + 1).padStart(2, "0")} </span>"{k}"
            </div>
          ))}
        </div>
      </Pop>
    </div>
  );
};

// Earth to Moon to Mars: a dashed trajectory drawing outward.
export const Journey: React.FC = () => {
  const f = useCurrentFrame();
  const d = ease(f, 6, 90);
  const L = 1500;
  const body = (x: number, y: number, s: number, label: string, delay: number) => (
    <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: ease(f, delay, 18) }}>
      <div style={{ width: s, height: s, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #fff, #8a8a8a 45%, #111 80%)", boxShadow: "0 0 40px rgba(255,255,255,0.3)" }} />
      <span style={{ fontFamily: MONO, fontSize: 26, color: "#fff" }}>{label}</span>
    </div>
  );
  return (
    <div style={{ position: "relative", width: 1500, height: 600 }}>
      <svg width="1500" height="600" style={{ position: "absolute", inset: 0 }}>
        <path d="M200 420 Q 700 40 1300 260" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeDasharray="10 14" />
        <path d="M200 420 Q 700 40 1300 260" fill="none" stroke="#fff" strokeWidth="3" pathLength={L} strokeDasharray={L} strokeDashoffset={L * (1 - d)} style={{ filter: "drop-shadow(0 0 6px #fff)" }} />
      </svg>
      {body(200, 420, 170, "Earth", 0)}
      {body(720, 205, 80, "Moon", 40)}
      {body(1300, 260, 120, "Mars", 80)}
    </div>
  );
};

// Sphere flame with warning rings pulsing outward.
export const Danger: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "relative", width: 700, height: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[0, 1, 2].map((i) => {
        const t = ((f + i * 30) % 90) / 90;
        return <div key={i} style={{ position: "absolute", width: 200 + t * 420, height: 200 + t * 420, borderRadius: "50%", border: "2px solid #fff", opacity: (1 - t) * 0.6 }} />;
      })}
      <Flame shape={1} size={190} />
    </div>
  );
};
