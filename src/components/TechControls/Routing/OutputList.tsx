import type { RoutingOutputSlotInfo, RoutingSlotInfo } from '@pepperdash/mobile-control-react-app-core';
import OutputTile from './OutputTile';
import classes from './OutputList.module.scss';

/** The matrix's outputs - tapping one applies the currently-selected input/signal type to it. */
export const OutputList = ({
  outputs,
  inputSlots,
  onSelect,
}: {
  outputs: Record<string, RoutingOutputSlotInfo>;
  inputSlots: Record<string, RoutingSlotInfo>;
  onSelect: (outputKey: string) => void;
}) => (
  <div className={classes.outputs}>
    <h2 className={classes.title}>Outputs</h2>

    <div className={classes.tileList}>
      {Object.entries(outputs).map(([key, output]) => (
        <OutputTile key={key} output={output} inputSlots={inputSlots} onClick={() => onSelect(key)} />
      ))}
    </div>
  </div>
);

export default OutputList;
