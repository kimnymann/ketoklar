-- Ketoklar database schema (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('morgen','frokost','aften','laekkerier')),
  servings INTEGER NOT NULL,
  prep_minutes INTEGER,
  ingredients_json TEXT NOT NULL,      -- JSON array: [{name, amount, unit}]
  instructions TEXT NOT NULL,          -- step-by-step text
  kcal INTEGER,
  carbs_g REAL,
  fat_g REAL,
  protein_g REAL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'kladde' CHECK (status IN ('kladde','til_godkendelse','godkendt')),
  locked INTEGER NOT NULL DEFAULT 0,   -- 0 = fri, 1 = kun abonnenter (fase 2)
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('videnskab','livsstil','anekdote')),
  excerpt TEXT,
  body TEXT NOT NULL,
  locked INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'kladde' CHECK (status IN ('kladde','til_godkendelse','godkendt')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

CREATE TABLE IF NOT EXISTS article_recipes (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
