import TechToggleButton from '../shared/TechToggleButton';
import classes from './RoutingModeSelect.module.scss';

export type RoutingMode = 'matrix' | 'graph';

const OPTIONS: { mode: RoutingMode; label: string }[] = [
  { mode: 'matrix', label: 'Matrix' },
  { mode: 'graph', label: 'Graph' },
];

/** Switches the Routing page between the matrix tie control and the whole-system routing graph. */
export const RoutingModeSelect = ({ mode, onChange }: { mode: RoutingMode; onChange: (mode: RoutingMode) => void }) => (
  <div className={classes.modeSelect}>
    {OPTIONS.map((option) => (
      <TechToggleButton
        key={option.mode}
        active={mode === option.mode}
        onClick={() => onChange(option.mode)}
        className={classes.modeButton}
      >
        {option.label}
      </TechToggleButton>
    ))}
  </div>
);

export default RoutingModeSelect;
