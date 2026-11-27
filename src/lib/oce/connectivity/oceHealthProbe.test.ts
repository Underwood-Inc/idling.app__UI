import { describe, expect, test, vi } from 'vitest';
import { interpretOceHealthResponse } from './oceHealthProbe';

describe('interpretOceHealthResponse', () => {
  test('rejects when navigator.onLine is false even if response ok', () => {
    vi.stubGlobal('navigator', { onLine: false });

    expect(interpretOceHealthResponse(new Response('ok', { status: 200 }))).toBe(
      false
    );

    vi.unstubAllGlobals();
  });

  test('accepts ok response when navigator.onLine is true', () => {
    vi.stubGlobal('navigator', { onLine: true });

    expect(interpretOceHealthResponse(new Response('ok', { status: 200 }))).toBe(
      true
    );
    expect(interpretOceHealthResponse(new Response('no', { status: 503 }))).toBe(
      false
    );

    vi.unstubAllGlobals();
  });
});