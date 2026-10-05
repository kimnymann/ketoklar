import { handleTestImages, type ImageEnv } from './testImages';
import { danishClock, dayBounds, nextDay, planRecipeDay, runRecipeDay } from './recipeDay';
import { runEditorialDay } from './editorialDay';
import { prepareRecipeReserve, reserveStatus, warnLowRecipeReserve } from './recipeReserve';
import { articleImageReadiness, articleReserveStatus, prepareArticleReserve, warnLowArticleReserve } from './articleReserve';
import { anonymizeExpiredRatings } from '../../../src/lib/ratingRetention';
import { ensureRecipeImage, ensureArticleImage, ensureArticleBodyImages } from './generateImage';

export interface Env extends ImageEnv {
  DB: D1Database;
  EMAIL?: SendEmail;
  PUBLISH_SECRET?: string;
}

const ARTICLES_PER_MONDAY = 1;
const ANECDOTES_PER_THURSDAY = 1;
const LOW_ARTICLE_QUEUE_THRESHOLD = 2;
const RECIPE_READY_TARGET_PER_CATEGORY = 2;
// Efter dagens udgivelse må én kategori naturligt være faldet fra to til én.
const RECIPE_CATEGORY_ROTATION = ['morgen', 'frokost', 'aften', 'laekkerier'] as const;
const DAILY_IMAGE_PREP_CRON = '0 5 * * *';
const DAILY_PUBLISH_CRON = '0 6 * * *';
const DAILY_PUBLISH_WATCHDOG_CRON = '15 6 * * *';
const ALERT_FROM = 'hej@ketoklar.dk';
const ALERT_TO = 'ketoklar@saxgruppen.dk';

type RecipeQueueItem = {
  id: number;
  slug: string;
  title: string;
  category: (typeof RECIPE_CATEGORY_ROTATION)[number];
  ingredients_json: string;
  instructions: string;
  created_at?: string;
};

type ArticleQueueItem = {
  id: number;
  slug: string;
  title: string;
  category: 'videnskab' | 'livsstil' | 'anekdote';
  excerpt: string | null;
  body: string;
};

type ArticleTrack = 'article' | 'anecdote';

type RecipeReadiness = {
  category: RecipeQueueItem['category'];
  queued: number;
  ready: number;
};

async function categoryPriority(env: Env, includeLastPublished = true): Promise<RecipeQueueItem['category'][]> {
  const lastPublished = await env.DB
    .prepare(`SELECT category FROM recipes WHERE published_at IS NOT NULL ORDER BY published_at DESC, id DESC LIMIT 1`)
    .first<{ category: RecipeQueueItem['category'] }>();
  const lastIndex = lastPublished ? RECIPE_CATEGORY_ROTATION.indexOf(lastPublished.category) : -1;
  const priority = RECIPE_CATEGORY_ROTATION.map(
    (_, offset) => RECIPE_CATEGORY_ROTATION[(lastIndex + 1 + offset) % RECIPE_CATEGORY_ROTATION.length]
  );
  return lastPublished && !includeLastPublished
    ? priority.filter((category) => category !== lastPublished.category)
    : priority;
}

async function recipeQueueReadiness(env: Env): Promise<RecipeReadiness[]> {
  const { results } = await env.DB
    .prepare(
      `SELECT category,
              COUNT(*) AS queued,
              SUM(CASE WHEN image_status = 'klar' AND image_url IS NOT NULL
                         AND COALESCE((
                           SELECT status FROM image_reviews ir
                           WHERE ir.entity_type = 'recipe' AND ir.entity_id = recipes.id AND ir.marker = ''
                           ORDER BY ir.id DESC LIMIT 1
                         ), '') = 'godkendt'
                       THEN 1 ELSE 0 END) AS ready
       FROM recipes
       WHERE status = 'godkendt' AND published_at IS NULL
       GROUP BY category`
    )
    .all<{ category: RecipeQueueItem['category']; queued: number; ready: number }>();

  const byCategory = new Map(results.map((row) => [row.category, row]));
  return RECIPE_CATEGORY_ROTATION.map((category) => ({
    category,
    queued: byCategory.get(category)?.queued ?? 0,
    ready: byCategory.get(category)?.ready ?? 0,
  }));
}

async function recipesToPrepare(env: Env, limit: number): Promise<RecipeQueueItem[]> {
  const { results } = await env.DB
    .prepare(
      `SELECT id, slug, title, category, ingredients_json, instructions, created_at FROM recipes r
       WHERE status = 'godkendt' AND published_at IS NULL
         AND COALESCE(image_status, '') != 'fejlet'
         AND NOT (
           image_status = 'klar' AND image_url IS NOT NULL
           AND COALESCE((
             SELECT status FROM image_reviews ir
             WHERE ir.entity_type = 'recipe' AND ir.entity_id = r.id AND ir.marker = ''
             ORDER BY ir.id DESC LIMIT 1
           ), '') = 'godkendt'
         )
       ORDER BY created_at ASC, id ASC LIMIT 100`
    )
    .all<RecipeQueueItem>();

  const readiness = await recipeQueueReadiness(env);
  const priority = await categoryPriority(env);
  const groups = new Map(priority.map((category) => [category, results.filter((recipe) => recipe.category === category)]));
  const selected: RecipeQueueItem[] = [];
  for (const category of priority) {
    const currentReady = readiness.find((row) => row.category === category)?.ready ?? 0;
    const deficit = Math.max(0, RECIPE_READY_TARGET_PER_CATEGORY - currentReady);
    selected.push(...(groups.get(category) ?? []).slice(0, deficit));
  }
  return selected.slice(0, limit);
}

async function prepareImages(
  env: Env,
  options: { recipeLimit?: number; articleLimit?: number; legacyRecipeLimit?: number; legacyArticleLimit?: number } = {}
) {
  const recipeLimit = Math.max(0, Math.min(8, options.recipeLimit ?? 4));
  const articleLimit = Math.max(0, Math.min(3, options.articleLimit ?? 1));
  const legacyRecipeLimit = Math.max(0, Math.min(4, options.legacyRecipeLimit ?? 0));
  const legacyArticleLimit = Math.max(0, Math.min(2, options.legacyArticleLimit ?? 0));

  const recipes = await recipesToPrepare(env, recipeLimit);
  if (legacyRecipeLimit > 0) {
    const { results: legacy } = await env.DB
      .prepare(
        `SELECT id, slug, title, category, ingredients_json, instructions FROM recipes r
         WHERE published_at IS NOT NULL AND image_url IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM image_reviews ir
             WHERE ir.entity_type = 'recipe' AND ir.entity_id = r.id AND ir.status = 'godkendt'
           )
         ORDER BY published_at DESC, id DESC LIMIT ?`
      )
      .bind(legacyRecipeLimit)
      .all<RecipeQueueItem>();
    recipes.push(...legacy);
  }

  const recipeOutcomes = [];
  for (const recipe of recipes) {
    const result = await ensureRecipeImage(env, recipe);
    recipeOutcomes.push({
      slug: recipe.slug,
      ok: result.ok,
      score: result.review?.score,
      error: result.error,
      reused: result.reused ?? false,
    });
  }

  const { results: queuedArticles } = await env.DB
    .prepare(
      `SELECT id, slug, title, category, excerpt, body FROM articles a
       WHERE status = 'godkendt' AND published_at IS NULL
         AND (
           NOT EXISTS (
             SELECT 1 FROM image_reviews ir
             WHERE ir.entity_type = 'article' AND ir.entity_id = a.id AND ir.status = 'godkendt'
           )
           OR EXISTS (
             SELECT 1 FROM article_images ai
             WHERE ai.article_id = a.id
               AND NOT EXISTS (
                 SELECT 1 FROM image_reviews ir
                 WHERE ir.entity_type = 'article_body' AND ir.entity_id = ai.id AND ir.status = 'godkendt'
               )
           )
         )
       ORDER BY created_at ASC, id ASC LIMIT ?`
    )
    .bind(articleLimit)
    .all<ArticleQueueItem>();

  const articles = [...queuedArticles];
  if (legacyArticleLimit > 0) {
    const { results: legacyArticles } = await env.DB
      .prepare(
        `SELECT id, slug, title, category, excerpt, body FROM articles a
         WHERE published_at IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM image_reviews ir
             WHERE ir.entity_type = 'article' AND ir.entity_id = a.id AND ir.status = 'godkendt'
           )
         ORDER BY published_at DESC, id DESC LIMIT ?`
      )
      .bind(legacyArticleLimit)
      .all<ArticleQueueItem>();
    articles.push(...legacyArticles);
  }

  const articleOutcomes = [];
  for (const article of articles) {
    const hero = await ensureArticleImage(env, article);
    const body = hero.ok ? await ensureArticleBodyImages(env, article) : [];
    articleOutcomes.push({
      slug: article.slug,
      hero: { ok: hero.ok, score: hero.review?.score, error: hero.error, reused: hero.reused ?? false },
      body,
    });
  }

  const summary = {
    timestamp: new Date().toISOString(),
    recipes: {
      processed: recipeOutcomes.length,
      outcomes: recipeOutcomes,
      readiness: await recipeQueueReadiness(env),
    },
    articles: { processed: articleOutcomes.length, outcomes: articleOutcomes },
  };
  console.log(JSON.stringify({ imagePreparation: summary }));
  return summary;
}

async function regenerateRecipes(env: Env, slugs: string[]) {
  const selected = [...new Set(slugs)].filter(Boolean).slice(0, 5);
  const outcomes = [];
  for (const slug of selected) {
    const recipe = await env.DB
      .prepare(`SELECT id, slug, title, category, ingredients_json, instructions FROM recipes WHERE slug = ?`)
      .bind(slug)
      .first<RecipeQueueItem>();
    if (!recipe) {
      outcomes.push({ slug, ok: false, error: 'Opskriften blev ikke fundet.' });
      continue;
    }
    const result = await ensureRecipeImage(env, recipe, true);
    outcomes.push({ slug, ok: result.ok, score: result.review?.score, error: result.error, url: result.url });
  }
  return { timestamp: new Date().toISOString(), outcomes };
}

async function publishRecipes(env: Env) {
  await runRecipeDay(env);
  return { published: [] as string[], warning: null, imageWarnings: [] as string[] };
}

function articleTrackDetails(track: ArticleTrack) {
  return track === 'anecdote'
    ? { where: `category = 'anekdote'`, label: 'Anekdote', queueLabel: 'Anekdotekøen' }
    : { where: `category IN ('videnskab','livsstil')`, label: 'Artikel', queueLabel: 'Artikelkøen' };
}

async function articleQueueCount(env: Env, track: ArticleTrack): Promise<number> {
  const { where } = articleTrackDetails(track);
  const row = await env.DB
    .prepare(`SELECT COUNT(*) AS count FROM articles WHERE status = 'godkendt' AND published_at IS NULL AND ${where}`)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

async function publishArticleTrack(env: Env, count: number, track: ArticleTrack) {
  const { where, label, queueLabel } = articleTrackDetails(track);
  const day = danishClock().day;
  const bounds = [dayBounds(day), dayBounds(nextDay(day))];
  const publishedToday = await env.DB
    .prepare(`SELECT COUNT(*) AS count FROM articles WHERE published_at >= ? AND published_at < ? AND ${where}`)
    .bind(...bounds)
    .first<{ count: number }>();
  if ((publishedToday?.count ?? 0) > 0) {
    return {
      published: [] as string[],
      queueRemaining: await articleQueueCount(env, track),
      warning: `Dagens ${label.toLocaleLowerCase('da-DK')} er allerede udgivet.`,
      imageWarnings: [] as string[],
    };
  }

  const { results } = await env.DB
    .prepare(
      `SELECT id, slug, title, category, excerpt, body FROM articles
       WHERE status = 'godkendt' AND published_at IS NULL AND ${where}
       ORDER BY created_at ASC, id ASC`
    )
    .all<ArticleQueueItem>();

  if (results.length === 0) {
    return {
      published: [] as string[],
      queueRemaining: 0,
      warning: `${queueLabel} er tom, ingen ny ${label.toLocaleLowerCase('da-DK')} at udgive.`,
      imageWarnings: [] as string[],
    };
  }

  const published: string[] = [];
  const imageWarnings: string[] = [];
  for (const article of results) {
    if (published.length >= count) break;
    const readiness = await articleImageReadiness(env, article);
    if (!readiness.ready) {
      imageWarnings.push(`Ikke billedklar: ${article.slug}. Reserveopbygningen håndteres separat.`);
      continue;
    }

    const publication = await env.DB
      .prepare(`UPDATE articles SET published_at = datetime('now')
        WHERE id = ? AND published_at IS NULL AND status = 'godkendt'
        AND NOT EXISTS (SELECT 1 FROM articles WHERE published_at >= ? AND published_at < ? AND ${where})`)
      .bind(article.id, ...bounds)
      .run();
    if (publication.meta.changes > 0) published.push(article.slug);
    else break; // Another invocation published first; never advance to another post.
  }

  const queueRemaining = await articleQueueCount(env, track);
  const publicationFailed = published.length === 0;
  return {
    published,
    queueRemaining,
    warning: publicationFailed
      ? `Ingen ${label.toLocaleLowerCase('da-DK')} blev udgivet, fordi billedkontrollen ikke var godkendt.`
      : queueRemaining <= LOW_ARTICLE_QUEUE_THRESHOLD
        ? `${queueLabel} har kun ${queueRemaining} ${queueRemaining === 1 ? 'udgivelse' : 'udgivelser'} tilbage.`
        : null,
    imageWarnings,
  };
}

async function runPublishing(env: Env) {
  const weekday = new Date(`${danishClock().day}T12:00:00Z`).getUTCDay();
  const isEditorialDay = weekday === 1 || weekday === 4;
  const recipeResult = isEditorialDay
    ? {
        published: [] as string[],
        warning: weekday === 1
          ? 'Opskriften springes over, fordi mandag er artikeldag.'
          : 'Opskriften springes over, fordi torsdag er anekdotedag.',
        imageWarnings: [] as string[],
      }
    : await publishRecipes(env);
  const idleTrack = { published: [] as string[], queueRemaining: null, warning: null, imageWarnings: [] as string[] };
  const articleResult = weekday === 1
    ? await publishArticleTrack(env, ARTICLES_PER_MONDAY, 'article')
    : idleTrack;
  const anecdoteResult = weekday === 4
    ? await publishArticleTrack(env, ANECDOTES_PER_THURSDAY, 'anecdote')
    : idleTrack;
  const summary = {
    timestamp: new Date().toISOString(),
    recipes: recipeResult,
    articles: articleResult,
    anecdotes: anecdoteResult,
  };
  const editorialTrack = weekday === 1 ? articleResult : weekday === 4 ? anecdoteResult : null;
  if (editorialTrack) {
    const label = weekday === 1 ? 'artikel' : 'anekdote';
    const issues: string[] = [];
    if (editorialTrack.published.length === 0 && !editorialTrack.warning?.includes('allerede udgivet')) {
      issues.push(`Dagens ${label} blev ikke udgivet.`);
    }
    if (editorialTrack.warning && !editorialTrack.warning.includes('allerede udgivet')) {
      issues.push(editorialTrack.warning);
    }
    issues.push(...editorialTrack.imageWarnings);
    if (issues.length > 0) {
      const alert = await env.DB.prepare('INSERT OR IGNORE INTO editorial_alert_days(day) VALUES (?)').bind(danishClock().day).run();
      if (alert.meta.changes) await sendPublisherAlert(
        env,
        `[Ketoklar] ${weekday === 1 ? 'Artikel' : 'Anekdote'} kræver opmærksomhed ${new Date().toISOString().slice(0, 10)}`,
        [
          `Ketoklars planlagte ${label}kørsel har fundet følgende:`,
          '',
          ...issues,
          '',
          `Udgivelser tilbage i køen: ${editorialTrack.queueRemaining ?? 'ukendt'}.`,
        ].join('\n')
      );
    }
  }
  console.log(JSON.stringify(summary));
  return summary;
}

async function sendPublisherAlert(env: Env, subject: string, text: string) {
  if (!env.EMAIL) {
    console.error(JSON.stringify({ publisherAlert: { sent: false, error: 'EMAIL-binding mangler.', subject } }));
    return { sent: false, error: 'EMAIL-binding mangler.' };
  }
  try {
    const result = await env.EMAIL.send({
      from: ALERT_FROM,
      to: ALERT_TO,
      replyTo: ALERT_FROM,
      subject,
      text,
    });
    console.log(JSON.stringify({ publisherAlert: { sent: true, subject, messageId: result.messageId } }));
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    console.error(JSON.stringify({ publisherAlert: { sent: false, subject, error: String(error) } }));
    return { sent: false, error: String(error) };
  }
}

async function runRecipeWatchdog(env: Env) {
  return runRecipeDay(env);
}

function isAuthorized(request: Request, env: Env, url: URL): boolean {
  const secret = request.headers.get('x-publish-secret') ?? url.searchParams.get('secret');
  return Boolean(env.PUBLISH_SECRET && secret === env.PUBLISH_SECRET);
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (event.cron === '*/5 * * * *') {
      const clock = danishClock();
      ctx.waitUntil(runEditorialDay(env, () => runPublishing(env)));
      if (clock.minutes >= 360 && clock.minutes <= 1330 && clock.minutes % 60 === 10) {
        ctx.waitUntil(prepareRecipeReserve(env).then(result => console.log(JSON.stringify({recipeReserve:result}))));
      }
      if (clock.minutes === 1095) ctx.waitUntil(warnLowRecipeReserve(env));
      if (clock.minutes >= 360 && clock.minutes <= 1335 && clock.minutes % 60 === 15) {
        ctx.waitUntil(prepareArticleReserve(env).then(result => console.log(JSON.stringify({articleReserve:result}))));
      }
      if (clock.minutes === 1100) ctx.waitUntil(warnLowArticleReserve(env));
      ctx.waitUntil((async () => {
        await runRecipeDay(env);
        if (clock.minutes >= 600) await planRecipeDay(env, nextDay(clock.day));
      })());
      return;
    }
    if (event.cron === '30 * * * *') {
      ctx.waitUntil(anonymizeExpiredRatings(env.DB).then((result) => {
        console.log(JSON.stringify({ ratingRetention: result }));
      }));
      return;
    }
    if (event.cron === DAILY_IMAGE_PREP_CRON) {
      // Hold op til to billedgodkendte reserver klar i hver kategori. To ældre
      // billeder opgraderes dagligt, indtil hele arkivet er kvalitetstjekket.
      ctx.waitUntil(
        prepareArticleReserve(env)
      );
      return;
    }
    if (event.cron === DAILY_PUBLISH_CRON) {
      ctx.waitUntil(runPublishing(env));
      return;
    }
    if (event.cron === DAILY_PUBLISH_WATCHDOG_CRON) {
      ctx.waitUntil(runRecipeWatchdog(env));
    }
  },

  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === '/article-reserve-status' && request.method === 'GET') {
      if (!isAuthorized(request, env, url)) return new Response('Unauthorized', { status: 401 });
      const state = await articleReserveStatus(env);
      const review = await env.DB.prepare("SELECT a.slug,a.title,j.last_error FROM article_image_jobs j JOIN articles a ON a.id=j.article_id WHERE j.status='review' AND a.published_at IS NULL").all();
      return Response.json({tracks:state.tracks,articles:state.rows.map(({slug,title,ready,heroReady,missing})=>({slug,title,ready,heroReady,missing})),review:review.results});
    }
    if (url.pathname === '/prepare-article-reserve' && request.method === 'POST') {
      if (!isAuthorized(request, env, url)) return new Response('Unauthorized', { status: 401 });
      return Response.json(await prepareArticleReserve(env));
    }

    if (url.pathname === '/recipe-reserve-status' && request.method === 'GET') {
      if (!isAuthorized(request, env, url)) return new Response('Unauthorized', { status: 401 });
      const review = await env.DB.prepare(`SELECT r.slug,r.title,j.content_failures,j.technical_failures,j.last_error
        FROM recipe_image_jobs j JOIN recipes r ON r.id=j.recipe_id WHERE j.status='review' AND r.published_at IS NULL AND r.image_status!='klar'`).all();
      return Response.json({...await reserveStatus(env),review:review.results});
    }
    if (url.pathname === '/prepare-recipe-reserve' && request.method === 'POST') {
      if (!isAuthorized(request, env, url)) return new Response('Unauthorized', { status: 401 });
      return Response.json(await prepareRecipeReserve(env));
    }

    if (url.pathname === '/test-images' && request.method === 'POST') return handleTestImages(request, env);

    if (url.pathname === '/prepare-images' && request.method === 'POST') {
      if (!isAuthorized(request, env, url)) return new Response('Unauthorized', { status: 401 });
      const body = (await request.json().catch(() => ({}))) as {
        recipeLimit?: number;
        articleLimit?: number;
        legacyRecipeLimit?: number;
        legacyArticleLimit?: number;
      };
      return Response.json(await prepareImages(env, body));
    }

    if (url.pathname === '/regenerate-images' && request.method === 'POST') {
      if (!isAuthorized(request, env, url)) return new Response('Unauthorized', { status: 401 });
      const body = (await request.json().catch(() => ({}))) as { slugs?: string[] };
      if (!Array.isArray(body.slugs) || body.slugs.length === 0) {
        return Response.json({ error: 'Angiv mindst én opskrift i slugs.' }, { status: 400 });
      }
      return Response.json(await regenerateRecipes(env, body.slugs));
    }

    if (url.pathname === '/backfill-images' && (request.method === 'POST' || request.method === 'GET')) {
      if (!isAuthorized(request, env, url)) return new Response('Unauthorized', { status: 401 });
      return Response.json(
        await prepareImages(env, { recipeLimit: 0, articleLimit: 0, legacyRecipeLimit: 4, legacyArticleLimit: 2 })
      );
    }

    if (url.pathname === '/image-review-status' && request.method === 'GET') {
      if (!isAuthorized(request, env, url)) return new Response('Unauthorized', { status: 401 });
      const { results } = await env.DB
        .prepare(
          `SELECT entity_type, entity_id, marker, status, score, reason, observed_subject,
                  retry_instruction, candidate_url, created_at
           FROM image_reviews ORDER BY id DESC LIMIT 50`
        )
        .all();
      return Response.json({ reviews: results });
    }

    if (url.pathname === '/publish' && request.method === 'POST') {
      if (!isAuthorized(request, env, url)) return new Response('Unauthorized', { status: 401 });
      return Response.json(await runPublishing(env));
    }

    return new Response(
      'Ketoklar publisher worker. POST /prepare-images klargør køen, POST /regenerate-images erstatter valgte billeder, POST /publish udgiver, GET /image-review-status viser billedkontrol.',
      { status: 200 }
    );
  },
};
