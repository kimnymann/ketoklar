CREATE TABLE IF NOT EXISTS recipe_image_jobs (
 recipe_id INTEGER PRIMARY KEY REFERENCES recipes(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','ready','review')),
 content_failures INTEGER NOT NULL DEFAULT 0,
 technical_failures INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT 0,
 last_error TEXT,
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS recipe_reserve_runs (
 day TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0,
 lock_token TEXT, lock_until INTEGER NOT NULL DEFAULT 0, alert_claimed_at TEXT
);
INSERT OR IGNORE INTO recipe_image_jobs(recipe_id,status,content_failures,last_error)
SELECT r.id,'review',COUNT(i.id),'Gentagne tidligere billedafvisninger; kræver redaktionel gennemgang.'
FROM recipes r JOIN image_reviews i ON i.entity_type='recipe' AND i.entity_id=r.id
WHERE r.published_at IS NULL AND r.image_status!='klar' AND i.status='afvist'
AND COALESCE(i.reason,'') NOT LIKE 'Automatisk billedkontrol fejlede:%'
GROUP BY r.id HAVING COUNT(i.id)>=2;
