import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

// Execute the production queue functions with an in-memory DB and image service.
const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
const functions = stripTypeScriptTypes(source.slice(
  source.indexOf('function articleTrackDetails('),
  source.indexOf('async function runPublishing('),
));

function fixture(failures = {}, track = 'article', publishedToday = 0) {
  const category = track === 'anecdote' ? 'anekdote' : 'videnskab';
  const rows = [1, 2, 3].map(id => ({ id, slug: `post-${id}`, category }));
  const published = [];
  const reviewed = [];
  const env = { DB: { prepare(sql) {
    let bindings = [];
    return {
      bind(...values) { bindings = values; return this; },
      async first() {
        return { count: sql.includes("date('now')") ? publishedToday : rows.length - published.length };
      },
      async all() {
        assert.ok(sql.includes(track === 'anecdote' ? "category = 'anekdote'" : "category IN ('videnskab','livsstil')"));
        return { results: sql.includes('LIMIT ?') ? rows.slice(0, bindings[0]) : rows };
      },
      async run() { published.push(bindings[0]); publishedToday++; },
    };
  } } };
  const publish = runInNewContext(`${functions}\npublishArticleTrack`, {
    LOW_ARTICLE_QUEUE_THRESHOLD: 2,
    async ensureArticleImage(_env, article) {
      reviewed.push(article.id);
      return { ok: failures[article.id] !== 'hero', error: 'Rejected' };
    },
    async ensureArticleBodyImages(_env, article) {
      return failures[article.id] === 'body' ? [{ ok: false, marker: 'body', error: 'Rejected' }] : [];
    },
  });
  return { run: () => publish(env, 1, track), published, reviewed };
}

for (const track of ['article', 'anecdote']) {
  for (const reason of ['hero', 'body']) {
    test(`${track}: skips rejected ${reason}, publishes next, then stops`, async () => {
      const f = fixture({ 1: reason }, track);
      const result = await f.run();
      assert.deepEqual(f.published, [2]);
      assert.deepEqual(f.reviewed, [1, 2]);
      assert.equal(result.imageWarnings.length, 1);
      assert.equal(result.queueRemaining, 2);
      await f.run();
      assert.deepEqual(f.published, [2]);
      assert.deepEqual(f.reviewed, [1, 2]);
    });
  }
  test(`${track}: all rejected leaves queue intact`, async () => {
    const f = fixture({ 1: 'hero', 2: 'body', 3: 'hero' }, track);
    const result = await f.run();
    assert.deepEqual(f.published, []);
    assert.deepEqual(f.reviewed, [1, 2, 3]);
    assert.equal(result.imageWarnings.length, 3);
    assert.equal(result.queueRemaining, 3);
    assert.match(result.warning, /Ingen/);
  });
  test(`${track}: first approved stops before later candidates`, async () => {
    const f = fixture({}, track);
    await f.run();
    assert.deepEqual(f.published, [1]);
    assert.deepEqual(f.reviewed, [1]);
  });
}
