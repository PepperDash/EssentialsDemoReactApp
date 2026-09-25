import { useIRunDirectRouteAction, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import { useCurrentSourceForDestination } from '../../../hooks/useCurrentSourceForDestination';
import { useVideoSyncDetected } from '../../../hooks/useVideoSyncDetected';
import { useProgramAudioDestinationKey } from '../../../hooks/useProgramAudioDestinationKey';
import SyncStatusDot from '../../shared/SyncStatusDot/SyncStatusDot';
import ProgramAudioIcon from '../../shared/ProgramAudioIcon/ProgramAudioIcon';
import classes from './DestinationCard.module.scss';

interface DestinationCardProps {
  label: string;
  sinkKey: string;
  onSelect: (sinkKey: string) => void;
}

/**
 * One destination tile in advanced/direct routing: shows whatever is actually routed there right
 * now (read from the display device's own `ICurrentSources` state, independent of any other
 * destination), and commits the caller's staged source here on tap.
 *
 * Also shows, when the current source is an audio source, a button that routes just that source's
 * audio to the room's program-audio destination - independent of the video route this card's own
 * tap controls. The button lights up when that source is *already* the program-audio destination's
 * current audio source, so it doubles as feedback for "is this display's source the one everyone
 * hears right now".
 */
export const DestinationCard = ({ label, sinkKey, onSelect }: DestinationCardProps) => {
  const roomKey = useRoomKey();
  const current = useCurrentSourceForDestination(sinkKey);
  const videoSyncDetected = useVideoSyncDetected(current?.deviceKey);
  const programAudioSinkKey = useProgramAudioDestinationKey();
  const programAudioCurrent = useCurrentSourceForDestination(programAudioSinkKey, 'Audio');
  const directRoute = useIRunDirectRouteAction(roomKey);

  const isProgramAudio =
    !!current && !!programAudioCurrent && current.sourceListItemKey === programAudioCurrent.sourceListItemKey;

  const selectAsProgramAudio = () => {
    if (!current || !programAudioSinkKey) return;

    directRoute.runDirectRoute({
      sourceKey: current.sourceListItemKey,
      destinationKey: programAudioSinkKey,
      signalType: 'Audio',
    });
  };

  return (
    <div className={classes.wrapper}>
      <span className={classes.label}>{label}</span>

      {/* A <div> with button semantics, not a native <button>: the program-audio control below is
          a real nested <button>, and buttons cannot nest inside buttons. */}
      <div
        className={classes.card}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(sinkKey)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onSelect(sinkKey);
        }}
      >
        <span className={classes.sourceNameRow}>
          {current && <SyncStatusDot deviceKey={current.deviceKey} size={10} />}
          <span className={classes.sourceName}>{current?.name ?? 'None'}</span>
        </span>

        {videoSyncDetected === false && <span className={classes.noSignal}>No Signal</span>}

        {current?.isAudioSource && (
          <button
            type="button"
            className={`${classes.programAudioButton} ${isProgramAudio ? classes.active : ''}`}
            aria-label={isProgramAudio ? 'Currently the program audio source' : 'Set as program audio source'}
            onClick={(event) => {
              // Nested inside the card's own click target (routes this destination's video) - stop
              // the click from also triggering that.
              event.stopPropagation();
              selectAsProgramAudio();
            }}
          >
            <ProgramAudioIcon className={classes.programAudioIcon} />
          </button>
        )}
      </div>
    </div>
  );
};

export default DestinationCard;
