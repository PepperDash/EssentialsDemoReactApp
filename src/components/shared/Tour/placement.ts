export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Side = 'top' | 'bottom' | 'left' | 'right';

export interface PopupPosition {
  top: number;
  left: number;
  /** The side of the target the popup is on, or 'center' when it has no target or doesn't fit beside it. */
  side: Side | 'center';
}

/** Space between the highlighted target and the popup. */
export const POPUP_GAP = 16;
/** The popup never comes closer than this to the edge of the screen. */
export const SCREEN_MARGIN = 16;

// Above or below reads most naturally, so those are tried first.
const SIDES: Side[] = ['bottom', 'top', 'right', 'left'];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));

/**
 * Where to put a tour popup next to its target: on the first side with room for it, kept on screen. A popup with no target, or one too big for every side (a target that fills the screen),
 * goes in the middle of the screen.
 */
export function placePopup(target: Rect | null, popup: Size, viewport: Size): PopupPosition {
  const centered: PopupPosition = {
    top: Math.max(SCREEN_MARGIN, (viewport.height - popup.height) / 2),
    left: Math.max(SCREEN_MARGIN, (viewport.width - popup.width) / 2),
    side: 'center',
  };
  if (!target) return centered;

  const space: Record<Side, number> = {
    top: target.top,
    bottom: viewport.height - (target.top + target.height),
    left: target.left,
    right: viewport.width - (target.left + target.width),
  };
  const needed = (side: Side) =>
    (side === 'top' || side === 'bottom' ? popup.height : popup.width) + POPUP_GAP + SCREEN_MARGIN;

  const side = SIDES.find((s) => space[s] >= needed(s));
  if (!side) return centered;

  const maxTop = viewport.height - popup.height - SCREEN_MARGIN;
  const maxLeft = viewport.width - popup.width - SCREEN_MARGIN;
  const centerTop = clamp(target.top + target.height / 2 - popup.height / 2, SCREEN_MARGIN, maxTop);
  const centerLeft = clamp(target.left + target.width / 2 - popup.width / 2, SCREEN_MARGIN, maxLeft);

  switch (side) {
    case 'bottom':
      return { top: target.top + target.height + POPUP_GAP, left: centerLeft, side };
    case 'top':
      return { top: target.top - POPUP_GAP - popup.height, left: centerLeft, side };
    case 'right':
      return { top: centerTop, left: target.left + target.width + POPUP_GAP, side };
    case 'left':
      return { top: centerTop, left: target.left - POPUP_GAP - popup.width, side };
  }
}
