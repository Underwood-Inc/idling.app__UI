/**
 * Server Logger Adapter
 * Specialized logger for server-side operations with enhanced error handling
 * and performance monitoring
 */

import { Logger } from '../core/Logger';
import type { ErrorLike, LoggerConfig, StructuredData } from '../types';

export class ServerLogger extends Logger {
  constructor(config?: Partial<LoggerConfig>) {
    super({
      ...config,
      context: {
        context: 'server',
        environment: (process.env.NODE_ENV as any) || 'development',
        ...config?.context
      }
    });
  }

  /**
   * Log performance metrics for server operations
   */
  perf(operation: string, duration: number, data?: StructuredData): void {
    super.perf(operation, duration, data);
  }

  /**
   * Log slow database queries or operations
   */
  slowQuery(operation: string, duration: number, threshold = 1000): void {
    if (duration > threshold) {
      this.warn(
        `SLOW QUERY: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
        {
          duration,
          threshold,
          operation
        }
      );
    }
  }

  /**
   * Enhanced error logging with server context
   */
  error(
    message: string,
    error?: Error | ErrorLike,
    data?: StructuredData
  ): void {
    // Edge Runtime compatible server context
    let serverContext = {};
    try {
      // Only include Node.js APIs if available (not in Edge Runtime)
      if (typeof process !== 'undefined' && process.version) {
        serverContext = {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        };
      }
    } catch {
      // Ignore errors in Edge Runtime
      serverContext = { runtime: 'edge' };
    }

    const enhancedData = {
      ...data,
      serverContext
    };

    super.error(message, error, enhancedData);
  }

  /**
   * Log database operations
   */
  database(operation: string, duration?: number, data?: StructuredData): void {
    const dbData = {
      ...data,
      operation,
      ...(duration ? { duration: `${duration.toFixed(2)}ms` } : {})
    };

    if (duration && duration > 500) {
      this.warn(`Database operation: ${operation}`, dbData);
    } else {
      this.debug(`Database operation: ${operation}`, dbData);
    }
  }

  /**
   * Log API request/response
   */
  api(
    method: string,
    path: string,
    status: number,
    duration?: number,
    data?: StructuredData
  ): void {
    const apiData = {
      ...data,
      method,
      path,
      status,
      ...(duration ? { duration: `${duration.toFixed(2)}ms` } : {})
    };

    if (status >= 400) {
      this.error(`API ${method} ${path} - ${status}`, undefined, apiData);
    } else if (status >= 300) {
      this.warn(`API ${method} ${path} - ${status}`, apiData);
    } else {
      this.info(`API ${method} ${path} - ${status}`, apiData);
    }
  }

  /**
   * Log authentication events
   */
  auth(event: string, userId?: string, data?: StructuredData): void {
    const authData = {
      ...data,
      event,
      userId,
      timestamp: new Date().toISOString()
    };

    this.info(`Auth: ${event}`, authData);
  }

  /**
   * Log security events (always logged regardless of level)
   */
  security(event: string, data?: StructuredData): void {
    const securityData = {
      ...data,
      event,
      timestamp: new Date().toISOString(),
      severity: 'SECURITY'
    };

    // Security events are always logged as errors for visibility
    super.error(`SECURITY: ${event}`, undefined, securityData);
  }

  /**
   * Log cron job operations
   */
  cron(
    jobName: string,
    status: 'start' | 'complete' | 'error',
    duration?: number,
    data?: StructuredData
  ): void {
    const cronData = {
      ...data,
      jobName,
      status,
      ...(duration ? { duration: `${duration.toFixed(2)}ms` } : {})
    };

    switch (status) {
      case 'start':
        this.debug(`Cron job started: ${jobName}`, cronData);
        break;
      case 'complete':
        if (duration && duration > 30000) {
          // 30 seconds
          this.warn(`Cron job completed (slow): ${jobName}`, cronData);
        } else {
          this.debug(`Cron job completed: ${jobName}`, cronData);
        }
        break;
      case 'error':
        this.error(`Cron job failed: ${jobName}`, undefined, cronData);
        break;
    }
  }
}
