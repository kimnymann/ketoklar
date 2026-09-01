-- Kør denne fil KUN ÉN GANG mod den eksisterende produktionsdatabase.
-- npx wrangler d1 execute DB --remote --file=./migrations/0005_add_recipe_tips.sql

ALTER TABLE recipes ADD COLUMN tips TEXT;
