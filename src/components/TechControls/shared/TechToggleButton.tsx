import type { ReactNode } from 'react';
import classes from './TechToggleButton.module.scss';

/**
 * One button in a tech control section (Power State/Inputs/Screen/Lift, etc.) - highlighted blue
 * when it represents the device's current state, plain gray otherwise. Every such section on the
 * tech pages uses this same pill shape per the Figma design.
 */
export const TechToggleButton = ({
  active,
  pulsing = false,
  onClick,
  className,
  children,
}: {
  active: boolean;
  /** Pulses between the inactive and active colors, for a state the device is transitioning into. */
  pulsing?: boolean;
  onClick?: () => void;
  /** Extra class(es) appended after the base/active styling, e.g. to override width for a
   * narrower or wider button list (Power State/Screen/Lift are 200px; Routing's are not). */
  className?: string;
  children: ReactNode;
}) => (
  <button
    type="button"
    className={`${classes.button} ${active ? classes.active : ''} ${pulsing ? classes.pulsing : ''} ${className ?? ''}`}
    onClick={onClick}
  >
    {children}
  </button>
);

export default TechToggleButton;
