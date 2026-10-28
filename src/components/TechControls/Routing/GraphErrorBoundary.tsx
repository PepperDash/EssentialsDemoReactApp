import { Component, type ReactNode } from 'react';
import TechToggleButton from '../shared/TechToggleButton';
import classes from './GraphErrorBoundary.module.scss';

/**
 * Catches a Graph mode that fails to load or render - most often its code chunk failing to
 * download (a dropped connection, or an index.html cached from before a redeploy) - so the rest of
 * the page, including the Matrix/Graph toggle, keeps working.
 *
 * Retry reloads the page rather than re-rendering: React caches a failed lazy import, so only a
 * reload can fetch the chunk again, and it also picks up a newer index.html.
 */
export class GraphErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Routing graph failed to load', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className={classes.failed}>
        <p>The routing graph couldn't load. Check the connection and retry, or use Matrix mode.</p>
        <TechToggleButton active={false} onClick={() => window.location.reload()}>
          Retry
        </TechToggleButton>
      </div>
    );
  }
}

export default GraphErrorBoundary;
