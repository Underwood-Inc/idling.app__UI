/**
 * Configuration constants and environment-specific settings
 */

import type { Context, Environment, LogLevel, LoggerConfig } from './types';

export const LogLevels: Record<LogLevel, number> = {
  DEBUG: 0,
  TRACE: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  PERF: 5
} as const;

export const LogLevelOrder: LogLevel[] = [
  'DEBUG',
  'TRACE',
  'INFO',
  'WARN',
  'ERROR',
  'PERF'
];

export const LogEmojis: Record<LogLevel, string> = {
  DEBUG: '🐛',
  TRACE: '🔍',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  PERF: '⚡'
} as const;

export const ContextEmojis: Record<string, string> = {
  // Component categories
  PermissionsService: '🔐',
  PostActions: '📝',
  EmojiActions: '🎨',
  PermissionActions: '🔐',
  SmartCacheStatus: '📦',
  PostsManager: '📄',
  useSubmissionsManager: '🚀',
  RichTextLogger: '📝',
  ServiceWorker: '⚙️',

  // Generic categories
  auth: '🔑',
  cache: '💾',
  database: '🗄️',
  api: '🌐',
  ui: '🎨',
  performance: '⚡',
  security: '🛡️',
  validation: '✅',
  error: '💥',
  debug: '🔧'
} as const;

const getEnvironment = (): Environment => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV as Environment;
  }
  return 'development';
};

const getContext = (): Context => {
  if (typeof window !== 'undefined') {
    return 'client';
  } else if (typeof process !== 'undefined') {
    return 'server';
  }
  return 'universal';
};

export const DEFAULT_CONFIG: LoggerConfig = {
  enabled: true,
  level: 'INFO',
  context: {
    environment: getEnvironment(),
    context: getContext()
  },
  formatters: [],
  transports: [],
  grouping: {
    enabled: true,
    autoGroup: false, // Disable auto-grouping to prevent nesting issues
    groupThreshold: 3,
    collapseGroups: true
  },
  performance: {
    enabled: false,
    slowThreshold: 1000,
    trackOperations: false,
    trackQueries: false
  }
};

export const ENVIRONMENT_CONFIGS: Record<Environment, Partial<LoggerConfig>> = {
  development: {
    enabled: true,
    level: 'DEBUG',
    grouping: {
      enabled: true,
      autoGroup: false, // Disable auto-grouping to prevent nesting issues
      groupThreshold: 2,
      collapseGroups: true // Use collapsed groups in development too
    },
    performance: {
      enabled: true,
      slowThreshold: 500,
      trackOperations: true,
      trackQueries: true
    }
  },

  production: {
    enabled: true,
    level: 'ERROR', // Only log errors in production
    grouping: {
      enabled: false,
      autoGroup: false,
      groupThreshold: 5,
      collapseGroups: true
    },
    performance: {
      enabled: false,
      slowThreshold: 2000,
      trackOperations: false,
      trackQueries: false
    }
  },

  test: {
    enabled: false,
    level: 'ERROR',
    grouping: {
      enabled: false,
      autoGroup: false,
      groupThreshold: 10,
      collapseGroups: true
    },
    performance: {
      enabled: false,
      slowThreshold: 5000,
      trackOperations: false,
      trackQueries: false
    }
  }
};

export const CONSOLE_METHODS = {
  DEBUG: 'info', // Use info since debug is not allowed by eslint
  TRACE: 'info',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  PERF: 'info'
} as const;

export const shouldLog = (
  configLevel: LogLevel,
  messageLevel: LogLevel
): boolean => {
  return LogLevels[messageLevel] >= LogLevels[configLevel];
};

export const getEnvironmentConfig = (env?: Environment): LoggerConfig => {
  const environment = env || getEnvironment();
  const baseConfig = { ...DEFAULT_CONFIG };
  const envConfig = ENVIRONMENT_CONFIGS[environment];

  return {
    ...baseConfig,
    ...envConfig,
    context: {
      ...baseConfig.context,
      environment
    },
    grouping: {
      ...baseConfig.grouping,
      ...envConfig?.grouping
    },
    performance: {
      ...baseConfig.performance,
      ...envConfig?.performance
    }
  };
};
