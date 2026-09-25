import { ReactNode, useMemo, useState } from 'react';
import { HeaderModalContext, HeaderModalId } from './HeaderModalContext';

/**
 * Tracks which header-triggered modal (lighting, help, tech) is open, if any.
 *
 * Lives above the room's pages (splash and on-state alike), not inside any one of them: `Header`
 * renders identically on every page, so the same lighting/help/tech icon has to open the same
 * overlay no matter which page is currently showing underneath it. A page-local `useState` in
 * `RoomHome` or `SplashScreen` couldn't do that - only one of them would ever be mounted at a time.
 */
export const HeaderModalProvider = ({ children }: { children: ReactNode }) => {
  const [activeModal, setActiveModal] = useState<HeaderModalId | null>(null);

  const value = useMemo(
    () => ({
      activeModal,
      openModal: (modal: HeaderModalId) => setActiveModal(modal),
      closeModal: () => setActiveModal(null),
    }),
    [activeModal]
  );

  return <HeaderModalContext.Provider value={value}>{children}</HeaderModalContext.Provider>;
};
