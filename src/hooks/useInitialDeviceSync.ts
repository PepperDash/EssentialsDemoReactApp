import {
  uiActions,
  useAppDispatch,
  useIsSyncStateValuePresent,
  useRoomConfiguration,
  useRoomKey,
  useWebsocketContext,
} from '@pepperdash/mobile-control-react-app-core';
import { useEffect, useMemo } from 'react';

const FULL_STATUS = '/fullStatus';

/**
 * Collects every device key the room configuration references.
 *
 * The room's config arrives with the join response; the state of the devices it names does not.
 * This walks the config to build that list so the app can ask for all of it at once.
 */
function useRoomDeviceKeys(): Set<string> | undefined {
  const roomKey = useRoomKey();
  const config = useRoomConfiguration(roomKey);

  return useMemo(() => {
    if (!config) return undefined;

    const keys = new Set<string>();

    // Displays and other routing sinks.
    Object.values(config.destinationList ?? {}).forEach((destination) => {
      if (destination.sinkKey) keys.add(destination.sinkKey);
    });

    // Sources. "$off" is the conventional "clear the route" entry, not a real device.
    Object.values(config.sourceList ?? {}).forEach((source) => {
      if (source.sourceKey && source.sourceKey !== '$off') keys.add(source.sourceKey);
    });

    // Audio control points address a level inside a parent device, so their key is compound.
    Object.values(config.audioControlPointList?.levelControls ?? {}).forEach((levelControl) => {
      keys.add(
        levelControl.itemKey
          ? `${levelControl.parentDeviceKey}--${levelControl.itemKey}`
          : levelControl.parentDeviceKey
      );
    });

    config.touchpanelKeys?.forEach((key) => keys.add(key));
    config.endpointKeys?.forEach((key) => keys.add(key));
    config.environmentalDevices?.forEach((device) => {
      if (device.deviceKey) keys.add(device.deviceKey);
    });

    if (config.matrixRoutingKey) keys.add(config.matrixRoutingKey);

    return keys;
  }, [config]);
}

/**
 * Requests full status for every device in the room, once, at boot.
 *
 * One `/system/batchDeviceFullStatus` message instead of a request per component: the processor
 * fans out to each device messenger in parallel and answers with a single
 * `/system/initialSyncComplete` when they have all replied. Pair it with
 * `useHasCompletedInitialSync` to hold the UI until state is populated, so the app paints once
 * rather than flickering through empty state.
 */
export function useInitialDeviceSync(): void {
  const { sendMessage } = useWebsocketContext();
  const dispatch = useAppDispatch();
  const devicesSynced = useIsSyncStateValuePresent('devicesSynced');
  const deviceKeys = useRoomDeviceKeys();

  useEffect(() => {
    if (devicesSynced || !deviceKeys || deviceKeys.size === 0) return;

    const devices = Object.fromEntries(
      Array.from(deviceKeys).map((key) => [key, [FULL_STATUS]])
    );

    sendMessage('/system/batchDeviceFullStatus', { devices });
    dispatch(uiActions.addSyncState('devicesSynced'));
  }, [devicesSynced, deviceKeys, sendMessage, dispatch]);
}
