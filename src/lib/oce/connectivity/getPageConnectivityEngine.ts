import { createConnectivityEngine } from './createConnectivityEngine';
import type { ConnectivityEngine, ConnectivityEngineConfig } from './types';

const OCE_GLOBAL_KEY = Symbol.for('@strixun/oce');

type GlobalWithOce = typeof globalThis & {
  [key: symbol]: ConnectivityEngine | undefined;
};

const defaultConfig = {
  healthCheckUrl: '/health',
  failureThreshold: 2,
  probeDeadline: 'Interactive',
} as const satisfies Partial<ConnectivityEngineConfig>;

export function getPageConnectivityEngine(
  config?: Partial<ConnectivityEngineConfig>
): ConnectivityEngine {
  const g = globalThis as GlobalWithOce;
  const existing = g[OCE_GLOBAL_KEY];

  if (existing) {
    if (
      config?.healthCheckUrl &&
      config.healthCheckUrl !== defaultConfig.healthCheckUrl
    ) {
      console.warn(
        '[OCE] getPageConnectivityEngine called with healthCheckUrl but a page engine already exists; existing config is kept.'
      );
    }
    return existing;
  }

  const engine = createConnectivityEngine({
    ...defaultConfig,
    ...config,
    healthCheckUrl: config?.healthCheckUrl ?? defaultConfig.healthCheckUrl,
  });
  g[OCE_GLOBAL_KEY] = engine;
  return engine;
}

export function resetPageConnectivityEngineForTests(): void {
  const g = globalThis as GlobalWithOce;
  delete g[OCE_GLOBAL_KEY];
}