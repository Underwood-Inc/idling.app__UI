import chalk from 'chalk';
import { existsSync, readdirSync, writeFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';
import sql from '../src/lib/db';

// Export this for testing
export const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

// Create readline interface as a function so we can mock it in tests
export const createReadlineInterface = () =>
  createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

// Add this helper function at the top of the file
export const fileUtils = {
  exists: (path: string) => existsSync(path)
};

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
    // If directory already exists, ignore the error
    if ((error as { code?: string }).code !== 'EEXIST') {
      throw error;
    }
  }
}

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

export async function exit(isTest = false) {
  // Don't exit the process during tests
  if (!isTest) {
    process.exit(0);
  }
}

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

// Add at the bottom of the file
if (process.argv[2] === 'main') {
  main(true);
}
