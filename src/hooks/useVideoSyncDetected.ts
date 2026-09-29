import { useGetDevice } from '@pepperdash/mobile-control-react-app-core';
import { VideoSyncState } from '../types/VideoSyncState';

/**
 * Whether a source device is reporting signal detected, or `undefined` if the device has no sync
 * concept at all (its backing device doesn't implement `IVideoSync`, so the room plugin never
 * pushes `videoSyncDetected` for it).
 */
export function useVideoSyncDetected(deviceKey: string | undefined): boolean | undefined {
  const state = useGetDevice<VideoSyncState>(deviceKey ?? '');
  return state?.videoSyncDetected;
}
