import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { absoluteUrl, toIsoDateTime } from '../lib/seo';

type SitemapRow = { slug: string; published_at: string | null; updated_at?: string | null };

const escapeXml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const db = env.DB;
  const [{ results: recipes }, { results: articles }] = await Promise.all([
    db.prepare(`
      SELECT slug, published_at FROM recipes
      WHERE status = 'godkendt' AND published_at IS NOT NULL AND published_at <= datetime('now')
      ORDER BY published_at DESC
    `).all<SitemapRow>(),
    db.prepare(`
      SELECT slug, published_at, updated_at FROM articles
      WHERE status = 'godkendt' AND published_at IS NOT NULL AND published_at <= datetime('now')
      ORDER BY published_at DESC
    `).all<SitemapRow>(),
  ]);

  const staticPaths = [
    '/',
    '/opskrifter',
    '/opskrifter?kategori=morgen',
    '/opskrifter?kategori=frokost',
    '/opskrifter?kategori=aften',
    '/opskrifter?kategori=laekkerier',
    '/artikler',
    '/artikler/anekdoter',
    '/om-kim-sax',
  ];

  const urls = [
    ...staticPaths.map((path) => ({ loc: absoluteUrl(path) })),
    ...recipes.map((recipe) => ({
      loc: absoluteUrl(`/opskrifter/${recipe.slug}`),
      lastmod: toIsoDateTime(recipe.published_at),
    })),
    ...articles.map((article) => ({
      loc: absoluteUrl(`/artikler/${article.slug}`),
      lastmod: toIsoDateTime(article.updated_at ?? article.published_at),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `
    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
};
