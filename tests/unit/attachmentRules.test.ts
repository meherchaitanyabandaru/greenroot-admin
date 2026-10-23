import { describe, expect, it } from 'vitest';
import { attachmentProblem } from '../../src/features/attachments/attachmentRules';

const file = (name: string, type: string, size: number) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('attachmentProblem', () => {
  it('accepts photos and documents up to 20 MB', () => {
    expect(attachmentProblem(file('scan.pdf', 'application/pdf', 5e6))).toBe('');
    expect(attachmentProblem(file('licence.JPG', 'image/jpeg', 2e6))).toBe('');
    expect(attachmentProblem(file('rates.xlsx', '', 1e5))).toBe('');
  });
  it('refuses videos, other formats and big files', () => {
    expect(attachmentProblem(file('clip.mp4', 'video/mp4', 1e6))).toMatch(/Videos/);
    expect(attachmentProblem(file('clip.jpg', 'video/mp4', 1e6))).toMatch(/Videos/);
    expect(attachmentProblem(file('setup.exe', 'application/x-msdownload', 1e6))).toMatch(/Only photos/);
    expect(attachmentProblem(file('page.html', 'text/html', 1e3))).toMatch(/Only photos/);
    expect(attachmentProblem(file('big.pdf', 'application/pdf', 600 * 1024 * 1024))).toMatch(/limit is 20 MB/);
  });
});
