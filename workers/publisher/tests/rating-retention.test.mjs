import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { anonymizeExpiredRatings, RATING_SUMMARY_SQL } from '../../../src/lib/ratingRetention.ts';

function fixture() {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys = ON; CREATE TABLE recipes (id INTEGER PRIMARY KEY); INSERT INTO recipes VALUES (1), (2);');
  sql.exec(readFileSync(new URL('../../../migrations/0006_add_recipe_ratings.sql', import.meta.url), 'utf8'));
  const migration = readFileSync(new URL('../../../migrations/0009_rating_retention.sql', import.meta.url), 'utf8');
  sql.exec(migration);
  sql.exec(migration); // Idempotent on existing installations.
  const db = {
    prepare(query) {
      return {
        query, values: [],
        bind(...values) { this.values = values; return this; },
        async first() { return sql.prepare(query).get(...this.values); },
      };
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try {
        const result = statements.map(({ query, values }) => ({ meta: sql.prepare(query).run(...values) }));
        sql.exec('COMMIT');
        return result;
      } catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
  };
  const add = (recipe, hash, rating, age) => sql.prepare(`INSERT INTO recipe_ratings
    (recipe_id, voter_hash, rating, created_at) VALUES (?, ?, ?, datetime('now', ?))`).run(recipe, hash, rating, age);
  const summary = (id) => ({ ...sql.prepare(RATING_SUMMARY_SQL).get({ 1: id }) });
  return { sql, db, add, summary };
}

test('removes expired identifiers, preserves totals, separates recipes and is safe to retry', async () => {
  const f = fixture();
  f.add(1, 'expired-a', 5, '-13 months');
  f.add(1, 'boundary', 3, '-12 months');
  f.add(1, 'current', 4, '-11 months');
  f.add(2, 'expired-b', 1, '-2 years');
  const before = f.summary(1);
  assert.deepEqual(before, { average: 4, count: 3 });
  assert.equal((await anonymizeExpiredRatings(f.db)).anonymized, 3);
  assert.deepEqual(f.summary(1), before);
  assert.deepEqual(f.summary(2), { average: 1, count: 1 });
  assert.deepEqual(f.sql.prepare('SELECT voter_hash FROM recipe_ratings').all().map(r => r.voter_hash), ['current']);
  assert.equal((await anonymizeExpiredRatings(f.db)).anonymized, 0);
  assert.deepEqual(f.summary(1), before);
  assert.deepEqual(f.sql.prepare('PRAGMA table_info(recipe_rating_totals)').all().map(r => r.name), ['recipe_id', 'rating_total', 'rating_count']);
  f.sql.exec('DELETE FROM recipes WHERE id = 1');
  assert.deepEqual(f.summary(1), { average: 0, count: 0 });
  f.sql.close();
});

test('editing stars does not renew retention; a failure rolls back the transfer', async () => {
  const f = fixture();
  f.add(1, 'old', 2, '-13 months');
  f.sql.exec("UPDATE recipe_ratings SET rating = 5, updated_at = datetime('now')");
  f.sql.exec("CREATE TRIGGER fail_delete BEFORE DELETE ON recipe_ratings BEGIN SELECT RAISE(ABORT, 'test failure'); END;");
  await assert.rejects(anonymizeExpiredRatings(f.db), /test failure/);
  assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM recipe_rating_totals').get().n, 0);
  assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM recipe_ratings').get().n, 1);
  f.sql.exec('DROP TRIGGER fail_delete');
  await anonymizeExpiredRatings(f.db);
  assert.deepEqual(f.summary(1), { average: 5, count: 1 });
  f.sql.close();
});
