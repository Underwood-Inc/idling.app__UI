-- Migration: Fix performance indexes with correct column names
-- Purpose: Create missing performance indexes using actual database column names
-- Previous migrations failed because they used incorrect column names

-- Drop any indexes that may have been created with wrong column names
DROP INDEX IF EXISTS idx_submissions_perf_filter;
DROP INDEX IF EXISTS idx_submissions_pagination;
DROP INDEX IF EXISTS idx_submissions_thread_hierarchy;
DROP INDEX IF EXISTS idx_submissions_author_search;
DROP INDEX IF EXISTS idx_submissions_author_lower;
DROP INDEX IF EXISTS idx_submissions_author_prefix;
DROP INDEX IF EXISTS idx_submissions_tags_gin_advanced;
DROP INDEX IF EXISTS idx_submissions_distinct_authors;
DROP INDEX IF EXISTS idx_submissions_author_activity;

-- Create performance indexes with CORRECT column names
-- (using submission_datetime instead of created_at, thread_parent_id instead of parent_submission_id)

-- 1. Composite index for author + author_id searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_search 
ON submissions (author, author_id) 
WHERE author IS NOT NULL AND author_id IS NOT NULL;

-- 2. Case-insensitive author search for user lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_lower 
ON submissions (LOWER(author)) 
WHERE author IS NOT NULL;

-- 3. Author prefix search for autocomplete functionality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_prefix 
ON submissions (author text_pattern_ops) 
WHERE author IS NOT NULL;

-- 4. Advanced GIN index for tag array operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_tags_gin_advanced 
ON submissions USING GIN (tags) 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- 5. Distinct author counting optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_distinct_authors 
ON submissions (author_id) 
WHERE author_id IS NOT NULL;

-- 6. Performance filter index for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_perf_filter 
ON submissions (submission_datetime DESC, author_id, submission_id);

-- 7. Pagination optimization for main query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_pagination 
ON submissions (submission_datetime DESC, submission_id);

-- 8. Thread hierarchy performance (using correct column name)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_thread_hierarchy 
ON submissions (thread_parent_id, submission_datetime) 
WHERE thread_parent_id IS NOT NULL;

-- 9. Author activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_activity 
ON submissions (author_id, submission_datetime DESC) 
WHERE author_id IS NOT NULL;

-- 10. Main posts only index (for filtering out replies)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_main_posts_only 
ON submissions (submission_datetime DESC, submission_id) 
WHERE thread_parent_id IS NULL;

-- 11. Tag statistics for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_tag_stats 
ON submissions USING GIN (tags) 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- ================================
-- MATERIALIZED VIEWS FOR MILLIONS OF RECORDS
-- ================================

-- Ensure user_submission_stats materialized view exists with correct structure
-- Drop and recreate to ensure correct structure
DROP MATERIALIZED VIEW IF EXISTS user_submission_stats CASCADE;

-- Create the materialized view
CREATE MATERIALIZED VIEW user_submission_stats AS
SELECT 
    author_id,
    author,
    COUNT(*) as submission_count,
    MAX(submission_datetime) as last_submission,
    MIN(submission_datetime) as first_submission,
    COUNT(CASE WHEN tags IS NOT NULL AND array_length(tags, 1) > 0 THEN 1 END) as submissions_with_tags,
    AVG(CASE WHEN thread_parent_id IS NULL THEN 1.0 ELSE 0.0 END) as original_post_ratio,
    COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as reply_count
FROM submissions 
WHERE author_id IS NOT NULL AND author IS NOT NULL
GROUP BY author_id, author;

-- Create indexes on user_submission_stats materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_author_id ON user_submission_stats (author_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_author_search ON user_submission_stats (author text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_user_stats_author_lower ON user_submission_stats (LOWER(author));
CREATE INDEX IF NOT EXISTS idx_user_stats_submission_count ON user_submission_stats (submission_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_activity ON user_submission_stats (last_submission DESC);

-- Create tag statistics materialized view for instant tag analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS tag_statistics AS
SELECT 
    unnest(tags) as tag,
    COUNT(*) as usage_count,
    COUNT(DISTINCT author_id) as unique_users,
    MAX(submission_datetime) as last_used,
    MIN(submission_datetime) as first_used,
    AVG(CASE WHEN thread_parent_id IS NULL THEN 1.0 ELSE 0.0 END) as original_post_ratio
FROM submissions 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
GROUP BY unnest(tags);

-- Create indexes on tag statistics
CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_stats_tag ON tag_statistics (tag);
CREATE INDEX IF NOT EXISTS idx_tag_stats_usage_count ON tag_statistics (usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tag_stats_unique_users ON tag_statistics (unique_users DESC);
CREATE INDEX IF NOT EXISTS idx_tag_stats_last_used ON tag_statistics (last_used DESC);

-- Create trending posts materialized view (last 7 days activity)
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_posts AS
SELECT 
    submission_id,
    author,
    author_id,
    submission_title,
    tags,
    submission_datetime,
    -- Calculate trending score based on recency and engagement
    (CASE 
        WHEN submission_datetime > NOW() - INTERVAL '1 day' THEN 10
        WHEN submission_datetime > NOW() - INTERVAL '3 days' THEN 5
        WHEN submission_datetime > NOW() - INTERVAL '7 days' THEN 2
        ELSE 1
    END) * (
        SELECT COUNT(*) FROM submissions s2 
        WHERE s2.thread_parent_id = s1.submission_id
    ) as trending_score
FROM submissions s1
WHERE submission_datetime > NOW() - INTERVAL '7 days'
    AND thread_parent_id IS NULL  -- Only main posts, not replies
ORDER BY trending_score DESC, submission_datetime DESC
LIMIT 1000;

-- Create indexes on trending posts
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_posts_id ON trending_posts (submission_id);
CREATE INDEX IF NOT EXISTS idx_trending_posts_score ON trending_posts (trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_posts_author ON trending_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_trending_posts_tags ON trending_posts USING GIN (tags);

-- Create daily summary materialized view for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_submission_stats AS
SELECT 
    DATE(submission_datetime) as date,
    COUNT(*) as total_submissions,
    COUNT(DISTINCT author_id) as unique_authors,
    COUNT(CASE WHEN thread_parent_id IS NULL THEN 1 END) as original_posts,
    COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as replies,
    COUNT(CASE WHEN tags IS NOT NULL AND array_length(tags, 1) > 0 THEN 1 END) as tagged_posts,
    ARRAY_AGG(DISTINCT unnest(tags)) FILTER (WHERE tags IS NOT NULL) as tags_used
FROM submissions
WHERE submission_datetime >= CURRENT_DATE - INTERVAL '90 days'  -- Last 90 days
GROUP BY DATE(submission_datetime)
ORDER BY date DESC;

-- Create indexes on daily stats
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_submission_stats (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_submissions ON daily_submission_stats (total_submissions DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_users ON daily_submission_stats (unique_authors DESC);

-- ================================
-- REFRESH FUNCTIONS
-- ================================

-- Enhanced refresh function for user stats
CREATE OR REPLACE FUNCTION refresh_user_submission_stats()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    row_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW user_submission_stats;
    SELECT COUNT(*) INTO row_count FROM user_submission_stats;
    end_time := clock_timestamp();
    RETURN 'User stats refreshed: ' || row_count || ' rows, ' || EXTRACT(EPOCH FROM (end_time - start_time)) || 's';
END;
$$;

-- Refresh function for tag statistics
CREATE OR REPLACE FUNCTION refresh_tag_statistics()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    row_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW tag_statistics;
    SELECT COUNT(*) INTO row_count FROM tag_statistics;
    end_time := clock_timestamp();
    RETURN 'Tag stats refreshed: ' || row_count || ' tags, ' || EXTRACT(EPOCH FROM (end_time - start_time)) || 's';
END;
$$;

-- Refresh function for trending posts
CREATE OR REPLACE FUNCTION refresh_trending_posts()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    row_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW trending_posts;
    SELECT COUNT(*) INTO row_count FROM trending_posts;
    end_time := clock_timestamp();
    RETURN 'Trending posts refreshed: ' || row_count || ' posts, ' || EXTRACT(EPOCH FROM (end_time - start_time)) || 's';
END;
$$;

-- Refresh function for daily stats
CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    row_count INTEGER;
BEGIN
    start_time := clock_timestamp();
    REFRESH MATERIALIZED VIEW daily_submission_stats;
    SELECT COUNT(*) INTO row_count FROM daily_submission_stats;
    end_time := clock_timestamp();
    RETURN 'Daily stats refreshed: ' || row_count || ' days, ' || EXTRACT(EPOCH FROM (end_time - start_time)) || 's';
END;
$$;

-- Master refresh function for all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result TEXT := '';
BEGIN
    result := result || refresh_user_submission_stats() || E'\n';
    result := result || refresh_tag_statistics() || E'\n';
    result := result || refresh_trending_posts() || E'\n';
    result := result || refresh_daily_stats() || E'\n';
    RETURN 'All materialized views refreshed:' || E'\n' || result;
END;
$$;

-- Update table statistics after index creation
ANALYZE submissions;
ANALYZE user_submission_stats;
ANALYZE tag_statistics;
ANALYZE trending_posts;
ANALYZE daily_submission_stats;

-- Verification query
SELECT 
    'performance_indexes_and_views' as component,
    COUNT(*) as created_indexes,
    CASE 
        WHEN COUNT(*) >= 10 THEN 'SUCCESS: All performance indexes created'
        ELSE 'WARNING: Some indexes may be missing - check for errors above'
    END as status
FROM pg_indexes 
WHERE tablename = 'submissions' 
AND indexname IN (
    'idx_submissions_author_search',
    'idx_submissions_author_lower', 
    'idx_submissions_author_prefix',
    'idx_submissions_tags_gin_advanced',
    'idx_submissions_distinct_authors',
    'idx_submissions_perf_filter',
    'idx_submissions_pagination',
    'idx_submissions_thread_hierarchy',
    'idx_submissions_author_activity',
    'idx_submissions_main_posts_only',
    'idx_submissions_tag_stats'

UNION ALL

-- Verify materialized views
SELECT 
    'materialized_views' as component,
    COUNT(*) as view_count,
    CASE 
        WHEN COUNT(*) >= 4 THEN 'SUCCESS: All materialized views created'
        ELSE 'WARNING: Some materialized views may be missing'
    END as status
FROM pg_matviews 
WHERE matviewname IN (
    'user_submission_stats',
    'tag_statistics', 
    'trending_posts',
    'daily_submission_stats'
); 