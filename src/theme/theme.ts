// Which UI theme this panel uses comes from the panel's own config ("theme": "midnight" on its
// mcxpanel/mctsw device); anything else keeps the original UI. The config only arrives after the
// websocket connects, but parts of Midnight are chosen once at page load (icon sets, the sources
// band, lighting behavior). So the last theme the config asked for is remembered in localStorage
// and applied here, before anything renders - and PanelThemeSync reloads once if the config asks
// for a different one.
const THEME_KEY = 'pd-panel-theme';

const readStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
};

// Local development override: VITE_FORCE_THEME in .env.local (gitignored) pins the theme and
// ignores the panel's config, for previewing a theme without editing the processor's config.
const forcedTheme: string | undefined = import.meta.env.DEV ? import.meta.env.VITE_FORCE_THEME : undefined;

if ((forcedTheme ?? readStoredTheme()) === 'midnight') document.documentElement.dataset.theme = 'midnight';

// Fixed for the life of the page. Used to pick the thin outlined icon set, which the <img>-loaded
// icons can't get from CSS.
export const isMidnight = document.documentElement.dataset.theme === 'midnight';

/** Called with the panel's configured theme; reloads once if it doesn't match the page's. */
export const applyConfiguredTheme = (configTheme: string) => {
  const wantMidnight = configTheme === 'midnight';
  if (forcedTheme !== undefined || wantMidnight === isMidnight) return;

  try {
    localStorage.setItem(THEME_KEY, wantMidnight ? 'midnight' : 'classic');
  } catch {
    // Can't remember the choice, so a reload would come back to the same theme and loop. Stay on
    // the original UI.
    return;
  }
  window.location.reload();
};

// Midnight's light/dark mode. Only colors change between the two (see styles.scss), so it's a
// data-mode attribute on <html> rather than React state - nothing re-renders. Remembered per panel
// in localStorage; storage can be unavailable (private mode, locked-down browsers), so every access
// is guarded and the panel just falls back to dark.
const MODE_KEY = 'pd-midnight-mode';

export type MidnightMode = 'dark' | 'light';

const readStoredMode = (): MidnightMode => {
  try {
    return localStorage.getItem(MODE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
};

export const setMidnightMode = (mode: MidnightMode) => {
  if (mode === 'light') document.documentElement.dataset.mode = 'light';
  else delete document.documentElement.dataset.mode;

  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Not remembered across reloads; the mode still applies for this session.
  }
};

export const getMidnightMode = (): MidnightMode =>
  document.documentElement.dataset.mode === 'light' ? 'light' : 'dark';

if (isMidnight) setMidnightMode(readStoredMode());
