import { buildRecipePrompt, buildFullPrompt, buildArticlePrompt, type RecipeForPrompt, type ArticleForPrompt } from './imagePrompt';
import type { ImageEnv } from './testImages';

// Valgt efter kvalitetstest af tre kandidater, se samtalen med Kim 1. september 2026.
export const PRODUCTION_IMAGE_MODEL = '@cf/leonardo/lucid-origin';

type RecipeRow = RecipeForPrompt & { id: number; slug: string };
type ArticleRow = ArticleForPrompt & { id: number; slug: string };

// Matcher [[image:kort-id|prompt tekst]] linjer i en artikels brødtekst.
const BODY_IMAGE_MARKER = /\[\[image:([a-z0-9-]+)\|([^\]]+)\]\]/g;

async function runImageGeneration(env: ImageEnv, prompt: string, key: string): Promise<{ ok: true; url: string | null } | { ok: false; error: string }> {
  try {
    const output = (await env.AI.run(PRODUCTION_IMAGE_MODEL as keyof AiModels, {
      prompt,
      width: 1024,
      height: 768,
    } as never)) as unknown as ReadableStream | { image: string };

    let bytes: ArrayBuffer;
    if (output instanceof ReadableStream) {
      bytes = await new Response(output).arrayBuffer();
    } else {
      const binary = atob(output.image);
      const arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
      bytes = arr.buffer;
    }

    await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: 'image/png' } });
    const url = env.IMAGES_PUBLIC_BASE_URL ? `${env.IMAGES_PUBLIC_BASE_URL}/${key}` : null;
    return { ok: true, url };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function generateAndStoreImage(
  env: ImageEnv,
  table: 'recipes' | 'articles',
  row: { id: number; slug: string },
  recipeSpecificPrompt: string
): Promise<{ ok: boolean; error?: string }> {
  const key = `${table}/${row.slug}.png`;

  await env.DB.prepare(`UPDATE ${table} SET image_status = 'under_generering', image_prompt = ? WHERE id = ?`)
    .bind(recipeSpecificPrompt, row.id)
    .run();

  const result = await runImageGeneration(env, buildFullPrompt(recipeSpecificPrompt, row.slug), key);

  if (!result.ok) {
    await env.DB.prepare(`UPDATE ${table} SET image_status = 'fejlet' WHERE id = ?`).bind(row.id).run();
    return { ok: false, error: result.error };
  }

  await env.DB.prepare(
    `UPDATE ${table} SET image_url = ?, image_model = ?, image_status = 'klar', image_version = image_version + 1 WHERE id = ?`
  )
    .bind(result.url, PRODUCTION_IMAGE_MODEL, row.id)
    .run();

  return { ok: true };
}

// Fejler en generering, sættes status til 'fejlet' i stedet for at kaste, så udgivelsen
// af selve opskriften eller artiklen ikke blokeres af et enkelt mislykket billede.
export async function ensureRecipeImage(env: ImageEnv, recipe: RecipeRow) {
  return generateAndStoreImage(env, 'recipes', recipe, buildRecipePrompt(recipe));
}

export async function ensureArticleImage(env: ImageEnv, article: ArticleRow) {
  return generateAndStoreImage(env, 'articles', article, buildArticlePrompt(article));
}

// Finder [[image:id|prompt]] markører i brødteksten, opretter rækker i article_images
// for nye markører, og genererer billeder for dem, der endnu mangler.
export async function ensureArticleBodyImages(
  env: ImageEnv,
  article: { id: number; slug: string; body: string }
): Promise<Array<{ marker: string; ok: boolean; error?: string }>> {
  const matches = [...article.body.matchAll(BODY_IMAGE_MARKER)];
  if (matches.length === 0) return [];

  const outcomes: Array<{ marker: string; ok: boolean; error?: string }> = [];

  for (const match of matches) {
    const [, marker, prompt] = match;

    await env.DB.prepare(
      `INSERT INTO article_images (article_id, marker, prompt) VALUES (?, ?, ?)
       ON CONFLICT(article_id, marker) DO NOTHING`
    )
      .bind(article.id, marker, prompt.trim())
      .run();

    const row = await env.DB.prepare(
      `SELECT id, image_status FROM article_images WHERE article_id = ? AND marker = ?`
    )
      .bind(article.id, marker)
      .first<{ id: number; image_status: string }>();

    if (!row || row.image_status === 'klar') {
      outcomes.push({ marker, ok: true });
      continue;
    }

    const key = `articles/${article.slug}/${marker}.png`;
    await env.DB.prepare(`UPDATE article_images SET image_status = 'under_generering' WHERE id = ?`).bind(row.id).run();

    const result = await runImageGeneration(env, buildFullPrompt(prompt.trim(), `${article.slug}-${marker}`), key);

    if (!result.ok) {
      await env.DB.prepare(`UPDATE article_images SET image_status = 'fejlet' WHERE id = ?`).bind(row.id).run();
      outcomes.push({ marker, ok: false, error: result.error });
      continue;
    }

    await env.DB.prepare(
      `UPDATE article_images SET image_url = ?, image_model = ?, image_status = 'klar' WHERE id = ?`
    )
      .bind(result.url, PRODUCTION_IMAGE_MODEL, row.id)
      .run();
    outcomes.push({ marker, ok: true });
  }

  return outcomes;
}
