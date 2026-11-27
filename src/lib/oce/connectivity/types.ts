/**
 * Offline Connectivity Engine (OCE) — shared types (vendored from @strixun/api-framework connectivity).
 */

export type SettlementKind = 'response' | 'transport-failure' | 'ignored';

export type OceProbeDeadlinePreset = 'Snappy' | 'Interactive' | 'Steady' | 'Background';

export const OceProbeDeadline: Record<OceProbeDeadlinePreset, number> = {
  Snappy: 1000,
  Interactive: 5000,
  Steady: 10000,
  Background: 30000,
};

export const OCE_PROBE_DEADLINE_PRESETS: readonly OceProbeDeadlinePreset[] = [
  'Snappy',
  'Interactive',
  'Steady',
  'Background',
] as const;

export interface ConnectivitySnapshot {
  unavailable: boolean;
  streak: number;
  failureThreshold: number;
  generation: number;
  healthContractFailed?: boolean;
}

export interface ConnectivityEngineConfig {
  failureThreshold?: number;
  healthCheckUrl: string;
  probeDeadline?: OceProbeDeadlinePreset;
  interpretHealthResponse?: (response: Response) => boolean;
  baseFetch?: FetchLike;
}

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export interface SettlementToken {
  generation: number;
}

export interface ConnectivityReporter {
  reportResponse(): void;
  reportTransportFailure(): void;
  reportIgnored(): void;
}

export interface ConnectivityEngine {
  getSnapshot(): ConnectivitySnapshot;
  subscribe(listener: () => void): () => void;
  attachFetch(baseFetch: FetchLike): FetchLike;
  onStart(_input?: RequestInfo | URL): SettlementToken;
  onSettled(token: SettlementToken, kind: SettlementKind): void;
  reporter: ConnectivityReporter;
  _resetForTests?(): void;
}

export const SERVER_OCE_SNAPSHOT: ConnectivitySnapshot = {
  unavailable: false,
  streak: 0,
  failureThreshold: 2,
  generation: 0,
};