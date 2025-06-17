// Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' }); // Load .env.local file

import chalk from 'chalk';
import { existsSync, readdirSync, writeFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';

// Debug: Log the environment variables being used
// eslint-disable-next-line no-console
console.log('🔍 Debug: Environment variables loaded:');
// eslint-disable-next-line no-console
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
// eslint-disable-next-line no-console
console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
// eslint-disable-next-line no-console
console.log('POSTGRES_DB:', process.env.POSTGRES_DB);
// eslint-disable-next-line no-console
console.log('POSTGRES_PORT:', process.env.POSTGRES_PORT);
// eslint-disable-next-line no-console
console.log(
  'POSTGRES_PASSWORD:',
  process.env.POSTGRES_PASSWORD ? '[SET]' : '[NOT SET]'
);

import sql from '../src/lib/db';

// Directory where all database migration files are stored
export const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

// Helper to create a CLI interface for user input
// See MIGRATIONS.README.md for usage examples
export const createReadlineInterface = () =>
  createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

// Utility functions extracted for easier testing
export const fileUtils = {
  exists: (path: string) => existsSync(path)
};

// Ensures the migrations directory exists, creating it if needed
// This runs before any migration operations can be performed
export async function ensureMigrationsDir() {
  try {
    console.info(
      chalk.dim(`Ensuring migrations directory exists: ${MIGRATIONS_DIR}`)
    );
    const migrationDirectoryExists = fileUtils.exists(MIGRATIONS_DIR);
    console.info(chalk.dim(`File exists: ${migrationDirectoryExists}`));
    if (!migrationDirectoryExists) {
      await mkdir(MIGRATIONS_DIR);
    }
  } catch (error) {
    // EEXIST error means directory was created by another process
    // This is safe to ignore in concurrent environments
    if ((error as { code?: string }).code !== 'EEXIST') {
      throw error;
    }
  }
}

// Determines the next sequential migration number
// Returns a zero-padded 4-digit string (e.g., "0000", "0001")
// See MIGRATIONS.README.md for naming convention details
export async function getNextMigrationNumber(): Promise<string> {
  const files = readdirSync(MIGRATIONS_DIR);

  // If no files exist, return '0000'
  if (files.length === 0) {
    console.info(
      chalk.dim('No migrations found, creating first migration file...')
    );
    return '0000';
  }

  console.info(
    chalk.dim(`Found ${files.length} migrations in ${MIGRATIONS_DIR}:`)
  );

  // Sort and display existing migration files
  files
    .sort()
    .forEach((file) => console.info(chalk.dim('  •'), formatFileName(file)));
  console.info(); // Add blank line after list

  // Extract numbers from filenames and convert to integers
  const numbers = files
    .filter((file) => file.endsWith('.sql'))
    .map((file) => parseInt(file.split('-')[0], 10))
    .filter((num) => !isNaN(num));

  // Find highest number and add 1
  const nextNumber = Math.max(...numbers) + 1;

  // Pad with leading zeros to 4 digits
  return nextNumber.toString().padStart(4, '0');
}

// Creates a new migration file with user-provided description
// Automatically numbers the migration and formats the filename
export async function createNewMigration(): Promise<void> {
  const nextNum = await getNextMigrationNumber();

  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(
      chalk.blue('\n? Enter migration description: '),
      async (description) => {
        const fileName = `${nextNum}-${description.toLowerCase().replace(/\s+/g, '-')}.sql`;
        const filePath = path.join(MIGRATIONS_DIR, fileName);
        // console.info(
        //   chalk.dim(`\nCreating migration file in migration dir: ${filePath}`)
        // );

        writeFileSync(filePath, `-- Migration: ${description}\n\n`);
        console.info(
          chalk.green('✓'),
          `Created new migration: ${formatFileName(fileName)}`
        );
        rl.close();
        resolve();
      }
    );
  });
}

// Creates the migrations tracking table if it doesn't exist
// This table records all migration attempts and their results
async function ensureMigrationsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      success BOOLEAN NOT NULL,
      error_message TEXT
    );
  `;
}

// Executes a single migration file within a transaction
// Tracks execution status in the migrations table
// See MIGRATIONS.README.md for transaction handling details
export async function runMigration(filePath: string, fileName: string) {
  try {
    // Ensure migrations table exists before checking it
    await ensureMigrationsTable();

    const existing = await sql`
      SELECT * FROM migrations WHERE filename = ${fileName} AND success = true
    `;

    if (existing.length > 0) {
      console.info(
        chalk.yellow('⚠'),
        `Skipping ${chalk.cyan(fileName)} - already executed`
      );
      return;
    }

    console.info(chalk.dim(`\nExecuting migration: ${chalk.cyan(fileName)}`));
    const migrationSql = require('fs').readFileSync(filePath, 'utf8');

    await sql.begin(async (transaction) => {
      // Execute the migration and capture the result
      const result = await transaction.unsafe(migrationSql);

      // If the last statement was a SELECT, display the results
      if (Array.isArray(result) && result.length > 0) {
        console.info(chalk.dim('\nQuery results:'));

        // Find the non-empty Result array (it's usually the second one)
        const dataResult = result.find((r) => Array.isArray(r) && r.length > 0);

        if (dataResult) {
          // The data is already in the correct format, just display it
          console.table(dataResult);
        }
      }

      await transaction`
        INSERT INTO migrations (filename, success, error_message)
        VALUES (${fileName}, true, null)
      `;
    });

    console.info(
      chalk.green('✓'),
      `Successfully executed ${chalk.cyan(fileName)}`
    );
  } catch (error) {
    await sql`
      INSERT INTO migrations (filename, success, error_message) 
      VALUES (${fileName}, false, ${error instanceof Error ? error.message : String(error)})
    `;

    console.error(
      chalk.red('✖'),
      `Failed to execute ${chalk.cyan(fileName)}:`
    );
    console.error(chalk.red('  Error:', error));
    throw error;
  }
}

// Executes all pending migrations in sequential order
// Filters for valid migration files (NNNN-description.sql)
// See MIGRATIONS.README.md for migration ordering details
export async function runAllMigrations() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}-.*\.sql$/.test(f))
    .sort();

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    // console.log(filePath);
    await runMigration(filePath, file);
  }
}

// Safely exits the process, with special handling for test environments
export async function exit(isTest = false) {
  // Don't exit the process during tests
  if (!isTest) {
    process.exit(0);
  }
}

// Main CLI interface for the migration system
// Provides options to:
// 1. Run all pending migrations
// 2. Create a new migration
// See MIGRATIONS.README.md for detailed usage instructions
export async function main(isTest = false) {
  await ensureMigrationsDir();
  await ensureMigrationsTable();

  console.info(chalk.bold('\n📦 Database Migration Tool'));
  console.info(chalk.dim('------------------------'));
  console.info(chalk.cyan('1.'), 'Run all migrations');
  console.info(chalk.cyan('2.'), 'Create new migration');

  const rl = createReadlineInterface();
  rl.question(chalk.blue('\n? Select an option: '), async (answer) => {
    try {
      switch (answer) {
        case '1':
          await runAllMigrations();
          break;
        case '2':
          await createNewMigration();
          break;
        default:
          console.info(chalk.yellow('⚠'), 'Invalid option');
      }
    } catch (error) {
      console.error(chalk.red('\n✖ Migration error:'), error);
    } finally {
      rl.close();
      await exit(isTest);
    }
  });
}

// Formats filenames for console output with color coding
// Helps distinguish between directory paths, filenames, and extensions
function formatFileName(fileName: string): string {
  // Split the file path into directory and name parts
  const parts = fileName.split('/');
  const name = parts.pop() || '';
  const directory = parts.join('/');

  // Split the name into base and extension
  const [base, ...extensions] = name.split('.');
  const extension = extensions.join('.');

  return directory
    ? `${chalk.dim(directory + '/')}${chalk.cyan(base)}${chalk.blue('.' + extension)}`
    : `${chalk.cyan(base)}${chalk.blue('.' + extension)}`;
}

// Entry point when script is run directly
if (process.argv[2] === 'main') {
  main(true);
}
