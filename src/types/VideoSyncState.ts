import { DeviceState } from '@pepperdash/mobile-control-react-app-core';

/**
 * State pushed by the room plugin's `IVideoSyncMessenger` (EssentialsDemoRoom/src/MockDevices),
 * for any device implementing the framework's `IVideoSync` interface - currently just
 * `MockHdmiSource`. Not every source has this: a device that doesn't implement `IVideoSync` never
 * gets this pushed at all, so `videoSyncDetected` comes back `undefined` for it rather than a
 * meaningful `false`. Callers should treat `undefined` as "this source has no sync concept", not
 * as "no signal".
 */
export interface VideoSyncState extends DeviceState {
  videoSyncDetected: boolean;
}
