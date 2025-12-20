/**
 * SigNoz Transport for the Logging System
 * Sends structured log entries to SigNoz via OpenTelemetry
 *
 * This transport preserves all rich metadata from the Logger:
 * - Context (component, module, function, category)
 * - Structured data
 * - Error details with stack traces
 * - Performance metrics (duration)
 * - Environment info
 *
 * @author System Wizard 🧙‍♂️
 */

import type {
  FormattedOutput,
  LogEntry,
  LogLevel,
  LogTransport
} from '../types';

/**
 * OpenTelemetry Severity Numbers
 * @see https://opentelemetry.io/docs/specs/otel/logs/data-model/#severity-fields
 */
const SEVERITY_MAP: Record<LogLevel, { text: string; number: number }> = {
  TRACE: { text: 'TRACE', number: 1 },
  DEBUG: { text: 'DEBUG', number: 5 },
  INFO: { text: 'INFO', number: 9 },
  WARN: { text: 'WARN', number: 13 },
  ERROR: { text: 'ERROR', number: 17 },
  PERF: { text: 'INFO', number: 9 } // Performance logs as INFO level
};

/**
 * Cached reference to the OpenTelemetry logger
 * Using 'any' to work around OpenTelemetry SDK type definition inconsistencies
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let otelLogger: any = null;
let initAttempted = false;

/**
 * Get or initialize the OpenTelemetry logger
 * Uses dynamic import to avoid issues when OTEL is not configured
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOTelLogger(): Promise<any> {
  if (otelLogger) return otelLogger;
  if (initAttempted) return null;

  initAttempted = true;

  try {
    // Only attempt to get logger on server side
    if (typeof window !== 'undefined') {
      return null;
    }

    // Dynamic import to avoid bundling issues
    const { logs } = await import('@opentelemetry/api-logs');
    const loggerProvider = logs.getLoggerProvider();

    // Check if a real provider is registered (not the NoopLoggerProvider)
    if (
      loggerProvider &&
      loggerProvider.constructor.name !== 'NoopLoggerProvider'
    ) {
      otelLogger = loggerProvider.getLogger('idling-app-logger', '1.0.0');
      return otelLogger;
    }

    return null;
  } catch {
    // OpenTelemetry not available or not configured
    return null;
  }
}

/**
 * Convert LogEntry to OpenTelemetry attributes
 */
function buildAttributes(entry: LogEntry): Record<string, unknown> {
  const attributes: Record<string, unknown> = {
    'log.type': 'structured',
    'log.source': 'custom-logger'
  };

  // Add context information
  if (entry.context) {
    if (entry.context.component) {
      attributes['log.component'] = entry.context.component;
    }
    if (entry.context.module) {
      attributes['log.module'] = entry.context.module;
    }
    if (entry.context.function) {
      attributes['log.function'] = entry.context.function;
    }
    if (entry.context.category) {
      attributes['log.category'] = entry.context.category;
    }
    if (entry.context.environment) {
      attributes['deployment.environment'] = entry.context.environment;
    }
    if (entry.context.context) {
      attributes['log.context'] = entry.context.context;
    }
    if (entry.context.userId) {
      attributes['user.id'] = entry.context.userId;
    }
    if (entry.context.sessionId) {
      attributes['session.id'] = entry.context.sessionId;
    }
    if (entry.context.requestId) {
      attributes['request.id'] = entry.context.requestId;
    }
  }

  // Add duration for performance logs
  if (entry.duration !== undefined) {
    attributes['log.duration_ms'] = entry.duration;
  }

  // Add error information
  if (entry.error) {
    attributes['error.type'] = entry.error.name || 'Error';
    attributes['error.message'] = entry.error.message;
    if (entry.error.stack) {
      attributes['error.stack'] = entry.error.stack;
    }
    if (entry.error.cause) {
      attributes['error.cause'] = JSON.stringify(entry.error.cause);
    }
  }

  // Add structured data
  if (entry.data) {
    Object.entries(entry.data).forEach(([key, value]) => {
      // Prefix with 'data.' to namespace structured data
      const attrKey = `data.${key}`;
      if (typeof value === 'object' && value !== null) {
        attributes[attrKey] = JSON.stringify(value);
      } else {
        attributes[attrKey] = value;
      }
    });
  }

  // Add metadata
  if (entry.metadata) {
    Object.entries(entry.metadata).forEach(([key, value]) => {
      const attrKey = `metadata.${key}`;
      if (typeof value === 'object' && value !== null) {
        attributes[attrKey] = JSON.stringify(value);
      } else {
        attributes[attrKey] = value;
      }
    });
  }

  // Add timestamp
  attributes['log.timestamp'] = entry.timestamp;

  return attributes;
}

/**
 * SigNoz Transport implementation
 * Sends logs to SigNoz via OpenTelemetry Logs API
 */
export const SigNozTransport: LogTransport = {
  name: 'signoz',

  transport: (entry: LogEntry, _formatted: string | FormattedOutput): void => {
    // Fire and forget - don't block the main thread
    (async () => {
      try {
        const logger = await getOTelLogger();
        if (!logger) return;

        const severity = SEVERITY_MAP[entry.level] || SEVERITY_MAP.INFO;
        const attributes = buildAttributes(entry);

        // Build the log body with context prefix if available
        let body = entry.message;
        if (entry.context?.component || entry.context?.module) {
          const prefix = [entry.context.component, entry.context.module]
            .filter(Boolean)
            .join('.');
          if (prefix) {
            body = `[${prefix}] ${entry.message}`;
          }
        }

        logger.emit({
          severityText: severity.text,
          severityNumber: severity.number,
          body,
          attributes
        });
      } catch {
        // Silently fail - don't break the app if logging fails
      }
    })();
  }
};

/**
 * Factory function to create a SigNoz transport
 * Useful for customizing transport behavior
 */
export function createSigNozTransport(): LogTransport {
  return SigNozTransport;
}

export default SigNozTransport;
