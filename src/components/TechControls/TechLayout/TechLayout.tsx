import { Outlet } from 'react-router-dom';
import { useTechDeviceSync } from '../../../hooks/useTechDeviceSync';
import TechHeader from './TechHeader';
import TechNav from './TechNav';
import classes from './TechLayout.module.scss';

/**
 * Shell for every PIN-gated tech page: black `TechHeader`, `TechNav` sidebar, and whichever tech
 * page is routed into the outlet.
 *
 * Not built on the library's `TechLayout` shell: its header row is a fixed 120px and its leftNav a
 * fixed 300px, but this design specifies a 75px header and 250px nav - the same mismatch that ruled
 * out `MainLayout` for `RoomHome`.
 */
export const TechLayout = () => {
  useTechDeviceSync();

  return (
    <div className={classes.page}>
      <TechHeader />

      <div className={classes.main}>
        <TechNav />

        <div className={classes.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default TechLayout;
