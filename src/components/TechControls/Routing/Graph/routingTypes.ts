// Routing graph types, copied from the Dev Tools app (essentials-devtools src/store/apiSlice.ts).
// They mirror the Essentials web API's routingDevicesAndTieLines response and routing feedback
// messages; the Mobile Control routing graph messenger sends the same shapes.

export interface RoutingPort {
  key: string;
  signalType: string;
  connectionType: string;
  isInternal: boolean;
}

export interface RoutingDevice {
  key: string;
  name: string;
  hasInputs: boolean;
  hasOutputs: boolean;
  hasInputsAndOutputs: boolean;
  inputPorts?: RoutingPort[];
  outputPorts?: RoutingPort[];
}

export interface TieLine {
  sourceDeviceKey: string;
  sourcePortKey: string;
  destinationDeviceKey: string;
  destinationPortKey: string;
  signalType: string;
  isInternal: boolean;
}

export interface RouteSwitchStepInfo {
  switchingDeviceKey: string;
  inputPortKey: string;
  outputPortKey: string;
}

export interface ActiveRouteInfo {
  sourceDeviceKey: string;
  destinationDeviceKey: string;
  destinationInputPortKey: string;
  steps: RouteSwitchStepInfo[];
}

export interface CurrentRouteGroupInfo {
  signalType: string;
  routes: ActiveRouteInfo[];
}

export interface SinkCurrentSourceInfo {
  deviceKey: string;
  inputPortKey: string;
  sourceDeviceKey: string;
  signalType: string;
}

export interface RoutingDevicesAndTieLines {
  devices: RoutingDevice[];
  tieLines: TieLine[];
  currentRoutes: CurrentRouteGroupInfo[];
  // Current source per sink device, read directly from each sink's own current-source
  // bookkeeping. Covers routes made via device-specific bulk APIs (e.g. dynamic multiview
  // layouts) that currentRoutes does not, since those never create a RouteDescriptor/TieLine.
  sinkCurrentSources: SinkCurrentSourceInfo[];
  // Current multiview canvas/tile layout for every device implementing
  // IRoutingSinkWithLayoutState, keyed by device key. Devices with no currently active layout
  // are omitted. Lets the UI render an initial layout mock-up without waiting on the routing
  // feedback WebSocket.
  multiviewLayouts?: Record<string, MultiviewLayoutState>;
}

// ─── Multiview layout/tile mock-up state ─────────────────────────────────────

/**
 * Describes a single tile/window within a MultiviewLayoutState. Geometry (x/y/width/height) is
 * expressed in pixels within the same coordinate space as the parent's canvasWidth/canvasHeight.
 */
export interface MultiviewTileState {
  tileNumber: number;
  tileSinkKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zOrder: number;
  sourceDeviceKey: string | null;
}

/**
 * Describes the current shape of a multiview canvas and every visible tile within it - a
 * product-agnostic, JSON-serializable snapshot of what is actually displayed on the monitor fed
 * by a multiview-capable decoder.
 */
export interface MultiviewLayoutState {
  canvasWidth: number;
  canvasHeight: number;
  tiles: MultiviewTileState[];
}

// ─── Live routing feedback (WebSocket) types ─────────────────────────────────

export interface MidpointRoute {
  inputPortKey: string;
  outputPortKey: string;
  signalType: string;
}

export interface SinkRoute {
  inputPortKey: string;
  // Null/empty when the route feeding this input has been cleared. The feedback slice removes such
  // entries rather than storing them, so a SinkRoute held in state always has a real source.
  sourceDeviceKey: string | null;
  signalType: string;
}

/**
 * State of the Mobile Control routing graph messenger (/device/routingGraph). /fullStatus fills
 * every field; later updates carry only the routes and layouts. Every midpoint and sink is listed,
 * with an empty array when nothing is routed.
 */
export interface RoutingGraphState {
  devices?: RoutingDevice[];
  tieLines?: TieLine[];
  midpointRoutes?: Record<string, MidpointRoute[]>;
  sinkRoutes?: Record<string, SinkRoute[]>;
  layouts?: Record<string, MultiviewLayoutState>;
}
