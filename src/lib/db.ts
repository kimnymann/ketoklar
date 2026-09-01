export type Recipe = {
  id: number;
  slug: string;
  title: string;
  category: 'morgen' | 'frokost' | 'aften' | 'laekkerier';
  servings: number;
  prep_minutes: number | null;
  ingredients_json: string;
  instructions: string;
  kcal: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  protein_g: number | null;
  image_url: string | null;
  status: string;
  locked: number;
  published_at: string | null;
};

export type Article = {
  id: number;
  slug: string;
  title: string;
  category: 'videnskab' | 'livsstil' | 'anekdote';
  excerpt: string | null;
  body: string;
  locked: number;
  status: string;
  published_at: string | null;
};

export const CATEGORY_LABELS: Record<Recipe['category'], string> = {
  morgen: 'Morgen',
  frokost: 'Frokost',
  aften: 'Aften',
  laekkerier: 'Lækkerier',
};
