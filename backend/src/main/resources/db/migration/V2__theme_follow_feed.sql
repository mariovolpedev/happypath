-- V2: theme follow + feed settings

-- Aggiunge colonna preset e created_at alla tabella themes
ALTER TABLE themes ADD COLUMN IF NOT EXISTS preset BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE themes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

-- Aggiorna i temi già esistenti come preset
UPDATE themes SET preset = TRUE WHERE id IN (
    SELECT id FROM themes
);

-- Tabella theme_follows
CREATE TABLE IF NOT EXISTS theme_follows (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme_id   BIGINT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_theme_follow UNIQUE (user_id, theme_id)
);

-- Tabella feed_settings
CREATE TABLE IF NOT EXISTS feed_settings (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    show_contents       BOOLEAN NOT NULL DEFAULT TRUE,
    show_comments       BOOLEAN NOT NULL DEFAULT TRUE,
    show_reactions      BOOLEAN NOT NULL DEFAULT TRUE,
    show_follow_events  BOOLEAN NOT NULL DEFAULT TRUE,
    sort_strategy       VARCHAR(20) NOT NULL DEFAULT 'SMART'
);
