import {useCallback, useRef} from 'react';

/* Throttling helper: coalesces a high-frequency callback (pointer drag,
   resize, scroll) down to once per animation frame, so React state only
   updates as fast as the screen can actually redraw. Returns a stable
   function; only the LAST call's args in a frame are kept and fired. */
export function useRafThrottle(fn) {
  const raf = useRef(0);
  const argsRef = useRef(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((...args) => {
    argsRef.current = args;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      fnRef.current(...argsRef.current);
    });
  }, []);
}

/* Non-hook variant for use outside components (e.g. inside labScene.js). */
export function rafThrottle(fn) {
  let raf = 0, lastArgs = null;
  return (...args) => {
    lastArgs = args;
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; fn(...lastArgs); });
  };
}
