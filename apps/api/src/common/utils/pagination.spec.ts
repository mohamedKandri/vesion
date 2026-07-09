import { buildMeta, paginated, safeSort } from './pagination';

describe('pagination utils', () => {
  describe('buildMeta', () => {
    it('computes total pages and navigation flags', () => {
      const meta = buildMeta(2, 10, 35);
      expect(meta).toEqual({
        page: 2,
        limit: 10,
        total: 35,
        totalPages: 4,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('always reports at least one page', () => {
      const meta = buildMeta(1, 20, 0);
      expect(meta.totalPages).toBe(1);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });

    it('flags the last page correctly', () => {
      const meta = buildMeta(4, 10, 35);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });
  });

  describe('paginated', () => {
    it('wraps items with meta', () => {
      const result = paginated(['a', 'b'], 1, 2, 5);
      expect(result.items).toEqual(['a', 'b']);
      expect(result.meta.total).toBe(5);
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('safeSort', () => {
    const allowed = ['createdAt', 'name'] as const;

    it('accepts whitelisted fields', () => {
      expect(safeSort('name', allowed, 'createdAt', 'asc')).toEqual({ name: 'asc' });
    });

    it('falls back for unknown fields (prevents column probing)', () => {
      expect(safeSort('passwordHash', allowed, 'createdAt', 'desc')).toEqual({ createdAt: 'desc' });
    });

    it('falls back when no field is provided', () => {
      expect(safeSort(undefined, allowed, 'createdAt', 'desc')).toEqual({ createdAt: 'desc' });
    });
  });
});
