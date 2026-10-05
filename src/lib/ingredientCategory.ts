// Simpel, ordbogsbaseret kategorisering af ingredienser til indkøbslisten.
// Ingen ændring af selve datamodellen nødvendig, virker på alle opskrifter,
// gamle som nye, ud fra navnet på ingrediensen.

export type IngredientCategory = 'Mejeri og æg' | 'Kød og fisk' | 'Frugt og grønt' | 'Kolonial' | 'Frost' | 'Andet';

const CATEGORY_ORDER: IngredientCategory[] = ['Kød og fisk', 'Mejeri og æg', 'Frugt og grønt', 'Kolonial', 'Frost', 'Andet'];

const KEYWORDS: Record<Exclude<IngredientCategory, 'Andet'>, string[]> = {
  'Kød og fisk': [
    'kylling', 'oksemørbrad', 'flæskesteg', 'bacon', 'laks', 'tun', 'roastbeef',
    'kyllingebryst', 'kyllingelårfilet', 'mørbrad', 'oksekød', 'svinekød', 'skinke', 'pølse',
  ],
  'Mejeri og æg': [
    'æg', 'æggehvide', 'mælk', 'fløde', 'smør', 'ost', 'feta', 'flødeost', 'yoghurt', 'skyr', 'parmesan', 'mozzarella',
  ],
  'Frugt og grønt': [
    'broccoli', 'spinat', 'avocado', 'citron', 'grønkål', 'blomkål', 'spidskål', 'salat', 'romainesalat',
    'løg', 'hvidløg', 'tomat', 'agurk', 'peberfrugt', 'bær', 'æble',
  ],
  Kolonial: [
    'mel', 'kokosmel', 'sødemiddel', 'karry', 'salt', 'peber', 'mayo', 'remoulade', 'chokolade', 'kakao',
    'nødder', 'valnødder', 'peanutbutter', 'kokosolie', 'olie', 'eddike', 'bouillon', 'chiafrø', 'kanel',
  ],
  Frost: ['frost', 'frosne', 'is'],
};

export function categorizeIngredient(name: string): IngredientCategory {
  const lower = name.toLowerCase();
  for (const category of CATEGORY_ORDER) {
    if (category === 'Andet') continue;
    const words = KEYWORDS[category as Exclude<IngredientCategory, 'Andet'>];
    if (words.some((w) => lower.includes(w))) {
      return category;
    }
  }
  return 'Andet';
}

export type Ingredient = { name: string; amount: number; unit: string };

export function groupIngredientsByCategory(ingredients: Ingredient[]): Array<{ category: IngredientCategory; items: Ingredient[] }> {
  const groups = new Map<IngredientCategory, Ingredient[]>();
  for (const ing of ingredients) {
    const cat = categorizeIngredient(ing.name);
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(ing);
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((c) => ({ category: c, items: groups.get(c)! }));
}

// Bevar forkortelser i sætningen, når ældre opskriftstekster opdeles i trin.
export function splitInstructionsIntoSteps(instructions: string): string[] {
  const fragments = instructions
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const steps: string[] = [];
  const abbreviation = /\b(?:pr|ca|fx|f\.eks|bl\.a|dvs|d\.v\.s|evt|hhv|inkl|ekskl|stk|tsk|spsk)\.$/i;
  for (const fragment of fragments) {
    const previous = steps.at(-1);
    if (previous && abbreviation.test(previous)) {
      steps[steps.length - 1] = `${previous} ${fragment}`;
    } else {
      steps.push(fragment);
    }
  }
  return steps;
}
