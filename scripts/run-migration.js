#!/usr/bin/env node

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Use the same connection pattern as the rest of the app
  const sql = postgres({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    onnotice: () => {}, // Ignore NOTICE statements
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false
  });

  try {
    console.log('Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/0017-create-og-generations-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration using postgres template literal
    await sql.unsafe(migrationSQL);
    console.log('Migration 0017-create-og-generations-table.sql executed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Check if required environment variables are provided
if (!process.env.POSTGRES_HOST || !process.env.POSTGRES_USER || !process.env.POSTGRES_DB || !process.env.POSTGRES_PASSWORD) {
  console.error('Required database environment variables are missing');
  console.error('Required: POSTGRES_HOST, POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD');
  process.exit(1);
}

runMigration(); 