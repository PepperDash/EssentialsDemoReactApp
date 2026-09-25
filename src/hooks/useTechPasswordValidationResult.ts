import { useWebsocketContext } from '@pepperdash/mobile-control-react-app-core';
import { useEffect, useRef } from 'react';

/**
 * Subscribes to the tech password's validation-result event and calls `onResult` when one arrives.
 *
 * `ITechPasswordMessenger` reports validation through a *websocket event*
 * (`/event/room/{roomKey}/passwordValidationResult`), not a field on room state - there's no
 * `isValid` anywhere in `ITechPasswordState`. `MessengerBase.PostEventMessage` builds that path
 * from the room bridge's own shared message path (`/room/{roomKey}`) plus the C# event name, so
 * this constructs the exact same string to subscribe to it.
 *
 * Takes a ref internally so the caller's `onResult` doesn't need to be memoized to avoid
 * resubscribing on every render.
 */
export function useTechPasswordValidationResult(roomKey: string, onResult: (isValid: boolean) => void): void {
  const { addEventHandler, removeEventHandler } = useWebsocketContext();
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!roomKey) return;

    const eventType = `/event/room/${roomKey}/passwordValidationResult`;
    const handlerKey = 'techPin';

    addEventHandler(eventType, handlerKey, (message) => {
      const content = message.content as { isValid?: boolean } | undefined;
      onResultRef.current(!!content?.isValid);
    });

    return () => removeEventHandler(eventType, handlerKey);
  }, [roomKey, addEventHandler, removeEventHandler]);
}
