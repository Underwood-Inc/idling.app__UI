/* eslint-disable no-console */
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

// Global browser console function for raw logger output
declare global {
  interface Window {
    enableRawLoggerOutput: () => void;
    disableRawLoggerOutput: () => void;
    isRawLoggerOutputEnabled: () => boolean;
  }
}

// Store original console methods
let originalConsoleMethods: {
  log: typeof console.log;
  info: typeof console.info;
  warn: typeof console.warn;
  error: typeof console.error;
  debug: typeof console.debug;
  trace: typeof console.trace;
  group: typeof console.group;
  groupCollapsed: typeof console.groupCollapsed;
  groupEnd: typeof console.groupEnd;
} | null = null;

let rawOutputEnabled = false;

/**
 * Converts any value to a raw, copyable string format
 */
function toRawString(value: any, indent = 0): string {
  const spaces = '  '.repeat(indent);

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (value instanceof Date) return `"${value.toISOString()}"`;
  if (value instanceof Error) {
    return `{
${spaces}  name: "${value.name}",
${spaces}  message: "${value.message}",
${spaces}  stack: "${value.stack?.replace(/\n/g, '\\n') || ''}"
${spaces}}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value
      .map((item) => `${spaces}  ${toRawString(item, indent + 1)}`)
      .join(',\n');
    return `[\n${items}\n${spaces}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';

    const props = entries
      .map(([key, val]) => {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
          ? key
          : `"${key}"`;
        return `${spaces}  ${safeKey}: ${toRawString(val, indent + 1)}`;
      })
      .join(',\n');

    return `{\n${props}\n${spaces}}`;
  }

  return String(value);
}

/**
 * Creates a raw output version of a console method
 */
function createRawConsoleMethod(originalMethod: Function, methodName: string) {
  return function (...args: any[]) {
    // Convert all arguments to raw strings
    const rawArgs = args.map((arg, index) => {
      if (index === 0 && typeof arg === 'string') {
        // First argument is usually the message, keep it as-is but remove styling
        return arg.replace(/%c/g, '').trim();
      }
      return toRawString(arg);
    });

    // Create a single copyable output
    const timestamp = new Date().toISOString();
    const output = `[${timestamp}] ${methodName.toUpperCase()}: ${rawArgs.join(' ')}`;

    // Use the original method to output the raw string
    originalMethod.call(console, output);
  };
}

/**
 * Enable raw logger output globally
 * This overrides all console methods used by loggers to output raw, copyable content
 */
function enableRawLoggerOutput(): void {
  if (typeof window === 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('enableRawLoggerOutput() only works in browser environments');
    return;
  }

  if (rawOutputEnabled) {
    // eslint-disable-next-line no-console
    console.info('Raw logger output is already enabled');
    return;
  }

  // Store original methods
  originalConsoleMethods = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.trace,
    group: console.group,
    groupCollapsed: console.groupCollapsed,
    groupEnd: console.groupEnd
  };

  // Override console methods with raw output versions
  console.log = createRawConsoleMethod(originalConsoleMethods.log, 'log');
  console.info = createRawConsoleMethod(originalConsoleMethods.info, 'info');
  console.warn = createRawConsoleMethod(originalConsoleMethods.warn, 'warn');
  console.error = createRawConsoleMethod(originalConsoleMethods.error, 'error');
  console.debug = createRawConsoleMethod(originalConsoleMethods.debug, 'debug');
  console.trace = createRawConsoleMethod(originalConsoleMethods.trace, 'trace');

  // Override grouping methods to output as regular info messages instead
  console.group = createRawConsoleMethod(originalConsoleMethods.info, 'group');
  console.groupCollapsed = createRawConsoleMethod(
    originalConsoleMethods.info,
    'group'
  );
  console.groupEnd = function () {
    // Do nothing - no need to "end" groups when they're just info messages
  };

  rawOutputEnabled = true;
  console.info(
    '✅ Raw logger output enabled! All logger instances will now output copyable raw content.'
  );
  console.info('💡 Use disableRawLoggerOutput() to restore normal logging.');
}

/**
 * Disable raw logger output and restore normal console methods
 */
function disableRawLoggerOutput(): void {
  if (typeof window === 'undefined') {
    console.warn('disableRawLoggerOutput() only works in browser environments');
    return;
  }

  if (!rawOutputEnabled || !originalConsoleMethods) {
    console.info('Raw logger output is not currently enabled');
    return;
  }

  // Restore original console methods
  console.log = originalConsoleMethods.log;
  console.info = originalConsoleMethods.info;
  console.warn = originalConsoleMethods.warn;
  console.error = originalConsoleMethods.error;
  console.debug = originalConsoleMethods.debug;
  console.trace = originalConsoleMethods.trace;
  console.group = originalConsoleMethods.group;
  console.groupCollapsed = originalConsoleMethods.groupCollapsed;
  console.groupEnd = originalConsoleMethods.groupEnd;

  rawOutputEnabled = false;
  originalConsoleMethods = null;

  console.info('✅ Raw logger output disabled! Normal logging restored.');
}

/**
 * Check if raw logger output is currently enabled
 */
function isRawLoggerOutputEnabled(): boolean {
  return rawOutputEnabled;
}

// Make functions available globally in browser
if (typeof window !== 'undefined') {
  window.enableRawLoggerOutput = enableRawLoggerOutput;
  window.disableRawLoggerOutput = disableRawLoggerOutput;
  window.isRawLoggerOutputEnabled = isRawLoggerOutputEnabled;
}

// Export for programmatic use
export {
  disableRawLoggerOutput,
  enableRawLoggerOutput,
  isRawLoggerOutputEnabled
};
