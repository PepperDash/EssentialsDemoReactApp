import type { RoutingOutputSlotInfo, RoutingSlotInfo } from '@pepperdash/mobile-control-react-app-core';
import classes from './OutputTile.module.scss';

/**
 * One output's current routes: its name, and its currently-routed input per signal type it
 * actually supports (an audio-only output shows only an "A:" line, never a "V:" one). `currentRouteInputKeys`
 * only carries input *keys*, not names, so `inputSlots` resolves each one to a display name.
 * Read-only display - routes are made by selecting an input then tapping this tile, handled by the
 * parent list.
 */
export const OutputTile = ({
  output,
  inputSlots,
  onClick,
}: {
  output: RoutingOutputSlotInfo;
  inputSlots: Record<string, RoutingSlotInfo>;
  onClick: () => void;
}) => {
  const showAudio = output.supportedSignalTypes === 'Audio' || output.supportedSignalTypes === 'AudioVideo';
  const showVideo = output.supportedSignalTypes === 'Video' || output.supportedSignalTypes === 'AudioVideo';

  const audioInputKey = output.currentRouteInputKeys.Audio;
  const videoInputKey = output.currentRouteInputKeys.Video;

  return (
    <button type="button" className={classes.tile} onClick={onClick}>
      <p className={classes.name}>{output.name}</p>

      <div className={classes.currentRoutes}>
        {showAudio && <p>A: {audioInputKey ? inputSlots[audioInputKey]?.name ?? audioInputKey : 'None'}</p>}
        {showVideo && <p>V: {videoInputKey ? inputSlots[videoInputKey]?.name ?? videoInputKey : 'None'}</p>}
      </div>
    </button>
  );
};

export default OutputTile;
