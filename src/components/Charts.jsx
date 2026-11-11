import React from 'react';

/* Minimal hand-rolled SVG charts — no charting library, so the Model page
   doesn't pay another dependency's bundle size on top of Mermaid. */

const POS = '#1a7a3c', NEG = '#b32d22', ACCENT = '#1e3a8a', MUTED = '#62666f', LINE = 'rgba(11,11,13,.18)';

/* Diverging horizontal bar chart for fitted coefficients. Value labels live
   in their own fixed right-hand column so they never collide with the
   feature-name labels on the left, no matter how long the bar is. */
export function CoefBarChart({features, labels, coef}) {
  const max = Math.max(0.05, ...coef.map(v => Math.abs(v)));
  const w = 560, rowH = 30, padL = 180, labelColW = 74, plotR = w - labelColW, h = features.length * rowH + 10;
  const half = (plotR - padL) / 2;
  const mid = padL + half;
  const scale = v => (Math.abs(v) / max) * half;
  return <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg" role="img" aria-label="Fitted coefficient magnitudes">
    <line x1={mid} y1={2} x2={mid} y2={h - 6} stroke={LINE} strokeWidth="1"/>
    {features.map((f, i) => {
      const y = i * rowH + rowH / 2;
      const v = coef[i], bw = scale(v), neg = v < 0;
      return <g key={f}>
        <text x={padL - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#3a3d45">{labels[f] || f}</text>
        <rect x={neg ? mid - bw : mid} y={y - 8} width={bw} height="16" fill={neg ? NEG : POS} opacity="0.85"/>
        <text x={w - 6} y={y + 4} textAnchor="end" fontSize="11.5" fontFamily="var(--mono)" fill="#0b0b0d" fontWeight="600">{v >= 0 ? '+' : ''}{v.toFixed(3)}</text>
      </g>;
    })}
  </svg>;
}

/* Scatter plot of real embedded FLEX tests: x vs y, colored by outcome. */
export function ScatterChart({points, xKey, yKey, xLabel, yLabel}) {
  const w = 620, h = 360, pad = {l: 54, r: 18, t: 16, b: 44};
  const xs = points.map(p => p[xKey]).filter(v => v != null);
  const ys = points.map(p => p[yKey]).filter(v => v != null);
  const xMin = Math.min(...xs), xMax = Math.max(...xs), yMin = 0, yMax = Math.max(...ys) * 1.08;
  const sx = v => pad.l + ((v - xMin) / (xMax - xMin || 1)) * (w - pad.l - pad.r);
  const sy = v => h - pad.b - ((v - yMin) / (yMax - yMin || 1)) * (h - pad.t - pad.b);
  const ticksX = 5, ticksY = 5;
  return <svg viewBox={`0 0 ${w} ${h}`} className="chart-svg" role="img" aria-label={`${xLabel} vs ${yLabel} scatter, colored by self-extinguish outcome`}>
    {Array.from({length: ticksY + 1}, (_, i) => {
      const v = yMin + (yMax - yMin) * (i / ticksY), y = sy(v);
      return <g key={`y${i}`}><line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke={LINE} strokeWidth="1"/>
        <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="10.5" fill={MUTED}>{v.toFixed(2)}</text></g>;
    })}
    {Array.from({length: ticksX + 1}, (_, i) => {
      const v = xMin + (xMax - xMin) * (i / ticksX), x = sx(v);
      return <text key={`x${i}`} x={x} y={h - pad.b + 18} textAnchor="middle" fontSize="10.5" fill={MUTED}>{v.toFixed(v < 2 ? 2 : 0)}</text>;
    })}
    <text x={(pad.l + w - pad.r) / 2} y={h - 4} textAnchor="middle" fontSize="11.5" fill="#3a3d45" fontWeight="600">{xLabel}</text>
    <text x={14} y={(pad.t + h - pad.b) / 2} textAnchor="middle" fontSize="11.5" fill="#3a3d45" fontWeight="600" transform={`rotate(-90 14 ${(pad.t + h - pad.b) / 2})`}>{yLabel}</text>
    {points.filter(p => p[xKey] != null && p[yKey] != null).map((p, i) =>
      <circle key={i} cx={sx(p[xKey])} cy={sy(p[yKey])} r="4"
        fill={p.self_extinguished === true ? NEG : p.self_extinguished === false ? POS : MUTED}
        opacity={p.self_extinguished == null ? 0.3 : 0.75} stroke="#fff" strokeWidth="0.6"/>)}
    <g transform={`translate(${w - 190}, ${pad.t + 2})`}>
      <circle cx="0" cy="0" r="4" fill={POS}/><text x="9" y="4" fontSize="11" fill="#3a3d45">burned to completion</text>
      <circle cx="0" cy="18" r="4" fill={NEG}/><text x="9" y="22" fontSize="11" fill="#3a3d45">self-extinguished</text>
    </g>
  </svg>;
}
