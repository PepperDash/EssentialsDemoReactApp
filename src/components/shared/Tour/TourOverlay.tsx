import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTour } from '../../../hooks/useTour';
import { placePopup, Rect, Size } from './placement';
import { tourTarget } from './tourSteps';
import classes from './TourOverlay.module.scss';

/** Room around the target inside the highlight. */
const SPOTLIGHT_PADDING = 8;

const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (a !== null && b !== null && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

const sameSize = (a: Size | null, b: Size | null) =>
  a === b || (a !== null && b !== null && a.width === b.width && a.height === b.height);

/** The element's box with the spotlight's padding, or null if it isn't on screen. */
const measureTarget = (id: string | undefined): Rect | null => {
  const element = id ? document.querySelector(tourTarget(id)) : null;
  if (!element) return null;
  const { top, left, width, height } = element.getBoundingClientRect();
  if (width === 0 && height === 0) return null;
  return {
    top: top - SPOTLIGHT_PADDING,
    left: left - SPOTLIGHT_PADDING,
    width: width + SPOTLIGHT_PADDING * 2,
    height: height + SPOTLIGHT_PADDING * 2,
  };
};

/**
 * The running tour: a dimmed screen with the step's target cut out of it, and the step's popup
 * beside the target. It covers the whole UI, so taps only reach the popup's buttons while the tour
 * runs - nobody routes a source or changes the volume by accident.
 *
 * Rendered into <body>, above everything else, including the header modals the steps open.
 */
export const TourOverlay = () => {
  const { step, position, hasBack, isLast, poweringOn, next, back, end } = useTour();
  const popupRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<Rect | null>(null);
  const [popupSize, setPopupSize] = useState<Size | null>(null);
  const [viewport, setViewport] = useState<Size>({ width: window.innerWidth, height: window.innerHeight });

  // Measured every frame while a step shows, rather than once: the target may only appear a frame
  // or two after the step does (a modal opening, Advanced mode switching in) and can move while it
  // animates, and the Midnight source band lays out after its portal target mounts.
  useEffect(() => {
    if (!step) return;
    let frame = 0;
    const measure = () => {
      const nextTarget = measureTarget(step.target);
      setTarget((current) => (sameRect(current, nextTarget) ? current : nextTarget));

      const popup = popupRef.current;
      const nextSize = popup ? { width: popup.offsetWidth, height: popup.offsetHeight } : null;
      setPopupSize((current) => (sameSize(current, nextSize) ? current : nextSize));

      const nextViewport = { width: window.innerWidth, height: window.innerHeight };
      setViewport((current) => (sameSize(current, nextViewport) ? current : nextViewport));

      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') end();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, end]);

  if (!step) return null;

  const placement = popupSize ? placePopup(target, popupSize, viewport) : null;
  const nextLabel = step.powersOn ? (poweringOn ? 'Turning on…' : 'Turn on the room') : isLast ? 'Done' : 'Next';

  return createPortal(
    <div className={classes.shield} onClick={(event) => event.stopPropagation()}>
      {target ? (
        <div
          className={classes.spotlight}
          style={{ top: target.top, left: target.left, width: target.width, height: target.height }}
        />
      ) : (
        <div className={classes.scrim} />
      )}

      <div
        ref={popupRef}
        className={classes.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        // Hidden until it's been measured once, so it doesn't flash at the top-left corner.
        style={placement ? { top: placement.top, left: placement.left } : { visibility: 'hidden' }}
      >
        {position && (
          <span className={classes.count}>
            {position.number} of {position.count}
          </span>
        )}
        <h2 id="tour-title" className={classes.title}>
          {step.title}
        </h2>
        <p id="tour-body" className={classes.body}>
          {step.body}
        </p>

        <div className={classes.actions}>
          {!isLast && (
            <button type="button" className={classes.skip} onClick={end}>
              Skip
            </button>
          )}
          <div className={classes.navigation}>
            {hasBack && (
              <button type="button" className={classes.secondary} onClick={back}>
                Back
              </button>
            )}
            <button
              type="button"
              className={classes.primary}
              disabled={poweringOn}
              onClick={isLast ? end : next}
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TourOverlay;
