import classes from './TechConfirmDialog.module.scss';

/**
 * A full-screen confirmation dialog for a destructive tech action (reboot, program reset) - unlike
 * `HeaderModalOverlay` (positioned below the header, light card, for room-view pages), this covers
 * the whole tech page including the nav, matching `TechPinPage`'s full takeover.
 */
export const TechConfirmDialog = ({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className={classes.overlay}>
    <div className={classes.panel}>
      <h2 className={classes.title}>{title}</h2>
      <p className={classes.message}>{message}</p>

      <div className={classes.buttons}>
        <button type="button" className={classes.confirmButton} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className={classes.cancelButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default TechConfirmDialog;
