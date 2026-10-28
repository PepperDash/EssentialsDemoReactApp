import { Handle, NodeProps, Position } from '@xyflow/react';

import { MidpointRoute, RoutingDevice, RoutingPort } from './routingTypes';
import { signalColor } from './signalColors';
import styles from './RoutingDeviceNode.module.scss';

// Adapted from the Dev Tools app's RoutingDeviceNode: Bootstrap classes replaced with this app's
// tech-page styles, taller rows for touch, and no hide/layout buttons (the demo has no multiview).

/**
 * A command was sent for this port but the processor has not confirmed it yet; "timedOut" means it
 * never did.
 */
export type PortStatus = 'pending' | 'timedOut';

export type RoutingDeviceNodeData = {
  device: RoutingDevice;
  currentRoutes?: MidpointRoute[];
  /** When a path is traced, the "inputPortKey:outputPortKey" pairs on this node that are part of it. null = no trace. */
  highlightedRouteKeys?: Set<string> | null;
  /** Opens the route popover for a port. */
  onPortClick?: (port: RoutingPort, kind: 'input' | 'output', rect: DOMRect) => void;
  /** Input ports are tappable on route destinations. */
  canEditInputs?: boolean;
  /** Output ports are tappable on midpoints. */
  canEditOutputs?: boolean;
  /** In-flight/timed-out route commands on this device, keyed by port key. */
  portStatus?: Readonly<Record<string, PortStatus>>;
  /** Port key whose popover is currently open, for the active outline. */
  editingPortKey?: string | null;
};

/** Multiview tile ports arrive qualified as "tile{N}:{portKey}" - see RoutingGraphHelpers. */
const TILE_PORT_RE = /^tile(\d+):/;

function portDisplayLabel(portKey: string): string {
  const match = TILE_PORT_RE.exec(portKey);
  return match ? `Tile ${match[1]}` : portKey;
}

interface PortCellProps {
  port?: RoutingPort;
  kind: 'input' | 'output';
  editable: boolean;
  status?: PortStatus;
  isEditing: boolean;
  onPortClick?: RoutingDeviceNodeData['onPortClick'];
}

const PortCell = ({ port, kind, editable, status, isEditing, onPortClick }: PortCellProps) => {
  const sideClass = kind === 'output' ? styles.portLabelWrapEnd : '';
  if (!port) return <div className={`${styles.portLabelWrap} ${sideClass}`} />;

  const label = portDisplayLabel(port.key);
  const indicator = status && (
    <span className={status === 'pending' ? styles.portPending : styles.portTimedOut}>
      {status === 'pending' ? '●' : '!'}
    </span>
  );

  return (
    <div className={`${styles.portLabelWrap} ${sideClass}`}>
      {editable && onPortClick ? (
        <button
          type="button"
          // nodrag/nopan keep React Flow from reading the press as a node drag or canvas pan;
          // stopPropagation keeps onNodeClick from also running its path trace.
          className={`nodrag nopan ${styles.portLabelText} ${styles.portButton} ${
            kind === 'output' ? styles.portButtonEnd : ''
          } ${isEditing ? styles.portButtonActive : ''}`}
          aria-haspopup="dialog"
          aria-expanded={isEditing}
          aria-label={`${label} (${port.signalType})`}
          onClick={(e) => {
            e.stopPropagation();
            onPortClick(port, kind, e.currentTarget.getBoundingClientRect());
          }}
        >
          {indicator}
          <span className={styles.truncate}>{label}</span>
        </button>
      ) : (
        <span className={`${styles.portLabelText} ${styles.portStatic}`}>
          {indicator}
          {label}
        </span>
      )}
    </div>
  );
};

const NODE_WIDTH_PX = 280;
const PORT_ROW_PX = 44;
const HEADER_PX = 52;

const RoutingDeviceNode = ({ data }: NodeProps) => {
  const {
    device,
    currentRoutes,
    highlightedRouteKeys,
    onPortClick,
    canEditInputs,
    canEditOutputs,
    portStatus,
    editingPortKey,
  } = data as RoutingDeviceNodeData;
  const inputPorts = device.inputPorts ?? [];
  const outputPorts = device.outputPorts ?? [];
  const portRows = Math.max(inputPorts.length, outputPorts.length, 1);
  const bodyHeight = portRows * PORT_ROW_PX;

  return (
    <div className={styles.nodeCard} style={{ width: NODE_WIDTH_PX, minHeight: HEADER_PX + bodyHeight }}>
      <div className={styles.nodeHeader} style={{ height: HEADER_PX }}>
        <div className={styles.truncate}>{device.name || device.key}</div>
        {device.name && device.name !== device.key && (
          <div className={`${styles.truncate} ${styles.nodeKeyLabel}`}>{device.key}</div>
        )}
      </div>

      <div className={styles.nodeBody} style={{ height: bodyHeight }}>
        {inputPorts.map((port, i) => (
          <Handle
            key={`in-${i}-${port.key}`}
            type="target"
            position={Position.Left}
            id={port.key}
            className={styles.handle}
            style={{ top: `${((i + 0.5) / portRows) * 100}%` }}
          />
        ))}

        {Array.from({ length: portRows }).map((_, i) => {
          const inPort = inputPorts[i];
          const outPort = outputPorts[i];
          return (
            <div key={`row-${i}`} className={styles.portRow} style={{ height: PORT_ROW_PX }}>
              {/* Handlers hang off each side's cell, not the row: a midpoint row carries an input
                  on the left and an output on the right, so a row-level tap is ambiguous. */}
              <PortCell
                port={inPort}
                kind="input"
                editable={Boolean(canEditInputs)}
                status={inPort ? portStatus?.[inPort.key] : undefined}
                isEditing={Boolean(inPort && editingPortKey === inPort.key)}
                onPortClick={onPortClick}
              />
              <PortCell
                port={outPort}
                kind="output"
                editable={Boolean(canEditOutputs)}
                status={outPort ? portStatus?.[outPort.key] : undefined}
                isEditing={Boolean(outPort && editingPortKey === outPort.key)}
                onPortClick={onPortClick}
              />
            </div>
          );
        })}

        {/* A midpoint's current routes, drawn as curves from input row to output row. */}
        {currentRoutes && currentRoutes.length > 0 && (
          <svg className={styles.internalRouteSvg} width="100%" height={bodyHeight}>
            {currentRoutes.map((route, idx) => {
              const inIdx = inputPorts.findIndex((p) => p.key === route.inputPortKey);
              const outIdx = outputPorts.findIndex((p) => p.key === route.outputPortKey);
              if (inIdx === -1 || outIdx === -1) return null;

              const inY = ((inIdx + 0.5) / portRows) * bodyHeight;
              const outY = ((outIdx + 0.5) / portRows) * bodyHeight;
              const routeKey = `${route.inputPortKey}:${route.outputPortKey}`;
              const isHighlighted = highlightedRouteKeys == null || highlightedRouteKeys.has(routeKey);

              const x1 = 24;
              const x2 = NODE_WIDTH_PX - 24;
              const cx1 = x1 + (x2 - x1) * 0.4;
              const cx2 = x2 - (x2 - x1) * 0.4;

              return (
                <path
                  key={`route-${idx}`}
                  d={`M ${x1} ${inY} C ${cx1} ${inY}, ${cx2} ${outY}, ${x2} ${outY}`}
                  stroke={isHighlighted ? signalColor(route.signalType) : 'var(--pd-border)'}
                  strokeWidth={isHighlighted && highlightedRouteKeys != null ? 4 : 3}
                  strokeOpacity={isHighlighted ? 0.8 : 0.25}
                  fill="none"
                />
              );
            })}
          </svg>
        )}

        {outputPorts.map((port, i) => (
          <Handle
            key={`out-${i}-${port.key}`}
            type="source"
            position={Position.Right}
            id={port.key}
            className={styles.handle}
            style={{ top: `${((i + 0.5) / portRows) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export { HEADER_PX, NODE_WIDTH_PX, PORT_ROW_PX };
export default RoutingDeviceNode;
