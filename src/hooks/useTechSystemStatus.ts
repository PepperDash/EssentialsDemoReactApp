import { useRoomKey, useRoomState } from '@pepperdash/mobile-control-react-app-core';
import { DemoRoomState } from '../types/DemoRoomState';

/**
 * Device keys shown on the tech System Status page, in display order - see
 * `DemoRoomState.techSystemStatusDeviceKeys`.
 */
export function useTechSystemStatusDeviceKeys(): string[] {
  const roomKey = useRoomKey();
  const roomState = useRoomState<DemoRoomState>(roomKey);

  return roomState?.techSystemStatusDeviceKeys ?? [];
}

/**
 * Device key of the rack temperature/humidity sensor shown on the tech System Status page - see
 * `DemoRoomState.techRackSensorDeviceKey`.
 */
export function useTechRackSensorDeviceKey(): string | undefined {
  const roomKey = useRoomKey();
  const roomState = useRoomState<DemoRoomState>(roomKey);

  return roomState?.techRackSensorDeviceKey;
}
