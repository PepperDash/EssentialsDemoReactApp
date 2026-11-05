import { describe, expect, it } from 'vitest';

import { findStep, isStepAvailable, TOUR_STEPS, TourStep } from './tourSteps';

describe('findStep', () => {
  const available = new Set([1, 3, 4]);
  const isAvailable = (index: number) => available.has(index);

  it('returns the starting step when it is available', () => {
    expect(findStep(6, 3, 1, isAvailable)).toBe(3);
  });

  it('skips unavailable steps going forward', () => {
    expect(findStep(6, 2, 1, isAvailable)).toBe(3);
  });

  it('skips unavailable steps going back', () => {
    expect(findStep(6, 2, -1, isAvailable)).toBe(1);
  });

  it('returns undefined past either end', () => {
    expect(findStep(6, 5, 1, isAvailable)).toBeUndefined();
    expect(findStep(6, 0, -1, isAvailable)).toBeUndefined();
    expect(findStep(6, 6, 1, isAvailable)).toBeUndefined();
    expect(findStep(6, -1, -1, isAvailable)).toBeUndefined();
  });
});

describe('isStepAvailable', () => {
  const onScreen = (id: string) => id === 'present';
  const step = (overrides: Partial<TourStep>): TourStep => ({ id: 'x', title: '', body: '', room: 'on', ...overrides });

  it('only shows a step for the room power state it belongs to', () => {
    expect(isStepAvailable(step({ room: 'on' }), true, onScreen)).toBe(true);
    expect(isStepAvailable(step({ room: 'on' }), false, onScreen)).toBe(false);
    expect(isStepAvailable(step({ room: 'off' }), false, onScreen)).toBe(true);
    expect(isStepAvailable(step({ room: 'off' }), true, onScreen)).toBe(false);
  });

  it('skips a step whose target is not on screen', () => {
    expect(isStepAvailable(step({ target: 'present' }), true, onScreen)).toBe(true);
    expect(isStepAvailable(step({ target: 'missing' }), true, onScreen)).toBe(false);
  });

  it('does not check the target of a step that changes the screen to show it', () => {
    expect(isStepAvailable(step({ target: 'missing', modal: 'lighting' }), true, onScreen)).toBe(true);
    expect(isStepAvailable(step({ target: 'missing', advanced: true }), true, onScreen)).toBe(true);
  });
});

describe('TOUR_STEPS', () => {
  it('has unique ids', () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('starts with the room-off step, then only room-on steps', () => {
    expect(TOUR_STEPS[0].room).toBe('off');
    expect(TOUR_STEPS[0].powersOn).toBe(true);
    expect(TOUR_STEPS.slice(1).every((s) => s.room === 'on')).toBe(true);
  });
});
