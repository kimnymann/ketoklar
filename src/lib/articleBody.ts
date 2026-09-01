// Meget simpel parser: linjer der starter med "## " bliver mellemrubrikker,
// resten grupperes i afsnit adskilt af tomme linjer. Ingen ekstern markdown-pakke nødvendig.
export type ArticleBlock = { type: 'heading' | 'paragraph'; text: string };

export function parseArticleBody(body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const paragraphs = body.split(/\n\s*\n/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', text: trimmed.slice(3).trim() });
    } else {
      blocks.push({ type: 'paragraph', text: trimmed });
    }
  }
  return blocks;
}
