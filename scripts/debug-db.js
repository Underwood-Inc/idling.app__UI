/* eslint-disable no-console */
// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

// Create database connection AFTER environment variables are loaded
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: 'prefer',
  onnotice: () => {}, // Ignore NOTICE statements - they're not errors
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

async function debugDatabase() {
  try {
    console.log('🔍 Debugging Database State...');
    console.log('=====================================');

    // Check users table
    console.log('\n👥 USERS:');
    const users = await sql`
      SELECT id, name, email, created_at 
      FROM users 
      ORDER BY id 
      LIMIT 10
    `;
    console.table(users);

    // Check accounts table
    console.log('\n🔗 ACCOUNTS:');
    const accounts = await sql`
      SELECT id, "userId", provider, "providerAccountId"
      FROM accounts 
      ORDER BY id 
      LIMIT 10
    `;
    console.table(accounts);

    // Check joined data
    console.log('\n🔄 JOINED USER-ACCOUNTS:');
    const joined = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        a.provider, 
        a."providerAccountId"
      FROM users u 
      LEFT JOIN accounts a ON u.id = a."userId" 
      ORDER BY u.id 
      LIMIT 10
    `;
    console.table(joined);

    // Check for user with providerAccountId 49897210
    console.log('\n🔍 SPECIFIC USER LOOKUP (providerAccountId: 49897210):');
    const specificUser = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        a.provider, 
        a."providerAccountId"
      FROM users u 
      JOIN accounts a ON u.id = a."userId" 
      WHERE a."providerAccountId" = '49897210'
    `;
    console.table(specificUser);

    // Check submissions table
    console.log('\n📝 RECENT SUBMISSIONS:');
    const submissions = await sql`
      SELECT 
        submission_id, 
        submission_title, 
        user_id, 
        author_provider_account_id,
        submission_datetime
      FROM submissions 
      ORDER BY submission_datetime DESC 
      LIMIT 5
    `;
    console.table(submissions);

    // Check if windows_emojis table exists
    console.log('\n😀 EMOJI TABLES:');
    const emojiTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%emoji%'
    `;
    console.table(emojiTables);
  } catch (error) {
    console.error('❌ Database Error:', error);
  } finally {
    await sql.end();
  }
}

debugDatabase();
