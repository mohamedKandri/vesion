import { describe, expect, it } from 'vitest';
import { cn, formatBytes, formatMoney, humanize, initials } from './utils';

describe('cn', () => {
  it('merges conflicting Tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });
});

describe('formatMoney', () => {
  it('formats USD amounts', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
  });

  it('accepts string decimals from the API', () => {
    expect(formatMoney('99.9')).toBe('$99.90');
  });

  it('supports other currencies', () => {
    expect(formatMoney(100, 'EUR')).toContain('100');
  });
});

describe('humanize', () => {
  it('converts SCREAMING_SNAKE enums to labels', () => {
    expect(humanize('IN_PROGRESS')).toBe('In Progress');
    expect(humanize('WAITING_ON_CLIENT')).toBe('Waiting On Client');
  });
});

describe('initials', () => {
  it('builds initials from names', () => {
    expect(initials('Jane', 'Doe')).toBe('JD');
  });

  it('falls back for missing names', () => {
    expect(initials()).toBe('?');
  });
});

describe('formatBytes', () => {
  it('scales units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
