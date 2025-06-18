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
  connect_timeout: 60
});

// ================================
// CONFIGURATION
// ================================

const SEED_USERS_COUNT = 5000; // Number of unique users
const SEED_POSTS_COUNT = 200000; // Number of main posts
const SEED_REPLIES_COUNT = 800000; // Number of replies
const BATCH_SIZE = 1000; // Batch processing size

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
  'Team discussion on {topic} best practices. {hashtag} seems like the way to go. #teamwork'
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

  // Add random hashtags (60% chance)
  if (Math.random() < 0.6) {
    const extraHashtags = HASHTAGS.filter((h) => h !== hashtag)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((h) => `#${h}`)
      .join(' ');
    content += ` ${extraHashtags}`;
  }

  // Add user mentions (30% chance)
  if (Math.random() < 0.3 && users.length > 0) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    content += ` @[${randomUser.author}|${randomUser.author_id}]`;
  }

  return content;
}

// ================================
// DATABASE OPERATIONS
// ================================

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
 * Create main posts in batches
 */
async function createMainPosts(users, count) {
  console.log(`📝 Creating ${count} main posts in batches...`);

  const batches = Math.ceil(count / BATCH_SIZE);
  let totalCreated = 0;

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

      posts.push({
        submission_name: content,
        submission_title: `Post ${postIndex + 1}`,
        author_id: user.author_id,
        author: user.author,
        tags: tags,
        thread_parent_id: null,
        submission_datetime: timestamp
      });
    }

    // Batch insert with individual inserts to avoid type issues
    for (const post of posts) {
      await sql`
        INSERT INTO submissions (
          submission_name, submission_title, author_id, author, tags, thread_parent_id, submission_datetime
        ) VALUES (
          ${post.submission_name},
          ${post.submission_title},
          ${post.author_id},
          ${post.author},
          ${post.tags},
          ${post.thread_parent_id},
          ${post.submission_datetime}
        )
      `;
    }

    totalCreated += batchSize;
    console.log(`  Created ${totalCreated}/${count} main posts...`);
  }

  console.log(`✅ Created ${totalCreated} main posts`);
}

/**
 * Create replies in batches
 */
async function createReplies(users, count) {
  console.log(`💬 Creating ${count} replies in batches...`);

  // Get all main post IDs
  const mainPosts = await sql`
    SELECT submission_id FROM submissions WHERE thread_parent_id IS NULL
  `;

  if (mainPosts.length === 0) {
    console.error('❌ No main posts found to reply to');
    return;
  }

  const batches = Math.ceil(count / BATCH_SIZE);
  let totalCreated = 0;

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchSize = Math.min(BATCH_SIZE, count - batchStart);

    const replies = [];
    for (let i = 0; i < batchSize; i++) {
      const replyIndex = batchStart + i;
      const user = users[replyIndex % users.length];
      const parentPost = mainPosts[replyIndex % mainPosts.length];

      const content = generatePostContent(users, replyIndex + 1000000); // Offset for variety

      // Extract hashtags for tags array
      const hashtagMatches = content.match(/#[\w]+/g) || [];
      const tags = hashtagMatches.map((tag) => tag.substring(1));

      // Random timestamp within last 90 days
      const timestamp = new Date(
        Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
      );

      replies.push({
        submission_name: content,
        submission_title: `Reply ${replyIndex + 1}`,
        author_id: user.author_id,
        author: user.author,
        tags: tags,
        thread_parent_id: parentPost.submission_id,
        submission_datetime: timestamp
      });
    }

    // Batch insert with individual inserts to avoid type issues
    for (const reply of replies) {
      await sql`
        INSERT INTO submissions (
          submission_name, submission_title, author_id, author, tags, thread_parent_id, submission_datetime
        ) VALUES (
          ${reply.submission_name},
          ${reply.submission_title},
          ${reply.author_id},
          ${reply.author},
          ${reply.tags},
          ${reply.thread_parent_id},
          ${reply.submission_datetime}
        )
      `;
    }

    totalCreated += batchSize;
    console.log(`  Created ${totalCreated}/${count} replies...`);
  }

  console.log(`✅ Created ${totalCreated} replies`);
}

/**
 * Refresh materialized view after seeding
 */
async function refreshMaterializedView() {
  console.log('🔄 Refreshing materialized view...');

  try {
    await sql`SELECT refresh_user_submission_stats()`;
    console.log('✅ Materialized view refreshed');
  } catch (error) {
    console.warn(
      '⚠️  Materialized view refresh failed (may not exist yet):',
      error.message
    );
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
    // Step 1: Clear existing data
    await clearDatabase();

    // Step 2: Generate unique users
    const users = generateUniqueUsers(SEED_USERS_COUNT);

    // Step 3: Create main posts
    await createMainPosts(users, SEED_POSTS_COUNT);

    // Step 4: Create replies
    await createReplies(users, SEED_REPLIES_COUNT);

    // Step 5: Refresh materialized view
    await refreshMaterializedView();

    // Step 6: Display statistics
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
