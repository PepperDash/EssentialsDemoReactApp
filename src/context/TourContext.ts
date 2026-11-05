import { createContext } from 'react';
import type { TourStep } from '../components/shared/Tour/tourSteps';

export interface TourContextValue {
  /** The step showing, or null when no tour is running. */
  step: TourStep | null;
  /** The step's place among the steps that can be shown, for "3 of 12"; undefined on the room-off step. */
  position?: { number: number; count: number };
  hasBack: boolean;
  isLast: boolean;
  /** The room-off step's Turn On button was tapped, and the tour is waiting for the room to come on. */
  poweringOn: boolean;
  /** Whether RoomHome should show Advanced sharing for this step; undefined when no tour is running. */
  advanced?: boolean;
  start: () => void;
  next: () => void;
  back: () => void;
  end: () => void;
}

export const TourContext = createContext<TourContextValue | undefined>(undefined);
