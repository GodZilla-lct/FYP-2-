-- Session version: increment to invalidate all outstanding access tokens
ALTER TABLE users ADD COLUMN session_version INT NOT NULL DEFAULT 0;
