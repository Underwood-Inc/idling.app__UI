-- Migration: Final database state fix
-- Purpose: Ensure database has all required components without parser-breaking syntax
-- This migration avoids RAISE NOTICE and complex DO blocks that break the migration tool

-- Clean up any broken materialized views first
DROP MATERIALIZED VIEW IF EXISTS user_submission_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS user_post_stats CASCADE;
DROP FUNCTION IF EXISTS refresh_user_submission_stats() CASCADE;
DROP FUNCTION IF EXISTS refresh_user_stats() CASCADE;

-- Create materialized view with correct structure
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
WHERE author_id IS NOT NULL 
    AND author IS NOT NULL
GROUP BY author_id, author;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_user_stats_author_id ON user_submission_stats (author_id);
CREATE INDEX idx_user_stats_author_search ON user_submission_stats (author text_pattern_ops);
CREATE INDEX idx_user_stats_author_lower ON user_submission_stats (LOWER(author));
CREATE INDEX idx_user_stats_submission_count ON user_submission_stats (submission_count DESC);
CREATE INDEX idx_user_stats_last_activity ON user_submission_stats (last_submission DESC);

-- Create working refresh function
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
    RETURN 'Success: ' || row_count || ' rows, ' || EXTRACT(EPOCH FROM (end_time - start_time)) || 's';
END;
$$;

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
    id SERIAL PRIMARY KEY,
    query_type VARCHAR(50) NOT NULL,
    query_params JSONB,
    execution_time_ms NUMERIC(10,2) NOT NULL,
    result_count INTEGER,
    used_materialized_view BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create performance log indexes
CREATE INDEX IF NOT EXISTS idx_query_perf_type_time ON query_performance_log (query_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_perf_slow_queries ON query_performance_log (execution_time_ms DESC) WHERE execution_time_ms > 500;

-- Test the refresh function
SELECT refresh_user_submission_stats() as test_refresh;

-- Update statistics
ANALYZE user_submission_stats;
ANALYZE submissions;
ANALYZE query_performance_log;

-- Final verification
SELECT 
    'materialized_view' as component,
    COUNT(*) as row_count,
    'SUCCESS' as status
FROM user_submission_stats; 