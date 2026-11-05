import { useRoomConfiguration, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import { useTour } from '../../../../hooks/useTour';
import classes from './HelpModal.module.scss';

/**
 * Help panel, opened from the header's help icon. The message is entirely config-driven: it's
 * `configuration.helpMessage`, which the framework's room bridge already populates from
 * `EssentialsRoomPropertiesConfig.HelpMessageForDisplay` (preferring the room's `help.message`
 * over the legacy top-level `helpMessage` string) for any room implementing
 * `IEssentialsRoomPropertiesConfig`, which `DemoRoom` does - no plugin-side code needed for this.
 *
 * Below the message, "Take the tour" starts the guided tour of the room's screens (see
 * `TourProvider`), which closes this modal.
 */
export const HelpModal = () => {
  const roomKey = useRoomKey();
  const configuration = useRoomConfiguration(roomKey);
  const { start } = useTour();

  return (
    <div className={classes.wrapper}>
      <p className={classes.message}>{configuration?.helpMessage}</p>
      <button type="button" className={classes.tourButton} onClick={start}>
        Take the tour
      </button>
    </div>
  );
};

export default HelpModal;
