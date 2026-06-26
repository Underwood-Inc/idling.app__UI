import type { RadioPlayerHandle } from './radioPlayer.types';

export interface WaitForRadioAnalyserOptions {
  handle: RadioPlayerHandle;
  maxAttempts?: number;
  intervalMs?: number;
}

/**
 * Mobile browsers often resolve `play()` before the analyser graph is wired.
 * Poll briefly instead of treating the first miss as a permanent failure.
 */
export async function waitForRadioAnalyser(
  options: WaitForRadioAnalyserOptions
): Promise<AnalyserNode | null> {
  const maxAttempts = options.maxAttempts ?? 32;
  const intervalMs = options.intervalMs ?? 125;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await options.handle.play();
    const analyser = options.handle.getAnalyser();
    if (analyser) {
      return analyser;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, intervalMs);
      });
    }
  }

  return null;
}
