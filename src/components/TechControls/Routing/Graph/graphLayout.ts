// Graph layout and path tracing, copied from the Dev Tools app's Routing.tsx (buildGraph,
// traceSignalPath). Pure functions: data in, React Flow nodes and edges out.
import { Edge, Node } from '@xyflow/react';
import dagre from 'dagre';

import { HEADER_PX, NODE_WIDTH_PX, PORT_ROW_PX, RoutingDeviceNodeData } from './RoutingDeviceNode';
import { MidpointRoute, RoutingDevice, RoutingDevicesAndTieLines, SinkRoute, TieLine } from './routingTypes';
import { signalColor } from './signalColors';
import { parseSignalFlags } from './signalTypes';

const NODE_WIDTH = NODE_WIDTH_PX;
const NODE_SEP = 60;
const RANK_SEP = 200;

// ─── Dagre layout ────────────────────────────────────────────────────────────

function nodeHeight(device: RoutingDevice): number {
  const rows = Math.max(
    (device.inputPorts ?? []).length,
    (device.outputPorts ?? []).length,
    1
  );
  return HEADER_PX + rows * PORT_ROW_PX;
}

function makeGraph() {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: NODE_SEP, ranksep: RANK_SEP });
  return g;
}

export function buildGraph(
  data: Pick<RoutingDevicesAndTieLines, 'devices' | 'tieLines'>,
  hiddenTypes: Set<string>,
  hideUnconnected: boolean,
  hiddenDevices: Set<string>,
  hideUnconnectedPorts: boolean,
  sinkRoutes: Record<string, SinkRoute[]>
): { nodes: Node[]; edges: Edge[] } {
  // Live, tile-aware current-source feedback (sinkRoutes) reflects routes made via
  // device-specific bulk APIs (e.g. ApplyDynamicLayout) that never create a real TieLine. Turn
  // these into synthetic tie-line-shaped edges so they're visualized just like static wiring -
  // but only where no real tie line already targets that exact device+port (a real tie line's
  // active route is already covered by midpointRoutes/tie-line tracing).
  const realTieLineDestinations = new Set(
    data.tieLines.map(
      (tl) => `${tl.destinationDeviceKey}:${tl.destinationPortKey}`
    )
  );
  const deviceOutputPortKey = new Map<string, string>(
    data.devices
      .filter((d) => (d.outputPorts ?? []).length === 1)
      .map((d) => [d.key, d.outputPorts![0].key])
  );
  const syntheticTieLines: TieLine[] = Object.entries(sinkRoutes).flatMap(
    ([deviceKey, routes]) =>
      routes
        .filter(
          (r) => !realTieLineDestinations.has(`${deviceKey}:${r.inputPortKey}`)
        )
        // A cleared route carries no source, so it can produce no edge.
        .filter(
          (r): r is SinkRoute & { sourceDeviceKey: string } =>
            Boolean(r.sourceDeviceKey) &&
            deviceOutputPortKey.has(r.sourceDeviceKey!)
        )
        .map((r) => ({
          sourceDeviceKey: r.sourceDeviceKey,
          sourcePortKey: deviceOutputPortKey.get(r.sourceDeviceKey)!,
          destinationDeviceKey: deviceKey,
          destinationPortKey: r.inputPortKey,
          signalType: r.signalType,
          isInternal: false,
        }))
  );
  const allTieLines = [...data.tieLines, ...syntheticTieLines];
  const syntheticTieLineKeys = new Set(
    syntheticTieLines.map(
      (tl) =>
        `${tl.sourceDeviceKey}|${tl.sourcePortKey}|${tl.destinationDeviceKey}|${tl.destinationPortKey}`
    )
  );

  // Devices that appear in at least one *visible* tie line endpoint (real or synthetic)
  const connectedKeys = new Set<string>(
    allTieLines
      .filter((tl) => !hiddenTypes.has(tl.signalType))
      .flatMap((tl) => [tl.sourceDeviceKey, tl.destinationDeviceKey])
  );

  // Tie lines (real or synthetic) that pass all active filters (used for port-level filtering)
  const visibleTieLines = allTieLines.filter(
    (tl) =>
      !hiddenTypes.has(tl.signalType) &&
      !hiddenDevices.has(tl.sourceDeviceKey) &&
      !hiddenDevices.has(tl.destinationDeviceKey)
  );
  const connectedPortKeys = hideUnconnectedPorts
    ? new Set<string>(
        visibleTieLines.flatMap((tl) => [
          `${tl.sourceDeviceKey}:${tl.sourcePortKey}`,
          `${tl.destinationDeviceKey}:${tl.destinationPortKey}`,
        ])
      )
    : null;

  const devices = data.devices.filter((d) => {
    if (hiddenDevices.has(d.key)) return false;
    if (hideUnconnected && !connectedKeys.has(d.key)) return false;
    return true;
  });

  // Filter each device's ports down to only those with active tie lines
  const effectiveDevices = devices.map((d) =>
    connectedPortKeys
      ? {
          ...d,
          inputPorts: (d.inputPorts ?? []).filter((p) =>
            connectedPortKeys.has(`${d.key}:${p.key}`)
          ),
          outputPorts: (d.outputPorts ?? []).filter((p) =>
            connectedPortKeys.has(`${d.key}:${p.key}`)
          ),
        }
      : d
  );

  const effectiveDeviceKeys = new Set(effectiveDevices.map((d) => d.key));
  // Collect one unique device-pair edge per source→destination (dagre only
  // needs connectivity, not multiplicity, for rank assignment). Only use
  // visible tie lines whose endpoints are present in the visible device set
  // so hidden devices cannot be implicitly added to the layout graph.
  const uniquePairs = [
    ...new Set(
      visibleTieLines
        .filter(
          (tl) =>
            effectiveDeviceKeys.has(tl.sourceDeviceKey) &&
            effectiveDeviceKeys.has(tl.destinationDeviceKey)
        )
        .map((tl) => `${tl.sourceDeviceKey}|${tl.destinationDeviceKey}`)
    ),
  ];

  // ── Pass 1: layout with all edges to detect cross-level (backwards) edges ──
  const g1 = makeGraph();
  for (const device of effectiveDevices) {
    g1.setNode(device.key, { width: NODE_WIDTH, height: nodeHeight(device) });
  }
  for (const pair of uniquePairs) {
    const [src, dst] = pair.split('|');
    g1.setEdge(src, dst);
  }
  dagre.layout(g1);

  // Any edge where the source's computed x is greater than the destination's x
  // (with a small tolerance) is a "backwards" cross-level edge that would pull
  // a midpoint node into a later column. Exclude these from the second pass.
  const backwardPairs = new Set<string>(
    uniquePairs.filter((pair) => {
      const [src, dst] = pair.split('|');
      const sx = g1.node(src)?.x ?? 0;
      const dx = g1.node(dst)?.x ?? 0;
      return sx > dx + 10;
    })
  );

  // ── Pass 2: layout without backwards edges → correct column alignment ──────
  const g = makeGraph();
  for (const device of effectiveDevices) {
    g.setNode(device.key, { width: NODE_WIDTH, height: nodeHeight(device) });
  }
  for (const pair of uniquePairs) {
    if (!backwardPairs.has(pair)) {
      const [src, dst] = pair.split('|');
      g.setEdge(src, dst);
    }
  }
  dagre.layout(g);

  // Map dagre positions → React Flow nodes
  const nodes: Node<RoutingDeviceNodeData>[] = effectiveDevices.map(
    (device) => {
      const pos = g.node(device.key);
      return {
        id: device.key,
        type: 'routingDevice',
        position: {
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - nodeHeight(device) / 2,
        },
        data: { device },
      };
    }
  );

  // Map tieLines (real + synthetic sink-route edges) → React Flow edges, filtering by hidden
  // signal types and hidden devices. All tie lines are rendered regardless of whether they were
  // excluded from the layout pass — backwards edges still appear as connections on the canvas.
  const edges: Edge[] = allTieLines
    .filter(
      (tl) =>
        !hiddenTypes.has(tl.signalType) &&
        !hiddenDevices.has(tl.sourceDeviceKey) &&
        !hiddenDevices.has(tl.destinationDeviceKey)
    )
    .map((tl, idx) => {
      const isLiveOnly = syntheticTieLineKeys.has(
        `${tl.sourceDeviceKey}|${tl.sourcePortKey}|${tl.destinationDeviceKey}|${tl.destinationPortKey}`
      );
      return {
        id: `tl-${idx}-${tl.sourceDeviceKey}-${tl.sourcePortKey}-${tl.destinationDeviceKey}-${tl.destinationPortKey}`,
        source: tl.sourceDeviceKey,
        sourceHandle: tl.sourcePortKey,
        target: tl.destinationDeviceKey,
        targetHandle: tl.destinationPortKey,
        style: {
          stroke: signalColor(tl.signalType),
          strokeWidth: 1.5,
          ...(isLiveOnly ? { strokeDasharray: '6 4' } : {}),
        },
        data: {
          signalColor: signalColor(tl.signalType),
          sourceDeviceKey: tl.sourceDeviceKey,
          sourcePortKey: tl.sourcePortKey,
          destinationDeviceKey: tl.destinationDeviceKey,
          destinationPortKey: tl.destinationPortKey,
          signalType: tl.signalType,
          isLiveOnly,
        },
        type: 'tieLine',
        animated: false,
      };
    });

  return { nodes, edges };
}

// ─── Signal path tracing ─────────────────────────────────────────────────────

/** A signal type's atoms, or null when it isn't reported (which matches anything). */
type SignalFlags = ReadonlySet<string> | null;

const flagsOf = (signalType: string | null | undefined): SignalFlags => {
  const flags = parseSignalFlags(signalType);
  return flags.size > 0 ? flags : null;
};

/** The atoms in both, treating null as "anything". */
const narrow = (a: SignalFlags, b: SignalFlags): SignalFlags =>
  a === null ? b : b === null ? a : new Set([...a].filter((atom) => b.has(atom)));

const isEmpty = (flags: SignalFlags) => flags !== null && flags.size === 0;

/**
 * Given a clicked edge, traces the full signal path from source to sink through midpoint devices
 * using midpointRoutes data. Returns a Set of edge IDs that form the continuous path.
 *
 * The trace follows only the clicked edge's signal: at each midpoint route and tie line the signal
 * narrows to what both carry, and a branch that carries none of it stops. So on a breakaway output
 * (Video from one input, Audio from another), tracing a Video edge doesn't pull in the Audio input.
 */
export function traceSignalPath(
  edges: Edge[],
  clickedEdgeId: string,
  midpointRoutes: Record<string, MidpointRoute[]>
): Set<string> {
  interface EdgeData {
    sourceDeviceKey?: string;
    sourcePortKey?: string;
    destinationDeviceKey?: string;
    destinationPortKey?: string;
    signalType?: string;
  }

  const result = new Set<string>();
  const clickedEdge = edges.find((e) => e.id === clickedEdgeId);
  if (!clickedEdge) return result;

  result.add(clickedEdgeId);

  const d = (e: Edge) => (e.data ?? {}) as EdgeData;

  // Build lookup maps. A port can carry multiple tie lines (fan-out from an
  // output, fan-in to an input), so each key maps to every matching edge.
  // "deviceKey:portKey" -> edges that ARRIVE at that input port
  const edgesByDestPort = new Map<string, Edge[]>();
  // "deviceKey:portKey" -> edges that LEAVE from that output port
  const edgesBySrcPort = new Map<string, Edge[]>();

  const addTo = (map: Map<string, Edge[]>, key: string, e: Edge) => {
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  };

  for (const e of edges) {
    const ed = d(e);
    addTo(edgesBySrcPort, `${ed.sourceDeviceKey}:${ed.sourcePortKey}`, e);
    addTo(edgesByDestPort, `${ed.destinationDeviceKey}:${ed.destinationPortKey}`, e);
  }

  // An edge is skipped once it has been reached carrying the same signal, so a narrower visit
  // can't stop a wider one from going further.
  const visited = new Set<string>();
  const firstVisit = (edge: Edge, flags: SignalFlags) => {
    const key = `${edge.id}|${flags === null ? '*' : [...flags].sort().join(',')}`;
    if (visited.has(key)) return false;
    visited.add(key);
    return true;
  };

  // Trace upstream from an output port, through the routes feeding it
  function traceUpstream(deviceKey: string | undefined, outputPortKey: string | undefined, flags: SignalFlags) {
    if (!deviceKey || !outputPortKey) return;
    const routes = midpointRoutes[deviceKey];
    if (!routes) return;
    for (const route of routes.filter((r) => r.outputPortKey === outputPortKey)) {
      const viaRoute = narrow(flags, flagsOf(route.signalType));
      if (isEmpty(viaRoute)) continue;
      for (const incomingEdge of edgesByDestPort.get(`${deviceKey}:${route.inputPortKey}`) ?? []) {
        const ed = d(incomingEdge);
        const viaEdge = narrow(viaRoute, flagsOf(ed.signalType));
        if (isEmpty(viaEdge) || !firstVisit(incomingEdge, viaEdge)) continue;
        result.add(incomingEdge.id);
        traceUpstream(ed.sourceDeviceKey, ed.sourcePortKey, viaEdge);
      }
    }
  }

  // Trace downstream from an input port, through the routes it feeds
  function traceDownstream(deviceKey: string | undefined, inputPortKey: string | undefined, flags: SignalFlags) {
    if (!deviceKey || !inputPortKey) return;
    const routes = midpointRoutes[deviceKey];
    if (!routes) return;
    for (const route of routes.filter((r) => r.inputPortKey === inputPortKey)) {
      const viaRoute = narrow(flags, flagsOf(route.signalType));
      if (isEmpty(viaRoute)) continue;
      for (const outgoingEdge of edgesBySrcPort.get(`${deviceKey}:${route.outputPortKey}`) ?? []) {
        const ed = d(outgoingEdge);
        const viaEdge = narrow(viaRoute, flagsOf(ed.signalType));
        if (isEmpty(viaEdge) || !firstVisit(outgoingEdge, viaEdge)) continue;
        result.add(outgoingEdge.id);
        traceDownstream(ed.destinationDeviceKey, ed.destinationPortKey, viaEdge);
      }
    }
  }

  // Start tracing in both directions from the clicked edge, carrying its signal
  const clickedData = d(clickedEdge);
  const clickedFlags = flagsOf(clickedData.signalType);
  traceUpstream(clickedData.sourceDeviceKey, clickedData.sourcePortKey, clickedFlags);
  traceDownstream(clickedData.destinationDeviceKey, clickedData.destinationPortKey, clickedFlags);

  return result;
}

