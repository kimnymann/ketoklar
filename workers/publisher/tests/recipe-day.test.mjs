import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import test from 'node:test';
const source=name=>stripTypeScriptTypes(readFileSync(new URL(`../src/${name}.ts`,import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export ',''));
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE recipes(id INTEGER PRIMARY KEY,slug TEXT,title TEXT,category TEXT,ingredients_json TEXT,instructions TEXT,created_at TEXT,status TEXT,image_status TEXT,image_url TEXT,published_at TEXT);
 CREATE TABLE image_reviews(id INTEGER PRIMARY KEY,entity_type TEXT,entity_id INTEGER,marker TEXT,status TEXT,reason TEXT);`);
 for(const file of ['0010_recipe_publication_days.sql','0012_recipe_image_reserve.sql'])db.exec(readFileSync(new URL('../../../migrations/'+file,import.meta.url),'utf8'));
 let clock='2026-09-27T06:00:00Z';
 class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]));}}
 db.function('datetime',{varargs:true},()=>clock.replace('T',' ').slice(0,19));db.function('unixepoch',()=>Date.parse(clock)/1000);
 const emails=[],calls=[];
 const env={DB:{prepare(sql){let values=[];return {bind(...v){values=v;return this;},async first(){return db.prepare(sql).get(...values)??null;},async all(){return {results:db.prepare(sql).all(...values)};},async run(){return {meta:db.prepare(sql).run(...values)};}};}},EMAIL:{async send(mail){emails.push(mail);}}};
 const add=(id,category='morgen',ready=false)=>{db.prepare("INSERT INTO recipes VALUES (?,?,?,?,'[]','cook','2026-01-01','godkendt','mangler',NULL,NULL)").run(id,`recipe-${id}`,`Recipe ${id}`,category);if(ready)approve(id);};
 const approve=id=>{db.prepare("UPDATE recipes SET image_status='klar',image_url='ok.png' WHERE id=?").run(id);db.prepare("INSERT INTO image_reviews(entity_type,entity_id,marker,status) VALUES ('recipe',?,'','godkendt')").run(id);};
 const context={Date:Clock,Intl,crypto:{randomUUID},AbortController,setTimeout:(fn)=>setTimeout(fn,20),clearTimeout,console};
 const api=runInNewContext(`(function(){${source('recipeDay')};return {runRecipeDay,planRecipeDay,danishClock,recipeDay,READY_RECIPE_SQL};})()`,context);
 const reserve=runInNewContext(`(function(){${source('recipeReserve')};return {prepareRecipeReserve,reserveStatus,warnLowRecipeReserve};})()`,{...context,...api,ensureRecipeImage:async()=>{throw Error('Use injected generator');}});
 const generate=async(_env,r)=>{calls.push(r.id);approve(r.id);return {ok:true};};
 return {db,api,reserve,env,add,approve,calls,emails,setTime(t){clock=t;},publish:()=>api.runRecipeDay(env),prepare:(fn=generate)=>reserve.prepareRecipeReserve(env,undefined,fn)};
}
test('ready reserve bypasses failed older rows; at most one publication under overlap',async()=>{
 const f=fixture();f.add(1);f.add(2,'frokost',true);await Promise.all([f.publish(),f.publish()]);await f.publish();assert.equal(f.db.prepare('SELECT id FROM recipes WHERE published_at IS NOT NULL').get().id,2);assert.equal(f.calls.length,0);
});
test('same category is a fallback; another ready category wins',async()=>{
 const f=fixture();f.add(1,'morgen');f.db.exec("UPDATE recipes SET published_at='2026-09-26 06:00:00' WHERE id=1");f.add(2,'morgen',true);f.add(3,'aften',true);await f.publish();assert.equal(f.db.prepare('SELECT published_recipe_id id FROM recipe_publication_days').get().id,3);
 const g=fixture();g.add(1,'morgen');g.db.exec("UPDATE recipes SET published_at='2026-09-26 06:00:00' WHERE id=1");g.add(2,'morgen',true);await g.publish();assert.equal(g.db.prepare('SELECT published_recipe_id id FROM recipe_publication_days').get().id,2);
});
test('a warning does not block a newly approved image later that day',async()=>{
 const f=fixture();f.add(1);f.setTime('2026-09-27T06:15:00Z');await f.publish();await f.publish();assert.equal(f.emails.length,1);f.approve(1);f.setTime('2026-09-27T12:00:00Z');await f.publish();assert(f.db.prepare('SELECT published_at FROM recipes').get().published_at);
});
test('latest rejection excludes an image even when status is ready',async()=>{
 const f=fixture();f.add(1,'morgen',true);f.db.exec("INSERT INTO image_reviews(entity_type,entity_id,marker,status) VALUES ('recipe',1,'','afvist')");await f.publish();assert.equal(f.db.prepare('SELECT published_at FROM recipes').get().published_at,null);
});
test('no publication before eight or on editorial days, Danish DST supported',async()=>{
 const f=fixture();f.add(1,'morgen',true);for(const t of ['2026-09-27T05:59:00Z','2026-09-28T10:00:00Z','2026-10-01T10:00:00Z']){f.setTime(t);await f.publish();}assert.equal(f.db.prepare('SELECT published_at FROM recipes').get().published_at,null);assert.equal(f.api.danishClock(new Date('2026-12-15T07:00:00Z')).minutes,480);
});
test('reserve fills deficient category, reuses ready images and never publishes',async()=>{
 const f=fixture();f.add(1,'morgen',true);f.add(2,'morgen',true);f.add(3,'frokost');await Promise.all([f.prepare(),f.prepare()]);assert.deepEqual(f.calls,[3]);assert.equal(f.db.prepare("SELECT count(*) n FROM recipes WHERE published_at IS NOT NULL").get().n,0);
});
test('two content failures quarantine a recipe; fresh candidates are tried next',async()=>{
 const f=fixture();f.add(1);const reject=async()=>({ok:false,failureKind:'content',error:'Forkert ret'});await f.prepare(reject);assert.equal(f.db.prepare('SELECT status FROM recipe_image_jobs').get().status,'pending');f.setTime('2026-09-27T14:00:00Z');await f.prepare(reject);assert.equal(f.db.prepare('SELECT status FROM recipe_image_jobs').get().status,'review');f.add(2);await f.prepare();assert.deepEqual(f.calls,[2]);
});
test('technical failure backs off, timeout counts and daily budget is bounded',async()=>{
 const f=fixture();f.add(1);await f.prepare(async()=>new Promise(()=>{}));let job=f.db.prepare('SELECT * FROM recipe_image_jobs').get();assert.equal(job.technical_failures,1);assert.equal(job.content_failures,0);await f.prepare();assert.equal(f.calls.length,0);f.setTime('2026-09-27T07:00:00Z');await f.prepare(async()=>({ok:false,failureKind:'technical',error:'Unavailable'}));f.setTime('2026-09-27T08:00:00Z');await f.prepare(async()=>({ok:false,failureKind:'technical',error:'Unavailable'}));assert.equal(f.db.prepare('SELECT status FROM recipe_image_jobs').get().status,'review');f.add(2);f.db.exec('UPDATE recipe_reserve_runs SET attempts=8');await f.prepare();assert.equal(f.calls.length,0);
});
test('interrupted job recovers and low reserve warning is sent once per day',async()=>{
 const f=fixture();f.add(1);f.db.exec("INSERT INTO recipe_image_jobs(recipe_id,status) VALUES(1,'running')");await f.prepare();assert.equal(f.db.prepare('SELECT technical_failures n FROM recipe_image_jobs').get().n,1);await f.reserve.warnLowRecipeReserve(f.env);await f.reserve.warnLowRecipeReserve(f.env);assert.equal(f.emails.length,1);
});

test('two-week coverage needs ten reviewed images and top-up target is twelve',async()=>{
 const f=fixture();
 for(let id=1;id<=9;id++)f.add(id,['morgen','frokost','aften','laekkerier'][(id-1)%4],true);
 let status=await f.reserve.reserveStatus(f.env);
 assert.equal(status.totalReady,9);assert.equal(status.twoWeeksCovered,false);
 f.add(10,'frokost',true);status=await f.reserve.reserveStatus(f.env);
 assert.equal(status.twoWeeksCovered,true);assert.equal(status.categories.reduce((sum,c)=>sum+c.target,0),12);
});
