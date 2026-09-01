-- Kør denne fil KUN ÉN GANG, og kun hvis du allerede har oprettet den rigtige
-- D1-database og kørt schema.sql, før billedfelterne blev tilføjet dertil.
-- Er databasen helt ny, er dette allerede dækket af schema.sql, og du behøver
-- ikke køre denne fil.
--
-- npx wrangler d1 execute DB --remote --file=./migrations/0002_add_image_fields.sql

ALTER TABLE recipes ADD COLUMN image_prompt TEXT;
ALTER TABLE recipes ADD COLUMN image_model TEXT;
ALTER TABLE recipes ADD COLUMN image_status TEXT NOT NULL DEFAULT 'mangler' CHECK (image_status IN ('mangler','under_generering','klar','fejlet'));
ALTER TABLE recipes ADD COLUMN image_version INTEGER NOT NULL DEFAULT 0;
