import type { ReactNode } from 'react';
import classes from './TechSection.module.scss';

/**
 * A titled group of `TechToggleButton`s (Power State/Inputs/Screen/Lift, etc.) on a tech control
 * page - the buttons wrap onto multiple rows, centered, when there isn't room for them all on one.
 */
export const TechSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className={classes.section}>
    <h2 className={classes.title}>{title}</h2>
    <div className={classes.buttonList}>{children}</div>
  </div>
);

export default TechSection;
