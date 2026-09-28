import {
  useIHasPowerControl,
  useIHasSelectableItems,
  useIProjectorScreenLiftControl,
} from '@pepperdash/mobile-control-react-app-core';
import type { IHasInputsState } from '@pepperdash/mobile-control-react-app-core';
import { TechDisplayConfig } from '../../../types/DemoRoomState';
import TechSection from '../shared/TechSection';
import TechToggleButton from '../shared/TechToggleButton';
import classes from './DisplayControls.module.scss';

/**
 * Power/input controls for one display, plus Screen/Lift controls when the display has a
 * projector screen and/or lift configured (`TechDisplayConfig.screenDeviceKey`/`liftDeviceKey`) -
 * ordinary displays (Left/Right Display) don't, so those two sections just don't render for them.
 */
export const DisplayControls = ({ display }: { display: TechDisplayConfig }) => {
  const power = useIHasPowerControl(display.deviceKey);
  const inputs = useIHasSelectableItems<IHasInputsState>(display.deviceKey);
  const screen = useIProjectorScreenLiftControl(display.screenDeviceKey ?? '');
  const lift = useIProjectorScreenLiftControl(display.liftDeviceKey ?? '');

  const inputItems = inputs?.itemsState?.inputs?.items ?? {};

  return (
    <div className={classes.controls}>
      <TechSection title="Power State">
        <TechToggleButton active={power.powerState === false} onClick={power.powerOff}>
          Power Off
        </TechToggleButton>
        <TechToggleButton active={power.powerState === true} onClick={power.powerOn}>
          Power On
        </TechToggleButton>
      </TechSection>

      <TechSection title="Inputs">
        {Object.entries(inputItems).map(([key, item]) => (
          <TechToggleButton key={key} active={item.isSelected} onClick={() => inputs?.selectItem(key)}>
            {item.name}
          </TechToggleButton>
        ))}
      </TechSection>

      {display.screenDeviceKey && (
        <TechSection title="Screen">
          <TechToggleButton
            active={screen?.projectorScreenLiftControlState?.isInUpPosition === true}
            onClick={screen?.raise}
          >
            Raise
          </TechToggleButton>
          <TechToggleButton
            active={screen?.projectorScreenLiftControlState?.isInUpPosition === false}
            onClick={screen?.lower}
          >
            Lower
          </TechToggleButton>
        </TechSection>
      )}

      {display.liftDeviceKey && (
        <TechSection title="Lift">
          <TechToggleButton
            active={lift?.projectorScreenLiftControlState?.isInUpPosition === true}
            onClick={lift?.raise}
          >
            Raise
          </TechToggleButton>
          <TechToggleButton
            active={lift?.projectorScreenLiftControlState?.isInUpPosition === false}
            onClick={lift?.lower}
          >
            Lower
          </TechToggleButton>
        </TechSection>
      )}
    </div>
  );
};

export default DisplayControls;
