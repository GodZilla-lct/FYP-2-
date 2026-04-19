-- Create Venues Table for Hall & Venue Management
-- This table stores all available venues/halls on campus

CREATE TABLE IF NOT EXISTS venues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_available (is_available),
  INDEX idx_name (name)
) COMMENT='Campus venues/halls for event booking';

-- Seed initial venues
INSERT INTO venues (name, capacity, is_available) VALUES
('Main Auditorium', 500, TRUE),
('Hafiz Hayat Hall', 300, TRUE),
('SSC Ground', 1000, TRUE),
('Departmental Grounds', 800, TRUE),
('Departmental Conference Halls', 150, TRUE);

-- Add venue_id to proposals table
ALTER TABLE proposals 
ADD COLUMN venue_id INT AFTER event_date,
ADD FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
ADD INDEX idx_venue_id (venue_id);
