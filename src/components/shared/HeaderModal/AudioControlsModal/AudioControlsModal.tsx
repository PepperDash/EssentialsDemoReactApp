import { useRoomAudioControlPointList, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import DeviceLevelFader from '../../Fader/DeviceLevelFader';
import Fader from '../../Fader/Fader';
import classes from './AudioControlsModal.module.scss';

/**
 * Audio controls panel, opened from the header's third icon. Two groups, matching the design:
 * "secondary faders" - every configured level control (`audioControlPointList.levelControls`),
 * entirely config-driven rather than hardcoded to this demo's particular channel names - and the
 * room's own master volume, set apart by a divider on the right.
 *
 * The room's master volume is *not* one of the configured level controls: the demo's single level
 * control list intentionally holds only the auxiliary channels (currently the program-audio
 * destination's own volume, standing in for "Program", plus two mock mic gains) so it wouldn't
 * duplicate what `IHasCurrentVolumeControls`/`master` already covers for the room itself.
 */
export const AudioControlsModal = () => {
  const roomKey = useRoomKey();
  const audioControlPointList = useRoomAudioControlPointList(roomKey);

  const levelControls = Object.values(audioControlPointList?.levelControls ?? {}).sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className={classes.wrapper}>
      <div className={classes.secondaryFaders}>
        {levelControls.map((item) => (
          <DeviceLevelFader
            key={item.deviceKey}
            deviceKey={item.deviceKey}
            label={item.preferredName}
            isMic={item.isMic}
          />
        ))}
      </div>

      <div className={classes.divider} />

      <div className={classes.mainFader}>
        <Fader label="Room" />
      </div>
    </div>
  );
};

export default AudioControlsModal;
