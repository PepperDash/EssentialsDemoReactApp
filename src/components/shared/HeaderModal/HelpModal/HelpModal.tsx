import { useRoomConfiguration, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import classes from './HelpModal.module.scss';

/**
 * Help panel, opened from the header's help icon. The message is entirely config-driven: it's
 * `configuration.helpMessage`, which the framework's room bridge already populates from
 * `EssentialsRoomPropertiesConfig.HelpMessageForDisplay` (preferring the room's `help.message`
 * over the legacy top-level `helpMessage` string) for any room implementing
 * `IEssentialsRoomPropertiesConfig`, which `DemoRoom` does - no plugin-side code needed for this.
 */
export const HelpModal = () => {
  const roomKey = useRoomKey();
  const configuration = useRoomConfiguration(roomKey);

  return (
    <div className={classes.wrapper}>
      <p className={classes.message}>{configuration?.helpMessage}</p>
    </div>
  );
};

export default HelpModal;
