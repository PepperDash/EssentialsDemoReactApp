import { useRoomDestinationList, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import { useMemo } from 'react';

/**
 * Sink key of the room's program-audio destination, or undefined if none is configured.
 *
 * Deliberately not the library's `useRoomProgramAudioDestinationKey`: that hook looks for a
 * destination-list entry keyed literally `"programAudio"` (falling back to `"defaultDisplay"`),
 * which is a dictionary-key naming convention this config doesn't use - its destination list is
 * keyed `"display1"`/`"display2"`. This instead scans destination values for
 * `isProgramAudioDestination === true`, the same way `DemoRoom.ResolveDevices` already finds the
 * program-audio destination on the C# side, so both sides agree without renaming any config keys.
 */
export function useProgramAudioDestinationKey(): string | undefined {
  const roomKey = useRoomKey();
  const destinationList = useRoomDestinationList(roomKey);

  return useMemo(
    () => Object.values(destinationList ?? {}).find((d) => d.isProgramAudioDestination)?.sinkKey,
    [destinationList]
  );
}
