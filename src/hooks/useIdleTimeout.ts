import { useEffect, useRef } from 'react';

// Anything a user does on the panel. Listened for in the capture phase, so a handler that stops
// propagation (the tour overlay does) can't hide a tap from the timer.
const ACTIVITY_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'wheel'] as const;

/**
 * Calls `onIdle` once nobody has touched the panel for `timeoutMs`. Any interaction restarts the
 * countdown; after it fires, the next interaction starts a new one.
 */
export function useIdleTimeout(timeoutMs: number, onIdle: () => void) {
  // Read through a ref, so a new callback each render doesn't restart the countdown.
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    let timer = setTimeout(() => onIdleRef.current(), timeoutMs);
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onIdleRef.current(), timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, restart, { capture: true, passive: true }));
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, restart, { capture: true }));
    };
  }, [timeoutMs]);
}
