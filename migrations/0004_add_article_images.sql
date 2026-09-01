-- Kør denne fil KUN ÉN GANG mod den eksisterende produktionsdatabase.
-- npx wrangler d1 execute DB --remote --file=./migrations/0004_add_article_images.sql

CREATE TABLE IF NOT EXISTS article_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  marker TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  image_model TEXT,
  image_status TEXT NOT NULL DEFAULT 'mangler' CHECK (image_status IN ('mangler','under_generering','klar','fejlet')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (article_id, marker)
);
