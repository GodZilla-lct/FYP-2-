-- Migration: Create Society Cabinet Table
-- Purpose: Historical record of society cabinet members (non-login roles)
-- Date: 2026-04-17
-- Note: This table is isolated from the users table and RBAC system

-- Create society_cabinet table
CREATE TABLE IF NOT EXISTS society_cabinet (
  id INT AUTO_INCREMENT PRIMARY KEY,
  society_id INT NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  roll_number VARCHAR(50) NOT NULL,
  custom_role_title VARCHAR(100) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  added_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_society_id (society_id),
  INDEX idx_added_by (added_by),
  INDEX idx_academic_year (academic_year),
  INDEX idx_roll_number (roll_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE society_cabinet COMMENT = 'Historical ledger of society cabinet members without portal access';
