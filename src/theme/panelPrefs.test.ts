import { describe, expect, it } from 'vitest';

import { createPanelPrefs, PanelPref, PanelPrefsEnv } from './panelPrefs';

const isTheme = (v: string) => v === 'classic' || v === 'midnight';
const THEME: PanelPref = { key: 'pd-panel-theme-choice:abc', param: 'pdThemeChoice', isValid: isTheme };
const MODE: PanelPref = { key: 'pd-midnight-mode:abc', param: 'pdMidnightMode', isValid: (v) => v === 'dark' || v === 'light' };

type StorageMode = 'works' | 'blocked' | 'readOnly';

/** A browser stand-in: the page URL, localStorage in one of three states, and what navigation did. */
function fakeBrowser(startUrl: string, storageMode: StorageMode = 'works', stored: Record<string, string> = {}) {
  const state = { href: startUrl, replaced: [] as string[], navigated: [] as string[], stored: { ...stored } };
  const storage = {
    getItem: (k: string) => state.stored[k] ?? null,
    setItem: (k: string, v: string) => {
      if (storageMode === 'readOnly') throw new Error('QuotaExceededError');
      state.stored[k] = v;
    },
    removeItem: (k: string) => {
      if (storageMode === 'readOnly') throw new Error('QuotaExceededError');
      delete state.stored[k];
    },
  };
  const env: PanelPrefsEnv = {
    href: () => state.href,
    storage: () => {
      if (storageMode === 'blocked') throw new Error('SecurityError');
      return storage;
    },
    replaceUrl: (url) => {
      state.replaced.push(url);
      state.href = url;
    },
    navigate: (url) => state.navigated.push(url),
  };
  return { env, state };
}

const query = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe('panelPrefs where storage works', () => {
  it('stores a preference and leaves the URL alone', () => {
    const { env, state } = fakeBrowser('http://p:50002/mc/app/?token=abc');
    const prefs = createPanelPrefs(env, [THEME]);

    expect(prefs.write(THEME, 'midnight')).toBe('stored');
    expect(state.stored[THEME.key]).toBe('midnight');
    expect(state.replaced).toEqual([]);
    expect(prefs.read(THEME)).toBe('midnight');
  });
});

describe('panelPrefs where storage is blocked (a TSW)', () => {
  it('carries a preference in the URL, and reloads keeping it and the token', () => {
    const { env, state } = fakeBrowser('http://p:50002/mc/app/?token=abc', 'blocked');
    const prefs = createPanelPrefs(env, [THEME]);

    expect(prefs.write(THEME, 'midnight')).toBe('url');
    expect(query(state.href)).toEqual({ token: 'abc', pdThemeChoice: 'midnight' });

    prefs.reload();
    expect(query(state.navigated[0])).toEqual({ token: 'abc', pdThemeChoice: 'midnight' });
  });

  it('reads a preference the URL carried in on load', () => {
    const { env } = fakeBrowser('http://p:50002/mc/app/?token=abc&pdThemeChoice=midnight', 'blocked');
    expect(createPanelPrefs(env, [THEME]).read(THEME)).toBe('midnight');
  });

  // React Router drops the query when it navigates. Without the token, a reload can't reconnect
  // where storage is blocked, since the Mobile Control library reads the token from the query.
  it('puts the token and preferences back after a route change drops the query', () => {
    const { env, state } = fakeBrowser('http://p:50002/mc/app/?token=abc&pdThemeChoice=midnight', 'blocked');
    const prefs = createPanelPrefs(env, [THEME]);

    state.href = 'http://p:50002/mc/app/tech'; // what navigate('/tech') leaves
    prefs.keepInUrl();
    expect(new URL(state.href).pathname).toBe('/mc/app/tech');
    expect(query(state.href)).toEqual({ token: 'abc', pdThemeChoice: 'midnight' });

    prefs.reload();
    expect(query(state.navigated[0]).token).toBe('abc');
  });

  it('does nothing when the URL already has everything', () => {
    const { env, state } = fakeBrowser('http://p:50002/mc/app/?token=abc', 'blocked');
    createPanelPrefs(env, [THEME]).keepInUrl();
    expect(state.replaced).toEqual([]);
  });

  it('carries several preferences at once, and clearing one takes it out of the URL', () => {
    const { env, state } = fakeBrowser('http://p:50002/mc/app/?token=abc', 'blocked');
    const prefs = createPanelPrefs(env, [THEME, MODE]);

    prefs.write(THEME, 'midnight');
    prefs.write(MODE, 'light');
    expect(query(state.href)).toEqual({ token: 'abc', pdThemeChoice: 'midnight', pdMidnightMode: 'light' });

    prefs.write(MODE, null);
    expect(query(state.href)).toEqual({ token: 'abc', pdThemeChoice: 'midnight' });
  });
});

describe('panelPrefs where storage reads but cannot write', () => {
  // A stale stored value must not beat the newer value the URL carries.
  it('prefers the URL over a stale stored value', () => {
    const { env } = fakeBrowser('http://p:50002/mc/app/?token=abc&pdThemeChoice=midnight', 'readOnly', {
      [THEME.key]: 'classic',
    });
    expect(createPanelPrefs(env, [THEME]).read(THEME)).toBe('midnight');
  });
});

describe('panelPrefs validation', () => {
  it('ignores an invalid value in the URL or in storage', () => {
    const { env } = fakeBrowser('http://p:50002/mc/app/?token=abc&pdThemeChoice=foo', 'works', {
      [THEME.key]: 'bar',
    });
    const prefs = createPanelPrefs(env, [THEME]);
    expect(prefs.read(THEME)).toBeNull();
    expect(prefs.loadedWith(THEME)).toBeNull();
  });

  it("leaves other owners' query parameters alone", () => {
    const { env, state } = fakeBrowser('http://p:50002/mc/app/?token=abc&theme=dark', 'blocked');
    createPanelPrefs(env, [THEME]).write(THEME, 'midnight');
    expect(query(state.href)).toEqual({ token: 'abc', theme: 'dark', pdThemeChoice: 'midnight' });
  });
});
