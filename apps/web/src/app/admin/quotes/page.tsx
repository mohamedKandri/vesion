'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery, useApiQuery } from '@/lib/hooks';
import type { Company, Paginated, Quote } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatMoney } from '@/lib/utils';

interface QuoteFormValues {
  companyId: string;
  validUntil: string;
  notes?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
}

export default function AdminQuotesPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data, isLoading } = usePagedQuery<Quote>(['admin-quotes'], '/quotes', { page, limit: 15 });
  const { data: companies } = useApiQuery<Paginated<Company>>(['companies-all'], '/companies?limit=100');

  const form = useForm<QuoteFormValues>({
    defaultValues: { items: [{ description: '', quantity: 1, unitPrice: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const send = useMutation({
    mutationFn: (id: string) => api.post(`/quotes/${id}/send`),
    onSuccess: () => {
      success('Quote sent to client');
      void queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
    },
    onError: (err) => error('Send failed', (err as Error).message),
  });

  async function onCreate(values: QuoteFormValues) {
    try {
      await api.post('/quotes', {
        ...values,
        notes: values.notes || undefined,
        items: values.items.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      });
      success('Draft quote created');
      setCreateOpen(false);
      form.reset({ items: [{ description: '', quantity: 1, unitPrice: 0 }] });
      void queryClient.invalidateQueries({ queryKey: ['admin-quotes'] });
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  const columns: Column<Quote>[] = [
    { key: 'number', header: 'Quote', render: (q) => <span className="font-semibold">{q.number}</span> },
    { key: 'company', header: 'Client', render: (q) => q.company?.name ?? '—' },
    { key: 'status', header: 'Status', render: (q) => <StatusBadge status={q.status} /> },
    { key: 'validUntil', header: 'Valid until', render: (q) => formatDate(q.validUntil) },
    {
      key: 'total',
      header: 'Total',
      className: 'text-right',
      render: (q) => <span className="font-semibold">{formatMoney(q.total, q.currency)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (q) =>
        q.status === 'DRAFT' ? (
          <Button variant="ghost" size="sm" onClick={() => send.mutate(q.id)}>
            Send
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Quotes"
        description="Proposals sent for client approval."
        action={<Button onClick={() => setCreateOpen(true)}>+ New quote</Button>}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No quotes yet" />
      ) : (
        <>
          <DataTable columns={columns} rows={data!.items} />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New quote" className="max-w-2xl">
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Client" {...form.register('companyId', { required: true })}>
              <option value="">Select a client…</option>
              {(companies?.items ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input label="Valid until" type="date" {...form.register('validUntil', { required: true })} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Line items</p>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    aria-label="Description"
                    placeholder="Description"
                    className="flex-1"
                    {...form.register(`items.${index}.description`, { required: true })}
                  />
                  <Input
                    aria-label="Quantity"
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="Qty"
                    className="!w-20"
                    {...form.register(`items.${index}.quantity`, { required: true })}
                  />
                  <Input
                    aria-label="Unit price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    className="!w-28"
                    {...form.register(`items.${index}.unitPrice`, { required: true })}
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label="Remove line item"
                      className="px-2 text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
            >
              + Add line
            </Button>
          </div>

          <Textarea label="Notes" {...form.register('notes')} />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Create draft
          </Button>
        </form>
      </Modal>
    </>
  );
}
