import { useRef } from 'react';

/**
 * Returns `value`, keeping the previous object while its contents are unchanged.
 *
 * The core library rebuilds every array and object in a device's state on each status message,
 * even the parts the message didn't touch, so identity can't tell "changed" from "unchanged". This
 * compares by content (JSON) so memos and effects downstream run only on a real change. Meant for
 * room-sized data, not large collections.
 */
export function useContentStable<T>(value: T): T {
  const ref = useRef<{ json: string; value: T } | null>(null);
  const json = JSON.stringify(value) ?? '';
  if (ref.current?.json !== json) ref.current = { json, value };
  return ref.current.value;
}
