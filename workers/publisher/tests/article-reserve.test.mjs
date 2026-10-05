import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/articleReserve.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE articles(id INTEGER PRIMARY KEY,slug TEXT,title TEXT,category TEXT,excerpt TEXT,body TEXT,created_at TEXT DEFAULT '2026-01-01',status TEXT DEFAULT 'godkendt',published_at TEXT,image_status TEXT DEFAULT 'mangler',image_url TEXT);
 CREATE TABLE article_images(id INTEGER PRIMARY KEY,article_id INTEGER,marker TEXT,prompt TEXT,image_status TEXT,image_url TEXT);
 CREATE TABLE image_reviews(id INTEGER PRIMARY KEY,entity_type TEXT,entity_id INTEGER,marker TEXT DEFAULT '',status TEXT,reason TEXT);`);
 db.exec(readFileSync(new URL('../../../migrations/0013_article_image_reserve.sql',import.meta.url),'utf8'));
 let seconds=1790575200;db.function('unixepoch',()=>seconds);
 const calls=[],emails=[];
 const env={DB:{prepare(sql){let args=[];return{bind(...a){args=a;return this;},async first(){return db.prepare(sql).get(...args);},async all(){return{results:db.prepare(sql).all(...args)};},async run(){return{meta:db.prepare(sql).run(...args)};}};}},EMAIL:{async send(mail){emails.push(mail);}}};
 let outcome={ok:true};
 const review=(id,type='article',status='godkendt',marker='')=>db.prepare('INSERT INTO image_reviews(entity_type,entity_id,marker,status) VALUES(?,?,?,?)').run(type,id,marker,status);
 const approve=id=>{db.prepare("UPDATE articles SET image_status='klar',image_url='image.png' WHERE id=?").run(id);review(id);};
 const api=runInNewContext(stripTypeScriptTypes(source)+'\n({articleImageReadiness,articleReserveStatus,prepareArticleReserve,warnLowArticleReserve})',{
  crypto,AbortController,clearTimeout,setTimeout:fn=>setTimeout(fn,20),danishClock:()=>({day:'2026-09-28'}),
  async ensureArticleImage(_env,a,_force,control){assert.equal(control.maxAttempts,1);calls.push(['hero',a.id]);if(outcome.ok)approve(a.id);return outcome;},
  async ensureArticleBodyImages(_env,a,_force,control){assert.equal(control.maxAttempts,1);calls.push(['body',a.id,control.marker]);if(outcome.ok){db.prepare("INSERT INTO article_images(article_id,marker,prompt,image_status,image_url) VALUES(?,?,?,'klar','body.png')").run(a.id,control.marker,'concept');review(Number(db.prepare('SELECT last_insert_rowid() id').get().id),'article_body','godkendt',control.marker);}return[outcome];}
 });
 const add=(id,category='livsstil',body='text')=>{db.prepare('INSERT INTO articles(id,slug,title,category,body) VALUES(?,?,?,?,?)').run(id,`a-${id}`,`Article ${id}`,category,body);return {id,body};};
 return{db,env,api,add,approve,review,calls,emails,setOutcome:o=>outcome=o,advance:n=>seconds+=n};
}
test('readiness requires latest hero and every current body marker, including missing rows',async()=>{
 const f=fixture(),a=f.add(1,'livsstil','[[image:detail|concept]]');f.approve(1);
 assert.equal((await f.api.articleImageReadiness(f.env,a)).ready,false);
 await f.api.prepareArticleReserve(f.env);assert.deepEqual(f.calls,[['body',1,'detail']]);
 assert.equal((await f.api.articleImageReadiness(f.env,a)).ready,true);
 assert.equal((await f.api.articleImageReadiness(f.env,{...a,body:'[[image:detail|changed]]'})).ready,false);
 f.review(1,'article_body','afvist','detail');assert.equal((await f.api.articleImageReadiness(f.env,a)).ready,false);
 f.review(1,'article','afvist');assert.equal((await f.api.articleImageReadiness(f.env,a)).heroReady,false);
});
test('one image per run; hero then body, no publication and overlap excluded',async()=>{
 const f=fixture();f.add(1,'livsstil','[[image:detail|concept]]');
 await Promise.all([f.api.prepareArticleReserve(f.env),f.api.prepareArticleReserve(f.env)]);
 assert.deepEqual(f.calls,[['hero',1]]);
 await f.api.prepareArticleReserve(f.env);assert.deepEqual(f.calls,[['hero',1],['body',1,'detail']]);
 assert.equal(f.db.prepare('SELECT published_at FROM articles').get().published_at,null);
});
test('content failures back off and quarantine, daily cap is persistent',async()=>{
 const f=fixture();f.add(1);f.setOutcome({ok:false,failureKind:'content',error:'Wrong image'});
 await f.api.prepareArticleReserve(f.env);await f.api.prepareArticleReserve(f.env);assert.equal(f.calls.length,1);
 f.advance(28800);await f.api.prepareArticleReserve(f.env);assert.equal(f.db.prepare('SELECT status FROM article_image_jobs').get().status,'review');
 f.add(2);f.db.exec('UPDATE article_reserve_runs SET attempts=8');await f.api.prepareArticleReserve(f.env);assert.equal(f.calls.length,2);
});
test('technical errors have a separate budget, stale jobs count as interrupted attempts',async()=>{
 const f=fixture();f.add(1);f.db.exec("INSERT INTO article_image_jobs(article_id,status) VALUES(1,'running')");
 await f.api.prepareArticleReserve(f.env);assert.equal(f.calls.length,0);
 f.setOutcome({ok:false,failureKind:'technical',error:'Service unavailable'});
 for(let i=0;i<2;i++){f.advance(3600);await f.api.prepareArticleReserve(f.env);}
 const row=f.db.prepare('SELECT * FROM article_image_jobs').get();assert.equal(row.status,'review');assert.equal(row.technical_failures,3);assert.equal(row.content_failures,0);
});
test('tracks have independent two-week targets and one daily low reserve alert',async()=>{
 const f=fixture();for(let id=1;id<=2;id++){f.add(id,'anekdote');f.approve(id);}f.add(3);
 const state=await f.api.articleReserveStatus(f.env);assert.equal(state.tracks[0].ready,0);assert.equal(state.tracks[1].ready,2);
 await f.api.warnLowArticleReserve(f.env);await f.api.warnLowArticleReserve(f.env);assert.equal(f.emails.length,1);
});
