// What the API accepts for attachments: documents by POST /storage/presign
// (20 MB), photos by POST /storage/images, checked against the ATTACHMENT
// image policy (JPG or PNG; the API decides the final limits).
export const PHOTO_EXT = ['jpg', 'jpeg', 'png'];
export const ALLOWED_EXT = [...PHOTO_EXT, 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const ext = (f: File) => f.name.split('.').pop()?.toLowerCase() ?? '';

/** A photo goes through the API's image check, not a presigned upload. */
export function isPhoto(f: File): boolean {
  return f.type.startsWith('image/') || PHOTO_EXT.includes(ext(f));
}

/** Why this file can't be attached, or '' when it can. */
export function attachmentProblem(f: File): string {
  if (f.type.startsWith('video/') || f.type.startsWith('audio/')) return 'Videos and audio files cannot be attached.';
  if (['webp', 'heic', 'heif', 'gif'].includes(ext(f))) return 'Save this photo as JPG or PNG first.';
  if (!ALLOWED_EXT.includes(ext(f))) return 'Only photos (JPG, PNG), PDF, Word, Excel, CSV or text files can be attached.';
  if (isPhoto(f) && f.size > MAX_PHOTO_BYTES) return `This photo is ${(f.size / 1024 / 1024).toFixed(1)} MB; the limit is 8 MB.`;
  if (f.size > MAX_BYTES) return `This file is ${(f.size / 1024 / 1024).toFixed(1)} MB; the limit is 20 MB.`;
  return '';
}
