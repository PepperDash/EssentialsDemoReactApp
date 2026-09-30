import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HeaderModalContext, HeaderModalId } from './HeaderModalContext';

interface OpenModal {
  modal: HeaderModalId;
  /** The page the modal was opened on - it belongs to that page, not to whatever comes next. */
  pathname: string;
}

/**
 * Tracks which header-triggered modal (lighting, help, tech) is open, if any.
 *
 * Lives above the room's pages (splash and on-state alike), not inside any one of them: `Header`
 * renders identically on every page, so the same lighting/help/tech icon has to open the same
 * overlay no matter which page is currently showing underneath it. A page-local `useState` in
 * `RoomHome` or `SplashScreen` couldn't do that - only one of them would ever be mounted at a time.
 *
 * Because the overlay isn't part of any route, navigating doesn't unmount it - so a modal is closed
 * whenever the page changes. Otherwise holding the audio icon to reach the tech PIN would leave the
 * audio modal open on top of the keypad.
 */
export const HeaderModalProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState<OpenModal | null>(null);

  // Clear it once the page has changed, so returning to the original page doesn't bring it back...
  useEffect(() => {
    setOpen((current) => (current && current.pathname !== pathname ? null : current));
  }, [pathname]);

  // ...and hide it in the very render that navigates, so it never flashes over the new page first.
  const activeModal = open && open.pathname === pathname ? open.modal : null;

  const value = useMemo(
    () => ({
      activeModal,
      openModal: (modal: HeaderModalId) => setOpen({ modal, pathname }),
      closeModal: () => setOpen(null),
    }),
    [activeModal, pathname]
  );

  return <HeaderModalContext.Provider value={value}>{children}</HeaderModalContext.Provider>;
};
