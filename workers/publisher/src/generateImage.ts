import { buildRecipePrompt, buildFullPrompt, buildArticlePrompt, type RecipeForPrompt, type ArticleForPrompt } from './imagePrompt';
import { IMAGE_REVIEW_MODEL, reviewGeneratedImage, type ImageReview, type ReviewTarget } from './imageReview';
import type { ImageEnv } from './testImages';

export const PRODUCTION_IMAGE_MODEL = '@cf/leonardo/lucid-origin';
const MAX_GENERATION_ATTEMPTS = 3;

type RecipeRow = RecipeForPrompt & { id: number; slug: string };
type ArticleRow = ArticleForPrompt & { id: number; slug: string };
type EntityType = 'recipe' | 'article' | 'article_body';

export type ImageOutcome = {
  ok: boolean;
  error?: string;
  url?: string | null;
  review?: ImageReview;
  reused?: boolean;
};

const BODY_IMAGE_MARKER = /\[\[image:([a-z0-9-]+)\|([^\]]+)\]\]/g;

function publicUrl(env: ImageEnv, key: string): string | null {
  return env.IMAGES_PUBLIC_BASE_URL ? `${env.IMAGES_PUBLIC_BASE_URL}/${key}` : null;
}

async function runImageGeneration(env: ImageEnv, prompt: string, seed: string): Promise<{ ok: true; bytes: ArrayBuffer } | { ok: false; error: string }> {
  try {
    let seedNumber = 0;
    for (let i = 0; i < seed.length; i++) seedNumber = (seedNumber * 31 + seed.charCodeAt(i)) >>> 0;

    const output = (await env.AI.run(PRODUCTION_IMAGE_MODEL as keyof AiModels, {
      prompt,
      width: 1024,
      height: 768,
      guidance: 5,
      num_steps: 30,
      seed: Math.max(1, seedNumber),
    } as never)) as unknown as ReadableStream | { image?: string };

    if (output instanceof ReadableStream) {
      return { ok: true, bytes: await new Response(output).arrayBuffer() };
    }
    if (!output.image) return { ok: false, error: 'Billedmodellen returnerede ingen billeddata.' };

    const binary = atob(output.image);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return { ok: true, bytes: arr.buffer };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function latestReviewIsApproved(env: ImageEnv, entityType: EntityType, entityId: number, marker = ''): Promise<boolean> {
  const review = await env.DB
    .prepare(
      `SELECT status FROM image_reviews
       WHERE entity_type = ? AND entity_id = ? AND marker = ?
       ORDER BY id DESC LIMIT 1`
    )
    .bind(entityType, entityId, marker)
    .first<{ status: string }>();
  return review?.status === 'godkendt';
}

async function recordReview(
  env: ImageEnv,
  entityType: EntityType,
  entityId: number,
  marker: string,
  attempt: number,
  candidateUrl: string | null,
  review: ImageReview
) {
  await env.DB
    .prepare(
      `INSERT INTO image_reviews
       (entity_type, entity_id, marker, attempt, status, score, reason, observed_subject, retry_instruction, candidate_url, review_model)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      entityType,
      entityId,
      marker,
      attempt,
      review.approved ? 'godkendt' : 'afvist',
      review.score,
      review.reason,
      review.observedDish,
      review.retryInstruction,
      candidateUrl,
      IMAGE_REVIEW_MODEL
    )
    .run();
}

async function reviewedGeneration(
  env: ImageEnv,
  options: {
    entityType: 'recipe' | 'article';
    table: 'recipes' | 'articles';
    row: { id: number; slug: string };
    specificPrompt: string;
    reviewTarget: ReviewTarget;
    force?: boolean;
  }
): Promise<ImageOutcome> {
  const current = await env.DB
    .prepare(`SELECT image_status, image_url FROM ${options.table} WHERE id = ?`)
    .bind(options.row.id)
    .first<{ image_status: string; image_url: string | null }>();

  if (
    !options.force &&
    current?.image_status === 'klar' &&
    current.image_url &&
    (await latestReviewIsApproved(env, options.entityType, options.row.id))
  ) {
    return { ok: true, url: current.image_url, reused: true };
  }

  await env.DB
    .prepare(`UPDATE ${options.table} SET image_status = 'under_generering', image_prompt = ? WHERE id = ?`)
    .bind(options.specificPrompt, options.row.id)
    .run();

  let attemptPrompt = options.specificPrompt;
  let lastReview: ImageReview | undefined;
  let lastError: string | undefined;
  const runId = crypto.randomUUID();

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    // Run-id'et sikrer, at en senere genkørsel ikke producerer præcis de samme
    // afviste billeder igen på grund af et fast seed.
    const seed = `${options.row.slug}-quality-v3-${runId}-${attempt}`;
    const generated = await runImageGeneration(env, buildFullPrompt(attemptPrompt, seed), seed);
    if (!generated.ok) {
      lastError = generated.error;
      continue;
    }

    const review = await reviewGeneratedImage(env, generated.bytes, options.reviewTarget);
    lastReview = review;
    const candidateKey = `review/${options.table}/${options.row.slug}/${runId}-attempt-${attempt}.png`;
    await env.IMAGES.put(candidateKey, generated.bytes, { httpMetadata: { contentType: 'image/png' } });
    const candidateUrl = publicUrl(env, candidateKey);
    await recordReview(env, options.entityType, options.row.id, '', attempt, candidateUrl, review);

    if (review.approved) {
      // En unik URL forhindrer, at browser eller CDN viser en cachet, ældre version.
      const finalKey = `${options.table}/${options.row.slug}-${runId}.png`;
      await env.IMAGES.put(finalKey, generated.bytes, { httpMetadata: { contentType: 'image/png' } });
      const url = publicUrl(env, finalKey);
      await env.DB
        .prepare(
          `UPDATE ${options.table}
           SET image_url = ?, image_model = ?, image_status = 'klar', image_version = image_version + 1
           WHERE id = ?`
        )
        .bind(url, PRODUCTION_IMAGE_MODEL, options.row.id)
        .run();
      return { ok: true, url, review };
    }

    attemptPrompt = [
      options.specificPrompt,
      `The previous attempt was rejected by the photo editor: ${review.reason}`,
      review.retryInstruction ? `Correct it as follows: ${review.retryInstruction}` : '',
      'Make the next image a literal and unmistakable depiction of the requested subject.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  await env.DB.prepare(`UPDATE ${options.table} SET image_status = 'fejlet' WHERE id = ?`).bind(options.row.id).run();
  return {
    ok: false,
    error: lastReview
      ? `Billedet blev afvist efter ${MAX_GENERATION_ATTEMPTS} forsøg (${lastReview.score}/100): ${lastReview.reason}`
      : lastError || 'Billedgenereringen fejlede.',
    review: lastReview,
  };
}

export async function ensureRecipeImage(env: ImageEnv, recipe: RecipeRow, force = false): Promise<ImageOutcome> {
  return reviewedGeneration(env, {
    entityType: 'recipe',
    table: 'recipes',
    row: recipe,
    specificPrompt: buildRecipePrompt(recipe),
    reviewTarget: { kind: 'recipe', value: recipe },
    force,
  });
}

export async function ensureArticleImage(env: ImageEnv, article: ArticleRow, force = false): Promise<ImageOutcome> {
  return reviewedGeneration(env, {
    entityType: 'article',
    table: 'articles',
    row: article,
    specificPrompt: buildArticlePrompt(article),
    reviewTarget: { kind: 'article', value: article },
    force,
  });
}

export async function ensureArticleBodyImages(
  env: ImageEnv,
  article: { id: number; slug: string; title: string; body: string },
  force = false
): Promise<Array<{ marker: string; ok: boolean; error?: string }>> {
  const matches = [...article.body.matchAll(BODY_IMAGE_MARKER)];
  if (matches.length === 0) return [];

  const outcomes: Array<{ marker: string; ok: boolean; error?: string }> = [];
  for (const match of matches) {
    const [, marker, prompt] = match;
    await env.DB
      .prepare(
        `INSERT INTO article_images (article_id, marker, prompt) VALUES (?, ?, ?)
         ON CONFLICT(article_id, marker) DO UPDATE SET prompt = excluded.prompt`
      )
      .bind(article.id, marker, prompt.trim())
      .run();

    const row = await env.DB
      .prepare(`SELECT id, image_url, image_status FROM article_images WHERE article_id = ? AND marker = ?`)
      .bind(article.id, marker)
      .first<{ id: number; image_url: string | null; image_status: string }>();

    if (!row) {
      outcomes.push({ marker, ok: false, error: 'Kunne ikke oprette billedrækken.' });
      continue;
    }
    if (
      !force &&
      row.image_status === 'klar' &&
      row.image_url &&
      (await latestReviewIsApproved(env, 'article_body', row.id, marker))
    ) {
      outcomes.push({ marker, ok: true });
      continue;
    }

    await env.DB.prepare(`UPDATE article_images SET image_status = 'under_generering' WHERE id = ?`).bind(row.id).run();
    let attemptPrompt = prompt.trim();
    let approved = false;
    let lastReview: ImageReview | undefined;
    let lastError: string | undefined;
    const runId = crypto.randomUUID();

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
      const seed = `${article.slug}-${marker}-quality-v3-${runId}-${attempt}`;
      const generated = await runImageGeneration(env, buildFullPrompt(attemptPrompt, seed), seed);
      if (!generated.ok) {
        lastError = generated.error;
        continue;
      }

      const review = await reviewGeneratedImage(env, generated.bytes, {
        kind: 'article_body',
        title: article.title,
        prompt: prompt.trim(),
      });
      lastReview = review;
      const candidateKey = `review/articles/${article.slug}/${marker}-${runId}-attempt-${attempt}.png`;
      await env.IMAGES.put(candidateKey, generated.bytes, { httpMetadata: { contentType: 'image/png' } });
      const candidateUrl = publicUrl(env, candidateKey);
      await recordReview(env, 'article_body', row.id, marker, attempt, candidateUrl, review);

      if (review.approved) {
        const finalKey = `articles/${article.slug}/${marker}-${runId}.png`;
        await env.IMAGES.put(finalKey, generated.bytes, { httpMetadata: { contentType: 'image/png' } });
        await env.DB
          .prepare(`UPDATE article_images SET image_url = ?, image_model = ?, image_status = 'klar' WHERE id = ?`)
          .bind(publicUrl(env, finalKey), PRODUCTION_IMAGE_MODEL, row.id)
          .run();
        approved = true;
        break;
      }

      attemptPrompt = `${prompt.trim()}. Previous attempt rejected: ${review.reason}. ${review.retryInstruction}`;
    }

    if (!approved) {
      await env.DB.prepare(`UPDATE article_images SET image_status = 'fejlet' WHERE id = ?`).bind(row.id).run();
      outcomes.push({
        marker,
        ok: false,
        error: lastReview
          ? `Billedet blev afvist (${lastReview.score}/100): ${lastReview.reason}`
          : lastError || 'Billedgenereringen fejlede.',
      });
    } else {
      outcomes.push({ marker, ok: true });
    }
  }

  return outcomes;
}
