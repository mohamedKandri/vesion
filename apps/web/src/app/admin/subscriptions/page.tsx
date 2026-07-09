'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery, useApiQuery } from '@/lib/hooks';
import type { Company, Paginated, Plan, Subscription } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatMoney, humanize } from '@/lib/utils';

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const form = useForm<{ companyId: string; planId: string }>();

  const { data, isLoading } = usePagedQuery<Subscription>(['subscriptions'], '/subscriptions', {
    page,
    limit: 15,
  });
  const { data: companies } = useApiQuery<Paginated<Company>>(['companies-all'], '/companies?limit=100');
  const { data: plans } = useApiQuery<Plan[]>(['plans'], '/subscriptions/plans');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] });

  const cancel = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/cancel`),
    onSuccess: () => {
      success('Will cancel at period end');
      void invalidate();
    },
    onError: (err) => error('Cancel failed', (err as Error).message),
  });

  const resume = useMutation({
    mutationFn: (id: string) => api.post(`/subscriptions/${id}/resume`),
    onSuccess: () => {
      success('Cancellation undone');
      void invalidate();
    },
  });

  async function onCreate(values: { companyId: string; planId: string }) {
    try {
      await api.post('/subscriptions', values);
      success('Subscription created');
      setCreateOpen(false);
      form.reset();
      void invalidate();
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  const columns: Column<Subscription>[] = [
    { key: 'company', header: 'Client', render: (s) => s.company?.name ?? '—' },
    {
      key: 'plan',
      header: 'Plan',
      render: (s) => (
        <div>
          <p className="font-semibold">{s.plan.name}</p>
          <p className="text-xs text-[rgb(var(--muted))]">
            {formatMoney(s.plan.price, s.plan.currency)} / {humanize(s.plan.interval)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={s.status} />
          {s.cancelAtPeriodEnd && <span className="text-xs text-amber-500">cancels at period end</span>}
        </div>
      ),
    },
    { key: 'period', header: 'Current period ends', render: (s) => formatDate(s.currentPeriodEnd) },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s) =>
        s.status === 'CANCELLED' ? null : s.cancelAtPeriodEnd ? (
          <Button variant="ghost" size="sm" onClick={() => resume.mutate(s.id)}>
            Resume
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => cancel.mutate(s.id)}>
            Cancel
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Recurring engagement plans per client."
        action={<Button onClick={() => setCreateOpen(true)}>+ New subscription</Button>}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No subscriptions yet" />
      ) : (
        <>
          <DataTable columns={columns} rows={data!.items} />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New subscription">
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
          <Select label="Client" {...form.register('companyId', { required: true })}>
            <option value="">Select a client…</option>
            {(companies?.items ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Plan" {...form.register('planId', { required: true })}>
            <option value="">Select a plan…</option>
            {(plans ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatMoney(p.price, p.currency)}/{p.interval.toLowerCase()}
              </option>
            ))}
          </Select>
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Create subscription
          </Button>
        </form>
      </Modal>
    </>
  );
}
