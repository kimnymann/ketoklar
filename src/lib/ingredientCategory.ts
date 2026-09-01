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
    'æg', 'æggehvide', 'mælk', 'fløde', 'smør', 'ost', 'feta', 'flødeost', 'yoghurt', 'skyr', 'parmesan',
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

// Splitter en instruktionstekst i nummererede trin. Vores opskrifter er skrevet som
// almindelige sætninger adskilt af punktum, så det er det, der bruges som skilletegn.
export function splitInstructionsIntoSteps(instructions: string): string[] {
  return instructions
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
