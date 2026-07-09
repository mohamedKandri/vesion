'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePagedQuery } from '@/lib/hooks';
import type { Ticket } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { timeAgo } from '@/lib/utils';

const columns: Column<Ticket>[] = [
  { key: 'number', header: '#', className: 'w-16', render: (t) => <span className="font-semibold">{t.number}</span> },
  {
    key: 'subject',
    header: 'Subject',
    render: (t) => (
      <div>
        <p className="font-medium">{t.subject}</p>
        <p className="text-xs text-[rgb(var(--muted))]">
          {t.requester ? `${t.requester.firstName} ${t.requester.lastName}` : ''}
          {t.company ? ` · ${t.company.name}` : ''}
        </p>
      </div>
    ),
  },
  { key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority} /> },
  { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  {
    key: 'assignee',
    header: 'Assignee',
    render: (t) => (t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : '—'),
  },
  { key: 'updatedAt', header: 'Updated', render: (t) => timeAgo(t.updatedAt) },
];

const TABS = [
  { id: 'open', label: 'Open' },
  { id: 'OPEN', label: 'New' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'WAITING_ON_CLIENT', label: 'Waiting' },
  { id: 'RESOLVED', label: 'Resolved' },
  { id: 'all', label: 'All' },
];

export default function AdminSupportPage() {
  const router = useRouter();
  const [tab, setTab] = useState('open');
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePagedQuery<Ticket>(['admin-tickets', tab], '/tickets', {
    page,
    limit: 15,
    ...(tab !== 'open' && tab !== 'all' ? { status: tab } : {}),
  });

  const items =
    tab === 'open'
      ? (data?.items ?? []).filter((t) => !['CLOSED', 'RESOLVED'].includes(t.status))
      : data?.items ?? [];

  return (
    <>
      <PageHeader title="Support" description="Every client ticket across the platform." />
      <Tabs
        tabs={TABS}
        active={tab}
        onChange={(id) => {
          setTab(id);
          setPage(1);
        }}
        className="mb-6"
      />

      {isLoading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <EmptyState icon="☎" title="No tickets here" description="Nothing in this state right now." />
      ) : (
        <>
          <DataTable columns={columns} rows={items} onRowClick={(t) => router.push(`/admin/support/${t.id}`)} />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
