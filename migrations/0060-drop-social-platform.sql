-- Migration: 0060-drop-social-platform.sql
-- Description: Remove posts/submissions social platform tables, views, and permissions.
-- Retains: users, accounts, sessions, subscriptions, emojis, admin, quotas (non-post).

-- Triggers on submissions (table dropped below)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'submissions'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS prevent_slug_urls_submissions ON submissions';
  END IF;
END $$;

-- Views and functions that reference submissions
DROP VIEW IF EXISTS profile_url_patterns CASCADE;

DROP MATERIALIZED VIEW IF EXISTS user_submission_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS user_stats CASCADE;

DROP FUNCTION IF EXISTS refresh_user_stats() CASCADE;
DROP FUNCTION IF EXISTS refresh_tag_statistics() CASCADE;
DROP FUNCTION IF EXISTS refresh_trending_posts() CASCADE;
DROP FUNCTION IF EXISTS refresh_daily_stats() CASCADE;
DROP FUNCTION IF EXISTS refresh_user_submission_stats() CASCADE;

-- Social platform tables (votes exists on legacy docker init only)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;

-- Profile URL monitoring (users only; submissions removed)
CREATE OR REPLACE VIEW profile_url_patterns AS
SELECT
  'users'::TEXT AS table_name,
  id,
  id AS user_id,
  created_at,
  regexp_matches(bio, '/profile/([^/\s]+)', 'g') AS url_patterns,
  CASE
    WHEN bio ~ '/profile/[0-9]+(\s|/|$)' THEN 'valid_id_only'
    WHEN bio ~ '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-[0-9]+' THEN 'invalid_slug_pattern'
    WHEN bio ~ '/profile/[^0-9/\s]' THEN 'invalid_other'
    ELSE 'unknown'
  END AS pattern_type
FROM users
WHERE bio IS NOT NULL AND bio ~ '/profile/';

-- Slug cleanup (user bios only)
CREATE OR REPLACE FUNCTION cleanup_slug_urls()
RETURNS TABLE(
  table_name TEXT,
  record_id INTEGER,
  old_content TEXT,
  new_content TEXT,
  changes_made INTEGER
) AS $$
DECLARE
  user_record RECORD;
  old_text TEXT;
  new_text TEXT;
  total_changes INTEGER := 0;
BEGIN
  FOR user_record IN
    SELECT id, bio FROM users
    WHERE bio IS NOT NULL AND bio ~ '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-[0-9]+'
  LOOP
    old_text := user_record.bio;
    new_text := regexp_replace(
      old_text,
      '/profile/[a-zA-Z][a-zA-Z0-9\-_]*-([0-9]+)(\s|/|$|[^0-9])',
      '/profile/\1\2',
      'g'
    );

    IF old_text != new_text THEN
      UPDATE users SET bio = new_text WHERE id = user_record.id;
      total_changes := total_changes + 1;

      RETURN QUERY SELECT
        'users'::TEXT,
        user_record.id,
        old_text,
        new_text,
        total_changes;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Post-related permissions (historical timeouts on post_creation / comment_creation remain in user_timeouts)
DELETE FROM user_permissions
WHERE permission_id IN (
  SELECT id FROM permissions
  WHERE name IN (
    'admin.posts.moderate',
    'content.create.post',
    'content.edit.own',
    'content.delete.own',
    'content.comment',
    'content.create.advanced'
  )
);

DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id FROM permissions
  WHERE name IN (
    'admin.posts.moderate',
    'content.create.post',
    'content.edit.own',
    'content.delete.own',
    'content.comment',
    'content.create.advanced'
  )
);

DELETE FROM permissions
WHERE name IN (
  'admin.posts.moderate',
  'content.create.post',
  'content.edit.own',
  'content.delete.own',
  'content.comment',
  'content.create.advanced'
);

-- Guest quota for removed post creation
DELETE FROM guest_usage_tracking
WHERE service_name = 'content_system' AND feature_name = 'daily_posts';

DELETE FROM global_guest_quotas
WHERE service_name = 'content_system' AND feature_name = 'daily_posts';

-- content_system subscription service had no features (posts only)
DELETE FROM subscription_usage
WHERE service_id IN (SELECT id FROM subscription_services WHERE name = 'content_system');

DELETE FROM plan_services
WHERE service_id IN (SELECT id FROM subscription_services WHERE name = 'content_system');

DELETE FROM subscription_services WHERE name = 'content_system';

SELECT 'Social platform database objects removed; account and subscription schema retained' AS result;