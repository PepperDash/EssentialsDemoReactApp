import okIconUrl from '../../../assets/icons/status-ok.svg';
import errorIconUrl from '../../../assets/icons/status-error.svg';
import warningIconUrl from '../../../assets/icons/status-warning.svg';
import unknownIconUrl from '../../../assets/icons/status-unknown.svg';
import classes from './HealthIcon.module.scss';

/** Mirrors the framework's `MonitorStatus` enum (`StatusUnknown/IsOk/InWarning/InError`). */
export type HealthStatus = 'StatusUnknown' | 'IsOk' | 'InWarning' | 'InError';

const ICON_URLS: Record<HealthStatus, string> = {
  IsOk: okIconUrl,
  InError: errorIconUrl,
  InWarning: warningIconUrl,
  StatusUnknown: unknownIconUrl,
};

/** The colored status circle used by every row on the System Status page. */
export const HealthIcon = ({ status }: { status: HealthStatus }) => (
  <div className={`${classes.circle} ${classes[status]}`}>
    <img
      src={ICON_URLS[status]}
      alt=""
      className={status === 'InWarning' ? classes.iconWarning : classes.icon}
    />
  </div>
);

export default HealthIcon;
