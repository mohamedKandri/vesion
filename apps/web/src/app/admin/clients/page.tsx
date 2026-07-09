'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery } from '@/lib/hooks';
import type { Company } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

const columns: Column<Company>[] = [
  {
    key: 'name',
    header: 'Company',
    render: (c) => (
      <div>
        <p className="font-semibold">{c.name}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{c.industry ?? '—'}</p>
      </div>
    ),
  },
  { key: 'location', header: 'Location', render: (c) => [c.city, c.country].filter(Boolean).join(', ') || '—' },
  { key: 'users', header: 'Users', render: (c) => c._count?.users ?? 0 },
  { key: 'projects', header: 'Projects', render: (c) => c._count?.projects ?? 0 },
  { key: 'invoices', header: 'Invoices', render: (c) => c._count?.invoices ?? 0 },
  { key: 'createdAt', header: 'Since', render: (c) => formatDate(c.createdAt) },
];

export default function AdminClientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit, formState, reset } = useForm<Record<string, string>>();

  const { data, isLoading } = usePagedQuery<Company>(['companies'], '/companies', {
    page,
    limit: 15,
    search: search || undefined,
  });

  async function onCreate(values: Record<string, string>) {
    try {
      await api.post('/companies', { ...values, website: values.website || undefined });
      success('Client company created');
      setCreateOpen(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: ['companies'] });
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Clients"
        description="Companies you work with."
        action={<Button onClick={() => setCreateOpen(true)}>+ New client</Button>}
      />

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search clients…"
          aria-label="Search clients"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No clients found" />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data!.items}
            onRowClick={(c) => router.push(`/admin/clients/${c.id}`)}
          />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New client company">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input label="Company name" error={formState.errors.name && 'Required'} {...register('name', { required: true })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Website" placeholder="https://…" {...register('website')} />
            <Input label="Industry" {...register('industry')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" {...register('city')} />
            <Input label="Country" {...register('country')} />
          </div>
          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Create client
          </Button>
        </form>
      </Modal>
    </>
  );
}
