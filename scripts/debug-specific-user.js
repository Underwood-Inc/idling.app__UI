/* eslint-disable no-console */
// Debug script for OAuth account troubleshooting
// This script checks OAuth provider account relationships

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

async function debugSpecificUser() {
  try {
    console.log('🔍 Debugging Specific User Issues...');
    console.log('=========================================');

    // Check user by database ID 102
    console.log('\n👤 USER BY ID 102:');
    const userById = await sql`
      SELECT id, name, email, created_at 
      FROM users 
      WHERE id = 102
    `;
    console.table(userById);

    // Check account for user ID 102
    console.log('\n🔗 ACCOUNT FOR USER ID 102:');
    const accountByUserId = await sql`
      SELECT id, "userId", provider, "providerAccountId"
      FROM accounts 
      WHERE "userId" = 102
    `;
    console.table(accountByUserId);

    // Check account by OAuth providerAccountId 49897210 (for OAuth debugging)
    console.log('\n🔍 ACCOUNT BY PROVIDER ACCOUNT ID 49897210:');
    const accountByProvider = await sql`
      SELECT id, "userId", provider, "providerAccountId"
      FROM accounts 
      WHERE "providerAccountId" = '49897210'
    `;
    console.table(accountByProvider);

    // Check sessions for this user
    console.log('\n🔓 SESSIONS FOR PROVIDER ACCOUNT ID:');
    const sessions = await sql`
      SELECT s.*, u.name 
      FROM sessions s
      LEFT JOIN users u ON s."userId" = u.id
      WHERE s."userId" IN (
        SELECT "userId" FROM accounts WHERE "providerAccountId" = '49897210'
      )
      ORDER BY s.expires DESC
      LIMIT 5
    `;
    console.table(sessions);

    // Check if user 102 exists in users table
    console.log('\n📊 USER COUNT BY ID RANGE:');
    const userCounts = await sql`
      SELECT 
        COUNT(*) as total_users,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM users
    `;
    console.table(userCounts);

    // Check recent users above ID 100
    console.log('\n👥 RECENT USERS (ID > 100):');
    const recentUsers = await sql`
      SELECT u.id, u.name, u.email, a.provider, a."providerAccountId"
      FROM users u 
      LEFT JOIN accounts a ON u.id = a."userId"
      WHERE u.id > 100 
      ORDER BY u.id DESC 
      LIMIT 10
    `;
    console.table(recentUsers);

    // Find internal user ID from OAuth providerAccountId (for OAuth debugging)

    // Full user details with OAuth account info
  } catch (error) {
    console.error('❌ Database Error:', error);
  } finally {
    await sql.end();
  }
}

debugSpecificUser();
