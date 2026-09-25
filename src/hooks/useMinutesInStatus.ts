import { useEffect, useRef, useState } from 'react';

const TICK_MS = 30000;

/**
 * Minutes since `status` last became `InWarning`/`InError`, ticking live while it stays that way
 * and resetting once it recovers.
 *
 * The framework's `ICommunicationMonitorMessenger` reports only the current status, not when it
 * changed (see `CommunicationMonitorProps` - no timestamp field), so "no response for N minutes"
 * can only be measured from when this client first observed the bad status, not from the real
 * moment the device actually went offline (which may predate this page ever loading). That's an
 * honest, if imperfect, number - not a fabricated one.
 */
export function useMinutesInStatus(status: HealthStatusLike | undefined): number {
  const sinceRef = useRef<number | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    if (status === 'InWarning' || status === 'InError') {
      if (sinceRef.current === null) sinceRef.current = Date.now();
    } else {
      sinceRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    const interval = window.setInterval(() => tick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(interval);
  }, []);

  if (sinceRef.current === null) return 0;

  return Math.max(0, Math.floor((Date.now() - sinceRef.current) / 60000));
}

type HealthStatusLike = 'StatusUnknown' | 'IsOk' | 'InWarning' | 'InError';
