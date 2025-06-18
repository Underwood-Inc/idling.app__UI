/**
 * Server-side logging utility for performance monitoring and debugging
 * Bypasses linter restrictions for server-side logging needs
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'PERF';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp?: string;
  duration?: number;
}

class ServerLogger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log critical errors
    if (this.isProduction) {
      return ['ERROR'].includes(level);
    }
    // In development, only log errors and warnings
    return ['ERROR', 'WARN'].includes(level);
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const logData = {
      ...entry,
      timestamp: this.formatTimestamp()
    };

    // Use appropriate console method based on level
    // eslint-disable-next-line no-console
    switch (entry.level) {
      case 'ERROR':
        console.error(`[${entry.level}]`, entry.message, entry.data || '');
        break;
      case 'WARN':
        console.warn(`[${entry.level}]`, entry.message, entry.data || '');
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(`[${entry.level}]`, entry.message, entry.data || '');
    }
  }

  perf(operation: string, duration: number, data?: any): void {
    this.log({
      level: 'PERF',
      message: `${operation}: ${duration.toFixed(2)}ms`,
      data,
      duration
    });
  }

  slowQuery(operation: string, duration: number, threshold = 500): void {
    if (duration > threshold) {
      this.log({
        level: 'WARN',
        message: `SLOW QUERY: ${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
        duration
      });
    }
  }

  debug(message: string, data?: any): void {
    this.log({
      level: 'DEBUG',
      message,
      data
    });
  }

  error(message: string, error?: Error | any, data?: any): void {
    this.log({
      level: 'ERROR',
      message,
      data: {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name
              }
            : error,
        ...data
      }
    });
  }

  info(message: string, data?: any): void {
    this.log({
      level: 'INFO',
      message,
      data
    });
  }
}

export const serverLogger = new ServerLogger();
