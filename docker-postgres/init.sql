-- run during first time setup of postgres docker container for development
-- environment variables are not available here
-- tried a custom entrypoint to the container that exports them as well to no avail
\echo '\033[35mrunning database init...\033[0m'
-- start a procedural postgres code block
DO $$
BEGIN
  -- conditional check for existence of dblink extension which grants conditional db creation 
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'dblink') THEN
    CREATE EXTENSION dblink;
  END IF;
END
$$;

-- start a procedural postgres code block
DO $$
BEGIN
  -- conditional check for existence of database with name 'idling'
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'idling') THEN
    PERFORM dblink_exec('dbname=idling', 'CREATE DATABASE idling WITH OWNER = postgres');
  END IF;
END
$$;

\echo '\033[35mconnecting to the testing database...\033[0m'
\c idling;

\echo '\033[35mcreating submissions table...\033[0m'
CREATE TABLE submissions (
  submission_id SERIAL NOT NULL PRIMARY KEY,
  submission_name VARCHAR(255) NOT NULL,
  submission_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  tags TEXT[]
);

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
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
 
  PRIMARY KEY (id)
);

\echo '\033[35mcreating migrations tracking table...\033[0m'
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN NOT NULL,
  error_message TEXT
);

\echo '\033[33mfinished initializating the testing database!\033[0m'
\q
