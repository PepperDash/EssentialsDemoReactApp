import { ReactNode } from 'react';
import { useHeaderModal } from '../../../hooks/useHeaderModal';
import classes from './HeaderModalOverlay.module.scss';

interface HeaderModalOverlayProps {
  children: ReactNode;
}

/**
 * Shared shell for every header-triggered modal (lighting, help, tech): a dimmed backdrop below
 * the header with a white bordered card anchored to the top-right, matching the design across all
 * three. Individual modals (e.g. `LightingModal`) supply only their own card contents, which
 * generally include real `<button>`s of their own (scene buttons, etc.) - the backdrop is a `<div>`
 * with button semantics rather than a native `<button>`, since HTML disallows interactive content
 * such as a `<button>` anywhere among a button's descendants, not just as a direct child.
 *
 * Tapping the dimmed area closes the modal; tapping inside the card does not.
 */
export const HeaderModalOverlay = ({ children }: HeaderModalOverlayProps) => {
  const { closeModal } = useHeaderModal();

  return (
    <div
      className={classes.backdrop}
      role="button"
      tabIndex={0}
      aria-label="Close"
      onClick={closeModal}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') closeModal();
      }}
    >
      <div className={classes.card} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default HeaderModalOverlay;
