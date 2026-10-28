import { useGetDevice, useWebsocketContext, useWsIsConnected } from '@pepperdash/mobile-control-react-app-core';
import type { DeviceState } from '@pepperdash/mobile-control-react-app-core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ROUTING_COMMAND_PATH, RoutingCommand, RoutingCommandResult } from './routingCommands';
import { MidpointRoute, RoutingDevice, RoutingGraphState, SinkRoute, TieLine } from './routingTypes';
import { useContentStable } from './useContentStable';

const MESSAGE_PATH = '/device/routingGraph';
const DEVICE_KEY = 'routingGraph';
const COMMAND_RESULT_EVENT = '/event/device/routingGraph/commandResult';
const HANDLER_KEY = 'routingGraphView';

/** How long to wait, once connected, before deciding the processor has no routing graph messenger. */
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

interface PendingCommand {
  resolve: (result: RoutingCommandResult | undefined) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface RoutingGraph {
  devices: RoutingDevice[];
  tieLines: TieLine[];
  midpointRoutes: Record<string, MidpointRoute[]>;
  sinkRoutes: Record<string, SinkRoute[]>;
  /** The graph has arrived. */
  loaded: boolean;
  /** No graph arrived in time: the processor's Essentials has no routing graph messenger. */
  unsupported: boolean;
  /**
   * Sends a routing command; resolves with its reply, or undefined if none came back in time.
   * Never resolves if the view unmounts first.
   */
  sendCommand: (command: RoutingCommand) => Promise<RoutingCommandResult | undefined>;
}

/**
 * The system's routing graph and live routes, from Essentials' RoutingGraphMessenger over Mobile
 * Control. This stands in for the Dev Tools app's web API calls and routing feedback socket: the
 * messenger sends the same shapes and runs the same routing commands.
 *
 * Each value keeps its identity until its contents change (see useContentStable), so the graph is
 * laid out again only when the wiring changes, not on every route.
 */
export function useRoutingGraph(): RoutingGraph {
  const { sendMessage, addEventHandler, removeEventHandler } = useWebsocketContext();
  const connected = Boolean(useWsIsConnected());
  const state = useGetDevice<RoutingGraphState & DeviceState>(DEVICE_KEY);

  const devices = useContentStable(state?.devices ?? NO_DEVICES);
  const tieLines = useContentStable(state?.tieLines ?? NO_TIE_LINES);
  const midpointRoutes = useContentStable(state?.midpointRoutes ?? NO_MIDPOINT_ROUTES);
  const sinkRoutes = useContentStable(state?.sinkRoutes ?? NO_SINK_ROUTES);

  const loaded = Boolean(state?.devices);
  const [unsupported, setUnsupported] = useState(false);

  // Replies are matched to their commands by requestId.
  const pending = useRef(new Map<string, PendingCommand>());

  // Ask on every connect: a request sent while disconnected is dropped, and a reconnect may come
  // back to a processor that has restarted.
  useEffect(() => {
    if (connected) sendMessage(`${MESSAGE_PATH}/fullStatus`, {});
  }, [connected, sendMessage]);

  // Only count the wait while connected, so a slow connection doesn't read as "not supported".
  useEffect(() => {
    if (loaded || !connected) {
      setUnsupported(false);
      return;
    }
    const timer = setTimeout(() => setUnsupported(true), UNSUPPORTED_AFTER_MS);
    return () => clearTimeout(timer);
  }, [loaded, connected]);

  useEffect(() => {
    const waiting = pending.current;
    addEventHandler(COMMAND_RESULT_EVENT, HANDLER_KEY, (message) => {
      const result = message.content as RoutingCommandResult | undefined;
      const command = result?.requestId ? waiting.get(result.requestId) : undefined;
      if (!command) return;
      clearTimeout(command.timer);
      waiting.delete(result!.requestId);
      command.resolve(result);
    });

    return () => {
      removeEventHandler(COMMAND_RESULT_EVENT, HANDLER_KEY);
      // Drop, don't resolve: the view that sent these is gone and has nothing left to update.
      waiting.forEach((command) => clearTimeout(command.timer));
      waiting.clear();
    };
  }, [addEventHandler, removeEventHandler]);

  const sendCommand = useCallback(
    (command: RoutingCommand) =>
      new Promise<RoutingCommandResult | undefined>((resolve) => {
        const requestId = newRequestId();
        const waiting = pending.current;
        const timer = setTimeout(() => {
          if (!waiting.delete(requestId)) return;
          resolve(undefined);
        }, COMMAND_TIMEOUT_MS);
        waiting.set(requestId, { resolve, timer });
        sendMessage(`${MESSAGE_PATH}/${ROUTING_COMMAND_PATH}`, { ...command, requestId });
      }),
    [sendMessage]
  );

  return useMemo(
    () => ({ devices, tieLines, midpointRoutes, sinkRoutes, loaded, unsupported, sendCommand }),
    [devices, tieLines, midpointRoutes, sinkRoutes, loaded, unsupported, sendCommand]
  );
}
