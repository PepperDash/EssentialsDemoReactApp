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
import type { HeaderModalId } from '../../../context/HeaderModalContext';
import classicLightingIconUrl from '../../../assets/icons/lighting.svg';
import classicHelpIconUrl from '../../../assets/icons/help.svg';
import classicAudioControlsIconUrl from '../../../assets/icons/audio-controls.svg';
import classicSettingsIconUrl from '../../../assets/icons/settings.svg';
import midnightLightingIconUrl from '../../../assets/icons/midnight/lighting.svg';
import midnightHelpIconUrl from '../../../assets/icons/midnight/help.svg';
import midnightAudioControlsIconUrl from '../../../assets/icons/midnight/audio-controls.svg';
import midnightSettingsIconUrl from '../../../assets/icons/midnight/settings.svg';
import { isMidnight } from '../../../theme/theme';
import companyLogoUrl from '../../../assets/branding/acme-logo.svg';
import classes from './Header.module.scss';

const lightingIconUrl = isMidnight ? midnightLightingIconUrl : classicLightingIconUrl;
const helpIconUrl = isMidnight ? midnightHelpIconUrl : classicHelpIconUrl;
const audioControlsIconUrl = isMidnight ? midnightAudioControlsIconUrl : classicAudioControlsIconUrl;
const settingsIconUrl = isMidnight ? midnightSettingsIconUrl : classicSettingsIconUrl;

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

const SettingsIcon = ({ className }: IconProps) => (
  <img src={settingsIconUrl} alt="" className={className} />
);

const TECH_PIN_HOLD_MS = 3000;

interface HeaderProps {
  /** Override the lighting icon's default action. */
  onLightingPress?: () => void;
  /** Override the help icon's default action. */
  onHelpPress?: () => void;
  /** Override the audio controls icon's default action. */
  onAudioPress?: () => void;
}

/**
 * Common header rendered at the top of every user-facing page: room name, live clock, and quick
 * access to lighting, help, audio controls, and settings (theme and light/dark mode).
 *
 * Lighting, help and audio controls open a `HeaderModalOverlay` panel - a dimmed overlay above
 * whatever page is currently showing, not a route, since the same icon has to work identically from
 * every page regardless of what's underneath it. The settings icon is overloaded: a short press
 * opens its modal the same way, but holding it for 3 seconds instead routes to the PIN-gated tech
 * pages.
 */
export const Header = ({ onLightingPress, onHelpPress, onAudioPress }: HeaderProps) => {
  const roomKey = useRoomKey();
  const roomName = useRoomName(roomKey);
  const { time } = useTimeAndDate();
  const { activeModal, openModal, closeModal } = useHeaderModal();
  // Tapping the button for the modal that's already open closes it: always for Settings, and for
  // every modal in Midnight.
  const toggleModal = (modal: HeaderModalId) =>
    activeModal === modal && (isMidnight || modal === 'settings') ? closeModal() : openModal(modal);
  const buttonClass = (modal: HeaderModalId) =>
    `${classes.iconButton} ${activeModal === modal ? classes.active : ''}`;
  const navigate = useNavigate();

  const settingsPress = usePressHoldRelease({
    onPressedButNotHeld: () => toggleModal('settings'),
    // Header modals overlay every route, so close any open one or it would cover the PIN page.
    onHold: () => {
      closeModal();
      navigate('/techPin');
    },
    holdTimeMs: TECH_PIN_HOLD_MS,
  });

  return (
    <header className={classes.header}>
      <div className={classes.left}>
        {isMidnight && <img src={companyLogoUrl} alt="Acme" className={classes.companyLogo} />}
        <span className={classes.roomName}>{roomName}</span>
      </div>

      <div className={classes.center}>
        <span className={classes.time}>{time}</span>
      </div>

      <div className={classes.right}>
        <IconButton
          multiIcon={LightingIcon}
          className={buttonClass('lighting')}
          iconClassName={classes.icon}
          aria-label="Lighting"
          onClick={onLightingPress ?? (() => toggleModal('lighting'))}
        />
        <IconButton
          multiIcon={HelpIcon}
          className={buttonClass('help')}
          iconClassName={classes.icon}
          aria-label="Help"
          onClick={onHelpPress ?? (() => toggleModal('help'))}
        />
        <IconButton
          multiIcon={AudioControlsIcon}
          className={buttonClass('audio')}
          iconClassName={classes.icon}
          aria-label="Audio controls"
          onClick={onAudioPress ?? (() => toggleModal('audio'))}
        />
        <IconButton
          multiIcon={SettingsIcon}
          className={buttonClass('settings')}
          iconClassName={classes.icon}
          aria-label="Settings (hold 3 seconds for tech access)"
          {...settingsPress}
        />
      </div>
    </header>
  );
};

export default Header;
