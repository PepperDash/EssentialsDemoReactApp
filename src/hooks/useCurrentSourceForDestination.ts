import { useICurrentSources, useRoomKey, useRoomSourceList } from '@pepperdash/mobile-control-react-app-core';
import { useMemo } from 'react';

export interface CurrentSourceInfo {
  sourceListItemKey: string;
  deviceKey: string;
  name: string;
  isAudioSource: boolean;
}

/**
 * The source currently routed to a destination device for a given signal type, read from that
 * device's own `ICurrentSources` state (auto-wired for any `IRoutingSinkWithFeedback`, which every
 * display implements) rather than anything room-level - each destination tracks its own current
 * source independently, which is exactly what advanced/per-destination routing needs.
 *
 * `currentSourceKeys` is keyed by *single* signal-type flags only ("Audio", "Video") - never
 * "AudioVideo". `DisplayBase.SetCurrentSource` (the C# method behind this) decomposes whatever
 * flags it's called with into individual bits and writes each one separately, even when a route
 * carried both together, so an "AudioVideo" key is never actually present. Pass `signalType` to
 * pick which one you mean; defaults to "Video" (what's shown on the display).
 *
 * The device key it finds is reverse-looked-up against the room's source list so the caller gets
 * the same source-list-item key `SourceTabs` uses, plus its display name and whether it's an audio
 * source.
 */
export function useCurrentSourceForDestination(
  sinkKey: string | undefined,
  signalType: 'Audio' | 'Video' = 'Video'
): CurrentSourceInfo | undefined {
  const roomKey = useRoomKey();
  const sourceList = useRoomSourceList(roomKey);
  const currentSources = useICurrentSources(sinkKey ?? '');
  const currentDeviceKey = currentSources?.currentSourcesState?.currentSourceKeys?.[signalType];

  return useMemo(() => {
    if (!currentDeviceKey || !sourceList) return undefined;

    const match = Object.entries(sourceList).find(([, item]) => item.sourceKey === currentDeviceKey);
    if (!match) return undefined;

    const [sourceListItemKey, item] = match;
    return {
      sourceListItemKey,
      deviceKey: currentDeviceKey,
      name: item.preferredName,
      isAudioSource: item.isAudioSource,
    };
  }, [currentDeviceKey, sourceList]);
}
