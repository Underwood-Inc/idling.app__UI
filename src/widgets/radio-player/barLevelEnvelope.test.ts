import { describe, expect, test } from 'vitest';
import { createBarLevelEnvelope } from './barLevelEnvelope';

describe('createBarLevelEnvelope', () => {
  test('when level rises, attack reaches target faster than release returns to rest', () => {
    const envelope = createBarLevelEnvelope(1, {
      attackSeconds: 0.05,
      releaseSeconds: 0.48,
    });
    const frameSeconds = 1 / 60;

    for (let frame = 0; frame < 8; frame += 1) {
      envelope.smooth(new Float32Array([1]), frameSeconds);
    }
    const peak = envelope.levels[0];
    expect(peak).toBeGreaterThan(0.7);

    envelope.smooth(new Float32Array([0]), frameSeconds);
    expect(envelope.levels[0]).toBeGreaterThan(peak * 0.85);
    expect(envelope.levels[0]).toBeLessThan(peak);
  });

  test('when reset, displayed levels return to zero', () => {
    const envelope = createBarLevelEnvelope(3);
    envelope.smooth(new Float32Array([0.8, 0.5, 0.2]), 1 / 60);
    envelope.reset();
    expect(Array.from(envelope.levels)).toEqual([0, 0, 0]);
  });
});
