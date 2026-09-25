import { Spinner } from 'react-bootstrap';

interface SyncingPageProps {
  /** Fill the parent element instead of the viewport. */
  inline?: boolean;
}

/**
 * Shown while the app's batch device status request is outstanding, so the room paints once with
 * fully populated state instead of flickering through empty values.
 */
export const SyncingPage = ({ inline = false }: SyncingPageProps) => (
  <div
    className={`${
      inline ? 'w-100 h-100' : 'vw-100 vh-100 bg-body-bg'
    } d-flex justify-content-center align-items-center`}
  >
    <div className="d-flex flex-column justify-content-center align-items-center gap-4 text-center">
      <Spinner
        animation="border"
        role="status"
        style={{ width: '6rem', height: '6rem', borderWidth: '0.6rem' }}
      />
      <h3>Syncing...</h3>
    </div>
  </div>
);

export default SyncingPage;
