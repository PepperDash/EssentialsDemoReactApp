import {
  uiActions,
  useAppDispatch,
  useIsInitialSyncComplete,
  useIsSyncStateValuePresent,
} from '@pepperdash/mobile-control-react-app-core';
import { useEffect } from 'react';

/**
 * True once the processor has answered this session's first batch status request with
 * `/system/initialSyncComplete`, and stays true from then on.
 *
 * The latch matters because later scoped batch requests lower `initialSyncComplete` again while
 * they are outstanding. A page-level gate must not read that dip as "not ready yet" and throw a
 * full-screen spinner over an already-painted room. The latch lives in the same Redux sync state as
 * the flag it tracks, so a websocket drop clears both and the boot gate correctly returns for the
 * reconnect resync.
 */
export function useHasCompletedInitialSync(): boolean {
  const dispatch = useAppDispatch();
  const initialSyncComplete = useIsInitialSyncComplete();
  const latched = useIsSyncStateValuePresent('appInitialSyncComplete');

  useEffect(() => {
    if (initialSyncComplete && !latched) {
      dispatch(uiActions.addSyncState('appInitialSyncComplete'));
    }
  }, [initialSyncComplete, latched, dispatch]);

  return initialSyncComplete || latched;
}
