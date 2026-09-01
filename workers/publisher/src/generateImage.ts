import { buildRecipePrompt, buildFullPrompt, type RecipeForPrompt } from './imagePrompt';
import type { ImageEnv } from './testImages';

// Valgt efter kvalitetstest af tre kandidater, se samtalen med Kim 1. september 2026.
export const PRODUCTION_IMAGE_MODEL = '@cf/leonardo/lucid-origin';

type RecipeRow = RecipeForPrompt & { id: number; slug: string };

// Genererer og gemmer et billede for én opskrift, opdaterer image_url/model/status/version.
// Fejler en generering, sættes status til 'fejlet' i stedet for at kaste, så udgivelsen
// af selve opskriften ikke blokeres af et enkelt mislykket billede.
export async function ensureRecipeImage(env: ImageEnv, recipe: RecipeRow): Promise<{ ok: boolean; error?: string }> {
  const recipePrompt = buildRecipePrompt(recipe);
  const fullPrompt = buildFullPrompt(recipePrompt);
  const key = `recipes/${recipe.slug}.png`;

  try {
    await env.DB.prepare(`UPDATE recipes SET image_status = 'under_generering', image_prompt = ? WHERE id = ?`)
      .bind(recipePrompt, recipe.id)
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
      `UPDATE recipes SET image_url = ?, image_model = ?, image_status = 'klar', image_version = image_version + 1 WHERE id = ?`
    )
      .bind(url, PRODUCTION_IMAGE_MODEL, recipe.id)
      .run();

    return { ok: true };
  } catch (err) {
    await env.DB.prepare(`UPDATE recipes SET image_status = 'fejlet' WHERE id = ?`).bind(recipe.id).run();
    return { ok: false, error: String(err) };
  }
}
