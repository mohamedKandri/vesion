import { slugify, uniqueSlug } from './slug';

describe('slug utils', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(slugify('C# & .NET: The Guide!')).toBe('c-net-the-guide');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('--Already Hyphened--')).toBe('already-hyphened');
  });

  it('caps length at 80 characters', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(80);
  });

  it('uniqueSlug appends a random suffix', () => {
    const a = uniqueSlug('My Project');
    const b = uniqueSlug('My Project');
    expect(a).toMatch(/^my-project-[0-9a-f]{6}$/);
    expect(a).not.toBe(b);
  });
});
