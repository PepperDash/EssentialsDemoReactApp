import { useITheme, useTouchpanelKey } from '@pepperdash/mobile-control-react-app-core';
import { useEffect } from 'react';
import { applyConfiguredTheme } from './theme';

/**
 * Applies this panel's configured theme ("theme" on its touchpanel device in the Essentials
 * config) once it arrives over the websocket. See theme.ts. Renders nothing.
 */
export const PanelThemeSync = () => {
  const touchpanelKey = useTouchpanelKey();
  const { currentTheme } = useITheme(touchpanelKey ?? '');

  useEffect(() => {
    if (currentTheme !== undefined) applyConfiguredTheme(currentTheme);
  }, [currentTheme]);

  return null;
};

export default PanelThemeSync;
