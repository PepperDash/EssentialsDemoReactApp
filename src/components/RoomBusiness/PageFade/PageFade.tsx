import { ReactNode, useEffect } from 'react';
import classes from './PageFade.module.scss';

const FADE_MS = 600;

interface PageFadeProps {
  /** The outgoing page, drawn on top and faded out. */
  outgoing: ReactNode;
  onDone: () => void;
}

/**
 * Midnight's transition from the splash screen to the room controls: the caller renders the
 * incoming page normally and this on top of it, fading the outgoing page away. Ignores touches
 * while it plays, so a tap can't hit the outgoing page's controls.
 */
export const PageFade = ({ outgoing, onDone }: PageFadeProps) => {
  // Timer rather than onAnimationEnd: still finishes if the panel's browser skips the animation.
  useEffect(() => {
    const timer = window.setTimeout(onDone, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={classes.fade} aria-hidden="true">
      {outgoing}
    </div>
  );
};

export default PageFade;
