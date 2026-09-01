import { buildRecipePrompt, buildFullPrompt, buildArticlePrompt, type RecipeForPrompt, type ArticleForPrompt } from './imagePrompt';
import type { ImageEnv } from './testImages';

// Valgt efter kvalitetstest af tre kandidater, se samtalen med Kim 1. september 2026.
export const PRODUCTION_IMAGE_MODEL = '@cf/leonardo/lucid-origin';

type RecipeRow = RecipeForPrompt & { id: number; slug: string };
type ArticleRow = ArticleForPrompt & { id: number; slug: string };

async function generateAndStoreImage(
  env: ImageEnv,
  table: 'recipes' | 'articles',
  row: { id: number; slug: string },
  recipeSpecificPrompt: string
): Promise<{ ok: boolean; error?: string }> {
  const fullPrompt = buildFullPrompt(recipeSpecificPrompt);
  const key = `${table}/${row.slug}.png`;

  try {
    await env.DB.prepare(`UPDATE ${table} SET image_status = 'under_generering', image_prompt = ? WHERE id = ?`)
      .bind(recipeSpecificPrompt, row.id)
      .run();

    const output = (await env.AI.run(PRODUCTION_IMAGE_MODEL as keyof AiModels, {
      prompt: fullPrompt,
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

    await env.DB.prepare(
      `UPDATE ${table} SET image_url = ?, image_model = ?, image_status = 'klar', image_version = image_version + 1 WHERE id = ?`
    )
      .bind(url, PRODUCTION_IMAGE_MODEL, row.id)
      .run();

    return { ok: true };
  } catch (err) {
    await env.DB.prepare(`UPDATE ${table} SET image_status = 'fejlet' WHERE id = ?`).bind(row.id).run();
    return { ok: false, error: String(err) };
  }
}

// Fejler en generering, sættes status til 'fejlet' i stedet for at kaste, så udgivelsen
// af selve opskriften eller artiklen ikke blokeres af et enkelt mislykket billede.
export async function ensureRecipeImage(env: ImageEnv, recipe: RecipeRow) {
  return generateAndStoreImage(env, 'recipes', recipe, buildRecipePrompt(recipe));
}

export async function ensureArticleImage(env: ImageEnv, article: ArticleRow) {
  return generateAndStoreImage(env, 'articles', article, buildArticlePrompt(article));
}
