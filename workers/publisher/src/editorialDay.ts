import { danishClock } from './recipeDay';
import type { Env } from './index';

export function editorialWindow(now: Date) {
  const clock = danishClock(now);
  const weekday = new Date(`${clock.day}T12:00:00Z`).getUTCDay();
  return [1, 4].includes(weekday) && clock.minutes >= 480
    ? clock.day : null;
}

// Publication reads ready images only and retries through the day. Image
// generation has its own bounded budget in articleReserve.
export async function runEditorialDay(env: Env, publish: () => Promise<any>, now = new Date()) {
  const day = editorialWindow(now);
  if (!day) return;
  await env.DB.prepare('INSERT OR IGNORE INTO editorial_publication_days (day) VALUES (?)').bind(day).run();
  const token = crypto.randomUUID();
  const claim = await env.DB.prepare(`UPDATE editorial_publication_days
    SET attempts=attempts+1, lock_token=?, lock_until=unixepoch()+900
    WHERE day=? AND completed_at IS NULL AND lock_until<unixepoch()`)
    .bind(token, day).run();
  if (!claim.meta.changes) return;
  try {
    const result = await publish();
    const track = new Date(`${day}T12:00:00Z`).getUTCDay() === 1 ? result.articles : result.anecdotes;
    const complete = track.published.length > 0 || track.warning?.includes('allerede udgivet');
    await env.DB.prepare(`UPDATE editorial_publication_days
      SET completed_at=CASE WHEN ? THEN datetime('now') ELSE NULL END, last_error=?
      WHERE day=? AND lock_token=?`)
      .bind(complete ? 1 : 0, complete ? null : JSON.stringify(track), day, token).run();
  } catch (error) {
    await env.DB.prepare('UPDATE editorial_publication_days SET last_error=? WHERE day=? AND lock_token=?')
      .bind(String(error), day, token).run();
    console.error(JSON.stringify({ editorialRetry: { day, error: String(error) } }));
  } finally {
    await env.DB.prepare('UPDATE editorial_publication_days SET lock_until=0, lock_token=NULL WHERE day=? AND lock_token=?')
      .bind(day, token).run();
  }
}
