\echo 'running database init...'
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

\echo 'connecting to the testing database...'
\c idling;

\echo 'creating submissions table...'
CREATE TABLE submissions (
  submission_id SERIAL NOT NULL PRIMARY KEY,
  submission_name VARCHAR(255) NOT NULL,
  submission_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  tags TEXT[]
);

\echo 'creating nextauth required tables...'
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

\echo 'finished initializating the testing database!'
\q