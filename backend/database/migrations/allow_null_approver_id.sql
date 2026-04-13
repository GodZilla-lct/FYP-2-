-- Migration: Allow NULL approver_id in approval_history
-- Purpose: Support VC Magic Link approvals where VC has no user account
-- Date: April 9, 2026
-- Module: 4 - Mailing & Notification Engine

-- STEP 1: Drop the existing foreign key constraint
ALTER TABLE approval_history 
DROP FOREIGN KEY approval_history_ibfk_2;

-- STEP 2: Modify approver_id column to allow NULL
ALTER TABLE approval_history 
MODIFY COLUMN approver_id INT NULL;

-- STEP 3: Add back the foreign key constraint with ON DELETE SET NULL
ALTER TABLE approval_history 
ADD CONSTRAINT approval_history_ibfk_2 
FOREIGN KEY (approver_id) REFERENCES users(id) 
ON DELETE SET NULL;

-- STEP 4: Add index for better query performance
CREATE INDEX idx_approver_id ON approval_history(approver_id);

-- Verification query (optional - run manually to verify)
-- SELECT 
--   COLUMN_NAME, 
--   IS_NULLABLE, 
--   COLUMN_TYPE 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'campus_connect' 
--   AND TABLE_NAME = 'approval_history' 
--   AND COLUMN_NAME = 'approver_id';

-- Expected result: IS_NULLABLE = 'YES'
