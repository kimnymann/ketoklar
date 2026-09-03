import { articleFactsForReview, recipeFactsForReview, type ArticleForPrompt, type RecipeForPrompt } from './imagePrompt';
import type { ImageEnv } from './testImages';

export const IMAGE_REVIEW_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
export const IMAGE_REVIEW_MIN_SCORE = 75;

export type ImageReview = {
  approved: boolean;
  score: number;
  reason: string;
  observedDish: string;
  retryInstruction: string;
};

export type ReviewTarget =
  | { kind: 'recipe'; value: RecipeForPrompt }
  | { kind: 'article'; value: ArticleForPrompt }
  | { kind: 'article_body'; title: string; prompt: string };

function arrayBufferToDataUrl(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < view.length; offset += chunkSize) {
    binary += String.fromCharCode(...view.subarray(offset, offset + chunkSize));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

function targetFacts(target: ReviewTarget): string {
  if (target.kind === 'recipe') return recipeFactsForReview(target.value);
  if (target.kind === 'article') return articleFactsForReview(target.value);
  return `Article: ${target.title}\nRequested image: ${target.prompt}`;
}

function parseReviewResponse(raw: unknown): ImageReview {
  let parsed: Record<string, unknown>;
  if (raw && typeof raw === 'object') {
    parsed = raw as Record<string, unknown>;
  } else if (typeof raw === 'string') {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error('Billedkontrollen returnerede ikke JSON.');
    parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
  } else {
    throw new Error('Billedkontrollen returnerede et ukendt svarformat.');
  }
  const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
  return {
    // Scoren er den autoritative beslutning. Modellen kan ellers levere
    // approved=false samtidig med fx 89/100.
    approved: score >= IMAGE_REVIEW_MIN_SCORE,
    score,
    reason: String(parsed.reason || 'Ingen begrundelse fra billedkontrollen.'),
    observedDish: String(parsed.observed_dish || ''),
    retryInstruction: String(parsed.retry_instruction || ''),
  };
}

export async function reviewGeneratedImage(
  env: ImageEnv,
  imageBytes: ArrayBuffer,
  target: ReviewTarget
): Promise<ImageReview> {
  const isRecipe = target.kind === 'recipe';
  const prompt = [
    'You are the strict photo editor for a Danish food magazine. Judge whether the supplied generated image accurately matches the content facts below.',
    targetFacts(target),
    isRecipe
      ? 'Approve only when the type of dish and its primary visible components match. Reject obvious invented edible items anywhere in the image, including side dishes and background food, a wrong protein, a wrong dish form, or a garnish that changes what the recipe appears to contain. Do not reject because melted, blended or minor seasoning ingredients are not individually visible.'
      : 'Approve only when the image is clearly relevant to the requested article concept. Reject generic or contradictory imagery and visible text.',
    'Scoring rubric: 90-100 is an accurate match; 75-89 has the correct dish and ingredients with only minor cosmetic variation; 40-74 has a missing or invented key food or an unclear dish form; 0-39 is the wrong dish.',
    `Minor differences in browning, chopping, placement or styling must not push an otherwise correct image below ${IMAGE_REVIEW_MIN_SCORE}. approved must be true at ${IMAGE_REVIEW_MIN_SCORE} or higher and false below it.`,
    'Return JSON only with: approved, score, reason, observed_dish, retry_instruction. Keep the reason and retry instruction concise.',
  ].join('\n\n');

  try {
    const result = (await env.AI.run(IMAGE_REVIEW_MODEL as keyof AiModels, {
      messages: [
        { role: 'system', content: 'You verify generated editorial images against supplied facts. Be conservative and return only valid JSON.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: arrayBufferToDataUrl(imageBytes) } },
          ],
        },
      ],
      guided_json: {
        type: 'object',
        properties: {
          approved: { type: 'boolean' },
          score: { type: 'number' },
          reason: { type: 'string' },
          observed_dish: { type: 'string' },
          retry_instruction: { type: 'string' },
        },
        required: ['approved', 'score', 'reason', 'observed_dish', 'retry_instruction'],
      },
      max_tokens: 260,
      temperature: 0,
    } as never)) as unknown as { response?: unknown };

    if (!result.response) throw new Error('Billedkontrollen returnerede intet svar.');
    return parseReviewResponse(result.response);
  } catch (error) {
    return {
      approved: false,
      score: 0,
      reason: `Automatisk billedkontrol fejlede: ${String(error)}`,
      observedDish: '',
      retryInstruction: 'Generate a literal, simple presentation of the requested subject without any extra food or props.',
    };
  }
}
