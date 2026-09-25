import {
  IconButton,
  usePressHoldRelease,
  useRoomKey,
  useRoomName,
  useTimeAndDate,
} from '@pepperdash/mobile-control-react-app-core';
import type { IconProps } from '@pepperdash/mobile-control-react-app-core';
import { useNavigate } from 'react-router-dom';
import { useHeaderModal } from '../../../hooks/useHeaderModal';
import lightingIconUrl from '../../../assets/icons/lighting.svg';
import helpIconUrl from '../../../assets/icons/help.svg';
import audioControlsIconUrl from '../../../assets/icons/audio-controls.svg';
import classes from './Header.module.scss';

// The core library's own <Clock /> component has a stray "new change" string left in its render
// output (a debug leftover) - useTimeAndDate() is the same underlying hook without that bug, so
// we call it directly and render the time ourselves.

const LightingIcon = ({ className }: IconProps) => (
  <img src={lightingIconUrl} alt="" className={className} />
);

const HelpIcon = ({ className }: IconProps) => (
  <img src={helpIconUrl} alt="" className={className} />
);

const AudioControlsIcon = ({ className }: IconProps) => (
  <img src={audioControlsIconUrl} alt="" className={className} />
);

const TECH_PIN_HOLD_MS = 3000;

interface HeaderProps {
  /** Override the lighting icon's default action. */
  onLightingPress?: () => void;
  /** Override the help icon's default action. */
  onHelpPress?: () => void;
  /** Override the audio controls icon's default tap action (a short press; a 3s hold always goes
   * to the tech PIN regardless of this override). */
  onAudioPress?: () => void;
}

/**
 * Common header rendered at the top of every user-facing page: room name, live clock, and quick
 * access to lighting, help, and audio controls.
 *
 * Lighting and help open a `HeaderModalOverlay` panel - a dimmed overlay above whatever page is
 * currently showing, not a route, since the same icon has to work identically from every page
 * regardless of what's underneath it. The audio controls icon is overloaded: a short press opens
 * its modal the same way, but holding it for 3 seconds instead routes to the PIN-gated tech pages
 * - the same icon, not a fourth one, matching the design.
 */
export const Header = ({ onLightingPress, onHelpPress, onAudioPress }: HeaderProps) => {
  const roomKey = useRoomKey();
  const roomName = useRoomName(roomKey);
  const { time } = useTimeAndDate();
  const { openModal } = useHeaderModal();
  const navigate = useNavigate();

  const audioControlsPress = usePressHoldRelease({
    onPressedButNotHeld: onAudioPress ?? (() => openModal('audio')),
    onHold: () => navigate('/techPin'),
    holdTimeMs: TECH_PIN_HOLD_MS,
  });

  return (
    <header className={classes.header}>
      <div className={classes.left}>
        <span className={classes.roomName}>{roomName}</span>
      </div>

      <div className={classes.center}>
        <span className={classes.time}>{time}</span>
      </div>

      <div className={classes.right}>
        <IconButton
          multiIcon={LightingIcon}
          className={classes.iconButton}
          iconClassName={classes.icon}
          aria-label="Lighting"
          onClick={onLightingPress ?? (() => openModal('lighting'))}
        />
        <IconButton
          multiIcon={HelpIcon}
          className={classes.iconButton}
          iconClassName={classes.icon}
          aria-label="Help"
          onClick={onHelpPress ?? (() => openModal('help'))}
        />
        <IconButton
          multiIcon={AudioControlsIcon}
          className={classes.iconButton}
          iconClassName={classes.icon}
          aria-label="Audio controls (hold 3 seconds for tech access)"
          {...audioControlsPress}
        />
      </div>
    </header>
  );
};

export default Header;
