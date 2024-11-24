-- Run during GitHub test pipeline action
\echo '\033[35mrunning database init...\033[0m'

\echo \033[35m'processing environment variables...\033[0m'
\set dbname :POSTGRES_DB
\set pass :POSTGRES_PASSWORD
\set user :POSTGRES_USER

\echo '\033[35mcreating testing database...\033[0m'
drop database if exists :dbname;
create database :dbname with owner = :user;

\echo '\033[35mconnecting to the testing database...\033[0m'
\c :dbname;

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