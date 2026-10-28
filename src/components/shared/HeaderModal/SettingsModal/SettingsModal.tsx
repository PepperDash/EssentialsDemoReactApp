import { useState } from 'react';
import { chooseTheme, getAccentColor, isMidnight, setAccentColor, ThemeName } from '../../../../theme/theme';
import ThemeToggle from '../../ThemeToggle/ThemeToggle';
import classes from './SettingsModal.module.scss';

const THEMES: { name: ThemeName; label: string }[] = [
  { name: 'classic', label: 'Default' },
  { name: 'midnight', label: 'Midnight' },
];

// The theme's built-in accent, shown on the reset swatch (matches styles.scss): amber for Midnight,
// blue for the original theme.
const DEFAULT_ACCENT = isMidnight ? '#ffb020' : '#005294';

// Preset accents: the theme's own, then cyan, purple and green. A swatch after them opens the
// panel's own color picker for anything else.
const ACCENTS = [DEFAULT_ACCENT, '#2cc4d6', '#a97bf5', '#3fcf8e'];

/**
 * Settings panel, opened from the header's gear icon: the theme picker, the accent color and the
 * light/dark switch. Picking the other theme reloads the page into it (see chooseTheme in
 * theme.ts); the accent and light/dark mode apply immediately.
 */
export const SettingsModal = () => {
  const currentTheme: ThemeName = isMidnight ? 'midnight' : 'classic';
  const [accent, setAccent] = useState(getAccentColor());
  const [pickerOpen, setPickerOpen] = useState(false);

  const pickAccent = (color: string | null) => {
    setAccentColor(color);
    setAccent(color);
  };
  const shownAccent = accent ?? DEFAULT_ACCENT;
  const isCustom = accent !== null && !ACCENTS.includes(accent);

  return (
    <div className={classes.wrapper}>
      <span className={classes.title}>Settings</span>

      <div className={classes.row}>
        <span className={classes.caption}>Theme</span>
        <div className={classes.segmented} role="radiogroup" aria-label="Theme">
          {THEMES.map(({ name, label }) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={name === currentTheme}
              className={`${classes.segment} ${name === currentTheme ? classes.active : ''}`}
              onClick={() => chooseTheme(name)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={classes.row}>
        <span className={classes.caption}>Accent Color</span>
        <button
          type="button"
          className={`${classes.swatchButton} ${pickerOpen ? classes.open : ''}`}
          aria-label="Accent color"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(!pickerOpen)}
        >
          <span className={classes.swatch} style={{ backgroundColor: shownAccent }} />
        </button>
      </div>

      {pickerOpen && (
        <div className={classes.palette} role="radiogroup" aria-label="Accent color">
          <button
            type="button"
            role="radio"
            aria-checked={accent === null}
            aria-label="Theme default"
            className={`${classes.paletteSwatch} ${classes.reset} ${accent === null ? classes.selected : ''}`}
            style={{ backgroundColor: DEFAULT_ACCENT }}
            onClick={() => pickAccent(null)}
          />
          {ACCENTS.filter((color) => color !== DEFAULT_ACCENT).map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={accent === color}
              aria-label={color}
              className={`${classes.paletteSwatch} ${accent === color ? classes.selected : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => pickAccent(color)}
            />
          ))}
          {/* Any other color: the browser's own picker, under a rainbow swatch. */}
          <label
            className={`${classes.paletteSwatch} ${classes.custom} ${isCustom ? classes.selected : ''}`}
            style={isCustom ? { background: accent } : undefined}
            aria-label="Custom color"
          >
            <input
              type="color"
              className={classes.colorInput}
              value={shownAccent}
              onChange={(event) => pickAccent(event.target.value)}
            />
          </label>
        </div>
      )}

      <div className={classes.row}>
        <span className={classes.caption}>Light Mode</span>
        <ThemeToggle />
      </div>
    </div>
  );
};

export default SettingsModal;
