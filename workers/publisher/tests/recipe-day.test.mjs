import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const source = stripTypeScriptTypes(readFileSync(new URL('../src/recipeDay.ts', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replaceAll('export ', ''));
function fixture(fail = [], hang = []) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE recipes(id INTEGER PRIMARY KEY,slug TEXT,title TEXT,category TEXT,ingredients_json TEXT,instructions TEXT,created_at TEXT,status TEXT,image_status TEXT,image_url TEXT,published_at TEXT);
    CREATE TABLE image_reviews(id INTEGER PRIMARY KEY,entity_type TEXT,entity_id INTEGER,marker TEXT,status TEXT);`);
  db.exec(readFileSync(new URL('../../../migrations/0010_recipe_publication_days.sql', import.meta.url), 'utf8'));
  for (let id = 1; id <= 5; id++) db.prepare("INSERT INTO recipes VALUES (?,?,?,'morgen','[]','cook','2026-01-01','godkendt','fejlet',NULL,NULL)").run(id, `recipe-${id}`, `Recipe ${id}`);
  let current = '2026-09-15T05:00:00Z';
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [current])); } }
  const calls = [], emails = [];
  const env = { DB: { prepare(sql) { let values = []; return {
    bind(...v) { values = v; return this; },
    async first() { return db.prepare(sql).get(...values) ?? null; },
    async all() { return { results: db.prepare(sql).all(...values) }; },
    async run() { return { meta: db.prepare(sql).run(...values) }; },
  }; } }, EMAIL: { async send(mail) { emails.push(mail); } } };
  const generate = async (_env, r, force, options) => {
    calls.push(r.id); assert.equal(options.maxAttempts, 1);
    if (hang.includes(r.id)) return new Promise(() => {});
    if (fail.includes(r.id)) return { ok: false, error: 'Afvist' };
    db.prepare("UPDATE recipes SET image_status='klar',image_url='approved.png' WHERE id=?").run(r.id);
    db.prepare("INSERT INTO image_reviews(entity_type,entity_id,marker,status) VALUES ('recipe',?,'','godkendt')").run(r.id);
    return { ok: true };
  };
  const api = runInNewContext(`${source}\n({runRecipeDay,planRecipeDay,danishClock,recipeDay});`, { Date: Clock, Intl, crypto: { randomUUID }, AbortController, setTimeout: (fn) => setTimeout(fn, 20), clearTimeout, console, ensureRecipeImage: generate });
  return { db, calls, emails, api, env, setTime(t) { current = t; }, run() { return api.runRecipeDay(env); } };
}
test('first rejection, second approved; publishes at 08 only and never twice', async () => {
  const f = fixture([1]); await f.run();
  assert.deepEqual(f.calls, [1,2]); assert.equal(f.emails.length,0);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM recipes WHERE published_at IS NOT NULL').get().n,0);
  // SQLite datetime(now) uses real time: set a fixed clock for the DB too.
  f.db.function('datetime', () => '2026-09-15 06:00:00');
  f.setTime('2026-09-15T06:00:00Z'); await Promise.all([f.run(), f.run()]); await f.run();
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM recipes WHERE published_at IS NOT NULL').get().n,1);
  assert.deepEqual(f.calls,[1,2]); assert.equal(f.emails.length,0);
});
test('three failed candidates stop; one email across repeated runs; next day retries', async () => {
  const f=fixture([1,2,3,4,5]); await f.run(); await f.run();
  f.setTime('2026-09-15T06:15:00Z'); await f.run();
  assert.deepEqual(f.calls,[1,2,3]); assert.equal(f.emails.length,1);
  f.setTime('2026-09-16T05:00:00Z'); await f.run();
  assert.deepEqual(f.calls,[1,2,3,1,2,3]); assert.equal(f.emails.length,2);
});
test('interrupted attempt consumes one slot and recovers with next recipe', async () => {
  const f=fixture([2,3]); await f.api.planRecipeDay(f.env,'2026-09-15');
  f.db.exec("INSERT INTO recipe_publication_attempts(day,recipe_id,status) VALUES ('2026-09-15',1,'running')");
  await f.run(); assert.deepEqual(f.calls,[2,3]); assert.equal(f.emails.length,1);
});
test('already published today silences warnings and image generation', async () => {
  const f=fixture(); f.db.exec("UPDATE recipes SET published_at='2026-09-15 06:00:00' WHERE id=1");
  await f.run(); assert.deepEqual(f.calls,[]); assert.equal(f.emails.length,0);
});
test('editorial days have no recipe generation or warnings', async () => {
  const f=fixture(); for (const date of ['2026-09-14','2026-09-17']) { f.setTime(`${date}T05:00:00Z`); await f.run(); }
  assert.deepEqual(f.calls,[]); assert.equal(f.emails.length,0);
});
test('clock follows Copenhagen summer and winter time', () => {
  const f=fixture(); assert.equal(f.api.danishClock(new Date('2026-07-15T05:00:00Z')).minutes,420);
  assert.equal(f.api.danishClock(new Date('2026-12-15T06:00:00Z')).minutes,420);
});
test('hanging image attempt times out and advances to next candidate', async () => {
  const f=fixture([], [1]); await f.run(); assert.deepEqual(f.calls,[1,2]); assert.equal(f.emails.length,0);
});
test('approval saved before crash is recovered without another generation', async () => {
  const f=fixture(); await f.api.planRecipeDay(f.env,'2026-09-15');
  f.db.exec("INSERT INTO recipe_publication_attempts(day,recipe_id,status) VALUES ('2026-09-15',1,'running'); UPDATE recipes SET image_status='klar',image_url='ok.png' WHERE id=1; INSERT INTO image_reviews(entity_type,entity_id,marker,status) VALUES ('recipe',1,'','godkendt')");
  await f.run(); assert.deepEqual(f.calls,[]); assert.equal(f.emails.length,0);
});
test('previous recipe category is excluded', async () => {
  const f=fixture(); f.db.exec("UPDATE recipes SET category='aften',published_at='2026-09-14 06:00:00' WHERE id=1");
  await f.run(); assert.deepEqual(f.calls,[2]);
});
