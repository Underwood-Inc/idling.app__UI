/* eslint-disable no-console */
/* eslint-env node */
/* global Promise */

// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

// Check if we're in a devcontainer environment
const isDevContainer = process.env.HOME?.includes('devcontainers');
console.info('is dockerized?', process.env.IS_DOCKERIZED);
console.info('is devcontainer?', isDevContainer);

// ================================
// ULTRA-LIGHTWEIGHT CONFIGURATION
// ================================
const SEED_USERS_COUNT = 5000;
const SEED_POSTS_COUNT = 20000;
const SEED_REPLIES_COUNT = 40000;
const SEED_NESTED_REPLIES_COUNT = 20000;
const BATCH_SIZE = 100; // Ultra-small batches to prevent locks
const BATCH_DELAY = 10; // ms delay between batches
const SKIP_MATERIALIZED_VIEW = process.env.SKIP_MATERIALIZED_VIEW === 'true';

// Database connection with production-safe settings (same as original script)
const sql = postgres({
  host:
    process.env.POSTGRES_HOST ||
    (process.env.IS_DOCKERIZED ? 'postgres' : 'localhost'),
  user: process.env.POSTGRES_USER || 'postgres',
  database: process.env.POSTGRES_DB || 'idling',
  password:
    process.env.POSTGRES_PASSWORD ||
    process.env.DOCKER_POSTGRES_PASSWORD ||
    'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  ssl: 'prefer',
  max: 1, // Single connection to prevent connection pool issues
  idle_timeout: 20,
  connect_timeout: 30,
  statement_timeout: 10000, // 10 second timeout per statement
  transform: {
    undefined: null
  },
  prepare: false
});

// ================================
// ULTRA-SIMPLE DATA GENERATORS
// ================================

const SIMPLE_NAMES = [
  'Alex',
  'Sam',
  'Jordan',
  'Taylor',
  'Casey',
  'Riley',
  'Avery',
  'Quinn'
];
const SIMPLE_WORDS = [
  'cool',
  'awesome',
  'great',
  'nice',
  'good',
  'fun',
  'amazing',
  'perfect'
];
const SIMPLE_TAGS = [
  'tech',
  'life',
  'work',
  'fun',
  'news',
  'update',
  'idea',
  'thought'
];

function generateSimpleUser(index) {
  const name = SIMPLE_NAMES[index % SIMPLE_NAMES.length];
  const num = Math.floor(index / SIMPLE_NAMES.length) + 1;
  return {
    author_id: `user_${String(index).padStart(8, '0')}`, // String ID for submissions table
    author: `${name}${num}`,
    name: `${name}${num}` // For users table
  };
}

function generateSimpleContent(index) {
  const word1 = SIMPLE_WORDS[index % SIMPLE_WORDS.length];
  const word2 = SIMPLE_WORDS[(index + 1) % SIMPLE_WORDS.length];
  const tag = SIMPLE_TAGS[index % SIMPLE_TAGS.length];
  return `This is ${word1} and ${word2} content #${tag}`;
}

// ================================
// PRODUCTION-SAFE FUNCTIONS
// ================================

/**
 * Clear database with minimal impact
 */
async function clearDatabase() {
  console.log('🧹 Clearing database...');
  try {
    await sql`TRUNCATE TABLE submissions RESTART IDENTITY CASCADE`;
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Failed to clear database:', error.message);
    throw error;
  }
}

/**
 * Create users in ultra-small batches
 */
async function createUsers(count) {
  console.log(`👥 Creating ${count} users in micro-batches...`);

  let created = 0;
  const batches = Math.ceil(count / BATCH_SIZE);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchSize = Math.min(BATCH_SIZE, count - batchStart);

    const users = [];
    for (let i = 0; i < batchSize; i++) {
      const user = generateSimpleUser(batchStart + i);
      // Users table only needs name and email (id is auto-generated SERIAL)
      users.push([user.name, null]); // name, email (null for now)
    }

    await sql`
      INSERT INTO users (name, email) 
      VALUES ${sql(users)}
    `;

    created += batchSize;

    if (created % 1000 === 0) {
      console.log(`  Created ${created}/${count} users...`);
    }

    // Micro-delay to prevent overwhelming the database
    if (BATCH_DELAY > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`✅ Created ${created} users`);
  // Return the user data for submissions (with string author_ids)
  return Array.from({ length: count }, (_, i) => generateSimpleUser(i));
}

/**
 * Create posts with mathematical ID tracking (no queries)
 */
async function createPosts(users, count) {
  console.log(`📝 Creating ${count} posts in micro-batches...`);

  let created = 0;
  let currentId = 1; // Start from ID 1
  const createdIds = [];
  const batches = Math.ceil(count / BATCH_SIZE);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchSize = Math.min(BATCH_SIZE, count - batchStart);

    const posts = [];
    for (let i = 0; i < batchSize; i++) {
      const postIndex = batchStart + i;
      const user = users[postIndex % users.length];
      const content = generateSimpleContent(postIndex);

      posts.push([
        content, // submission_name
        `Post ${postIndex + 1}`, // submission_title
        user.author_id, // author_id
        user.author, // author
        ['general'], // tags (simple array)
        null, // thread_parent_id
        new Date() // submission_datetime
      ]);

      // Track ID mathematically
      createdIds.push(currentId + i);
    }

    await sql`
      INSERT INTO submissions (
        submission_name, submission_title, author_id, author, tags, thread_parent_id, submission_datetime
      ) VALUES ${sql(posts)}
    `;

    currentId += batchSize;
    created += batchSize;

    if (created % 5000 === 0) {
      console.log(`  Created ${created}/${count} posts...`);
    }

    if (BATCH_DELAY > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`✅ Created ${created} posts`);
  return { ids: createdIds, nextId: currentId };
}

/**
 * Create replies with mathematical ID tracking (no queries)
 */
async function createReplies(users, parentIds, count, startId) {
  console.log(`💬 Creating ${count} replies in micro-batches...`);

  let created = 0;
  let currentId = startId;
  const createdIds = [];
  const batches = Math.ceil(count / BATCH_SIZE);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchSize = Math.min(BATCH_SIZE, count - batchStart);

    const replies = [];
    for (let i = 0; i < batchSize; i++) {
      const replyIndex = batchStart + i;
      const user = users[replyIndex % users.length];
      const parentId = parentIds[replyIndex % parentIds.length]; // Simple round-robin
      const content = generateSimpleContent(replyIndex + 100000);

      replies.push([
        content,
        `Reply ${replyIndex + 1}`,
        user.author_id,
        user.author,
        ['reply'],
        parentId,
        new Date()
      ]);

      createdIds.push(currentId + i);
    }

    await sql`
      INSERT INTO submissions (
        submission_name, submission_title, author_id, author, tags, thread_parent_id, submission_datetime
      ) VALUES ${sql(replies)}
    `;

    currentId += batchSize;
    created += batchSize;

    if (created % 10000 === 0) {
      console.log(`  Created ${created}/${count} replies...`);
    }

    if (BATCH_DELAY > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`✅ Created ${created} replies`);
  return { ids: createdIds, nextId: currentId };
}

/**
 * Lightweight statistics without complex queries
 */
async function showStats() {
  console.log('\n📊 Final Statistics:');
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN thread_parent_id IS NULL THEN 1 END) as posts,
        COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as replies
      FROM submissions
    `;

    console.log(`  Total Records: ${stats[0].total}`);
    console.log(`  Posts: ${stats[0].posts}`);
    console.log(`  Replies: ${stats[0].replies}`);
  } catch (error) {
    console.warn('⚠️  Could not fetch statistics:', error.message);
  }
}

/**
 * Optional materialized view refresh with timeout
 */
async function refreshViews() {
  if (SKIP_MATERIALIZED_VIEW) {
    console.log('⏭️  Skipping materialized view refresh');
    return;
  }

  console.log('🔄 Refreshing materialized views...');
  try {
    await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY submission_stats_mv`;
    console.log('✅ Materialized views refreshed');
  } catch (error) {
    console.warn('⚠️  Materialized view refresh failed:', error.message);
    console.log('   This is non-critical, continuing...');
  }
}

// ================================
// MAIN EXECUTION
// ================================

async function main() {
  const startTime = Date.now();

  console.log('🚀 Starting LIGHTWEIGHT seed generation...');
  console.log(
    `📊 Target: ${SEED_USERS_COUNT} users, ${SEED_POSTS_COUNT} posts, ${SEED_REPLIES_COUNT} replies`
  );
  console.log(`⚡ Batch size: ${BATCH_SIZE}, Delay: ${BATCH_DELAY}ms`);

  try {
    // Step 1: Clear database
    await clearDatabase();

    // Step 2: Create users
    const users = await createUsers(SEED_USERS_COUNT);

    // Step 3: Create posts
    const posts = await createPosts(users, SEED_POSTS_COUNT);

    // Step 4: Create replies
    const replies = await createReplies(
      users,
      posts.ids,
      SEED_REPLIES_COUNT,
      posts.nextId
    );

    // Step 5: Create nested replies
    await createReplies(
      users,
      replies.ids,
      SEED_NESTED_REPLIES_COUNT,
      replies.nextId
    );

    // Step 6: Refresh views (optional)
    await refreshViews();

    // Step 7: Show statistics
    await showStats();

    const duration = (Date.now() - startTime) / 1000;
    const totalRecords =
      SEED_USERS_COUNT +
      SEED_POSTS_COUNT +
      SEED_REPLIES_COUNT +
      SEED_NESTED_REPLIES_COUNT;
    const recordsPerSecond = Math.round(totalRecords / duration);

    console.log(
      `\n🎉 Lightweight seed completed in ${duration.toFixed(2)} seconds!`
    );
    console.log(`📈 Performance: ${recordsPerSecond} records/second`);
  } catch (error) {
    console.error('❌ Seed generation failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
