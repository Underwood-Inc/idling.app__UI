-- Migration: Create test temp table
-- this is for the purposes of testing the migration tool
-- Create a temporary table that will exist for the current session
CREATE TEMPORARY TABLE temp_test_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP
  WITH
    TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO
  temp_test_users (name, email)
VALUES
  ('John Doe', 'john@example.com'),
  ('Jane Smith', 'jane@example.com'),
  ('Bob Wilson', 'bob@example.com');

SELECT
  *
FROM
  temp_test_users;