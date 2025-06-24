/**
 * Global logger instances for common use cases
 */

import {
  createClientLogger,
  createDebugLogger,
  createLogger,
  createServerLogger
} from './factories';

/**
 * Generic logger instance - adapts to environment
 */
export const logger = createLogger();

/**
 * Server-specific logger instance
 */
export const serverLogger = createServerLogger();

/**
 * Client-specific logger instance
 */
export const clientLogger = createClientLogger();

/**
 * Debug logger instance for development
 */
export const debugLogger = createDebugLogger();
