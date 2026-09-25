import { useHeaderModal } from '../../../hooks/useHeaderModal';
import HeaderModalOverlay from './HeaderModalOverlay';
import LightingModal from './LightingModal/LightingModal';
import HelpModal from './HelpModal/HelpModal';
import AudioControlsModal from './AudioControlsModal/AudioControlsModal';

/**
 * Renders whichever header-triggered modal is currently open, if any. A sibling of the page
 * content (see `RoomBusiness`), not nested inside `SplashScreen`/`RoomHome`, so it overlays
 * whichever of those is actually mounted without either needing to know about modals at all.
 */
export const HeaderModalOutlet = () => {
  const { activeModal } = useHeaderModal();

  if (!activeModal) return null;

  return (
    <HeaderModalOverlay>
      {activeModal === 'lighting' && <LightingModal />}
      {activeModal === 'help' && <HelpModal />}
      {activeModal === 'audio' && <AudioControlsModal />}
    </HeaderModalOverlay>
  );
};

export default HeaderModalOutlet;
