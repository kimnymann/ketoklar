-- Kør denne fil KUN ÉN GANG mod den eksisterende produktionsdatabase.
-- npx wrangler d1 execute DB --remote --file=./migrations/0003_add_article_image_fields.sql

ALTER TABLE articles ADD COLUMN image_url TEXT;
ALTER TABLE articles ADD COLUMN image_prompt TEXT;
ALTER TABLE articles ADD COLUMN image_model TEXT;
ALTER TABLE articles ADD COLUMN image_status TEXT NOT NULL DEFAULT 'mangler' CHECK (image_status IN ('mangler','under_generering','klar','fejlet'));
ALTER TABLE articles ADD COLUMN image_version INTEGER NOT NULL DEFAULT 0;
