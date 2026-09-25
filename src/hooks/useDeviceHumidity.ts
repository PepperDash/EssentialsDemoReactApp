import { useAppSelector } from '@pepperdash/mobile-control-react-app-core';
import type { DeviceState } from '@pepperdash/mobile-control-react-app-core';

/** `IHumiditySensorState`, which the library declares and the framework's `IHumiditySensorMessenger`
 * genuinely pushes (`{ humidity: "10%" }`, merged onto the device's state like every other
 * messenger's fields - see `useICommunicationMonitor`), but whose own hook
 * (`useIHumiditySensor`) never made it into the library's build - it has a `.d.ts` but no
 * corresponding runtime export, unlike `useITemperatureSensor`/`useICommunicationMonitor`, which
 * both work. This reads the same merged per-device state directly via `useAppSelector`, the same
 * public building block those hooks are themselves built on, rather than waiting on the library fix.
 */
interface DeviceStateWithHumidity extends DeviceState {
  humidity?: string;
}

export function useDeviceHumidity(deviceKey: string | undefined): string | undefined {
  return useAppSelector((state) => {
    if (!deviceKey) return undefined;
    return (state.devices[deviceKey] as DeviceStateWithHumidity | undefined)?.humidity;
  });
}
