import classes from './ToggleSwitch.module.scss';

interface ToggleSwitchProps {
  caption?: string;
  on: boolean;
  onChange: (on: boolean) => void;
}

/**
 * Generic pill-shaped on/off switch. Purely presentational - the caller owns the state and what
 * flipping it means.
 */
export const ToggleSwitch = ({ caption, on, onChange }: ToggleSwitchProps) => (
  <div className={classes.wrapper}>
    {caption && <span className={classes.caption}>{caption}</span>}
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`${classes.track} ${on ? classes.on : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className={classes.label}>{on ? 'ON' : 'OFF'}</span>
      <span className={classes.knob} />
    </button>
  </div>
);

export default ToggleSwitch;
