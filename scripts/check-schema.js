const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...\n');

    // Get table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'submissions' 
      ORDER BY ordinal_position;
    `);

    console.log('📋 SUBMISSIONS TABLE STRUCTURE:');
    result.rows.forEach((row) => {
      console.log(
        `  ${row.column_name}: ${row.data_type}${row.is_nullable === 'NO' ? ' NOT NULL' : ''}`
      );
    });

    // Get existing indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'submissions' 
      ORDER BY indexname;
    `);

    console.log('\n🔍 EXISTING INDEXES:');
    indexes.rows.forEach((row) => {
      console.log(`  ${row.indexname}`);
      console.log(`    ${row.indexdef}`);
    });

    // Check materialized views
    const views = await pool.query(`
      SELECT schemaname, matviewname 
      FROM pg_matviews 
      ORDER BY matviewname;
    `);

    console.log('\n📊 MATERIALIZED VIEWS:');
    if (views.rows.length === 0) {
      console.log('  None found');
    } else {
      views.rows.forEach((row) => {
        console.log(`  ${row.matviewname}`);
      });
    }

    // Check functions
    const functions = await pool.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%refresh%'
      ORDER BY routine_name;
    `);

    console.log('\n⚙️ REFRESH FUNCTIONS:');
    if (functions.rows.length === 0) {
      console.log('  None found');
    } else {
      functions.rows.forEach((row) => {
        console.log(`  ${row.routine_name} (${row.routine_type})`);
      });
    }

    // Check if we have performance-critical indexes
    const criticalIndexes = [
      'idx_submissions_author_search',
      'idx_submissions_author_lower',
      'idx_submissions_tags_gin_advanced',
      'idx_submissions_perf_filter',
      'idx_submissions_pagination'
    ];

    console.log('\n🚀 PERFORMANCE INDEX STATUS:');
    for (const indexName of criticalIndexes) {
      const exists = indexes.rows.some((row) => row.indexname === indexName);
      console.log(`  ${indexName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
