/**
 * Relative import target for the radio embed `tsc` bundle (no path aliases in emit).
 * Standalone embed uses plain `fetch`. The Next app registers OCE via `IdlingOceEmbedRegistry`.
 */

type OceReporter = {
  reportResponse(): void;
  reportTransportFailure(): void;
  reportIgnored(): void;
};

type EngineLike = {
  reporter: OceReporter;
  bindHtmlMediaElement?(
    element: Pick<
      HTMLMediaElement,
      'addEventListener' | 'removeEventListener' | 'src' | 'load'
    >
  ): () => void;
};

class NoopOceConnectivityReporter implements OceReporter {
  reportResponse(): void {
    return undefined;
  }
  reportTransportFailure(): void {
    return undefined;
  }
  reportIgnored(): void {
    return undefined;
  }
}

/**
 * Radio embed bridge — host calls {@link IdlingOceEmbedRegistry.register} from `OCE.ts`.
 * Standalone bundle uses `globalThis.fetch` until registration.
 */
export class IdlingOceEmbedRegistry {
  private static fetchImpl: typeof fetch = (input, init) =>
    globalThis.fetch(input, init);
  private static engineRef: EngineLike | null = null;

  /**
   * @param nextFetch - Observed `OCE.fetch` from the host page.
   * @param engine - Optional engine for reporter access in embed code.
   */
  static register(nextFetch: typeof fetch, engine?: EngineLike): void {
    IdlingOceEmbedRegistry.fetchImpl = nextFetch;
    IdlingOceEmbedRegistry.engineRef = engine ?? null;
  }

  /** Embed HTTP entry — delegates to registered host fetch when present. */
  static fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return IdlingOceEmbedRegistry.fetchImpl(input, init);
  }

  static engine(): EngineLike {
    return (
      IdlingOceEmbedRegistry.engineRef ?? {
        reporter: new NoopOceConnectivityReporter(),
      }
    );
  }
}