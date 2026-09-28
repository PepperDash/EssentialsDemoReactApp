import { useINamedRoutingSlots } from '@pepperdash/mobile-control-react-app-core';
import type { SignalType } from '@pepperdash/mobile-control-react-app-core';
import { useState } from 'react';
import { useTechRoutingDeviceKey } from '../../../hooks/useTechRoutingDeviceKey';
import InputList, { NONE_INPUT } from './InputList';
import MatrixSelect from './MatrixSelect';
import OutputList from './OutputList';
import classes from './RoutingPage.module.scss';

/**
 * Tech Routing page: a classic matrix-switcher "tie" control for `techRoutingDeviceKey`. Pick a
 * signal type (Audio/Video/Audio & Video), pick an input (or "None" to clear), then tap an output
 * to apply it - each output tile shows its current audio/video crosspoints live.
 *
 * Uses `useINamedRoutingSlots`, not `useIMatrixRouting`: the latter is for a device that only
 * implements the bare `IRoutingMidpointWithFeedback` contract (one route per output, no independent
 * audio/video). `techRoutingDeviceKey` points at the framework's own `MockRoutingMidpoint`
 * (`PepperDash.Essentials.Devices.Common`), which implements the richer `IHasNamedRoutingSlots` this
 * hook expects - its per-signal-type route tracking was extended to decompose a combined
 * Audio+Video switch into independent crosspoints (see `MockRoutingOutputSlotInfo.SetRoute` on the
 * Essentials side) specifically so this page's audio/video crosspoints can differ per output.
 *
 * That framework change lives in the Essentials source tree, not this app - it only takes effect
 * here once a new `PepperDashEssentials` package version containing it is referenced.
 */
export const RoutingPage = () => {
  const routingDeviceKey = useTechRoutingDeviceKey();
  const routing = useINamedRoutingSlots(routingDeviceKey ?? '');

  const [signalType, setSignalType] = useState<SignalType>('Audio');
  const [selectedInputKey, setSelectedInputKey] = useState<string | undefined>(undefined);

  const inputSlots = routing?.namedRoutingSlotsState?.inputSlots ?? {};
  const outputSlots = routing?.namedRoutingSlotsState?.outputSlots ?? {};

  const applyToOutput = (outputKey: string) => {
    if (!routing || selectedInputKey === undefined) return;

    if (selectedInputKey === NONE_INPUT) {
      routing.clearRoute(outputKey, signalType);
    } else {
      routing.setRoute(selectedInputKey, outputKey, signalType);
    }
  };

  return (
    <div className={classes.page}>
      <MatrixSelect signalType={signalType} onChange={setSignalType} />

      <div className={classes.main}>
        <InputList inputs={inputSlots} selectedInputKey={selectedInputKey} onSelect={setSelectedInputKey} />
        <OutputList outputs={outputSlots} inputSlots={inputSlots} onSelect={applyToOutput} />
      </div>
    </div>
  );
};

export default RoutingPage;
