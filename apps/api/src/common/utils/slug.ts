import { randomBytes } from 'crypto';

/** Converts a title to a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Slug with a short random suffix for guaranteed uniqueness. */
export function uniqueSlug(input: string): string {
  return `${slugify(input)}-${randomBytes(3).toString('hex')}`;
}
