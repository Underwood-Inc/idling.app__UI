-- Migration: Add text search performance indexes for million+ record optimization
-- Purpose: Enable fast ILIKE pattern matching and improve search performance
-- Target: Handle millions of records with sub-50ms search times

-- Enable trigram extension for fast text pattern matching
-- This allows ILIKE '%pattern%' searches to use indexes instead of sequential scans
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ================================
-- TRIGRAM INDEXES FOR FAST TEXT SEARCH
-- ================================

-- Trigram index for author searches (ILIKE '%username%')
-- This dramatically speeds up user search functionality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_trgm 
ON submissions USING GIN (author gin_trgm_ops) 
WHERE author IS NOT NULL;

-- Trigram index for title searches (ILIKE '%title%')
-- Enables fast full-text search across submission titles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_title_trgm 
ON submissions USING GIN (submission_title gin_trgm_ops) 
WHERE submission_title IS NOT NULL;

-- ================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ================================

-- Fast pagination index (datetime + id for consistent ordering)
-- Prevents slow pagination on large result sets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_datetime_id 
ON submissions (submission_datetime DESC, submission_id);

-- Fast author + date filtering for user activity pages
-- Optimizes queries like "get all posts by user X in date range"
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_datetime_fast 
ON submissions (author, submission_datetime DESC) 
WHERE author IS NOT NULL;

-- Enhanced tag filtering index
-- Optimizes tag-based searches and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_tags_array 
ON submissions USING GIN (tags) 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Thread hierarchy optimization
-- Fast queries for comment threads and reply structures
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_thread_optimized 
ON submissions (thread_parent_id, submission_datetime DESC) 
WHERE thread_parent_id IS NOT NULL;

-- Main posts filtering (exclude replies)
-- Fast queries for top-level posts only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_main_posts_only 
ON submissions (submission_datetime DESC, submission_id) 
WHERE thread_parent_id IS NULL;

-- Author activity optimization
-- Fast user profile and activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_activity 
ON submissions (author_id, submission_datetime DESC) 
WHERE author_id IS NOT NULL;

-- ================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ================================

-- Combined author + tag filtering
-- Optimizes queries like "posts by user X with tag Y"
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_tags 
ON submissions (author_id, tags) 
WHERE author_id IS NOT NULL AND tags IS NOT NULL;

-- Date range + author filtering
-- Optimizes time-based user activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_date_author 
ON submissions (submission_datetime DESC, author_id, submission_id) 
WHERE author_id IS NOT NULL;

-- ================================
-- MATERIALIZED VIEW OPTIMIZATION
-- ================================

-- Additional indexes on user_submission_stats for faster searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_combined_search 
ON user_submission_stats (LOWER(author), submission_count DESC);

-- Fast author prefix matching on materialized view
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_author_prefix 
ON user_submission_stats (author text_pattern_ops);

-- ================================
-- UPDATE STATISTICS
-- ================================

-- Update table statistics for optimal query planning
ANALYZE submissions;
ANALYZE user_submission_stats;

-- ================================
-- VERIFICATION
-- ================================

-- Verify extensions and indexes were created
SELECT 
    'text_search_extensions' as component,
    COUNT(*) as installed_count,
    CASE 
        WHEN COUNT(*) >= 1 THEN 'SUCCESS: pg_trgm extension available'
        ELSE 'WARNING: Missing text search extensions'
    END as status
FROM pg_extension 
WHERE extname = 'pg_trgm'

UNION ALL

SELECT 
    'performance_indexes' as component,
    COUNT(*) as created_indexes,
    CASE 
        WHEN COUNT(*) >= 8 THEN 'SUCCESS: Performance indexes created'
        ELSE 'WARNING: Some performance indexes may be missing'
    END as status
FROM pg_indexes 
WHERE tablename = 'submissions' 
AND indexname IN (
    'idx_submissions_author_trgm',
    'idx_submissions_title_trgm',
    'idx_submissions_datetime_id',
    'idx_submissions_author_datetime_fast',
    'idx_submissions_tags_array',
    'idx_submissions_thread_optimized',
    'idx_submissions_main_posts_only',
    'idx_submissions_author_activity'
)

UNION ALL

SELECT 
    'materialized_view_indexes' as component,
    COUNT(*) as view_indexes,
    CASE 
        WHEN COUNT(*) >= 2 THEN 'SUCCESS: Materialized view indexes optimized'
        ELSE 'WARNING: Materialized view indexes may be missing'
    END as status
FROM pg_indexes 
WHERE tablename = 'user_submission_stats' 
AND indexname IN (
    'idx_user_stats_combined_search',
    'idx_user_stats_author_prefix'
);

-- Expected performance improvement summary
SELECT 
    '🚀 PERFORMANCE OPTIMIZATION COMPLETE 🚀' as message,
    'Expected search performance: <50ms for text searches' as improvement_1,
    'Expected pagination: <100ms for large result sets' as improvement_2,
    'Expected user queries: <25ms via materialized views' as improvement_3; 