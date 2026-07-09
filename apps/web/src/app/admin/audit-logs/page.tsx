'use client';

import { useState } from 'react';
import { usePagedQuery } from '@/lib/hooks';
import type { AuditLog } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/utils';

const columns: Column<AuditLog>[] = [
  {
    key: 'action',
    header: 'Action',
    render: (log) => (
      <span className="rounded-lg bg-brand-500/10 px-2 py-0.5 font-mono text-xs text-brand-500">
        {log.action}
      </span>
    ),
  },
  {
    key: 'user',
    header: 'Actor',
    render: (log) =>
      log.user ? (
        <div>
          <p className="text-sm font-medium">
            {log.user.firstName} {log.user.lastName}
          </p>
          <p className="text-xs text-[rgb(var(--muted))]">{log.user.email}</p>
        </div>
      ) : (
        <span className="text-[rgb(var(--muted))]">System</span>
      ),
  },
  {
    key: 'entity',
    header: 'Entity',
    render: (log) =>
      log.entityType ? `${log.entityType}${log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ''}` : '—',
  },
  { key: 'ip', header: 'IP', render: (log) => log.ip ?? '—' },
  { key: 'createdAt', header: 'When', render: (log) => formatDateTime(log.createdAt) },
];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePagedQuery<AuditLog>(['audit-logs'], '/audit-logs', {
    page,
    limit: 25,
    search: search || undefined,
  });

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Immutable trail of every mutating action on the platform."
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search action, entity, id…"
          aria-label="Search audit logs"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No audit entries found" />
      ) : (
        <>
          <DataTable columns={columns} rows={data!.items} />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
