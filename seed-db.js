// Load environment variables FIRST
require('dotenv').config({ path: '.env.local' });

const { faker } = require('@faker-js/faker');
const postgres = require('postgres');

// MASSIVE SCALE CONFIGURATION - 1 MILLION RECORDS
const SEED_USERS_COUNT = 5000; // More users for realistic distribution
const SEED_POSTS_COUNT = 200000; // 200k main posts
const SEED_REPLIES_COUNT = 800000; // 800k replies = 1M total posts
const BATCH_SIZE = 1000; // Process in batches for memory efficiency

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

// Pre-generated data pools for efficiency
const COMMON_HASHTAGS = [
  '#javascript',
  '#react',
  '#nodejs',
  '#python',
  '#webdev',
  '#programming',
  '#coding',
  '#tech',
  '#opensource',
  '#ai',
  '#machinelearning',
  '#devops',
  '#frontend',
  '#backend',
  '#fullstack',
  '#typescript',
  '#css',
  '#html',
  '#database',
  '#api',
  '#docker',
  '#kubernetes',
  '#aws',
  '#cloud',
  '#microservices',
  '#graphql',
  '#mongodb',
  '#postgresql',
  '#redis',
  '#elasticsearch',
  '#nextjs',
  '#vue',
  '#angular',
  '#svelte',
  '#rust',
  '#golang',
  '#java',
  '#csharp',
  '#php',
  '#ruby',
  '#swift',
  '#kotlin'
];

const CONVERSATION_TOPICS = [
  'debugging',
  'performance optimization',
  'code review',
  'architecture',
  'testing',
  'deployment',
  'security',
  'best practices',
  'frameworks',
  'libraries',
  'tools',
  'career advice',
  'learning resources',
  'algorithms',
  'data structures',
  'system design',
  'scalability',
  'monitoring',
  'CI/CD',
  'agile',
  'remote work',
  'technical interviews'
];

// Pre-generated content templates for speed
const TITLE_TEMPLATES = [
  'How to {topic}?',
  'Best practices for {topic}',
  '{topic} help needed',
  'Thoughts on {topic}?',
  '{topic} patterns',
  '{topic} experience?',
  '{topic} tips',
  '{topic} discussion',
  'Advanced {topic}',
  '{topic} guide',
  'Common {topic} mistakes',
  '{topic} vs alternatives',
  'Modern {topic}',
  '{topic} optimization',
  '{topic} tutorial',
  '{topic} deep dive'
];

const CONTENT_TEMPLATES = [
  "I've been working on {topic} and wondering about best practices.",
  'Has anyone tried {topic} in production? Looking for insights.',
  'Struggling with {topic}. Any recommendations?',
  'Just discovered {topic}. Thoughts on adoption?',
  'Comparing different approaches to {topic}.',
  'Performance considerations for {topic}?',
  'Security implications of {topic}?',
  'Team is debating {topic} implementation.',
  'Latest trends in {topic}?',
  'Migrating from legacy {topic} solutions.'
];

// Algorithmic generators for efficiency
class AlgorithmicGenerator {
  constructor() {
    this.userPool = [];
    this.hashtagPool = [];
    this.topicPool = [];
    this.mentionPatterns = [];
  }

  // Pre-compute data pools
  initialize() {
    // Create hashtag combinations
    for (let i = 0; i < COMMON_HASHTAGS.length; i++) {
      for (let j = i + 1; j < Math.min(i + 4, COMMON_HASHTAGS.length); j++) {
        this.hashtagPool.push([COMMON_HASHTAGS[i], COMMON_HASHTAGS[j]]);
      }
    }

    // Create topic combinations
    CONVERSATION_TOPICS.forEach((topic) => {
      TITLE_TEMPLATES.forEach((template) => {
        this.topicPool.push(template.replace('{topic}', topic));
      });
    });
  }

  // Generate user algorithmically based on index
  generateUser(index) {
    // Use index as seed for consistent generation
    faker.seed(index);

    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com'];
    const firstNames = [
      'John',
      'Jane',
      'Alex',
      'Sam',
      'Chris',
      'Jordan',
      'Taylor'
    ];
    const lastNames = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia'
    ];

    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[(index * 7) % lastNames.length];
    const domain = domains[(index * 3) % domains.length];

    return {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`,
      emailVerified: new Date(Date.now() - index * 86400000), // Spread over time
      image: `https://avatar.githubusercontent.com/u/${100000 + index}?v=4`
    };
  }

  // Generate post content algorithmically
  generateContent(index, users, authorId) {
    const topicIndex = index % this.topicPool.length;
    const contentIndex = index % CONTENT_TEMPLATES.length;
    const hashtagIndex = index % this.hashtagPool.length;

    let content = CONTENT_TEMPLATES[contentIndex].replace(
      '{topic}',
      CONVERSATION_TOPICS[index % CONVERSATION_TOPICS.length]
    );

    // Add hashtags (60% chance based on index)
    if (index % 5 < 3) {
      const hashtags = this.hashtagPool[hashtagIndex];
      content += ` ${hashtags.join(' ')}`;
    }

    // Add mentions (30% chance based on index)
    if (index % 10 < 3 && users.length > 1) {
      const mentionUser = users[(index * 17) % users.length];
      if (mentionUser.id !== authorId) {
        content += ` @[${mentionUser.name}|${mentionUser.id}]`;
      }
    }

    return content;
  }

  // Generate title algorithmically
  generateTitle(index) {
    return this.topicPool[index % this.topicPool.length];
  }

  // Generate timestamp algorithmically (spread over 90 days)
  generateTimestamp(index) {
    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
    const timeSpread = now - ninetyDaysAgo;

    return new Date(ninetyDaysAgo + ((index * 1000) % timeSpread));
  }

  // Extract hashtags from content
  extractHashtags(content) {
    const matches = content.match(/#[a-zA-Z0-9_-]+/g);
    return matches && matches.length > 0 ? matches : null;
  }
}

// Batch processing utilities
const processBatch = async (items, processor, batchSize = BATCH_SIZE) => {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);

    // Progress indicator
    if (i % (batchSize * 10) === 0) {
      console.info(`  Processed ${i + batch.length}/${items.length} items...`);
    }
  }

  return results;
};

const generateRecords = async () => {
  const generator = new AlgorithmicGenerator();
  generator.initialize();

  const startTime = Date.now();

  try {
    console.info('🚀 Starting MASSIVE seed generation (1M records)...');
    console.info(
      `📊 Target: ${SEED_USERS_COUNT} users, ${SEED_POSTS_COUNT} posts, ${SEED_REPLIES_COUNT} replies`
    );

    // Clear existing data
    console.info('🧹 Clearing existing data...');
    await sql`DELETE FROM submissions WHERE 1=1`;
    await sql`DELETE FROM accounts WHERE 1=1`;
    await sql`DELETE FROM users WHERE 1=1`;

    console.info('👥 Creating users in batches...');
    const users = [];

    // Generate users in batches
    const userBatches = [];
    for (let i = 0; i < SEED_USERS_COUNT; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, SEED_USERS_COUNT);
      const batch = [];

      for (let j = i; j < batchEnd; j++) {
        batch.push(generator.generateUser(j));
      }
      userBatches.push(batch);
    }

    // Process user batches
    for (let batchIndex = 0; batchIndex < userBatches.length; batchIndex++) {
      const batch = userBatches[batchIndex];

      // Insert users batch
      const userResults = await sql`
        INSERT INTO users (name, email, "emailVerified", image)
        SELECT * FROM ${sql(batch.map((u) => [u.name, u.email, u.emailVerified, u.image]))}
        RETURNING id, name
      `;

      users.push(...userResults);

      // Insert accounts batch
      const accountData = userResults.map((user, index) => [
        user.id,
        'oauth',
        'github',
        `github_${Date.now()}_${batchIndex}_${index}`,
        'refresh_token',
        'access_token',
        Math.floor(Date.now() / 1000) + 3600,
        'id_token',
        'read:user',
        'session_state',
        'Bearer'
      ]);

      await sql`
        INSERT INTO accounts (
          "userId", type, provider, "providerAccountId",
          refresh_token, access_token, expires_at, id_token,
          scope, session_state, token_type
        ) SELECT * FROM ${sql(accountData)}
      `;

      if (batchIndex % 5 === 0) {
        console.info(`  Created ${users.length}/${SEED_USERS_COUNT} users...`);
      }
    }

    console.info(`✅ Created ${users.length} users`);
    console.info('📝 Creating main posts in batches...');

    const posts = [];

    // Generate main posts in batches
    for (let i = 0; i < SEED_POSTS_COUNT; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, SEED_POSTS_COUNT);
      const batch = [];

      for (let j = i; j < batchEnd; j++) {
        const author = users[j % users.length];
        const content = generator.generateContent(j, users, author.id);
        const title = generator.generateTitle(j);
        const datetime = generator.generateTimestamp(j);
        const tags = generator.extractHashtags(content);

        batch.push([
          content,
          title,
          author.id,
          author.name,
          tags,
          datetime,
          null
        ]);
      }

      const postResults = await sql`
        INSERT INTO submissions (
          submission_name, submission_title, author_id, author,
          tags, submission_datetime, thread_parent_id
        ) SELECT * FROM ${sql(batch)}
        RETURNING submission_id, author_id, submission_datetime
      `;

      posts.push(
        ...postResults.map((p, index) => ({
          id: p.submission_id,
          author_id: p.author_id,
          datetime: p.submission_datetime,
          author: users.find((u) => u.id === p.author_id)
        }))
      );

      if (i % (BATCH_SIZE * 5) === 0) {
        console.info(
          `  Created ${posts.length}/${SEED_POSTS_COUNT} main posts...`
        );
      }
    }

    console.info(`✅ Created ${posts.length} main posts`);
    console.info('💬 Creating replies in batches...');

    let repliesCreated = 0;

    // Generate replies in batches
    for (let i = 0; i < SEED_REPLIES_COUNT; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, SEED_REPLIES_COUNT);
      const batch = [];

      for (let j = i; j < batchEnd; j++) {
        const parentPost = posts[j % posts.length];
        const replyAuthor = users[(j * 7) % users.length];

        // Skip self-replies occasionally
        if (replyAuthor.id === parentPost.author_id && j % 4 === 0) {
          continue;
        }

        const content = generator.generateContent(
          j + SEED_POSTS_COUNT,
          users,
          replyAuthor.id
        );
        const title = `Re: ${generator.generateTitle(j)}`;
        const datetime = new Date(parentPost.datetime.getTime() + j * 1000);
        const tags = generator.extractHashtags(content);

        batch.push([
          content,
          title.substring(0, 200),
          replyAuthor.id,
          replyAuthor.name,
          tags,
          datetime,
          parentPost.id
        ]);
      }

      if (batch.length > 0) {
        await sql`
          INSERT INTO submissions (
            submission_name, submission_title, author_id, author,
            tags, submission_datetime, thread_parent_id
          ) SELECT * FROM ${sql(batch)}
        `;

        repliesCreated += batch.length;
      }

      if (i % (BATCH_SIZE * 10) === 0) {
        console.info(
          `  Created ${repliesCreated}/${SEED_REPLIES_COUNT} replies...`
        );
      }
    }

    console.info(`✅ Created ${repliesCreated} replies`);

    // Generate final statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN thread_parent_id IS NULL THEN 1 END) as main_posts,
        COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as replies,
        COUNT(DISTINCT author_id) as active_users
      FROM submissions
    `;

    const hashtagStats = await sql`
      SELECT COUNT(*) as posts_with_hashtags
      FROM submissions 
      WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
    `;

    const mentionStats = await sql`
      SELECT COUNT(*) as posts_with_mentions
      FROM submissions 
      WHERE submission_name LIKE '%@[%|%]%'
    `;

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.info('\n🎉 MASSIVE SEED GENERATION COMPLETE!');
    console.info('==========================================');
    console.info(`⏱️  Total time: ${duration} seconds`);
    console.info(`👥 Users created: ${users.length}`);
    console.info(`📝 Total posts: ${stats[0].total_posts}`);
    console.info(`📄 Main posts: ${stats[0].main_posts}`);
    console.info(`💬 Replies: ${stats[0].replies}`);
    console.info(
      `🏷️  Posts with hashtags: ${hashtagStats[0].posts_with_hashtags}`
    );
    console.info(
      `👤 Posts with mentions: ${mentionStats[0].posts_with_mentions}`
    );
    console.info(`🔥 Active users: ${stats[0].active_users}`);
    console.info(
      `📊 Posts per second: ${Math.round(stats[0].total_posts / duration)}`
    );
    console.info('==========================================');

    if (stats[0].total_posts >= 1000000) {
      console.info('🏆 MILESTONE: 1 MILLION POSTS ACHIEVED!');
    }
  } catch (error) {
    console.error('❌ Error generating records:', error);
    console.error(error.stack);
  } finally {
    await sql.end();
  }
};

generateRecords();
