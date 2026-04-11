-- =============================================================
-- Happy Path – V4: Alter Ego Verification
-- =============================================================

-- Aggiunge il flag "verified" alla tabella alter_egos
ALTER TABLE alter_egos
    ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Tabella richieste di verifica Alter Ego
CREATE TABLE IF NOT EXISTS alter_ego_verification_requests (
    id              BIGSERIAL PRIMARY KEY,
    alter_ego_id    BIGINT NOT NULL REFERENCES alter_egos(id) ON DELETE CASCADE,
    requester_id    BIGINT NOT NULL REFERENCES users(id)      ON DELETE CASCADE,

    -- Dati anagrafici dichiarati dall'utente
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    birth_date      DATE         NOT NULL,
    birth_place     VARCHAR(100) NOT NULL,
    codice_fiscale  VARCHAR(16)  NOT NULL,

    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    reviewer_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    review_note     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ae_ver_status
    ON alter_ego_verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_ae_ver_alter_ego
    ON alter_ego_verification_requests(alter_ego_id);

CREATE INDEX IF NOT EXISTS idx_ae_ver_requester
    ON alter_ego_verification_requests(requester_id);
