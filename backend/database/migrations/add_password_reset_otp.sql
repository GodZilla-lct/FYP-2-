-- PHASE 1: OTP password reset (replaces JWT magic link for forgot-password)
-- Stores a 6-digit code and expiry on users (10-minute window set by application).

-- Add reset_otp column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'reset_otp');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE users ADD COLUMN reset_otp VARCHAR(6) DEFAULT NULL AFTER last_login', 
              'SELECT "Column reset_otp already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add reset_otp_expires column if it doesn't exist
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'reset_otp_expires');

SET @sql = IF(@col_exists = 0, 
              'ALTER TABLE users ADD COLUMN reset_otp_expires DATETIME DEFAULT NULL AFTER reset_otp', 
              'SELECT "Column reset_otp_expires already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
