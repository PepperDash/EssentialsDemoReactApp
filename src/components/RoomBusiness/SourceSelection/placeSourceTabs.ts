import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders the source buttons inline (`container` undefined), into another element via a portal,
 * or nowhere yet (`container` null - the target element hasn't mounted).
 */
export const placeSourceTabs = (tabs: ReactNode, container: HTMLElement | null | undefined) =>
  container === undefined ? tabs : container && createPortal(tabs, container);
