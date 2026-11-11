import React from 'react';

/* layered blue flame mark — flat nested bands (deep navy outer shell down to a
   near-white core), same family as the app's flat/no-glow design language.
   Extracted so both the landing page and the app shell's sidebar share one
   source of truth for the brand mark. */
const FLAME_D = "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z";

/* viewBox cropped to the flame's drawn bounds (x 5–19, y 3–22) so the mark has no empty margin beside the text. */
export default function MicroFlame({size = 18}) {
  return <svg width={size * 14 / 19} height={size} viewBox="5 3 14 19" className="micro-flame" aria-hidden="true">
    <g transform="translate(12 12) scale(1) translate(-12 -12)"><path d={FLAME_D} fill="#15317a"/></g>
    <g transform="translate(12 12) scale(.76) translate(-12 -12)"><path d={FLAME_D} fill="#2f62e0"/></g>
    <g transform="translate(12 12) scale(.52) translate(-12 -12)"><path d={FLAME_D} fill="#6fb8f5"/></g>
    <g transform="translate(12 12) scale(.27) translate(-12 -12)"><path d={FLAME_D} fill="#eaf9ff"/></g>
  </svg>;
}
