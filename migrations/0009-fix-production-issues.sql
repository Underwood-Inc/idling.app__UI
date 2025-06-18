-- Migration: Fix production issues with caution for environments where previous migrations succeeded
-- This migration addresses issues that may have occurred in production while being safe for environments
-- where the previous migrations were successful

-- Add submission_title column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'submission_title'
    ) THEN
        ALTER TABLE submissions ADD COLUMN submission_title VARCHAR(255);
        RAISE NOTICE 'Added submission_title column to submissions table';
    ELSE
        RAISE NOTICE 'submission_title column already exists, skipping';
    END IF;
END $$;

-- Add submission_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'submission_url'
    ) THEN
        ALTER TABLE submissions ADD COLUMN submission_url TEXT;
        RAISE NOTICE 'Added submission_url column to submissions table';
    ELSE
        RAISE NOTICE 'submission_url column already exists, skipping';
    END IF;
END $$;

-- Create materialized view for user statistics if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'user_post_stats'
    ) THEN
        CREATE MATERIALIZED VIEW user_post_stats AS
        SELECT 
            author_id,
            COUNT(*) as total_posts,
            COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as root_posts,
            COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as reply_posts,
            MAX(created_at) as last_post_date,
            MIN(created_at) as first_post_date
        FROM submissions
        GROUP BY author_id;
        
        -- Create index on the materialized view
        CREATE UNIQUE INDEX idx_user_post_stats_author_id ON user_post_stats(author_id);
        
        RAISE NOTICE 'Created user_post_stats materialized view';
    ELSE
        RAISE NOTICE 'user_post_stats materialized view already exists, skipping';
    END IF;
END $$;

-- Create index for better performance on content searches if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_submissions_content_search'
    ) THEN
        CREATE INDEX CONCURRENTLY idx_submissions_content_search 
        ON submissions USING gin(to_tsvector('english', content));
        RAISE NOTICE 'Created content search index';
    ELSE
        RAISE NOTICE 'Content search index already exists, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create content search index concurrently, trying regular creation';
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_submissions_content_search'
        ) THEN
            CREATE INDEX idx_submissions_content_search 
            ON submissions USING gin(to_tsvector('english', content));
        END IF;
END $$;

-- Create composite index for author and date queries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_submissions_author_created'
    ) THEN
        CREATE INDEX CONCURRENTLY idx_submissions_author_created 
        ON submissions(author_id, created_at DESC);
        RAISE NOTICE 'Created author-date composite index';
    ELSE
        RAISE NOTICE 'Author-date composite index already exists, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create author-date index concurrently, trying regular creation';
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_submissions_author_created'
        ) THEN
            CREATE INDEX idx_submissions_author_created 
            ON submissions(author_id, created_at DESC);
        END IF;
END $$;

-- Create index for parent_id queries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_submissions_parent_id'
    ) THEN
        CREATE INDEX CONCURRENTLY idx_submissions_parent_id 
        ON submissions(parent_id) WHERE parent_id IS NOT NULL;
        RAISE NOTICE 'Created parent_id index';
    ELSE
        RAISE NOTICE 'Parent_id index already exists, skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create parent_id index concurrently, trying regular creation';
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_submissions_parent_id'
        ) THEN
            CREATE INDEX idx_submissions_parent_id 
            ON submissions(parent_id) WHERE parent_id IS NOT NULL;
        END IF;
END $$;

-- Update any existing null values in new columns to empty strings if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'submission_title'
    ) THEN
        UPDATE submissions 
        SET submission_title = '' 
        WHERE submission_title IS NULL;
        RAISE NOTICE 'Updated null submission_title values';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'submission_url'
    ) THEN
        UPDATE submissions 
        SET submission_url = '' 
        WHERE submission_url IS NULL;
        RAISE NOTICE 'Updated null submission_url values';
    END IF;
END $$;

-- Create function to refresh materialized views if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'refresh_user_stats'
    ) THEN
        CREATE OR REPLACE FUNCTION refresh_user_stats()
        RETURNS void AS $func$
        BEGIN
            REFRESH MATERIALIZED VIEW user_post_stats;
            RAISE NOTICE 'Refreshed user_post_stats materialized view';
        END;
        $func$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Created refresh_user_stats function';
    ELSE
        RAISE NOTICE 'refresh_user_stats function already exists, skipping';
    END IF;
END $$;

-- Verify the migration completed successfully
DO $$
DECLARE
    submission_title_exists boolean;
    submission_url_exists boolean;
    user_stats_exists boolean;
    content_index_exists boolean;
    author_index_exists boolean;
    parent_index_exists boolean;
BEGIN
    -- Check if all expected changes are present
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'submission_title'
    ) INTO submission_title_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'submission_url'
    ) INTO submission_url_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_matviews WHERE matviewname = 'user_post_stats'
    ) INTO user_stats_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_content_search'
    ) INTO content_index_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_author_created'
    ) INTO author_index_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_parent_id'
    ) INTO parent_index_exists;
    
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE 'submission_title column: %', submission_title_exists;
    RAISE NOTICE 'submission_url column: %', submission_url_exists;
    RAISE NOTICE 'user_post_stats view: %', user_stats_exists;
    RAISE NOTICE 'content search index: %', content_index_exists;
    RAISE NOTICE 'author-date index: %', author_index_exists;
    RAISE NOTICE 'parent_id index: %', parent_index_exists;
    
    IF submission_title_exists AND submission_url_exists AND user_stats_exists 
       AND content_index_exists AND author_index_exists AND parent_index_exists THEN
        RAISE NOTICE 'Migration 0009 completed successfully!';
    ELSE
        RAISE WARNING 'Migration 0009 completed with some items already existing or failed to create';
    END IF;
END $$; 