import {
  uiActions,
  useAppDispatch,
  useIsSyncStateValuePresent,
  useWebsocketContext,
} from '@pepperdash/mobile-control-react-app-core';
import { useEffect } from 'react';
import { useTechRackSensorDeviceKey, useTechSystemStatusDeviceKeys } from './useTechSystemStatus';

const FULL_STATUS = '/fullStatus';

/**
 * Requests full status for the tech System Status page's devices, once, the first time the tech
 * pages are reached.
 *
 * These devices exist purely to back the tech pages (see `DemoRoomTechConfig.SystemStatusDeviceKeys`),
 * so unlike the room's real AV devices - synced eagerly at boot by `useInitialDeviceSync` - there's
 * no reason to ask about them until a tech actually gets past the PIN gate.
 */
export function useTechDeviceSync(): void {
  const { sendMessage } = useWebsocketContext();
  const dispatch = useAppDispatch();
  const techDevicesSynced = useIsSyncStateValuePresent('techDevicesSynced');
  const systemStatusDeviceKeys = useTechSystemStatusDeviceKeys();
  const rackSensorDeviceKey = useTechRackSensorDeviceKey();

  useEffect(() => {
    if (techDevicesSynced) return;

    const deviceKeys = [...systemStatusDeviceKeys, ...(rackSensorDeviceKey ? [rackSensorDeviceKey] : [])];

    if (deviceKeys.length === 0) return;

    const devices = Object.fromEntries(deviceKeys.map((key) => [key, [FULL_STATUS]]));

    sendMessage('/system/batchDeviceFullStatus', { devices });
    dispatch(uiActions.addSyncState('techDevicesSynced'));
  }, [techDevicesSynced, systemStatusDeviceKeys, rackSensorDeviceKey, sendMessage, dispatch]);
}
