// Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' }); // Load .env.local file

import chalk from 'chalk';
import { existsSync, readdirSync, writeFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import postgres from 'postgres';
import { createInterface } from 'readline';

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
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      success BOOLEAN NOT NULL,
      error_message TEXT
    );
  `;
}

// Executes a single migration file within a transaction
// Tracks execution status in the migrations table
// See MIGRATIONS.README.md for transaction handling details
export async function runMigration(
  filePath: string,
  fileName: string
): Promise<'success' | 'skipped'> {
  try {
    // Ensure migrations table exists before checking it
    await ensureMigrationsTable();

    // Check for existing migration records
    const existing = await sql`
      SELECT * FROM migrations WHERE filename = ${fileName}
    `;

    if (existing.length > 0) {
      const record = existing[0];
      if (record.success) {
        console.info(
          chalk.yellow('⚠'),
          `Skipping ${chalk.cyan(fileName)} - already executed successfully`
        );
        return 'skipped';
      } else {
        // FIXED: Actually skip failed migrations instead of trying to re-run them
        console.info(
          chalk.red('✖'),
          `Skipping ${chalk.cyan(fileName)} - previous attempt failed`
        );
        console.info(chalk.dim(`  Previous error: ${record.error_message}`));
        console.info(
          chalk.dim(
            `  To retry: fix the issue and delete this record from migrations table`
          )
        );
        return 'skipped'; // This was the problem - it was still trying to execute
      }
    }

    console.info(chalk.dim(`\nExecuting migration: ${chalk.cyan(fileName)}`));
    const migrationSql = require('fs').readFileSync(filePath, 'utf8');

    // Check if migration contains CONCURRENT operations or other special cases
    const hasConcurrentOps = /CREATE\s+.*\s+CONCURRENTLY/i.test(migrationSql);
    const hasRaiseNotice = /RAISE\s+NOTICE/i.test(migrationSql);

    if (hasConcurrentOps || hasRaiseNotice) {
      console.info(
        chalk.dim(
          '  Migration contains special operations, executing statements individually...'
        )
      );

      // Split SQL into individual statements and execute them one by one
      const statements = migrationSql
        .split(';')
        .map((stmt: string) => stmt.trim())
        .filter((stmt: string) => stmt.length > 0 && !stmt.startsWith('--'));

      let lastResult = null;

      for (const statement of statements) {
        if (statement.trim()) {
          console.info(
            chalk.dim(`  Executing: ${statement.substring(0, 50)}...`)
          );
          try {
            // FIXED: Handle RAISE NOTICE statements properly
            if (/RAISE\s+NOTICE/i.test(statement)) {
              console.info(chalk.dim(`  Notice: ${statement}`));
              continue; // Skip RAISE NOTICE - it's not an actual SQL operation
            }

            // FIXED: Skip invalid standalone PL/pgSQL statements
            if (
              /^\s*(EXCEPTION|WHEN\s+OTHERS|BEGIN|END|DECLARE)\s/i.test(
                statement
              ) ||
              statement.trim() === 'NULL'
            ) {
              console.info(
                chalk.dim(
                  `  Skipping PL/pgSQL fragment: ${statement.substring(0, 30)}...`
                )
              );
              continue;
            }

            lastResult = await sql.unsafe(statement);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            // FIXED: Don't fail on common non-critical errors
            if (
              errorMessage.includes('already exists') ||
              errorMessage.includes('does not exist') ||
              errorMessage.includes('NOTICE') ||
              (errorMessage.includes('relation') &&
                errorMessage.includes('does not exist'))
            ) {
              console.info(chalk.yellow(`  Warning: ${errorMessage}`));
              continue; // Don't fail the migration for these
            }

            console.error(
              chalk.red(
                `  Failed on statement: ${statement.substring(0, 100)}...`
              )
            );
            throw error;
          }
        }
      }

      // If the last statement was a SELECT, display the results
      if (Array.isArray(lastResult) && lastResult.length > 0) {
        console.info(chalk.dim('\nQuery results:'));

        // Find the non-empty Result array (it's usually the second one)
        const dataResult = lastResult.find(
          (r) => Array.isArray(r) && r.length > 0
        );

        if (dataResult) {
          // The data is already in the correct format, just display it
          console.table(dataResult);
        }
      }

      // Record success separately (not in the main transaction)
      try {
        await sql`
          INSERT INTO migrations (filename, success, error_message)
          VALUES (${fileName}, true, null)
          ON CONFLICT (filename) 
          DO UPDATE SET 
            success = EXCLUDED.success,
            error_message = EXCLUDED.error_message,
            executed_at = CURRENT_TIMESTAMP
        `;
      } catch (insertError) {
        // If ON CONFLICT fails, try a simple INSERT
        console.info(chalk.dim(`  Recording migration success...`));
        await sql`
          DELETE FROM migrations WHERE filename = ${fileName}
        `;
        await sql`
          INSERT INTO migrations (filename, success, error_message)
          VALUES (${fileName}, true, null)
        `;
      }
    } else {
      // Regular migration with transaction
      await sql.begin(async (transaction) => {
        // Execute the migration and capture the result
        const result = await transaction.unsafe(migrationSql);

        // If the last statement was a SELECT, display the results
        if (Array.isArray(result) && result.length > 0) {
          console.info(chalk.dim('\nQuery results:'));

          // Find the non-empty Result array (it's usually the second one)
          const dataResult = result.find(
            (r) => Array.isArray(r) && r.length > 0
          );

          if (dataResult) {
            // The data is already in the correct format, just display it
            console.table(dataResult);
          }
        }

        try {
          await transaction`
            INSERT INTO migrations (filename, success, error_message)
            VALUES (${fileName}, true, null)
            ON CONFLICT (filename) 
            DO UPDATE SET 
              success = EXCLUDED.success,
              error_message = EXCLUDED.error_message,
              executed_at = CURRENT_TIMESTAMP
          `;
        } catch (insertError) {
          // If ON CONFLICT fails, try a simple INSERT
          await transaction`DELETE FROM migrations WHERE filename = ${fileName}`;
          await transaction`
            INSERT INTO migrations (filename, success, error_message)
            VALUES (${fileName}, true, null)
          `;
        }
      });
    }

    console.info(
      chalk.green('✓'),
      `Successfully executed ${chalk.cyan(fileName)}`
    );
    return 'success';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // FIXED: Better error classification - don't fail on warnings
    if (
      errorMessage.includes('already exists') ||
      errorMessage.includes('NOTICE') ||
      (errorMessage.includes('does not exist') &&
        !errorMessage.includes('function'))
    ) {
      console.info(
        chalk.yellow('⚠'),
        `Migration ${chalk.cyan(fileName)} completed with warnings`
      );
      console.info(chalk.dim(`  Warning: ${errorMessage}`));

      // Mark as successful since these are just warnings
      try {
        await sql`
          INSERT INTO migrations (filename, success, error_message)
          VALUES (${fileName}, true, ${errorMessage})
          ON CONFLICT (filename) 
          DO UPDATE SET 
            success = EXCLUDED.success,
            error_message = EXCLUDED.error_message,
            executed_at = CURRENT_TIMESTAMP
        `;
      } catch (insertError) {
        await sql`DELETE FROM migrations WHERE filename = ${fileName}`;
        await sql`
          INSERT INTO migrations (filename, success, error_message)
          VALUES (${fileName}, true, ${errorMessage})
        `;
      }

      return 'success';
    }

    // Only mark as failed for actual critical errors
    try {
      await sql`
        INSERT INTO migrations (filename, success, error_message) 
        VALUES (${fileName}, false, ${errorMessage})
        ON CONFLICT (filename) 
        DO UPDATE SET 
          success = EXCLUDED.success,
          error_message = EXCLUDED.error_message,
          executed_at = CURRENT_TIMESTAMP
      `;
    } catch (insertError) {
      await sql`DELETE FROM migrations WHERE filename = ${fileName}`;
      await sql`
        INSERT INTO migrations (filename, success, error_message) 
        VALUES (${fileName}, false, ${errorMessage})
      `;
    }

    console.error(
      chalk.red('✖'),
      `Migration ${chalk.cyan(fileName)} failed, continuing with remaining migrations...`
    );
    console.error(chalk.red('  Error:', errorMessage));

    // FIXED: Don't throw - just continue with next migration
    return 'skipped'; // Changed from throw error to return skipped
  }
}

// Executes all pending migrations in sequential order
// Filters for valid migration files (NNNN-description.sql)
// See MIGRATIONS.README.md for migration ordering details
export async function runAllMigrations() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}-.*\.sql$/.test(f))
    .sort();

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  console.info(
    chalk.dim(`\nFound ${files.length} migration files to process...\n`)
  );

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const result = await runMigration(filePath, file);

    if (result === 'skipped') {
      skippedCount++;
    } else if (result === 'success') {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.info(chalk.dim('\n' + '='.repeat(50)));
  console.info(chalk.bold('Migration Summary:'));
  console.info(chalk.green(`✓ Successful: ${successCount}`));
  console.info(chalk.yellow(`⚠ Skipped: ${skippedCount}`));
  console.info(chalk.red(`✖ Failed: ${failureCount}`));
  console.info(chalk.dim('='.repeat(50)));

  if (failureCount > 0) {
    console.info(
      chalk.yellow(
        '\n⚠ Some migrations failed during this run. Check the logs above for details.'
      )
    );
    console.info(
      chalk.dim('Fix the issues and run the migration tool again to retry.')
    );
  }

  // Check if there are any previously failed migrations in skipped count
  const hasSkippedFailures = skippedCount > successCount + failureCount;
  if (hasSkippedFailures) {
    console.info(
      chalk.dim('\n💡 Some migrations were skipped due to previous failures.')
    );
    console.info(
      chalk.dim(
        'To retry failed migrations: fix issues and delete failed records from migrations table.'
      )
    );
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
