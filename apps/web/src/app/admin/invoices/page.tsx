'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery, useApiQuery } from '@/lib/hooks';
import type { Company, Invoice, Paginated } from '@/lib/types';
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

interface InvoiceFormValues {
  companyId: string;
  dueDate: string;
  taxRateId?: string;
  discountCode?: string;
  notes?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
}

interface TaxRate {
  id: string;
  name: string;
  ratePercent: string;
}

const columns: Column<Invoice>[] = [
  { key: 'number', header: 'Invoice', render: (i) => <span className="font-semibold">{i.number}</span> },
  { key: 'company', header: 'Client', render: (i) => i.company?.name ?? '—' },
  { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
  { key: 'dueDate', header: 'Due', render: (i) => formatDate(i.dueDate) },
  {
    key: 'paid',
    header: 'Paid',
    render: (i) => `${formatMoney(i.amountPaid, i.currency)} / ${formatMoney(i.total, i.currency)}`,
  },
];

function AdminInvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data, isLoading } = usePagedQuery<Invoice>(['admin-invoices'], '/invoices', {
    page,
    limit: 15,
    companyId: searchParams.get('companyId') ?? undefined,
  });
  const { data: companies } = useApiQuery<Paginated<Company>>(['companies-all'], '/companies?limit=100');
  const { data: taxRates } = useApiQuery<TaxRate[]>(['tax-rates'], '/tax-rates');

  const form = useForm<InvoiceFormValues>({
    defaultValues: { items: [{ description: '', quantity: 1, unitPrice: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  async function onCreate(values: InvoiceFormValues) {
    try {
      const invoice = await api.post<Invoice>('/invoices', {
        ...values,
        taxRateId: values.taxRateId || undefined,
        discountCode: values.discountCode || undefined,
        notes: values.notes || undefined,
        items: values.items.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      });
      success('Draft invoice created');
      setCreateOpen(false);
      form.reset({ items: [{ description: '', quantity: 1, unitPrice: 0 }] });
      void queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      router.push(`/admin/invoices/${invoice.id}`);
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Issue, track, and settle invoices."
        action={<Button onClick={() => setCreateOpen(true)}>+ New invoice</Button>}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No invoices yet" />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data!.items}
            onRowClick={(i) => router.push(`/admin/invoices/${i.id}`)}
          />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New invoice" className="max-w-2xl">
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
            <Input label="Due date" type="date" {...form.register('dueDate', { required: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Tax rate" {...form.register('taxRateId')}>
              <option value="">No tax</option>
              {(taxRates ?? []).map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.name}
                </option>
              ))}
            </Select>
            <Input label="Discount code (optional)" placeholder="LAUNCH20" {...form.register('discountCode')} />
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
                    {...form.register(`items.${index}.quantity`, { required: true, min: 0.01 })}
                  />
                  <Input
                    aria-label="Unit price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    className="!w-28"
                    {...form.register(`items.${index}.unitPrice`, { required: true, min: 0 })}
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

          <Textarea label="Notes (shown on the invoice)" {...form.register('notes')} />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Create draft
          </Button>
        </form>
      </Modal>
    </>
  );
}

export default function AdminInvoicesPage() {
  return (
    <Suspense>
      <AdminInvoicesContent />
    </Suspense>
  );
}
