// What the API accepts for attachments (see POST /storage/presign).
export const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
const MAX_BYTES = 20 * 1024 * 1024;

/** Why this file can't be attached, or '' when it can. */
export function attachmentProblem(f: File): string {
  const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
  if (f.type.startsWith('video/') || f.type.startsWith('audio/')) return 'Videos and audio files cannot be attached.';
  if (!ALLOWED_EXT.includes(ext)) return 'Only photos, PDF, Word, Excel, CSV or text files can be attached.';
  if (f.size > MAX_BYTES) return `This file is ${(f.size / 1024 / 1024).toFixed(1)} MB; the limit is 20 MB.`;
  return '';
}
