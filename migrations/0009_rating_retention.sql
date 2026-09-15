-- Apply before deploying the site and publisher retention job.
CREATE TABLE IF NOT EXISTS recipe_rating_totals (
  recipe_id INTEGER PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  rating_total INTEGER NOT NULL CHECK (rating_total >= rating_count AND rating_total <= 5 * rating_count),
  rating_count INTEGER NOT NULL CHECK (rating_count > 0)
);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_created ON recipe_ratings(created_at);
