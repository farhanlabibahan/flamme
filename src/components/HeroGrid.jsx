import React, {useEffect, useRef, useState} from 'react';

/* Hero background grid, ported from the doctor-tracker login screen.
   - Uneven cells (irregular column/row widths).
   - Hover: a cell lights up, shows glitch pixels, stays lit ~3s after the
     pointer leaves, then fades out.
   - Auto: every so often a few random cells glow on their own and dim away,
     so the grid never looks static even with no pointer over it. */

const COLS = [0.9, 0.62, 1.5, 0.74, 1.2, 0.58, 1.35, 0.8, 0.66, 1.1, 0.7, 1.45];
const ROWS = [1.0, 0.7, 1.3, 0.62, 1.1, 0.78, 1.25, 0.66, 1.0];

const GLITCH_VARIANTS = [
  [
    {top: 14, left: 30, size: 15, tone: 'bright'},
    {top: 60, left: 10, size: 11, tone: 'light'},
    {top: 60, left: 25, size: 11, tone: 'light'},
    {top: 48, left: 42, size: 9, tone: 'light'},
    {top: 60, left: 56, size: 12, tone: 'light'},
    {top: 76, left: 32, size: 9, tone: 'light'},
  ],
  [
    {top: 22, left: 58, size: 13, tone: 'bright'},
    {top: 52, left: 18, size: 10, tone: 'light'},
    {top: 66, left: 34, size: 12, tone: 'light'},
    {top: 40, left: 68, size: 9, tone: 'light'},
    {top: 70, left: 54, size: 10, tone: 'light'},
  ],
  [
    {top: 34, left: 44, size: 17, tone: 'bright'},
    {top: 62, left: 20, size: 10, tone: 'light'},
    {top: 18, left: 66, size: 9, tone: 'light'},
    {top: 70, left: 58, size: 11, tone: 'light'},
  ],
];

const AUTO_EVERY_MS = 900;   // how often a new auto-glow starts
const AUTO_HOLD_MS = 1600;   // how long an auto-glow stays lit before dimming
const AUTO_FADE_MS = 1200;   // dim-out duration

export default function HeroGrid() {
  const [cellStates, setCellStates] = useState({});
  const timeouts = useRef({});
  const hovering = useRef(new Set());

  useEffect(() => {
    const pending = timeouts.current;
    return () => Object.values(pending).forEach((id) => window.clearTimeout(id));
  }, []);

  function clearCellTimeout(key) {
    const pending = timeouts.current[key];
    if (pending) {
      window.clearTimeout(pending);
      delete timeouts.current[key];
    }
  }

  // Auto-glow: pick a random cell, light it, hold, then dim it out.
  useEffect(() => {
    const rows = ROWS.length, cols = COLS.length;
    const id = window.setInterval(() => {
      const key = `${Math.floor(Math.random() * rows)}-${Math.floor(Math.random() * cols)}`;
      if (hovering.current.has(key) || timeouts.current[key]) return;
      setCellStates((prev) => ({...prev, [key]: 'active'}));
      timeouts.current[key] = window.setTimeout(() => {
        setCellStates((prev) => ({...prev, [key]: 'leaving'}));
        timeouts.current[key] = window.setTimeout(() => {
          setCellStates((prev) => {
            const next = {...prev};
            delete next[key];
            return next;
          });
          delete timeouts.current[key];
        }, AUTO_FADE_MS);
      }, AUTO_HOLD_MS);
    }, AUTO_EVERY_MS);
    return () => window.clearInterval(id);
  }, []);

  function handleEnter(key) {
    hovering.current.add(key);
    clearCellTimeout(key);
    setCellStates((prev) => ({...prev, [key]: 'active'}));
  }

  function handleLeave(key) {
    hovering.current.delete(key);
    clearCellTimeout(key);
    // hold ~3s after leaving, then fade out
    timeouts.current[key] = window.setTimeout(() => {
      setCellStates((prev) => ({...prev, [key]: 'leaving'}));
      timeouts.current[key] = window.setTimeout(() => {
        setCellStates((prev) => {
          const next = {...prev};
          delete next[key];
          return next;
        });
        delete timeouts.current[key];
      }, 420);
    }, 3000);
  }

  return (
    <div
      className="hero-grid"
      aria-hidden="true"
      style={{
        gridTemplateColumns: COLS.map((v) => `${v}fr`).join(' '),
        gridTemplateRows: ROWS.map((v) => `${v}fr`).join(' '),
      }}
    >
      {ROWS.map((_, r) => COLS.map((_c, c) => {
        const variant = GLITCH_VARIANTS[(r + c) % GLITCH_VARIANTS.length];
        const key = `${r}-${c}`;
        const state = cellStates[key];
        return (
          <div
            key={key}
            className={`hg-cell ${state === 'active' ? 'hg-active' : ''} ${state === 'leaving' ? 'hg-leaving' : ''}`}
            style={{gridRow: r + 1, gridColumn: c + 1}}
            onMouseEnter={() => handleEnter(key)}
            onMouseLeave={() => handleLeave(key)}
          >
            {variant.map((px, i) => (
              <span
                key={i}
                className={`hg-pixel ${px.tone === 'bright' ? 'hg-pixel-bright' : ''}`}
                style={{top: `${px.top}%`, left: `${px.left}%`, width: px.size, height: px.size}}
              />
            ))}
          </div>
        );
      }))}
    </div>
  );
}
