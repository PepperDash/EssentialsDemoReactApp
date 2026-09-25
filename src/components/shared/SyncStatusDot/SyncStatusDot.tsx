import { useVideoSyncDetected } from '../../../hooks/useVideoSyncDetected';
import classes from './SyncStatusDot.module.scss';

interface SyncStatusDotProps {
  /** Device key of the source device to check - not the source-list item key. */
  deviceKey: string | undefined;
  /** Diameter in pixels. Figma uses 15px next to a page title and 10px inside a destination card. */
  size?: number;
}

/**
 * Red/green signal-present dot for a wired source, and nothing at all for a source with no sync
 * concept (wireless, media player, etc.) - `videoSyncDetected` only exists on device state when
 * the backing device implements `IVideoSync` (currently just `MockHdmiSource`).
 */
export const SyncStatusDot = ({ deviceKey, size = 15 }: SyncStatusDotProps) => {
  const videoSyncDetected = useVideoSyncDetected(deviceKey);

  if (videoSyncDetected === undefined) return null;

  return (
    <span
      className={`${classes.dot} ${videoSyncDetected ? classes.detected : classes.notDetected}`}
      style={{ width: size, height: size }}
    />
  );
};

export default SyncStatusDot;
