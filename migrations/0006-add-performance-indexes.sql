-- Migration: Add performance indexes for posts list optimization
-- This migration adds indexes to improve query performance for the posts list page

-- Index for thread structure and replies
CREATE INDEX IF NOT EXISTS idx_submissions_thread_parent_id 
ON submissions(thread_parent_id);

-- Index for author-based queries (onlyMine filter)
CREATE INDEX IF NOT EXISTS idx_submissions_author_id 
ON submissions(author_id);

-- Composite index for main posts list query (most common case)
CREATE INDEX IF NOT EXISTS idx_submissions_main_posts_datetime 
ON submissions(thread_parent_id, submission_datetime DESC) 
WHERE thread_parent_id IS NULL;

-- Index for tag-based queries
CREATE INDEX IF NOT EXISTS idx_submissions_tags_gin 
ON submissions USING GIN (tags);

-- Composite index for author + datetime (for onlyMine queries)
CREATE INDEX IF NOT EXISTS idx_submissions_author_datetime 
ON submissions(author_id, submission_datetime DESC);

-- Composite index for thread structure with datetime
CREATE INDEX IF NOT EXISTS idx_submissions_thread_structure 
ON submissions(thread_parent_id, submission_datetime) 
WHERE thread_parent_id IS NOT NULL;

-- Index for count queries
CREATE INDEX IF NOT EXISTS idx_submissions_count_optimization 
ON submissions(thread_parent_id, author_id) 
WHERE thread_parent_id IS NULL;

-- Comments explaining the indexes
COMMENT ON INDEX idx_submissions_thread_parent_id IS 'Optimizes thread reply queries';
COMMENT ON INDEX idx_submissions_author_id IS 'Optimizes author-based filtering (onlyMine)';
COMMENT ON INDEX idx_submissions_main_posts_datetime IS 'Optimizes main posts list with datetime ordering';
COMMENT ON INDEX idx_submissions_tags_gin IS 'Optimizes tag-based filtering using GIN index';
COMMENT ON INDEX idx_submissions_author_datetime IS 'Optimizes author+datetime queries for onlyMine';
COMMENT ON INDEX idx_submissions_thread_structure IS 'Optimizes nested thread queries';
COMMENT ON INDEX idx_submissions_count_optimization IS 'Optimizes count queries for pagination'; 