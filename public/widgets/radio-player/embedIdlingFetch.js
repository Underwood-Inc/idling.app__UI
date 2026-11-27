/**
 * Relative import target for the radio embed `tsc` bundle (no path aliases in emit).
 * Standalone embed uses plain `fetch`. The Next app registers OCE via `registerIdlingOce`.
 */
const noopReporter = {
    reportResponse: () => undefined,
    reportTransportFailure: () => undefined,
    reportIgnored: () => undefined,
};
let fetchImpl = (input, init) => globalThis.fetch(input, init);
let engineRef = null;
export function registerIdlingOce(nextFetch, engine) {
    fetchImpl = nextFetch;
    engineRef = engine ?? null;
}
export const idlingFetch = (input, init) => fetchImpl(input, init);
export function getIdlingOceEngine() {
    return engineRef ?? { reporter: noopReporter };
}
