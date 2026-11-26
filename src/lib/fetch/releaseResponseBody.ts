/**
 * Drain a fetch response body instead of ReadableStream.cancel().
 * Node's fetch (undici) can throw `transformAlgorithm is not a function` on cancel().
 */
export async function releaseResponseBody(response: Response): Promise<void> {
  if (!response.body) {
    return;
  }

  try {
    await response.arrayBuffer();
  } catch {
    // Body already consumed, aborted, or connection closed — safe to ignore.
  }
}