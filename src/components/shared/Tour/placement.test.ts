import { describe, expect, it } from 'vitest';

import { placePopup, POPUP_GAP, SCREEN_MARGIN } from './placement';

const viewport = { width: 1280, height: 800 };
const popup = { width: 360, height: 200 };

describe('placePopup', () => {
  it('centers a popup with no target', () => {
    expect(placePopup(null, popup, viewport)).toEqual({ top: 300, left: 460, side: 'center' });
  });

  it('puts the popup below a target in the header', () => {
    const target = { top: 20, left: 20, width: 200, height: 35 };
    expect(placePopup(target, popup, viewport)).toEqual({
      top: 55 + POPUP_GAP,
      left: SCREEN_MARGIN, // centered on the target would run off the left edge
      side: 'bottom',
    });
  });

  it('puts the popup above a target in the footer', () => {
    const target = { top: 700, left: 500, width: 280, height: 90 };
    expect(placePopup(target, popup, viewport)).toEqual({ top: 700 - POPUP_GAP - 200, left: 460, side: 'top' });
  });

  it('puts the popup left of a tall target on the right edge', () => {
    const target = { top: 75, left: 1140, width: 140, height: 600 };
    expect(placePopup(target, popup, viewport)).toEqual({ top: 275, left: 1140 - POPUP_GAP - 360, side: 'left' });
  });

  it('keeps a side-placed popup on screen vertically', () => {
    const target = { top: 0, left: 1140, width: 140, height: 60 };
    const position = placePopup(target, { width: 360, height: 760 }, viewport);
    expect(position.side).toBe('left');
    expect(position.top).toBe(SCREEN_MARGIN);
  });

  it('centers the popup when the target leaves no room on any side', () => {
    const target = { top: 10, left: 10, width: 1260, height: 780 };
    expect(placePopup(target, popup, viewport).side).toBe('center');
  });
});
