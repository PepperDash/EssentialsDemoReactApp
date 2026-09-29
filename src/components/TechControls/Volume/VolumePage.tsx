import { useRoomAudioControlPointList, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import DeviceLevelFader from '../../shared/Fader/DeviceLevelFader';
import Fader from '../../shared/Fader/Fader';
import classes from './VolumePage.module.scss';

/**
 * Tech Volume page: the room's master volume plus every configured level control
 * (`audioControlPointList.levelControls`), as one uniform row of faders - the same controls and
 * data source as `AudioControlsModal`, just laid out for the tech page's dark full-width layout
 * (no light/dark divider between "Room" and the rest, since there's no light-background section
 * here to divide from).
 */
export const VolumePage = () => {
  const roomKey = useRoomKey();
  const audioControlPointList = useRoomAudioControlPointList(roomKey);

  const levelControls = Object.values(audioControlPointList?.levelControls ?? {}).sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className={classes.page}>
      <div className={classes.faders}>
        <Fader label="Room" dark />

        {levelControls.map((item) => (
          <DeviceLevelFader
            key={item.deviceKey}
            deviceKey={item.deviceKey}
            label={item.preferredName}
            isMic={item.isMic}
            dark
          />
        ))}
      </div>
    </div>
  );
};

export default VolumePage;
