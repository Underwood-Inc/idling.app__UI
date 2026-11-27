/**
 * Relative import target for the radio embed `tsc` bundle (no path aliases in emit).
 * Standalone embed uses plain `fetch`. The Next app registers OCE via `registerIdlingOce`.
 */

type OceReporter = {
  reportResponse(): void;
  reportTransportFailure(): void;
  reportIgnored(): void;
};

type EngineLike = { reporter: OceReporter };

const noopReporter: OceReporter = {
  reportResponse: () => undefined,
  reportTransportFailure: () => undefined,
  reportIgnored: () => undefined,
};

let fetchImpl: typeof fetch = (input, init) => globalThis.fetch(input, init);
let engineRef: EngineLike | null = null;

export function registerIdlingOce(nextFetch: typeof fetch, engine?: EngineLike): void {
  fetchImpl = nextFetch;
  engineRef = engine ?? null;
}

export const idlingFetch: typeof fetch = (input, init) => fetchImpl(input, init);

export function getIdlingOceEngine(): EngineLike {
  return engineRef ?? { reporter: noopReporter };
}