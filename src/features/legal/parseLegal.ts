export type Block = { kind: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'ol' | 'hr'; text: string; n?: string };

/** The markdown subset our legal documents use (same as the mobile app's MarkdownView).
 * shortcut: no links, tables or nesting; use a markdown package if a document ever needs them. */
export function parseLegal(source: string): Block[] {
  return source.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim()).map((line): Block => {
    const num = /^(\d+)\. (.*)$/.exec(line);
    if (line.startsWith('### ')) return { kind: 'h3', text: line.slice(4) };
    if (line.startsWith('## ')) return { kind: 'h2', text: line.slice(3) };
    if (line.startsWith('# ')) return { kind: 'h1', text: line.slice(2) };
    if (line === '---') return { kind: 'hr', text: '' };
    if (line.startsWith('- ')) return { kind: 'li', text: line.slice(2) };
    if (num) return { kind: 'ol', text: num[2], n: num[1] };
    return { kind: 'p', text: line };
  });
}
