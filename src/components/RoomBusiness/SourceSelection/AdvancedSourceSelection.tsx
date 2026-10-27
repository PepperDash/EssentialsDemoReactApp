import {
  roomOffSourceKey,
  useIRunDirectRouteAction,
  useRoomDestinationList,
  useRoomKey,
  useRoomSourceList,
} from '@pepperdash/mobile-control-react-app-core';
import { useState } from 'react';
import DestinationCard from './DestinationCard';
import SourceTabs from './SourceTabs';
import { placeSourceTabs } from './placeSourceTabs';
import classes from './AdvancedSourceSelection.module.scss';

/**
 * Advanced/direct-routing mode: pick a source below to stage it, then tap a destination above to
 * commit that route to just that display - each display can show something different, unlike
 * basic mode where one selection fans out to every display at once.
 *
 * The staged selection is local UI state, not room state: it's "what would I route if I tapped a
 * destination right now", not a fact about the system. `DemoRoom.SelectedSourceKey` (basic mode's
 * one-source-for-the-room field) has no meaning here.
 */
interface AdvancedSourceSelectionProps {
  /** Where to render the source buttons - see `placeSourceTabs`. */
  tabsContainer?: HTMLElement | null;
}

export const AdvancedSourceSelection = ({ tabsContainer }: AdvancedSourceSelectionProps) => {
  const roomKey = useRoomKey();
  const sourceList = useRoomSourceList(roomKey);
  const destinationList = useRoomDestinationList(roomKey);
  const directRoute = useIRunDirectRouteAction(roomKey);
  const [stagedKey, setStagedKey] = useState<string>();

  const offKey = sourceList
    ? Object.entries(sourceList).find(([, item]) => item.sourceKey === roomOffSourceKey)?.[0]
    : undefined;

  // Defaults to "None" before the user picks anything, matching the design - not left unhighlighted.
  const selectedKey = stagedKey ?? offKey;

  const destinations = destinationList
    ? Object.values(destinationList)
        .filter((d) => d.includeInDestinationList)
        .sort((a, b) => a.order - b.order)
    : [];

  const handleSelectDestination = (sinkKey: string) => {
    if (!selectedKey || !sourceList?.[selectedKey]) return;

    directRoute.runDirectRoute({ sourceKey: selectedKey, destinationKey: sinkKey, signalType: 'AudioVideo' });
  };

  return (
    <>
      <div className={classes.destinationList}>
        {destinations.map((destination) => (
          <DestinationCard
            key={destination.sinkKey}
            label={destination.preferredName}
            sinkKey={destination.sinkKey}
            onSelect={handleSelectDestination}
          />
        ))}
      </div>

      <p className={classes.instruction}>Select a source below then a destination above</p>

      {placeSourceTabs(<SourceTabs selectedKey={selectedKey} onSelect={setStagedKey} />, tabsContainer)}
    </>
  );
};

export default AdvancedSourceSelection;
