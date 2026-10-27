import { useILightingScenes } from '@pepperdash/mobile-control-react-app-core';
import { useLightingDeviceKey } from '../../../../hooks/useLightingDeviceKey';
import { useHeaderModal } from '../../../../hooks/useHeaderModal';
import { useState } from 'react';
import { isMidnight } from '../../../../theme/theme';
import classes from './LightingModal.module.scss';

// Midnight highlights the last scene pressed on this panel rather than the device's reported
// active scene (the demo's mock lighting device doesn't report scene changes). Kept outside the
// component so it survives the modal closing and reopening.
let lastPressedSceneId: string | undefined;

/**
 * Lighting quick-scene panel, opened from the header's lighting icon. Scenes are entirely
 * config-driven (`MockLightingDevice`'s configured scene list) - nothing here is hardcoded to this
 * demo's particular scene names.
 */
export const LightingModal = () => {
  const lightingDeviceKey = useLightingDeviceKey();
  const lighting = useILightingScenes(lightingDeviceKey ?? '');
  const { closeModal } = useHeaderModal();

  // Midnight keeps the modal open after a scene press and pulses the pressed button instead.
  const [pulsingId, setPulsingId] = useState<string>();
  const [pressedId, setPressedId] = useState(lastPressedSceneId);

  const scenes = lighting?.lightingState?.scenes ?? [];

  return (
    <div className={classes.sceneList}>
      <span className={classes.title}>Lights</span>

      {scenes.length === 0 && <span className={classes.empty}>No lighting scenes configured.</span>}

      <div className={classes.sceneGroup}>
        {scenes.map((scene) => (
          <button
            key={scene.id}
            type="button"
            className={[
              classes.sceneButton,
              (isMidnight ? (pressedId ?? scenes.find((s) => s.isActive)?.id) === scene.id : scene.isActive)
                ? classes.active
                : '',
              pulsingId === scene.id ? classes.pulsing : '',
            ].join(' ')}
            onClick={() => {
              lighting?.selectScene(scene);
              if (isMidnight) {
                lastPressedSceneId = scene.id;
                setPressedId(scene.id);
                setPulsingId(scene.id);
              } else {
                closeModal();
              }
            }}
            onAnimationEnd={() => setPulsingId(undefined)}
          >
            {scene.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LightingModal;
