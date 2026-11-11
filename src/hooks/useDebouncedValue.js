import {useEffect, useState} from 'react';

/* Throttling helper: delays a fast-changing value (search inputs, free-text
   queries) so expensive recomputation — re-ranking/re-filtering the evidence
   table — doesn't run on every keystroke, only once typing pauses. */
export function useDebouncedValue(value, delay = 180) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
