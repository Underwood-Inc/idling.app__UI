-- run during first time setup of postgres docker container for development
-- environment variables are not available here
-- tried a custom entrypoint to the container that exports them as well to no avail
\echo '\033[35mrunning database init...\033[0m'

-- Note: Database 'idling_app' is already created by POSTGRES_DB env var
-- We connect to it directly
\echo '\033[35mconnecting to the idling_app database...\033[0m'
\c idling_app;

\echo '\033[35mcreating submissions table...\033[0m'
CREATE TABLE submissions (
  submission_id SERIAL NOT NULL PRIMARY KEY,
  submission_name TEXT NOT NULL,
  submission_title VARCHAR(500),
  submission_url TEXT,
  submission_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  user_id INTEGER NOT NULL,
  author_provider_account_id VARCHAR(255) NOT NULL,
  tags TEXT[],
  thread_parent_id INTEGER,
  CONSTRAINT fk_thread_parent FOREIGN KEY (thread_parent_id) REFERENCES submissions(submission_id)
);

-- Create index on thread_parent_id for better performance
CREATE INDEX idx_thread_parent_id ON submissions(thread_parent_id);

\echo '\033[35mcreating nextauth required tables...\033[0m'
CREATE TABLE verification_token
(
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
 
  PRIMARY KEY (identifier, token)
);
 
CREATE TABLE accounts
(
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
 
  PRIMARY KEY (id)
);
 
CREATE TABLE sessions
(
  id SERIAL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
 
  PRIMARY KEY (id)
);
 
CREATE TABLE users
(
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  profile_public BOOLEAN DEFAULT true,
  bio TEXT,
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
 
  PRIMARY KEY (id)
);

-- TODO - start - move to use migration system
\echo '\033[35mcreating subthread required tables...\033[0m'

-- Create posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),
  subthread VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),
  post_id INTEGER NOT NULL REFERENCES posts(id),
  parent_id INTEGER REFERENCES comments(id),
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  post_id INTEGER REFERENCES posts(id),
  comment_id INTEGER REFERENCES comments(id),
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vote_target_check CHECK (
    (post_id IS NULL AND comment_id IS NOT NULL) OR
    (post_id IS NOT NULL AND comment_id IS NULL)
  ),
  UNIQUE (user_id, post_id, comment_id)
);

-- Create index for faster subthread queries
CREATE INDEX idx_posts_subthread ON posts(subthread);

-- Create index for faster comment retrieval
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- Create index for faster vote queries
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_comment_id ON votes(comment_id);

\echo '\033[33mfinished initializing the idling_app database!\033[0m'

-- TODO -- end -

\echo '\033[35mcreating migrations tracking table...\033[0m'
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN NOT NULL,
  error_message TEXT
);

\echo '\033[33mfinished database initialization!\033[0m'
\q
