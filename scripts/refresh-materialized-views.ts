#!/usr/bin/env tsx

/**
 * Standalone TypeScript script to refresh materialized views
 * Usage: npx tsx scripts/refresh-materialized-views.ts [view_name]
 *
 * Examples:
 *   npx tsx scripts/refresh-materialized-views.ts              # Refresh all views
 *   npx tsx scripts/refresh-materialized-views.ts user_stats   # Refresh specific view
 */

import sql from '../src/lib/db';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logError(message: string, error?: Error) {
  log(`❌ ${message}`, 'red');
  if (error) {
    console.error(error);
  }
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

// Individual refresh functions
async function refreshUserStats() {
  logInfo('Refreshing user submission stats...');
  const result = await sql`SELECT refresh_user_submission_stats() as result`;
  return result[0]?.result || 'Success';
}

async function refreshTagStats() {
  logInfo('Refreshing tag statistics...');
  const result = await sql`SELECT refresh_tag_statistics() as result`;
  return result[0]?.result || 'Success';
}

async function refreshTrendingPosts() {
  logInfo('Refreshing trending posts...');
  const result = await sql`SELECT refresh_trending_posts() as result`;
  return result[0]?.result || 'Success';
}

async function refreshDailyStats() {
  logInfo('Refreshing daily statistics...');
  const result = await sql`SELECT refresh_daily_stats() as result`;
  return result[0]?.result || 'Success';
}

async function refreshAllViews() {
  logInfo('Refreshing all materialized views...');
  const result = await sql`SELECT refresh_all_materialized_views() as result`;
  return result[0]?.result || 'Success';
}

// Main execution function
async function main() {
  const args = process.argv.slice(2);
  const viewName = args[0];

  logInfo(
    `Starting materialized view refresh${viewName ? ` for: ${viewName}` : ' (all views)'}`
  );

  try {
    logSuccess('Database connection established');
  } catch (error) {
    logError('Failed to establish database connection');
    process.exit(1);
  }

  try {
    let result: string;

    switch (viewName) {
      case 'user_stats':
        result = await refreshUserStats();
        break;
      case 'tag_stats':
        result = await refreshTagStats();
        break;
      case 'trending_posts':
        result = await refreshTrendingPosts();
        break;
      case 'daily_stats':
        result = await refreshDailyStats();
        break;
      case undefined:
      case 'all':
        result = await refreshAllViews();
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
    logError('Materialized view refresh failed', error as Error);
    process.exit(1);
  } finally {
    // Close database connection
    await sql.end();
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

export { main };
