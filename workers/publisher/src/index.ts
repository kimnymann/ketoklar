import { handleTestImages, type ImageEnv } from './testImages';
import { ensureRecipeImage, ensureArticleImage } from './generateImage';

export interface Env extends ImageEnv {
  DB: D1Database;
  PUBLISH_SECRET?: string;
}

const RECIPES_PER_DAY = 2;
const ARTICLES_PER_WEEK = 1;

async function publishRecipes(env: Env, count: number) {
  const { results } = await env.DB
    .prepare(
      `SELECT id, slug, title, category, ingredients_json FROM recipes
       WHERE status = 'godkendt' AND published_at IS NULL
       ORDER BY created_at ASC
       LIMIT ?`
    )
    .bind(count)
    .all<{ id: number; slug: string; title: string; category: 'morgen' | 'frokost' | 'aften' | 'laekkerier'; ingredients_json: string }>();

  if (results.length === 0) {
    return { published: [] as string[], warning: 'Opskriftskøen er tom, ingen nye opskrifter at udgive.', imageWarnings: [] as string[] };
  }

  // Generér billede for hver opskrift, FØR den går live, så intet publiceres uden billede.
  const imageWarnings: string[] = [];
  for (const recipe of results) {
    const result = await ensureRecipeImage(env, recipe);
    if (!result.ok) {
      imageWarnings.push(`Billede fejlede for ${recipe.slug}: ${result.error}`);
    }
  }

  const ids = results.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  await env.DB
    .prepare(`UPDATE recipes SET published_at = datetime('now') WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run();

  return {
    published: results.map((r) => r.slug),
    warning: results.length < count ? `Kun ${results.length} af ${count} ønskede opskrifter var klar i køen.` : null,
    imageWarnings,
  };
}

async function publishArticles(env: Env, count: number) {
  const { results } = await env.DB
    .prepare(
      `SELECT id, slug, category FROM articles
       WHERE status = 'godkendt' AND published_at IS NULL
       ORDER BY created_at ASC
       LIMIT ?`
    )
    .bind(count)
    .all<{ id: number; slug: string; category: 'videnskab' | 'livsstil' | 'anekdote' }>();

  if (results.length === 0) {
    return { published: [] as string[], warning: 'Artikelkøen er tom, ingen ny artikel at udgive.', imageWarnings: [] as string[] };
  }

  const imageWarnings: string[] = [];
  for (const article of results) {
    const result = await ensureArticleImage(env, article);
    if (!result.ok) {
      imageWarnings.push(`Billede fejlede for ${article.slug}: ${result.error}`);
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
  const recipeResult = await publishRecipes(env, RECIPES_PER_DAY);

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

    if (url.pathname === '/backfill-images' && request.method === 'POST') {
      if (!env.PUBLISH_SECRET || request.headers.get('x-publish-secret') !== env.PUBLISH_SECRET) {
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

      const { results: articles } = await env.DB
        .prepare(
          `SELECT id, slug, category FROM articles
           WHERE image_status = 'mangler' AND published_at IS NOT NULL
           ORDER BY id ASC LIMIT 20`
        )
        .all<{ id: number; slug: string; category: 'videnskab' | 'livsstil' | 'anekdote' }>();

      const articleOutcomes = [];
      for (const article of articles) {
        const result = await ensureArticleImage(env, article);
        articleOutcomes.push({ slug: article.slug, ok: result.ok, error: result.error });
      }

      return Response.json({
        recipes: { processed: recipeOutcomes.length, outcomes: recipeOutcomes },
        articles: { processed: articleOutcomes.length, outcomes: articleOutcomes },
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
