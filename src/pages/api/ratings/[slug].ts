import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const VOTER_COOKIE = 'kk_rating_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

type RatingSummary = {
  average: number;
  count: number;
  userRating: number | null;
};

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

async function hashVoterId(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function findRecipe(slug: string | undefined) {
  if (!slug) return null;
  return env.DB.prepare(`
    SELECT id FROM recipes
    WHERE slug = ? AND status = 'godkendt'
      AND published_at IS NOT NULL AND published_at <= datetime('now')
  `).bind(slug).first<{ id: number }>();
}

async function getSummary(recipeId: number, voterHash?: string): Promise<RatingSummary> {
  const aggregate = await env.DB.prepare(`
    SELECT COALESCE(ROUND(AVG(rating), 1), 0) AS average, COUNT(*) AS count
    FROM recipe_ratings WHERE recipe_id = ?
  `).bind(recipeId).first<{ average: number; count: number }>();

  const own = voterHash
    ? await env.DB.prepare(`
        SELECT rating FROM recipe_ratings WHERE recipe_id = ? AND voter_hash = ?
      `).bind(recipeId, voterHash).first<{ rating: number }>()
    : null;

  return {
    average: Number(aggregate?.average ?? 0),
    count: Number(aggregate?.count ?? 0),
    userRating: own?.rating ?? null,
  };
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function verifyTurnstile(token: string, request: Request) {
  const requestHostname = new URL(request.url).hostname;
  const isLocal = requestHostname === 'localhost' || requestHostname === '127.0.0.1';
  const secret = isLocal ? TURNSTILE_TEST_SECRET : env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;

  const data = new FormData();
  data.set('secret', secret);
  data.set('response', token);
  data.set('idempotency_key', crypto.randomUUID());

  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) data.set('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: data,
  });
  if (!response.ok) return false;

  const result = await response.json() as {
    success: boolean;
    action?: string;
    hostname?: string;
  };

  if (isLocal) return result.success === true;

  return result.success === true
    && result.action === 'recipe-rating'
    && (!result.hostname || result.hostname === requestHostname);
}

export const GET: APIRoute = async ({ params, cookies }) => {
  const recipe = await findRecipe(params.slug);
  if (!recipe) return json({ error: 'Opskriften findes ikke.' }, 404);

  try {
    const voterId = cookies.get(VOTER_COOKIE)?.value;
    const voterHash = voterId ? await hashVoterId(voterId) : undefined;
    return json(await getSummary(recipe.id, voterHash));
  } catch {
    return json({ average: 0, count: 0, userRating: null });
  }
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  if (!isSameOrigin(request)) {
    return json({ error: 'Ugyldig forespørgsel.' }, 403);
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return json({ error: 'Ugyldigt format.' }, 415);
  }

  let payload: { rating?: unknown; turnstileToken?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Ugyldige data.' }, 400);
  }

  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: 'Vælg mellem 1 og 5 stjerner.' }, 400);
  }

  const recipe = await findRecipe(params.slug);
  if (!recipe) return json({ error: 'Opskriften findes ikke.' }, 404);

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const limit = await env.RATING_RATE_LIMITER.limit({ key: `recipe-rating:${ip}` });
  if (!limit.success) {
    return json({ error: 'For mange forsøg. Vent et øjeblik og prøv igen.' }, 429);
  }

  const token = typeof payload.turnstileToken === 'string' ? payload.turnstileToken : '';
  if (!token || !(await verifyTurnstile(token, request))) {
    return json({ error: 'Sikkerhedstjekket kunne ikke godkendes. Prøv igen.' }, 403);
  }

  let voterId = cookies.get(VOTER_COOKIE)?.value;
  if (!voterId || !/^[0-9a-f-]{36}$/i.test(voterId)) {
    voterId = crypto.randomUUID();
    cookies.set(VOTER_COOKIE, voterId, {
      httpOnly: true,
      secure: new URL(request.url).protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
  }

  const voterHash = await hashVoterId(voterId);

  try {
    await env.DB.prepare(`
      INSERT INTO recipe_ratings (recipe_id, voter_hash, rating)
      VALUES (?, ?, ?)
      ON CONFLICT(recipe_id, voter_hash) DO UPDATE SET
        rating = excluded.rating,
        updated_at = datetime('now')
    `).bind(recipe.id, voterHash, rating).run();

    return json(await getSummary(recipe.id, voterHash));
  } catch {
    return json({ error: 'Din vurdering kunne ikke gemmes lige nu.' }, 503);
  }
};
