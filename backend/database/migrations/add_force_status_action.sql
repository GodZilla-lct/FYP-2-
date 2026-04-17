-- Migration: Add FORCE_STATUS_CHANGE to approval_history action ENUM
-- This allows super admins to force change proposal status

ALTER TABLE approval_history 
MODIFY COLUMN action ENUM('APPROVED', 'REJECTED', 'RESUBMITTED', 'FORCE_STATUS_CHANGE') NOT NULL;
