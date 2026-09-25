import { useRoomEnvironmentalDevices, useRoomKey } from '@pepperdash/mobile-control-react-app-core';

/**
 * Device key of the room's lighting controller, found the same way the framework itself
 * classifies environmental devices (`configuration.environmentalDevices`, `deviceType ===
 * "Lighting"` - assigned server-side to any device implementing `ILightingScenes`), rather than
 * hardcoding this demo's own "lighting-1" key.
 */
export function useLightingDeviceKey(): string | undefined {
  const roomKey = useRoomKey();
  const environmentalDevices = useRoomEnvironmentalDevices(roomKey);

  return environmentalDevices?.find((d) => d.deviceType === 'Lighting')?.deviceKey;
}
