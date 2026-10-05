import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/components/PrintTools.astro', import.meta.url), 'utf8');
const code = stripTypeScriptTypes(source.split('<script>')[1].split('</script>')[0]);
test('print waits for images and fonts, tolerates a failed image, and restores button', async () => {
  let click; let printed = 0; let decoded = 0;
  const button = { disabled:false,addEventListener:(event,fn)=>{click=fn;} };
  const status = {textContent:''};
  const images = [
    {loading:'lazy',decode:async()=>{decoded++;}},
    {loading:'lazy',decode:async()=>{decoded++;throw Error('image unavailable');}},
  ];
  runInNewContext(code, {
    document:{querySelector:s=>s==='[data-print-page]'?button:status,querySelectorAll:()=>images,fonts:{ready:Promise.resolve()}},
    window:{print:()=>{assert.equal(decoded,2);printed++;}},
    setTimeout:()=>0,
  });
  await click();
  assert.equal(printed,1);assert.equal(button.disabled,false);assert.equal(status.textContent,'');
  assert.ok(images.every(i=>i.loading==='eager'));
});
test('source branding is independent of browser print headers',()=>{
  const layout=readFileSync(new URL('../src/layouts/Layout.astro',import.meta.url),'utf8');
  assert.match(layout,/<thead class="print-document__head">[\s\S]*?<strong>Ketoklar<\/strong>[\s\S]*?<small>\{canonicalUrl\}<\/small>[\s\S]*?<\/thead>/);
});
test('print header repeats in normal table flow without fixed offsets',()=>{
  const css=readFileSync(new URL('../src/styles/print.css',import.meta.url),'utf8');
  assert.match(css,/\.print-document__head\s*\{[^}]*display: table-header-group/);
  assert.match(css,/\.print-source\s*\{[^}]*position: static/);
  assert.doesNotMatch(css,/position:\s*fixed|top:\s*-\d/);
});
test('print controls are limited to unlocked detail pages',()=>{
  for(const path of ['opskrifter','artikler']) {
    const page=readFileSync(new URL(`../src/pages/${path}/[slug].astro`,import.meta.url),'utf8');
    assert.match(page,/printable=\{!isLocked\}/);
  }
});
