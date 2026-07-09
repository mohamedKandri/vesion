'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from './api';
import type { Paginated } from './types';

/** Builds a query string from defined params only. */
export function qs(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}

/** Paginated list query with page-transition smoothing. */
export function usePagedQuery<T>(
  key: readonly unknown[],
  path: string,
  params: Record<string, string | number | boolean | undefined>,
) {
  return useQuery<Paginated<T>>({
    queryKey: [...key, params],
    queryFn: () => api.get<Paginated<T>>(`${path}${qs(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useApiQuery<T>(key: readonly unknown[], path: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => api.get<T>(path),
    enabled,
  });
}
