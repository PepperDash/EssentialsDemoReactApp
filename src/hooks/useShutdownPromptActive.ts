import { useWebsocketContext } from '@pepperdash/mobile-control-react-app-core';
import { useEffect, useState } from 'react';

/**
 * Whether the room's shutdown prompt countdown is currently running, tracked from
 * `IShutdownPromptTimerMessenger`'s `timerStarted`/`timerFinished`/`timerCancelled` websocket
 * events - its state carries no running flag, and `secondsRemaining` isn't reset when the timer
 * stops, so it can't be derived from state alone.
 *
 * A panel that connects mid-countdown won't see the prompt until the next `timerStarted`.
 */
export function useShutdownPromptActive(roomKey: string): boolean {
  const { addEventHandler, removeEventHandler } = useWebsocketContext();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!roomKey) return;

    const handlerKey = 'shutdownPrompt';
    const subscriptions: [string, boolean][] = [
      ['timerStarted', true],
      ['timerFinished', false],
      ['timerCancelled', false],
    ];

    subscriptions.forEach(([event, isActive]) =>
      addEventHandler(`/event/room/${roomKey}/${event}`, handlerKey, () => setActive(isActive))
    );

    return () =>
      subscriptions.forEach(([event]) => removeEventHandler(`/event/room/${roomKey}/${event}`, handlerKey));
  }, [roomKey, addEventHandler, removeEventHandler]);

  return active;
}
