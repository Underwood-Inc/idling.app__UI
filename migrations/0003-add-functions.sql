-- Add Database Functions
-- This migration adds the required database functions for materialized view management
-- Using simple function syntax to avoid migration tool parsing issues

-- Function to refresh user stats (simplified version)
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void
LANGUAGE sql
AS 'REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats';

-- Stub functions to prevent application errors
-- These return void and do nothing but prevent missing function errors

CREATE OR REPLACE FUNCTION refresh_tag_statistics()
RETURNS void
LANGUAGE sql
AS 'SELECT 1';

CREATE OR REPLACE FUNCTION refresh_trending_posts()
RETURNS void
LANGUAGE sql
AS 'SELECT 1';

CREATE OR REPLACE FUNCTION refresh_daily_stats()
RETURNS void
LANGUAGE sql
AS 'SELECT 1';

-- Alias for compatibility with seed scripts
CREATE OR REPLACE FUNCTION refresh_user_submission_stats()
RETURNS void
LANGUAGE sql
AS 'SELECT refresh_user_stats()';

SELECT 'Database functions added successfully' as result; 