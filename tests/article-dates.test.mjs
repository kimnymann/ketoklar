import test from 'node:test';
import assert from 'node:assert/strict';
import { articleDates } from '../src/lib/seo.ts';

const published = '2026-09-14 06:00:00';
const publishedIso = '2026-09-14T06:00:00.000Z';
for (const updated of [null, undefined, '', 'invalid', '2026-09-04 12:00:00', published]) {
  test(`no public update for ${String(updated)}`, () => {
    assert.deepEqual(articleDates(published, updated), {
      published: publishedIso, modified: undefined, lastmod: publishedIso,
    });
  });
}
test('later update is shared by schema, visible date and sitemap', () => {
  const dates = articleDates(published, '2026-09-16 07:00:00');
  assert.equal(dates.modified, '2026-09-16T07:00:00.000Z');
  assert.equal(dates.lastmod, dates.modified);
});
test('same-day updates use actual timestamps, including time zones', () => {
  assert.equal(articleDates(published, '2026-09-14T08:00:00+02:00').modified, undefined);
  assert.equal(articleDates(published, '2026-09-14T08:01:00+02:00').modified, '2026-09-14T06:01:00.000Z');
});
test('unpublished or invalid publication has no public dates', () => {
  for (const value of [null, 'invalid']) {
    assert.deepEqual(articleDates(value, '2026-09-16 07:00:00'), {
      published: undefined, modified: undefined, lastmod: undefined,
    });
  }
});
