import { useState } from 'react';
import { useTechDisplays } from '../../../hooks/useTechDisplays';
import DisplayControls from './DisplayControls';
import DisplayListButton from './DisplayListButton';
import classes from './DisplaysPage.module.scss';

/**
 * Tech Displays page: a list of the room's displays on the left (`techDisplays`), and power/input
 * (plus screen/lift, when present) controls for whichever one is selected on the right.
 */
export const DisplaysPage = () => {
  const displays = useTechDisplays();
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);

  const selected = displays.find((d) => d.deviceKey === selectedKey) ?? displays[0];

  return (
    <div className={classes.page}>
      <div className={classes.main}>
        <div className={classes.list}>
          <h2 className={classes.title}>Displays</h2>

          <div className={classes.buttonList}>
            {displays.map((display) => (
              <DisplayListButton
                key={display.deviceKey}
                deviceKey={display.deviceKey}
                active={display.deviceKey === selected?.deviceKey}
                onSelect={() => setSelectedKey(display.deviceKey)}
              />
            ))}
          </div>
        </div>

        {selected && <DisplayControls key={selected.deviceKey} display={selected} />}
      </div>
    </div>
  );
};

export default DisplaysPage;
