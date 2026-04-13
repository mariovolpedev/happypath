-- =============================================================
-- Happy Path – V5: Alter Ego Activity
-- =============================================================
-- Aggiunge il supporto per agire come alter ego su commenti,
-- reazioni e messaggi diretti.
-- Rimuove il sistema di verifica degli alter ego (ora sostituito
-- dalla verifica utente come requisito unico).
-- =============================================================

ALTER TABLE comments
    ADD COLUMN IF NOT EXISTS alter_ego_id BIGINT
        REFERENCES alter_egos(id) ON DELETE SET NULL;

ALTER TABLE reactions
    ADD COLUMN IF NOT EXISTS alter_ego_id BIGINT
        REFERENCES alter_egos(id) ON DELETE SET NULL;

ALTER TABLE direct_messages
    ADD COLUMN IF NOT EXISTS sender_alter_ego_id BIGINT
        REFERENCES alter_egos(id) ON DELETE SET NULL;

-- Rimuove la tabella di verifica alter ego (feature rimossa)
DROP TABLE IF EXISTS alter_ego_verification_requests;

-- Rimuove la colonna verified da alter_egos (non più necessaria)
ALTER TABLE alter_egos DROP COLUMN IF EXISTS verified;

-- Indici per le nuove colonne
CREATE INDEX IF NOT EXISTS idx_comments_alter_ego
    ON comments(alter_ego_id) WHERE alter_ego_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reactions_alter_ego
    ON reactions(alter_ego_id) WHERE alter_ego_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dm_sender_alter_ego
    ON direct_messages(sender_alter_ego_id) WHERE sender_alter_ego_id IS NOT NULL;
