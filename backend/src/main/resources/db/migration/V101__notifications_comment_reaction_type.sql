-- V101: add COMMENT_REACTION to the notifications type check constraint
--
-- The original constraint only allowed: FOLLOW, COMMENT, REACTION, MENTION, SYSTEM
-- We need to include COMMENT_REACTION introduced by the comment-reactions feature.

ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check
        CHECK (type IN ('FOLLOW', 'COMMENT', 'REACTION', 'COMMENT_REACTION', 'MENTION', 'SYSTEM'));
