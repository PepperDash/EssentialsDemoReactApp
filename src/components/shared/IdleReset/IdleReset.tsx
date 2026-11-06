import { useIdleTimeout } from '../../../hooks/useIdleTimeout';
import { useTour } from '../../../hooks/useTour';
import { resetThemeChoice } from '../../../theme/theme';

// Local development override: VITE_IDLE_RESET_SECONDS in .env.local (gitignored) shortens the wait,
// for trying the reset without leaving the panel alone for five minutes.
const devSeconds = import.meta.env.DEV ? Number(import.meta.env.VITE_IDLE_RESET_SECONDS) : NaN;

/** How long the panel sits untouched before it's set back up for the next person. */
const IDLE_RESET_MS = devSeconds > 0 ? devSeconds * 1000 : 5 * 60 * 1000;

/**
 * Sets the panel back up for the next person once it has sat untouched for `IDLE_RESET_MS`: ends
 * a tour left running, offers the tour in the footer again, and goes back to the panel's own theme
 * if someone picked another in Settings (which reloads the page). Renders nothing.
 *
 * Must sit inside TourProvider.
 */
export const IdleReset = () => {
  const { end, resetTaken } = useTour();

  useIdleTimeout(IDLE_RESET_MS, () => {
    end();
    // Before the theme reset, which may reload the page.
    resetTaken();
    resetThemeChoice();
  });

  return null;
};

export default IdleReset;
