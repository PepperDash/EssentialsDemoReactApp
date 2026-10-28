import { MobileControlProvider } from '@pepperdash/mobile-control-react-app-core';
import RoomBusiness from './components/RoomBusiness/RoomBusiness';
import KeepPanelQuery from './theme/KeepPanelQuery';
import PanelThemeSync from './theme/PanelThemeSync';

/**
 * Application root.
 *
 * `MobileControlProvider` owns everything that talks to the processor: it reads the app config,
 * opens the Mobile Control websocket, joins the room for this session, and puts the resulting
 * device and room state in a Redux store. Every hook from the core library reads from that store,
 * so all UI must render inside this provider.
 */
function App() {
  return (
    <MobileControlProvider>
      <KeepPanelQuery />
      <PanelThemeSync />
      <RoomBusiness />
    </MobileControlProvider>
  );
}

export default App;
