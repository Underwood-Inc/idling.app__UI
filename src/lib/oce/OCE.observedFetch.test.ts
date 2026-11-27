import { afterEach, describe, expect, test, vi } from 'vitest';
import { OCE } from './OCE';

afterEach(() => {
  OCE.resetForTests();
  vi.unstubAllGlobals();
});

describe('OCE observed fetch', () => {
  test('[FR-OCE-001] OCE.fetch settles failures without manual reporter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );
    OCE.resetForTests();

    await expect(OCE.fetch('/api/widgets')).rejects.toThrow();
    expect(OCE.engine.getSnapshot().streak).toBe(1);
  });

  test('[FR-OCE-001] OCE.fetch settles HTTP responses without manual reporter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 }))
    );
    OCE.resetForTests();

    const response = await OCE.fetch('/api/widgets');
    expect(response.status).toBe(503);
    expect(OCE.engine.getSnapshot().unavailable).toBe(false);
    expect(OCE.engine.getSnapshot().lastHealthyAt).not.toBeNull();
  });

  test('OCE.noCacheFetch routes through observed fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );
    OCE.resetForTests();

    await expect(OCE.noCacheFetch('/api/admin/alerts')).rejects.toThrow();
    expect(OCE.engine.getSnapshot().streak).toBe(1);
  });
});