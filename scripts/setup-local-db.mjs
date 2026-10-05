import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Bootstrap a fresh local database. Existing data is retained by the SQL's guards.
// Earlier ALTER migrations are already incorporated into schema.sql.
const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['schema.sql', ...readdirSync(join(root, 'migrations'))
  .filter(name => /^\d{4}.*\.sql$/.test(name) && Number(name.slice(0, 4)) >= 9)
  .sort().map(name => 'migrations/' + name),
  'seed_recipes.sql', 'seed_recipes_batch2.sql', 'seed_articles.sql',
  'seed_articles_batch2.sql', 'seed_articles_batch3.sql',
  'seed_anecdotes_autumn.sql', 'seed_article_food_labels.sql'];
const dir = mkdtempSync(join(tmpdir(), 'ketoklar-local-db-'));
try {
  const sql = join(dir, 'setup.sql');
  writeFileSync(sql, files.map(name => readFileSync(join(root, name), 'utf8')).join('\n'));
  const result = spawnSync(process.execPath,
    [join(root, 'node_modules/wrangler/bin/wrangler.js'), 'd1', 'execute', 'DB', '--local', '--file=' + sql],
    { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
