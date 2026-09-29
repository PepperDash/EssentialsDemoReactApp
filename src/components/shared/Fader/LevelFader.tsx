import { IconButton, useDeviceIBasicVolumeWithFeedback } from '@pepperdash/mobile-control-react-app-core';
import type { IconProps } from '@pepperdash/mobile-control-react-app-core';
import { useCallback, useRef } from 'react';
import classes from './LevelFader.module.scss';

const MAX_LEVEL = 65535;

type Volume = ReturnType<typeof useDeviceIBasicVolumeWithFeedback>;

// Inlined as JSX rather than referenced via `<img src="...svg">`: an <img>-referenced SVG renders
// in an isolated context that never sees the embedding page's styles, so its `fill="currentColor"`
// can never actually resolve to this button's `color` - the icon would always render whatever
// color the file itself was exported with, regardless of mute/dark state. Inlining is what lets
// `currentColor` work at all (same reasoning as `ProgramAudioIcon`).
const SpeakerMuteIcon = ({ className }: IconProps) => (
  <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.0278 4.82726C17.7286 4.55018 18.3969 5.43848 18.3969 6.19638V29.3656C18.3969 30.1235 17.7286 31.0118 17.0278 30.7347C14.7378 29.8301 10.2963 24.8344 8.83748 23.1475L3.36913 22.8052C2.61122 22.8052 2 22.194 2 21.4361V14.1259C2 13.368 2.61122 12.7568 3.36913 12.7568L8.83748 12.4145C10.2963 10.7194 14.7378 5.73186 17.0278 4.82726ZM28.6328 4.41978C27.9237 3.71077 26.7747 3.71077 26.0738 4.41978C25.3648 5.12879 25.3648 6.27788 26.0738 6.97874C28.9343 9.84739 30.4664 13.7021 30.3768 17.8503C30.2871 22.0228 28.5676 25.9917 25.5359 29.0233C24.8269 29.7323 24.8269 30.8814 25.5359 31.5823C25.8864 31.9327 26.3509 32.112 26.8154 32.112C27.2799 32.112 27.7445 31.9327 28.0949 31.5823C31.7866 27.8905 33.8811 23.0415 33.9952 17.9236C34.1093 12.7812 32.2023 7.98114 28.6328 4.41163M23.4985 9.59475C22.7895 8.88574 21.6404 8.88574 20.9396 9.59475C20.2306 10.3038 20.2306 11.4529 20.9396 12.1537C24.0772 15.2913 23.9386 20.5396 20.6299 23.8483C19.9209 24.5573 19.9209 25.7064 20.6299 26.4073C20.9803 26.7577 21.4448 26.937 21.9094 26.937C22.3739 26.937 22.8384 26.7577 23.1888 26.4073C27.9156 21.6805 28.0541 14.1341 23.4985 9.5866"
      fill="currentColor"
    />
  </svg>
);

const MicMuteIcon = ({ className }: IconProps) => (
  <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.987 22.4338C14.7436 22.4338 12.1099 19.8131 12.0904 16.5696H12.0645V7.89662H12.0904C12.0904 4.64018 14.7306 2 17.987 2C21.2435 2 23.8836 4.64018 23.8836 7.89662H23.9096V16.5696H23.8836C23.8642 19.8131 21.2305 22.4338 17.987 22.4338ZM28.5607 14.6495C28.5607 13.5856 27.698 12.7229 26.6341 12.7229C25.5702 12.7229 24.7075 13.5856 24.7075 14.6495C24.675 15.7977 24.5777 17.627 24.3896 18.6065C23.8577 21.331 21.0034 23.2706 17.9935 23.2706C14.9836 23.2706 12.1293 21.3375 11.5974 18.6065C11.4093 17.6335 11.312 15.7977 11.2795 14.6495C11.2795 13.5856 10.4168 12.7229 9.35293 12.7229C8.28907 12.7229 7.42631 13.5856 7.42631 14.6495C7.42631 17.4713 7.65336 18.5676 7.65336 18.5676C8.45125 22.7387 11.7271 26.0405 15.8723 26.8968V30.1468H10.2806C9.2167 30.1468 8.35394 31.0095 8.35394 32.0734C8.35394 33.1372 9.2167 34 10.2806 34H26.0957C27.1595 34 28.0223 33.1372 28.0223 32.0734C28.0223 31.0095 27.1595 30.1468 26.0957 30.1468H20.1342V26.8968C24.2793 26.0341 27.5488 22.7322 28.3466 18.5676C28.3466 18.5676 28.5737 17.4713 28.5737 14.6495"
      fill="currentColor"
    />
  </svg>
);

const SpeakerMuteActiveIcon = ({ className }: IconProps) => (
  <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.08 22.48C7.65083 22.2842 7.35718 21.8551 7.35718 21.3506V14.6795C7.35718 13.9868 7.91436 13.4296 8.60706 13.4296L13.5915 13.1209C14.9242 11.5774 18.9751 7.02965 21.0607 6.20141C21.7007 5.94541 22.3106 6.75859 22.3106 7.45129V8.24941L8.08 22.48ZM21.0532 29.8664C21.6932 30.1224 22.3106 29.3092 22.3106 28.6089V19.1746L15.9407 25.5445C17.6499 27.344 19.7431 29.3393 21.0607 29.8588M33.4466 2.54965C33.0776 2.18071 32.5958 2 32.1139 2C31.632 2 31.1501 2.18071 30.7812 2.54965L22.3181 11.0127L10.6024 22.7285L2.55341 30.7774C1.81553 31.5153 1.81553 32.7125 2.55341 33.4428C2.92236 33.8118 3.40424 34 3.88612 34C4.368 34 4.84989 33.8193 5.21883 33.4428L14.5854 24.0762L22.3106 16.3511L33.4466 5.21506C34.1845 4.47718 34.1845 3.28 33.4466 2.54212"
      fill="currentColor"
    />
  </svg>
);

const MicMuteActiveIcon = ({ className }: IconProps) => (
  <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M33.1585 2.69748C33.7914 3.45954 33.7075 4.60908 32.9712 5.26781L24.6984 12.6172L15.1081 21.1419L14.4041 21.7683L11.5949 24.2676L5.33694 29.8281C4.96883 30.1574 4.50384 30.2995 4.05177 30.2672C3.5997 30.2349 3.16055 30.0218 2.8441 29.6408C2.20475 28.8787 2.29516 27.7292 3.03139 27.0704L9.41847 21.3937L12.415 18.7265L13.1061 18.113L24.6726 7.83814L30.6722 2.51019C31.4148 1.85146 32.5256 1.93542 33.165 2.69102M12.9059 17.0022L24.5369 6.66277C23.9686 4.00202 21.605 2 18.7763 2C15.5214 2 12.88 4.64137 12.88 7.89627H12.8542V16.5631H12.88C12.88 16.7116 12.8929 16.8537 12.9059 17.0022ZM24.6726 16.5695H24.6984V13.9088L15.9347 21.6973C16.7807 22.1623 17.7495 22.427 18.7763 22.427C22.0183 22.427 24.6532 19.805 24.6726 16.5695ZM27.4173 12.7205C26.3517 12.7205 25.4863 13.5859 25.4863 14.6515C25.454 15.801 25.3571 17.6287 25.1634 18.6038C24.6338 21.3292 21.7793 23.2601 18.7698 23.2601C17.504 23.2601 16.2705 22.9179 15.2243 22.3173L12.3311 24.894C13.5775 25.8628 15.0435 26.5602 16.6451 26.8896V30.138H11.0588C9.99325 30.138 9.12786 31.0034 9.12786 32.069C9.12786 33.1346 9.99325 34 11.0588 34H26.8683C27.9339 34 28.7993 33.1346 28.7993 32.069C28.7993 31.0034 27.9339 30.138 26.8683 30.138H20.9075V26.8896C25.0471 26.0307 28.3214 22.7306 29.1157 18.5651C29.1157 18.5651 29.3418 17.4672 29.3418 14.6515C29.3418 13.5859 28.4764 12.7205 27.4108 12.7205M8.43038 18.5651C8.55954 19.2238 8.75329 19.8632 8.99869 20.4767L12.2407 17.5964C12.1438 16.6406 12.0857 15.4716 12.0598 14.6515C12.0598 13.5859 11.1945 12.7269 10.1289 12.7269C9.06328 12.7269 8.19789 13.5923 8.19789 14.6515C8.19789 17.4737 8.42392 18.5651 8.42392 18.5651"
      fill="currentColor"
    />
  </svg>
);

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
  const MuteIcon = volumeState.muted
    ? isMic
      ? MicMuteActiveIcon
      : SpeakerMuteActiveIcon
    : isMic
      ? MicMuteIcon
      : SpeakerMuteIcon;

  return (
    <div className={`${classes.fader} ${dark ? classes.dark : ''}`}>
      {label && <span className={classes.label}>{label}</span>}

      <div className={classes.trackContainer}>
        <div
          className={`${classes.touchset} ${volumeState.muted ? classes.muted : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className={classes.track} ref={trackRef}>
            <div className={classes.fill} style={{ height: `${fillPercent}%` }} />
          </div>
          {/* A sibling of .track, not a child: the knob is wider than the 20px track, and .track
              needs overflow:hidden to clip .fill's corners - as a child, that same overflow was
              clipping the knob's own edges too. */}
          <div className={classes.knob} style={{ bottom: `${fillPercent}%` }} />
        </div>
      </div>

      <div className={classes.mutes}>
        <IconButton
          multiIcon={MuteIcon}
          className={`${classes.muteButton} ${volumeState.muted ? classes.muted : ''}`}
          iconClassName={classes.muteIcon}
          aria-label={volumeState.muted ? 'Unmute' : 'Mute'}
          onClick={() => (volumeState.muted ? volume.muteOff() : volume.muteOn())}
        />
      </div>
    </div>
  );
};

export default LevelFader;
