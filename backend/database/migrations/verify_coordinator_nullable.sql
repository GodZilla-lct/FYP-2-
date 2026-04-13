-- Migration: Verify coordinator_id is nullable in societies table
-- This ensures societies can have NO coordinator (null value)

-- Check current structure (for verification)
-- SHOW COLUMNS FROM societies WHERE Field = 'coordinator_id';

-- If coordinator_id doesn't exist or isn't nullable, this will fix it:
ALTER TABLE societies 
MODIFY COLUMN coordinator_id INT NULL DEFAULT NULL;

-- Ensure foreign key exists
-- ALTER TABLE societies 
-- ADD CONSTRAINT fk_societies_coordinator 
-- FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE SET NULL;

-- Migration complete
