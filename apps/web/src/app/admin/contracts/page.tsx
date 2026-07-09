'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { Company, Contract, Paginated } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Markdown } from '@/components/markdown';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

interface ContractFormValues {
  companyId: string;
  title: string;
  body: string;
  expiresAt?: string;
}

export default function AdminContractsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<Contract | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const form = useForm<ContractFormValues>();

  const { data: contracts, isLoading } = useApiQuery<Contract[]>(['admin-contracts'], '/contracts');
  const { data: companies } = useApiQuery<Paginated<Company>>(['companies-all'], '/companies?limit=100');

  const send = useMutation({
    mutationFn: (id: string) => api.post(`/contracts/${id}/send`),
    onSuccess: () => {
      success('Contract sent for signature');
      void queryClient.invalidateQueries({ queryKey: ['admin-contracts'] });
    },
    onError: (err) => error('Send failed', (err as Error).message),
  });

  async function onCreate(values: ContractFormValues) {
    try {
      await api.post('/contracts', { ...values, expiresAt: values.expiresAt || undefined });
      success('Draft contract created');
      setCreateOpen(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['admin-contracts'] });
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Contracts"
        description="Draft, send, and track e-signed agreements."
        action={<Button onClick={() => setCreateOpen(true)}>+ New contract</Button>}
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (contracts?.length ?? 0) === 0 ? (
        <EmptyState title="No contracts yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contracts!.map((contract) => (
            <div key={contract.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => setViewing(contract)} className="text-left font-semibold hover:text-brand-500">
                  {contract.title}
                </button>
                <StatusBadge status={contract.status} />
              </div>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                {contract.company?.name}
                {contract.signedAt
                  ? ` · signed ${formatDate(contract.signedAt)} by ${contract.signedByName}`
                  : ` · created ${formatDate(contract.createdAt)}`}
              </p>
              {contract.status === 'DRAFT' && (
                <Button size="sm" className="mt-3" onClick={() => send.mutate(contract.id)} loading={send.isPending}>
                  Send for signature
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New contract" className="max-w-2xl">
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
            <Input label="Expires (optional)" type="date" {...form.register('expiresAt')} />
          </div>
          <Input label="Title" placeholder="Master Services Agreement" {...form.register('title', { required: true })} />
          <Textarea
            label="Contract body (markdown)"
            className="min-h-64 font-mono text-xs"
            {...form.register('body', { required: true })}
          />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Create draft
          </Button>
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title ?? ''} className="max-w-2xl">
        {viewing && (
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
            <Markdown content={viewing.body} />
          </div>
        )}
      </Modal>
    </>
  );
}
