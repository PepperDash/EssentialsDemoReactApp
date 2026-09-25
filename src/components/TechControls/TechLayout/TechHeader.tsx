import { useRoomKey, useRoomName, useTimeAndDate } from '@pepperdash/mobile-control-react-app-core';
import { useNavigate } from 'react-router-dom';
import classes from './TechHeader.module.scss';

/**
 * Header for the PIN-gated tech pages - a black bar with the room name and clock like the regular
 * `Header`, but an "Exit Technician Controls" button in place of the lighting/help/audio icons,
 * since none of those apply once a tech is behind the PIN gate.
 */
export const TechHeader = () => {
  const roomKey = useRoomKey();
  const roomName = useRoomName(roomKey);
  const { time } = useTimeAndDate();
  const navigate = useNavigate();

  return (
    <header className={classes.header}>
      <div className={classes.left}>
        <span className={classes.roomName}>{roomName}</span>
      </div>

      <div className={classes.center}>
        <span className={classes.time}>{time}</span>
      </div>

      <div className={classes.right}>
        <button type="button" className={classes.exitButton} onClick={() => navigate('/')}>
          Exit Technician Controls
        </button>
      </div>
    </header>
  );
};

export default TechHeader;
