CREATE TABLE IF NOT EXISTS editorial_publication_days (
  day TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  lock_token TEXT,
  lock_until INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  last_error TEXT
);
