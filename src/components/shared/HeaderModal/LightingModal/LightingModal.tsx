import { useILightingScenes } from '@pepperdash/mobile-control-react-app-core';
import { useLightingDeviceKey } from '../../../../hooks/useLightingDeviceKey';
import { useHeaderModal } from '../../../../hooks/useHeaderModal';
import classes from './LightingModal.module.scss';

/**
 * Lighting quick-scene panel, opened from the header's lighting icon. Scenes are entirely
 * config-driven (`MockLightingDevice`'s configured scene list) - nothing here is hardcoded to this
 * demo's particular scene names.
 */
export const LightingModal = () => {
  const lightingDeviceKey = useLightingDeviceKey();
  const lighting = useILightingScenes(lightingDeviceKey ?? '');
  const { closeModal } = useHeaderModal();

  const scenes = lighting?.lightingState?.scenes ?? [];

  return (
    <div className={classes.sceneList}>
      <span className={classes.title}>Lights</span>

      {scenes.length === 0 && <span className={classes.empty}>No lighting scenes configured.</span>}

      {scenes.map((scene) => (
        <button
          key={scene.id}
          type="button"
          className={classes.sceneButton}
          onClick={() => {
            lighting?.selectScene(scene);
            closeModal();
          }}
        >
          {scene.name}
        </button>
      ))}
    </div>
  );
};

export default LightingModal;
