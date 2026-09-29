import HealthIcon, { type HealthStatus } from './HealthIcon';
import classes from './RackReadingItem.module.scss';

/** One rack sensor reading on the System Status page: health icon plus a single label line. */
export const RackReadingItem = ({ status, label }: { status: HealthStatus; label: string }) => (
  <div className={classes.item}>
    <HealthIcon status={status} />
    <p className={classes.label}>{label}</p>
  </div>
);

export default RackReadingItem;
