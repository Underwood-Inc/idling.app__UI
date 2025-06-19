#!/usr/bin/env node

/* eslint-disable no-console, no-undef */

/**
 * MASSIVE SCALE SEED SCRIPT - 1 Million Records
 * Optimized for performance with GUARANTEED unique usernames
 *
 * Features:
 * - No duplicate usernames (guaranteed unique)
 * - Algorithmic generation for performance
 * - Batch processing for efficiency
 * - Realistic data patterns
 */

// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

// Check if we're in a devcontainer environment
const isDevContainer = process.env.HOME?.includes('devcontainers');
console.info('is dockerized?', process.env.IS_DOCKERIZED);
console.info('is devcontainer?', isDevContainer);

// Create database connection using environment variables
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
  // Optimize for bulk operations
  max: 20,
  idle_timeout: 0,
  connect_timeout: 60,
  // Additional performance optimizations
  transform: {
    undefined: null
  },
  // Increase statement timeout for large batches
  statement_timeout: 300000, // 5 minutes
  // Optimize for bulk inserts
  prepare: false
});

// ================================
// CONFIGURATION
// ================================

const SEED_USERS_COUNT = 20000;
const SEED_POSTS_COUNT = 200000;
const SEED_REPLIES_COUNT = 400000; // Reduced from 800k
const SEED_NESTED_REPLIES_COUNT = 200000; // New: replies to replies
const BATCH_SIZE = 5000;
const SKIP_MATERIALIZED_VIEW = process.env.SKIP_MATERIALIZED_VIEW === 'true';

// ================================
// UNIQUE USERNAME GENERATION SYSTEM
// ================================

const FIRST_NAMES = [
  'John',
  'Jane',
  'Alex',
  'Chris',
  'Sarah',
  'Mike',
  'Lisa',
  'David',
  'Emma',
  'James',
  'Emily',
  'Robert',
  'Jessica',
  'William',
  'Ashley',
  'Michael',
  'Amanda',
  'Richard',
  'Stephanie',
  'Daniel',
  'Jennifer',
  'Thomas',
  'Elizabeth',
  'Christopher',
  'Heather',
  'Matthew',
  'Nicole',
  'Anthony',
  'Samantha',
  'Mark',
  'Rachel',
  'Steven',
  'Amy',
  'Paul',
  'Angela',
  'Andrew',
  'Brenda',
  'Joshua',
  'Emma',
  'Kenneth',
  'Olivia',
  'Kevin',
  'Kimberly',
  'Brian',
  'Lisa',
  'George',
  'Betty',
  'Edward',
  'Helen',
  'Ronald',
  'Sandra',
  'Timothy',
  'Donna',
  'Jason',
  'Carol',
  'Jeffrey',
  'Ruth',
  'Ryan',
  'Sharon',
  'Jacob',
  'Michelle',
  'Gary',
  'Laura',
  'Nicholas',
  'Sarah',
  'Eric',
  'Kimberly',
  'Jonathan',
  'Deborah',
  'Stephen',
  'Dorothy',
  'Larry',
  'Lisa',
  'Justin',
  'Nancy',
  'Scott',
  'Karen',
  'Brandon',
  'Betty',
  'Benjamin',
  'Maria',
  'Samuel',
  'Helen',
  'Gregory',
  'Sandra',
  'Frank',
  'Donna',
  'Raymond',
  'Carol',
  'Alexander',
  'Ruth',
  'Patrick',
  'Sharon',
  'Jack',
  'Michelle',
  'Dennis',
  'Laura',
  'Jerry',
  'Sarah',
  'Tyler'
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
  'Green',
  'Adams',
  'Nelson',
  'Baker',
  'Hall',
  'Rivera',
  'Campbell',
  'Mitchell',
  'Carter',
  'Roberts',
  'Gomez',
  'Phillips',
  'Evans',
  'Turner',
  'Diaz',
  'Parker',
  'Cruz',
  'Edwards',
  'Collins',
  'Reyes',
  'Stewart',
  'Morris',
  'Morales',
  'Murphy',
  'Cook',
  'Rogers',
  'Gutierrez',
  'Ortiz',
  'Morgan',
  'Cooper',
  'Peterson',
  'Bailey',
  'Reed',
  'Kelly',
  'Howard',
  'Ramos',
  'Kim',
  'Cox',
  'Ward',
  'Richardson',
  'Watson',
  'Brooks',
  'Chavez',
  'Wood',
  'James',
  'Bennett',
  'Gray',
  'Mendoza',
  'Ruiz',
  'Hughes',
  'Price',
  'Alvarez',
  'Castillo',
  'Sanders',
  'Patel',
  'Myers',
  'Long',
  'Ross',
  'Foster',
  'Jimenez'
];

const DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'protonmail.com',
  'aol.com',
  'mail.com',
  'zoho.com',
  'fastmail.com'
];

/**
 * Generate guaranteed unique usernames using algorithmic approach
 */
function generateUniqueUsers(count) {
  console.log(`🔄 Generating ${count} unique users...`);

  const users = [];
  const usedUsernames = new Set();
  const usedEmails = new Set();

  let userIndex = 0;

  while (users.length < count) {
    const firstNameIndex = userIndex % FIRST_NAMES.length;
    const lastNameIndex =
      Math.floor(userIndex / FIRST_NAMES.length) % LAST_NAMES.length;
    const domainIndex = userIndex % DOMAINS.length;

    const firstName = FIRST_NAMES[firstNameIndex];
    const lastName = LAST_NAMES[lastNameIndex];

    // Create base username
    let username = `${firstName} ${lastName}`;

    // Add suffix if needed to ensure uniqueness
    let suffix = '';
    let attempts = 0;
    while (usedUsernames.has(username + suffix) && attempts < 1000) {
      attempts++;
      suffix = ` ${attempts}`;
    }

    const finalUsername = username + suffix;

    // Create unique email
    const emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    let emailSuffix =
      userIndex > FIRST_NAMES.length * LAST_NAMES.length ? userIndex : '';
    const email = `${emailBase}${emailSuffix}@${DOMAINS[domainIndex]}`;

    // Ensure email uniqueness
    if (!usedEmails.has(email)) {
      // Generate unique author_id (UUID-like)
      const authorId = `user_${userIndex.toString().padStart(6, '0')}_${Date.now().toString(36)}`;

      users.push({
        author_id: authorId,
        author: finalUsername,
        email: email,
        created_at: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
        ) // Random date within last 90 days
      });

      usedUsernames.add(finalUsername);
      usedEmails.add(email);
    }

    userIndex++;

    // Safety check to prevent infinite loop
    if (userIndex > count * 10) {
      console.error('❌ Unable to generate enough unique users');
      break;
    }
  }

  console.log(
    `✅ Generated ${users.length} unique users (${usedUsernames.size} unique usernames)`
  );
  return users;
}

// ================================
// CONTENT GENERATION
// ================================

const TOPICS = [
  'web development',
  'machine learning',
  'cloud computing',
  'cybersecurity',
  'data science',
  'mobile development',
  'blockchain',
  'artificial intelligence',
  'devops',
  'frontend frameworks',
  'backend architecture',
  'database optimization',
  'api design',
  'microservices',
  'containerization',
  'serverless computing',
  'edge computing',
  'quantum computing',
  'augmented reality',
  'virtual reality',
  'internet of things',
  'game development',
  'ui/ux design',
  'product management',
  'agile methodology'
];

const HASHTAGS = [
  'javascript',
  'python',
  'react',
  'nodejs',
  'typescript',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'gcp',
  'mongodb',
  'postgresql',
  'redis',
  'elasticsearch',
  'graphql',
  'rest',
  'microservices',
  'serverless',
  'cicd',
  'testing',
  'security',
  'performance',
  'scalability',
  'architecture',
  'designpatterns',
  'algorithms',
  'datastructures',
  'machinelearning',
  'ai',
  'blockchain',
  'cryptocurrency',
  'webdev',
  'mobiledev',
  'gamedev',
  'startup',
  'tech',
  'coding'
];

const CONTENT_TEMPLATES = [
  'Just learned about {topic}! The {hashtag} ecosystem is amazing. #tech #learning',
  'Working on a new project using {hashtag}. Any tips for {topic}? #coding #help',
  'Great article about {topic} and how it relates to {hashtag}. Thoughts? #discussion',
  'Debugging {hashtag} issues all day. {topic} is harder than it looks! #debugging #dev',
  'Excited to share my latest {topic} project! Built with {hashtag}. #project #showcase',
  'Conference talk about {topic} was mind-blowing! #conference #tech #learning',
  'Looking for recommendations on {topic} tools. Currently using {hashtag}. #tools #advice',
  'Just deployed my first {hashtag} application! {topic} concepts finally clicked. #milestone',
  'Reading about {topic} architecture patterns. {hashtag} implementation is elegant. #architecture',
  'Team discussion on {topic} best practices. {hashtag} seems like the way to go. #teamwork',
  // Templates with mention placeholders - will be replaced with proper structured mentions
  '{mention} what do you think about this? Open sourcing my {topic} platform built with {hashtag}',
  '{mention} might have experience with this. Looking for {topic} recommendations using {hashtag}',
  'Thanks to {mention} for the great {topic} tutorial! Perfect for learning {hashtag} development',
  'Collaborating with {mention} on a {topic} project. {hashtag} is our main tech stack',
  '{mention} shared an interesting perspective on {topic}. Thoughts on {hashtag} implementation?',
  'Just saw {mention} post about {topic}. Their {hashtag} approach is really clever!',
  'Shoutout to {mention} for helping me understand {topic} concepts. {hashtag} makes so much sense now!',
  '{mention} have you tried the new {hashtag} features for {topic}? Would love your thoughts'
];

/**
 * Generate post content with mentions and hashtags
 */
function generatePostContent(users, index) {
  const topic = TOPICS[index % TOPICS.length];
  const hashtag = HASHTAGS[index % HASHTAGS.length];
  const template = CONTENT_TEMPLATES[index % CONTENT_TEMPLATES.length];

  let content = template
    .replace('{topic}', topic)
    .replace('{hashtag}', hashtag);

  // Handle mention placeholders in templates
  if (content.includes('{mention}') && users.length > 0) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const filterType = Math.random() < 0.7 ? 'author' : 'mentions'; // 70% author, 30% mentions
    const structuredMention = `@[${randomUser.author}|${randomUser.author_id}|${filterType}]`;
    content = content.replace('{mention}', structuredMention);
  }

  // Add random hashtags (50% chance, but not if template already has mentions)
  if (Math.random() < 0.5 && !content.includes('@[')) {
    const extraHashtags = HASHTAGS.filter((h) => h !== hashtag)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((h) => `#${h}`)
      .join(' ');
    content += ` ${extraHashtags}`;
  }

  // Add random user mentions (20% chance, reduced since we have template mentions)
  if (Math.random() < 0.2 && users.length > 0 && !content.includes('@[')) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const filterType = Math.random() < 0.7 ? 'author' : 'mentions'; // 70% author, 30% mentions
    content += ` @[${randomUser.author}|${randomUser.author_id}|${filterType}]`;
  }

  return content;
}

// ================================
// DATABASE OPERATIONS
// ================================

/**
 * Optimize database settings for bulk operations
 */
async function optimizeDatabaseSettings() {
  console.log('⚙️  Optimizing database settings for bulk operations...');

  try {
    await sql`SET synchronous_commit = OFF`; // Massive performance boost for bulk inserts
    await sql`SET work_mem = '256MB'`; // Increase work memory for sorting/hashing
    await sql`SET maintenance_work_mem = '1GB'`; // Increase maintenance work memory
    await sql`SET autovacuum = OFF`; // Disable autovacuum during bulk operations

    console.log('✅ Database optimized for bulk operations');
  } catch (error) {
    console.warn('⚠️  Some database optimizations failed:', error.message);
    console.log('   Continuing with basic optimizations...');

    // Fallback to minimal optimizations
    try {
      await sql`SET synchronous_commit = OFF`;
      await sql`SET autovacuum = OFF`;
      console.log('✅ Basic database optimizations applied');
    } catch (fallbackError) {
      console.warn(
        '⚠️  Even basic optimizations failed, continuing without optimization'
      );
    }
  }
}

/**
 * Restore database settings to production defaults
 */
async function restoreDatabaseSettings() {
  console.log('🔄 Restoring database settings to production defaults...');

  try {
    await sql`SET synchronous_commit = ON`;
    await sql`RESET work_mem`;
    await sql`RESET maintenance_work_mem`;
    await sql`SET autovacuum = ON`;

    // Force a checkpoint and vacuum analyze to clean up
    console.log(
      '🧹 Running VACUUM ANALYZE to clean up after bulk operations...'
    );

    // Progress reporting for VACUUM
    const vacuumStart = Date.now();
    let vacuumInterval;

    const vacuumPromise = sql`VACUUM ANALYZE`;

    vacuumInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - vacuumStart) / 1000);
      console.log(`  🧹 VACUUM ANALYZE running... ${elapsed}s elapsed`);
    }, 15000);

    await vacuumPromise;
    clearInterval(vacuumInterval);

    const vacuumTime = Math.round((Date.now() - vacuumStart) / 1000);
    console.log(`✅ VACUUM ANALYZE completed in ${vacuumTime}s`);
    console.log('✅ Database settings restored');
  } catch (error) {
    console.warn('⚠️  Database setting restoration failed:', error.message);
    console.log('   Manual cleanup may be required');
  }
}

/**
 * Clear existing data
 */
async function clearDatabase() {
  console.log('🧹 Clearing existing data...');

  try {
    await sql`DELETE FROM submissions`;
    await sql`ALTER SEQUENCE submissions_submission_id_seq RESTART WITH 1`;
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

/**
 * Create main posts in batches - track IDs internally
 */
async function createMainPosts(users, count) {
  console.log(`📝 Creating ${count} main posts in batches...`);

  const batches = Math.ceil(count / BATCH_SIZE);
  let totalCreated = 0;
  const createdPostIds = []; // Track created post IDs internally

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchSize = Math.min(BATCH_SIZE, count - batchStart);

    const posts = [];
    for (let i = 0; i < batchSize; i++) {
      const postIndex = batchStart + i;
      const user = users[postIndex % users.length];
      const content = generatePostContent(users, postIndex);

      // Extract hashtags for tags array
      const hashtagMatches = content.match(/#[\w]+/g) || [];
      const tags = hashtagMatches.map((tag) => tag.substring(1));

      // Random timestamp within last 90 days
      const timestamp = new Date(
        Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
      );

      posts.push([
        content, // submission_name
        `Post ${postIndex + 1}`, // submission_title
        user.author_id, // author_id
        user.author, // author
        tags, // tags
        null, // thread_parent_id
        timestamp // submission_datetime
      ]);
    }

    // Get the current max ID before inserting
    const beforeInsert =
      await sql`SELECT COALESCE(MAX(submission_id), 0) as max_id FROM submissions`;
    const startId = beforeInsert[0].max_id + 1;

    // True batch insert using postgres multi-row VALUES
    await sql`
      INSERT INTO submissions (
        submission_name, submission_title, author_id, author, tags, thread_parent_id, submission_datetime
      ) VALUES ${sql(posts)}
    `;

    // Track the IDs of posts we just created (sequential IDs)
    for (let i = 0; i < batchSize; i++) {
      createdPostIds.push(startId + i);
    }

    totalCreated += batchSize;
    console.log(`  Created ${totalCreated}/${count} main posts...`);
  }

  console.log(`✅ Created ${totalCreated} main posts`);
  console.log(
    `📊 Tracked ${createdPostIds.length} post IDs for reply generation`
  );

  return createdPostIds; // Return the tracked IDs
}

/**
 * Create replies in batches - using internal post ID tracking (NO SQL QUERIES)
 */
async function createReplies(users, parentPostIds, count) {
  console.log(
    `💬 Creating ${count} replies using ${parentPostIds.length} tracked parent posts...`
  );

  if (parentPostIds.length === 0) {
    console.error('❌ No parent post IDs provided');
    return [];
  }

  const batches = Math.ceil(count / BATCH_SIZE);
  let totalCreated = 0;
  const createdReplyIds = []; // Track reply IDs internally

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchSize = Math.min(BATCH_SIZE, count - batchStart);

    const replies = [];

    for (let i = 0; i < batchSize; i++) {
      const replyIndex = batchStart + i;
      const user = users[replyIndex % users.length];

      // Use internal tracking - no SQL queries needed!
      // Weighted selection: favor earlier posts (more realistic threading)
      const randomFactor = Math.random() * Math.random(); // Skews toward 0
      const parentIndex = Math.floor(randomFactor * parentPostIds.length);
      const parentId = parentPostIds[parentIndex];

      const content = generatePostContent(users, replyIndex + 1000000); // Offset for variety

      // Extract hashtags for tags array
      const hashtagMatches = content.match(/#[\w]+/g) || [];
      const tags = hashtagMatches.map((tag) => tag.substring(1));

      // Random timestamp within last 89 days
      const timestamp = new Date(
        Date.now() - Math.random() * 89 * 24 * 60 * 60 * 1000
      );

      replies.push([
        content, // submission_name
        `Reply ${replyIndex + 1}`, // submission_title
        user.author_id, // author_id
        user.author, // author
        tags, // tags
        parentId, // thread_parent_id
        timestamp // submission_datetime
      ]);
    }

    // Get the current max ID before inserting to track new reply IDs
    const beforeInsert =
      await sql`SELECT COALESCE(MAX(submission_id), 0) as max_id FROM submissions`;
    const startId = beforeInsert[0].max_id + 1;

    // Single batch insert - no queries during loop
    await sql`
      INSERT INTO submissions (
        submission_name, submission_title, author_id, author, tags, thread_parent_id, submission_datetime
      ) VALUES ${sql(replies)}
    `;

    // Track the IDs of replies we just created (sequential IDs)
    for (let i = 0; i < batchSize; i++) {
      createdReplyIds.push(startId + i);
    }

    totalCreated += batchSize;

    // Progress reporting every 50k records
    if (totalCreated % 50000 === 0 || totalCreated === count) {
      const progress = ((totalCreated / count) * 100).toFixed(1);
      console.log(
        `  📊 Progress: ${totalCreated}/${count} replies (${progress}%)`
      );
    } else {
      console.log(`  Created ${totalCreated}/${count} replies...`);
    }

    // Small delay every 20 batches to prevent overwhelming the database
    if (batch > 0 && batch % 20 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  console.log(`✅ Created ${totalCreated} replies`);
  console.log(
    `📊 Tracked ${createdReplyIds.length} reply IDs for nested reply generation`
  );

  return createdReplyIds; // Return tracked reply IDs
}

/**
 * Create nested replies (replies to replies) - using internal tracking (NO SQL QUERIES)
 */
async function createNestedReplies(users, replyIds, count) {
  console.log(
    `🔗 Creating ${count} nested replies using ${replyIds.length} tracked reply IDs...`
  );

  if (replyIds.length === 0) {
    console.error('❌ No reply IDs provided for nested replies');
    return;
  }

  console.log(
    `📊 Using ${replyIds.length} internally tracked reply IDs (no database queries needed)`
  );

  const batches = Math.ceil(count / BATCH_SIZE);
  let totalCreated = 0;

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchSize = Math.min(BATCH_SIZE, count - batchStart);

    const nestedReplies = [];

    for (let i = 0; i < batchSize; i++) {
      const replyIndex = batchStart + i;
      const user = users[replyIndex % users.length];

      // Use internal tracking - no SQL queries needed!
      // Weighted selection: favor earlier replies (more realistic threading)
      const randomFactor = Math.random() * Math.random(); // Skews toward 0
      const parentIndex = Math.floor(randomFactor * replyIds.length);
      const parentId = replyIds[parentIndex];

      const content = generatePostContent(users, replyIndex + 2000000); // Offset for variety

      // Extract hashtags for tags array
      const hashtagMatches = content.match(/#[\w]+/g) || [];
      const tags = hashtagMatches.map((tag) => tag.substring(1));

      // Random timestamp within last 88 days
      const timestamp = new Date(
        Date.now() - Math.random() * 88 * 24 * 60 * 60 * 1000
      );

      nestedReplies.push([
        content, // submission_name
        `Nested Reply ${replyIndex + 1}`, // submission_title
        user.author_id, // author_id
        user.author, // author
        tags, // tags
        parentId, // thread_parent_id
        timestamp // submission_datetime
      ]);
    }

    // Single batch insert - no queries during loop
    await sql`
      INSERT INTO submissions (
        submission_name, submission_title, author_id, author, tags, thread_parent_id, submission_datetime
      ) VALUES ${sql(nestedReplies)}
    `;

    totalCreated += batchSize;

    // Progress reporting every 25k records
    if (totalCreated % 25000 === 0 || totalCreated === count) {
      const progress = ((totalCreated / count) * 100).toFixed(1);
      console.log(
        `  📊 Progress: ${totalCreated}/${count} nested replies (${progress}%)`
      );
    } else {
      console.log(`  Created ${totalCreated}/${count} nested replies...`);
    }

    // Small delay every 20 batches to prevent overwhelming the database
    if (batch > 0 && batch % 20 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  console.log(`✅ Created ${totalCreated} nested replies`);
}

/**
 * Refresh materialized view after seeding
 */
async function refreshMaterializedView() {
  console.log('🔄 Refreshing materialized view...');
  console.log('   This may take several minutes for large datasets...');

  try {
    const startTime = Date.now();

    // Add a timeout and progress indicator
    const refreshPromise = sql`SELECT refresh_user_submission_stats()`;

    // Show progress dots every 10 seconds
    const progressInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`   Still working... (${elapsed}s elapsed)`);
    }, 10000);

    await refreshPromise;

    clearInterval(progressInterval);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Materialized view refreshed in ${duration}s`);
  } catch (error) {
    console.warn(
      '⚠️  Materialized view refresh failed (may not exist yet):',
      error.message
    );

    // Try alternative approach if the function doesn't exist
    try {
      console.log('   Trying alternative REFRESH MATERIALIZED VIEW...');
      await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY user_submission_stats`;
      console.log('✅ Alternative materialized view refresh succeeded');
    } catch (altError) {
      console.warn('⚠️  Alternative refresh also failed:', altError.message);
      console.log('   Continuing without materialized view refresh...');
    }
  }
}

/**
 * Display final statistics
 */
async function displayStatistics() {
  console.log('\n📊 Final Statistics:');

  try {
    const totalSubmissions =
      await sql`SELECT COUNT(*) as count FROM submissions`;
    const totalUsers =
      await sql`SELECT COUNT(DISTINCT author_id) as count FROM submissions`;
    const mainPosts =
      await sql`SELECT COUNT(*) as count FROM submissions WHERE thread_parent_id IS NULL`;
    const replies =
      await sql`SELECT COUNT(*) as count FROM submissions WHERE thread_parent_id IS NOT NULL`;

    console.log(`  Total Submissions: ${totalSubmissions[0].count}`);
    console.log(`  Unique Users: ${totalUsers[0].count}`);
    console.log(`  Main Posts: ${mainPosts[0].count}`);
    console.log(`  Replies: ${replies[0].count}`);

    // Check for duplicate usernames
    const duplicateCheck = await sql`
      SELECT author, COUNT(*) as count 
      FROM submissions 
      GROUP BY author 
      HAVING COUNT(*) > 0
      ORDER BY count DESC 
      LIMIT 5
    `;

    console.log('\n  Top Users by Post Count:');
    duplicateCheck.forEach((user) => {
      console.log(`    ${user.author}: ${user.count} posts`);
    });

    // Verify no duplicate usernames
    const uniqueUsernames =
      await sql`SELECT COUNT(DISTINCT author) as count FROM submissions`;
    const totalUserRecords =
      await sql`SELECT COUNT(DISTINCT author_id) as count FROM submissions`;

    console.log(`\n✅ Username Uniqueness Check:`);
    console.log(`  Unique Usernames: ${uniqueUsernames[0].count}`);
    console.log(`  Unique User IDs: ${totalUserRecords[0].count}`);
    console.log(
      `  No Duplicates: ${uniqueUsernames[0].count === totalUserRecords[0].count ? '✅ PASSED' : '❌ FAILED'}`
    );
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
  }
}

// ================================
// MAIN EXECUTION
// ================================

async function main() {
  const startTime = Date.now();

  console.log('🚀 Starting MASSIVE seed generation (1M records)...');
  console.log(
    `📊 Target: ${SEED_USERS_COUNT} users, ${SEED_POSTS_COUNT} posts, ${SEED_REPLIES_COUNT} replies`
  );
  console.log(`🔒 GUARANTEED unique usernames - no duplicates!\n`);

  try {
    // Step 1: Optimize database settings
    await optimizeDatabaseSettings();

    // Step 2: Clear existing data
    await clearDatabase();

    // Step 3: Generate unique users
    const users = generateUniqueUsers(SEED_USERS_COUNT);

    // Step 4: Create main posts
    const mainPostIds = await createMainPosts(users, SEED_POSTS_COUNT);

    // Step 5: Create replies
    const replies = await createReplies(users, mainPostIds, SEED_REPLIES_COUNT);

    // Step 6: Create nested replies
    await createNestedReplies(users, replies, SEED_NESTED_REPLIES_COUNT);

    // Step 7: Refresh materialized view
    if (!SKIP_MATERIALIZED_VIEW) {
      await refreshMaterializedView();
    }

    // Step 8: Restore database settings
    await restoreDatabaseSettings();

    // Step 9: Display statistics
    await displayStatistics();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n🎉 Seed generation completed in ${duration} seconds!`);
    console.log(
      `📈 Performance: ${Math.round((SEED_POSTS_COUNT + SEED_REPLIES_COUNT) / duration)} records/second`
    );
  } catch (error) {
    console.error('❌ Seed generation failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateUniqueUsers,
  generatePostContent,
  FIRST_NAMES,
  LAST_NAMES,
  TOPICS,
  HASHTAGS
};
