/* eslint-disable no-console */
// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

const chalk = require('chalk');
const postgres = require('postgres');
const readline = require('readline');

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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Display main menu
function showMenu() {
  console.clear();
  console.log(chalk.blue.bold('🧙‍♂️ Database Explorer'));
  console.log(chalk.gray('Interactive PostgreSQL database exploration\n'));
  
  console.log(chalk.green('📊 Quick Views:'));
  console.log('  1. List all tables');
  console.log('  2. Recent users');
  console.log('  3. Recent posts');
  console.log('  4. Recent comments');
  console.log('  5. Database statistics');
  console.log('  6. Table sizes');
  
  console.log(chalk.yellow('\n🔍 Schema Info:'));
  console.log('  7. Describe table');
  console.log('  8. List indexes');
  console.log('  9. Show relationships');
  
  console.log(chalk.cyan('\n⚡ Custom Queries:'));
  console.log('  10. Run custom SQL');
  console.log('  11. Popular queries');
  
  console.log(chalk.magenta('\n🛠️ Utilities:'));
  console.log('  12. Connection info');
  console.log('  13. Database health');
  
  console.log(chalk.red('\n  0. Exit\n'));
}

// Table listing
async function listTables() {
  console.log(chalk.blue('📋 All Tables\n'));
  
  const tables = await sql`
    SELECT 
      table_name,
      table_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  
  console.table(tables);
}

// Recent users
async function showRecentUsers() {
  console.log(chalk.blue('👥 Recent Users\n'));
  
  const users = await sql`
    SELECT 
      id, 
      name, 
      email, 
      created_at,
      profile_public
    FROM users 
    ORDER BY created_at DESC 
    LIMIT 15
  `;
  
  console.table(users);
}

// Recent posts
async function showRecentPosts() {
  console.log(chalk.blue('📝 Recent Posts\n'));
  
  const posts = await sql`
    SELECT 
      p.id,
      p.title,
      u.name as author,
      p.subthread,
      p.score,
      p.comment_count,
      p.created_at
    FROM posts p
    JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC
    LIMIT 15
  `;
  
  console.table(posts);
}

// Recent comments
async function showRecentComments() {
  console.log(chalk.blue('💬 Recent Comments\n'));
  
  const comments = await sql`
    SELECT 
      c.id,
      LEFT(c.content, 60) as content_preview,
      u.name as author,
      p.title as post_title,
      c.score,
      c.created_at
    FROM comments c
    JOIN users u ON c.author_id = u.id
    JOIN posts p ON c.post_id = p.id
    ORDER BY c.created_at DESC
    LIMIT 15
  `;
  
  console.table(comments);
}

// Database statistics
async function showDatabaseStats() {
  console.log(chalk.blue('📊 Database Statistics\n'));
  
  try {
    const stats = await sql`
      SELECT 
        'Users' as table_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
      FROM users
      
      UNION ALL
      
      SELECT 
        'Posts' as table_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
      FROM posts
      
      UNION ALL
      
      SELECT 
        'Comments' as table_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
      FROM comments
      
      UNION ALL
      
      SELECT 
        'Sessions' as table_name,
        COUNT(*) as total_count,
        COUNT(CASE WHEN expires > NOW() THEN 1 END) as active_sessions,
        COUNT(CASE WHEN expires <= NOW() THEN 1 END) as expired_sessions
      FROM sessions
    `;
    
    console.table(stats);
  } catch (error) {
    console.error(chalk.red('❌ Error getting statistics:'), error.message);
  }
}

// Table sizes
async function showTableSizes() {
  console.log(chalk.blue('💾 Table Sizes\n'));
  
  const sizes = await sql`
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_rows,
      n_dead_tup as dead_rows
    FROM pg_stat_user_tables 
    ORDER BY n_live_tup DESC
  `;
  
  console.table(sizes);
}

// Describe table
async function describeTable() {
  const tableName = await prompt(chalk.yellow('Enter table name: '));
  
  if (!tableName.trim()) {
    console.log(chalk.red('❌ Table name required'));
    return;
  }
  
  console.log(chalk.blue(`🏗️ Table Structure: ${tableName}\n`));
  
  try {
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = ${tableName.toLowerCase()}
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    if (columns.length === 0) {
      console.log(chalk.red(`❌ Table '${tableName}' not found`));
      return;
    }
    
    console.table(columns);
    
    // Show constraints
    const constraints = await sql`
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = ${tableName.toLowerCase()}
      AND table_schema = 'public'
    `;
    
    if (constraints.length > 0) {
      console.log(chalk.green('\n🔒 Constraints:'));
      console.table(constraints);
    }
  } catch (error) {
    console.error(chalk.red('❌ Error describing table:'), error.message);
  }
}

// List indexes
async function listIndexes() {
  console.log(chalk.blue('🗂️ Database Indexes\n'));
  
  const indexes = await sql`
    SELECT 
      i.relname as index_name,
      t.relname as table_name,
      a.attname as column_name,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary
    FROM pg_class i
    JOIN pg_index ix ON i.oid = ix.indexrelid
    JOIN pg_class t ON ix.indrelid = t.oid
    JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = ANY(ix.indkey)
    WHERE t.relkind = 'r'
    AND t.relname NOT LIKE 'pg_%'
    ORDER BY t.relname, i.relname, a.attnum
  `;
  
  console.table(indexes);
}

// Show relationships
async function showRelationships() {
  console.log(chalk.blue('🔗 Table Relationships\n'));
  
  const relationships = await sql`
    SELECT 
      tc.table_name as from_table,
      kcu.column_name as from_column,
      ccu.table_name as to_table,
      ccu.column_name as to_column,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  `;
  
  console.table(relationships);
}

// Run custom SQL
async function runCustomSQL() {
  console.log(chalk.yellow('⚡ Custom SQL Query'));
  console.log(chalk.gray('Enter your SQL query (end with semicolon on new line):\n'));
  
  let query = '';
  let line = '';
  
  while (true) {
    line = await prompt('SQL> ');
    
    if (line.trim() === ';') {
      break;
    }
    
    query += line + '\n';
    
    if (line.trim().endsWith(';')) {
      break;
    }
  }
  
  if (!query.trim()) {
    console.log(chalk.red('❌ No query entered'));
    return;
  }
  
  console.log(chalk.blue(`\n🔍 Executing: ${query.trim()}\n`));
  
  try {
    const result = await sql.unsafe(query.trim());
    
    if (Array.isArray(result) && result.length > 0) {
      console.table(result);
      console.log(chalk.green(`\n✅ ${result.length} rows returned`));
    } else {
      console.log(chalk.green('✅ Query executed successfully'));
    }
  } catch (error) {
    console.error(chalk.red('❌ SQL Error:'), error.message);
  }
}

// Popular queries
async function showPopularQueries() {
  console.log(chalk.blue('⚡ Popular Queries\n'));
  console.log('Select a query to run:');
  console.log('  1. Most active users');
  console.log('  2. Popular subthreads');
  console.log('  3. Recent activity timeline');
  console.log('  4. User engagement stats');
  console.log('  5. Content moderation queue');
  console.log('  0. Back to main menu\n');
  
  const choice = await prompt('Enter choice: ');
  
  switch (choice) {
    case '1':
      await runPopularQuery('most_active_users');
      break;
    case '2':
      await runPopularQuery('popular_subthreads');
      break;
    case '3':
      await runPopularQuery('recent_activity');
      break;
    case '4':
      await runPopularQuery('engagement_stats');
      break;
    case '5':
      await runPopularQuery('moderation_queue');
      break;
    case '0':
      return;
    default:
      console.log(chalk.red('❌ Invalid choice'));
  }
}

// Run popular query
async function runPopularQuery(queryType) {
  console.log(chalk.blue(`\n🔍 Running: ${queryType.replace('_', ' ')}\n`));
  
  try {
    let result;
    
    switch (queryType) {
      case 'most_active_users':
        result = await sql`
          SELECT 
            u.name,
            u.email,
            COUNT(DISTINCT p.id) as posts,
            COUNT(DISTINCT c.id) as comments,
            (COUNT(DISTINCT p.id) + COUNT(DISTINCT c.id)) as total_activity
          FROM users u
          LEFT JOIN posts p ON u.id = p.author_id
          LEFT JOIN comments c ON u.id = c.author_id
          GROUP BY u.id, u.name, u.email
          HAVING COUNT(DISTINCT p.id) > 0 OR COUNT(DISTINCT c.id) > 0
          ORDER BY total_activity DESC
          LIMIT 20
        `;
        break;
        
      case 'popular_subthreads':
        result = await sql`
          SELECT 
            subthread,
            COUNT(*) as post_count,
            AVG(score) as avg_score,
            SUM(comment_count) as total_comments
          FROM posts
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY subthread
          ORDER BY post_count DESC
          LIMIT 15
        `;
        break;
        
      case 'recent_activity':
        result = await sql`
          SELECT 
            'post' as type,
            title as content,
            (SELECT name FROM users WHERE id = author_id) as author,
            created_at
          FROM posts
          WHERE created_at > NOW() - INTERVAL '7 days'
          
          UNION ALL
          
          SELECT 
            'comment' as type,
            LEFT(content, 60) as content,
            (SELECT name FROM users WHERE id = author_id) as author,
            created_at
          FROM comments
          WHERE created_at > NOW() - INTERVAL '7 days'
          
          ORDER BY created_at DESC
          LIMIT 25
        `;
        break;
        
      case 'engagement_stats':
        result = await sql`
          SELECT 
            DATE(created_at) as date,
            COUNT(DISTINCT CASE WHEN author_id IS NOT NULL THEN author_id END) as active_users,
            COUNT(*) as total_posts,
            AVG(score) as avg_score,
            SUM(comment_count) as total_comments
          FROM posts
          WHERE created_at > NOW() - INTERVAL '14 days'
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `;
        break;
        
      case 'moderation_queue':
        result = await sql`
          SELECT 
            'post' as content_type,
            id as content_id,
            title as content,
            score,
            created_at,
            (SELECT name FROM users WHERE id = author_id) as author
          FROM posts
          WHERE score < -2 OR title ILIKE '%spam%' OR title ILIKE '%test%'
          
          UNION ALL
          
          SELECT 
            'comment' as content_type,
            id as content_id,
            LEFT(content, 100) as content,
            score,
            created_at,
            (SELECT name FROM users WHERE id = author_id) as author
          FROM comments
          WHERE score < -2 OR content ILIKE '%spam%'
          
          ORDER BY created_at DESC
          LIMIT 20
        `;
        break;
    }
    
    if (result && result.length > 0) {
      console.table(result);
      console.log(chalk.green(`\n✅ ${result.length} rows returned`));
    } else {
      console.log(chalk.yellow('⚠️ No results found'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Query Error:'), error.message);
  }
}

// Connection info
async function showConnectionInfo() {
  console.log(chalk.blue('🔌 Connection Information\n'));
  
  const info = await sql`
    SELECT 
      current_database() as database,
      current_user as user,
      inet_server_addr() as host,
      inet_server_port() as port,
      version() as postgres_version
  `;
  
  console.table(info);
  
  console.log(chalk.green('\n📊 Connection Stats:'));
  const stats = await sql`
    SELECT 
      COUNT(*) as active_connections,
      COUNT(CASE WHEN state = 'active' THEN 1 END) as active_queries
    FROM pg_stat_activity
    WHERE datname = current_database()
  `;
  
  console.table(stats);
}

// Database health
async function checkDatabaseHealth() {
  console.log(chalk.blue('🏥 Database Health Check\n'));
  
  try {
    // Basic connectivity
    await sql`SELECT 1`;
    console.log(chalk.green('✅ Database connection: OK'));
    
    // Check core tables exist
    const tables = await sql`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(chalk.green(`✅ Tables found: ${tables[0].table_count}`));
    
    // Check for recent activity
    const recentActivity = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
        (SELECT COUNT(*) FROM posts WHERE created_at > NOW() - INTERVAL '24 hours') as new_posts_24h,
        (SELECT COUNT(*) FROM comments WHERE created_at > NOW() - INTERVAL '24 hours') as new_comments_24h
    `;
    
    console.log(chalk.green('✅ Recent activity (24h):'));
    console.table(recentActivity);
    
    // Check disk usage (if permissions allow)
    try {
      const diskUsage = await sql`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size
      `;
      console.log(chalk.green(`✅ Database size: ${diskUsage[0].database_size}`));
    } catch (error) {
      console.log(chalk.yellow('⚠️ Disk usage info not available'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Health check failed:'), error.message);
  }
}

// Main application loop
async function main() {
  console.log(chalk.green('🔗 Connecting to database...'));
  
  try {
    // Test connection
    await sql`SELECT 1`;
    console.log(chalk.green('✅ Connected successfully!\n'));
  } catch (error) {
    console.error(chalk.red('❌ Connection failed:'), error.message);
    process.exit(1);
  }
  
  while (true) {
    try {
      showMenu();
      const choice = await prompt(chalk.yellow('Enter your choice: '));
      
      console.log(); // Empty line for spacing
      
      switch (choice) {
        case '1':
          await listTables();
          break;
        case '2':
          await showRecentUsers();
          break;
        case '3':
          await showRecentPosts();
          break;
        case '4':
          await showRecentComments();
          break;
        case '5':
          await showDatabaseStats();
          break;
        case '6':
          await showTableSizes();
          break;
        case '7':
          await describeTable();
          break;
        case '8':
          await listIndexes();
          break;
        case '9':
          await showRelationships();
          break;
        case '10':
          await runCustomSQL();
          break;
        case '11':
          await showPopularQueries();
          break;
        case '12':
          await showConnectionInfo();
          break;
        case '13':
          await checkDatabaseHealth();
          break;
        case '0':
          console.log(chalk.blue('👋 Goodbye!'));
          await sql.end();
          rl.close();
          process.exit(0);
        default:
          console.log(chalk.red('❌ Invalid choice. Please try again.'));
      }
      
      if (choice !== '0') {
        await prompt(chalk.gray('\nPress Enter to continue...'));
      }
      
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      await prompt(chalk.gray('Press Enter to continue...'));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\n👋 Shutting down...'));
  await sql.end();
  rl.close();
  process.exit(0);
});

// Start the application
main().catch((error) => {
  console.error(chalk.red('❌ Fatal error:'), error);
  process.exit(1);
});