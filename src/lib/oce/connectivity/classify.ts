import type { SettlementKind } from './types';

export function classifyFetchOutcome(value: unknown): SettlementKind {
  if (typeof Response !== 'undefined' && value instanceof Response) {
    return 'response';
  }
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name: string }).name;
    if (name === 'AbortError') {
      return 'ignored';
    }
    if (name === 'TimeoutError') {
      return 'transport-failure';
    }
  }
  return 'transport-failure';
}