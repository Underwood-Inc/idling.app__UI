const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres({
  host: process.env.POSTGRES_HOST?.trim(),
  user: process.env.POSTGRES_USER?.trim(),
  database: process.env.POSTGRES_DB?.trim(),
  password: process.env.POSTGRES_PASSWORD?.trim(),
  port: parseInt(process.env.POSTGRES_PORT?.trim() || '5432'),
  ssl: 'prefer'
});

async function cleanup() {
  try {
    const result = await sql`
      DELETE FROM migrations WHERE filename IN (
        '0017-create-missing-functions-simple.sql',
        '0018-create-user-stats-simple.sql'
      )
    `;
    console.log('✅ Deleted', result.count, 'failed migration records');
    console.log('✅ These migrations can now be retried');
    console.log('\nNext: Run migrations again:');
    console.log('tsx scripts/migrations.ts main');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

cleanup();
