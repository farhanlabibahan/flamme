// Deterministic keyword/regex parser: turns a free-text question into the
// same scenario fields the Define panel uses. No AI model is called — this
// is pattern matching against a small vocabulary, same spirit as science.js.

const MATERIAL_KEYWORDS = [
  [/cotton|fiberglass|sibal/i, 'Cotton–fiberglass (SIBAL)'],
  [/silicone/i, 'Silicone'],
  [/pmma|acrylic/i, 'PMMA'],
];
const DIRECTION_KEYWORDS = [
  [/opposed/i, 'Opposed'],
  [/concurrent|co-current|cocurrent/i, 'Concurrent'],
];

function firstMatch(text, table) {
  for (const [re, value] of table) if (re.test(text)) return value;
  return '';
}

function numberNear(text, unitPattern) {
  const re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:%|percent)?\\s*(?:${unitPattern})`, 'i');
  const m = text.match(re);
  return m ? m[1] : '';
}

// Returns {material, oxygen, airflow, direction} — each '' when not recognized.
export function parsePrompt(text) {
  const t = String(text || '');
  return {
    material: firstMatch(t, MATERIAL_KEYWORDS),
    direction: firstMatch(t, DIRECTION_KEYWORDS),
    oxygen: numberNear(t, 'o2|oxygen|%|percent'),
    airflow: numberNear(t, 'cm\\s*/\\s*s|cm per s|airflow|air ?flow|flow'),
  };
}

export const hasAnyField = p => !!(p.material || p.oxygen || p.airflow || p.direction);
