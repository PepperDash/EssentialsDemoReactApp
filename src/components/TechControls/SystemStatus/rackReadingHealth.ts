import type { HealthStatus } from './HealthIcon';

/**
 * Health bands for the rack temperature/humidity readings. The framework's sensor messengers
 * report only a raw reading, no health status of their own (unlike `ICommunicationMonitor`), so
 * the design's health icon next to each reading has to be derived client-side from the real value
 * against a reasonable target range - not fabricated, but not framework-sourced either.
 */
export function temperatureHealthStatus(fahrenheit: number): HealthStatus {
  if (fahrenheit < 50 || fahrenheit > 95) return 'InError';
  if (fahrenheit < 60 || fahrenheit > 85) return 'InWarning';
  return 'IsOk';
}

export function humidityHealthStatus(percent: number): HealthStatus {
  if (percent < 5 || percent > 75) return 'InError';
  if (percent < 30 || percent > 60) return 'InWarning';
  return 'IsOk';
}
