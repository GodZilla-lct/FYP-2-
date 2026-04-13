-- PHASE 1: OTP password reset (replaces JWT magic link for forgot-password)
-- Stores a 6-digit code and expiry on users (10-minute window set by application).

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6) DEFAULT NULL
AFTER last_login;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_otp_expires DATETIME DEFAULT NULL
AFTER reset_otp;
