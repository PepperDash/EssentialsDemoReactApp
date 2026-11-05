import { useState } from 'react';
import Header from '../shared/Header/Header';
import Fader from '../shared/Fader/Fader';
import ActivityFooter from '../shared/ActivityFooter/ActivityFooter';
import ToggleSwitch from '../shared/ToggleSwitch/ToggleSwitch';
import BasicSourceSelection from './SourceSelection/BasicSourceSelection';
import AdvancedSourceSelection from './SourceSelection/AdvancedSourceSelection';
import { isMidnight } from '../../theme/theme';
import { useTour } from '../../hooks/useTour';
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
 *
 * While the guided tour runs, it decides whether Advanced shows (see `TourProvider`); the user's
 * own choice comes back when the tour ends.
 */
export const RoomHome = () => {
  const [advancedChoice, setAdvancedSharing] = useState(false);
  const tour = useTour();
  const advancedSharing = tour.advanced ?? advancedChoice;
  // Midnight shows the source buttons in their own full-width band above the activity footer.
  // Basic/advanced selection still own the buttons and portal them into this element; undefined
  // (the original theme) keeps them inline in the content area.
  const [sourceBand, setSourceBand] = useState<HTMLDivElement | null>(null);
  const tabsContainer = isMidnight ? sourceBand : undefined;

  // Midnight moves this toggle into the sources band too.
  const advancedToggle = (
    <div data-tour="advanced-toggle">
      <ToggleSwitch
        caption={advancedSharing || isMidnight ? 'Advanced' : 'Advanced Sharing'}
        on={advancedSharing}
        onChange={setAdvancedSharing}
      />
    </div>
  );

  return (
    <div className={classes.page}>
      <Header />

      <div className={classes.main}>
        <div className={classes.leftGutter}>{!isMidnight && advancedToggle}</div>

        <div className={classes.content}>
          {advancedSharing ? (
            <AdvancedSourceSelection tabsContainer={tabsContainer} />
          ) : (
            <BasicSourceSelection tabsContainer={tabsContainer} />
          )}
        </div>

        <div className={classes.rightGutter} data-tour="volume">
          <Fader />
        </div>
      </div>

      {isMidnight && (
        <div className={classes.sourceBand}>
          <div className={classes.bandToggle}>{advancedToggle}</div>
          <div ref={setSourceBand} />
        </div>
      )}

      <ActivityFooter />
    </div>
  );
};

export default RoomHome;
