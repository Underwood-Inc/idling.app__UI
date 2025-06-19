// Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' }); // Load .env.local file

import chalk from 'chalk';
import postgres from 'postgres';

// Create database connection AFTER environment variables are loaded
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT as unknown as number,
  ssl: 'prefer',
  onnotice: () => {}, // Ignore NOTICE statements - they're not errors
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

async function dropAllTables() {
  try {
    console.info(
      chalk.yellow('⚠️  WARNING: This will drop all tables and data!')
    );
    console.info(chalk.dim('Connecting to database...'));

    // Drop tables in correct order to handle foreign key constraints
    console.info(chalk.dim('Dropping tables...'));

    await sql`DROP TABLE IF EXISTS verification_token CASCADE`;
    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS accounts CASCADE`;
    await sql`DROP TABLE IF EXISTS submissions CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS migrations CASCADE`;

    // Drop any materialized views
    console.info(chalk.dim('Dropping materialized views...'));
    await sql`DROP MATERIALIZED VIEW IF EXISTS user_stats CASCADE`;

    // Drop any functions
    console.info(chalk.dim('Dropping functions...'));
    await sql`DROP FUNCTION IF EXISTS refresh_user_stats() CASCADE`;
    await sql`DROP FUNCTION IF EXISTS update_user_stats() CASCADE`;

    // Drop any indexes that might exist independently
    console.info(chalk.dim('Dropping indexes...'));
    await sql`DROP INDEX IF EXISTS idx_submissions_user_id`;
    await sql`DROP INDEX IF EXISTS idx_submissions_author_id`;
    await sql`DROP INDEX IF EXISTS idx_accounts_provider_account_id`;
    await sql`DROP INDEX IF EXISTS idx_users_email`;

    console.info(
      chalk.green('✅ All tables, views, and functions dropped successfully')
    );
    console.info(
      chalk.blue(
        '🔄 You can now run migrations to recreate the database schema'
      )
    );
  } catch (error) {
    console.error(chalk.red('❌ Error dropping tables:'), error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the script
dropAllTables();
