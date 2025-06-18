-- Migration: 0008-create-materialized-view-user-stats.sql
-- Purpose: Create materialized view for user statistics to support millions of records
-- This migration creates the materialized view that may have failed in previous migration

BEGIN;

-- ================================
-- CREATE MATERIALIZED VIEW FOR USER STATISTICS
-- ================================

-- Drop existing view if it exists (in case of partial creation)
DROP MATERIALIZED VIEW IF EXISTS user_submission_stats;

-- Create materialized view for user statistics
-- This pre-computes user data for instant search results
CREATE MATERIALIZED VIEW user_submission_stats AS
SELECT 
    author_id,
    author,
    COUNT(*) as submission_count,
    MAX(submission_datetime) as last_submission,
    MIN(submission_datetime) as first_submission,
    COUNT(DISTINCT CASE WHEN tags IS NOT NULL AND array_length(tags, 1) > 0 THEN 1 END) as submissions_with_tags,
    -- Additional useful statistics
    AVG(CASE WHEN thread_parent_id IS NULL THEN 1 ELSE 0 END) as original_post_ratio,
    COUNT(CASE WHEN thread_parent_id IS NOT NULL THEN 1 END) as reply_count
FROM submissions 
WHERE author_id IS NOT NULL 
    AND author IS NOT NULL 
GROUP BY author_id, author;

-- Create indexes on the materialized view for optimal performance
CREATE UNIQUE INDEX idx_user_stats_author_id 
ON user_submission_stats (author_id);

CREATE INDEX idx_user_stats_author_search 
ON user_submission_stats (author text_pattern_ops);

CREATE INDEX idx_user_stats_author_lower 
ON user_submission_stats (LOWER(author));

CREATE INDEX idx_user_stats_submission_count 
ON user_submission_stats (submission_count DESC);

CREATE INDEX idx_user_stats_last_activity 
ON user_submission_stats (last_submission DESC);

-- ================================
-- CREATE REFRESH FUNCTION
-- ================================

-- Function to refresh user stats (call periodically)
CREATE OR REPLACE FUNCTION refresh_user_submission_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Use CONCURRENTLY for zero-downtime refresh
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_submission_stats;
    
    -- Log refresh for monitoring (ignore if admin_logs table doesn't exist)
    BEGIN
        INSERT INTO admin_logs (action, details, created_at) 
        VALUES ('refresh_user_stats', 'User submission stats refreshed', NOW());
    EXCEPTION
        WHEN OTHERS THEN
            -- Continue even if logging fails
            NULL;
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        -- If concurrent refresh fails, try regular refresh
        REFRESH MATERIALIZED VIEW user_submission_stats;
END;
$$;

-- ================================
-- PERFORMANCE MONITORING
-- ================================

-- Create table to track query performance
CREATE TABLE IF NOT EXISTS query_performance_log (
    id SERIAL PRIMARY KEY,
    query_type VARCHAR(50) NOT NULL,
    query_params JSONB,
    execution_time_ms NUMERIC(10,2) NOT NULL,
    result_count INTEGER,
    used_materialized_view BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance log queries
CREATE INDEX IF NOT EXISTS idx_query_perf_type_time 
ON query_performance_log (query_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_perf_slow_queries 
ON query_performance_log (execution_time_ms DESC) 
WHERE execution_time_ms > 500;

-- ================================
-- INITIAL DATA POPULATION
-- ================================

-- Perform initial refresh of the materialized view
SELECT refresh_user_submission_stats();

-- Update table statistics for optimal query planning
ANALYZE user_submission_stats;
ANALYZE submissions;
ANALYZE query_performance_log;

COMMIT;

-- ================================
-- POST-MIGRATION VERIFICATION
-- ================================

-- Verify materialized view was created successfully
DO $$
DECLARE
    view_count INTEGER;
    user_count INTEGER;
BEGIN
    -- Check if materialized view exists and has data
    SELECT COUNT(*) INTO view_count FROM user_submission_stats;
    
    -- Check total users in main table
    SELECT COUNT(DISTINCT author_id) INTO user_count 
    FROM submissions 
    WHERE author_id IS NOT NULL;
    
    -- Log results
    RAISE NOTICE 'Materialized view created successfully:';
    RAISE NOTICE '- Materialized view rows: %', view_count;
    RAISE NOTICE '- Total unique users: %', user_count;
    RAISE NOTICE '- Coverage: % of users', ROUND((view_count::NUMERIC / user_count::NUMERIC) * 100, 2);
END $$; 