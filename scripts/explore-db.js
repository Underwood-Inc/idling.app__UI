/* eslint-disable no-console, no-undef, no-constant-condition, no-fallthrough */
// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: '.env.local' });

// Chalk will be dynamically imported in main function
let chalk;
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
  console.log('  3. Database statistics');
  console.log('  4. Table sizes');
  
  console.log(chalk.yellow('\n🔍 Schema Info:'));
  console.log('  5. Describe table');
  console.log('  6. List indexes');
  console.log('  7. Show relationships');
  
  console.log(chalk.cyan('\n⚡ Custom Queries:'));
  console.log('  8. Run custom SQL');
  console.log('  9. Popular queries');
  
  console.log(chalk.magenta('\n🛠️ Utilities:'));
  console.log('  10. Connection info');
  console.log('  11. Database health');
  
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
      relname as table_name,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as table_size,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_rows,
      n_dead_tup as dead_rows
    FROM pg_stat_user_tables 
    ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
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
  console.log('  1. Recent signups');
  console.log('  2. Active subscriptions');
  console.log('  3. Pending custom emojis');
  console.log('  4. Admin role holders');
  console.log('  0. Back to main menu\n');
  
  const choice = await prompt('Enter choice: ');
  
  switch (choice) {
    case '1':
      await runPopularQuery('most_active_users');
      break;
    case '2':
      await runPopularQuery('active_subscriptions');
      break;
    case '3':
      await runPopularQuery('pending_emojis');
      break;
    case '4':
      await runPopularQuery('admin_users');
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
          SELECT name, email, created_at, profile_public
          FROM users
          ORDER BY created_at DESC
          LIMIT 25
        `;
        break;

      case 'active_subscriptions':
        result = await sql`
          SELECT u.name, u.email, sp.display_name AS plan, us.status, us.current_period_end
          FROM user_subscriptions us
          JOIN users u ON u.id = us.user_id
          JOIN subscription_plans sp ON sp.id = us.plan_id
          WHERE us.status IN ('active', 'trialing')
          ORDER BY us.created_at DESC
          LIMIT 25
        `;
        break;

      case 'pending_emojis':
        result = await sql`
          SELECT ce.id, ce.name, u.name AS submitted_by, ce.created_at
          FROM custom_emojis ce
          JOIN users u ON u.id = ce.user_id
          WHERE ce.approval_status = 'pending'
          ORDER BY ce.created_at ASC
          LIMIT 25
        `;
        break;

      case 'admin_users':
        result = await sql`
          SELECT u.name, u.email, ur.display_name AS role, ura.assigned_at
          FROM user_role_assignments ura
          JOIN users u ON u.id = ura.user_id
          JOIN user_roles ur ON ur.id = ura.role_id
          WHERE ura.is_active = true
            AND ur.name IN ('admin', 'moderator')
          ORDER BY ura.assigned_at DESC
          LIMIT 25
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
        (SELECT COUNT(*) FROM sessions WHERE expires > NOW()) as active_sessions,
        (SELECT COUNT(*) FROM custom_emojis WHERE approval_status = 'pending') as pending_emojis
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
  // Dynamic import for chalk (ES module)
  const chalkModule = await import('chalk');
  chalk = chalkModule.default;
  
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
          await showDatabaseStats();
          break;
        case '4':
          await showTableSizes();
          break;
        case '5':
          await describeTable();
          break;
        case '6':
          await listIndexes();
          break;
        case '7':
          await showRelationships();
          break;
        case '8':
          await runCustomSQL();
          break;
        case '9':
          await showPopularQueries();
          break;
        case '10':
          await showConnectionInfo();
          break;
        case '11':
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