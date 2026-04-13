-- Migration: Add SYSTEM_ADMIN Role and Super Admin Tables
-- Date: 2026-04-08
-- Description: Adds SYSTEM_ADMIN role and creates SystemSettings and SuperAdminLogs tables

-- Step 1: Add SYSTEM_ADMIN to Users role ENUM
ALTER TABLE users MODIFY COLUMN role ENUM(
  'STUDENT',
  'COORDINATOR',
  'DIRECTOR_SSC',
  'ASST_DIRECTOR',
  'FINANCE_SECRETARY',
  'REGISTRAR',
  'VC',
  'SYSTEM_ADMIN'
) NOT NULL DEFAULT 'STUDENT';

-- Step 2: Create SystemSettings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  global_freeze BOOLEAN DEFAULT FALSE,
  announcement_text TEXT,
  announcement_color VARCHAR(50) DEFAULT 'bg-blue-500',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 3: Seed SystemSettings with default row
INSERT INTO system_settings (id, global_freeze, announcement_text, announcement_color)
VALUES (1, FALSE, NULL, 'bg-blue-500')
ON DUPLICATE KEY UPDATE id = id;

-- Step 4: Create SuperAdminLogs table
CREATE TABLE IF NOT EXISTS super_admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  target_user_id INT,
  target_proposal_id INT,
  metadata JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action_type (action_type),
  INDEX idx_timestamp (timestamp)
);

-- Step 5: Add is_archived column to proposals
ALTER TABLE proposals ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE proposals ADD INDEX idx_is_archived (is_archived);

-- Step 6: Add budget tracking to societies
ALTER TABLE societies ADD COLUMN budget_allocated DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE societies ADD COLUMN budget_spent DECIMAL(12, 2) DEFAULT 0;

-- Migration complete
