import { describe, expect, it } from 'vitest';
import { parseLegal } from '../../../src/features/legal/parseLegal';
import md from '../../../src/features/legal/terms-and-conditions.md?raw';

describe('terms and conditions', () => {
  it('has all 30 sections', () => {
    expect(parseLegal(md).filter((b) => b.kind === 'h2' && /^\d+\. /.test(b.text))).toHaveLength(30);
  });

  it('parses the markdown subset', () => {
    expect(parseLegal('# T\n\n## 1. A\n### B\n- x\n2. y\n---\n**b** z')).toEqual([
      { kind: 'h1', text: 'T' }, { kind: 'h2', text: '1. A' }, { kind: 'h3', text: 'B' },
      { kind: 'li', text: 'x' }, { kind: 'ol', text: 'y', n: '2' }, { kind: 'hr', text: '' },
      { kind: 'p', text: '**b** z' },
    ]);
  });
});
