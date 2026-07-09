'use client';

import { cn } from '@/lib/utils';
import type { PageMeta } from '@/lib/types';
import { Button } from './button';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-[rgb(var(--card-border))]', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[rgb(var(--card-border))] bg-black/[0.03] dark:bg-white/[0.03]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-[rgb(var(--card-border))] last:border-0',
                onRowClick &&
                  'cursor-pointer transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
      <p className="text-sm text-[rgb(var(--muted))]">
        Page {meta.page} of {meta.totalPages} · {meta.total} results
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPrev}
          onClick={() => onPageChange(meta.page - 1)}
        >
          ← Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNext}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next →
        </Button>
      </div>
    </nav>
  );
}
