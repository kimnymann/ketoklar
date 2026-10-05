import type { ArticleBlock } from './articleBody';

export type EnhancedArticleBlock = ArticleBlock
  | { type: 'shoppingChecklist'; items: string[] }
  | { type: 'mealCards'; items: { title: string; html: string }[]; kind: 'lunch' | 'dinner' };

// Enhance only the intended article. The database text stays readable on its own.
export function enhanceArticleBlocks(slug: string, blocks: ArticleBlock[]): EnhancedArticleBlock[] {
  if (slug !== 'keto-travl-hverdag-indkoeb-madpakker') return blocks;
  const result: EnhancedArticleBlock[] = [];
  let section = '';
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'heading') section = block.text;
    if (section === 'En basisindkøbsliste' && block.type === 'list') {
      result.push({ type: 'shoppingChecklist', items: block.items });
      continue;
    }
    const kind = section === 'Tre madpakker uden brødbagning' ? 'lunch'
      : section === 'Tre hurtige aftensmåltider' ? 'dinner' : null;
    if (kind && block.type === 'paragraph') {
      const candidates = blocks.slice(i, i + 3);
      const cards = candidates.map(b => b.type === 'paragraph'
        ? b.html.match(/^<strong>([^<]+)<\/strong>\s*([\s\S]+)$/) : null);
      if (cards.length === 3 && cards.every(Boolean)) {
        result.push({ type: 'mealCards', kind, items: cards.map(m => ({
          title: m![1].replace(/^Madpakke \d+: /, '').replace(/[.:]$/, ''), html: m![2],
        })) });
        i += 2;
        continue;
      }
    }
    result.push(block);
  }
  return result;
}
