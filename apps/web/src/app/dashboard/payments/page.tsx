'use client';

import { useState } from 'react';
import { usePagedQuery } from '@/lib/hooks';
import type { Payment } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, formatMoney, humanize } from '@/lib/utils';

const columns: Column<Payment>[] = [
  { key: 'paidAt', header: 'Date', render: (p) => formatDate(p.paidAt) },
  {
    key: 'invoice',
    header: 'Invoice',
    render: (p) => p.invoice?.number ?? <span className="text-[rgb(var(--muted))]">Subscription</span>,
  },
  { key: 'method', header: 'Method', render: (p) => humanize(p.method) },
  { key: 'reference', header: 'Reference', render: (p) => p.reference ?? '—' },
  { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  {
    key: 'amount',
    header: 'Amount',
    className: 'text-right',
    render: (p) => <span className="font-semibold">{formatMoney(p.amount, p.currency)}</span>,
  },
];

export default function ClientPaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePagedQuery<Payment>(['payments'], '/payments', { page, limit: 15 });

  return (
    <>
      <PageHeader title="Payments" description="Your full payment history and receipts." />
      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No payments recorded yet" />
      ) : (
        <>
          <DataTable columns={columns} rows={data!.items} />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
