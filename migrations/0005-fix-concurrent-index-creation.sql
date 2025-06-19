-- Migration: 0005-fix-concurrent-index-creation.sql
-- Purpose: Fix the concurrent index creation issues from migration 0007
-- This migration properly separates CONCURRENT operations from transaction blocks
-- NOTE: CONCURRENT operations must run outside transaction blocks

-- ================================
-- PART 1: CONCURRENT INDEX CREATION
-- (These run outside of transactions automatically)
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

-- 6. Query performance index for submission filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_perf_filter 
ON submissions (submission_datetime DESC, author_id, submission_id);

-- 7. Pagination optimization index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_pagination 
ON submissions (submission_datetime DESC, submission_id);

-- 8. Thread hierarchy performance index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_thread_hierarchy 
ON submissions (thread_parent_id, submission_datetime) 
WHERE thread_parent_id IS NOT NULL;

-- 9. Author activity index for performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_activity 
ON submissions (author_id, submission_datetime DESC) 
WHERE author_id IS NOT NULL;

-- ================================
-- PART 2: POST-INDEX OPTIMIZATION
-- (Just analyze - no transaction conflicts)
-- ================================

-- Update statistics for better query planning after index creation
ANALYZE submissions;

-- ================================
-- MIGRATION VERIFICATION
-- ================================

-- Simple verification query (avoiding DO blocks that break our parser)
SELECT 
    COUNT(*) as index_count,
    CASE 
        WHEN COUNT(*) >= 5 THEN 'SUCCESS: Created ' || COUNT(*) || ' submission indexes'
        ELSE 'WARNING: Only created ' || COUNT(*) || ' submission indexes'
    END as status
FROM pg_indexes 
WHERE tablename = 'submissions' 
AND indexname LIKE 'idx_submissions_%'; 