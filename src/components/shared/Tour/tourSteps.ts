import type { HeaderModalId } from '../../../context/HeaderModalContext';

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Whether the step belongs to the room-on screens or the room-off splash screen. */
  room: 'on' | 'off';
  /** The `data-tour` id of the element to highlight; a step without one is centered on screen. */
  target?: string;
  /** A header modal to open for this step. Every other step closes whichever one is open. */
  modal?: HeaderModalId;
  /** Shows the room in Advanced sharing mode for this step. Every other step shows basic mode. */
  advanced?: boolean;
  /** The step's Next button turns the room on, and the tour carries on once it's on. */
  powersOn?: boolean;
}

/** The selector for an element marked with `data-tour="<id>"`. */
export const tourTarget = (id: string) => `[data-tour="${id}"]`;

/**
 * The tour of the user screens, started from the Help modal. Steps whose target isn't on screen
 * (say, a room with no footer button for it) are skipped - see `findStep`.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'room-off',
    room: 'off',
    title: 'Welcome',
    body: "This tour shows you how to use the room's controls. The room is off right now, so the first step is to turn it on.",
    powersOn: true,
  },
  {
    id: 'welcome',
    room: 'on',
    title: 'Welcome',
    body: "This tour shows you how to use the room's controls. Tap Next to go on, or Skip to leave the tour at any time.",
  },
  {
    id: 'room-name',
    room: 'on',
    target: 'room-name',
    title: 'Room name',
    body: "The header shows the room you're controlling, with the time in the middle. It's at the top of every screen.",
  },
  {
    id: 'sources',
    room: 'on',
    target: 'sources',
    title: 'Sources',
    body: 'Tap a source to show it on every display in the room.',
  },
  {
    id: 'sharing-status',
    room: 'on',
    target: 'sharing-status',
    title: "What's showing",
    body: 'This shows the source on the displays. For a wired source, a green dot means it is sending video and a red dot means there is no signal.',
  },
  {
    id: 'volume',
    room: 'on',
    target: 'volume',
    title: 'Volume',
    body: "Drag the slider to set the room's volume. The button below it mutes and unmutes the room.",
  },
  {
    id: 'advanced-toggle',
    room: 'on',
    target: 'advanced-toggle',
    title: 'Advanced sharing',
    body: 'Turn on Advanced to show different sources on different displays.',
  },
  {
    id: 'destinations',
    room: 'on',
    target: 'destinations',
    advanced: true,
    title: 'Pick a display',
    body: 'In Advanced mode, tap a source, then tap the display to show it on. Each display can show a different source.',
  },
  {
    id: 'lighting',
    room: 'on',
    target: 'header-modal',
    modal: 'lighting',
    title: 'Lighting',
    body: "The lighting button opens the room's lighting scenes. Tap a scene to set the lights.",
  },
  {
    id: 'audio',
    room: 'on',
    target: 'header-modal',
    modal: 'audio',
    title: 'Audio',
    body: "The audio button opens a fader for each of the room's audio channels, next to the room volume.",
  },
  {
    id: 'settings',
    room: 'on',
    target: 'header-modal',
    modal: 'settings',
    title: 'Settings',
    body: 'Settings changes the theme, the accent color, and light or dark mode. Technicians use Technician Controls to check the system, displays, routing and volume.',
  },
  {
    id: 'help',
    room: 'on',
    target: 'help-button',
    title: 'Help',
    body: "Help shows the room's help information. You can take this tour again from there.",
  },
  {
    id: 'end-session',
    room: 'on',
    target: 'end-session',
    title: 'End Session',
    body: "When you're finished, tap End Session. The panel asks you to confirm before it turns the room off.",
  },
  {
    id: 'done',
    room: 'on',
    title: "You're all set",
    body: "That's the tour. Tap Done to start using the room.",
  },
];

/**
 * The first step from `from` onwards (or backwards, for `direction` -1) that `isAvailable` accepts,
 * or undefined if there's none before the end of the list.
 */
export function findStep(
  stepCount: number,
  from: number,
  direction: 1 | -1,
  isAvailable: (index: number) => boolean
): number | undefined {
  for (let index = from; index >= 0 && index < stepCount; index += direction) {
    if (isAvailable(index)) return index;
  }
  return undefined;
}

/**
 * Whether a step can be shown now: it's for the room's current power state, and its target is on
 * screen. A step that opens a modal or switches Advanced only gets its target once it's shown, so
 * its target isn't checked.
 */
export function isStepAvailable(step: TourStep, roomOn: boolean, hasTarget: (id: string) => boolean): boolean {
  if (step.room !== (roomOn ? 'on' : 'off')) return false;
  if (!step.target || step.modal || step.advanced) return true;
  return hasTarget(step.target);
}
