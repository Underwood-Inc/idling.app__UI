/**
 * Relative import target for the radio embed `tsc` bundle (no path aliases in emit).
 * Standalone embed uses plain `fetch`. The Next app registers OCE via `IdlingOceEmbedRegistry`.
 */
class NoopOceConnectivityReporter {
    reportResponse() {
        return undefined;
    }
    reportTransportFailure() {
        return undefined;
    }
    reportIgnored() {
        return undefined;
    }
}
/** Radio embed bridge — host registers the page `OceFetchClient` transport. */
export class IdlingOceEmbedRegistry {
    static register(nextFetch, engine) {
        IdlingOceEmbedRegistry.fetchImpl = nextFetch;
        IdlingOceEmbedRegistry.engineRef = engine ?? null;
    }
    static fetch(input, init) {
        return IdlingOceEmbedRegistry.fetchImpl(input, init);
    }
    static engine() {
        return (IdlingOceEmbedRegistry.engineRef ?? {
            reporter: new NoopOceConnectivityReporter(),
        });
    }
}
IdlingOceEmbedRegistry.fetchImpl = (input, init) => globalThis.fetch(input, init);
IdlingOceEmbedRegistry.engineRef = null;
