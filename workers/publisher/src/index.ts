import { handleTestImages, type ImageEnv } from './testImages';
import { ensureRecipeImage, ensureArticleImage, ensureArticleBodyImages } from './generateImage';

export interface Env extends ImageEnv {
  DB: D1Database;
  PUBLISH_SECRET?: string;
}

const ARTICLES_PER_WEEK = 1;
const RECIPE_CATEGORY_ROTATION = ['morgen', 'frokost', 'aften', 'laekkerier'] as const;

type RecipeQueueItem = {
  id: number;
  slug: string;
  title: string;
  category: typeof RECIPE_CATEGORY_ROTATION[number];
  ingredients_json: string;
};

async function publishRecipes(env: Env) {
  // Et manuelt kald må ikke kunne lægge endnu en opskrift ud samme UTC-dag.
  const publishedToday = await env.DB
    .prepare(`SELECT COUNT(*) AS count FROM recipes WHERE published_at >= date('now')`)
    .first<{ count: number }>();

  if ((publishedToday?.count ?? 0) > 0) {
    return {
      published: [] as string[],
      warning: 'Dagens opskrift er allerede udgivet.',
      imageWarnings: [] as string[],
    };
  }

  const lastPublished = await env.DB
    .prepare(`SELECT category FROM recipes WHERE published_at IS NOT NULL ORDER BY published_at DESC, id DESC LIMIT 1`)
    .first<{ category: RecipeQueueItem['category'] }>();

  const lastIndex = lastPublished ? RECIPE_CATEGORY_ROTATION.indexOf(lastPublished.category) : -1;
  const categoriesInPriorityOrder = RECIPE_CATEGORY_ROTATION.map(
    (_, offset) => RECIPE_CATEGORY_ROTATION[(lastIndex + 1 + offset) % RECIPE_CATEGORY_ROTATION.length]
  );

  let recipe: RecipeQueueItem | null = null;
  for (const category of categoriesInPriorityOrder) {
    recipe = await env.DB
      .prepare(
        `SELECT id, slug, title, category, ingredients_json FROM recipes
         WHERE status = 'godkendt' AND published_at IS NULL AND category = ?
         ORDER BY created_at ASC, id ASC
         LIMIT 1`
      )
      .bind(category)
      .first<RecipeQueueItem>();

    if (recipe) break;
  }

  if (!recipe) {
    return { published: [] as string[], warning: 'Opskriftskøen er tom, ingen nye opskrifter at udgive.', imageWarnings: [] as string[] };
  }

  // Generér billedet, FØR opskriften går live.
  const imageWarnings: string[] = [];
  const imageResult = await ensureRecipeImage(env, recipe);
  if (!imageResult.ok) {
    imageWarnings.push(`Billede fejlede for ${recipe.slug}: ${imageResult.error}`);
  }

  await env.DB
    .prepare(`UPDATE recipes SET published_at = datetime('now') WHERE id = ? AND published_at IS NULL`)
    .bind(recipe.id)
    .run();

  return {
    published: [recipe.slug],
    category: recipe.category,
    warning: null,
    imageWarnings,
  };
}

async function publishArticles(env: Env, count: number) {
  const { results } = await env.DB
    .prepare(
      `SELECT id, slug, category, body FROM articles
       WHERE status = 'godkendt' AND published_at IS NULL
       ORDER BY created_at ASC
       LIMIT ?`
    )
    .bind(count)
    .all<{ id: number; slug: string; category: 'videnskab' | 'livsstil' | 'anekdote'; body: string }>();

  if (results.length === 0) {
    return { published: [] as string[], warning: 'Artikelkøen er tom, ingen ny artikel at udgive.', imageWarnings: [] as string[] };
  }

  const imageWarnings: string[] = [];
  for (const article of results) {
    const heroResult = await ensureArticleImage(env, article);
    if (!heroResult.ok) {
      imageWarnings.push(`Hero-billede fejlede for ${article.slug}: ${heroResult.error}`);
    }
    const bodyResults = await ensureArticleBodyImages(env, article);
    for (const b of bodyResults) {
      if (!b.ok) imageWarnings.push(`Billede '${b.marker}' fejlede for ${article.slug}: ${b.error}`);
    }
  }

  const ids = results.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  await env.DB
    .prepare(`UPDATE articles SET published_at = datetime('now') WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run();

  return { published: results.map((r) => r.slug), warning: null, imageWarnings };
}

async function runPublishing(env: Env) {
  const recipeResult = await publishRecipes(env);

  // Mandag = kør ugentlig artikel-udgivelse (UTC ugedag, 1 = mandag)
  const isMonday = new Date().getUTCDay() === 1;
  const articleResult = isMonday
    ? await publishArticles(env, ARTICLES_PER_WEEK)
    : { published: [], warning: null, imageWarnings: [] as string[] };

  const summary = {
    timestamp: new Date().toISOString(),
    recipes: recipeResult,
    articles: articleResult,
  };

  console.log(JSON.stringify(summary));
  return summary;
}

export default {
  // Køres automatisk af Cron Trigger (se wrangler.jsonc)
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runPublishing(env));
  },

  // Manuel test-udløser: POST /publish med header x-publish-secret
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === '/backfill-images' && (request.method === 'POST' || request.method === 'GET')) {
      const secret = request.headers.get('x-publish-secret') ?? url.searchParams.get('secret');
      if (!env.PUBLISH_SECRET || secret !== env.PUBLISH_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }
      const { results: recipes } = await env.DB
        .prepare(
          `SELECT id, slug, title, category, ingredients_json FROM recipes
           WHERE image_status = 'mangler' AND published_at IS NOT NULL
           ORDER BY id ASC LIMIT 20`
        )
        .all<{ id: number; slug: string; title: string; category: 'morgen' | 'frokost' | 'aften' | 'laekkerier'; ingredients_json: string }>();

      const recipeOutcomes = [];
      for (const recipe of recipes) {
        const result = await ensureRecipeImage(env, recipe);
        recipeOutcomes.push({ slug: recipe.slug, ok: result.ok, error: result.error });
      }

      const { results: articlesNeedingHero } = await env.DB
        .prepare(
          `SELECT id, slug, category FROM articles
           WHERE image_status = 'mangler' AND published_at IS NOT NULL
           ORDER BY id ASC LIMIT 20`
        )
        .all<{ id: number; slug: string; category: 'videnskab' | 'livsstil' | 'anekdote' }>();

      const articleOutcomes = [];
      for (const article of articlesNeedingHero) {
        const result = await ensureArticleImage(env, article);
        articleOutcomes.push({ slug: article.slug, ok: result.ok, error: result.error });
      }

      const { results: publishedArticles } = await env.DB
        .prepare(`SELECT id, slug, body FROM articles WHERE published_at IS NOT NULL ORDER BY id ASC LIMIT 20`)
        .all<{ id: number; slug: string; body: string }>();

      const bodyImageOutcomes = [];
      for (const article of publishedArticles) {
        const bodyResults = await ensureArticleBodyImages(env, article);
        bodyImageOutcomes.push(...bodyResults.map((r) => ({ ...r, articleSlug: article.slug })));
      }

      return Response.json({
        recipes: { processed: recipeOutcomes.length, outcomes: recipeOutcomes },
        articles: { processed: articleOutcomes.length, outcomes: articleOutcomes },
        articleBodyImages: { processed: bodyImageOutcomes.length, outcomes: bodyImageOutcomes },
      });
    }

    if (url.pathname === '/test-images' && request.method === 'POST') {
      return handleTestImages(request, env);
    }

    if (url.pathname !== '/publish' || request.method !== 'POST') {
      return new Response('Ketoklar publisher worker. POST /publish for at teste manuelt, POST /test-images for at teste billedmodeller.', { status: 200 });
    }

    if (!env.PUBLISH_SECRET || request.headers.get('x-publish-secret') !== env.PUBLISH_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    const summary = await runPublishing(env);
    return Response.json(summary);
  },
};
