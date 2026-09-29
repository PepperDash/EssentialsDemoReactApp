import { useRoomIBasicVolumeWithFeedback, useRoomKey } from '@pepperdash/mobile-control-react-app-core';
import LevelFader from './LevelFader';

interface FaderProps {
  /** Unlabeled in the right gutter of every on-state page; the audio controls modal and tech
   * Volume page both show this same control labeled "Room" alongside other channels. */
  label?: string;
  /** Dark-background color variant - see `LevelFader`. */
  dark?: boolean;
}

/**
 * The room's master volume. A thin wrapper around `LevelFader` bound to the room's `master`
 * volume - the audio controls modal's "Room" fader is this same control, not a different one.
 */
export const Fader = ({ label, dark }: FaderProps) => {
  const roomKey = useRoomKey();
  const volume = useRoomIBasicVolumeWithFeedback(roomKey, 'master');

  return <LevelFader volume={volume} label={label} dark={dark} />;
};

export default Fader;
