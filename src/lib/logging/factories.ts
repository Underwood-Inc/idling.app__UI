/**
 * Factory functions for creating different types of loggers
 */

import { ClientLogger } from './adapters/ClientLogger';
import { DebugLogger } from './adapters/DebugLogger';
import { ServerLogger } from './adapters/ServerLogger';
import { Logger } from './core/Logger';
import { SigNozTransport } from './transports/SigNozTransport';
import type { LoggerConfig, LoggerInstance, LogTransport } from './types';

/**
 * Get the default transports for server-side logging
 * Includes SigNoz transport when SIGNOZ_ENDPOINT is configured
 */
function getServerTransports(): LogTransport[] {
  const transports: LogTransport[] = [];

  // Only add SigNoz transport on server-side and when configured
  if (typeof window === 'undefined' && process.env.SIGNOZ_ENDPOINT) {
    transports.push(SigNozTransport);
  }

  return transports;
}

/**
 * Create a generic logger instance
 */
export function createLogger(config?: Partial<LoggerConfig>): LoggerInstance {
  return new Logger(config);
}

/**
 * Create a server-specific logger instance
 * Automatically includes SigNoz transport when SIGNOZ_ENDPOINT is configured
 */
export function createServerLogger(
  config?: Partial<LoggerConfig>
): ServerLogger {
  const serverTransports = getServerTransports();
  const configTransports = config?.transports || [];

  return new ServerLogger({
    ...config,
    transports: [...serverTransports, ...configTransports]
  });
}

/**
 * Create a client-specific logger instance
 */
export function createClientLogger(
  config?: Partial<LoggerConfig>
): ClientLogger {
  return new ClientLogger(config);
}

/**
 * Create a debug logger instance for development
 */
export function createDebugLogger(config?: Partial<LoggerConfig>): DebugLogger {
  return new DebugLogger(config);
}

/**
 * Create a logger instance with component context
 */
export function createComponentLogger(
  component: string,
  config?: Partial<LoggerConfig>
): LoggerInstance {
  return createLogger({
    ...config,
    context: {
      ...config?.context,
      component
    }
  });
}

/**
 * Create a logger instance with module context
 */
export function createModuleLogger(
  module: string,
  config?: Partial<LoggerConfig>
): LoggerInstance {
  return createLogger({
    ...config,
    context: {
      module,
      ...config?.context
    }
  });
}

/**
 * Create a logger instance with function context
 */
export function createFunctionLogger(
  functionName: string,
  config?: Partial<LoggerConfig>
): LoggerInstance {
  return createLogger({
    ...config,
    context: {
      function: functionName,
      ...config?.context
    }
  });
}

/**
 * Create a logger instance with category context
 */
export function createCategoryLogger(
  category: string,
  config?: Partial<LoggerConfig>
): LoggerInstance {
  return createLogger({
    ...config,
    context: {
      category,
      ...config?.context
    }
  });
}
