// This panel's stored preferences (theme, light/dark mode, accent color), kept in localStorage where
// it works and in the page URL where it doesn't.
//
// A TSW panel needs the URL: its wrapper app shows this UI in an iframe from the processor, a
// different origin, and the panel's browser blocks storage for it. There, a preference that can't be
// stored goes in a query parameter instead, and stays in the URL so any reload keeps it - including
// reloads the Mobile Control library makes itself. The Mobile Control token in the URL is kept the
// same way: the library reads it from the query on every load, and in-app navigation drops the query
// (see KeepPanelQuery). Preferences carried this way last until the wrapper reloads the UI fresh,
// e.g. after a panel reboot.

/** One preference: where it's stored, the query parameter that carries it, and its valid values. */
export interface PanelPref {
  key: string;
  param: string;
  isValid: (value: string) => boolean;
}

/** What the store needs from the browser; injected so it can be tested without one. */
export interface PanelPrefsEnv {
  /** The current page URL. */
  href: () => string;
  /** localStorage, or null if even reaching it throws. */
  storage: () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  /** Rewrites the current history entry's URL without loading it. */
  replaceUrl: (url: string) => void;
  /** Loads a URL in place of the current page. */
  navigate: (url: string) => void;
}

export type WriteResult = 'stored' | 'url';

const TOKEN_PARAM = 'token';

export function createPanelPrefs(env: PanelPrefsEnv, prefs: readonly PanelPref[]) {
  const startup = new URL(env.href()).searchParams;
  const ownParams = new Set(prefs.map((p) => p.param));

  // The parameters this page keeps in its URL: the token it loaded with, and any preference that
  // couldn't be stored.
  const carried = new URLSearchParams();
  const token = startup.get(TOKEN_PARAM);
  if (token) carried.set(TOKEN_PARAM, token);
  for (const pref of prefs) {
    const value = startup.get(pref.param);
    if (value !== null && pref.isValid(value)) carried.set(pref.param, value);
  }

  const withStorage = <T>(use: (storage: NonNullable<ReturnType<PanelPrefsEnv['storage']>>) => T) => {
    try {
      const storage = env.storage();
      return storage ? use(storage) : undefined;
    } catch {
      return undefined;
    }
  };

  /** The current URL with the carried parameters put back, and stale preference parameters removed. */
  const urlWithCarried = () => {
    const url = new URL(env.href());
    for (const name of [...url.searchParams.keys()]) {
      if (ownParams.has(name) && !carried.has(name)) url.searchParams.delete(name);
    }
    carried.forEach((value, name) => url.searchParams.set(name, value));
    return url.toString();
  };

  /** Puts the carried parameters back in the URL if something (e.g. a route change) dropped them. */
  const keepInUrl = () => {
    const url = urlWithCarried();
    if (url !== env.href()) env.replaceUrl(url);
  };

  return {
    /** The token the page loaded with, if its URL had one. */
    token,

    /**
     * The preference's value, or null. The URL wins over storage: a value is only ever put in the URL
     * because storage couldn't take it, so it's the newer one.
     */
    read(pref: PanelPref): string | null {
      const fromUrl = carried.get(pref.param);
      if (fromUrl !== null) return fromUrl;
      const stored = withStorage((s) => s.getItem(pref.key));
      return stored != null && pref.isValid(stored) ? stored : null;
    },

    /** The value the page's URL carried for this preference when it loaded, if any. */
    loadedWith(pref: PanelPref): string | null {
      const value = startup.get(pref.param);
      return value !== null && pref.isValid(value) ? value : null;
    },

    /** Saves the preference (null clears it), in storage if possible and in the URL if not. */
    write(pref: PanelPref, value: string | null): WriteResult {
      const stored =
        withStorage((s) => {
          if (value === null) s.removeItem(pref.key);
          else s.setItem(pref.key, value);
          return true;
        }) === true;

      if (stored || value === null) carried.delete(pref.param);
      else carried.set(pref.param, value);
      keepInUrl();
      return stored ? 'stored' : 'url';
    },

    keepInUrl,

    /** Reloads the page, keeping the token and carried preferences in its URL. */
    reload() {
      env.navigate(urlWithCarried());
    },
  };
}

export type PanelPrefs = ReturnType<typeof createPanelPrefs>;
