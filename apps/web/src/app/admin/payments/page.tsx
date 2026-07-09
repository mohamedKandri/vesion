'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery } from '@/lib/hooks';
import type { Payment } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatMoney, humanize } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [refunding, setRefunding] = useState<Payment | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const refundForm = useForm<{ amount: string; reason: string }>();

  const { data, isLoading } = usePagedQuery<Payment>(['admin-payments'], '/payments', { page, limit: 15 });

  async function onRefund(values: { amount: string; reason: string }) {
    if (!refunding) return;
    try {
      await api.post(`/payments/${refunding.id}/refund`, {
        amount: Number(values.amount),
        reason: values.reason,
      });
      success('Refund recorded');
      setRefunding(null);
      refundForm.reset();
      void queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    } catch (err) {
      error('Refund failed', (err as Error).message);
    }
  }

  const columns: Column<Payment>[] = [
    { key: 'paidAt', header: 'Date', render: (p) => formatDate(p.paidAt) },
    { key: 'company', header: 'Client', render: (p) => p.company?.name ?? '—' },
    { key: 'invoice', header: 'Invoice', render: (p) => p.invoice?.number ?? 'Subscription' },
    { key: 'method', header: 'Method', render: (p) => humanize(p.method) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      render: (p) => <span className="font-semibold">{formatMoney(p.amount, p.currency)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) =>
        p.status === 'COMPLETED' ? (
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setRefunding(p)}>
            Refund
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="All recorded payments and refunds. Record invoice payments from the invoice page."
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No payments yet" />
      ) : (
        <>
          <DataTable columns={columns} rows={data!.items} />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}

      <Modal
        open={!!refunding}
        onClose={() => setRefunding(null)}
        title={`Refund payment${refunding ? ` (${formatMoney(refunding.amount, refunding.currency)})` : ''}`}
      >
        <form onSubmit={refundForm.handleSubmit(onRefund)} className="space-y-4">
          <Input
            label="Refund amount"
            type="number"
            step="0.01"
            min="0.01"
            {...refundForm.register('amount', { required: true, min: 0.01 })}
          />
          <Input label="Reason" {...refundForm.register('reason', { required: true })} />
          <Button type="submit" variant="danger" className="w-full" loading={refundForm.formState.isSubmitting}>
            Process refund
          </Button>
        </form>
      </Modal>
    </>
  );
}
