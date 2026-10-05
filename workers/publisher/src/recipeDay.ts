import type { Env } from './index';
const categories = ['morgen', 'frokost', 'aften', 'laekkerier'];
export const READY_RECIPE_SQL = `status='godkendt' AND published_at IS NULL AND image_status='klar' AND image_url IS NOT NULL
 AND (SELECT status FROM image_reviews WHERE entity_type='recipe' AND entity_id=recipes.id AND marker='' ORDER BY id DESC LIMIT 1)='godkendt'`;
export function danishClock(now = new Date()) {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Copenhagen',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const get=(name:string)=>parts.find(p=>p.type===name)!.value;
 return {day:`${get('year')}-${get('month')}-${get('day')}`,minutes:Number(get('hour'))*60+Number(get('minute'))};
}
export function recipeDay(day:string){return ![1,4].includes(new Date(`${day}T12:00:00Z`).getUTCDay());}
export function nextDay(day:string){const d=new Date(`${day}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
export function dayBounds(day:string){
 const midnight=new Date(`${day}T00:00:00Z`);
 const offset=Number(new Intl.DateTimeFormat('en',{timeZone:'Europe/Copenhagen',hour:'2-digit',hourCycle:'h23'}).format(midnight));
 return new Date(midnight.getTime()-offset*3600000).toISOString().replace('T',' ').slice(0,19);
}
async function readyCandidates(env:Env){
 const last=await env.DB.prepare('SELECT category FROM recipes WHERE published_at IS NOT NULL ORDER BY published_at DESC,id DESC LIMIT 1').first<{category:string}>();
 const start=last?categories.indexOf(last.category):-1;
 // The previous category is last, not excluded. Only reviewed images qualify.
 const order=categories.map((_,i)=>categories[(start+i+1)%4]);
 const {results}=await env.DB.prepare(`SELECT id,category FROM recipes WHERE ${READY_RECIPE_SQL} ORDER BY created_at,id`).all<{id:number;category:string}>();
 return results.sort((a,b)=>order.indexOf(a.category)-order.indexOf(b.category));
}
export async function planRecipeDay(env:Env,day:string){
 if(!recipeDay(day))return;
 const candidates=await readyCandidates(env);
 await env.DB.prepare('INSERT OR IGNORE INTO recipe_publication_days(day,planned_recipe_id) VALUES (?,?)').bind(day,candidates[0]?.id??null).run();
}
export async function runRecipeDay(env:Env,now=new Date()){
 const {day,minutes}=danishClock(now);
 // Publication never calls image generation. Check again after warnings until midnight.
 if(!recipeDay(day)||minutes<480)return;
 await planRecipeDay(env,day);
 const token=crypto.randomUUID();
 const claim=await env.DB.prepare('UPDATE recipe_publication_days SET lock_token=?,lock_until=unixepoch()+600 WHERE day=? AND lock_until<unixepoch()').bind(token,day).run();
 if(!claim.meta.changes)return;
 try{
  const bounds=[dayBounds(day),dayBounds(nextDay(day))];
  let published=await env.DB.prepare('SELECT id FROM recipes WHERE published_at>=? AND published_at<? LIMIT 1').bind(...bounds).first<{id:number}>();
  if(!published){
   const candidate=(await readyCandidates(env))[0];
   await env.DB.prepare('UPDATE recipe_publication_days SET ready_recipe_id=? WHERE day=? AND lock_token=?').bind(candidate?.id??null,day,token).run();
   if(candidate&&danishClock().day===day&&danishClock().minutes>=480){
    await env.DB.prepare(`UPDATE recipes SET published_at=datetime('now') WHERE id=? AND ${READY_RECIPE_SQL}
      AND NOT EXISTS(SELECT 1 FROM recipes WHERE published_at>=? AND published_at<?)
      AND EXISTS(SELECT 1 FROM recipe_publication_days WHERE day=? AND lock_token=? AND lock_until>unixepoch())`).bind(candidate.id,...bounds,day,token).run();
   }
   published=await env.DB.prepare('SELECT id FROM recipes WHERE published_at>=? AND published_at<? LIMIT 1').bind(...bounds).first<{id:number}>();
  }
  if(published)await env.DB.prepare('UPDATE recipe_publication_days SET published_recipe_id=?,last_error=NULL WHERE day=?').bind(published.id,day).run();
  else if(minutes>=495)await alertOnce(env,day,token,'Ingen upubliceret opskrift har et godkendt billede. Reserveopbygningen kører separat. Udgivelsen forsøges igen, når en godkendt reserve bliver klar.');
 }catch(error){
  await env.DB.prepare('UPDATE recipe_publication_days SET last_error=? WHERE day=?').bind(String(error),day).run();console.error(error);
 }finally{await env.DB.prepare('UPDATE recipe_publication_days SET lock_until=0,lock_token=NULL WHERE day=? AND lock_token=?').bind(day,token).run();}
}
async function alertOnce(env:Env,day:string,token:string,reason:string){
 if(!env.EMAIL||danishClock().day!==day)return;
 const claim=await env.DB.prepare(`UPDATE recipe_publication_days SET alert_claimed_at=datetime('now') WHERE day=? AND lock_token=? AND alert_claimed_at IS NULL`).bind(day,token).run();
 if(!claim.meta.changes)return;
 await env.EMAIL.send({from:'hej@ketoklar.dk',to:'ketoklar@saxgruppen.dk',replyTo:'hej@ketoklar.dk',subject:`[Ketoklar] Opskriftsreserven er tom ${day}`,text:reason});
 await env.DB.prepare("UPDATE recipe_publication_days SET alert_sent_at=datetime('now') WHERE day=?").bind(day).run();
}
