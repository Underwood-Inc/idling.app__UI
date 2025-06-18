-- Migration: Create missing performance indexes
-- Purpose: Create all required indexes without parser-breaking syntax
-- This migration uses simple CREATE INDEX statements only

-- Author search composite index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_search 
ON submissions (author, author_id) 
WHERE author IS NOT NULL AND author_id IS NOT NULL;

-- Case-insensitive author search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_lower 
ON submissions (LOWER(author)) 
WHERE author IS NOT NULL;

-- Author prefix search for autocomplete
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_prefix 
ON submissions (author text_pattern_ops) 
WHERE author IS NOT NULL;

-- Advanced GIN index for tag operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_tags_gin_advanced 
ON submissions USING GIN (tags) 
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Partial index for distinct author counting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_distinct_authors 
ON submissions (author_id) 
WHERE author_id IS NOT NULL;

-- Performance filter index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_perf_filter 
ON submissions (submission_datetime DESC, author_id, submission_id);

-- Pagination optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_pagination 
ON submissions (submission_datetime DESC, submission_id);

-- Thread hierarchy index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_thread_hierarchy 
ON submissions (thread_parent_id, submission_datetime) 
WHERE thread_parent_id IS NOT NULL;

-- Author activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_author_activity 
ON submissions (author_id, submission_datetime DESC) 
WHERE author_id IS NOT NULL;

-- Update table statistics
ANALYZE submissions;

-- Simple verification query
SELECT COUNT(*) as total_submission_indexes
FROM pg_indexes 
WHERE tablename = 'submissions' 
AND indexname LIKE 'idx_submissions_%'; 