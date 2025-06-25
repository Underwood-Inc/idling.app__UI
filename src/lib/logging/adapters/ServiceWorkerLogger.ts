/* eslint-disable no-console */
/**
 * Service Worker Logger Adapter
 * Specialized logger for service worker context where imports may be limited
 */

export interface ServiceWorkerLoggerConfig {
  enabled: boolean;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  context: string;
  version: string;
}

export class ServiceWorkerLogger {
  private config: ServiceWorkerLoggerConfig;
  private activeGroups: string[] = [];

  constructor(config: Partial<ServiceWorkerLoggerConfig> = {}) {
    this.config = {
      enabled: true,
      level: 'INFO',
      context: 'ServiceWorker',
      version: '0.157.0',
      ...config
    };
  }

  private shouldLog(level: string): boolean {
    if (!this.config.enabled) return false;

    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);

    return logLevelIndex >= currentLevelIndex;
  }

  private getPrefix(): string {
    return `🔧 ${this.config.context} v${this.config.version}`;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString().slice(11, 23);
    const emoji =
      {
        DEBUG: '🔍',
        INFO: 'ℹ️',
        WARN: '⚠️',
        ERROR: '❌'
      }[level] || 'ℹ️';

    return `${emoji} [${timestamp}] ${this.getPrefix()} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('DEBUG')) return;

    const formatted = this.formatMessage('DEBUG', message);
    if (data) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('INFO')) return;

    const formatted = this.formatMessage('INFO', message);
    if (data) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('WARN')) return;

    const formatted = this.formatMessage('WARN', message);
    if (data) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  }

  error(message: string, error?: any, data?: any): void {
    if (!this.shouldLog('ERROR')) return;

    const formatted = this.formatMessage('ERROR', message);
    const logData = {
      ...(data || {}),
      ...(error ? { error: this.serializeError(error) } : {})
    };

    if (Object.keys(logData).length > 0) {
      console.error(formatted, logData);
    } else {
      console.error(formatted);
    }
  }

  group(title: string): void {
    if (!this.config.enabled) return;

    this.activeGroups.push(title);
    const formatted = `${this.getPrefix()} ${title}`;

    // Always use collapsed groups by default for cleaner output
    if (console.groupCollapsed) {
      console.groupCollapsed(formatted);
    } else if (console.group) {
      console.group(formatted);
    }
  }

  groupEnd(): void {
    if (!this.config.enabled || this.activeGroups.length === 0) return;

    this.activeGroups.pop();

    // Always call groupEnd to properly close groups and prevent nesting
    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  table(data: any[]): void {
    if (!this.shouldLog('INFO')) return;

    if (console.table) {
      console.table(data);
    } else {
      console.info('Table data:', data);
    }
  }

  private serializeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    return error;
  }

  // Performance logging
  perf(operation: string, duration: number, data?: any): void {
    const message = `${operation}: ${duration.toFixed(2)}ms`;

    if (duration > 1000) {
      this.warn(`SLOW OPERATION: ${message}`, data);
    } else {
      this.debug(message, data);
    }
  }

  // Cache-specific logging methods
  cacheHit(url: string, age: number): void {
    this.debug('Cache hit', { url, age: `${age}ms` });
  }

  cacheMiss(url: string, reason: string): void {
    this.info('Cache miss', { url, reason });
  }

  cacheExpired(url: string, age: number, maxAge: number): void {
    this.info('Cache expired', {
      url,
      age: `${age}ms`,
      maxAge: `${maxAge}ms`,
      expired: age > maxAge
    });
  }

  cacheStored(url: string, ttl: number): void {
    this.debug('Cache stored', {
      url,
      ttl: `${Math.round(ttl / 1000 / 60)}min`
    });
  }

  cleanup(operation: string, count: number): void {
    this.info(`Cleanup: ${operation}`, { count });
  }

  registration(event: string, details?: any): void {
    this.info(`Registration: ${event}`, details);
  }
}

// Create default instance for service worker
export const swLogger = new ServiceWorkerLogger();
