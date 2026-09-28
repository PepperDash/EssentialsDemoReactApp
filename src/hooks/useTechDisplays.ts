import { useRoomKey, useRoomState } from '@pepperdash/mobile-control-react-app-core';
import { DemoRoomState, TechDisplayConfig } from '../types/DemoRoomState';

/**
 * Displays shown on the tech Displays page, in display order - see
 * `DemoRoomState.techDisplays`.
 */
export function useTechDisplays(): TechDisplayConfig[] {
  const roomKey = useRoomKey();
  const roomState = useRoomState<DemoRoomState>(roomKey);

  return roomState?.techDisplays ?? [];
}
