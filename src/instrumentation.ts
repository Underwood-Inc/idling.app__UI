/**
 * Next.js Instrumentation for OpenTelemetry (SigNoz Integration)
 * 
 * This file is automatically loaded by Next.js to set up server-side instrumentation.
 * It configures OpenTelemetry to send traces, metrics, and logs to SigNoz.
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
      console.log('🧙‍♂️ SigNoz: No endpoint configured. Set SIGNOZ_ENDPOINT to enable tracing.');
      return;
    }

    try {
      // Dynamic imports to avoid bundling issues
      const { NodeSDK } = await import('@opentelemetry/sdk-node');
      const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
      const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
      const { OTLPMetricExporter } = await import('@opentelemetry/exporter-metrics-otlp-http');
      const { PeriodicExportingMetricReader } = await import('@opentelemetry/sdk-metrics');
      const { Resource } = await import('@opentelemetry/resources');
      const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, ATTR_DEPLOYMENT_ENVIRONMENT } = await import('@opentelemetry/semantic-conventions');
      const { diag, DiagConsoleLogger, DiagLogLevel } = await import('@opentelemetry/api');

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
      const resource = new Resource({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]: serviceVersion,
        [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      });

      // Configure trace exporter
      const traceExporter = new OTLPTraceExporter({
        url: `${signozEndpoint}/v1/traces`,
        headers: process.env.SIGNOZ_ACCESS_TOKEN 
          ? { 'signoz-access-token': process.env.SIGNOZ_ACCESS_TOKEN }
          : undefined,
      });

      // Configure metric exporter
      const metricExporter = new OTLPMetricExporter({
        url: `${signozEndpoint}/v1/metrics`,
        headers: process.env.SIGNOZ_ACCESS_TOKEN 
          ? { 'signoz-access-token': process.env.SIGNOZ_ACCESS_TOKEN }
          : undefined,
      });

      // Configure the SDK
      const sdk = new NodeSDK({
        resource,
        traceExporter,
        metricReader: new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 60000, // Export metrics every 60 seconds
        }),
        instrumentations: [
          getNodeAutoInstrumentations({
            // Disable some noisy instrumentations
            '@opentelemetry/instrumentation-fs': {
              enabled: false, // File system operations are too noisy
            },
            '@opentelemetry/instrumentation-dns': {
              enabled: false, // DNS lookups are too noisy
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
              },
            },
            // Enable fetch instrumentation
            '@opentelemetry/instrumentation-fetch': {
              enabled: true,
            },
            // Enable pg (PostgreSQL) instrumentation
            '@opentelemetry/instrumentation-pg': {
              enabled: true,
              enhancedDatabaseReporting: true,
            },
          }),
        ],
      });

      // Start the SDK
      sdk.start();

      // Graceful shutdown
      process.on('SIGTERM', () => {
        sdk.shutdown()
          .then(() => console.log('🧙‍♂️ SigNoz: OpenTelemetry SDK shut down successfully'))
          .catch((error) => console.error('🧙‍♂️ SigNoz: Error shutting down OpenTelemetry SDK:', error))
          .finally(() => process.exit(0));
      });

      console.log(`🧙‍♂️ SigNoz: OpenTelemetry initialized for ${serviceName} (${serviceVersion})`);
      console.log(`🧙‍♂️ SigNoz: Sending traces to ${signozEndpoint}`);
      
    } catch (error) {
      console.error('🧙‍♂️ SigNoz: Failed to initialize OpenTelemetry:', error);
      console.log('🧙‍♂️ SigNoz: Make sure to install required packages:');
      console.log('   pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node');
      console.log('   pnpm add @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http');
      console.log('   pnpm add @opentelemetry/resources @opentelemetry/semantic-conventions');
      console.log('   pnpm add @opentelemetry/sdk-metrics @opentelemetry/api');
    }
  }
}

