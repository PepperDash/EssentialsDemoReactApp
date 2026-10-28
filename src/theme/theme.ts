// Which UI theme this panel uses comes from the panel's own config ("theme": "midnight" on its
// mcxpanel/mctsw device); anything else keeps the original UI. The config only arrives after the
// websocket connects, but parts of Midnight are chosen once at page load (icon sets, the sources
// band, lighting behavior). So the last theme the config asked for is remembered and applied here,
// before anything renders - and PanelThemeSync reloads once if the config asks for a different one.
// A theme picked in the Settings modal overrides the config.
//
// All preferences (the themes, light/dark mode and accent color below) are kept per panel, so panels
// opened in the same browser don't share them, in localStorage or, where storage is blocked (a TSW),
// in the page URL - see panelPrefs.ts. The panel's Mobile Control token is the only identity
// available before the websocket connects: in the query on first load, then in the session path
// (/mc/app/<token>/<roomKey>/).
import { createPanelPrefs, PanelPref } from './panelPrefs';

export type ThemeName = 'classic' | 'midnight';
export type ColorMode = 'dark' | 'light';

const isThemeName = (value: string): value is ThemeName => value === 'classic' || value === 'midnight';
const isColorMode = (value: string): value is ColorMode => value === 'dark' || value === 'light';
const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

const startupToken = new URLSearchParams(location.search).get('token');
const pathSegments = location.pathname.split('/').filter(Boolean);
/** Identifies this panel for its stored preferences (see above). */
export const panelId =
  startupToken ??
  (pathSegments.length >= 4 ? pathSegments[2] : undefined) ?? // only a full session path carries the token
  'default';

// The theme the config last asked for, and a theme picked in Settings (which overrides the config
// and the dev override below, so a user's choice sticks on this panel until they pick again).
const CONFIGURED_THEME: PanelPref = { key: `pd-panel-theme:${panelId}`, param: 'pdTheme', isValid: isThemeName };
const CHOSEN_THEME: PanelPref = { key: `pd-panel-theme-choice:${panelId}`, param: 'pdThemeChoice', isValid: isThemeName };

// Each theme remembers its own light/dark mode and accent color.
const modePref = (theme: ThemeName): PanelPref => ({
  key: `pd-${theme}-mode:${panelId}`,
  param: theme === 'midnight' ? 'pdMidnightMode' : 'pdClassicMode',
  isValid: isColorMode,
});
const accentPref = (theme: ThemeName): PanelPref => ({
  key: `pd-${theme}-accent:${panelId}`,
  param: theme === 'midnight' ? 'pdMidnightAccent' : 'pdClassicAccent',
  isValid: isHexColor,
});

const prefs = createPanelPrefs(
  {
    href: () => location.href,
    storage: () => localStorage,
    // Keep the router's history state: React Router keeps its entry key there.
    replaceUrl: (url) => history.replaceState(history.state, '', url),
    navigate: (url) => location.replace(url),
  },
  [CONFIGURED_THEME, CHOSEN_THEME, ...(['classic', 'midnight'] as const).flatMap((t) => [modePref(t), accentPref(t)])]
);

/** Puts the token and carried preferences back in the URL after in-app navigation drops them. */
export const keepPanelQuery = prefs.keepInUrl;

const chosenTheme = prefs.read(CHOSEN_THEME);

// Local development override: VITE_FORCE_THEME in .env.local (gitignored) pins the theme and
// ignores the panel's config, for previewing a theme without editing the processor's config.
const forcedTheme: string | undefined = import.meta.env.DEV ? import.meta.env.VITE_FORCE_THEME : undefined;

if ((chosenTheme ?? forcedTheme ?? prefs.read(CONFIGURED_THEME)) === 'midnight') {
  document.documentElement.dataset.theme = 'midnight';
}

// Fixed for the life of the page. Used to pick the thin outlined icon set, which the <img>-loaded
// icons can't get from CSS.
export const isMidnight = document.documentElement.dataset.theme === 'midnight';
const pageTheme: ThemeName = isMidnight ? 'midnight' : 'classic';

/**
 * Saves `pref` and reloads into it - unless the value could only go in the URL and the page already
 * loaded with it there, which means reloading won't change anything and would loop.
 */
const saveAndReload = (pref: PanelPref, theme: ThemeName) => {
  if (prefs.write(pref, theme) === 'url' && prefs.loadedWith(pref) === theme) return;
  prefs.reload();
};

/** Called with the panel's configured theme; reloads once if it doesn't match the page's. */
export const applyConfiguredTheme = (configTheme: string) => {
  const theme: ThemeName = configTheme === 'midnight' ? 'midnight' : 'classic';
  if (chosenTheme !== null || forcedTheme !== undefined || theme === pageTheme) return;
  saveAndReload(CONFIGURED_THEME, theme);
};

/** The Settings modal's theme picker: remembers the choice for this panel and reloads into it. */
export const chooseTheme = (theme: ThemeName) => {
  if (theme === pageTheme) return;
  saveAndReload(CHOSEN_THEME, theme);
};

// Light/dark mode. Only colors change between the two (see styles.scss), so it's a data-mode
// attribute on <html> rather than React state - nothing re-renders. Midnight defaults to dark and
// the original theme to light; each theme remembers its own mode per panel.
const MODE = modePref(pageTheme);
const DEFAULT_MODE: ColorMode = isMidnight ? 'dark' : 'light';

const applyColorMode = (mode: ColorMode) => {
  document.documentElement.dataset.mode = mode;
  applyAccent(); // Midnight's highlight shade depends on the mode.
};

export const setColorMode = (mode: ColorMode) => {
  prefs.write(MODE, mode);
  applyColorMode(mode);
};

export const getColorMode = (): ColorMode =>
  document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light';

// Accent color, picked in the Settings modal. Each theme remembers its own per panel; none stored
// means the theme's built-in accent from styles.scss. A picked color is written as inline custom
// properties on <html>, which override the stylesheet's.
const ACCENT = accentPref(pageTheme);
let accent = prefs.read(ACCENT);

type Rgb = [number, number, number];

const toRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** `color` moved toward `target` by `amount` (0-1). */
const mix = (color: Rgb, target: Rgb, amount: number): Rgb =>
  color.map((c, i) => Math.round(c + (target[i] - c) * amount)) as Rgb;

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];
const triplet = (rgb: Rgb) => rgb.join(', ');
const hex = (rgb: Rgb) => `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

// WCAG relative luminance and contrast ratio.
const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** White or a deep shade of the accent, whichever reads better on every one of `backgrounds`. */
const foregroundFor = (accentRgb: Rgb, backgrounds: Rgb[]) => {
  const candidates = [WHITE, mix(accentRgb, BLACK, 0.85)];
  const worst = (fg: Rgb) => Math.min(...backgrounds.map((bg) => contrast(fg, bg)));
  return hex(worst(candidates[0]) >= worst(candidates[1]) ? candidates[0] : candidates[1]);
};

const ACCENT_PROPS = [
  '--pd-accent',
  '--pd-focus',
  '--pd-pill',
  '--pd-accent-light',
  '--pd-accent-dark',
  '--pd-active-bg',
  '--pd-active-border',
  '--pd-glow',
  '--pd-glow-deep',
  '--pd-glow-soft',
  '--pd-on-active',
  '--pd-highlight',
];

const applyAccent = () => {
  const style = document.documentElement.style;
  ACCENT_PROPS.forEach((prop) => style.removeProperty(prop));
  if (!accent) return;

  const rgb = toRgb(accent);
  style.setProperty('--pd-accent', accent);
  style.setProperty('--pd-focus', accent);
  if (!isMidnight) {
    // The original theme only uses the flat accent, plus readable text on it.
    style.setProperty('--pd-on-active', foregroundFor(rgb, [rgb]));
    return;
  }

  // Midnight builds its gradients, glows and highlight from tints and shades of the accent.
  style.setProperty('--pd-pill', accent);
  style.setProperty('--pd-accent-light', hex(mix(rgb, WHITE, 0.5)));
  style.setProperty('--pd-accent-dark', hex(mix(rgb, BLACK, 0.18)));
  const activeTop = mix(rgb, WHITE, 0.2);
  const activeBottom = mix(rgb, BLACK, 0.08);
  style.setProperty('--pd-active-bg', `linear-gradient(180deg, ${hex(activeTop)}, ${hex(activeBottom)})`);
  style.setProperty('--pd-active-border', `rgba(${triplet(mix(rgb, WHITE, 0.45))}, 0.8)`);
  style.setProperty('--pd-glow', triplet(mix(rgb, WHITE, 0.2)));
  style.setProperty('--pd-glow-deep', triplet(mix(rgb, BLACK, 0.05)));
  style.setProperty('--pd-glow-soft', triplet(mix(rgb, WHITE, 0.6)));
  style.setProperty('--pd-on-active', foregroundFor(rgb, [activeTop, rgb, activeBottom]));
  // Light mode needs a darker shade to read on its pale bands.
  style.setProperty('--pd-highlight', hex(getColorMode() === 'light' ? mix(rgb, BLACK, 0.3) : mix(rgb, WHITE, 0.15)));
};

/** The panel's picked accent color (#rrggbb), or null for the theme's own. */
export const getAccentColor = () => accent;

/** Sets this panel's accent color (#rrggbb), or null to go back to the theme's own. */
export const setAccentColor = (color: string | null) => {
  accent = color;
  prefs.write(ACCENT, color);
  applyAccent();
};

// Applied, not saved: nothing has changed yet, so there's nothing to write.
applyColorMode((prefs.read(MODE) as ColorMode | null) ?? DEFAULT_MODE);
