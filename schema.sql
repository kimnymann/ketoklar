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
  tips TEXT,                           -- praktisk tip til opskriften
  kcal INTEGER,
  carbs_g REAL,
  fat_g REAL,
  protein_g REAL,
  image_url TEXT,
  image_prompt TEXT,        -- kun den ret-specifikke del, ikke den faste stilskabelon
  image_model TEXT,         -- fx 'flux-1-schnell', hvilken model der lavede billedet
  image_status TEXT NOT NULL DEFAULT 'mangler' CHECK (image_status IN ('mangler','under_generering','klar','fejlet')),
  image_version INTEGER NOT NULL DEFAULT 0,
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
  image_url TEXT,
  image_prompt TEXT,
  image_model TEXT,
  image_status TEXT NOT NULL DEFAULT 'mangler' CHECK (image_status IN ('mangler','under_generering','klar','fejlet')),
  image_version INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS article_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  marker TEXT NOT NULL,          -- kort id brugt i [[image:id|prompt]] i selve teksten
  prompt TEXT NOT NULL,          -- ret/artikel-specifik del, kombineres med fast husstil ved generering
  image_url TEXT,
  image_model TEXT,
  image_status TEXT NOT NULL DEFAULT 'mangler' CHECK (image_status IN ('mangler','under_generering','klar','fejlet')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (article_id, marker)
);

-- Hvert AI-genereret billede vurderes af en separat visionmodel, før det må
-- publiceres. Afviste kandidater gemmes, så årsagen kan undersøges uden at
-- overskrive et eventuelt eksisterende livebillede.
CREATE TABLE IF NOT EXISTS image_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('recipe','article','article_body')),
  entity_id INTEGER NOT NULL,
  marker TEXT NOT NULL DEFAULT '',
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('godkendt','afvist')),
  score INTEGER NOT NULL,
  reason TEXT,
  observed_subject TEXT,
  retry_instruction TEXT,
  candidate_url TEXT,
  review_model TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Anonyme brugervurderinger. voter_hash kommer fra en tilfældig HttpOnly-cookie;
-- IP-adresser gemmes ikke. En browser kan kun have én aktiv vurdering pr. opskrift.
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (recipe_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_image_reviews_entity ON image_reviews(entity_type, entity_id, marker, id DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
