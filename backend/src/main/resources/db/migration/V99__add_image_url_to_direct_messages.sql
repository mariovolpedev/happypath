-- Migration: aggiunge la colonna image_url alla tabella direct_messages
-- per supportare l'invio di immagini MinIO nei messaggi diretti.
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
