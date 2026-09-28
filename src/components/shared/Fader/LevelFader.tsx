import { IconButton, useDeviceIBasicVolumeWithFeedback } from '@pepperdash/mobile-control-react-app-core';
import type { IconProps } from '@pepperdash/mobile-control-react-app-core';
import { useCallback, useRef } from 'react';
import muteSpeakerIconUrl from '../../../assets/icons/mute-speaker.svg';
import muteMicIconUrl from '../../../assets/icons/mute-mic.svg';
import classes from './LevelFader.module.scss';

const MAX_LEVEL = 65535;

type Volume = ReturnType<typeof useDeviceIBasicVolumeWithFeedback>;

const SpeakerMuteIcon = ({ className }: IconProps) => (
  <img src={muteSpeakerIconUrl} alt="" className={className} />
);

const MicMuteIcon = ({ className }: IconProps) => <img src={muteMicIconUrl} alt="" className={className} />;

interface LevelFaderProps {
  /** Shown above the track. Omitted on the room page's single master fader (no other fader to
   * distinguish it from); every fader in the audio controls modal has one. */
  label?: string;
  /** Picks the mute icon: a mic for mic-type level controls, a speaker for everything else. */
  isMic?: boolean;
  /** Dark-background color variant, for the tech Volume page (dark tech-bg) as opposed to the
   * audio controls modal's light background. */
  dark?: boolean;
  volume: Volume;
}

/**
 * One vertical drag-to-set fader plus mute button, driven by whatever `IBasicVolumeWithFeedback`
 * source the caller hands it - the room's master volume (`Fader`) and each of the audio controls
 * modal's individual channels (`DeviceLevelFader`) are the same control wired to different volume
 * sources, not two different faders.
 */
export const LevelFader = ({ label, isMic, dark, volume }: LevelFaderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const levelFromPointer = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return null;

    const { top, height } = track.getBoundingClientRect();
    // The fader fills from the bottom, so invert: pointer at the track's bottom edge is 0, top is max.
    const fraction = 1 - (clientY - top) / height;
    const clamped = Math.min(1, Math.max(0, fraction));

    return Math.round(clamped * MAX_LEVEL);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!volume) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;

    const level = levelFromPointer(event.clientY);
    if (level !== null) volume.setLevel(level);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !volume) return;

    const level = levelFromPointer(event.clientY);
    if (level !== null) volume.setLevel(level);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!volume) return null;

  const { volumeState } = volume;
  const fillPercent = Math.min(100, Math.max(0, (volumeState.level / MAX_LEVEL) * 100));
  const MuteIcon = isMic ? MicMuteIcon : SpeakerMuteIcon;

  return (
    <div className={`${classes.fader} ${dark ? classes.dark : ''}`}>
      {label && <span className={classes.label}>{label}</span>}

      <div className={classes.trackContainer}>
        <div
          className={classes.touchset}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className={classes.track} ref={trackRef}>
            <div className={classes.fill} style={{ height: `${fillPercent}%` }} />
            <div className={classes.knob} style={{ bottom: `${fillPercent}%` }} />
          </div>
        </div>
      </div>

      <div className={classes.mutes}>
        <IconButton
          multiIcon={MuteIcon}
          className={classes.muteButton}
          iconClassName={classes.muteIcon}
          aria-label={volumeState.muted ? 'Unmute' : 'Mute'}
          onClick={() => (volumeState.muted ? volume.muteOff() : volume.muteOn())}
        />
      </div>
    </div>
  );
};

export default LevelFader;
