'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePagedQuery } from '@/lib/hooks';
import type { Project } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

const columns: Column<Project>[] = [
  {
    key: 'name',
    header: 'Project',
    render: (p) => (
      <div>
        <p className="font-semibold">{p.name}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{p._count?.tasks ?? 0} tasks</p>
      </div>
    ),
  },
  { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  {
    key: 'progress',
    header: 'Progress',
    className: 'w-48',
    render: (p) => (
      <div className="flex items-center gap-2">
        <Progress value={p.progress} className="flex-1" />
        <span className="text-xs font-semibold">{p.progress}%</span>
      </div>
    ),
  },
  { key: 'dueDate', header: 'Due', render: (p) => formatDate(p.dueDate) },
];

export default function ClientProjectsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePagedQuery<Project>(['projects'], '/projects', {
    page,
    limit: 10,
    search: search || undefined,
  });

  return (
    <>
      <PageHeader title="Projects" description="Everything we're building together." />
      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search projects…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          aria-label="Search projects"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No projects found" description="Projects will appear here once created." />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data!.items}
            onRowClick={(p) => router.push(`/dashboard/projects/${p.id}`)}
          />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
