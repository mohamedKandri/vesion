'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePagedQuery } from '@/lib/hooks';
import type { Invoice } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, formatMoney } from '@/lib/utils';

const columns: Column<Invoice>[] = [
  { key: 'number', header: 'Invoice', render: (i) => <span className="font-semibold">{i.number}</span> },
  { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
  { key: 'issueDate', header: 'Issued', render: (i) => formatDate(i.issueDate) },
  { key: 'dueDate', header: 'Due', render: (i) => formatDate(i.dueDate) },
  {
    key: 'total',
    header: 'Total',
    className: 'text-right',
    render: (i) => <span className="font-semibold">{formatMoney(i.total, i.currency)}</span>,
  },
];

export default function ClientInvoicesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePagedQuery<Invoice>(['invoices'], '/invoices', { page, limit: 15 });

  return (
    <>
      <PageHeader title="Invoices" description="All invoices issued to your company." />
      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No invoices yet" />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data!.items}
            onRowClick={(i) => router.push(`/dashboard/invoices/${i.id}`)}
          />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
