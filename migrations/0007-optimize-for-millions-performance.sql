-- Migration: 0007-optimize-for-millions-performance.sql
-- Purpose: Comprehensive database optimizations for handling millions of records
-- Includes advanced indexing, constraints, and query optimizations
-- NOTE: This migration runs without transaction due to CONCURRENTLY operations

-- ================================
-- ADVANCED SEARCH OPTIMIZATIONS
-- ================================

-- 1. Composite index for user search (author + author_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_search 
ON submissions (author, author_id) 
WHERE author IS NOT NULL AND author_id IS NOT NULL;

-- 2. Case-insensitive text search index for usernames
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_lower 
ON submissions (LOWER(author)) 
WHERE author IS NOT NULL;

-- 3. Prefix search index for autocomplete
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_prefix 
ON submissions (author text_pattern_ops) 
WHERE author IS NOT NULL;

-- 4. Advanced GIN index for tag array operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_tags_gin_advanced 
ON submissions USING GIN (tags) 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- 5. Partial index for fast user counting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_distinct_authors 
ON submissions (author_id) 
WHERE author_id IS NOT NULL;

-- ================================
-- PERFORMANCE MONITORING INDEXES
-- ================================

-- 6. Query performance index for submission filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_perf_filter 
ON submissions (created_at DESC, author_id, submission_id) 
WHERE deleted_at IS NULL;

-- 7. Pagination optimization index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_pagination 
ON submissions (created_at DESC, submission_id) 
WHERE deleted_at IS NULL;

-- 8. Thread hierarchy performance index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_thread_hierarchy 
ON submissions (parent_submission_id, created_at) 
WHERE parent_submission_id IS NOT NULL;

-- ================================
-- STATISTICAL INDEXES FOR ANALYTICS
-- ================================

-- 9. Tag usage statistics index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_tag_stats 
ON submissions USING GIN (tags) 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- 10. Author activity index for performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_activity 
ON submissions (author_id, created_at DESC) 
WHERE author_id IS NOT NULL AND deleted_at IS NULL;

-- ================================
-- NON-CONCURRENT OPERATIONS
-- (These can run in a transaction block)
-- ================================

BEGIN;

-- Update statistics for better query planning
ANALYZE submissions;

-- ================================
-- QUERY OPTIMIZATION VIEWS
-- ================================

-- Create materialized view for user statistics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_submission_stats AS
SELECT 
    author_id,
    author,
    COUNT(*) as submission_count,
    MAX(created_at) as last_submission,
    MIN(created_at) as first_submission,
    COUNT(DISTINCT CASE WHEN tags IS NOT NULL THEN 1 END) as submissions_with_tags
FROM submissions 
WHERE author_id IS NOT NULL 
    AND author IS NOT NULL 
    AND deleted_at IS NULL
GROUP BY author_id, author;

COMMIT;

-- ================================
-- MATERIALIZED VIEW INDEXES
-- (Cannot be CONCURRENT on materialized views)
-- ================================

-- Index the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_author_id 
ON user_submission_stats (author_id);

CREATE INDEX IF NOT EXISTS idx_user_stats_author_search 
ON user_submission_stats (author text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_user_stats_submission_count 
ON user_submission_stats (submission_count DESC);

-- ================================
-- MAINTENANCE FUNCTIONS
-- ================================

BEGIN;

-- Function to refresh user stats (call periodically)
CREATE OR REPLACE FUNCTION refresh_user_submission_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_submission_stats;
    
    -- Log refresh for monitoring
    INSERT INTO admin_logs (action, details, created_at) 
    VALUES ('refresh_user_stats', 'User submission stats refreshed', NOW())
    ON CONFLICT DO NOTHING; -- Ignore if admin_logs table doesn't exist
    
EXCEPTION
    WHEN OTHERS THEN
        -- Continue even if logging fails
        NULL;
END;
$$;

-- ================================
-- PERFORMANCE MONITORING TABLE
-- ================================

-- Table to track query performance (optional)
CREATE TABLE IF NOT EXISTS query_performance_log (
    id SERIAL PRIMARY KEY,
    query_type VARCHAR(50) NOT NULL,
    query_params JSONB,
    execution_time_ms NUMERIC(10,2) NOT NULL,
    result_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance log queries
CREATE INDEX IF NOT EXISTS idx_query_perf_type_time 
ON query_performance_log (query_type, created_at DESC);

COMMIT;

-- ================================
-- POST-MIGRATION RECOMMENDATIONS
-- ================================

-- COMMENT: After this migration, consider:
-- 1. Run VACUUM ANALYZE on submissions table
-- 2. Monitor query performance with the new indexes
-- 3. Schedule periodic refresh of user_submission_stats (every hour)
-- 4. Monitor index usage with pg_stat_user_indexes
-- 5. Consider partitioning submissions table if > 10M records
-- 6. Set up connection pooling (pgbouncer) for better connection management
-- 7. Configure shared_buffers to 25% of available RAM
-- 8. Set effective_cache_size to 75% of available RAM 