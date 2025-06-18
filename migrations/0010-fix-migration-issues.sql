-- Migration: Ensure database state is correct regardless of previous migration status
-- Purpose: Fix any issues from migrations 0007, 0008, and 0009 in an idempotent way
-- This migration detects current state and only fixes what's missing or broken

-- ================================
-- PART 1: ENSURE MATERIALIZED VIEW EXISTS AND WORKS
-- ================================

-- Drop and recreate materialized view only if it exists but is broken
DO $$
DECLARE
    view_exists BOOLEAN;
    function_exists BOOLEAN;
    function_works BOOLEAN := FALSE;
BEGIN
    -- Check if materialized view exists
    SELECT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'user_submission_stats'
    ) INTO view_exists;
    
    -- Check if refresh function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'refresh_user_submission_stats'
    ) INTO function_exists;
    
    -- Test if function works (if it exists)
    IF function_exists THEN
        BEGIN
            PERFORM refresh_user_submission_stats();
            function_works := TRUE;
            RAISE NOTICE 'Existing refresh function works correctly';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Existing refresh function is broken, will recreate';
                function_works := FALSE;
        END;
    END IF;
    
    -- Only recreate if view doesn't exist OR function doesn't work
    IF NOT view_exists OR NOT function_works THEN
        RAISE NOTICE 'Creating/fixing materialized view and function';
        
        -- Drop existing problematic components
        DROP MATERIALIZED VIEW IF EXISTS user_submission_stats CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS user_post_stats CASCADE;
        DROP FUNCTION IF EXISTS refresh_user_submission_stats() CASCADE;
        DROP FUNCTION IF EXISTS refresh_user_stats() CASCADE;
        
        -- Create materialized view with correct column names
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
        
        -- Create indexes on the materialized view
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
        
        -- Create working refresh function
        CREATE OR REPLACE FUNCTION refresh_user_submission_stats()
        RETURNS TEXT
        LANGUAGE plpgsql
        AS $func$
        DECLARE
            start_time TIMESTAMP;
            end_time TIMESTAMP;
            row_count INTEGER;
        BEGIN
            start_time := clock_timestamp();
            
            -- Refresh the materialized view
            REFRESH MATERIALIZED VIEW user_submission_stats;
            
            -- Get row count
            SELECT COUNT(*) INTO row_count FROM user_submission_stats;
            
            end_time := clock_timestamp();
            
            -- Return success message
            RETURN 'Materialized view refreshed successfully. Rows: ' || row_count || 
                   ', Duration: ' || EXTRACT(EPOCH FROM (end_time - start_time)) || 's';
        END;
        $func$;
        
        RAISE NOTICE 'Successfully created materialized view and refresh function';
    ELSE
        RAISE NOTICE 'Materialized view and function already exist and work correctly';
    END IF;
END $$;

-- ================================
-- PART 2: ENSURE PERFORMANCE MONITORING TABLE EXISTS
-- ================================

-- Create performance monitoring table if it doesn't exist
CREATE TABLE IF NOT EXISTS query_performance_log (
    id SERIAL PRIMARY KEY,
    query_type VARCHAR(50) NOT NULL,
    query_params JSONB,
    execution_time_ms NUMERIC(10,2) NOT NULL,
    result_count INTEGER,
    used_materialized_view BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_query_perf_type_time') THEN
        CREATE INDEX idx_query_perf_type_time 
        ON query_performance_log (query_type, created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_query_perf_slow_queries') THEN
        CREATE INDEX idx_query_perf_slow_queries 
        ON query_performance_log (execution_time_ms DESC) 
        WHERE execution_time_ms > 500;
    END IF;
END $$;

-- ================================
-- PART 3: TEST AND VERIFY EVERYTHING WORKS
-- ================================

-- Test the refresh function and capture result
SELECT refresh_user_submission_stats() as refresh_result;

-- Update table statistics
ANALYZE user_submission_stats;
ANALYZE submissions;
ANALYZE query_performance_log;

-- ================================
-- PART 4: VERIFICATION REPORT
-- ================================

-- Verify everything is working correctly
SELECT 
    'user_submission_stats' as component,
    'materialized_view' as type,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS'
        ELSE 'WARNING: No data'
    END as status
FROM user_submission_stats

UNION ALL

SELECT 
    'refresh_function' as component,
    'function' as type,
    1 as row_count,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_user_submission_stats')
        THEN 'SUCCESS'
        ELSE 'ERROR: Missing'
    END as status

UNION ALL

SELECT 
    'performance_log' as component,
    'table' as type,
    COUNT(*) as row_count,
    'SUCCESS' as status
FROM query_performance_log; 