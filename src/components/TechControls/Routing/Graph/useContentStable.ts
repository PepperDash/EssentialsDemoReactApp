import { useMemo } from 'react';

/**
 * Returns `value`, keeping the previous object while its contents are unchanged.
 *
 * The core library rebuilds every array and object in a device's state on each status message,
 * even the parts the message didn't touch, so identity can't tell "changed" from "unchanged". This
 * compares by content (JSON) so memos and effects downstream run only on a real change. Meant for
 * room-sized data, not large collections.
 */
export function useContentStable<T>(value: T): T {
  const json = JSON.stringify(value) ?? 'null';
  // A copy rebuilt from the JSON, so the result changes exactly when the contents do.
  return useMemo(() => JSON.parse(json) as T, [json]);
}
