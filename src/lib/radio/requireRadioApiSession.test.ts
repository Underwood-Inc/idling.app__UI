import { describe, expect, test, vi } from 'vitest';

vi.mock('@lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@lib/auth';
import { requireRadioApiSession } from './requireRadioApiSession';

describe('requireRadioApiSession', () => {
  test('when there is no session, returns AUTH_REQUIRED 401', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const result = await requireRadioApiSession();
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.response.status).toBe(401);
    const body = await result.response.json();
    expect(body.code).toBe('AUTH_REQUIRED');
  });

  test('when session has a valid user id, returns userId', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as Awaited<ReturnType<typeof auth>>);
    const result = await requireRadioApiSession();
    expect(result).toEqual({ ok: true, userId: 42 });
  });
});