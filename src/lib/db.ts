export type Recipe = {
  id: number;
  slug: string;
  title: string;
  category: 'morgen' | 'frokost' | 'aften' | 'laekkerier';
  servings: number;
  prep_minutes: number | null;
  ingredients_json: string;
  instructions: string;
  tips: string | null;
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
  image_url: string | null;
  locked: number;
  status: string;
  published_at: string | null;
  updated_at?: string | null;
};

export const CATEGORY_LABELS: Record<Recipe['category'], string> = {
  morgen: 'Morgen',
  frokost: 'Frokost',
  aften: 'Aften',
  laekkerier: 'Lækkerier',
};

// D1 gemmer datoer som "YYYY-MM-DD HH:MM:SS" (UTC, uden T/Z), Safari kan ikke parse det
// direkte, så vi omformer til ISO-format, før det gives til Date.
export function formatPublishedDate(publishedAt: string | null): string {
  if (!publishedAt) return '';
  const iso = publishedAt.includes('T') ? publishedAt : publishedAt.replace(' ', 'T') + 'Z';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
