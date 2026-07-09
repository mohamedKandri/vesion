export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export function buildMeta(page: number, limit: number, total: number): PageMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function paginated<T>(items: T[], page: number, limit: number, total: number): Paginated<T> {
  return { items, meta: buildMeta(page, limit, total) };
}

/**
 * Resolves a client-supplied sort field against a whitelist to prevent
 * sorting by (and thereby probing) arbitrary columns.
 */
export function safeSort(
  sortBy: string | undefined,
  allowed: readonly string[],
  fallback: string,
  order: 'asc' | 'desc',
): Record<string, 'asc' | 'desc'> {
  const field = sortBy && allowed.includes(sortBy) ? sortBy : fallback;
  return { [field]: order };
}
