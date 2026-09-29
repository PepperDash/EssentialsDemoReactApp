import { useRoomKey, useWebsocketContext } from '@pepperdash/mobile-control-react-app-core';
import Header from '../shared/Header/Header';
import pepperDashLogoUrl from '../../assets/branding/pepperdash-logo.svg';
import classes from './SplashScreen.module.scss';

/**
 * Shown while the room is powered off. Tapping anywhere in the content area powers the room on to
 * its default source - the same action a "Present" button would trigger, routed through
 * `IRunDefaultPresentRoute`, which every Essentials room implements.
 */
export const SplashScreen = () => {
  const roomKey = useRoomKey();
  const { sendMessage } = useWebsocketContext();

  const powerOn = () => sendMessage(`/room/${roomKey}/defaultsource`, {});

  return (
    <div className={classes.splash}>
      <Header />
      <button type="button" className={classes.content} onClick={powerOn}>
        <div className={classes.logo}>
          <img src={pepperDashLogoUrl} alt="PepperDash" className={classes.logoImage} />
        </div>
        <p className={classes.prompt}>Touch Screen to Begin</p>
      </button>
    </div>
  );
};

export default SplashScreen;
