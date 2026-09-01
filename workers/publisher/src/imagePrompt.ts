// Den faste kerne-stil, deles af ALLE billeder på sitet, holder det til "én fotograf".
const CORE_STYLE =
  'Nordic food photography, tight crop, realistic food styling, clear single portion plating, ' +
  'shallow depth of field, no text, no watermark, no people, no hands';

// Roterende scene-varianter: overflade, tallerken og lys varierer, men kerne-stilen ovenfor
// holder det hele sammen som ét visuelt univers i stedet for tilfældige enkeltbilleder.
// Ret listen her ét sted, hvis I vil justere eller udvide variationen.
const SCENE_VARIANTS = [
  'dark charcoal slate surface, matte black ceramic plate, moody side lighting',
  'light rustic oak table, cream stoneware bowl, soft natural daylight',
  'dark aged wood table, brushed copper plate, warm afternoon light',
  'pale linen tablecloth, white speckled ceramic plate, bright airy light',
  'weathered dark stone counter, terracotta dish, warm golden-hour light',
  'muted grey concrete surface, matte sage-green ceramic plate, soft overcast daylight',
];

// Stabil, men varieret: samme "seed" (fx en slug) giver altid samme variant, så en
// regenerering af det samme billede ikke tilfældigt skifter stil, men to forskellige
// opskrifter eller artikler næsten aldrig lander på samme variant ved siden af hinanden.
function pickSceneVariant(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SCENE_VARIANTS[hash % SCENE_VARIANTS.length];
}

export type RecipeForPrompt = {
  title: string;
  category: 'morgen' | 'frokost' | 'aften' | 'laekkerier';
  ingredients_json: string;
};

// Kun den ret-specifikke del gemmes i databasen (recipes.image_prompt).
// Den fulde prompt sendt til billedmodellen er altid: buildFullPrompt(...)
export function buildRecipePrompt(recipe: RecipeForPrompt): string {
  const ingredients = JSON.parse(recipe.ingredients_json) as Array<{ name: string }>;
  const mainIngredients = ingredients.slice(0, 4).map((i) => i.name).join(', ');
  const mealContext: Record<RecipeForPrompt['category'], string> = {
    morgen: 'morgenmadsret',
    frokost: 'frokostret',
    aften: 'aftensmadsret',
    laekkerier: 'dessert eller snack',
  };
  return `${recipe.title}, en dansk keto ${mealContext[recipe.category]} med ${mainIngredients}`;
}

// "seed" bestemmer hvilken scene-variant der bruges, brug fx opskriftens eller artiklens
// slug (eventuelt kombineret med en billedmarkør), så variationen er stabil ved regenerering.
export function buildFullPrompt(specificPrompt: string, seed: string): string {
  return `${specificPrompt}. ${pickSceneVariant(seed)}. ${CORE_STYLE}.`;
}

export type ArticleForPrompt = {
  category: 'videnskab' | 'livsstil' | 'anekdote';
};

// Kategori-baseret, ikke titel-baseret: holder stilen ensartet på tværs af mange artikler,
// i stedet for at genere ét unikt scenarie pr. artikel.
const ARTICLE_CATEGORY_PROMPTS: Record<ArticleForPrompt['category'], string> = {
  videnskab:
    'Close-up editorial still life of keto staples, butter, avocado, salmon and eggs, arranged thoughtfully',
  livsstil:
    'Warm editorial still life representing a keto lifestyle, fresh ingredients and a cup of coffee',
  anekdote:
    'Cozy Danish home dining scene, a table set with hearty food, documentary lifestyle photography',
};

export function buildArticlePrompt(article: ArticleForPrompt): string {
  return ARTICLE_CATEGORY_PROMPTS[article.category];
}
