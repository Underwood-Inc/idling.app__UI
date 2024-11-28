-- Add thread_parent_id column to submissions table
ALTER TABLE submissions
ADD COLUMN thread_parent_id INTEGER;

-- Add foreign key constraint
ALTER TABLE submissions
ADD CONSTRAINT fk_thread_parent
FOREIGN KEY (thread_parent_id)
REFERENCES submissions(submission_id);

-- Create index on thread_parent_id for better performance
CREATE INDEX idx_thread_parent_id ON submissions(thread_parent_id);
