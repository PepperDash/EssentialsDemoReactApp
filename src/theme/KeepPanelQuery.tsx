import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { keepPanelQuery } from './theme';

/**
 * Puts the Mobile Control token and any preferences carried in the URL back after each in-app
 * navigation. React Router drops the query when it navigates (e.g. to /tech), and without the token
 * a reload can't reconnect on a panel that blocks storage (see panelPrefs.ts). Renders nothing.
 */
export const KeepPanelQuery = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    keepPanelQuery();
  }, [pathname]);

  return null;
};

export default KeepPanelQuery;
