import { useICommunicationMonitor } from '@pepperdash/mobile-control-react-app-core';
import { useMinutesInStatus } from '../../../hooks/useMinutesInStatus';
import HealthIcon, { type HealthStatus } from './HealthIcon';
import classes from './HealthItem.module.scss';

const statusText = (status: HealthStatus, minutes: number): string => {
  switch (status) {
    case 'IsOk':
      return 'Online';
    case 'StatusUnknown':
      return 'Device never online';
    default:
      return minutes <= 1 ? 'No response for 1 minute' : `No response for ${minutes} minutes`;
  }
};

/** One device row on the System Status page: health icon, device name, and status text. */
export const HealthItem = ({ deviceKey }: { deviceKey: string }) => {
  const monitor = useICommunicationMonitor(deviceKey);
  // `communicationMonitorState` is typed as always present, but in practice it (like the rest of a
  // device's state) is only populated once `/fullStatus` actually returns - chain past it too.
  const state = monitor?.communicationMonitorState;
  const status = (state?.status ?? 'StatusUnknown') as HealthStatus;
  const minutes = useMinutesInStatus(status);

  return (
    <div className={classes.item}>
      <HealthIcon status={status} />

      <div className={classes.labels}>
        <p className={classes.name}>{state?.name ?? deviceKey}</p>
        <p className={classes.status}>{statusText(status, minutes)}</p>
      </div>
    </div>
  );
};

export default HealthItem;
