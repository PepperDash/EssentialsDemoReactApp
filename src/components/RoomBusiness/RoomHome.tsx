import { useState } from 'react';
import Header from '../shared/Header/Header';
import Fader from '../shared/Fader/Fader';
import ActivityFooter from '../shared/ActivityFooter/ActivityFooter';
import ToggleSwitch from '../shared/ToggleSwitch/ToggleSwitch';
import BasicSourceSelection from './SourceSelection/BasicSourceSelection';
import AdvancedSourceSelection from './SourceSelection/AdvancedSourceSelection';
import classes from './RoomHome.module.scss';

/**
 * The room's "on" home screen. The "Advanced" toggle switches the whole center content between
 * basic mode (`BasicSourceSelection` - one selection routes to every display) and advanced mode
 * (`AdvancedSourceSelection` - pick a source, then a destination, per display). Everything else on
 * the page - header, this toggle, the fader, the activity footer - is identical between the two,
 * per the design.
 *
 * Not built on the library's `MainLayout` shell: its header row is a fixed 120px and its volume
 * column a fixed 112px, but this design (every page so far) specifies a 75px header and 140px
 * gutters throughout. Forcing MainLayout would leave a visible gap under the header. `Header`,
 * `Fader`, and `ActivityFooter` are still the same reusable pieces either way.
 */
export const RoomHome = () => {
  const [advancedSharing, setAdvancedSharing] = useState(false);

  return (
    <div className={classes.page}>
      <Header />

      <div className={classes.main}>
        <div className={classes.leftGutter}>
          <ToggleSwitch
            caption={advancedSharing ? 'Advanced' : 'Advanced Sharing'}
            on={advancedSharing}
            onChange={setAdvancedSharing}
          />
        </div>

        <div className={classes.content}>
          {advancedSharing ? <AdvancedSourceSelection /> : <BasicSourceSelection />}
        </div>

        <div className={classes.rightGutter}>
          <Fader />
        </div>
      </div>

      <ActivityFooter />
    </div>
  );
};

export default RoomHome;
