/**
 * Next.js Instrumentation for OpenTelemetry (SigNoz Integration)
 *
 * This file is automatically loaded by Next.js to set up server-side instrumentation.
 * It configures OpenTelemetry to send traces, metrics, and logs to SigNoz.
 *
 * Features:
 * - Traces: HTTP requests, database queries, custom spans
 * - Metrics: Request counts, latencies, custom metrics
 * - Logs: All console output and application logs
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @see https://signoz.io/docs/instrumentation/javascript/
 * @author System Wizard 🧙‍♂️
 */

export async function register() {
  // Only run on the server (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Check if SigNoz is enabled
    const signozEndpoint = process.env.SIGNOZ_ENDPOINT;
    const serviceName = process.env.OTEL_SERVICE_NAME || 'idling-app';

    if (!signozEndpoint) {
      console.log(
        '🧙‍♂️ SigNoz: No endpoint configured. Set SIGNOZ_ENDPOINT to enable observability.'
      );
      return;
    }

    try {
      // Dynamic imports to avoid bundling issues
      const { NodeSDK } = await import('@opentelemetry/sdk-node');
      const { getNodeAutoInstrumentations } = await import(
        '@opentelemetry/auto-instrumentations-node'
      );
      const { OTLPTraceExporter } = await import(
        '@opentelemetry/exporter-trace-otlp-http'
      );
      const { OTLPMetricExporter } = await import(
        '@opentelemetry/exporter-metrics-otlp-http'
      );
      const { OTLPLogExporter } = await import(
        '@opentelemetry/exporter-logs-otlp-http'
      );
      const { PeriodicExportingMetricReader } = await import(
        '@opentelemetry/sdk-metrics'
      );
      const {
        LoggerProvider,
        BatchLogRecordProcessor,
        ConsoleLogRecordExporter
      } = await import('@opentelemetry/sdk-logs');
      const { logs } = await import('@opentelemetry/api-logs');
      const resources = await import('@opentelemetry/resources');
      const { diag, DiagConsoleLogger, DiagLogLevel } = await import(
        '@opentelemetry/api'
      );

      // Enable debug logging if configured
      if (process.env.OTEL_DEBUG === 'true') {
        diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
      }

      // Get version from package.json if available
      let serviceVersion = '0.0.0';
      try {
        const pkg = await import('../package.json');
        serviceVersion = pkg.version || '0.0.0';
      } catch {
        // Ignore if package.json can't be loaded
      }

      // Configure the resource with service information
      // Use resourceFromAttributes for OpenTelemetry v2.x compatibility
      const resource = resources.resourceFromAttributes({
        'service.name': serviceName,
        'service.version': serviceVersion,
        'deployment.environment': process.env.NODE_ENV || 'development'
      });

      // Build headers for authentication
      const authHeaders = process.env.SIGNOZ_ACCESS_TOKEN
        ? { 'signoz-access-token': process.env.SIGNOZ_ACCESS_TOKEN }
        : undefined;

      // ================================
      // TRACE EXPORTER
      // ================================
      const traceExporter = new OTLPTraceExporter({
        url: `${signozEndpoint}/v1/traces`,
        headers: authHeaders
      });

      // ================================
      // METRIC EXPORTER
      // ================================
      const metricExporter = new OTLPMetricExporter({
        url: `${signozEndpoint}/v1/metrics`,
        headers: authHeaders
      });

      // ================================
      // LOG EXPORTER
      // ================================
      const logExporter = new OTLPLogExporter({
        url: `${signozEndpoint}/v1/logs`,
        headers: authHeaders
      });

      // Configure LoggerProvider
      const loggerProvider = new LoggerProvider({ resource });

      // Add log processor - batch logs for efficient sending
      loggerProvider.addLogRecordProcessor(
        new BatchLogRecordProcessor(logExporter, {
          maxQueueSize: 2048,
          maxExportBatchSize: 512,
          scheduledDelayMillis: 5000, // Export logs every 5 seconds
          exportTimeoutMillis: 30000
        })
      );

      // Also log to console in debug mode
      if (process.env.OTEL_DEBUG === 'true') {
        loggerProvider.addLogRecordProcessor(
          new BatchLogRecordProcessor(new ConsoleLogRecordExporter())
        );
      }

      // Register the LoggerProvider globally
      logs.setGlobalLoggerProvider(loggerProvider);

      // ================================
      // CONFIGURE THE SDK
      // ================================
      const sdk = new NodeSDK({
        resource,
        traceExporter,
        metricReader: new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 60000 // Export metrics every 60 seconds
        }),
        instrumentations: [
          getNodeAutoInstrumentations({
            // Disable some noisy instrumentations
            '@opentelemetry/instrumentation-fs': {
              enabled: false // File system operations are too noisy
            },
            '@opentelemetry/instrumentation-dns': {
              enabled: false // DNS lookups are too noisy
            },
            // Enable HTTP instrumentation with filtering
            '@opentelemetry/instrumentation-http': {
              enabled: true,
              ignoreIncomingRequestHook: (request) => {
                // Ignore health checks and static assets
                const url = request.url || '';
                return (
                  url.includes('/api/test/health') ||
                  url.includes('/_next/') ||
                  url.includes('/favicon') ||
                  url.includes('.ico') ||
                  url.includes('.png') ||
                  url.includes('.jpg') ||
                  url.includes('.svg') ||
                  url.includes('.css') ||
                  url.includes('.js')
                );
              }
            },
            // Enable pg (PostgreSQL) instrumentation
            '@opentelemetry/instrumentation-pg': {
              enabled: true,
              enhancedDatabaseReporting: true
            },
            // Enable Pino/Winston/Bunyan log instrumentation if present
            '@opentelemetry/instrumentation-pino': {
              enabled: true
            },
            '@opentelemetry/instrumentation-winston': {
              enabled: true
            },
            '@opentelemetry/instrumentation-bunyan': {
              enabled: true
            }
          })
        ]
      });

      // Start the SDK
      sdk.start();

      // ================================
      // CONSOLE OVERRIDE FOR LOG CAPTURE
      // ================================
      // Override console methods to send logs to SigNoz
      const otelLogger = logs.getLogger(serviceName, serviceVersion);

      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleInfo = console.info;
      const originalConsoleDebug = console.debug;

      // Helper to emit log record
      const emitLogRecord = (
        severityText: string,
        severityNumber: number,
        args: unknown[]
      ) => {
        const message = args
          .map((arg) =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          )
          .join(' ');

        otelLogger.emit({
          severityText,
          severityNumber,
          body: message,
          attributes: {
            'log.type': 'console'
          }
        });
      };

      // Override console.log
      console.log = (...args: unknown[]) => {
        emitLogRecord('INFO', 9, args); // SeverityNumber.INFO = 9
        originalConsoleLog.apply(console, args);
      };

      // Override console.error
      console.error = (...args: unknown[]) => {
        emitLogRecord('ERROR', 17, args); // SeverityNumber.ERROR = 17
        originalConsoleError.apply(console, args);
      };

      // Override console.warn
      console.warn = (...args: unknown[]) => {
        emitLogRecord('WARN', 13, args); // SeverityNumber.WARN = 13
        originalConsoleWarn.apply(console, args);
      };

      // Override console.info
      console.info = (...args: unknown[]) => {
        emitLogRecord('INFO', 9, args); // SeverityNumber.INFO = 9
        originalConsoleInfo.apply(console, args);
      };

      // Override console.debug
      console.debug = (...args: unknown[]) => {
        emitLogRecord('DEBUG', 5, args); // SeverityNumber.DEBUG = 5
        originalConsoleDebug.apply(console, args);
      };

      // ================================
      // GRACEFUL SHUTDOWN
      // ================================
      process.on('SIGTERM', async () => {
        try {
          await loggerProvider.shutdown();
          await sdk.shutdown();
          console.log('🧙‍♂️ SigNoz: OpenTelemetry SDK shut down successfully');
        } catch (error) {
          console.error(
            '🧙‍♂️ SigNoz: Error shutting down OpenTelemetry SDK:',
            error
          );
        } finally {
          process.exit(0);
        }
      });

      console.log(
        `🧙‍♂️ SigNoz: OpenTelemetry initialized for ${serviceName} (${serviceVersion})`
      );
      console.log(`🧙‍♂️ SigNoz: Sending traces to ${signozEndpoint}/v1/traces`);
      console.log(`🧙‍♂️ SigNoz: Sending metrics to ${signozEndpoint}/v1/metrics`);
      console.log(`🧙‍♂️ SigNoz: Sending logs to ${signozEndpoint}/v1/logs`);
    } catch (error) {
      console.error('🧙‍♂️ SigNoz: Failed to initialize OpenTelemetry:', error);
      console.log('🧙‍♂️ SigNoz: Make sure to install required packages:');
      console.log(
        '   pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node'
      );
      console.log(
        '   pnpm add @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http'
      );
      console.log('   pnpm add @opentelemetry/exporter-logs-otlp-http');
      console.log(
        '   pnpm add @opentelemetry/sdk-logs @opentelemetry/api-logs'
      );
      console.log(
        '   pnpm add @opentelemetry/resources @opentelemetry/semantic-conventions'
      );
      console.log('   pnpm add @opentelemetry/sdk-metrics @opentelemetry/api');
    }
  }
}
