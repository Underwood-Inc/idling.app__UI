-- Simple migration to create missing refresh functions
-- These functions are needed by the cron job system

-- Create user_submission_stats materialized view if it doesn't exist
CREATE MATERIALIZED VIEW IF NOT EXISTS user_submission_stats AS
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

-- Create basic indexes on user_submission_stats
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_author_id ON user_submission_stats (author_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_author_search ON user_submission_stats (author text_pattern_ops);

-- Create refresh function for user stats
CREATE OR REPLACE FUNCTION refresh_user_submission_stats()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_submission_stats;
    RETURN 'User stats refreshed successfully';
END;
$$;

-- Create stub functions for other refresh operations (to prevent errors)
CREATE OR REPLACE FUNCTION refresh_trending_posts()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'Trending posts refresh - function exists but view not implemented yet';
END;
$$;

CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'Daily stats refresh - function exists but view not implemented yet';
END;
$$;

CREATE OR REPLACE FUNCTION refresh_tag_statistics()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'Tag statistics refresh - function exists but view not implemented yet';
END;
$$;

-- Test the main function works
SELECT refresh_user_submission_stats(); 