import test from 'node:test';
import assert from 'node:assert/strict';
import { splitInstructionsIntoSteps } from '../src/lib/ingredientCategory.ts';

test('waffle serving abbreviations stay in their preparation steps', () => {
  assert.deepEqual(splitInstructionsIntoSteps('Varm vaffeljernet op. Brug et jern med plads til en fjerdedel af dejen pr. vaffel. Lad vaflerne hvile. Server to vafler pr. person.'), [
    'Varm vaffeljernet op.',
    'Brug et jern med plads til en fjerdedel af dejen pr. vaffel.',
    'Lad vaflerne hvile.',
    'Server to vafler pr. person.',
  ]);
});
test('quantities and common abbreviations do not create stray steps', () => {
  assert.deepEqual(splitInstructionsIntoSteps('Tilsæt ca. 1 tsk. salt og evt. lidt peber. Brug f.eks. en gaffel. Rør rundt.'), [
    'Tilsæt ca. 1 tsk. salt og evt. lidt peber.', 'Brug f.eks. en gaffel.', 'Rør rundt.',
  ]);
});
test('ordinary sentences, decimal quantities and empty input remain intact', () => {
  assert.deepEqual(splitInstructionsIntoSteps('Brug 1.5 dl vand.\n\nRør rundt.  '), ['Brug 1.5 dl vand.', 'Rør rundt.']);
  assert.deepEqual(splitInstructionsIntoSteps('  '), []);
});
