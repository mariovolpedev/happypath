-- =============================================================
-- Happy Path – Database Schema V1
-- =============================================================

-- ENUM TYPES
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('GUEST', 'USER', 'VERIFIED_USER', 'MODERATOR', 'ADMIN');
CREATE TYPE IF NOT EXISTS ban_duration AS ENUM ('SHORT', 'MEDIUM', 'LONG', 'PERMANENT');
CREATE TYPE IF NOT EXISTS ban_status AS ENUM ('ACTIVE', 'EXPIRED', 'APPEALED', 'OVERTURNED');
CREATE TYPE IF NOT EXISTS report_type AS ENUM ('USER', 'POST', 'COMMENT', 'ALTER_EGO', 'TECHNICAL');
CREATE TYPE IF NOT EXISTS report_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TYPE IF NOT EXISTS reaction_type AS ENUM ('LIKE', 'LOVE', 'FUNNY', 'INSPIRING', 'CUTE');
CREATE TYPE IF NOT EXISTS content_type AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'LINK');
CREATE TYPE IF NOT EXISTS warning_severity AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- =============================================================
-- THEMES / CATEGORIES
-- =============================================================
CREATE TABLE IF NOT EXISTS themes (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(50),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================
-- USERS
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id                  BIGSERIAL PRIMARY KEY,
    username            VARCHAR(50) NOT NULL UNIQUE,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    display_name        VARCHAR(100),
    bio                 TEXT,
    avatar_url          VARCHAR(500),
    role                user_role NOT NULL DEFAULT 'USER',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    is_identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token  VARCHAR(255),
    reset_token         VARCHAR(255),
    reset_token_expiry  TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login          TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =============================================================
-- ALTER EGO (pages / personas — only for verified users)
-- =============================================================
CREATE TABLE IF NOT EXISTS alter_egos (
    id              BIGSERIAL PRIMARY KEY,
    owner_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    follower_count  INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alter_egos_owner ON alter_egos(owner_id);
CREATE INDEX IF NOT EXISTS idx_alter_egos_slug ON alter_egos(slug);

-- Admins of an alter ego (all must be verified users)
CREATE TABLE IF NOT EXISTS alter_ego_admins (
    alter_ego_id    BIGINT NOT NULL REFERENCES alter_egos(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (alter_ego_id, user_id)
);

-- =============================================================
-- POSTS / CONTENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS posts (
    id              BIGSERIAL PRIMARY KEY,
    author_id       BIGINT REFERENCES users(id) ON DELETE SET NULL,
    alter_ego_id    BIGINT REFERENCES alter_egos(id) ON DELETE SET NULL,
    theme_id        BIGINT REFERENCES themes(id) ON DELETE SET NULL,
    title           VARCHAR(300),
    body            TEXT,
    content_type    content_type NOT NULL DEFAULT 'TEXT',
    media_url       VARCHAR(500),
    is_published    BOOLEAN NOT NULL DEFAULT TRUE,
    is_censored     BOOLEAN NOT NULL DEFAULT FALSE,
    censor_reason   TEXT,
    view_count      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_author_or_alter_ego CHECK (
        author_id IS NOT NULL OR alter_ego_id IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_alter_ego ON posts(alter_ego_id);
CREATE INDEX IF NOT EXISTS idx_posts_theme ON posts(theme_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published) WHERE is_published = TRUE;

-- =============================================================
-- DEDICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS dedications (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    from_user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================
-- COMMENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS comments (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id   BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    is_censored BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- =============================================================
-- REACTIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS reactions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    comment_id      BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    reaction_type   reaction_type NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reaction_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT uq_user_post_reaction UNIQUE (user_id, post_id),
    CONSTRAINT uq_user_comment_reaction UNIQUE (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment ON reactions(comment_id);

-- =============================================================
-- FOLLOWS (user → user or user → alter_ego)
-- =============================================================
CREATE TABLE IF NOT EXISTS follows (
    id              BIGSERIAL PRIMARY KEY,
    follower_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
    alter_ego_id    BIGINT REFERENCES alter_egos(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_follow_target CHECK (
        (following_id IS NOT NULL AND alter_ego_id IS NULL) OR
        (following_id IS NULL AND alter_ego_id IS NOT NULL)
    ),
    CONSTRAINT uq_follow_user UNIQUE (follower_id, following_id),
    CONSTRAINT uq_follow_alter_ego UNIQUE (follower_id, alter_ego_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- =============================================================
-- MESSAGES (private messaging)
-- =============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at    TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body            TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- =============================================================
-- REPORTS
-- =============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              BIGSERIAL PRIMARY KEY,
    reporter_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type     report_type NOT NULL,
    reported_user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
    reported_post_id    BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    reported_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL,
    status          report_status NOT NULL DEFAULT 'PENDING',
    resolved_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    resolution_note TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

-- =============================================================
-- BANS
-- =============================================================
CREATE TABLE IF NOT EXISTS bans (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issued_by       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration        ban_duration NOT NULL,
    status          ban_status NOT NULL DEFAULT 'ACTIVE',
    reason          TEXT NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE,
    appealed_at     TIMESTAMP WITH TIME ZONE,
    appeal_reason   TEXT,
    reviewed_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    review_note     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bans_user ON bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_status ON bans(status);

-- =============================================================
-- WARNINGS (ammonizioni)
-- =============================================================
CREATE TABLE IF NOT EXISTS warnings (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issued_by   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    severity    warning_severity NOT NULL DEFAULT 'MILD',
    reason      TEXT NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings(user_id);

-- =============================================================
-- IDENTITY VERIFICATION REQUESTS
-- =============================================================
CREATE TABLE IF NOT EXISTS identity_verifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_url    VARCHAR(500) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    review_note     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMP WITH TIME ZONE
);

-- =============================================================
-- SEED DATA – THEMES
-- =============================================================
INSERT INTO themes (name, slug, description, icon) VALUES
    ('Motivazionale', 'motivational', 'Contenuti che ispirano e motivano', '💪'),
    ('Divertente', 'funny', 'Contenuti leggeri e divertenti', '😄'),
    ('Animali', 'animals', 'Il mondo degli animali', '🐾'),
    ('Natura', 'nature', 'La bellezza della natura', '🌿'),
    ('Arte', 'art', 'Arte, creatività e bellezza', '🎨'),
    ('Musica', 'music', 'Ritmi, melodie e canzoni felici', '🎵'),
    ('Sport', 'sport', 'Sport e vita attiva', '⚽'),
    ('Cucina', 'food', 'Ricette, piatti e momenti a tavola', '🍽️'),
    ('Viaggi', 'travel', 'Luoghi e avventure meravigliose', '✈️'),
    ('Parodia', 'parody', 'Imitazioni e parodie creative', '🎭'),
    ('Bambini', 'children', 'Il mondo incantato dei bambini', '🧒'),
    ('Famiglia', 'family', 'Momenti di famiglia', '👨‍👩‍👧‍👦'),
    ('Benessere', 'wellness', 'Salute, meditazione, serenità', '🧘'),
    ('Scienza', 'science', 'Curiosità e meraviglie scientifiche', '🔬'),
    ('Tecnologia', 'technology', 'Innovazione in modo positivo', '💡');
