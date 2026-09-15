// Keep only per-recipe totals after 12 months, never hashes or individual timestamps.
export const RATING_SUMMARY_SQL = `
  SELECT COALESCE(ROUND(1.0 * SUM(total) / NULLIF(SUM(votes), 0), 1), 0) AS average,
         COALESCE(SUM(votes), 0) AS count
  FROM (
    SELECT SUM(rating) AS total, COUNT(*) AS votes FROM recipe_ratings WHERE recipe_id = ?1
    UNION ALL
    SELECT rating_total AS total, rating_count AS votes FROM recipe_rating_totals WHERE recipe_id = ?1
  )`;

export async function anonymizeExpiredRatings(db: D1Database) {
  const cutoff = await db.prepare("SELECT datetime('now', '-12 months') AS cutoff")
    .first<{ cutoff: string }>();
  if (!cutoff) throw new Error('Could not determine rating retention cutoff');
  // D1 batch is transactional. A retry sees no deleted rows and cannot count twice.
  // Bind the same cutoff to both statements, even if the clock changes mid-batch.
  const results = await db.batch([
    db.prepare(`
      INSERT INTO recipe_rating_totals (recipe_id, rating_total, rating_count)
      SELECT recipe_id, SUM(rating), COUNT(*) FROM recipe_ratings
      WHERE created_at <= ? GROUP BY recipe_id
      ON CONFLICT(recipe_id) DO UPDATE SET
        rating_total = recipe_rating_totals.rating_total + excluded.rating_total,
        rating_count = recipe_rating_totals.rating_count + excluded.rating_count
    `).bind(cutoff.cutoff),
    db.prepare('DELETE FROM recipe_ratings WHERE created_at <= ?').bind(cutoff.cutoff),
  ]);
  return { anonymized: results[1].meta.changes };
}
