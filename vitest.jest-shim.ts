/**
 * Temporary compatibility layer while shared __mocks__ are migrated from Jest to Vitest.
 * Must run before vitest.setup.ts imports __mocks__.
 */
import { vi } from 'vitest';

(globalThis as typeof globalThis & { jest: typeof vi; vi: typeof vi }).jest = vi;
(globalThis as typeof globalThis & { jest: typeof vi; vi: typeof vi }).vi = vi;
