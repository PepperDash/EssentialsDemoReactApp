import { useRoomKey, useRoomState } from '@pepperdash/mobile-control-react-app-core';
import { DemoRoomState } from '../types/DemoRoomState';

/**
 * Device key of the matrix router shown on the tech Routing page - see
 * `DemoRoomState.techRoutingDeviceKey`.
 */
export function useTechRoutingDeviceKey(): string | undefined {
  const roomKey = useRoomKey();
  const roomState = useRoomState<DemoRoomState>(roomKey);

  return roomState?.techRoutingDeviceKey;
}
