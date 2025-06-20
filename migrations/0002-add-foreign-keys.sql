-- Add Foreign Key Constraints
-- This migration adds foreign key relationships between tables

-- Link accounts to users
ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user 
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

-- Link sessions to users  
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user 
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

-- Link submissions to users
ALTER TABLE submissions ADD CONSTRAINT fk_submissions_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Thread parent relationship
ALTER TABLE submissions ADD CONSTRAINT fk_thread_parent 
  FOREIGN KEY (thread_parent_id) REFERENCES submissions(submission_id);

SELECT 'Foreign key constraints added successfully' as result; 