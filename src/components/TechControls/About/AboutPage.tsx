import { useRuntimeInfo, useSystemControl } from '@pepperdash/mobile-control-react-app-core';
import { useMemo, useState } from 'react';
import pepperDashLogoUrl from '../../../assets/branding/pepperdash-logo.svg';
import TechConfirmDialog from '../shared/TechConfirmDialog';
import classes from './AboutPage.module.scss';

/** Strips SemVer build metadata (the `+...` suffix) for display, e.g. "1.2.3+a1b2c3d" -> "1.2.3". */
const withoutBuildMetadata = (version: string) => {
  const plusIndex = version.indexOf('+');
  return plusIndex === -1 ? version : version.substring(0, plusIndex);
};

/**
 * Tech About page: software version info for this program slot, plus reboot/program-reset actions.
 *
 * The Figma design assumes a Crestron processor running several program slots, each showing its
 * own program file/database/environment info with its own reset button - real 4-series/virtual
 * control processors run one program slot per instance, so that model doesn't apply here. This
 * shows the one thing that's actually real for a single-slot Essentials install: the running
 * program's Essentials/plugin versions (`useRuntimeInfo`), plus this React app's own build version
 * (`APP_VERSION`) - content and logic ported from the reference `About.tsx` in `kpmg-react-app`,
 * restyled for this app's dark tech-page look instead of react-bootstrap.
 *
 * Not shown: PepperDash Core's version - it's built into Essentials itself, so it's always
 * identical to `essentialsVersion` and would just be a redundant second line for the same number.
 *
 * Not shown: a touchpanel wrapper app version. Nothing in this library or app exposes one - there's
 * no native wrapper bridge to read it from here - so rather than fabricate a field, it's left out
 * until that becomes a real, available value.
 */
export const AboutPage = () => {
  const [confirmingReboot, setConfirmingReboot] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const runtimeInfo = useRuntimeInfo();
  const systemControl = useSystemControl();

  const sortedPlugins = useMemo(
    () => [...(runtimeInfo?.essentialsPlugins ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [runtimeInfo]
  );

  return (
    <div className={classes.page}>
      <div className={classes.copyrights}>
        <div className={classes.logo}>
          <img src={pepperDashLogoUrl} alt="PepperDash" className={classes.logoImage} />
        </div>

        <div className={classes.copyrightText}>
          <p>Interface design and software development Copyright 2026,</p>
          <p>PepperDash Technology Corporation, all rights reserved</p>
          <p>Touch Panel: {APP_VERSION}</p>
        </div>
      </div>

      <div className={classes.softwareInfo}>
        <h2 className={classes.softwareInfoTitle}>Software Information</h2>

        <button type="button" className={classes.actionButton} onClick={() => setConfirmingReboot(true)}>
          Reboot
        </button>
      </div>

      <div className={classes.programInfo}>
        <div className={classes.programText}>
          <p>Essentials: {runtimeInfo?.essentialsVersion}</p>
          <p className={classes.pluginsHeading}>Plugins:</p>
          {sortedPlugins.map((plugin) => (
            <p key={plugin.name}>
              {plugin.name}: {withoutBuildMetadata(plugin.version)}
            </p>
          ))}
        </div>

        <button type="button" className={classes.actionButton} onClick={() => setConfirmingReset(true)}>
          Program Reset
        </button>
      </div>

      {confirmingReboot && (
        <TechConfirmDialog
          title="Reboot"
          message="Are you sure you want to reboot the control system?"
          confirmLabel="Reboot"
          onConfirm={() => {
            systemControl.reboot();
            setConfirmingReboot(false);
          }}
          onCancel={() => setConfirmingReboot(false)}
        />
      )}

      {confirmingReset && (
        <TechConfirmDialog
          title="Program Reset"
          message="Are you sure you want to reset the control system program?"
          confirmLabel="Reset"
          onConfirm={() => {
            systemControl.programReset();
            setConfirmingReset(false);
          }}
          onCancel={() => setConfirmingReset(false)}
        />
      )}
    </div>
  );
};

export default AboutPage;
