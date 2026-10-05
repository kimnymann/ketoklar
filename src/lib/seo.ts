export const SITE_URL = 'https://ketoklar.dk';

export function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_URL).toString();
}

export function toIsoDateTime(value: string | null): string | undefined {
  if (!value) return undefined;
  const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// Draft edits are not public updates. Keep all public date signals consistent.
export function articleDates(publishedAt: string | null, updatedAt?: string | null) {
  const published = toIsoDateTime(publishedAt);
  const updated = toIsoDateTime(updatedAt ?? null);
  const modified = published && updated && Date.parse(updated) > Date.parse(published)
    ? updated : undefined;
  return { published, modified, lastmod: modified ?? published };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
