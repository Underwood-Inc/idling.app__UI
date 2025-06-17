// Load environment variables FIRST
require('dotenv').config({ path: '.env.local' });

const { faker } = require('@faker-js/faker');
const postgres = require('postgres');

const SEED_USERS_COUNT = 25; // Smaller user base for more realistic interactions
const SEED_POSTS_COUNT = 150; // More posts per user
const SEED_REPLIES_COUNT = 300; // Many replies for threading

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
  ssl: 'prefer'
});

// Common hashtags for realistic clustering
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
  '#api'
];

// Topic-based conversation starters
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
  'learning resources'
];

// Create embedded mention format: @[username|userId]
const createMention = (username, userId) => `@[${username}|${userId}]`;

// Generate realistic content with mentions and hashtags
const generateContentWithMentions = (
  users,
  excludeUserId,
  includeHashtags = true
) => {
  const baseContent = faker.lorem.paragraph({ min: 1, max: 2 }); // Shorter content
  let content = baseContent;

  // Add mentions (30% chance)
  if (faker.datatype.boolean(0.3) && users.length > 1) {
    const mentionableUsers = users.filter((u) => u.id !== excludeUserId);
    const mentionCount = faker.number.int({
      min: 1,
      max: Math.min(3, mentionableUsers.length)
    });

    for (let i = 0; i < mentionCount; i++) {
      const randomUser = faker.helpers.arrayElement(mentionableUsers);
      const mention = createMention(randomUser.name, randomUser.id);

      // Insert mention at random position
      const sentences = content.split('. ');
      const randomSentence = faker.number.int({
        min: 0,
        max: sentences.length - 1
      });
      sentences[randomSentence] += ` ${mention}`;
      content = sentences.join('. ');
    }
  }

  // Add hashtags (60% chance)
  if (includeHashtags && faker.datatype.boolean(0.6)) {
    const hashtagCount = faker.number.int({ min: 1, max: 4 });
    const selectedHashtags = faker.helpers.arrayElements(
      COMMON_HASHTAGS,
      hashtagCount
    );

    // Insert hashtags naturally
    selectedHashtags.forEach((hashtag) => {
      const sentences = content.split('. ');
      const randomSentence = faker.number.int({
        min: 0,
        max: sentences.length - 1
      });
      sentences[randomSentence] += ` ${hashtag}`;
      content = sentences.join('. ');
    });
  }

  return content;
};

// Generate thread-aware reply content
const generateReplyContent = (users, parentAuthor, replyAuthorId) => {
  const replyStarters = [
    `${createMention(parentAuthor.name, parentAuthor.id)} I think`,
    `Great point ${createMention(parentAuthor.name, parentAuthor.id)}!`,
    `${createMention(parentAuthor.name, parentAuthor.id)} Have you considered`,
    `I disagree with ${createMention(parentAuthor.name, parentAuthor.id)} on this.`,
    `Building on what ${createMention(parentAuthor.name, parentAuthor.id)} said,`,
    `${createMention(parentAuthor.name, parentAuthor.id)} This reminds me of`
  ];

  const starter = faker.helpers.arrayElement(replyStarters);
  const continuation = faker.lorem.sentences({ min: 1, max: 2 }); // Shorter replies

  return `${starter} ${continuation}`;
};

const generateRecords = async () => {
  try {
    console.info('🚀 Starting advanced seed generation...');

    // Clear existing data
    await sql`DELETE FROM submissions WHERE 1=1`;
    await sql`DELETE FROM accounts WHERE 1=1`;
    await sql`DELETE FROM users WHERE 1=1`;

    console.info('📝 Creating users...');
    const users = [];

    // Generate users with realistic profiles
    for (let i = 0; i < SEED_USERS_COUNT; i++) {
      const name = faker.person.fullName();
      const email = faker.internet.email();
      const emailVerified = faker.date.past();
      const image = faker.image.avatar();

      const userResult = await sql`
        INSERT INTO users (name, email, "emailVerified", image)
        VALUES (${name}, ${email}, ${emailVerified}, ${image})
        RETURNING id, name
      `;

      const user = userResult[0];
      users.push(user);

      // Generate account for each user
      const providerAccountId = faker.string.uuid();
      await sql`
        INSERT INTO accounts (
          "userId", type, provider, "providerAccountId",
          refresh_token, access_token, expires_at, id_token,
          scope, session_state, token_type
        ) VALUES (
          ${user.id}, 'oauth', 'github', ${providerAccountId},
          ${faker.internet.password()}, ${faker.internet.password()}, 
          ${faker.number.int({ min: 1609459200, max: 1672444800 })},
          ${faker.internet.password()}, 'read:user', 
          ${faker.lorem.word()}, 'Bearer'
        )
      `;
    }

    console.info(`✅ Created ${users.length} users`);
    console.info('📄 Creating main posts...');

    const posts = [];

    // Generate main posts with realistic content
    for (let i = 0; i < SEED_POSTS_COUNT; i++) {
      const author = faker.helpers.arrayElement(users);
      const topic = faker.helpers.arrayElement(CONVERSATION_TOPICS);

      // Generate realistic titles (keep under 200 chars for VARCHAR(255) safety)
      const titleTemplates = [
        `How to ${topic}?`,
        `Best practices for ${topic}`,
        `${topic} help needed`,
        `Thoughts on ${topic}?`,
        `${topic} patterns`,
        `${topic} experience?`,
        `${topic} tips`,
        `${topic} discussion`
      ];

      let submission_title = faker.helpers.arrayElement(titleTemplates);
      // Ensure title is under 200 characters for safety
      if (submission_title.length > 200) {
        submission_title = submission_title.substring(0, 197) + '...';
      }
      const submission_name = generateContentWithMentions(users, author.id);

      // Extract hashtags from content for the tags array
      const hashtagMatches = submission_name.match(/#[a-zA-Z0-9_-]+/g) || [];
      const tags = hashtagMatches.length > 0 ? hashtagMatches : null;

      const submission_datetime = faker.date.between({
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        to: new Date()
      });

      const postResult = await sql`
        INSERT INTO submissions (
          submission_name, submission_title, author_id, author, 
          tags, submission_datetime, thread_parent_id
        ) VALUES (
          ${submission_name}, ${submission_title}, ${author.id}, ${author.name},
          ${tags}, ${submission_datetime}, NULL
        ) RETURNING submission_id
      `;

      posts.push({
        id: postResult[0].submission_id,
        author: author,
        title: submission_title,
        datetime: submission_datetime
      });
    }

    console.info(`✅ Created ${posts.length} main posts`);
    console.info('💬 Creating threaded replies...');

    let repliesCreated = 0;

    // Generate replies and nested conversations
    for (let i = 0; i < SEED_REPLIES_COUNT; i++) {
      const parentPost = faker.helpers.arrayElement(posts);
      const replyAuthor = faker.helpers.arrayElement(users);

      // Don't reply to your own post too often
      if (
        replyAuthor.id === parentPost.author.id &&
        faker.datatype.boolean(0.7)
      ) {
        continue;
      }

      const replyContent = generateReplyContent(
        users,
        parentPost.author,
        replyAuthor.id
      );

      // Extract hashtags from reply content
      const hashtagMatches = replyContent.match(/#[a-zA-Z0-9_-]+/g) || [];
      const tags = hashtagMatches.length > 0 ? hashtagMatches : null;

      // Reply datetime should be after parent post
      const replyDatetime = faker.date.between({
        from: parentPost.datetime,
        to: new Date()
      });

      // Keep reply titles short
      let replyTitle = `Re: ${parentPost.title}`;
      if (replyTitle.length > 200) {
        replyTitle = replyTitle.substring(0, 197) + '...';
      }

      await sql`
        INSERT INTO submissions (
          submission_name, submission_title, author_id, author,
          tags, submission_datetime, thread_parent_id
        ) VALUES (
          ${replyContent}, ${replyTitle}, ${replyAuthor.id}, ${replyAuthor.name},
          ${tags}, ${replyDatetime}, ${parentPost.id}
        )
      `;

      repliesCreated++;
    }

    console.info(`✅ Created ${repliesCreated} threaded replies`);
    console.info('🔗 Creating nested reply chains...');

    // Create some deeper nested conversations
    const recentReplies = await sql`
      SELECT submission_id, author_id, author, submission_title, submission_datetime
      FROM submissions 
      WHERE thread_parent_id IS NOT NULL
      ORDER BY submission_datetime DESC
      LIMIT 50
    `;

    let nestedRepliesCreated = 0;

    for (const reply of recentReplies.slice(0, 30)) {
      if (faker.datatype.boolean(0.4)) {
        // 40% chance of nested reply
        const nestedAuthor = faker.helpers.arrayElement(users);

        // Don't reply to yourself
        if (nestedAuthor.id === reply.author_id) continue;

        const originalAuthor = users.find((u) => u.id === reply.author_id);
        if (!originalAuthor) continue; // Skip if author not found

        const nestedContent = generateReplyContent(
          users,
          originalAuthor,
          nestedAuthor.id
        );

        const hashtagMatches = nestedContent.match(/#[a-zA-Z0-9_-]+/g) || [];
        const tags = hashtagMatches.length > 0 ? hashtagMatches : null;

        const nestedDatetime = faker.date.between({
          from: reply.submission_datetime,
          to: new Date()
        });

        await sql`
          INSERT INTO submissions (
            submission_name, submission_title, author_id, author,
            tags, submission_datetime, thread_parent_id
          ) VALUES (
            ${nestedContent}, ${reply.submission_title}, ${nestedAuthor.id}, ${nestedAuthor.name},
            ${tags}, ${nestedDatetime}, ${reply.submission_id}
          )
        `;

        nestedRepliesCreated++;
      }
    }

    console.info(`✅ Created ${nestedRepliesCreated} nested replies`);

    // Generate some statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN thread_parent_id IS NULL THEN 1 END) as main_posts,
        COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as replies,
        COUNT(DISTINCT author_id) as active_users
      FROM submissions
    `;

    const mentionStats = await sql`
      SELECT COUNT(*) as posts_with_mentions
      FROM submissions 
      WHERE submission_name LIKE '%@[%|%]%'
    `;

    const hashtagStats = await sql`
      SELECT COUNT(*) as posts_with_hashtags
      FROM submissions 
      WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
    `;

    console.info('\n📊 SEED GENERATION COMPLETE!');
    console.info('================================');
    console.info(`👥 Users created: ${users.length}`);
    console.info(`📝 Total posts: ${stats[0].total_posts}`);
    console.info(`📄 Main posts: ${stats[0].main_posts}`);
    console.info(`💬 Replies: ${stats[0].replies}`);
    console.info(
      `🏷️ Posts with hashtags: ${hashtagStats[0].posts_with_hashtags}`
    );
    console.info(
      `👤 Posts with mentions: ${mentionStats[0].posts_with_mentions}`
    );
    console.info(`🔥 Active users: ${stats[0].active_users}`);
    console.info('================================');
  } catch (error) {
    console.error('❌ Error generating records:', error);
  } finally {
    await sql.end();
  }
};

generateRecords();
