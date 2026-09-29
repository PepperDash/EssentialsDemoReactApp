import { useContext } from 'react';
import { HeaderModalContext, HeaderModalContextValue } from '../context/HeaderModalContext';

export function useHeaderModal(): HeaderModalContextValue {
  const context = useContext(HeaderModalContext);
  if (!context) {
    throw new Error('useHeaderModal must be used within a HeaderModalProvider');
  }
  return context;
}
