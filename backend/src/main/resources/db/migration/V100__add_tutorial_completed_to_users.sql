-- Add tutorial_completed flag to users table.
-- Existing users default to TRUE (they predate the tutorial feature).
ALTER TABLE users ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Users created before this migration are treated as having already completed the tutorial.
UPDATE users SET tutorial_completed = TRUE WHERE tutorial_completed = FALSE;
