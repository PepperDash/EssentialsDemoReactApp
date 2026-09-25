import { roomOffSourceKey, useIRunRouteAction, useRoomKey, useRoomSourceList, useRoomState } from '@pepperdash/mobile-control-react-app-core';
import { DemoRoomState } from '../../../types/DemoRoomState';
import { useVideoSyncDetected } from '../../../hooks/useVideoSyncDetected';
import SyncStatusDot from '../../shared/SyncStatusDot/SyncStatusDot';
import SourceTabs from './SourceTabs';
import classes from './BasicSourceSelection.module.scss';

/**
 * Basic-mode source selection: one row of tabs, one selection for the whole room. Selecting a tab
 * fans out to every display via `DemoRoom.RunRouteAction`'s route list - there is no per-display
 * choice here (that's what `AdvancedSourceSelection` is for).
 */
export const BasicSourceSelection = () => {
  const roomKey = useRoomKey();
  const roomState = useRoomState<DemoRoomState>(roomKey);
  const sourceList = useRoomSourceList(roomKey);
  const routeAction = useIRunRouteAction(roomKey);

  const selectedKey = roomState?.selectedSourceKey;
  const selectedSourceDeviceKey = selectedKey ? sourceList?.[selectedKey]?.sourceKey : undefined;
  const isOffSelected = !selectedKey || selectedSourceDeviceKey === roomOffSourceKey;
  const selectedSourceName = selectedKey ? sourceList?.[selectedKey]?.preferredName : undefined;
  const videoSyncDetected = useVideoSyncDetected(isOffSelected ? undefined : selectedSourceDeviceKey);

  return (
    <>
      <div className={classes.destination}>
        {isOffSelected ? (
          <p className={classes.title}>Select a source below</p>
        ) : (
          // TODO: placeholder - the active-source content view hasn't been designed yet.
          <div className={classes.titleGroup}>
            <p className={classes.title}>
              <SyncStatusDot deviceKey={selectedSourceDeviceKey} />
              Sharing {selectedSourceName}
            </p>
            {videoSyncDetected === false && <p className={classes.subtitle}>No Signal</p>}
          </div>
        )}
      </div>

      <SourceTabs
        selectedKey={selectedKey}
        onSelect={(key) => routeAction?.runRoute({ sourceListItemKey: key })}
      />
    </>
  );
};

export default BasicSourceSelection;
