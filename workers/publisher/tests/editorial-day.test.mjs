import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const recipe = readFileSync(new URL('../src/recipeDay.ts', import.meta.url), 'utf8');
const clock = recipe.slice(recipe.indexOf('export function danishClock'), recipe.indexOf('export function recipeDay')).replace('export ', '');
const source = readFileSync(new URL('../src/editorialDay.ts', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replaceAll('export ', '');
const { runEditorialDay, editorialWindow } = runInNewContext(
  stripTypeScriptTypes(clock + source) + '\n({runEditorialDay, editorialWindow})',
  { crypto, console: { error() {} } },
);
const now = new Date('2026-09-21T06:03:00Z');
function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../../../migrations/0011_editorial_publication_days.sql', import.meta.url), 'utf8'));
  const env = { DB: { prepare(sql) { return { bind(...args) { return {
    async run() { return { meta: db.prepare(sql).run(...args) }; },
  }; } }; } } };
  return { env, db, row: () => db.prepare('SELECT * FROM editorial_publication_days').get() };
}
const result = (published = [], warning = 'Billedfejl') => ({ articles: { published, warning }, anecdotes: { published, warning } });
test('Danish time window includes delayed runs and winter time, excludes other days', () => {
  assert.equal(editorialWindow(now), '2026-09-21');
  assert.equal(editorialWindow(new Date('2026-09-24T07:55:00Z')), '2026-09-24');
  assert.equal(editorialWindow(new Date('2026-12-07T07:05:00Z')), '2026-12-07');
  assert.equal(editorialWindow(new Date('2026-09-21T20:00:00Z')), '2026-09-21');
  for (const value of ['2026-09-21T05:59:00Z','2026-09-22T06:05:00Z'])
    assert.equal(editorialWindow(new Date(value)), null);
});
test('failure retries and success permanently stops further attempts', async () => {
  const f=fixture(); let calls=0;
  const publish=async()=>++calls===1?result():result(['faste']);
  await runEditorialDay(f.env,publish,now);
  assert.ok(f.row().last_error);
  await runEditorialDay(f.env,publish,now);
  await runEditorialDay(f.env,publish,now);
  assert.equal(calls,2); assert.ok(f.row().completed_at); assert.equal(f.row().last_error,null);
});
test('publication keeps checking after three failures because it does not generate images', async () => {
  const f=fixture(); let calls=0;
  for(let i=0;i<5;i++) await runEditorialDay(f.env,async()=>{calls++;throw Error('D1 temporary failure');},now);
  assert.equal(calls,5); assert.equal(f.row().attempts,5); assert.match(f.row().last_error,/D1/);
});
test('active lease excludes overlapping calls; expired lease recovers', async () => {
  const f=fixture(); let calls=0;
  f.db.exec("INSERT INTO editorial_publication_days(day,attempts,lock_token,lock_until) VALUES('2026-09-21',1,'stale',unixepoch()+900)");
  const publish=async()=>{calls++;return result(['faste']);};
  await runEditorialDay(f.env,publish,now); assert.equal(calls,0);
  f.db.exec('UPDATE editorial_publication_days SET lock_until=0');
  await runEditorialDay(f.env,publish,now); assert.equal(calls,1);assert.equal(f.row().attempts,2);
});
test('already-published response completes the day without another retry', async()=>{
  const f=fixture();let calls=0;
  const publish=async()=>{calls++;return result([], 'Dagens artikel er allerede udgivet.');};
  await runEditorialDay(f.env,publish,now);await runEditorialDay(f.env,publish,now);
  assert.equal(calls,1);assert.ok(f.row().completed_at);
});
test('real SQLite publication guard blocks a second candidate in the same track',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE articles(id INTEGER, status TEXT, category TEXT, published_at TEXT); INSERT INTO articles VALUES(1,'godkendt','livsstil',NULL),(2,'godkendt','videnskab',NULL)");
  const index=readFileSync(new URL('../src/index.ts',import.meta.url),'utf8');
  const sql=index.match(/\.prepare\(`(UPDATE articles SET published_at = datetime\('now'\)[\s\S]*?)`\)/)[1]
    .replace('${where}',"category IN ('videnskab','livsstil')");
  assert.equal(db.prepare(sql).run(1,'2000-01-01','2100-01-01').changes,1);
  assert.equal(db.prepare(sql).run(2,'2000-01-01','2100-01-01').changes,0);
});
