/** Enough to satisfy undici without downloading multi-megabyte streams. */
const MAX_DRAIN_BYTES = 32 * 1024;

/**
 * Drain a fetch response body instead of ReadableStream.cancel().
 * Node's fetch (undici) can throw `transformAlgorithm is not a function` on cancel().
 * Do not use response.arrayBuffer() here — some stations ignore Range and would
 * pull the full stream during catalog probes.
 */
export async function releaseResponseBody(response: Response): Promise<void> {
  if (!response.body || response.bodyUsed) {
    return;
  }

  const reader = response.body.getReader();
  let drained = 0;

  try {
    while (drained < MAX_DRAIN_BYTES) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      drained += value.byteLength;
    }
  } catch {
    // Body already consumed, aborted, or connection closed — safe to ignore.
  } finally {
    try {
      await reader.cancel();
    } catch {
      // Some runtimes reject cancel after partial drain; connection teardown is enough.
    }
  }
}