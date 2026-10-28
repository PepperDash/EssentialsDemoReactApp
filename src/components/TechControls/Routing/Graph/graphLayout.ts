// Graph layout and path tracing, copied from the Dev Tools app's Routing.tsx (buildGraph,
// traceSignalPath, tileNumberOf). Pure functions: data in, React Flow nodes and edges out.
import { Edge, Node } from '@xyflow/react';
import dagre from 'dagre';

import { HEADER_PX, NODE_WIDTH_PX, PORT_ROW_PX, RoutingDeviceNodeData } from './RoutingDeviceNode';
import { MidpointRoute, RoutingDevice, RoutingDevicesAndTieLines, SinkRoute, TieLine } from './routingTypes';
import { signalColor } from './signalColors';

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

/**
 * Given a clicked edge, traces the full signal path from source to sink through
 * midpoint devices using midpointRoutes data.  Returns a Set of edge IDs that
 * form the continuous path.
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
  }

  const result = new Set<string>();
  const clickedEdge = edges.find((e) => e.id === clickedEdgeId);
  if (!clickedEdge) return result;

  result.add(clickedEdgeId);

  const d = (e: Edge) => (e.data ?? {}) as EdgeData;

  // Build lookup maps. A port can carry multiple tie lines (fan-out from an
  // output, fan-in to an input), so each key maps to every matching edge.
  // "deviceKey:portKey" → edges that ARRIVE at that input port
  const edgesByDestPort = new Map<string, Edge[]>();
  // "deviceKey:portKey" → edges that LEAVE from that output port
  const edgesBySrcPort = new Map<string, Edge[]>();

  const addTo = (map: Map<string, Edge[]>, key: string, e: Edge) => {
    const list = map.get(key);
    if (list) list.push(e);
    else map.set(key, [e]);
  };

  for (const e of edges) {
    const ed = d(e);
    addTo(edgesBySrcPort, `${ed.sourceDeviceKey}:${ed.sourcePortKey}`, e);
    addTo(
      edgesByDestPort,
      `${ed.destinationDeviceKey}:${ed.destinationPortKey}`,
      e
    );
  }

  // Trace upstream from the clicked edge's source
  function traceUpstream(
    deviceKey: string | undefined,
    outputPortKey: string | undefined
  ) {
    if (!deviceKey || !outputPortKey) return;
    const routes = midpointRoutes[deviceKey];
    if (!routes) return;
    // Find ALL input ports that feed this output port
    const matchingRoutes = routes.filter(
      (r) => r.outputPortKey === outputPortKey
    );
    for (const route of matchingRoutes) {
      for (const incomingEdge of edgesByDestPort.get(
        `${deviceKey}:${route.inputPortKey}`
      ) ?? []) {
        if (result.has(incomingEdge.id)) continue;
        result.add(incomingEdge.id);
        const ed = d(incomingEdge);
        traceUpstream(ed.sourceDeviceKey, ed.sourcePortKey);
      }
    }
  }

  // Trace downstream from the clicked edge's destination
  function traceDownstream(
    deviceKey: string | undefined,
    inputPortKey: string | undefined
  ) {
    if (!deviceKey || !inputPortKey) return;
    const routes = midpointRoutes[deviceKey];
    if (!routes) return;
    // Find ALL output ports that this input port feeds
    const matchingRoutes = routes.filter(
      (r) => r.inputPortKey === inputPortKey
    );
    for (const route of matchingRoutes) {
      for (const outgoingEdge of edgesBySrcPort.get(
        `${deviceKey}:${route.outputPortKey}`
      ) ?? []) {
        if (result.has(outgoingEdge.id)) continue;
        result.add(outgoingEdge.id);
        const ed = d(outgoingEdge);
        traceDownstream(ed.destinationDeviceKey, ed.destinationPortKey);
      }
    }
  }

  // Start tracing in both directions from the clicked edge
  const clickedData = d(clickedEdge);
  traceUpstream(clickedData.sourceDeviceKey, clickedData.sourcePortKey);
  traceDownstream(
    clickedData.destinationDeviceKey,
    clickedData.destinationPortKey
  );

  return result;
}

/** Multiview tile ports arrive qualified as "tile{N}:{portKey}". */
const TILE_PORT_RE = /^tile(\d+):/;

export function tileNumberOf(portKey: string): number | undefined {
  const match = TILE_PORT_RE.exec(portKey);
  return match ? Number(match[1]) : undefined;
}
