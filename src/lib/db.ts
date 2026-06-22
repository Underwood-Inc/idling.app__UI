import postgres from 'postgres';

// Disable Cloudflare runtime detection in development
if (process.env.NODE_ENV !== 'production') {
  // Remove any Cloudflare-specific globals that might trigger socket detection
  try {
    if (typeof global !== 'undefined' && (global as any).navigator) {
      delete (global as any).navigator;
    }
  } catch (e) {
    // Ignore errors when trying to delete navigator
  }
  // Set environment variable to force Node.js networking
  process.env.POSTGRES_FORCE_NODEJS = 'true';
}

/**
 * PostgreSQL TLS note
 *
 * `rejectUnauthorized: false` is intentional in production today. Managed Postgres
 * providers in this deployment (e.g. Docker / internal network / providers with
 * self-signed or rotating CA chains) do not always present a chain Node trusts
 * out of the box. Traffic is still encrypted on the wire; only certificate
 * identity verification is skipped.
 *
 * Re-enable verification when the deployment supplies a CA the runtime trusts
 * (set `POSTGRES_SSL_CA` or mount the provider CA bundle). See
 * `docs/infrastructure/postgres-tls.md`.
 */
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  pass: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT as unknown as number,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  onnotice: () => {},
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false // Disable prepared statements to reduce connection usage
  // Removed transform: postgres.camel to maintain snake_case compatibility
});

export default sql;
