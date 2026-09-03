import { handleTestImages, type ImageEnv } from './testImages';
import { ensureRecipeImage, ensureArticleImage, ensureArticleBodyImages } from './generateImage';

export interface Env extends ImageEnv {
  DB: D1Database;
  PUBLISH_SECRET?: string;
}

const ARTICLES_PER_MONDAY = 1;
const ANECDOTES_PER_THURSDAY = 1;
const LOW_ARTICLE_QUEUE_THRESHOLD = 2;
const RECIPE_CATEGORY_ROTATION = ['morgen', 'frokost', 'aften', 'laekkerier'] as const;
const DAILY_IMAGE_PREP_CRON = '0 5 * * *';

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

async function categoryPriority(env: Env): Promise<RecipeQueueItem['category'][]> {
  const lastPublished = await env.DB
    .prepare(`SELECT category FROM recipes WHERE published_at IS NOT NULL ORDER BY published_at DESC, id DESC LIMIT 1`)
    .first<{ category: RecipeQueueItem['category'] }>();
  const lastIndex = lastPublished ? RECIPE_CATEGORY_ROTATION.indexOf(lastPublished.category) : -1;
  return RECIPE_CATEGORY_ROTATION.map(
    (_, offset) => RECIPE_CATEGORY_ROTATION[(lastIndex + 1 + offset) % RECIPE_CATEGORY_ROTATION.length]
  );
}

async function nextRecipeToPublish(env: Env): Promise<RecipeQueueItem | null> {
  for (const category of await categoryPriority(env)) {
    const recipe = await env.DB
      .prepare(
        `SELECT id, slug, title, category, ingredients_json, instructions FROM recipes
         WHERE status = 'godkendt' AND published_at IS NULL AND category = ?
         ORDER BY created_at ASC, id ASC LIMIT 1`
      )
      .bind(category)
      .first<RecipeQueueItem>();
    if (recipe) return recipe;
  }
  return null;
}

async function recipesToPrepare(env: Env, limit: number): Promise<RecipeQueueItem[]> {
  const { results } = await env.DB
    .prepare(
      `SELECT id, slug, title, category, ingredients_json, instructions, created_at FROM recipes r
       WHERE status = 'godkendt' AND published_at IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM image_reviews ir
           WHERE ir.entity_type = 'recipe' AND ir.entity_id = r.id AND ir.status = 'godkendt'
         )
       ORDER BY created_at ASC, id ASC LIMIT 100`
    )
    .all<RecipeQueueItem>();

  const priority = await categoryPriority(env);
  const groups = new Map(priority.map((category) => [category, results.filter((recipe) => recipe.category === category)]));
  const selected: RecipeQueueItem[] = [];
  while (selected.length < limit) {
    let found = false;
    for (const category of priority) {
      const next = groups.get(category)?.shift();
      if (next) {
        selected.push(next);
        found = true;
        if (selected.length === limit) break;
      }
    }
    if (!found) break;
  }
  return selected;
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
    recipes: { processed: recipeOutcomes.length, outcomes: recipeOutcomes },
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
  const publishedToday = await env.DB
    .prepare(`SELECT COUNT(*) AS count FROM recipes WHERE published_at >= date('now')`)
    .first<{ count: number }>();
  if ((publishedToday?.count ?? 0) > 0) {
    return { published: [] as string[], warning: 'Dagens opskrift er allerede udgivet.', imageWarnings: [] as string[] };
  }

  const recipe = await nextRecipeToPublish(env);
  if (!recipe) {
    return { published: [] as string[], warning: 'Opskriftskøen er tom, ingen nye opskrifter at udgive.', imageWarnings: [] as string[] };
  }

  const imageResult = await ensureRecipeImage(env, recipe);
  if (!imageResult.ok) {
    return {
      published: [] as string[],
      category: recipe.category,
      warning: `Opskriften ${recipe.slug} blev ikke udgivet, fordi billedet ikke bestod kvalitetskontrollen.`,
      imageWarnings: [imageResult.error || 'Ukendt billedfejl.'],
    };
  }

  await env.DB
    .prepare(`UPDATE recipes SET published_at = datetime('now') WHERE id = ? AND published_at IS NULL`)
    .bind(recipe.id)
    .run();
  return { published: [recipe.slug], category: recipe.category, warning: null, imageWarnings: [] as string[] };
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
  const publishedToday = await env.DB
    .prepare(`SELECT COUNT(*) AS count FROM articles WHERE published_at >= date('now') AND ${where}`)
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
       ORDER BY created_at ASC, id ASC LIMIT ?`
    )
    .bind(count)
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
    const hero = await ensureArticleImage(env, article);
    if (!hero.ok) {
      imageWarnings.push(`Hero-billede afvist for ${article.slug}: ${hero.error}`);
      continue;
    }
    const body = await ensureArticleBodyImages(env, article);
    const failedBody = body.filter((image) => !image.ok);
    if (failedBody.length > 0) {
      imageWarnings.push(...failedBody.map((image) => `Billede '${image.marker}' afvist for ${article.slug}: ${image.error}`));
      continue;
    }

    await env.DB
      .prepare(`UPDATE articles SET published_at = datetime('now') WHERE id = ? AND published_at IS NULL`)
      .bind(article.id)
      .run();
    published.push(article.slug);
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
  const recipeResult = await publishRecipes(env);
  const weekday = new Date().getUTCDay();
  const idleTrack = { published: [] as string[], queueRemaining: null, warning: null, imageWarnings: [] as string[] };
  const articleResult = weekday === 1
    ? await publishArticleTrack(env, ARTICLES_PER_MONDAY, 'article')
    : idleTrack;
  const anecdoteResult = weekday === 4
    ? await publishArticleTrack(env, ANECDOTES_PER_THURSDAY, 'anekdote')
    : idleTrack;
  const summary = {
    timestamp: new Date().toISOString(),
    recipes: recipeResult,
    articles: articleResult,
    anecdotes: anecdoteResult,
  };
  console.log(JSON.stringify(summary));
  return summary;
}

function isAuthorized(request: Request, env: Env, url: URL): boolean {
  const secret = request.headers.get('x-publish-secret') ?? url.searchParams.get('secret');
  return Boolean(env.PUBLISH_SECRET && secret === env.PUBLISH_SECRET);
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (event.cron === DAILY_IMAGE_PREP_CRON) {
      // Fire kø-opskrifter giver mindst én fra hver kategori. To ældre billeder
      // opgraderes dagligt, indtil hele det eksisterende arkiv er kvalitetstjekket.
      ctx.waitUntil(
        prepareImages(env, { recipeLimit: 4, articleLimit: 1, legacyRecipeLimit: 2, legacyArticleLimit: 1 })
      );
      return;
    }
    ctx.waitUntil(runPublishing(env));
  },

  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

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
