#!/usr/bin/env node

/* eslint-disable no-console, no-undef */

/**
 * TEST SEED SCRIPT - Small Scale Test
 * Tests the unique username generation system
 */

const postgres = require('postgres');

// Database connection using environment variables
const sql = postgres({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'idling',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD
});

// Small test configuration
const SEED_USERS_COUNT = 50; // Small number for testing
const SEED_POSTS_COUNT = 100; // Small number for testing
const SEED_REPLIES_COUNT = 200; // Small number for testing
const BATCH_SIZE = 25; // Small batch size

// Import the functions from the main seed script
const {
  generateUniqueUsers,
  generatePostContent,
  FIRST_NAMES,
  LAST_NAMES
} = require('./seed-db.js');

/**
 * Test unique username generation
 */
async function testUniqueUsernames() {
  console.log('🧪 Testing unique username generation...');

  // Generate users
  const users = generateUniqueUsers(SEED_USERS_COUNT);

  // Check for duplicates
  const usernames = users.map((u) => u.author);
  const uniqueUsernames = [...new Set(usernames)];

  console.log(`Generated ${users.length} users`);
  console.log(`Unique usernames: ${uniqueUsernames.length}`);
  console.log(
    `No duplicates: ${users.length === uniqueUsernames.length ? '✅ PASSED' : '❌ FAILED'}`
  );

  // Show first 10 users
  console.log('\nFirst 10 users:');
  users.slice(0, 10).forEach((user, index) => {
    console.log(
      `  ${index + 1}. ${user.author} (${user.author_id}) - ${user.email}`
    );
  });

  return users;
}

/**
 * Test content generation
 */
function testContentGeneration(users) {
  console.log('\n🧪 Testing content generation...');

  // Generate 5 sample posts
  for (let i = 0; i < 5; i++) {
    const content = generatePostContent(users, i);
    console.log(`  Post ${i + 1}: ${content}`);
  }
}

/**
 * Test database insertion (small scale)
 */
async function testDatabaseInsertion(users) {
  console.log('\n🧪 Testing database insertion...');

  try {
    // Clear test data
    await sql`DELETE FROM submissions WHERE submission_title LIKE 'TEST_%'`;

    // Insert a small batch of test posts
    const testPosts = [];
    for (let i = 0; i < 5; i++) {
      const user = users[i % users.length];
      const content = generatePostContent(users, i);

      testPosts.push({
        submission_name: content,
        submission_title: `TEST_Post_${i + 1}`,
        author_id: user.author_id,
        author: user.author,
        tags: ['test', 'unique'],
        thread_parent_id: null,
        submission_datetime: new Date()
      });
    }

    // Insert test posts
    await sql`
      INSERT INTO submissions (
        submission_name, submission_title, author_id, author, tags, thread_parent_id, submission_datetime
      ) ${sql(testPosts)}
    `;

    // Verify insertion
    const insertedPosts = await sql`
      SELECT author, submission_title FROM submissions 
      WHERE submission_title LIKE 'TEST_%'
      ORDER BY submission_title
    `;

    console.log(`✅ Inserted ${insertedPosts.length} test posts`);
    insertedPosts.forEach((post) => {
      console.log(`  ${post.submission_title}: ${post.author}`);
    });

    // Check for duplicate authors in test posts
    const testAuthors = insertedPosts.map((p) => p.author);
    const uniqueTestAuthors = [...new Set(testAuthors)];
    console.log(
      `Unique authors in test: ${uniqueTestAuthors.length}/${testAuthors.length}`
    );

    // Clean up test data
    await sql`DELETE FROM submissions WHERE submission_title LIKE 'TEST_%'`;
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Starting UNIQUE USERNAME TEST...\n');

  try {
    // Test 1: Username generation
    const users = await testUniqueUsernames();

    // Test 2: Content generation
    testContentGeneration(users);

    // Test 3: Database insertion
    await testDatabaseInsertion(users);

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sql.end();
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}
