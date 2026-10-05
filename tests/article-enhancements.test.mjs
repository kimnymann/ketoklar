import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { parseArticleBody } from '../src/lib/articleBody.ts';

const source = readFileSync(new URL('../src/lib/articleEnhancements.ts', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replaceAll('export ', '');
const enhance = runInNewContext(stripTypeScriptTypes(source) + '\nenhanceArticleBlocks');
const slug = 'keto-travl-hverdag-indkoeb-madpakker';
const body = readFileSync(new URL('../docs/laesekopier/keto-travl-hverdag-indkoeb-madpakker.md', import.meta.url), 'utf8');
const blocks = parseArticleBody(body);
test('only intended article is enhanced', () => assert.equal(enhance('other-article', blocks), blocks));
test('one checklist and two sets of three meal cards', () => {
  const result = enhance(slug, blocks);
  assert.equal(result.filter(x => x.type === 'shoppingChecklist').length, 1);
  const meals = result.filter(x => x.type === 'mealCards');
  assert.equal(meals.length, 2);
  assert.ok(meals.every(x => x.items.length === 3));
  assert.equal(result.filter(x => x.type === 'heading').length, blocks.filter(x => x.type === 'heading').length);
  assert.ok(meals[0].items[1].html.includes('frittata-spinat-feta'));
  assert.ok(meals[1].items[2].html.includes('blomkaalsris-bowl-kylling-peanutsauce'));
  assert.ok(result.some(x => x.type === 'paragraph' && x.html.includes('kølekrævende')));
});
test('unexpected editorial structure stays readable', () => {
  const input = parseArticleBody('## Tre madpakker uden brødbagning\n\nEn ændret tekst.');
  assert.equal(enhance(slug,input)[1].type,'paragraph');
});
