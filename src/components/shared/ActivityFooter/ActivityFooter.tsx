import { IconButton, useIShutdownPromptTimer, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import type { IconProps } from '@pepperdash/mobile-control-react-app-core';
import classicSharingIconUrl from '../../../assets/icons/activity-sharing.svg';
import classicEndSessionIconUrl from '../../../assets/icons/activity-end-session.svg';
import { isMidnight } from '../../../theme/theme';
import classes from './ActivityFooter.module.scss';

// Midnight draws thin outlined icons inline, so they follow the button's CSS `color` (blue when
// active) - an <img>-loaded SVG can't.
const OutlineIcon = ({ className, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

// The original theme's icons are single-color artwork. Drawn as a mask filled with the button's
// `color`, so the active one takes the accent color (which can be changed in Settings) instead of
// the blue baked into the file.
//
// The URL must be quoted: the build inlines SVGs as data URIs containing single quotes, which make
// an unquoted url() invalid, so the mask was dropped and the icon drew as a filled box.
const MaskIcon = ({ src, className }: IconProps & { src: string }) => (
  <span
    className={`${className ?? ''} ${classes.maskIcon}`}
    style={{ maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }}
    aria-hidden="true"
  />
);

const SharingIcon = ({ className }: IconProps) =>
  isMidnight ? (
    <OutlineIcon className={className}>
      <rect x="5" y="8" width="38" height="26" rx="2.5" />
      <path d="M17 41h14M24 34v7" />
    </OutlineIcon>
  ) : (
    <MaskIcon src={classicSharingIconUrl} className={className} />
  );

const EndSessionIcon = ({ className }: IconProps) =>
  isMidnight ? (
    <OutlineIcon className={className}>
      <path d="M24 6v16" />
      <path d="M15 11.5a15 15 0 1 0 18 0" />
    </OutlineIcon>
  ) : (
    <MaskIcon src={classicEndSessionIconUrl} className={className} />
  );

/**
 * Room-wide activity bar. This demo has one activity (sharing - the source selection screen
 * itself), so "Sharing" is a current-state indicator rather than a navigation target.
 *
 * "End Session" starts the room's shutdown *prompt* countdown (`StartShutdown(Manual)`), not an
 * immediate shutdown - `DemoRoom` finishes the shutdown itself when that timer elapses.
 * `ShutdownPrompt` shows the confirmation and countdown while it runs.
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
