import { useRoomIsOn, useRoomKey, useRoomState } from '@pepperdash/mobile-control-react-app-core';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useHasCompletedInitialSync } from '../../hooks/useHasCompletedInitialSync';
import { useInitialDeviceSync } from '../../hooks/useInitialDeviceSync';
import { DemoRoomState } from '../../types/DemoRoomState';
import { HeaderModalProvider } from '../../context/HeaderModalProvider';
import SyncingPage from '../SyncingPage/SyncingPage';
import SplashScreen from './SplashScreen';
import RoomHome from './RoomHome';
import HeaderModalOutlet from '../shared/HeaderModal/HeaderModalOutlet';
import TechPinPage from '../TechControls/TechPin/TechPinPage';
import TechLayout from '../TechControls/TechLayout/TechLayout';
import TechPagePlaceholder from '../TechControls/TechLayout/TechPagePlaceholder';
import SystemStatusPage from '../TechControls/SystemStatus/SystemStatusPage';
import classes from './RoomBusiness.module.scss';

/**
 * Routes for the demo room and the boot-time sync gate they sit behind.
 *
 * This is where a room's screens live. Real deployments usually branch here on
 * `roomState.roomType` to pick one of several room business components; the demo has a single room
 * type, so it renders its routes directly.
 */
const RoomBusiness = () => {
  const roomKey = useRoomKey();
  const roomState = useRoomState<DemoRoomState>(roomKey);
  const isOn = useRoomIsOn(roomKey);
  const hasCompletedInitialSync = useHasCompletedInitialSync();

  // Ask the processor for the state of every device in the room, once, as soon as the room config
  // arrives.
  useInitialDeviceSync();

  // No room state yet means the websocket has not finished joining the room.
  if (!roomState || !hasCompletedInitialSync) {
    return <SyncingPage />;
  }

  return (
    // HeaderModalProvider wraps every route so the header's lighting/help/audio icons open the
    // same overlay no matter which page they're pressed from. HeaderModalOutlet is a sibling of
    // the routed content, not nested inside it, and positions itself against this wrapper - see
    // RoomBusiness.module.scss.
    <HeaderModalProvider>
      <div className={classes.wrapper}>
        <Routes>
          {/* The room-off splash screen is only ever the "/" view, not a route of its own - held
              behind isOn rather than living under its own path. /techPin (held from the header's
              audio icon) and the tech pages behind it need to work whether or not the room is on,
              so they're routes here regardless of isOn, unlike the splash/home split. */}
          <Route path="/" element={isOn ? <RoomHome /> : <SplashScreen />} />
          <Route path="/techPin" element={<TechPinPage />} />

          {/* System Status is the only tech section built so far; the rest are placeholders so
              the nav's other links aren't dead ends while their Figma designs are still pending. */}
          <Route path="/tech" element={<TechLayout />}>
            <Route index element={<Navigate replace to="systemStatus" />} />
            <Route path="systemStatus" element={<SystemStatusPage />} />
            <Route path="displays" element={<TechPagePlaceholder label="Displays" />} />
            <Route path="routing" element={<TechPagePlaceholder label="Routing" />} />
            <Route path="volume" element={<TechPagePlaceholder label="Volume" />} />
            <Route path="about" element={<TechPagePlaceholder label="About" />} />
          </Route>

          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>

        <HeaderModalOutlet />
      </div>
    </HeaderModalProvider>
  );
};

export default RoomBusiness;
