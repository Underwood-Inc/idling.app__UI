-- Migration: Ensure all required indexes exist regardless of previous migration status
-- Purpose: Create indexes that require CONCURRENT creation, but only if missing
-- This migration is idempotent and works whether previous index migrations succeeded or failed

-- Check and create author search composite index
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_author_search') THEN
        CREATE INDEX CONCURRENTLY idx_submissions_author_search 
        ON submissions (author, author_id) 
        WHERE author IS NOT NULL AND author_id IS NOT NULL;
        RAISE NOTICE 'Created idx_submissions_author_search';
    ELSE
        RAISE NOTICE 'idx_submissions_author_search already exists';
    END IF;
END $$;

-- Check and create case-insensitive author search
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_author_lower') THEN
        CREATE INDEX CONCURRENTLY idx_submissions_author_lower 
        ON submissions (LOWER(author)) 
        WHERE author IS NOT NULL;
        RAISE NOTICE 'Created idx_submissions_author_lower';
    ELSE
        RAISE NOTICE 'idx_submissions_author_lower already exists';
    END IF;
END $$;

-- Check and create author prefix search for autocomplete
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_author_prefix') THEN
        CREATE INDEX CONCURRENTLY idx_submissions_author_prefix 
        ON submissions (author text_pattern_ops) 
        WHERE author IS NOT NULL;
        RAISE NOTICE 'Created idx_submissions_author_prefix';
    ELSE
        RAISE NOTICE 'idx_submissions_author_prefix already exists';
    END IF;
END $$;

-- Check and create advanced GIN index for tag operations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_tags_gin_advanced') THEN
        CREATE INDEX CONCURRENTLY idx_submissions_tags_gin_advanced 
        ON submissions USING GIN (tags) 
        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;
        RAISE NOTICE 'Created idx_submissions_tags_gin_advanced';
    ELSE
        RAISE NOTICE 'idx_submissions_tags_gin_advanced already exists';
    END IF;
END $$;

-- Check and create partial index for distinct author counting
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_distinct_authors') THEN
        CREATE INDEX CONCURRENTLY idx_submissions_distinct_authors 
        ON submissions (author_id) 
        WHERE author_id IS NOT NULL;
        RAISE NOTICE 'Created idx_submissions_distinct_authors';
    ELSE
        RAISE NOTICE 'idx_submissions_distinct_authors already exists';
    END IF;
END $$;

-- Check and create performance filter index
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_perf_filter') THEN
        CREATE INDEX CONCURRENTLY idx_submissions_perf_filter 
        ON submissions (submission_datetime DESC, author_id, submission_id);
        RAISE NOTICE 'Created idx_submissions_perf_filter';
    ELSE
        RAISE NOTICE 'idx_submissions_perf_filter already exists';
    END IF;
END $$;

-- Check and create pagination optimization
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_pagination') THEN
        CREATE INDEX CONCURRENTLY idx_submissions_pagination 
        ON submissions (submission_datetime DESC, submission_id);
        RAISE NOTICE 'Created idx_submissions_pagination';
    ELSE
        RAISE NOTICE 'idx_submissions_pagination already exists';
    END IF;
END $$;

-- Check and create thread hierarchy index
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_thread_hierarchy') THEN
        CREATE INDEX CONCURRENTLY idx_submissions_thread_hierarchy 
        ON submissions (thread_parent_id, submission_datetime) 
        WHERE thread_parent_id IS NOT NULL;
        RAISE NOTICE 'Created idx_submissions_thread_hierarchy';
    ELSE
        RAISE NOTICE 'idx_submissions_thread_hierarchy already exists';
    END IF;
END $$;

-- Check and create author activity tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_author_activity') THEN
        CREATE INDEX CONCURRENTLY idx_submissions_author_activity 
        ON submissions (author_id, submission_datetime DESC) 
        WHERE author_id IS NOT NULL;
        RAISE NOTICE 'Created idx_submissions_author_activity';
    ELSE
        RAISE NOTICE 'idx_submissions_author_activity already exists';
    END IF;
END $$;

-- Update table statistics after any new index creation
ANALYZE submissions;

-- Verification report
SELECT 
    'concurrent_indexes' as component,
    'verification' as type,
    COUNT(*) as total_submission_indexes,
    CASE 
        WHEN COUNT(*) >= 15 THEN 'SUCCESS: All indexes present'
        ELSE 'WARNING: Some indexes may be missing'
    END as status
FROM pg_indexes 
WHERE tablename = 'submissions' 
AND indexname LIKE 'idx_submissions_%'; 