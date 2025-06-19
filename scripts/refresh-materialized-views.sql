-- Simple SQL script to refresh materialized views
-- Usage: psql $DATABASE_URL -f scripts/refresh-materialized-views.sql

\echo 'Starting materialized view refresh...'
\echo ''

-- Refresh user submission stats
\echo 'Refreshing user_submission_stats...'
SELECT refresh_user_submission_stats() as user_stats_result;

\echo ''
\echo 'Materialized view refresh completed!'
\echo '' 