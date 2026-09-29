import { NavLink } from 'react-router-dom';
import classes from './TechNav.module.scss';

const TECH_NAV_ITEMS = [
  { to: '/tech/systemStatus', label: 'System Status' },
  { to: '/tech/displays', label: 'Displays' },
  { to: '/tech/routing', label: 'Routing' },
  { to: '/tech/volume', label: 'Volume' },
  { to: '/tech/about', label: 'About' },
];

/**
 * Left sidebar for the tech pages - one button per tech section, the active one highlighted blue.
 * Only System Status has content so far; the others route to placeholder pages until their Figma
 * designs arrive.
 */
export const TechNav = () => (
  <nav className={classes.nav}>
    {TECH_NAV_ITEMS.map(({ to, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => `${classes.navItem} ${isActive ? classes.active : ''}`}
      >
        {label}
      </NavLink>
    ))}
  </nav>
);

export default TechNav;
