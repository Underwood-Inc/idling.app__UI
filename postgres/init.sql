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
    PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE idling WITH OWNER = postgres');
  END IF;
END
$$;

-- \c idling;

-- 'if not exists' syntax exists for tables but not databases...
-- CREATE TABLE if not exists submissions (
--   submission_id SERIAL NOT NULL PRIMARY KEY,
--   submission_name VARCHAR(255),
--   submission_datetime timestamptz NOT NULL,
--   author_id varchar(255),
--   tags text[]
-- );
