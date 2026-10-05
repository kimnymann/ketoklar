// Den faste kerne-stil deles af alle billeder, så siden opleves som fotograferet
// af den samme redaktion, selv om motiv og lys varierer.
const CORE_STYLE =
  'Nordic editorial food photography, appetizing but natural, realistic food textures, ' +
  'one clearly presented serving, tight crop, clean uncluttered scene, empty background without other food, ' +
  'shallow depth of field, no text, no watermark, no people, no hands';

const SCENE_VARIANTS = [
  'dark charcoal slate surface, soft side lighting',
  'light rustic oak table, soft natural daylight',
  'dark aged wood table, soft afternoon light',
  'pale linen tablecloth, bright airy light',
  'weathered stone counter, gentle window light',
  'muted grey concrete surface, soft overcast daylight',
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

// These briefs are checked against the recipes. Full facts go to the reviewer;
// generation gets a concise description of the finished food.
const VISUAL_OVERRIDES: Record<string, string> = {
  'aeg-i-cocotte-skinke': 'One white ceramic ramekin containing two whole baked eggs, two soft golden yolks in set whites, diced cooked ham, a little cream and melted grated parmesan. Chopped chives on top. Ramekin on an empty plate. No bread.',
  'spidskaalswraps-roeget-laks': 'Four cut halves of two wraps made entirely from thin blanched pale green pointed cabbage leaves with visible cabbage veins. Filled with folded pink smoked salmon, white dill cream cheese and cucumber sticks. Cut ends reveal filling. Empty ceramic plate. No tortilla, bread or extra vegetables.',
  'mandelboller-solsikkekerner': 'Two small round golden almond flour buns with sunflower seeds baked on top. One bun cut open revealing a moist dense fine crumb. Plain serving without butter, toppings or other food.',
  'kyllingesalat-selleri-valnoedder': 'Chunky creamy chicken salad on little gem lettuce leaves: diced cooked white chicken breast, thin pale green celery slices, chopped toasted walnuts, white mayonnaise and creme fraiche dressing with tiny dried tarragon flecks. A few walnut pieces on top. No corn, tomatoes, grapes or bread.',
  'portobellopizza-mozzarella-skinke': 'Two large brown portobello mushroom caps as pizza bases, with clearly visible thick curved mushroom edges. Thin tomato passata, short cooked pink ham strips and melted grated mozzarella with browned spots. Small side of rocket leaves. No bread, pizza dough, basil or cherry tomatoes.',
  'citronkylling-oliven-broccoli': 'Two small roasted bone-in chicken thighs with crisp golden skin, roasted broccoli florets with browned edges and pitted green olives. A small amount of thin golden pan juices. Lemon juice and zest used in cooking, no lemon pieces on the plate. No cream sauce or extra garnish.',
  'andebryst-roedkaal-timiansky': 'One sliced fully cooked duck breast with light brown interior, crosshatched crisp brown skin, sliced about 1 cm thick. Butter fried finely sliced purple red cabbage alongside, small pool of thin brown pan jus. No berries, mash, fresh herb sprigs or garnish.',
  'mandelsmaakager-kanel-appelsinskal': 'Two small plain round almond cookies, one broken showing fine crumb, about 5 cm diameter and 7 mm thick. Pale golden with darker baked edges and tiny cinnamon and orange zest flecks baked into dough. No almond flakes, nuts on top, orange pieces, icing sugar or garnish.',
  'chokoladetroefler-tahin-kakao': 'Small hand rolled slightly irregular round dark chocolate truffles thinly coated in dry cocoa powder. One cut open showing dense smooth dark chocolate ganache. Tahini blended inside is invisible. No sesame seeds, nuts, chocolate shavings or garnish.',
  'ostevafler-uden-mel':
    'Exactly two bare savoury cheese waffles on an otherwise empty plate. Their entire top surfaces are exposed golden-brown waffle grids with crisp lacy toasted-cheese edges. All grid pockets are empty. The waffles consist of egg and mozzarella baked together in a waffle iron. Only the two waffles are visible on the plate. Plain unadorned serving, empty tabletop.',
  'omelet-champignon-gedeost':
    'One folded semicircular omelette made from beaten eggs, lightly golden and tender, filled with browned sliced mushrooms and soft white goat cheese, with a little chopped parsley. The filling peeks out at the folded edge. All eggs form the omelette itself: no separate fried egg, no round yolk on top, no additional side dishes.',
  'varm-kokosgroed-chia-kardemomme':
    'One ceramic bowl of thick spoonable warm off-white coconut porridge, uniformly mixed with hydrated tiny black chia seeds and fine shredded coconut. One small soft white dollop of plain Greek yoghurt on top. Ground cardamom mixed in and invisible. No granola, brown topping, fruit, nuts, eggs, whole spice pods or piles of seeds or coconut on top.',
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
  // Older overrides were not all checked for complete visible components.
  if (['ostevafler-uden-mel', 'omelet-champignon-gedeost', 'varm-kokosgroed-chia-kardemomme',
    'aeg-i-cocotte-skinke', 'spidskaalswraps-roeget-laks', 'mandelboller-solsikkekerner',
    'kyllingesalat-selleri-valnoedder', 'portobellopizza-mozzarella-skinke',
    'citronkylling-oliven-broccoli', 'andebryst-roedkaal-timiansky',
    'mandelsmaakager-kanel-appelsinskal', 'chokoladetroefler-tahin-kakao'].includes(recipe.slug)) {
    return `Photograph the finished food: ${VISUAL_OVERRIDES[recipe.slug]} The serving is alone; the surrounding table is empty.`;
  }
  return [
    `Create a photorealistic food photograph of the finished Danish keto dish "${recipe.title}".`,
    VISUAL_OVERRIDES[recipe.slug] ? `Finished appearance: ${VISUAL_OVERRIDES[recipe.slug]}` : '',
    recipeFactsForReview(recipe),
    'Depict the cooked, finished result exactly as described. The dish type, texture and main visible components must be immediately recognisable.',
    'Do not invent food. Do not add bread, rice, pasta, potatoes, fruit, vegetables, meat, fish, sauces, herbs, garnish or toppings unless they are explicitly included in the allowed ingredient list.',
    'Do not place raw ingredients, ingredient bowls or unrelated food props around the serving. Ingredients that melt, blend or are used only for cooking do not need to remain separately visible.',
  ].join(' ');
}

export function buildFullPrompt(specificPrompt: string, seed: string, kind: 'recipe' | 'article' = 'recipe'): string {
  if (kind === 'article') {
    return `${specificPrompt} Style: Nordic editorial photography, realistic materials, natural window light, coherent uncluttered composition, landscape format, no watermark, no lettering. Let the requested subject determine the setting and props; food and tableware are not required.`;
  }
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

const ARTICLE_VISUAL_CONCEPTS: Record<string, string> = {
  'kulhydrater-paa-keto-laes-naeringsdeklarationen': 'An adult reading the small back nutrition panel of an unbranded yoghurt tub beside a small bowl of plain yoghurt on a kitchen scale. The panel is blurred and unreadable, with no legible figures or claims. This illustrates checking a food label and weighing a portion, not a nutritional recommendation. Quiet kitchen, no extra food props.',
  'hvad-spiser-man-paa-keto-enkle-maaltider': 'One realistic everyday dinner plate with sliced cooked chicken breast, green broccoli, a modest serving of avocado and a little olive oil. Natural Danish home dining table, plain ceramic plate, no special diet products, no excessive butter, no health symbols or text.',
  'ketose-saadan-virker-det': 'Close-up product photograph: a small handheld blood ketone testing meter with a completely blank dark display, next to two narrow unmarked test strips, isolated on a seamless pale grey studio surface. Exactly these three objects and nothing else. Empty background. No cutlery, fabric, table setting, food, letters, logos, blood or needles. A neutral illustration of measurement equipment, with no medical results shown.',
  'start-paa-keto-kold-tyrker-eller-gradvis': 'An everyday kitchen counter showing preparation for a dietary change: a CLOSED notebook with a plain unmarked beige cover and a shopping basket containing recognisable eggs, avocado and leafy greens. The notebook has no visible pages, lettering, label or logo. No plated meal. The subject is shopping and practical preparation for a new eating routine.',
  'faste-typer-maaltider-og-laengere-faste': 'A simple empty ceramic dinner plate beside a clear glass of water and an analogue clock with plain tick marks and no numerals. Calm morning light on a dining table. No food. The empty place setting and clock together symbolise an eating window and a pause between meals.',
};

export function articleFactsForReview(article: ArticleForPrompt): string {
  const context = cleanArticleText(article.excerpt || article.body).slice(0, 700);
  const concept = ARTICLE_VISUAL_CONCEPTS[article.slug];
  return `Article title: ${article.title}\nArticle context: ${context}${concept ? `\nIntended visual concept: ${concept}` : ''}`;
}

export function buildArticlePrompt(article: ArticleForPrompt): string {
  const concept = ARTICLE_VISUAL_CONCEPTS[article.slug];
  if (concept) return `Create a photorealistic editorial photograph. ${concept}`;
  return [
    `Create a photorealistic editorial hero image specifically illustrating the article "${article.title}".`,
    articleFactsForReview(article),
    ARTICLE_CATEGORY_PROMPTS[article.category],
    'Use one clear visual idea from the article context. Avoid a generic collection of random keto ingredients. No lettering, diagrams, medical claims or text inside the image.',
  ].join(' ');
}
