'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePagedQuery } from '@/lib/hooks';
import type { Ticket } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

const columns: Column<Ticket>[] = [
  { key: 'number', header: '#', className: 'w-16', render: (t) => <span className="font-semibold">{t.number}</span> },
  {
    key: 'subject',
    header: 'Subject',
    render: (t) => (
      <div>
        <p className="font-medium">{t.subject}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{t.category?.name ?? 'General'}</p>
      </div>
    ),
  },
  { key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority} /> },
  { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  { key: 'updatedAt', header: 'Updated', render: (t) => formatDate(t.updatedAt) },
];

export default function ClientSupportPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePagedQuery<Ticket>(['tickets'], '/tickets', { page, limit: 15 });

  return (
    <>
      <PageHeader
        title="Support"
        description="We respond within one business day on all plans."
        action={
          <Link href="/dashboard/support/new">
            <Button>+ New ticket</Button>
          </Link>
        }
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="No tickets yet"
          description="Need help with anything? Open your first ticket."
          action={
            <Link href="/dashboard/support/new">
              <Button>Open a ticket</Button>
            </Link>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data!.items}
            onRowClick={(t) => router.push(`/dashboard/support/${t.id}`)}
          />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
