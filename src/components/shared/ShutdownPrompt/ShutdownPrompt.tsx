import { useIShutdownPromptTimer, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import { useShutdownPromptActive } from '../../../hooks/useShutdownPromptActive';
import classes from './ShutdownPrompt.module.scss';

/**
 * End Session confirmation, shown on every panel while the room's shutdown prompt timer runs
 * (started by the footer's End Session button). The bar drains with the timer's
 * `percentageRemaining`; the room shuts down when it empties, or immediately on "End Session".
 */
export const ShutdownPrompt = () => {
  const roomKey = useRoomKey();
  const shutdown = useIShutdownPromptTimer(roomKey);
  const active = useShutdownPromptActive(roomKey);

  if (!active || !shutdown) return null;

  const { secondsRemaining, percentageRemaining } = shutdown.shutdownPromptTimerState ?? {};
  const percent = Math.min(100, Math.max(0, percentageRemaining ?? 100));
  const seconds = Math.max(0, secondsRemaining ?? 0);

  return (
    <div className={classes.overlay}>
      <div className={classes.panel} role="alertdialog" aria-labelledby="shutdown-title">
        <h2 id="shutdown-title" className={classes.title}>
          End Session
        </h2>
        <p className={classes.message}>Are you sure you want to shut off the system?</p>

        <div
          className={classes.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className={classes.progressFill} style={{ width: `${percent}%` }} />
        </div>
        <p className={classes.countdown}>
          Shutting down in {seconds} {seconds === 1 ? 'second' : 'seconds'}
        </p>

        <div className={classes.buttons}>
          <button type="button" className={classes.confirmButton} onClick={shutdown.shutdownEnd}>
            End Session
          </button>
          <button type="button" className={classes.cancelButton} onClick={shutdown.shutdownCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShutdownPrompt;
