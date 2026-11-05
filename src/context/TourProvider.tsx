import { useRoomIsOn, useRoomKey, useWebsocketContext } from '@pepperdash/mobile-control-react-app-core';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { findStep, isStepAvailable, TOUR_STEPS, tourTarget } from '../components/shared/Tour/tourSteps';
import { useHeaderModal } from '../hooks/useHeaderModal';
import { useShutdownPromptActive } from '../hooks/useShutdownPromptActive';
import { TourContext } from './TourContext';

/** How long the room-off step waits for the room to come on before letting the user try again. */
const POWER_ON_TIMEOUT_MS = 15000;

const hasTarget = (id: string) => document.querySelector(tourTarget(id)) !== null;

/**
 * Runs the guided tour of the user screens (see `TOUR_STEPS`), started from the Help modal.
 *
 * Each step sets up the screen it describes: it opens or closes the header modals and tells
 * RoomHome whether to show Advanced sharing. Nothing else changes, and nothing is sent to the
 * processor, except by the room-off step's Turn On button. The tour ends if the room turns off or
 * the shutdown prompt starts, since the screens it's describing are gone.
 *
 * Must sit inside HeaderModalProvider.
 */
export const TourProvider = ({ children }: { children: ReactNode }) => {
  const roomKey = useRoomKey();
  const isOn = Boolean(useRoomIsOn(roomKey));
  const shutdownActive = useShutdownPromptActive(roomKey, 'tour');
  const { sendMessage } = useWebsocketContext();
  const { openModal, closeModal } = useHeaderModal();
  const [index, setIndex] = useState<number | null>(null);
  const [poweringOn, setPoweringOn] = useState(false);

  // HeaderModalProvider makes new functions whenever the open modal changes; read the latest
  // through a ref so the step effect below only runs when the step changes.
  const modalActions = useRef({ openModal, closeModal });
  modalActions.current = { openModal, closeModal };

  const step = index === null ? null : TOUR_STEPS[index];

  const isAvailable = useCallback((i: number) => isStepAvailable(TOUR_STEPS[i], isOn, hasTarget), [isOn]);
  const find = useCallback(
    (from: number, direction: 1 | -1) => findStep(TOUR_STEPS.length, from, direction, isAvailable),
    [isAvailable]
  );

  const end = useCallback(() => {
    setIndex(null);
    setPoweringOn(false);
  }, []);

  const start = useCallback(() => {
    setPoweringOn(false);
    setIndex(find(0, 1) ?? null);
  }, [find]);

  const next = useCallback(() => {
    if (index === null) return;
    if (TOUR_STEPS[index].powersOn) {
      sendMessage(`/room/${roomKey}/defaultsource`, {});
      setPoweringOn(true);
      return;
    }
    setIndex(find(index + 1, 1) ?? null);
  }, [index, find, sendMessage, roomKey]);

  const back = useCallback(() => {
    if (index === null) return;
    const previous = find(index - 1, -1);
    if (previous !== undefined) setIndex(previous);
  }, [index, find]);

  // Open the step's modal, or close any that's open. Closing on the way out too covers the modal a
  // step opened, and the Help modal the tour was started from.
  useEffect(() => {
    if (index === null) return;
    const { modal } = TOUR_STEPS[index];
    if (modal) modalActions.current.openModal(modal);
    else modalActions.current.closeModal();
  }, [index]);

  const wasRunning = useRef(false);
  useEffect(() => {
    if (index !== null) wasRunning.current = true;
    else if (wasRunning.current) {
      wasRunning.current = false;
      modalActions.current.closeModal();
    }
  }, [index]);

  // The room changed power under the tour: carry on into the room-on steps once it's on (whoever
  // turned it on), and end the tour if it turns off.
  useEffect(() => {
    if (index === null) return;
    if (TOUR_STEPS[index].room === (isOn ? 'on' : 'off')) return;
    setPoweringOn(false);
    setIndex(isOn ? (find(index + 1, 1) ?? null) : null);
  }, [index, isOn, find]);

  useEffect(() => {
    if (shutdownActive) end();
  }, [shutdownActive, end]);

  useEffect(() => {
    if (!poweringOn) return;
    const timer = setTimeout(() => setPoweringOn(false), POWER_ON_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [poweringOn]);

  // Counted from the room-on steps that can be shown, so skipped ones don't leave gaps.
  let position: { number: number; count: number } | undefined;
  if (step?.room === 'on') {
    const shown = TOUR_STEPS.map((_, i) => i).filter(isAvailable);
    position = { number: shown.indexOf(index!) + 1, count: shown.length };
  }

  const hasBack = index !== null && find(index - 1, -1) !== undefined;
  const isLast = index !== null && !step?.powersOn && find(index + 1, 1) === undefined;
  const advanced = step ? (step.advanced ?? false) : undefined;

  const value = useMemo(
    () => ({ step, position, hasBack, isLast, poweringOn, advanced, start, next, back, end }),
    // position is rebuilt each render; its numbers are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, position?.number, position?.count, hasBack, isLast, poweringOn, advanced, start, next, back, end]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
