/** Multiview tile ports arrive qualified as "tile{N}:{portKey}" - see RoutingGraphHelpers. */
const TILE_PORT_RE = /^tile(\d+):/;

/** The tile number of a multiview tile port, or undefined for an ordinary port. */
export function tileNumberOf(portKey: string): number | undefined {
  const match = TILE_PORT_RE.exec(portKey);
  return match ? Number(match[1]) : undefined;
}
