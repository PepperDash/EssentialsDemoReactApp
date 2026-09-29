import { useIHasSelectableItems } from '@pepperdash/mobile-control-react-app-core';
import type { IHasInputsState } from '@pepperdash/mobile-control-react-app-core';
import classes from './DisplayListButton.module.scss';

/** One entry in the Displays page's display list, labeled with the device's own real name. */
export const DisplayListButton = ({
  deviceKey,
  active,
  onSelect,
}: {
  deviceKey: string;
  active: boolean;
  onSelect: () => void;
}) => {
  const state = useIHasSelectableItems<IHasInputsState>(deviceKey)?.itemsState;

  return (
    <button
      type="button"
      className={`${classes.button} ${active ? classes.active : ''}`}
      onClick={onSelect}
    >
      {state?.name ?? deviceKey}
    </button>
  );
};

export default DisplayListButton;
