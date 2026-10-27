import { useState } from 'react';
import { getMidnightMode, setMidnightMode } from '../../../theme/theme';
import classes from './ThemeToggle.module.scss';

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} {...iconProps}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} {...iconProps}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);

/**
 * Midnight's light/dark switch. On is the light mode (sun showing); off is the original dark
 * Midnight (moon showing). Only rendered in the Midnight theme.
 */
export const ThemeToggle = () => {
  const [light, setLight] = useState(getMidnightMode() === 'light');

  const toggle = () => {
    setMidnightMode(light ? 'dark' : 'light');
    setLight(!light);
  };

  return (
    <div className={classes.wrapper}>
      <span className={classes.caption}>Theme</span>
      <button
        type="button"
        role="switch"
        aria-checked={light}
        aria-label="Light theme" // Fixed name; aria-checked says whether light mode is on.
        className={`${classes.track} ${light ? classes.on : ''}`}
        onClick={toggle}
      >
        {/* Both icons sit in the track; the knob slides over whichever mode isn't active, leaving
            the current mode's icon showing in the empty half. */}
        <SunIcon className={`${classes.icon} ${classes.sun}`} />
        <MoonIcon className={`${classes.icon} ${classes.moon}`} />
        <span className={classes.knob} />
      </button>
    </div>
  );
};

export default ThemeToggle;
