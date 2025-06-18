-- Migration: Fix migrations table unique constraint

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    -- Check if unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'migrations_filename_key' 
        OR conname LIKE '%migrations_filename%'
    ) THEN
        -- Add unique constraint
        ALTER TABLE migrations ADD CONSTRAINT migrations_filename_unique UNIQUE (filename);
    END IF;
END $$;

-- Verify the constraint exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'migrations'::regclass; 