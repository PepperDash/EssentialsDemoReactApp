import type { SignalType } from '@pepperdash/mobile-control-react-app-core';
import TechToggleButton from '../shared/TechToggleButton';
import classes from './MatrixSelect.module.scss';

const OPTIONS: { signalType: SignalType; label: string }[] = [
  { signalType: 'Audio', label: 'Audio' },
  { signalType: 'Video', label: 'Video' },
  { signalType: 'AudioVideo', label: 'Audio & Video' },
];

/**
 * Chooses which signal type a tap on an input then an output routes - matches whichever of these
 * is selected when the route is made, so e.g. picking "Audio" only changes an output's audio
 * crosspoint, leaving its video crosspoint (and vice versa) untouched.
 */
export const MatrixSelect = ({
  signalType,
  onChange,
}: {
  signalType: SignalType;
  onChange: (signalType: SignalType) => void;
}) => (
  <div className={classes.matrixSelect}>
    {OPTIONS.map((option) => (
      <TechToggleButton
        key={option.signalType}
        active={signalType === option.signalType}
        onClick={() => onChange(option.signalType)}
      >
        {option.label}
      </TechToggleButton>
    ))}
  </div>
);

export default MatrixSelect;
