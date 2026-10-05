import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/components/CookieNotice.astro', import.meta.url), 'utf8').split('<script>')[1].split('</script>')[0];
const code = stripTypeScriptTypes(source);
function setup(saved = null, hostname = 'ketoklar.dk', blocked = false) {
  const elements = new Map();
  const scripts = [];
  const storage = new Map(saved ? [['kk_analytics_consent', JSON.stringify(saved)]] : []);
  let reloads = 0;
  const events = {};
  const element = () => ({ hidden: true, events: {}, focus() {}, addEventListener(name, fn) { this.events[name] = fn; } });
  for (const id of ['cookie-notice', 'cookie-reject', 'cookie-accept']) elements.set(id, element());
  const trigger = element();
  runInNewContext(code, {
    document: { getElementById: id => elements.get(id), createElement: () => ({dataset:{}}), head:{appendChild:s=>scripts.push(s)}, querySelector:()=>null, querySelectorAll:()=>[trigger] },
    location:{hostname,reload:()=>reloads++},
    window:{addEventListener:(name,fn)=>events[name]=fn},
    localStorage:{getItem:k=>{if(blocked)throw Error();return storage.get(k)},setItem:(k,v)=>{if(blocked)throw Error();storage.set(k,v)}},
  });
  return {scripts,storage,elements,events,get reloads(){return reloads},click:id=>elements.get(id).events.click(),reopen:()=>trigger.events.click({preventDefault(){}})};
}
test('no measurement before consent; rejecting persists without loading',()=>{
  const f=setup(); assert.equal(f.scripts.length,0); assert.equal(f.elements.get('cookie-notice').hidden,false);
  f.click('cookie-reject'); assert.equal(f.scripts.length,0); assert.equal(JSON.parse(f.storage.get('kk_analytics_consent')).allowed,false);
});
test('accept loads once; withdrawal reloads with saved refusal',()=>{
  const f=setup();f.click('cookie-accept');f.click('cookie-accept');assert.equal(f.scripts.length,1);
  f.reopen();assert.equal(f.elements.get('cookie-notice').hidden,false);f.click('cookie-reject');assert.equal(f.reloads,1);
  const next=setup(JSON.parse(f.storage.get('kk_analytics_consent')));assert.equal(next.scripts.length,0);
});
test('valid remembered consent loads; expired and legacy values do not',()=>{
  assert.equal(setup({version:1,allowed:true,expires:Date.now()+60000}).scripts.length,1);
  for(const saved of [{version:1,allowed:true,expires:1},{version:1,expires:Date.now()+60000},{version:1,allowed:'yes',expires:Date.now()+60000}]) assert.equal(setup(saved).scripts.length,0);
});
test('previews never load analytics and unavailable storage fails closed',()=>{
  const f=setup(null,'preview.workers.dev');f.click('cookie-accept');assert.equal(f.scripts.length,0);
  assert.equal(setup(null,'ketoklar.dk',true).scripts.length,0);
});
test('choice changes in another tab trigger re-evaluation',()=>{
  const f=setup(); f.events.storage({key:'kk_analytics_consent'});assert.equal(f.reloads,1);
});
