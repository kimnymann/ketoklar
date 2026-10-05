CREATE TABLE IF NOT EXISTS article_image_jobs (
 article_id INTEGER PRIMARY KEY REFERENCES articles(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','ready','review')),
 content_failures INTEGER NOT NULL DEFAULT 0,
 technical_failures INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT 0,
 last_error TEXT,
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS article_reserve_runs (
 day TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0,
 lock_token TEXT, lock_until INTEGER NOT NULL DEFAULT 0, alert_claimed_at TEXT
);
CREATE TABLE IF NOT EXISTS editorial_alert_days(day TEXT PRIMARY KEY);
INSERT OR IGNORE INTO article_image_jobs(article_id,status,content_failures,last_error)
SELECT a.id,'review',COUNT(i.id),'Gentagne tidligere billedafvisninger; kræver redaktionel gennemgang.'
FROM articles a JOIN image_reviews i ON i.entity_type='article' AND i.entity_id=a.id
WHERE a.published_at IS NULL AND a.image_status!='klar' AND i.status='afvist'
AND COALESCE(i.reason,'') NOT LIKE 'Automatisk billedkontrol fejlede:%'
GROUP BY a.id HAVING COUNT(i.id)>=2;
