import { IconButton, useIShutdownPromptTimer, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import type { IconProps } from '@pepperdash/mobile-control-react-app-core';
import sharingIconUrl from '../../../assets/icons/activity-sharing.svg';
import endSessionIconUrl from '../../../assets/icons/activity-end-session.svg';
import classes from './ActivityFooter.module.scss';

const SharingIcon = ({ className }: IconProps) => (
  <img src={sharingIconUrl} alt="" className={className} />
);

const EndSessionIcon = ({ className }: IconProps) => (
  <img src={endSessionIconUrl} alt="" className={className} />
);

/**
 * Room-wide activity bar. This demo has one activity (sharing - the source selection screen
 * itself), so "Sharing" is a current-state indicator rather than a navigation target.
 *
 * "End Session" starts the room's shutdown *prompt* countdown (`StartShutdown(Manual)`), not an
 * immediate shutdown - `DemoRoom` finishes the shutdown itself when that timer elapses. The
 * Figma page for the countdown/cancel confirmation hasn't been provided yet, so there's no visible
 * countdown here; the timer still runs, just silently.
 */
export const ActivityFooter = () => {
  const roomKey = useRoomKey();
  const shutdown = useIShutdownPromptTimer(roomKey);

  return (
    <div className={classes.footer}>
      <IconButton
        multiIcon={SharingIcon}
        vert
        className={`${classes.button} ${classes.active}`}
        iconClassName={classes.icon}
        otherContent={
          <>
            <span className={classes.label}>Sharing</span>
            <span className={classes.underline} />
          </>
        }
      />

      <IconButton
        multiIcon={EndSessionIcon}
        vert
        className={classes.button}
        iconClassName={classes.icon}
        onClick={() => shutdown?.shutdownStart()}
        otherContent={
          <>
            <span className={classes.label}>End Session</span>
            <span className={classes.underline} />
          </>
        }
      />
    </div>
  );
};

export default ActivityFooter;
