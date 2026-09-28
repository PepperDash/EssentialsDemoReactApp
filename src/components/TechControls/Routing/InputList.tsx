import TechToggleButton from '../shared/TechToggleButton';
import RoutingInputButton, { type RoutingInputSlotInfo } from './RoutingInputButton';
import classes from './InputList.module.scss';

/**
 * Sentinel selected-input value meaning "clear the route" rather than route a real input - distinct
 * from `undefined` (nothing selected yet, no button highlighted), since a real input key could in
 * principle be any string.
 */
export const NONE_INPUT = '$none';

/**
 * The matrix's inputs, plus a trailing "None" button (clears whatever's routed to an output
 * instead of assigning an input to it) - one of these is "selected" at a time; tapping an output
 * then applies that selection to it.
 */
export const InputList = ({
  inputs,
  selectedInputKey,
  onSelect,
}: {
  inputs: Record<string, RoutingInputSlotInfo>;
  selectedInputKey: string | undefined;
  onSelect: (inputKey: string) => void;
}) => (
  <div className={classes.inputs}>
    <h2 className={classes.title}>Inputs</h2>

    <div className={classes.buttonList}>
      {Object.entries(inputs).map(([key, input]) => (
        <RoutingInputButton
          key={key}
          input={input}
          className={classes.button}
          active={selectedInputKey === key}
          onClick={() => onSelect(key)}
        />
      ))}

      <TechToggleButton
        className={classes.button}
        active={selectedInputKey === NONE_INPUT}
        onClick={() => onSelect(NONE_INPUT)}
      >
        None
      </TechToggleButton>
    </div>
  </div>
);

export default InputList;
