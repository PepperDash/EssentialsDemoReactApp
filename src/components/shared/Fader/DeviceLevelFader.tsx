import { useDeviceIBasicVolumeWithFeedback } from '@pepperdash/mobile-control-react-app-core';
import LevelFader from './LevelFader';

interface DeviceLevelFaderProps {
  deviceKey: string;
  label: string;
  isMic?: boolean;
  /** Dark-background color variant - see `LevelFader`. */
  dark?: boolean;
}

/**
 * A labeled fader bound to a specific device's volume - each channel in the audio controls modal
 * and tech Volume page (Program, Wireless Mic, Lectern Mic, ...), as opposed to `Fader`, which is
 * always the room's master volume specifically.
 */
export const DeviceLevelFader = ({ deviceKey, label, isMic, dark }: DeviceLevelFaderProps) => {
  const volume = useDeviceIBasicVolumeWithFeedback(deviceKey);

  return <LevelFader volume={volume} label={label} isMic={isMic} dark={dark} />;
};

export default DeviceLevelFader;
