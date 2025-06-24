/**
 * Consolidated Logging System
 *
 * A unified, environment-aware logging solution that replaces all existing
 * logging patterns in the codebase with a consistent, performant approach.
 *
 * Features:
 * - Environment-aware (development/production/test)
 * - Context-aware (client/server)
 * - Performance optimized (conditional logging)
 * - ESLint compliant (uses allowed console methods)
 * - Structured output with automatic grouping
 * - Type-safe with full TypeScript support
 */

export { ClientLogger } from './adapters/ClientLogger';
export { DebugLogger } from './adapters/DebugLogger';
export { ServerLogger } from './adapters/ServerLogger';
export { Logger } from './core/Logger';

export type {
  LogContext,
  LogEntry,
  LogLevel,
  LoggerConfig,
  PerformanceMetrics,
  StructuredData
} from './types';

export {
  createClientLogger,
  createDebugLogger,
  createLogger,
  createServerLogger
} from './factories';

export { DEFAULT_CONFIG, ENVIRONMENT_CONFIGS, LogLevels } from './config';

// Global logger instances for common use cases
export { clientLogger, debugLogger, logger, serverLogger } from './instances';
