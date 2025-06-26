/* eslint-disable no-console */
/**
 * Core Logger class - Base implementation for all logging operations
 */

import type {
  ErrorLike,
  FormattedOutput,
  LogContext,
  LogEntry,
  LoggerConfig,
  LoggerInstance,
  LogLevel,
  StructuredData
} from '../types';

import {
  CONSOLE_METHODS,
  ContextEmojis,
  getEnvironmentConfig,
  LogEmojis,
  shouldLog
} from '../config';

export class Logger implements LoggerInstance {
  private config: LoggerConfig;
  private activeGroups: string[] = [];
  private logCounts: Map<string, number> = new Map();
  private timers: Map<string, number> = new Map();

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      ...getEnvironmentConfig(),
      ...config,
      context: {
        ...getEnvironmentConfig().context,
        ...config?.context
      }
    };
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private getContextPrefix(): string {
    const { component, module, function: fn, category } = this.config.context;
    const parts = [component, module, fn, category].filter(Boolean);

    if (parts.length === 0) return '';

    const contextKey = parts[0] || '';
    const emoji = ContextEmojis[contextKey] || ContextEmojis['debug'];

    return `${emoji} ${parts.join('.')} `;
  }

  private shouldLogLevel(level: LogLevel): boolean {
    return this.config.enabled && shouldLog(this.config.level, level);
  }

  private formatError(error: Error | ErrorLike): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      };
    }
    return error;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: StructuredData,
    error?: Error | ErrorLike,
    duration?: number
  ): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: this.formatTimestamp(),
      context: { ...this.config.context },
      error: error ? this.formatError(error) : undefined,
      duration,
      metadata: {
        activeGroups: [...this.activeGroups],
        logCount: this.logCounts.get(level) || 0
      }
    };
  }

  private formatOutput(entry: LogEntry): FormattedOutput {
    const emoji = LogEmojis[entry.level];
    const prefix = this.getContextPrefix();
    const levelTag = `[${entry.level}]`;

    return {
      message: `${emoji} ${prefix}${levelTag} ${entry.message}`,
      data: entry.data,
      emoji,
      style: this.getLogStyle(entry.level)
    };
  }

  private getLogStyle(level: LogLevel): string {
    const styles = {
      DEBUG: 'color: #6b7280;',
      TRACE: 'color: #8b5cf6;',
      INFO: 'color: #3b82f6;',
      WARN: 'color: #f59e0b; font-weight: bold;',
      ERROR:
        'color: #ef4444; font-weight: bold; font-size: 16px; background: #fef2f2; padding: 2px 6px; border-radius: 4px;',
      PERF: 'color: #10b981;'
    };
    return styles[level] || '';
  }

  private executeLog(entry: LogEntry): void {
    if (!this.shouldLogLevel(entry.level)) return;

    // Update log counts
    const currentCount = this.logCounts.get(entry.level) || 0;
    this.logCounts.set(entry.level, currentCount + 1);

    const formatted = this.formatOutput(entry);
    const consoleMethod = CONSOLE_METHODS[entry.level];

    // Auto-grouping disabled to prevent nesting issues

    // Execute the actual console log
    const consoleFn = console[consoleMethod];

    if (entry.data || entry.error) {
      // For ERROR level, use styled console output
      if (entry.level === 'ERROR') {
        console.error(`%c${formatted.message}`, formatted.style, {
          ...(entry.data || {}),
          ...(entry.error ? { error: entry.error } : {}),
          ...(entry.duration ? { duration: `${entry.duration}ms` } : {})
        });
      } else {
        consoleFn(formatted.message, {
          ...(entry.data || {}),
          ...(entry.error ? { error: entry.error } : {}),
          ...(entry.duration ? { duration: `${entry.duration}ms` } : {})
        });
      }
    } else {
      // For ERROR level, use styled console output
      if (entry.level === 'ERROR') {
        console.error(`%c${formatted.message}`, formatted.style);
      } else {
        consoleFn(formatted.message);
      }
    }
  }

  // Public API methods
  debug(message: string, data?: StructuredData): void {
    const entry = this.createLogEntry('DEBUG', message, data);
    this.executeLog(entry);
  }

  info(message: string, data?: StructuredData): void {
    const entry = this.createLogEntry('INFO', message, data);
    this.executeLog(entry);
  }

  warn(message: string, data?: StructuredData): void {
    const entry = this.createLogEntry('WARN', message, data);
    this.executeLog(entry);
  }

  error(
    message: string,
    error?: Error | ErrorLike,
    data?: StructuredData
  ): void {
    const entry = this.createLogEntry('ERROR', message, data, error);
    this.executeLog(entry);
  }

  trace(message: string, data?: StructuredData): void {
    const entry = this.createLogEntry('TRACE', message, data);
    this.executeLog(entry);
  }

  perf(operation: string, duration: number, data?: StructuredData): void {
    if (!this.config.performance.enabled) return;

    const message = `${operation}: ${duration.toFixed(2)}ms`;
    const entry = this.createLogEntry(
      'PERF',
      message,
      data,
      undefined,
      duration
    );

    // Check if it's a slow operation
    if (duration > this.config.performance.slowThreshold) {
      const slowEntry = this.createLogEntry(
        'WARN',
        `SLOW OPERATION: ${message}`,
        {
          ...data,
          threshold: this.config.performance.slowThreshold
        },
        undefined,
        duration
      );
      this.executeLog(slowEntry);
    } else {
      this.executeLog(entry);
    }
  }

  group(title: string): void {
    if (!this.config.grouping.enabled || !this.config.enabled) return;

    this.activeGroups.push(title);
    const prefix = this.getContextPrefix();

    // Always use collapsed groups by default for cleaner output
    if (console.groupCollapsed) {
      console.groupCollapsed(`${prefix}${title}`);
    } else {
      console.group(`${prefix}${title}`);
    }
  }

  groupEnd(): void {
    if (!this.config.grouping.enabled || this.activeGroups.length === 0) return;

    this.activeGroups.pop();

    // Always call groupEnd to properly close groups and prevent nesting
    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  table(data: any[]): void {
    if (!this.shouldLogLevel('INFO')) return;

    console.table(data);
  }

  time(label: string): void {
    this.timers.set(label, Date.now());
  }

  timeEnd(label: string): void {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.timers.delete(label);
      this.perf(label, duration);
    }
  }

  // Configuration methods
  setContext(context: Partial<LogContext>): void {
    this.config.context = {
      ...this.config.context,
      ...context
    };
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  child(context: Partial<LogContext>): LoggerInstance {
    return new Logger({
      ...this.config,
      context: {
        ...this.config.context,
        ...context
      }
    });
  }

  // Utility methods for specific logging patterns
  logClick(info: any): void {
    this.debug('Click event', info);
  }

  logCursor(info: any): void {
    this.debug('Cursor position', info);
  }

  logSelection(info: any): void {
    this.debug('Selection event', info);
  }

  logParsing(text: string, segments: any[], tokens: any[]): void {
    this.debug('Content parsing', {
      textLength: text.length,
      segmentCount: segments.length,
      tokenCount: tokens.length,
      segments,
      tokens
    });
  }

  logCursorPositioning(data: any): void {
    this.debug('Cursor positioning', data);
  }

  // Legacy compatibility methods
  slowQuery(operation: string, duration: number, threshold = 1000): void {
    if (duration > threshold) {
      this.warn(`SLOW QUERY: ${operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${threshold}ms`
      });
    }
  }
}
