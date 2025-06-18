-- Simple database fix
-- No CONCURRENT operations, no complex SQL, just basic fixes

-- Drop broken views
DROP MATERIALIZED VIEW IF EXISTS user_submission_stats;
DROP FUNCTION IF EXISTS refresh_user_submission_stats();

-- Create simple materialized view
CREATE MATERIALIZED VIEW user_submission_stats AS
SELECT 
    author_id,
    author,
    COUNT(*) as submission_count
FROM submissions 
WHERE author_id IS NOT NULL 
GROUP BY author_id, author;

-- Create simple function
CREATE FUNCTION refresh_user_submission_stats()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_submission_stats;
    RETURN 'refreshed';
END;
$$;

-- Create basic indexes (no CONCURRENT)
CREATE INDEX IF NOT EXISTS idx_user_stats_author_id ON user_submission_stats (author_id);
CREATE INDEX IF NOT EXISTS idx_submissions_author_basic ON submissions (author_id);
CREATE INDEX IF NOT EXISTS idx_submissions_datetime_basic ON submissions (submission_datetime DESC);

-- Test it works
SELECT refresh_user_submission_stats(); 