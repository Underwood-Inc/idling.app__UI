-- Migration: Create posts and comments tables for manage-user script compatibility
-- Date: 2024-07-04
-- Description: The manage-user script expects posts and comments tables to exist for activity tracking

-- Drop existing tables if they exist (to fix ownership issues)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;

-- Create posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subthread VARCHAR(255),
    score INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table  
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_subthread ON posts(subthread);

CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);

-- Migrate existing submissions data to posts format
-- Only migrate main thread submissions (thread_parent_id IS NULL) to posts
INSERT INTO posts (title, content, author_id, subthread, score, created_at)
SELECT 
    COALESCE(submission_title, LEFT(submission_name, 100)) as title,
    submission_name as content,
    user_id as author_id,
    'general' as subthread, -- Default subthread since submissions table doesn't have this
    0 as score,
    submission_datetime as created_at
FROM submissions 
WHERE thread_parent_id IS NULL
AND user_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM posts WHERE posts.author_id = submissions.user_id AND posts.created_at = submissions.submission_datetime);

-- Migrate threaded submissions to comments
-- This is more complex since we need to match submissions to their parent posts
INSERT INTO comments (content, author_id, post_id, score, created_at)
SELECT 
    s.submission_name as content,
    s.user_id as author_id,
    p.id as post_id,
    0 as score,
    s.submission_datetime as created_at
FROM submissions s
JOIN submissions parent ON s.thread_parent_id = parent.submission_id
JOIN posts p ON parent.user_id = p.author_id 
    AND parent.submission_datetime = p.created_at
WHERE s.thread_parent_id IS NOT NULL
AND s.user_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM comments 
    WHERE comments.author_id = s.user_id 
    AND comments.created_at = s.submission_datetime
);

-- Update comment counts in posts table
UPDATE posts 
SET comment_count = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.post_id = posts.id
)
WHERE comment_count = 0;

-- Add a comment to track this migration
COMMENT ON TABLE posts IS 'Posts table created for manage-user script compatibility - migrated from submissions';
COMMENT ON TABLE comments IS 'Comments table created for manage-user script compatibility - migrated from threaded submissions'; 