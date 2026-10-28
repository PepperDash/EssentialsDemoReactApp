import { useState } from 'react';
import { panelId } from '../../../theme/theme';
import type { RoutingMode } from './RoutingModeSelect';

const MODE_KEY = `pd-routing-mode:${panelId}`;

// Storage can be unavailable (private mode, locked-down browsers), so every access is guarded and
// the page falls back to Matrix.
const readStoredMode = (): RoutingMode => {
  try {
    return localStorage.getItem(MODE_KEY) === 'graph' ? 'graph' : 'matrix';
  } catch {
    return 'matrix';
  }
};

/** The Routing page's mode, remembered per panel. */
export function useRoutingMode(): [RoutingMode, (mode: RoutingMode) => void] {
  const [mode, setMode] = useState<RoutingMode>(readStoredMode);

  const changeMode = (next: RoutingMode) => {
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // Not remembered across reloads; the mode still applies for this session.
    }
  };

  return [mode, changeMode];
}
