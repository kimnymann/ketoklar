import type { Env } from './index';
import { ensureRecipeImage, type ImageOutcome } from './generateImage';
import { danishClock, READY_RECIPE_SQL } from './recipeDay';
const categories=['morgen','frokost','aften','laekkerier'];
const DAILY_LIMIT=8;
const TARGET_PER_CATEGORY=3;
const TWO_WEEK_RECIPE_COUNT=10; // Five recipe publication days per week.
type Candidate={id:number;slug:string;title:string;category:'morgen'|'frokost'|'aften'|'laekkerier';ingredients_json:string;instructions:string};
export async function reserveStatus(env:Env){
 const {results}=await env.DB.prepare(`SELECT category,COUNT(*) AS n FROM recipes WHERE ${READY_RECIPE_SQL} GROUP BY category`).all<{category:string;n:number}>();
 const review=await env.DB.prepare("SELECT COUNT(*) AS n FROM recipe_image_jobs j JOIN recipes r ON r.id=j.recipe_id WHERE j.status='review' AND r.published_at IS NULL AND r.image_status!='klar'").first<{n:number}>();
 const totalReady=results.reduce((sum,row)=>sum+row.n,0);
 return {categories:categories.map(category=>({category,ready:results.find(r=>r.category===category)?.n??0,target:TARGET_PER_CATEGORY})),totalReady,twoWeeksCovered:totalReady>=TWO_WEEK_RECIPE_COUNT,minimumForTwoWeeks:TWO_WEEK_RECIPE_COUNT,needsReview:review?.n??0};
}
async function failJob(env:Env,id:number,technical:boolean,error:string){
 const field=technical?'technical_failures':'content_failures';
 const limit=technical?3:2;
 const delay=technical?3600:28800;
 await env.DB.prepare(`UPDATE recipe_image_jobs SET ${field}=${field}+1,status=CASE WHEN ${field}+1>=? THEN 'review' ELSE 'pending' END,next_attempt_at=unixepoch()+?,last_error=?,updated_at=datetime('now') WHERE recipe_id=?`).bind(limit,delay,error,id).run();
 await env.DB.prepare("UPDATE recipes SET image_status='fejlet' WHERE id=? AND image_status!='klar'").bind(id).run();
}
export async function prepareRecipeReserve(env:Env,now=new Date(),generate=ensureRecipeImage){
 const {day}=danishClock(now);const token=crypto.randomUUID();
 await env.DB.prepare('INSERT OR IGNORE INTO recipe_reserve_runs(day) VALUES (?)').bind(day).run();
 // A global lease also prevents overlap across midnight. Charge the daily budget before calling AI.
 const claim=await env.DB.prepare(`UPDATE recipe_reserve_runs SET lock_token=?,lock_until=unixepoch()+300 WHERE day=? AND attempts<?
 AND NOT EXISTS(SELECT 1 FROM recipe_reserve_runs WHERE lock_until>unixepoch())`).bind(token,day,DAILY_LIMIT).run();
 if(!claim.meta.changes)return {skipped:'busy-or-daily-limit'};
 try{
  // Recover interrupted generations; each interruption counts as a technical failure.
  const stale=await env.DB.prepare("SELECT recipe_id FROM recipe_image_jobs WHERE status='running'").all<{recipe_id:number}>();
  for(const row of stale.results)await failJob(env,row.recipe_id,true,'Forrige billedkørsel blev afbrudt.');
  const status=await reserveStatus(env);
  const deficits=status.categories.filter(c=>c.ready<c.target).sort((a,b)=>a.ready-b.ready);
  if(!deficits.length)return {complete:true,status};
  const {results}=await env.DB.prepare(`SELECT r.id,r.slug,r.title,r.category,r.ingredients_json,r.instructions FROM recipes r
   LEFT JOIN recipe_image_jobs j ON j.recipe_id=r.id
   WHERE r.status='godkendt' AND r.published_at IS NULL
   AND NOT (r.image_status='klar' AND r.image_url IS NOT NULL AND COALESCE((SELECT status FROM image_reviews WHERE entity_type='recipe' AND entity_id=r.id AND marker='' ORDER BY id DESC LIMIT 1),'')='godkendt')
   AND (j.recipe_id IS NULL OR (j.status='pending' AND j.next_attempt_at<=unixepoch()))
   ORDER BY COALESCE(j.content_failures+j.technical_failures,0),r.created_at,r.id`).all<Candidate>();
  const recipe=deficits.flatMap(c=>results.filter(r=>r.category===c.category))[0];
  if(!recipe)return {skipped:'no-eligible-candidates',status};
  await env.DB.prepare("INSERT INTO recipe_image_jobs(recipe_id,status) VALUES (?,'running') ON CONFLICT(recipe_id) DO UPDATE SET status='running',updated_at=datetime('now')").bind(recipe.id).run();
  await env.DB.prepare('UPDATE recipe_reserve_runs SET attempts=attempts+1 WHERE day=? AND lock_token=?').bind(day,token).run();
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  let result:ImageOutcome;
  try{
   result=await Promise.race([generate(env,recipe,false,{maxAttempts:1,signal:controller.signal}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Billedforsøget overskred 120 sekunder.'));},120000);})]);
  }catch(error){result={ok:false,error:String(error),failureKind:'technical'};}
  finally{clearTimeout(timer);controller.abort();}
  if(result.ok){
   const ready=await env.DB.prepare(`SELECT id FROM recipes WHERE id=? AND ${READY_RECIPE_SQL}`).bind(recipe.id).first();
   if(!ready)result={ok:false,error:'Billedkontrollen har ikke gemt en godkendelse.',failureKind:'technical'};
  }
  if(result.ok)await env.DB.prepare("UPDATE recipe_image_jobs SET status='ready',last_error=NULL,updated_at=datetime('now') WHERE recipe_id=?").bind(recipe.id).run();
  else await failJob(env,recipe.id,result.failureKind!=='content',result.error??'Ukendt billedfejl');
  return {slug:recipe.slug,ok:result.ok,error:result.error,status:await reserveStatus(env)};
 }finally{await env.DB.prepare('UPDATE recipe_reserve_runs SET lock_until=0,lock_token=NULL WHERE day=? AND lock_token=?').bind(day,token).run();}
}
export async function warnLowRecipeReserve(env:Env,now=new Date()){
 if(!env.EMAIL)return;
 const {day}=danishClock(now);const status=await reserveStatus(env);
 if(status.categories.every(c=>c.ready>=c.target))return;
 await env.DB.prepare('INSERT OR IGNORE INTO recipe_reserve_runs(day) VALUES (?)').bind(day).run();
 const claim=await env.DB.prepare("UPDATE recipe_reserve_runs SET alert_claimed_at=datetime('now') WHERE day=? AND alert_claimed_at IS NULL").bind(day).run();
 if(!claim.meta.changes)return;
 await env.EMAIL.send({from:'hej@ketoklar.dk',to:'ketoklar@saxgruppen.dk',replyTo:'hej@ketoklar.dk',subject:`[Ketoklar] Billedreserve under mål ${day}`,text:`Målet er ${TARGET_PER_CATEGORY} billedgodkendte opskrifter i hver kategori. Mindst ${TWO_WEEK_RECIPE_COUNT} i alt dækker to ugers udgivelser. Der er ${status.totalReady} klar.\n\n${status.categories.map(c=>`${c.category}: ${c.ready} klar / mål ${c.target}`).join('\n')}\n\n${status.needsReview} opskrifter kræver særskilt billedgennemgang. Automatiske forsøg er begrænset til otte pr. dag. Godkendte reserver kan stadig udgives; samme kategori bruges kun som nødløsning.`});
}
