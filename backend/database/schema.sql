-- Campus Connect Database Schema (Refactored v3.0)
-- MySQL Database for University Management Portal
-- Dynamic Leadership Hierarchy Implementation

-- Users Table (Simplified with Roll Number)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  roll_number VARCHAR(50) UNIQUE,
  role ENUM('STUDENT', 'COORDINATOR', 'DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC') NOT NULL DEFAULT 'STUDENT',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_email (email),
  INDEX idx_roll_number (roll_number)
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

-- Indexes for performance
CREATE INDEX idx_societies_president ON societies(president_id);
CREATE INDEX idx_societies_coordinator ON societies(coordinator_id);
CREATE INDEX idx_attachments_proposal ON proposal_attachments(proposal_id);
CREATE INDEX idx_approval_history_proposal ON approval_history(proposal_id);
