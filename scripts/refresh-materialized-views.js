#!/usr/bin/env node

/**
 * Production-ready script to refresh materialized views
 * Usage: node scripts/refresh-materialized-views.js [view_name]
 *
 * Examples:
 *   node scripts/refresh-materialized-views.js              # Refresh all views
 *   node scripts/refresh-materialized-views.js user_stats   # Refresh specific view
 */

const { createRequire } = require('module');
const require = createRequire(import.meta.url);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logError(message, error) {
  log(`❌ ${message}`, 'red');
  if (error) {
    console.error(error);
  }
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Database connection setup for production
async function getDatabaseConnection() {
  try {
    // Try different import paths for production vs development
    let sql;
    try {
      // Try built version first (production)
      const { default: sqlImport } = await import(
        '../.next/server/app/lib/db.js'
      );
      sql = sqlImport;
    } catch (e1) {
      try {
        // Try source version (development)
        const { default: sqlImport } = await import('../src/lib/db.js');
        sql = sqlImport;
      } catch (e2) {
        // Try alternative paths
        const { default: sqlImport } = await import('../dist/lib/db.js');
        sql = sqlImport;
      }
    }
    return sql;
  } catch (error) {
    logError('Failed to connect to database', error);
    throw error;
  }
}

// Individual refresh functions
async function refreshUserStats(sql) {
  logInfo('Refreshing user submission stats...');
  const result = await sql`SELECT refresh_user_submission_stats() as result`;
  return result[0]?.result || 'Success';
}

async function refreshTagStats(sql) {
  logInfo('Refreshing tag statistics...');
  const result = await sql`SELECT refresh_tag_statistics() as result`;
  return result[0]?.result || 'Success';
}

async function refreshTrendingPosts(sql) {
  logInfo('Refreshing trending posts...');
  const result = await sql`SELECT refresh_trending_posts() as result`;
  return result[0]?.result || 'Success';
}

async function refreshDailyStats(sql) {
  logInfo('Refreshing daily statistics...');
  const result = await sql`SELECT refresh_daily_stats() as result`;
  return result[0]?.result || 'Success';
}

async function refreshAllViews(sql) {
  logInfo('Refreshing all materialized views...');
  try {
    const result = await sql`SELECT refresh_all_materialized_views() as result`;
    return result[0]?.result || 'Success';
  } catch (error) {
    // If function doesn't exist, refresh individually
    if (error.code === '42883') {
      logWarning(
        'refresh_all_materialized_views() not found, refreshing individually...'
      );
      let results = [];
      try {
        results.push(await refreshUserStats(sql));
      } catch (e) {
        logWarning('User stats refresh failed: ' + e.message);
      }
      try {
        results.push(await refreshTagStats(sql));
      } catch (e) {
        logWarning('Tag stats refresh skipped: ' + e.message);
      }
      try {
        results.push(await refreshTrendingPosts(sql));
      } catch (e) {
        logWarning('Trending posts refresh skipped: ' + e.message);
      }
      try {
        results.push(await refreshDailyStats(sql));
      } catch (e) {
        logWarning('Daily stats refresh skipped: ' + e.message);
      }
      return results.filter((r) => r).join('; ');
    }
    throw error;
  }
}

// Main execution function
async function main() {
  const args = process.argv.slice(2);
  const viewName = args[0];

  logInfo(
    `Starting materialized view refresh${viewName ? ` for: ${viewName}` : ' (all views)'}`
  );

  let sql;
  try {
    sql = await getDatabaseConnection();
    logSuccess('Database connection established');
  } catch (error) {
    logError('Failed to establish database connection');
    process.exit(1);
  }

  try {
    let result;

    switch (viewName) {
      case 'user_stats':
        result = await refreshUserStats(sql);
        break;
      case 'tag_stats':
        result = await refreshTagStats(sql);
        break;
      case 'trending_posts':
        result = await refreshTrendingPosts(sql);
        break;
      case 'daily_stats':
        result = await refreshDailyStats(sql);
        break;
      case undefined:
      case 'all':
        result = await refreshAllViews(sql);
        break;
      default:
        logError(`Unknown view name: ${viewName}`);
        logInfo(
          'Available options: user_stats, tag_stats, trending_posts, daily_stats, all'
        );
        process.exit(1);
    }

    logSuccess(`Materialized view refresh completed`);
    logInfo(`Result: ${result}`);
  } catch (error) {
    logError('Materialized view refresh failed', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (sql && typeof sql.end === 'function') {
      await sql.end();
    }
  }
}

// Handle process signals
process.on('SIGINT', () => {
  logWarning('Received SIGINT, exiting gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logWarning('Received SIGTERM, exiting gracefully...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    logError('Script execution failed', error);
    process.exit(1);
  });
}

module.exports = { main };
