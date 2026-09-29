import { createContext } from 'react';

export type HeaderModalId = 'lighting' | 'help' | 'audio';

export interface HeaderModalContextValue {
  activeModal: HeaderModalId | null;
  openModal: (modal: HeaderModalId) => void;
  closeModal: () => void;
}

export const HeaderModalContext = createContext<HeaderModalContextValue | undefined>(undefined);
