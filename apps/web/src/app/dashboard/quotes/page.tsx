'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery } from '@/lib/hooks';
import type { Quote } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatMoney } from '@/lib/utils';

export default function ClientQuotesPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Quote | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { data, isLoading } = usePagedQuery<Quote>(['quotes'], '/quotes', { page, limit: 15 });

  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' }) =>
      api.post(`/quotes/${id}/${action}`),
    onSuccess: (_data, vars) => {
      success(vars.action === 'accept' ? 'Quote accepted 🎉' : 'Quote declined');
      setSelected(null);
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
    onError: (err) => error('Action failed', (err as Error).message),
  });

  return (
    <>
      <PageHeader title="Quotes" description="Proposals awaiting your review." />

      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No quotes yet" description="When we prepare a proposal, it appears here." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data!.items.map((quote) => (
              <button
                key={quote.id}
                onClick={() => setSelected(quote)}
                className="card p-5 text-left transition hover:border-brand-500/50"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{quote.number}</p>
                  <StatusBadge status={quote.status} />
                </div>
                <p className="mt-3 font-display text-2xl font-bold">
                  {formatMoney(quote.total, quote.currency)}
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  Valid until {formatDate(quote.validUntil)} · {quote.items.length} item
                  {quote.items.length === 1 ? '' : 's'}
                </p>
              </button>
            ))}
          </div>
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.number ?? ''} className="max-w-xl">
        {selected && (
          <div>
            <div className="space-y-2">
              {selected.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm">
                  <span>
                    {item.description}{' '}
                    <span className="text-[rgb(var(--muted))]">× {Number(item.quantity)}</span>
                  </span>
                  <span className="font-medium">{formatMoney(item.amount, selected.currency)}</span>
                </div>
              ))}
            </div>
            <dl className="mt-4 space-y-1.5 border-t border-[rgb(var(--card-border))] pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-[rgb(var(--muted))]">Subtotal</dt>
                <dd>{formatMoney(selected.subtotal, selected.currency)}</dd>
              </div>
              {Number(selected.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <dt>Discount</dt>
                  <dd>-{formatMoney(selected.discountAmount, selected.currency)}</dd>
                </div>
              )}
              {Number(selected.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[rgb(var(--muted))]">Tax</dt>
                  <dd>{formatMoney(selected.taxAmount, selected.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-1 font-display text-base font-bold">
                <dt>Total</dt>
                <dd>{formatMoney(selected.total, selected.currency)}</dd>
              </div>
            </dl>
            {selected.notes && (
              <p className="mt-4 rounded-xl bg-black/5 p-3 text-sm text-[rgb(var(--muted))] dark:bg-white/5">
                {selected.notes}
              </p>
            )}
            {selected.status === 'SENT' && (
              <div className="mt-6 flex gap-3">
                <Button
                  className="flex-1"
                  loading={respond.isPending}
                  onClick={() => respond.mutate({ id: selected.id, action: 'accept' })}
                >
                  Accept quote
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  loading={respond.isPending}
                  onClick={() => respond.mutate({ id: selected.id, action: 'decline' })}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
