#!/usr/bin/env node

/* eslint-disable no-console */
// Load environment variables FIRST
require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

// Simple console styling
const chalk = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// Create database connection
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: 'prefer',
  onnotice: () => {}, // Ignore NOTICE statements
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

async function checkTableExists(tableName) {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `;
    return result[0].exists;
  } catch (error) {
    console.error(chalk.red(`❌ Error checking table ${tableName}:`), error.message);
    return false;
  }
}

async function getTableColumns(tableName) {
  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    return columns;
  } catch (error) {
    console.error(chalk.red(`❌ Error getting columns for ${tableName}:`), error.message);
    return [];
  }
}

async function createPostsTable() {
  console.log(chalk.blue('Creating posts table...'));
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subthread VARCHAR(255),
        score INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log(chalk.green('✅ Posts table created successfully'));
    
    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_subthread ON posts(subthread)`;
    
    console.log(chalk.green('✅ Posts table indexes created'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error creating posts table:'), error.message);
  }
}

async function createCommentsTable() {
  console.log(chalk.blue('Creating comments table...'));
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log(chalk.green('✅ Comments table created successfully'));
    
    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id)`;
    
    console.log(chalk.green('✅ Comments table indexes created'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error creating comments table:'), error.message);
  }
}

async function migrateSubmissionsToPosts() {
  console.log(chalk.blue('Checking if we should migrate submissions to posts...'));
  
  try {
    // Check if submissions table has data
    const submissionCount = await sql`SELECT COUNT(*) as count FROM submissions`;
    const postCount = await sql`SELECT COUNT(*) as count FROM posts`;
    
    console.log(chalk.cyan(`📊 Submissions: ${submissionCount[0].count}, Posts: ${postCount[0].count}`));
    
    if (submissionCount[0].count > 0 && postCount[0].count === 0) {
      console.log(chalk.yellow('🔄 Migrating submissions to posts format...'));
      
      // Migrate main thread submissions to posts
      await sql`
        INSERT INTO posts (title, content, author_id, subthread, score, created_at)
        SELECT 
          COALESCE(title, LEFT(content, 100)) as title,
          content,
          user_id as author_id,
          subthread,
          0 as score,
          submission_datetime as created_at
        FROM submissions 
        WHERE thread_parent_id IS NULL
        AND user_id IS NOT NULL
      `;
      
      console.log(chalk.green('✅ Migrated main submissions to posts'));
      
      // Migrate threaded submissions to comments
      await sql`
        INSERT INTO comments (content, author_id, post_id, score, created_at)
        SELECT 
          s.content,
          s.user_id as author_id,
          p.id as post_id,
          0 as score,
          s.submission_datetime as created_at
        FROM submissions s
        JOIN submissions parent ON s.thread_parent_id = parent.submission_id
        JOIN posts p ON parent.user_id = p.author_id 
          AND parent.submission_datetime = p.created_at
        WHERE s.thread_parent_id IS NOT NULL
        AND s.user_id IS NOT NULL
      `;
      
      console.log(chalk.green('✅ Migrated threaded submissions to comments'));
      
      // Update comment counts
      await sql`
        UPDATE posts 
        SET comment_count = (
          SELECT COUNT(*) 
          FROM comments 
          WHERE comments.post_id = posts.id
        )
      `;
      
      console.log(chalk.green('✅ Updated comment counts'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error during migration:'), error.message);
  }
}

async function fixMissingTables() {
  console.log(chalk.bold('🔧 PRODUCTION TABLE FIX SCRIPT'));
  console.log(chalk.gray('Checking and fixing missing tables for manage-user script\n'));
  
  try {
    // Check which tables exist
    const tables = ['users', 'accounts', 'sessions', 'submissions', 'posts', 'comments'];
    const tableStatus = {};
    
    console.log(chalk.blue('📋 CHECKING EXISTING TABLES:'));
    for (const table of tables) {
      const exists = await checkTableExists(table);
      tableStatus[table] = exists;
      const status = exists ? chalk.green('✅ EXISTS') : chalk.red('❌ MISSING');
      console.log(`  ${table}: ${status}`);
    }
    
    console.log('');
    
    // Show table structures for existing tables
    for (const [table, exists] of Object.entries(tableStatus)) {
      if (exists) {
        const columns = await getTableColumns(table);
        if (columns.length > 0) {
          console.log(chalk.cyan(`📊 ${table.toUpperCase()} COLUMNS:`));
          console.table(columns);
        }
      }
    }
    
    // Fix missing tables
    if (!tableStatus.posts) {
      console.log(chalk.yellow('\n⚠️ Posts table missing - creating...'));
      await createPostsTable();
    }
    
    if (!tableStatus.comments) {
      console.log(chalk.yellow('\n⚠️ Comments table missing - creating...'));
      await createCommentsTable();
    }
    
    // Migrate data if needed
    if (tableStatus.submissions && tableStatus.posts && tableStatus.comments) {
      await migrateSubmissionsToPosts();
    }
    
    console.log(chalk.green('\n✅ Table fix completed successfully!'));
    console.log(chalk.gray('The manage-user script should now work without permission errors.'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Fatal error:'), error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the fix
fixMissingTables().catch(console.error); 