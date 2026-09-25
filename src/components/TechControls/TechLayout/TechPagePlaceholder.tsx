import classes from './TechPagePlaceholder.module.scss';

/**
 * Stand-in for a tech nav section whose Figma design hasn't arrived yet - keeps the nav's other
 * four links from being dead ends while System Status is the only page actually built.
 */
export const TechPagePlaceholder = ({ label }: { label: string }) => (
  <div className={classes.placeholder}>{label} - coming soon</div>
);

export default TechPagePlaceholder;
