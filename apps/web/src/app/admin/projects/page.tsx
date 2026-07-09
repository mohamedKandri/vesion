'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery, useApiQuery } from '@/lib/hooks';
import type { Company, Paginated, Project, User } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

const columns: Column<Project>[] = [
  {
    key: 'name',
    header: 'Project',
    render: (p) => (
      <div>
        <p className="font-semibold">{p.name}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{p.company?.name}</p>
      </div>
    ),
  },
  { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  {
    key: 'progress',
    header: 'Progress',
    className: 'w-44',
    render: (p) => (
      <div className="flex items-center gap-2">
        <Progress value={p.progress} className="flex-1" />
        <span className="text-xs font-semibold">{p.progress}%</span>
      </div>
    ),
  },
  {
    key: 'manager',
    header: 'Manager',
    render: (p) => (p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : '—'),
  },
  { key: 'dueDate', header: 'Due', render: (p) => formatDate(p.dueDate) },
];

function AdminProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { register, handleSubmit, formState, reset } = useForm<Record<string, string>>();

  const companyId = searchParams.get('companyId') ?? undefined;
  const { data, isLoading } = usePagedQuery<Project>(['admin-projects'], '/projects', {
    page,
    limit: 15,
    search: search || undefined,
    companyId,
  });
  const { data: companies } = useApiQuery<Paginated<Company>>(['companies-all'], '/companies?limit=100');
  const { data: staff } = useApiQuery<Paginated<User>>(
    ['staff'],
    '/users?limit=100&role=MANAGER',
  );

  async function onCreate(values: Record<string, string>) {
    try {
      const project = await api.post<Project>('/projects', {
        name: values.name,
        description: values.description || undefined,
        companyId: values.companyId,
        managerId: values.managerId || undefined,
        budget: values.budget ? Number(values.budget) : undefined,
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
      });
      success('Project created');
      setCreateOpen(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      router.push(`/admin/projects/${project.id}`);
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description="All engagements across clients."
        action={<Button onClick={() => setCreateOpen(true)}>+ New project</Button>}
      />

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search projects…"
          aria-label="Search projects"
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
        <EmptyState title="No projects found" />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data!.items}
            onRowClick={(p) => router.push(`/admin/projects/${p.id}`)}
          />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New project" className="max-w-xl">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input label="Project name" {...register('name', { required: true })} />
          <Select label="Client company" {...register('companyId', { required: true })}>
            <option value="">Select a client…</option>
            {(companies?.items ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Manager" {...register('managerId')}>
            <option value="">Assign later…</option>
            {(staff?.items ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </Select>
          <Textarea label="Description" {...register('description')} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Budget (USD)" type="number" min="0" {...register('budget')} />
            <Input label="Start date" type="date" {...register('startDate')} />
            <Input label="Due date" type="date" {...register('dueDate')} />
          </div>
          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Create project
          </Button>
        </form>
      </Modal>
    </>
  );
}

export default function AdminProjectsPage() {
  return (
    <Suspense>
      <AdminProjectsContent />
    </Suspense>
  );
}
