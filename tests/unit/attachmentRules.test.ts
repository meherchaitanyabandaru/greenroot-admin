import { describe, expect, it } from 'vitest';
import { attachmentProblem, isPhoto } from '../../src/features/attachments/attachmentRules';

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
  it('sends photos through the image check and refuses formats the API cannot read', () => {
    expect(isPhoto(file('licence.JPG', 'image/jpeg', 2e6))).toBe(true);
    expect(isPhoto(file('scan.pdf', 'application/pdf', 2e6))).toBe(false);
    expect(attachmentProblem(file('photo.heic', 'image/heic', 2e6))).toMatch(/JPG or PNG/);
    expect(attachmentProblem(file('photo.webp', 'image/webp', 2e6))).toMatch(/JPG or PNG/);
    expect(attachmentProblem(file('huge.png', 'image/png', 9 * 1024 * 1024))).toMatch(/limit is 8 MB/);
  });
  it('refuses videos, other formats and big files', () => {
    expect(attachmentProblem(file('clip.mp4', 'video/mp4', 1e6))).toMatch(/Videos/);
    expect(attachmentProblem(file('clip.jpg', 'video/mp4', 1e6))).toMatch(/Videos/);
    expect(attachmentProblem(file('setup.exe', 'application/x-msdownload', 1e6))).toMatch(/Only photos/);
    expect(attachmentProblem(file('page.html', 'text/html', 1e3))).toMatch(/Only photos/);
    expect(attachmentProblem(file('big.pdf', 'application/pdf', 600 * 1024 * 1024))).toMatch(/limit is 20 MB/);
  });
});
