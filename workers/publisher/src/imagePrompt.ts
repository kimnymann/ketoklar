// Den faste kerne-stil deles af alle billeder, så siden opleves som fotograferet
// af den samme redaktion, selv om motiv og lys varierer.
const CORE_STYLE =
  'Nordic editorial food photography, appetizing but natural, realistic food textures, ' +
  'one clearly presented serving, tight crop, clean uncluttered scene, empty background without other food, ' +
  'shallow depth of field, no text, no watermark, no people, no hands';

const SCENE_VARIANTS = [
  'dark charcoal slate surface, matte black ceramic plate, moody side lighting',
  'light rustic oak table, cream stoneware bowl, soft natural daylight',
  'dark aged wood table, brushed copper plate, warm afternoon light',
  'pale linen tablecloth, white speckled ceramic plate, bright airy light',
  'weathered dark stone counter, terracotta dish, warm golden-hour light',
  'muted grey concrete surface, matte sage-green ceramic plate, soft overcast daylight',
];

function pickSceneVariant(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SCENE_VARIANTS[hash % SCENE_VARIANTS.length];
}

export type RecipeIngredient = {
  name: string;
  amount?: number;
  unit?: string;
};

export type RecipeForPrompt = {
  slug: string;
  title: string;
  category: 'morgen' | 'frokost' | 'aften' | 'laekkerier';
  ingredients_json: string;
  instructions: string;
};

// Overrides beskriver kun rettens visuelle identitet. Ingredienslisten og
// fremgangsmåden sendes stadig med, så et override aldrig erstatter fakta.
const VISUAL_OVERRIDES: Record<string, string> = {
  'kokosmakroner':
    'Small golden-brown coconut macaroon mounds with a crisp toasted exterior and visible shredded coconut texture, stacked on a plate.',
  'cheesecake-i-glas':
    'No-bake cheesecake mousse served in a small glass jar, with a smooth pale cream layer and no crust.',
  'kyllingelaarfilet-karrysauce':
    'Sliced chicken thigh pieces in a golden curry cream sauce with cabbage, served in a shallow bowl.',
  'caesarsalat-kylling':
    'Torn romaine lettuce with sliced grilled chicken and shaved parmesan in a bowl; absolutely no pasta.',
  'tunmousse-avocado':
    'Tuna mousse with visible flaked tuna texture, filled into a halved avocado.',
  'flaeskesteg-skysovs-groenkaal':
    'Sliced Danish roast pork with crisp crackling, dark gravy and sautéed kale on the side.',
  'oksemoerbrad-blomkaalsmos':
    'A pan-seared beef tenderloin medallion, sliced open to reveal a pink medium-rare centre, served whole on cauliflower mash; not diced or cubed.',
  'roraeg-roeget-laks-purloeg':
    'Soft creamy scrambled egg curds with small folded pieces of smoked salmon mixed through and finely chopped chives on top; no whole fish fillet.',
  'chiagroed-kokosmaelk-mandler':
    'A thick pale coconut chia pudding with clearly visible chia seeds, topped only with roughly chopped toasted almonds and a light dusting of cinnamon; no fruit, cheese, butter cubes or yellow sauce.',
};

export function parseRecipeIngredients(recipe: RecipeForPrompt): RecipeIngredient[] {
  try {
    const parsed = JSON.parse(recipe.ingredients_json);
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.name === 'string') : [];
  } catch {
    return [];
  }
}

function readableIngredientName(name: string): string {
  const [main, modifier] = name.split(',').map((part) => part.trim());
  return modifier ? `${modifier} ${main}` : main;
}

export function recipeFactsForReview(recipe: RecipeForPrompt): string {
  const ingredients = parseRecipeIngredients(recipe).map((item) => readableIngredientName(item.name));
  return [
    `Dish title: ${recipe.title}`,
    `Allowed food ingredients: ${ingredients.join(', ') || 'not supplied'}`,
    `How the finished dish is prepared: ${recipe.instructions}`,
    VISUAL_OVERRIDES[recipe.slug] ? `Required visual identity: ${VISUAL_OVERRIDES[recipe.slug]}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// Prompten indeholder alle ingredienser og tilberedningen. Modellen får dermed
// både råvarerne og den færdige form i stedet for kun fire løsrevne ord.
export function buildRecipePrompt(recipe: RecipeForPrompt): string {
  return [
    `Create a photorealistic food photograph of the finished Danish keto dish "${recipe.title}".`,
    recipeFactsForReview(recipe),
    'Depict the cooked, finished result exactly as described. The dish type, texture and main visible components must be immediately recognisable.',
    'Do not invent food. Do not add bread, rice, pasta, potatoes, fruit, vegetables, meat, fish, sauces, herbs, garnish or toppings unless they are explicitly included in the allowed ingredient list.',
    'Do not place raw ingredients, ingredient bowls or unrelated food props around the serving. Ingredients that melt, blend or are used only for cooking do not need to remain separately visible.',
  ].join(' ');
}

export function buildFullPrompt(specificPrompt: string, seed: string): string {
  return `${specificPrompt} Scene: ${pickSceneVariant(seed)}. Style: ${CORE_STYLE}.`;
}

export type ArticleForPrompt = {
  slug: string;
  title: string;
  category: 'videnskab' | 'livsstil' | 'anekdote';
  excerpt?: string | null;
  body: string;
};

const ARTICLE_CATEGORY_PROMPTS: Record<ArticleForPrompt['category'], string> = {
  videnskab: 'Evidence-led editorial still life with a precise, calm and credible visual mood.',
  livsstil: 'Warm documentary-style editorial still life from an everyday Danish keto life.',
  anekdote: 'Characterful Danish home or dining scene with gentle humour and lived-in details.',
};

function cleanArticleText(value: string): string {
  return value
    .replace(/\[\[image:[^\]]+\]\]/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function articleFactsForReview(article: ArticleForPrompt): string {
  const context = cleanArticleText(article.excerpt || article.body).slice(0, 700);
  return `Article title: ${article.title}\nArticle context: ${context}`;
}

export function buildArticlePrompt(article: ArticleForPrompt): string {
  return [
    `Create a photorealistic editorial hero image specifically illustrating the article "${article.title}".`,
    articleFactsForReview(article),
    ARTICLE_CATEGORY_PROMPTS[article.category],
    'Use one clear visual idea from the article context. Avoid a generic collection of random keto ingredients. No lettering, diagrams, medical claims or text inside the image.',
  ].join(' ');
}
