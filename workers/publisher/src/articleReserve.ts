import type { Env } from './index';
import { danishClock } from './recipeDay';
import { ensureArticleImage, ensureArticleBodyImages, type ImageOutcome } from './generateImage';
import type { ArticleForPrompt } from './imagePrompt';

type Article = ArticleForPrompt & { id:number; image_status?:string; image_url?:string; hero_review?:string };
export async function articleImageReadiness(env:Env, article:Article) {
 const hero=await env.DB.prepare(`SELECT image_status,image_url,
 (SELECT status FROM image_reviews WHERE entity_type='article' AND entity_id=articles.id AND marker='' ORDER BY id DESC LIMIT 1) AS review
 FROM articles WHERE id=?`).bind(article.id).first<{image_status:string;image_url:string;review:string}>();
 const heroReady=hero?.image_status==='klar' && !!hero.image_url && hero.review==='godkendt';
 const {results}=await env.DB.prepare(`SELECT marker,prompt,image_status,image_url,
 (SELECT status FROM image_reviews WHERE entity_type='article_body' AND entity_id=article_images.id AND marker=article_images.marker ORDER BY id DESC LIMIT 1) AS review
 FROM article_images WHERE article_id=?`).bind(article.id).all<{marker:string;prompt:string;image_status:string;image_url:string;review:string}>();
 const missing=[...article.body.matchAll(/\[\[image:([a-z0-9-]+)\|([^\]]+)\]\]/g)].filter(([,marker,prompt])=>!results.some(r=>r.marker===marker && r.prompt===prompt.trim() && r.image_status==='klar' && !!r.image_url && r.review==='godkendt')).map(m=>m[1]);
 return {ready:heroReady && missing.length===0,heroReady,missing};
}
export async function articleReserveStatus(env:Env){
 const {results}=await env.DB.prepare("SELECT id,slug,title,category,excerpt,body FROM articles WHERE status='godkendt' AND published_at IS NULL ORDER BY created_at,id").all<Article>();
 const rows: (Article & Awaited<ReturnType<typeof articleImageReadiness>>)[]=[];
 for(const article of results)rows.push({...article,...await articleImageReadiness(env,article)});
 const tracks=['article','anecdote'].map(track=>({track,target:2,ready:rows.filter(r=>r.ready && (r.category==='anekdote')===(track==='anecdote')).length}));
 return {tracks,rows};
}
async function fail(env:Env,id:number,technical:boolean,error:string){
 const field=technical?'technical_failures':'content_failures';
 await env.DB.prepare(`UPDATE article_image_jobs SET ${field}=${field}+1,status=CASE WHEN ${field}+1>=? THEN 'review' ELSE 'pending' END,next_attempt_at=unixepoch()+?,last_error=?,updated_at=datetime('now') WHERE article_id=?`).bind(technical?3:2,technical?3600:28800,error,id).run();
}
export async function prepareArticleReserve(env:Env,now=new Date()){
 const {day}=danishClock(now),token=crypto.randomUUID();
 await env.DB.prepare('INSERT OR IGNORE INTO article_reserve_runs(day) VALUES (?)').bind(day).run();
 const claim=await env.DB.prepare(`UPDATE article_reserve_runs SET lock_token=?,lock_until=unixepoch()+300 WHERE day=? AND attempts<8 AND NOT EXISTS(SELECT 1 FROM article_reserve_runs WHERE lock_until>unixepoch())`).bind(token,day).run();
 if(!claim.meta.changes)return {skipped:'busy-or-daily-limit'};
 try{
  const stale=await env.DB.prepare("SELECT article_id FROM article_image_jobs WHERE status='running'").all<{article_id:number}>();
  for(const row of stale.results)await fail(env,row.article_id,true,'Forrige billedkørsel blev afbrudt.');
  const state=await articleReserveStatus(env);
  const {results:eligible}=await env.DB.prepare(`SELECT a.id FROM articles a LEFT JOIN article_image_jobs j ON j.article_id=a.id WHERE j.article_id IS NULL OR (j.status IN ('pending','ready') AND j.next_attempt_at<=unixepoch()) ORDER BY COALESCE(j.content_failures+j.technical_failures,0),a.created_at,a.id`).all<{id:number}>();
  const deficit=state.tracks.filter(t=>t.ready<t.target).sort((a,b)=>a.ready-b.ready);
  const article=deficit.flatMap(t=>eligible.map(e=>state.rows.find(r=>r.id===e.id && !r.ready && (r.category==='anekdote')===(t.track==='anecdote'))).filter(Boolean))[0];
  if(!article)return {skipped:'no-eligible-candidates',tracks:state.tracks};
  await env.DB.prepare("INSERT INTO article_image_jobs(article_id,status) VALUES (?,'running') ON CONFLICT(article_id) DO UPDATE SET status='running',updated_at=datetime('now')").bind(article.id).run();
  await env.DB.prepare('UPDATE article_reserve_runs SET attempts=attempts+1 WHERE day=? AND lock_token=?').bind(day,token).run();
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const control={maxAttempts:1,signal:controller.signal};
  let result:ImageOutcome;
  try{
   const generate=article.heroReady
    ? ensureArticleBodyImages(env,article,true,{...control,marker:article.missing[0]}).then(rows=>rows[0]??{ok:false,error:'Missing body image result',failureKind:'technical' as const})
    : ensureArticleImage(env,article,false,control);
   result=await Promise.race([generate,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Billedforsøget overskred 120 sekunder.'));},120000);})]);
  }catch(error){result={ok:false,error:String(error),failureKind:'technical'};}
  finally{clearTimeout(timer);controller.abort();}
  if(result.ok){
   const readiness=await articleImageReadiness(env,article);
   await env.DB.prepare("UPDATE article_image_jobs SET status=?,next_attempt_at=0,last_error=NULL,updated_at=datetime('now') WHERE article_id=?").bind(readiness.ready?'ready':'pending',article.id).run();
  }else await fail(env,article.id,result.failureKind!=='content',result.error??'Ukendt billedfejl');
  return {slug:article.slug,...result};
 }finally{await env.DB.prepare('UPDATE article_reserve_runs SET lock_token=NULL,lock_until=0 WHERE day=? AND lock_token=?').bind(day,token).run();}
}
export async function warnLowArticleReserve(env:Env){
 if(!env.EMAIL)return;
 const {day}=danishClock(),state=await articleReserveStatus(env);
 if(state.tracks.every(t=>t.ready>=t.target))return;
 await env.DB.prepare('INSERT OR IGNORE INTO article_reserve_runs(day) VALUES (?)').bind(day).run();
 const claim=await env.DB.prepare("UPDATE article_reserve_runs SET alert_claimed_at=datetime('now') WHERE day=? AND alert_claimed_at IS NULL").bind(day).run();
 if(!claim.meta.changes)return;
 await env.EMAIL.send({from:'hej@ketoklar.dk',to:'ketoklar@saxgruppen.dk',replyTo:'hej@ketoklar.dk',subject:`[Ketoklar] Artikelreserve under mål ${day}`,text:`Målet er to helt billedklare artikler og to anekdoter.\n${state.tracks.map(t=>`${t.track}: ${t.ready} klar / mål ${t.target}`).join('\n')}\nBåde hovedbillede og billeder i teksten skal være godkendt. Gentagne fejl kræver redaktionel gennemgang; udgivelsen bruger kun færdige reserver.`});
}
