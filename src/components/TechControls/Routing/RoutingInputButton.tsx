import type { RoutingSlotInfo } from '@pepperdash/mobile-control-react-app-core';
import TechToggleButton from '../shared/TechToggleButton';
import classes from './RoutingInputButton.module.scss';

/**
 * `RoutingSlotInfo` doesn't declare `videoSyncDetected`/`txDeviceKey`/`isOnline`, but the C#
 * messenger (`IHasNamedRoutingSlotsMessenger.BuildInputMessage`) does send them for any input slot
 * implementing `IRoutingInputSlotInfo` - which `MockRoutingMidpoint` now does for every video-capable
 * input. The published type just hasn't caught up; this extends it locally rather than waiting.
 */
export interface RoutingInputSlotInfo extends RoutingSlotInfo {
  videoSyncDetected?: boolean;
}

/**
 * One input button on the Routing page - like `TechToggleButton`, plus a small sync-status dot for
 * inputs that support video (`videoSyncDetected` is only ever present on those; an audio-only input
 * like a mic has no video to sync, so it renders no dot at all rather than a meaningless one).
 */
export const RoutingInputButton = ({
  input,
  active,
  onClick,
  className,
}: {
  input: RoutingInputSlotInfo;
  active: boolean;
  onClick: () => void;
  className?: string;
}) => (
  <div className={classes.wrapper}>
    <TechToggleButton active={active} onClick={onClick} className={className}>
      {input.name}
    </TechToggleButton>

    {input.videoSyncDetected !== undefined && (
      <span
        className={`${classes.syncDot} ${input.videoSyncDetected ? classes.synced : classes.notSynced}`}
      />
    )}
  </div>
);

export default RoutingInputButton;
