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
  slug: string;
  title: string;
  category: 'morgen' | 'frokost' | 'aften' | 'laekkerier';
  ingredients_json: string;
};

// Nogle retter beskrives dårligt af en simpel ingrediensliste, modellen har intet at
// forestille sig formen og anretningen ud fra ("kokosmakroner" bliver bare "en dessert").
// Her overstyres med en konkret visuel beskrivelse af, hvordan retten faktisk ser ud.
// Tilføj flere her, i takt med at vi opdager billeder, der ikke rammer retten.
const VISUAL_OVERRIDES: Record<string, string> = {
  'kokosmakroner':
    'small golden-brown coconut macaroon mounds with a crisp toasted exterior and visible shredded coconut texture, stacked on a plate',
  'cheesecake-i-glas':
    'no-bake cheesecake mousse served in a small glass jar, smooth pale cream layer, no crust, a small spoon resting beside it',
  'kyllingelaarfilet-karrysauce':
    'sliced chicken thigh pieces served in a golden yellow curry cream sauce with cabbage, in a shallow bowl',
  'caesarsalat-kylling':
    'a Caesar salad in a bowl with torn romaine lettuce leaves, sliced grilled chicken on top, and shaved parmesan, no pasta',
  'tunmousse-avocado':
    'tuna mousse with visible flaked tuna texture, filled into a halved avocado, served on a plate',
  'flaeskesteg-skysovs-groenkaal':
    'sliced Danish roast pork with crispy crackling on top, dark gravy, and sautéed kale on the side',
  'oksemoerbrad-blomkaalsmos':
    'a pan-seared whole beef tenderloin medallion, sliced open to show a pink medium-rare center, served whole on cauliflower mash, not diced or cubed',
};

// Kun den ret-specifikke del gemmes i databasen (recipes.image_prompt).
// Den fulde prompt sendt til billedmodellen er altid: buildFullPrompt(...)
export function buildRecipePrompt(recipe: RecipeForPrompt): string {
  if (VISUAL_OVERRIDES[recipe.slug]) {
    return `${recipe.title}, ${VISUAL_OVERRIDES[recipe.slug]}`;
  }
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
