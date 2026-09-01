// Simpel egen-bygget parser, ingen ekstern markdown-pakke.
// Understøtter: "## " mellemrubrik, "> " citat/pull-quote, "[[recipe:slug]]" indlejret
// opskriftskort, og almindelige afsnit med "[tekst](url)" inline-links.

export type ArticleBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; html: string }
  | { type: 'quote'; text: string }
  | { type: 'recipe'; slug: string };

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// [tekst](url) bliver til et rigtigt link, **tekst** bliver fed, resten escapes for en sikkerheds skyld
function renderInlineLinks(text: string): string {
  const escaped = escapeHtml(text);
  const withLinks = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
    return `<a href="${url}" class="ketoklar-inline-link">${label}</a>`;
  });
  return withLinks.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

export function parseArticleBody(body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const paragraphs = body.split(/\n\s*\n/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', text: trimmed.slice(3).trim() });
      continue;
    }

    const recipeMatch = trimmed.match(/^\[\[recipe:([a-z0-9-]+)\]\]$/);
    if (recipeMatch) {
      blocks.push({ type: 'recipe', slug: recipeMatch[1] });
      continue;
    }

    const lines = trimmed.split('\n');
    if (lines.length > 0 && lines.every((l) => l.trim().startsWith('> '))) {
      const quoteText = lines.map((l) => l.trim().slice(2).trim()).join(' ');
      blocks.push({ type: 'quote', text: quoteText });
      continue;
    }

    blocks.push({ type: 'paragraph', html: renderInlineLinks(trimmed) });
  }
  return blocks;
}
