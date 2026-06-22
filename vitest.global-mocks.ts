/**
 * Registers shared manual mocks from __mocks__/ (Jest auto-mocked these; Vitest needs explicit vi.mock).
 * Must run after vitest.jest-shim.ts and before vitest.setup.ts.
 */
import { vi } from 'vitest';

vi.mock('next/config', async () => {
  const mod = await import('./__mocks__/next/config');
  return { default: mod.default };
});

vi.mock('next-auth/react', async () => import('./__mocks__/next-auth/react'));

vi.mock('@dicebear/core', async () => import('./__mocks__/@dicebear/core'));

vi.mock('next/navigation', async () => import('./__mocks__/next/navigation'));
