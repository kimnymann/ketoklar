import { buildRecipePrompt, buildFullPrompt } from './imagePrompt';

export interface ImageEnv {
  DB: D1Database;
  AI: Ai;
  IMAGES: R2Bucket;
  PUBLISH_SECRET?: string;
  IMAGES_PUBLIC_BASE_URL?: string; // fx https://pub-xxxx.r2.dev, sættes når bucket er oprettet
}

// Kandidatmodeller til kvalitetstesten. Justér listen, når du ved, hvilke du vil sammenligne.
const CANDIDATE_MODELS = [
  '@cf/black-forest-labs/flux-1-schnell',
  '@cf/leonardo/phoenix-1.0',
  '@cf/leonardo/lucid-origin',
] as const;

type TestImagesRequest = {
  slugs: string[];
  models?: string[];
};

export async function handleTestImages(request: Request, env: ImageEnv): Promise<Response> {
  if (!env.PUBLISH_SECRET || request.headers.get('x-publish-secret') !== env.PUBLISH_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = (await request.json()) as TestImagesRequest;
  const slugs = body.slugs?.slice(0, 5) ?? []; // maks 5 ad gangen til en testbatch
  const models = (body.models && body.models.length > 0 ? body.models : CANDIDATE_MODELS) as string[];

  if (slugs.length === 0) {
    return Response.json({ error: 'Angiv mindst én opskrifts-slug i "slugs".' }, { status: 400 });
  }

  const results: Array<{ slug: string; model: string; key: string; url: string | null; error?: string }> = [];

  for (const slug of slugs) {
    const recipe = await env.DB
      .prepare(`SELECT title, category, ingredients_json FROM recipes WHERE slug = ?`)
      .bind(slug)
      .first<{ title: string; category: 'morgen' | 'frokost' | 'aften' | 'laekkerier'; ingredients_json: string }>();

    if (!recipe) {
      results.push({ slug, model: '-', key: '-', url: null, error: 'Opskrift ikke fundet' });
      continue;
    }

    const recipePrompt = buildRecipePrompt({ ...recipe, slug });
    const fullPrompt = buildFullPrompt(recipePrompt, slug);

    for (const model of models) {
      const modelShortName = model.split('/').pop();
      const key = `test/${slug}/${modelShortName}.png`;

      try {
        const output = (await env.AI.run(model as keyof AiModels, {
          prompt: fullPrompt,
          width: 1024,
          height: 768,
        } as never)) as unknown as ReadableStream | { image: string };

        let bytes: ArrayBuffer;
        if (output instanceof ReadableStream) {
          bytes = await new Response(output).arrayBuffer();
        } else {
          // Nogle modeller returnerer base64 i et "image" felt i stedet for rå bytes
          const binary = atob(output.image);
          const arr = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
          bytes = arr.buffer;
        }

        await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: 'image/png' } });

        const url = env.IMAGES_PUBLIC_BASE_URL ? `${env.IMAGES_PUBLIC_BASE_URL}/${key}` : null;
        results.push({ slug, model, key, url });
      } catch (err) {
        results.push({ slug, model, key, url: null, error: String(err) });
      }
    }
  }

  return Response.json({ prompt_style_note: 'Ret-specifik del bygget pr. opskrift, fast husstil tilføjet fra imagePrompt.ts', results });
}
