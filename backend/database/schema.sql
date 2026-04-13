-- Campus Connect Database Schema (v4.0 - Enhanced)
-- MySQL Database for University Management Portal
-- Complete Feature Set with Authentication, Notifications, Analytics

-- Users Table (Enhanced with Profile & Security)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  roll_number VARCHAR(50) UNIQUE,
  role ENUM('STUDENT', 'COORDINATOR', 'DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC') NOT NULL DEFAULT 'STUDENT',
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  profile_picture VARCHAR(500),
  bio TEXT,
  phone VARCHAR(20),
  last_login TIMESTAMP NULL,
  reset_otp VARCHAR(6) NULL,
  reset_otp_expires DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_email (email),
  INDEX idx_roll_number (roll_number),
  INDEX idx_is_active (is_active)
);

-- Societies Table (Simplified with Coordinator Only)
CREATE TABLE societies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  coordinator_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_coordinator (coordinator_id)
);

-- Society Roles Table (Dynamic Hierarchy)
CREATE TABLE society_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  society_id INT NOT NULL,
  user_id INT NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  is_core_leader BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_society_user_role (society_id, user_id, role_name),
  INDEX idx_society_id (society_id),
  INDEX idx_user_id (user_id),
  INDEX idx_core_leader (is_core_leader)
);

-- Proposals Table (Enhanced with File Upload Support)
CREATE TABLE proposals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  society_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  budget_requested DECIMAL(10, 2) NOT NULL,
  current_status ENUM(
    'PENDING_COORDINATOR',
    'PENDING_DIRECTOR_SSC',
    'PENDING_ASST_DIRECTOR',
    'PENDING_FINANCE_SECRETARY',
    'PENDING_REGISTRAR',
    'PENDING_VC',
    'APPROVED',
    'RETURNED_FOR_REVISION',
    'REJECTED'
  ) NOT NULL DEFAULT 'PENDING_COORDINATOR',
  rejection_reason TEXT,
  rejection_type ENUM('SOFT', 'HARD'),
  assigned_asst_director_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_asst_director_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_society_id (society_id),
  INDEX idx_user_id (user_id),
  INDEX idx_current_status (current_status),
  INDEX idx_assigned_asst_director_id (assigned_asst_director_id)
);

-- Proposal Attachments Table
CREATE TABLE proposal_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  proposal_id INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- Approval History Table (for audit trail)
CREATE TABLE approval_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  proposal_id INT NOT NULL,
  approver_id INT NOT NULL,
  action ENUM('APPROVED', 'REJECTED', 'RESUBMITTED') NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Refresh Tokens Table (JWT Authentication)
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Password Reset Tokens Table
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
);

-- Notifications Table
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('PROPOSAL_STATUS', 'COMMENT', 'ASSIGNMENT', 'SYSTEM') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT,
  sender_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);

-- Notification Preferences Table
CREATE TABLE notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  proposal_status_change BOOLEAN DEFAULT TRUE,
  new_comment BOOLEAN DEFAULT TRUE,
  assignment_notification BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Proposal Comments Table
CREATE TABLE proposal_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  proposal_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_proposal_id (proposal_id),
  INDEX idx_user_id (user_id)
);

-- Draft Proposals Table
CREATE TABLE draft_proposals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  society_id INT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  event_date DATE,
  budget_requested DECIMAL(10, 2),
  draft_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_society_id (society_id)
);

-- Budget Allocations Table
CREATE TABLE budget_allocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  society_id INT NOT NULL,
  financial_year INT NOT NULL,
  allocated_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_society_year (society_id, financial_year),
  INDEX idx_financial_year (financial_year)
);

-- Saved Search Filters Table
CREATE TABLE saved_search_filters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  filters JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Calendar Events Table (for approved proposals)
CREATE TABLE calendar_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  proposal_id INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
  INDEX idx_event_date (event_date)
);

-- Activity Logs Table (Audit Trail)
CREATE TABLE activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
);

-- Indexes for performance
CREATE INDEX idx_societies_coordinator ON societies(coordinator_id);
CREATE INDEX idx_attachments_proposal ON proposal_attachments(proposal_id);
CREATE INDEX idx_approval_history_proposal ON approval_history(proposal_id);
