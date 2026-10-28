import { useGetDevice, useWebsocketContext } from '@pepperdash/mobile-control-react-app-core';
import type { DeviceState } from '@pepperdash/mobile-control-react-app-core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ROUTING_COMMAND_PATH, RoutingCommand, RoutingCommandResult } from './routingCommands';
import { MidpointRoute, RoutingDevice, RoutingGraphState, SinkRoute, TieLine } from './routingTypes';

const MESSAGE_PATH = '/device/routingGraph';
const DEVICE_KEY = 'routingGraph';
const COMMAND_RESULT_EVENT = '/event/device/routingGraph/commandResult';
const HANDLER_KEY = 'routingGraphView';

/** How long to wait for the graph before deciding the processor has no routing graph messenger. */
const UNSUPPORTED_AFTER_MS = 5000;
/** How long to wait for a command's reply. */
const COMMAND_TIMEOUT_MS = 10000;

const NO_DEVICES: RoutingDevice[] = [];
const NO_TIE_LINES: TieLine[] = [];
const NO_MIDPOINT_ROUTES: Record<string, MidpointRoute[]> = {};
const NO_SINK_ROUTES: Record<string, SinkRoute[]> = {};

// crypto.randomUUID isn't available to a page served over plain HTTP, as panels often are.
let nextRequestId = 0;
const newRequestId = () => `${Date.now().toString(36)}-${(nextRequestId++).toString(36)}`;

export interface RoutingGraph {
  devices: RoutingDevice[];
  tieLines: TieLine[];
  midpointRoutes: Record<string, MidpointRoute[]>;
  sinkRoutes: Record<string, SinkRoute[]>;
  /** The graph has arrived. */
  loaded: boolean;
  /** No graph arrived in time: the processor's Essentials has no routing graph messenger. */
  unsupported: boolean;
  /** Sends a routing command; resolves with its reply, or undefined if none came back in time. */
  sendCommand: (command: RoutingCommand) => Promise<RoutingCommandResult | undefined>;
}

/**
 * The system's routing graph and live routes, from Essentials' RoutingGraphMessenger over Mobile
 * Control. This stands in for the Dev Tools app's web API calls and routing feedback socket: the
 * messenger sends the same shapes and runs the same routing commands.
 */
export function useRoutingGraph(): RoutingGraph {
  const { sendMessage, addEventHandler, removeEventHandler } = useWebsocketContext();
  const state = useGetDevice<RoutingGraphState & DeviceState>(DEVICE_KEY);
  const loaded = Boolean(state?.devices);
  const [unsupported, setUnsupported] = useState(false);

  // Replies are matched to their commands by requestId.
  const waiting = useRef(new Map<string, (result: RoutingCommandResult | undefined) => void>());

  useEffect(() => {
    sendMessage(`${MESSAGE_PATH}/fullStatus`, {});
  }, [sendMessage]);

  useEffect(() => {
    if (loaded) {
      setUnsupported(false);
      return;
    }
    const timer = setTimeout(() => setUnsupported(true), UNSUPPORTED_AFTER_MS);
    return () => clearTimeout(timer);
  }, [loaded]);

  useEffect(() => {
    const pending = waiting.current;
    addEventHandler(COMMAND_RESULT_EVENT, HANDLER_KEY, (message) => {
      const result = message.content as RoutingCommandResult | undefined;
      const resolve = result?.requestId ? pending.get(result.requestId) : undefined;
      if (!resolve) return;
      pending.delete(result!.requestId);
      resolve(result);
    });

    return () => {
      removeEventHandler(COMMAND_RESULT_EVENT, HANDLER_KEY);
      pending.forEach((resolve) => resolve(undefined));
      pending.clear();
    };
  }, [addEventHandler, removeEventHandler]);

  const sendCommand = useCallback(
    (command: RoutingCommand) =>
      new Promise<RoutingCommandResult | undefined>((resolve) => {
        const requestId = newRequestId();
        const pending = waiting.current;
        pending.set(requestId, resolve);
        sendMessage(`${MESSAGE_PATH}/${ROUTING_COMMAND_PATH}`, { ...command, requestId });

        setTimeout(() => {
          if (!pending.has(requestId)) return;
          pending.delete(requestId);
          resolve(undefined);
        }, COMMAND_TIMEOUT_MS);
      }),
    [sendMessage]
  );

  return useMemo(
    () => ({
      devices: state?.devices ?? NO_DEVICES,
      tieLines: state?.tieLines ?? NO_TIE_LINES,
      midpointRoutes: state?.midpointRoutes ?? NO_MIDPOINT_ROUTES,
      sinkRoutes: state?.sinkRoutes ?? NO_SINK_ROUTES,
      loaded,
      unsupported,
      sendCommand,
    }),
    [state?.devices, state?.tieLines, state?.midpointRoutes, state?.sinkRoutes, loaded, unsupported, sendCommand]
  );
}
