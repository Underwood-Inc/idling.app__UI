\echo 'running database init...'

\echo 'processing environment variables...'
\set dbname :POSTGRES_DB
\set pass :POSTGRES_PASSWORD
\set user :POSTGRES_USER

\echo 'creating testing database...'
drop database if exists :dbname;
create database :dbname with owner = :user;

\echo 'connecting to the testing database...'
\c :dbname;

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
