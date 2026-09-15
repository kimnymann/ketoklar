CREATE TABLE IF NOT EXISTS recipe_publication_days (
  day TEXT PRIMARY KEY,
  planned_recipe_id INTEGER,
  ready_recipe_id INTEGER,
  published_recipe_id INTEGER,
  lock_token TEXT,
  lock_until INTEGER NOT NULL DEFAULT 0,
  alert_claimed_at TEXT,
  alert_sent_at TEXT,
  last_error TEXT
);
CREATE TABLE IF NOT EXISTS recipe_publication_attempts (
  day TEXT NOT NULL,
  recipe_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('running','approved','failed')),
  error TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(day, recipe_id)
);
