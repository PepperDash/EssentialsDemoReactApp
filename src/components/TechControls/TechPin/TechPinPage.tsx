import { useITechPassword, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTechPasswordValidationResult } from '../../../hooks/useTechPasswordValidationResult';
import lockIconUrl from '../../../assets/icons/lock.svg';
import closeIconUrl from '../../../assets/icons/x-close.svg';
import Keypad from './Keypad';
import classes from './TechPinPage.module.scss';

const INCORRECT_DISPLAY_MS = 1500;

/**
 * PIN gate for the tech pages, reached by holding the header's audio controls icon for 3 seconds
 * (see `Header`) - reachable whether the room is on or off (see `RoomBusiness`).
 *
 * The PIN itself never reaches the client: entry is submitted to `ITechPassword.ValidateTechPassword`
 * server-side, which reports back a valid/invalid *event*, not a value the client could compare
 * itself. Submits automatically once the entry reaches the room's configured PIN length
 * (`techPasswordLength`) rather than needing an explicit submit action.
 */
export const TechPinPage = () => {
  const roomKey = useRoomKey();
  const techPassword = useITechPassword(roomKey);
  const navigate = useNavigate();
  const [entry, setEntry] = useState('');
  const [isIncorrect, setIsIncorrect] = useState(false);

  const passwordLength = techPassword?.techPasswordState.techPasswordLength;

  useTechPasswordValidationResult(roomKey, (isValid) => {
    if (isValid) {
      // TODO: point at the real tech landing route once its Figma pages arrive - the catch-all
      // route sends this back to "/" for now.
      navigate('/tech');
    } else {
      setEntry('');
      setIsIncorrect(true);
    }
  });

  // The "Incorrect" display is a brief, timed flash, not a state the user has to dismiss - it
  // clears itself the same way a real keypad's error tone/flash would.
  useEffect(() => {
    if (!isIncorrect) return;

    const timeout = window.setTimeout(() => setIsIncorrect(false), INCORRECT_DISPLAY_MS);
    return () => window.clearTimeout(timeout);
  }, [isIncorrect]);

  // Submit as soon as the entry reaches the configured PIN length, rather than requiring a
  // separate submit action the design doesn't show.
  useEffect(() => {
    if (!passwordLength || entry.length !== passwordLength) return;

    techPassword?.validatePassword(entry);
  }, [entry, passwordLength, techPassword]);

  const appendDigit = (digit: string) => {
    // A fresh digit press always means "let me try again" - don't make the user wait out the
    // error flash or hit Clear first.
    setIsIncorrect(false);

    if (passwordLength && entry.length >= passwordLength) return;
    setEntry((current) => current + digit);
  };

  return (
    <div className={classes.page}>
      <div className={classes.panel}>
        <div className={classes.titleBar}>
          <div className={classes.titleLeft}>
            <img src={lockIconUrl} alt="" className={classes.lockIcon} />
            <span className={classes.title}>Enter Access Code</span>
          </div>

          <button
            type="button"
            className={classes.closeButton}
            aria-label="Cancel"
            onClick={() => navigate('/')}
          >
            <img src={closeIconUrl} alt="" className={classes.closeIcon} />
          </button>
        </div>

        <div className={classes.entryArea}>
          <div className={`${classes.display} ${isIncorrect ? classes.displayIncorrect : ''}`}>
            {isIncorrect ? (
              <span className={classes.incorrectText}>Incorrect</span>
            ) : (
              <span className={classes.displayText}>{'*'.repeat(entry.length)}</span>
            )}
          </div>

          <Keypad
            onDigit={appendDigit}
            onClear={() => {
              setIsIncorrect(false);
              setEntry('');
            }}
            onDelete={() => {
              setIsIncorrect(false);
              setEntry((current) => current.slice(0, -1));
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TechPinPage;
