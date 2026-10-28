import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { RoutingPort } from './routingTypes';
import {
  clearMidpointOutputCommand,
  clearSinkCommand,
  midpointSwitchCommand,
  RoutingCommand,
  sinkRouteCommand,
} from './routingCommands';
import { CandidateSource } from './routeGraph';
import { signalColor } from './signalColors';
import {
  atomsOf,
  portSupportsSignalType,
  signalTypeOptionsForPort,
} from './signalTypes';
import styles from './RoutePopover.module.scss';

// Adapted from the Dev Tools app's RoutePopover: Bootstrap classes replaced with this app's
// tech-page styles, and touch-sized rows.

/** What the user clicked, and therefore which of the two routing flows this popover drives. */
export type RouteEditTarget =
  | {
      kind: 'sinkInput';
      deviceKey: string;
      deviceName: string;
      port: RoutingPort;
      /** Set when the port is a multiview tile ("tile{N}:..."), for a friendlier label. */
      tileNumber?: number;
    }
  | {
      kind: 'midpointOutput';
      deviceKey: string;
      deviceName: string;
      port: RoutingPort;
      /** All input ports on the same device - the midpoint flow never leaves the device. */
      inputPorts: RoutingPort[];
    };

export interface RoutePopoverCurrent {
  sourceDeviceKey?: string | null;
  inputPortKey?: string | null;
}

export interface RoutePopoverProps {
  target: RouteEditTarget;
  /** Viewport rect of the clicked port row; the popover anchors beside it. */
  anchorRect: DOMRect;
  /** What is routed to this port right now, for the check mark and the Clear affordance. */
  current?: RoutePopoverCurrent | null;
  /**
   * What is routed to this port right now for the selected signal type. Takes precedence over
   * `current`, so a breakaway output (Audio and Video from different inputs) marks the right row.
   */
  getCurrent?: (signalType: string) => RoutePopoverCurrent | null;
  /** Memoized candidate lookup. Only called for the sinkInput flow. */
  getCandidateSources: (signalType: string) => CandidateSource[];
  /** Explains an empty source list for the sinkInput flow - the two causes need different fixes. */
  describeEmptySources?: (signalType: string) => string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (command: RoutingCommand) => void;
  onClose: () => void;
}

const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 8;
/** Above the tech header and the graph's controls. */
const Z_INDEX = 1070;
/** Beyond this many options, offer a filter box. */
const FILTER_THRESHOLD = 12;

function tileLabel(target: RouteEditTarget): string {
  if (target.kind === 'sinkInput' && target.tileNumber !== undefined) {
    return `Tile ${target.tileNumber}`;
  }
  return target.port.key;
}

const RoutePopover = ({
  target,
  anchorRect,
  current,
  getCurrent,
  getCandidateSources,
  describeEmptySources,
  isSubmitting = false,
  errorMessage,
  onSubmit,
  onClose,
}: RoutePopoverProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const signalTypeOptions = useMemo(
    () => signalTypeOptionsForPort(target.port.signalType),
    [target.port.signalType]
  );
  // A single-atom port has nothing to choose, so step 1 collapses to a label.
  const [signalType, setSignalType] = useState(signalTypeOptions[0] ?? '');
  const [filter, setFilter] = useState('');

  // ── Positioning ──────────────────────────────────────────────────────────
  // anchorRect is already in viewport coordinates (the node is real DOM inside React Flow's
  // transformed container), so a fixed-position portal lands correctly at any zoom without
  // needing the flow transform. Input ports sit on a node's left edge and outputs on its right,
  // so preferring the right side and flipping on overflow reads naturally for both.
  const [position, setPosition] = useState<{ left: number; top: number }>({
    left: anchorRect.right + GAP_PX,
    top: anchorRect.top,
  });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const { width, height } = panel.getBoundingClientRect();

    let left = anchorRect.right + GAP_PX;
    if (left + width > window.innerWidth - VIEWPORT_MARGIN_PX) {
      left = anchorRect.left - width - GAP_PX;
    }
    left = Math.max(VIEWPORT_MARGIN_PX, left);

    const top = Math.max(
      VIEWPORT_MARGIN_PX,
      Math.min(anchorRect.top, window.innerHeight - height - VIEWPORT_MARGIN_PX)
    );

    setPosition({ left, top });
  }, [anchorRect, signalType, target.deviceKey, target.port.key]);

  // ── Dismissal ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as globalThis.Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Capture phase, so a click on another port row closes this one before opening that one.
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  // ── Options ──────────────────────────────────────────────────────────────
  const candidates = useMemo(
    () =>
      target.kind === 'sinkInput' && signalType
        ? getCandidateSources(signalType)
        : [],
    [target.kind, signalType, getCandidateSources]
  );

  const inputPortOptions = useMemo(
    () =>
      target.kind === 'midpointOutput' && signalType
        ? target.inputPorts.filter((p) =>
            portSupportsSignalType(p.signalType, signalType)
          )
        : [],
    [target, signalType]
  );

  // How many atoms the *selected* type asks for - not how many the port offers, which would
  // wrongly badge every candidate once the user narrows to a single breakaway type.
  const requestedAtomCount = useMemo(
    () => atomsOf(signalType).length,
    [signalType]
  );

  const rows: {
    key: string;
    label: string;
    sublabel?: string;
    badge?: string;
  }[] =
    target.kind === 'sinkInput'
      ? candidates.map((c) => ({
          key: c.deviceKey,
          label: c.name,
          sublabel: c.name === c.deviceKey ? undefined : c.deviceKey,
          // A partial match on an AudioVideo request - the processor still routes the half that
          // has a path, so offer it rather than hiding it, but say so.
          badge:
            c.matchedFlags.length < requestedAtomCount
              ? `${c.matchedFlags.join(' + ').toLowerCase()} only`
              : undefined,
        }))
      : inputPortOptions.map((p) => ({
          key: p.key,
          label: p.key,
          sublabel: p.signalType,
        }));

  const filtered =
    rows.length > FILTER_THRESHOLD && filter
      ? rows.filter((r) =>
          `${r.label} ${r.sublabel ?? ''}`
            .toLowerCase()
            .includes(filter.toLowerCase())
        )
      : rows;

  const currentForSignal = getCurrent ? getCurrent(signalType) : current;
  const currentKey =
    target.kind === 'sinkInput'
      ? currentForSignal?.sourceDeviceKey
      : currentForSignal?.inputPortKey;

  function handlePick(key: string | null): void {
    if (key === null) {
      onSubmit(
        target.kind === 'sinkInput'
          ? clearSinkCommand(target.deviceKey, target.port.key)
          : clearMidpointOutputCommand(
              target.deviceKey,
              target.port.key,
              signalType
            )
      );
      return;
    }
    onSubmit(
      target.kind === 'sinkInput'
        ? sinkRouteCommand(target.deviceKey, target.port.key, key, signalType)
        : midpointSwitchCommand(
            target.deviceKey,
            key,
            target.port.key,
            signalType
          )
    );
  }

  const emptyMessage =
    target.kind === 'sinkInput'
      ? (describeEmptySources?.(signalType) ??
        `No source has a path to this input for ${signalType}.`)
      : `No input on this device carries ${signalType}.`;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Route ${tileLabel(target)} on ${target.deviceName}`}
      className={styles.panel}
      style={{ left: position.left, top: position.top, zIndex: Z_INDEX }}
    >
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.grow}>
            <div className={`${styles.truncate} ${styles.deviceName}`}>{target.deviceName}</div>
            <div className={`${styles.truncate} ${styles.portLabel}`}>
              {target.kind === 'sinkInput' ? 'Input' : 'Output'} ·{' '}
              {tileLabel(target)}
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      </div>

      <div>
        {/* Step 1 - signal type */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Signal type</div>
          {signalTypeOptions.length <= 1 ? (
            <span
              className={styles.signalTypeStatic}
              style={{ backgroundColor: signalColor(signalType) }}
            >
              {signalType || 'Unknown'}
            </span>
          ) : (
            <div className={styles.signalTypeOptions}>
              {signalTypeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.signalTypeBtn} ${
                    option === signalType ? '' : styles.signalTypeBtnInactive
                  }`}
                  style={{ ['--signal-color' as string]: signalColor(option) }}
                  aria-pressed={option === signalType}
                  onClick={() => setSignalType(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2 - source device, or input port on the same midpoint */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>
            {target.kind === 'sinkInput' ? 'Source' : 'Route from input'}
          </div>
          {rows.length > FILTER_THRESHOLD && (
            <input
              type="text"
              className={styles.filterInput}
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter options"
            />
          )}
        </div>

        <div className={styles.optionScroller}>
          <button
            type="button"
            className={`${styles.option} ${styles.optionClear}`}
            disabled={isSubmitting}
            onClick={() => handlePick(null)}
          >
            None — clear route
          </button>

          {filtered.map((row) => {
            const isCurrent = row.key === currentKey;
            return (
              <button
                key={row.key}
                type="button"
                className={`${styles.option} ${isCurrent ? styles.optionCurrent : ''}`}
                disabled={isSubmitting}
                onClick={() => handlePick(row.key)}
              >
                <span className={styles.optionCheck} aria-hidden="true">
                  {isCurrent ? '✓' : ''}
                </span>
                <span className={styles.grow}>
                  <span className={`${styles.truncate} ${styles.optionLabel}`}>
                    {row.label}
                  </span>
                  {row.sublabel && (
                    <span className={`${styles.truncate} ${styles.optionSublabel}`}>
                      {row.sublabel}
                    </span>
                  )}
                </span>
                {row.badge && (
                  <span className={styles.optionBadge}>
                    {row.badge}
                  </span>
                )}
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className={styles.emptyMessage}>
              {filter ? 'No matches.' : emptyMessage}
            </div>
          )}
        </div>

        {isSubmitting && (
          <div className={styles.status} role="status">
            Sending…
          </div>
        )}

        {errorMessage && (
          <div className={`${styles.status} ${styles.error}`} role="alert">
            {errorMessage}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default RoutePopover;
