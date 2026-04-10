-- =============================================================
-- Happy Path – V2: Direct message attachment support
-- =============================================================
-- Adds optional FK-like columns to direct_messages so that a
-- message can embed a content card or a user profile.
-- We store just the IDs (not hard FKs) so that deleted content
-- does not cascade-delete the message history.
-- =============================================================

ALTER TABLE direct_messages
    ADD COLUMN IF NOT EXISTS attached_content_id BIGINT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS attached_user_id    BIGINT DEFAULT NULL;

COMMENT ON COLUMN direct_messages.attached_content_id
    IS 'Optional: ID of a content post shared inside this message';

COMMENT ON COLUMN direct_messages.attached_user_id
    IS 'Optional: ID of a user profile shared inside this message';

-- Index to quickly load messages that contain a specific content
CREATE INDEX IF NOT EXISTS idx_dm_attached_content
    ON direct_messages (attached_content_id)
    WHERE attached_content_id IS NOT NULL;
