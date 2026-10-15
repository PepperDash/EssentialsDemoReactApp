import {
  uiActions,
  useAppDispatch,
  useIsSyncStateValuePresent,
  useSendUnrequestedBatchStatus,
} from '@pepperdash/mobile-control-react-app-core';
import { useEffect } from 'react';
import { useTechDisplays } from './useTechDisplays';
import { useTechRoutingDeviceKey } from './useTechRoutingDeviceKey';
import { useTechRackSensorDeviceKey, useTechSystemStatusDeviceKeys } from './useTechSystemStatus';

const FULL_STATUS = '/fullStatus';

/**
 * Requests full status for every tech page's devices, once, the first time the tech pages are
 * reached.
 *
 * These devices exist purely to back the tech pages (see `DemoRoomTechConfig`), so unlike the
 * room's real AV devices - synced eagerly at boot by `useInitialDeviceSync` - there's no reason to
 * ask about them until a tech actually gets past the PIN gate. One batch covers every tech page
 * rather than each page syncing its own slice, since they all sit behind the same gate anyway.
 *
 * Only devices this connection hasn't already requested are sent (the boot sync may have covered some),
 * and nothing is sent if there are none. `techDevicesSynced` is still set either way, because it records
 * that the tech pages have asked.
 */
export function useTechDeviceSync(): void {
  const sendUnrequestedBatchStatus = useSendUnrequestedBatchStatus();
  const dispatch = useAppDispatch();
  const techDevicesSynced = useIsSyncStateValuePresent('techDevicesSynced');
  const systemStatusDeviceKeys = useTechSystemStatusDeviceKeys();
  const rackSensorDeviceKey = useTechRackSensorDeviceKey();
  const displays = useTechDisplays();
  const routingDeviceKey = useTechRoutingDeviceKey();

  useEffect(() => {
    if (techDevicesSynced) return;

    const displayDeviceKeys = displays.flatMap((display) =>
      [display.deviceKey, display.screenDeviceKey, display.liftDeviceKey].filter(
        (key): key is string => !!key
      )
    );

    const deviceKeys = [
      ...systemStatusDeviceKeys,
      ...(rackSensorDeviceKey ? [rackSensorDeviceKey] : []),
      ...displayDeviceKeys,
      ...(routingDeviceKey ? [routingDeviceKey] : []),
    ];

    if (deviceKeys.length === 0) return;

    const devices = Object.fromEntries(deviceKeys.map((key) => [key, [FULL_STATUS]]));

    sendUnrequestedBatchStatus(devices);
    dispatch(uiActions.addSyncState('techDevicesSynced'));
  }, [
    techDevicesSynced,
    systemStatusDeviceKeys,
    rackSensorDeviceKey,
    displays,
    routingDeviceKey,
    sendUnrequestedBatchStatus,
    dispatch,
  ]);
}
