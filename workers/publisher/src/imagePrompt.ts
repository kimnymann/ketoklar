// Den faste husstil, deles af ALLE billeder på sitet.
// Ret den her ét sted, hvis stilen skal justeres, ikke i databasen.
export const STYLE_SUFFIX =
  'Nordic food photography, natural daylight from the side, dark dusty moody background, ' +
  'tight crop, realistic food styling, clear single portion plating, matte ceramic tableware, ' +
  'shallow depth of field, muted warm tones, no text, no watermark, no people, no hands';

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

export function buildFullPrompt(recipeSpecificPrompt: string): string {
  return `${recipeSpecificPrompt}. ${STYLE_SUFFIX}.`;
}

export type ArticleForPrompt = {
  category: 'videnskab' | 'livsstil' | 'anekdote';
};

// Kategori-baseret, ikke titel-baseret: holder stilen ensartet på tværs af mange artikler,
// i stedet for at genere ét unikt scenarie pr. artikel.
const ARTICLE_CATEGORY_PROMPTS: Record<ArticleForPrompt['category'], string> = {
  videnskab:
    'Close-up editorial still life of keto staples, butter, avocado, salmon and eggs, arranged thoughtfully on a dark stone surface',
  livsstil:
    'Warm editorial still life representing a keto lifestyle, fresh ingredients and a cup of coffee on a simple wooden table, morning light',
  anekdote:
    'Cozy Danish home dining scene, a table set with hearty food and warm light, documentary lifestyle photography',
};

export function buildArticlePrompt(article: ArticleForPrompt): string {
  return ARTICLE_CATEGORY_PROMPTS[article.category];
}
