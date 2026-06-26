import { describe, expect, test, vi } from 'vitest';
import { waitForRadioAnalyser } from './waitForRadioAnalyser';
import type { RadioPlayerHandle } from './radioPlayer.types';

function createMockHandle(playImpl: () => Promise<void>, analyserSequence: Array<AnalyserNode | null>) {
  let callIndex = 0;

  return {
    play: vi.fn(async () => {
      await playImpl();
    }),
    getAnalyser: vi.fn(() => {
      const next = analyserSequence[Math.min(callIndex, analyserSequence.length - 1)] ?? null;
      callIndex += 1;
      return next;
    }),
  } as unknown as RadioPlayerHandle;
}

describe('waitForRadioAnalyser', () => {
  test('returns the analyser once play() has wired the audio graph', async () => {
    const analyser = { fftSize: 2048 } as AnalyserNode;
    const handle = createMockHandle(async () => undefined, [null, null, analyser]);

    const result = await waitForRadioAnalyser({
      handle,
      maxAttempts: 4,
      intervalMs: 1,
    });

    expect(result).toBe(analyser);
    expect(handle.play).toHaveBeenCalled();
  });

  test('returns null after exhausting retry attempts', async () => {
    const handle = createMockHandle(async () => undefined, [null]);

    const result = await waitForRadioAnalyser({
      handle,
      maxAttempts: 3,
      intervalMs: 1,
    });

    expect(result).toBeNull();
    expect(handle.play).toHaveBeenCalledTimes(3);
  });
});
