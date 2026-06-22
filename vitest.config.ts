import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './vitest.env.ts',
      './vitest.jest-shim.ts',
      './vitest.global-mocks.ts',
      './vitest.setup.ts'
    ],
    include: ['src/**/*.test.{ts,tsx,js,jsx}'],
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',
      '**/*.spec.{ts,tsx}',
      '**/playwright-report/**',
      '**/test-results/**'
    ],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 15000,
    pool: 'forks',
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.tsx',
        'src/**/index.ts',
        'src/**/*.spec.{ts,tsx}',
        'e2e/**'
      ],
      reporter: ['json', 'lcov', 'text', 'clover']
    },
    environmentMatchGlobs: [
      ['src/lib/security/**', 'node'],
      ['src/lib/api/**', 'node'],
      ['src/app/components/**/actions.test.ts', 'node'],
      ['src/app/components/submissions-list/actions.test.ts', 'node']
    ],
    server: {
      deps: {
        inline: ['next-auth', '@auth/core']
      }
    }
  }
});
