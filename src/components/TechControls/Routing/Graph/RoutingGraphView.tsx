import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import TechToggleButton from '../../shared/TechToggleButton';
import { resolveCurrentSource } from './currentSource';
import { buildGraph, tileNumberOf, traceSignalPath } from './graphLayout';
import {
  agePendingRoutes,
  isExpectationMet,
  pendingFromCommand,
  pendingId,
  PendingRoute,
} from './pendingRoutes';
import { buildRouteIndex, describeNoCandidates, isMidpoint, isRouteDestination } from './routeGraph';
import RoutePopover, { RouteEditTarget } from './RoutePopover';
import { describeRoutingError, RoutingCommand } from './routingCommands';
import RoutingDeviceNode, { PortStatus, RoutingDeviceNodeData } from './RoutingDeviceNode';
import classes from './RoutingGraphView.module.scss';
import { MidpointRoute, RoutingPort, SinkRoute } from './routingTypes';
import { FALLBACK_COLOR } from './signalColors';
import { atomsOf, flagsContainAll, parseSignalFlags } from './signalTypes';
import TieLineEdge from './TieLineEdge';
import useRouteCandidates from './useRouteCandidates';
import { useRoutingGraph } from './useRoutingGraph';

const nodeTypes: NodeTypes = { routingDevice: RoutingDeviceNode };
const edgeTypes: EdgeTypes = { tieLine: TieLineEdge };

const EMPTY_PORT_STATUS: Readonly<Record<string, PortStatus>> = Object.freeze({});
const NO_FILTER = new Set<string>();

/**
 * Tech Routing page's Graph mode: every routing device and tie line in the system, with live
 * routes, the same way the Dev Tools app's Routing view shows them. Tap a destination's input or a
 * midpoint's output to route it; tap a device to trace the signal paths through it.
 *
 * A trimmed port of the Dev Tools Routing page. Its data comes from Essentials'
 * RoutingGraphMessenger over Mobile Control (see useRoutingGraph) instead of the web API, and it
 * leaves out Dev Tools' multiview panels, device list and signal type filters.
 */
export const RoutingGraphView = () => {
  const { devices, tieLines, midpointRoutes, sinkRoutes, loaded, unsupported, sendCommand } = useRoutingGraph();

  const [hideUnconnected, setHideUnconnected] = useState(true);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());

  const [routeEdit, setRouteEdit] = useState<{ target: RouteEditTarget; anchorRect: DOMRect } | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  // Commands sent but not yet confirmed by the processor, keyed by device+port.
  const [pendingByPort, setPendingByPort] = useState<Record<string, PendingRoute>>({});

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  const graphData = useMemo(() => ({ devices, tieLines }), [devices, tieLines]);

  // Keep a ref to current edges for path tracing without triggering re-renders.
  const edgesRef = useRef<Edge[]>([]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Read in the layout effect without re-running dagre on every route change.
  const midpointRoutesRef = useRef(midpointRoutes);
  useEffect(() => {
    midpointRoutesRef.current = midpointRoutes;
  }, [midpointRoutes]);

  // ── Route editing ──────────────────────────────────────────────────────────

  // Candidate-source lookups run against the full tie-line graph: hiding unconnected devices
  // changes the view, never what is physically routable.
  const routeIndex = useMemo(() => (loaded ? buildRouteIndex(graphData) : null), [loaded, graphData]);
  const getCandidates = useRouteCandidates(routeIndex);

  // Read the latest devices from a ref inside the tap handler, so it stays referentially stable
  // and the layout effect (which injects it into node data) does not re-run.
  const devicesRef = useRef(devices);
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  const closeRoutePopover = useCallback(() => {
    setRouteEdit(null);
    setCommandError(null);
  }, []);

  const handlePortClick = useCallback(
    (deviceKey: string, port: RoutingPort, kind: 'input' | 'output', rect: DOMRect) => {
      const device = devicesRef.current.find((d) => d.key === deviceKey);
      if (!device) return;

      const deviceName = device.name || device.key;
      const target: RouteEditTarget =
        kind === 'input'
          ? { kind: 'sinkInput', deviceKey, deviceName, port, tileNumber: tileNumberOf(port.key) }
          : { kind: 'midpointOutput', deviceKey, deviceName, port, inputPorts: device.inputPorts ?? [] };

      setCommandError(null);
      setRouteEdit({ target, anchorRect: rect });
    },
    []
  );

  const handleSubmitRouteCommand = useCallback(
    async (command: RoutingCommand) => {
      setIsSending(true);
      const result = await sendCommand(command);
      setIsSending(false);

      if (!result || result.statusCode >= 400) {
        // Keep the popover open so the tech can pick something else.
        setCommandError(describeRoutingError(result));
        return;
      }

      // A sinkRoute/clearSink is only *accepted*; the result shows up in the routes the processor
      // sends next. Mark the port pending until it does.
      const pending = pendingFromCommand(command, Date.now());
      if (pending) {
        setPendingByPort((prev) => ({ ...prev, [pendingId(pending.deviceKey, pending.portKey)]: pending }));
      }

      setRouteEdit(null);
      setCommandError(null);
    },
    [sendCommand]
  );

  // Clear pending markers once the routes show what was asked for. pendingByPort is a dependency
  // so a new marker is checked straight away (the feedback can arrive before the reply, and
  // re-picking the current source sends no feedback at all); the updater returns prev when nothing
  // resolved, so this doesn't loop.
  useEffect(() => {
    setPendingByPort((prev) => {
      const entries = Object.entries(prev);
      if (entries.length === 0) return prev;

      const next: Record<string, PendingRoute> = {};
      let changed = false;
      for (const [id, pending] of entries) {
        if (isExpectationMet(sinkRoutes, midpointRoutes, pending)) changed = true;
        else next[id] = pending;
      }
      return changed ? next : prev;
    });
  }, [sinkRoutes, midpointRoutes, pendingByPort]);

  // Flag anything the processor never confirmed, then drop it. Only runs while something is pending.
  const hasPending = Object.keys(pendingByPort).length > 0;
  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => setPendingByPort((prev) => agePendingRoutes(prev, Date.now())), 1000);
    return () => clearInterval(interval);
  }, [hasPending]);

  const portStatusByDevice = useMemo(() => {
    const map = new Map<string, Record<string, PortStatus>>();
    for (const pending of Object.values(pendingByPort)) {
      const forDevice = map.get(pending.deviceKey) ?? {};
      forDevice[pending.portKey] = pending.timedOut ? 'timedOut' : 'pending';
      map.set(pending.deviceKey, forDevice);
    }
    return map;
  }, [pendingByPort]);

  // What is routed to the open popover's port, per signal type, for its check mark.
  const getRouteEditCurrent = useCallback(
    (signalType: string) => {
      if (!routeEdit) return null;
      const { target } = routeEdit;

      if (target.kind === 'midpointOutput') {
        // Every atom of the selected type must come from the same input for it to be "current".
        const inputs = atomsOf(signalType).map(
          (atom) =>
            midpointRoutes[target.deviceKey]?.find(
              (r: MidpointRoute) =>
                r.outputPortKey === target.port.key &&
                (!r.signalType || flagsContainAll(parseSignalFlags(r.signalType), new Set([atom])))
            )?.inputPortKey ?? null
        );
        const agreed = inputs.every((key) => key === inputs[0]);
        return { inputPortKey: agreed ? (inputs[0] ?? null) : null };
      }

      // Trace the live midpoint state first: the sink's own current-source bookkeeping isn't
      // updated when a midpoint is switched directly.
      const traced = routeIndex
        ? resolveCurrentSource(routeIndex, midpointRoutes, target.deviceKey, target.port.key, signalType)
        : ({ status: 'unknown' } as const);

      if (traced.status === 'resolved') return { sourceDeviceKey: traced.sourceDeviceKey };
      if (traced.status === 'cleared' || traced.status === 'split') return { sourceDeviceKey: null };

      const route = sinkRoutes[target.deviceKey]?.find(
        (r: SinkRoute) =>
          r.inputPortKey === target.port.key &&
          (!r.signalType || flagsContainAll(parseSignalFlags(r.signalType), parseSignalFlags(signalType)))
      );
      return { sourceDeviceKey: route?.sourceDeviceKey ?? null };
    },
    [routeEdit, sinkRoutes, midpointRoutes, routeIndex]
  );

  const getCandidatesForOpenPopover = useCallback(
    (signalType: string) =>
      routeEdit ? getCandidates(routeEdit.target.deviceKey, routeEdit.target.port.key, signalType) : [],
    [routeEdit, getCandidates]
  );

  const describeEmptySources = useCallback(
    (signalType: string) =>
      routeIndex && routeEdit
        ? describeNoCandidates(routeIndex, routeEdit.target.deviceKey, routeEdit.target.port.key, signalType)
        : '',
    [routeIndex, routeEdit]
  );

  // ── Graph ──────────────────────────────────────────────────────────────────

  // Re-run dagre only when the graph or the filter changes. React Flow owns the node array between
  // renders, so dragged positions survive route changes.
  useEffect(() => {
    if (!loaded) return;
    const { nodes: layoutNodes, edges: layoutEdges } = buildGraph(
      graphData,
      NO_FILTER,
      hideUnconnected,
      NO_FILTER,
      false,
      sinkRoutes
    );
    setNodes(
      layoutNodes.map((n) => {
        const device = (n.data as RoutingDeviceNodeData).device;
        return {
          ...n,
          data: {
            ...n.data,
            currentRoutes: midpointRoutesRef.current[n.id],
            onPortClick: (port: RoutingPort, kind: 'input' | 'output', rect: DOMRect) =>
              handlePortClick(n.id, port, kind, rect),
            canEditInputs: isRouteDestination(device),
            canEditOutputs: isMidpoint(device),
          },
        };
      })
    );
    setEdges(layoutEdges);
    setSelectedEdgeIds(new Set());
  }, [loaded, graphData, hideUnconnected, sinkRoutes, handlePortClick, setNodes, setEdges]);

  // Keep each node's routes and port status current without re-running dagre.
  useEffect(() => {
    const editingDeviceKey = routeEdit?.target.deviceKey ?? null;
    const editingPortKey = routeEdit?.target.port.key ?? null;

    setNodes((nds) =>
      nds.map((n) => {
        const portStatus = portStatusByDevice.get(n.id) ?? EMPTY_PORT_STATUS;
        const nodeEditingPortKey = n.id === editingDeviceKey ? editingPortKey : null;
        const prev = n.data as RoutingDeviceNodeData;

        // Returning the same object keeps React Flow from re-rendering unaffected nodes.
        if (
          prev.portStatus === portStatus &&
          (prev.editingPortKey ?? null) === nodeEditingPortKey &&
          prev.currentRoutes === midpointRoutes[n.id]
        ) {
          return n;
        }

        return {
          ...n,
          data: { ...n.data, currentRoutes: midpointRoutes[n.id], portStatus, editingPortKey: nodeEditingPortKey },
        };
      })
    );
  }, [midpointRoutes, portStatusByDevice, routeEdit, setNodes]);

  // Restyle edges and highlight midpoint routes on the traced path.
  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => {
        const baseColor = (e.data as { signalColor?: string } | undefined)?.signalColor ?? FALLBACK_COLOR;
        const isLiveOnly = Boolean((e.data as { isLiveOnly?: boolean } | undefined)?.isLiveOnly);
        const dash = isLiveOnly ? { strokeDasharray: '6 4' } : {};
        if (selectedEdgeIds.size === 0) {
          return { ...e, data: { ...e.data, selected: false }, style: { stroke: baseColor, strokeWidth: 2, ...dash } };
        }
        const isSelected = selectedEdgeIds.has(e.id);
        return {
          ...e,
          data: { ...e.data, selected: isSelected },
          style: {
            stroke: isSelected ? baseColor : 'var(--pd-border)',
            strokeWidth: isSelected ? 4 : 2,
            opacity: isSelected ? 1 : 0.35,
            ...dash,
          },
        };
      })
    );

    if (selectedEdgeIds.size === 0) {
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, highlightedRouteKeys: null } })));
      return;
    }

    const selectedDestPorts = new Set<string>();
    const selectedSrcPorts = new Set<string>();
    for (const e of edgesRef.current) {
      if (!selectedEdgeIds.has(e.id)) continue;
      const ed = e.data as
        | { sourceDeviceKey?: string; sourcePortKey?: string; destinationDeviceKey?: string; destinationPortKey?: string }
        | undefined;
      if (ed?.destinationDeviceKey && ed.destinationPortKey)
        selectedDestPorts.add(`${ed.destinationDeviceKey}:${ed.destinationPortKey}`);
      if (ed?.sourceDeviceKey && ed.sourcePortKey) selectedSrcPorts.add(`${ed.sourceDeviceKey}:${ed.sourcePortKey}`);
    }

    setNodes((nds) =>
      nds.map((n) => {
        const highlighted = new Set<string>();
        for (const r of midpointRoutes[n.id] ?? []) {
          if (selectedDestPorts.has(`${n.id}:${r.inputPortKey}`) && selectedSrcPorts.has(`${n.id}:${r.outputPortKey}`))
            highlighted.add(`${r.inputPortKey}:${r.outputPortKey}`);
        }
        return { ...n, data: { ...n.data, highlightedRouteKeys: highlighted } };
      })
    );
  }, [selectedEdgeIds, setEdges, setNodes, midpointRoutes]);

  // Tap a device: trace every signal path through it. Tap it again to clear.
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const currentEdges = edgesRef.current;
      const allPathEdges = new Set<string>();
      for (const e of currentEdges) {
        const ed = e.data as { sourceDeviceKey?: string; destinationDeviceKey?: string } | undefined;
        if (ed?.sourceDeviceKey === node.id || ed?.destinationDeviceKey === node.id) {
          for (const id of traceSignalPath(currentEdges, e.id, midpointRoutes)) allPathEdges.add(id);
        }
      }

      setSelectedEdgeIds((prev) => {
        const same = prev.size > 0 && prev.size === allPathEdges.size && [...prev].every((id) => allPathEdges.has(id));
        return same ? new Set() : allPathEdges;
      });
    },
    [midpointRoutes]
  );

  // Tap a tie line: trace the path it's on.
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const path = traceSignalPath(edgesRef.current, edge.id, midpointRoutes);
      setSelectedEdgeIds((prev) => (prev.has(edge.id) ? new Set() : path));
    },
    [midpointRoutes]
  );

  const onPaneClick = useCallback(() => setSelectedEdgeIds(new Set()), []);

  if (!loaded) {
    return (
      <div className={classes.message}>
        {unsupported
          ? "This processor's Essentials version doesn't provide the routing graph. Use Matrix mode instead."
          : 'Loading the routing graph…'}
      </div>
    );
  }

  return (
    <div className={classes.graphView}>
      <div className={classes.toolbar}>
        <TechToggleButton active={hideUnconnected} onClick={() => setHideUnconnected((v) => !v)}>
          Hide unconnected
        </TechToggleButton>
      </div>

      <div className={classes.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          // The popover is anchored to a screen position, so it can't follow a pan, zoom or drag.
          onMoveStart={closeRoutePopover}
          onNodeDragStart={closeRoutePopover}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesConnectable={false}
          elementsSelectable={false}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {routeEdit && (
        <RoutePopover
          target={routeEdit.target}
          anchorRect={routeEdit.anchorRect}
          getCurrent={getRouteEditCurrent}
          getCandidateSources={getCandidatesForOpenPopover}
          describeEmptySources={describeEmptySources}
          isSubmitting={isSending}
          errorMessage={commandError}
          onSubmit={handleSubmitRouteCommand}
          onClose={closeRoutePopover}
        />
      )}
    </div>
  );
};

export default RoutingGraphView;
