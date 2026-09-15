import { ensureRecipeImage } from './generateImage';
import type { Env } from './index';

const categories = ['morgen', 'frokost', 'aften', 'laekkerier'];
type Recipe = { id: number; slug: string; title: string; category: 'morgen' | 'frokost' | 'aften' | 'laekkerier'; ingredients_json: string; instructions: string };
type Day = { day: string; planned_recipe_id: number | null; ready_recipe_id: number | null; published_recipe_id: number | null; alert_claimed_at: string | null };
export function danishClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (name: string) => parts.find(p => p.type === name)!.value;
  const day = `${get('year')}-${get('month')}-${get('day')}`;
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}
export function recipeDay(day: string) { return ![1, 4].includes(new Date(`${day}T12:00:00Z`).getUTCDay()); }
export function nextDay(day: string) { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); }
function dayBounds(day: string) {
  // Local midnight is 22/23 UTC on the preceding date. Resolve offset via Intl.
  const midnightUtc = new Date(`${day}T00:00:00Z`);
  const offset = Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Copenhagen', hour: '2-digit', hourCycle: 'h23' }).format(midnightUtc));
  return new Date(Date.parse(`${day}T00:00:00Z`) - offset * 3600000).toISOString().replace('T', ' ').slice(0, 19);
}
export async function runRecipeDay(env: Env, now = new Date(), generate = ensureRecipeImage) {
  const { day, minutes } = danishClock(now);
  if (!recipeDay(day) || minutes < 420 || minutes >= 600) return;
  await planRecipeDay(env, day);
  const token = crypto.randomUUID();
  const claim = await env.DB.prepare(`UPDATE recipe_publication_days SET lock_token=?, lock_until=unixepoch()+600 WHERE day=? AND lock_until < unixepoch()`).bind(token, day).run();
  if (!claim.meta.changes) return;
  try {
    let state = await env.DB.prepare('SELECT * FROM recipe_publication_days WHERE day=?').bind(day).first<Day>();
    if (!state || state.published_recipe_id) return;
    const existing = await env.DB.prepare('SELECT id FROM recipes WHERE published_at >= ? AND published_at < ? LIMIT 1').bind(dayBounds(day), dayBounds(nextDay(day))).first<{ id: number }>();
    if (existing) {
      await env.DB.prepare('UPDATE recipe_publication_days SET published_recipe_id=? WHERE day=?').bind(existing.id, day).run();
      return;
    }
    // A terminated run consumes its reserved attempt, but must never block the next candidate.
    await env.DB.prepare("UPDATE recipe_publication_attempts SET status='failed', error='Kørslen blev afbrudt eller overskred tidsgrænsen.' WHERE day=? AND status='running'").bind(day).run();
    if (state.alert_claimed_at && !state.ready_recipe_id) return;
    if (!state.ready_recipe_id) {
      const recovered = await env.DB.prepare(`SELECT r.id FROM recipe_publication_attempts a JOIN recipes r ON r.id=a.recipe_id
        WHERE a.day=? AND r.status='godkendt' AND r.published_at IS NULL AND r.image_status='klar' AND r.image_url IS NOT NULL
        AND (SELECT status FROM image_reviews WHERE entity_type='recipe' AND entity_id=r.id AND marker='' ORDER BY id DESC LIMIT 1)='godkendt' LIMIT 1`).bind(day).first<{id: number}>();
      if (recovered) {
        state.ready_recipe_id = recovered.id;
        await env.DB.prepare('UPDATE recipe_publication_days SET ready_recipe_id=? WHERE day=? AND lock_token=?').bind(recovered.id, day, token).run();
      }
    }
    let candidates = await orderedCandidates(env, state.planned_recipe_id);
    for (const recipe of candidates) {
      if (state.ready_recipe_id) break;
      const used = await env.DB.prepare('SELECT COUNT(*) AS n FROM recipe_publication_attempts WHERE day=?').bind(day).first<{ n: number }>();
      if ((used?.n ?? 0) >= 3) break;
      const attempt = await env.DB.prepare("INSERT OR IGNORE INTO recipe_publication_attempts(day,recipe_id,status) VALUES (?,?,'running')").bind(day, recipe.id).run();
      if (!attempt.meta.changes) continue;
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          generate(env, recipe, false, { maxAttempts: 1, signal: controller.signal }),
          new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Billedforsøget overskred 90 sekunder.')); }, 90000); }),
        ]);
        await env.DB.prepare('UPDATE recipe_publication_attempts SET status=?,error=? WHERE day=? AND recipe_id=?').bind(result.ok ? 'approved' : 'failed', result.error ?? null, day, recipe.id).run();
        if (result.ok) {
          await env.DB.prepare('UPDATE recipe_publication_days SET ready_recipe_id=? WHERE day=? AND lock_token=?').bind(recipe.id, day, token).run();
          state.ready_recipe_id = recipe.id;
        }
      } catch (error) {
        await env.DB.prepare("UPDATE recipe_publication_attempts SET status='failed',error=? WHERE day=? AND recipe_id=?").bind(String(error), day, recipe.id).run();
      } finally { clearTimeout(timer); controller.abort(); }
    }
    if (state.ready_recipe_id && danishClock().day === day && danishClock().minutes >= 480) {
      // One atomic UPDATE prevents two concurrent callers publishing different recipes.
      await env.DB.prepare(`UPDATE recipes SET published_at=datetime('now') WHERE id=? AND status='godkendt' AND published_at IS NULL
        AND image_status='klar' AND image_url IS NOT NULL
        AND (SELECT status FROM image_reviews WHERE entity_type='recipe' AND entity_id=recipes.id AND marker='' ORDER BY id DESC LIMIT 1)='godkendt'
        AND NOT EXISTS(SELECT 1 FROM recipes WHERE published_at >= ? AND published_at < ?)
        AND EXISTS(SELECT 1 FROM recipe_publication_days WHERE day=? AND lock_token=? AND lock_until>unixepoch())`).bind(state.ready_recipe_id, dayBounds(day), dayBounds(nextDay(day)), day, token).run();
    }
    const published = await env.DB.prepare('SELECT id FROM recipes WHERE published_at >= ? AND published_at < ? LIMIT 1').bind(dayBounds(day), dayBounds(nextDay(day))).first<{id: number}>();
    if (published) {
      await env.DB.prepare('UPDATE recipe_publication_days SET published_recipe_id=? WHERE day=?').bind(published.id, day).run();
    } else if (!state.ready_recipe_id || minutes >= 495) {
      await alertOnce(env, day, token, state.ready_recipe_id ? 'Opskriften har et godkendt billede, men publiceringen lykkedes ikke.' : 'Ingen af dagens højst tre opskriftsforsøg kunne klargøres.');
    }
  } catch (error) {
    await env.DB.prepare('UPDATE recipe_publication_days SET last_error=? WHERE day=?').bind(String(error), day).run();
    if (minutes >= 495) await alertOnce(env, day, token, `Udgivelsen kunne ikke gennemføres: ${String(error)}`);
    console.error(error);
  } finally {
    await env.DB.prepare('UPDATE recipe_publication_days SET lock_until=0,lock_token=NULL WHERE day=? AND lock_token=?').bind(day, token).run();
  }
}
async function orderedCandidates(env: Env, planned: number | null) {
  const last = await env.DB.prepare('SELECT category FROM recipes WHERE published_at IS NOT NULL ORDER BY published_at DESC,id DESC LIMIT 1').first<{category: string}>();
  const start = last ? categories.indexOf(last.category) : -1;
  const order = categories.map((_, i) => categories[(start + i + 1) % 4]).filter(c => c !== last?.category);
  const { results } = await env.DB.prepare("SELECT id,slug,title,category,ingredients_json,instructions FROM recipes WHERE status='godkendt' AND published_at IS NULL ORDER BY created_at,id").all<Recipe>();
  return results.filter(r => order.includes(r.category)).sort((a, b) => (a.id === planned ? -1 : b.id === planned ? 1 : order.indexOf(a.category) - order.indexOf(b.category)));
}
export async function planRecipeDay(env: Env, day: string) {
  if (!recipeDay(day)) return;
  const candidates = await orderedCandidates(env, null);
  await env.DB.prepare('INSERT OR IGNORE INTO recipe_publication_days(day,planned_recipe_id) VALUES (?,?)').bind(day, candidates[0]?.id ?? null).run();
}
async function alertOnce(env: Env, day: string, token: string, reason: string) {
  if (!env.EMAIL || danishClock().day !== day) return;
  const claimed = await env.DB.prepare(`UPDATE recipe_publication_days SET alert_claimed_at=datetime('now') WHERE day=? AND lock_token=? AND alert_claimed_at IS NULL
    AND NOT EXISTS(SELECT 1 FROM recipes WHERE published_at >= ? AND published_at < ?)`).bind(day, token, dayBounds(day), dayBounds(nextDay(day))).run();
  if (!claimed.meta.changes) return;
  const { results } = await env.DB.prepare('SELECT r.title,a.error FROM recipe_publication_attempts a JOIN recipes r ON r.id=a.recipe_id WHERE a.day=? ORDER BY a.started_at,r.id').bind(day).all<{title: string; error: string | null}>();
  // Claim before sending: an ambiguous provider timeout must not produce duplicate mail.
  await env.EMAIL.send({ from: 'hej@ketoklar.dk', to: 'ketoklar@saxgruppen.dk', replyTo: 'hej@ketoklar.dk', subject: `[Ketoklar] Dagens opskrift kunne ikke udgives ${day}`, text: `${reason}\n\n${results.map(r => `${r.title}: ${r.error ?? 'Billede godkendt'}`).join('\n')}\n\nKontrollér fejlene. Motoren stopper dagens billedforsøg og prøver igen på næste opskriftsdag. Der er ikke sendt en reserveadvarsel.` });
  await env.DB.prepare("UPDATE recipe_publication_days SET alert_sent_at=datetime('now') WHERE day=?").bind(day).run();
}
