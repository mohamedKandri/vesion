'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery, useApiQuery } from '@/lib/hooks';
import type { Company, Paginated, User, UserRole } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { DataTable, Pagination, type Column } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatDate, humanize } from '@/lib/utils';

const ROLE_TONES: Record<string, 'brand' | 'info' | 'success' | 'neutral' | 'warning'> = {
  ADMIN: 'brand',
  MANAGER: 'info',
  DEVELOPER: 'success',
  CLIENT: 'neutral',
  GUEST: 'warning',
};

export default function AdminUsersPage() {
  const [tab, setTab] = useState('staff');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data, isLoading } = usePagedQuery<User>(['admin-users', tab], '/users', {
    page,
    limit: 15,
    ...(tab === 'clients' ? { role: 'CLIENT' } : {}),
  });
  const { data: companies } = useApiQuery<Paginated<Company>>(['companies-all'], '/companies?limit=100');

  const createForm = useForm<Record<string, string>>({ defaultValues: { role: 'DEVELOPER' } });
  const editForm = useForm<Record<string, string>>();

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      success('User deactivated');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => error('Failed', (err as Error).message),
  });

  async function onCreate(values: Record<string, string>) {
    try {
      await api.post('/users', {
        ...values,
        companyId: values.companyId || undefined,
        jobTitle: values.jobTitle || undefined,
      });
      success('User created');
      setCreateOpen(false);
      createForm.reset({ role: 'DEVELOPER' });
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  async function onEdit(values: Record<string, string>) {
    if (!editing) return;
    try {
      await api.patch(`/users/${editing.id}`, {
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role as UserRole,
        jobTitle: values.jobTitle || undefined,
        companyId: values.companyId || undefined,
      });
      success('User updated');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      error('Update failed', (err as Error).message);
    }
  }

  const items = (data?.items ?? []).filter((u) =>
    tab === 'staff' ? u.role !== 'CLIENT' : true,
  );

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar firstName={u.firstName} lastName={u.lastName} src={u.avatarUrl} />
          <div>
            <p className="font-semibold">
              {u.firstName} {u.lastName}
              {u.isActive === false && (
                <span className="ml-2 text-xs text-red-500">(deactivated)</span>
              )}
            </p>
            <p className="text-xs text-[rgb(var(--muted))]">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <Badge tone={ROLE_TONES[u.role] ?? 'neutral'}>{humanize(u.role)}</Badge>,
    },
    { key: 'jobTitle', header: 'Title', render: (u) => u.jobTitle ?? '—' },
    { key: 'company', header: 'Company', render: (u) => u.company?.name ?? '—' },
    { key: 'lastLoginAt', header: 'Last login', render: (u) => formatDate(u.lastLoginAt) },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(u);
              editForm.reset({
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                jobTitle: u.jobTitle ?? '',
                companyId: u.companyId ?? '',
              });
            }}
          >
            Edit
          </Button>
          {u.isActive !== false && (
            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deactivate.mutate(u.id)}>
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Team & users"
        description="Employees, roles, and client accounts."
        action={<Button onClick={() => setCreateOpen(true)}>+ New user</Button>}
      />

      <Tabs
        tabs={[
          { id: 'staff', label: 'Team' },
          { id: 'clients', label: 'Client users' },
        ]}
        active={tab}
        onChange={(id) => {
          setTab(id);
          setPage(1);
        }}
        className="mb-6"
      />

      {isLoading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <>
          <DataTable columns={columns} rows={items} />
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}

      {/* Create user */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New user">
        <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First name" {...createForm.register('firstName', { required: true })} />
            <Input label="Last name" {...createForm.register('lastName', { required: true })} />
          </div>
          <Input label="Email" type="email" {...createForm.register('email', { required: true })} />
          <Input
            label="Temporary password"
            type="password"
            hint="Min 10 chars with uppercase, lowercase, and a digit. Share securely."
            {...createForm.register('password', { required: true, minLength: 10 })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Role" {...createForm.register('role')}>
              {['ADMIN', 'MANAGER', 'DEVELOPER', 'CLIENT', 'GUEST'].map((r) => (
                <option key={r} value={r}>
                  {humanize(r)}
                </option>
              ))}
            </Select>
            <Input label="Job title" {...createForm.register('jobTitle')} />
          </div>
          <Select label="Company (for client users)" {...createForm.register('companyId')}>
            <option value="">None</option>
            {(companies?.items ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button type="submit" className="w-full" loading={createForm.formState.isSubmitting}>
            Create user
          </Button>
        </form>
      </Modal>

      {/* Edit user */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.firstName ?? ''}`}>
        <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First name" {...editForm.register('firstName', { required: true })} />
            <Input label="Last name" {...editForm.register('lastName', { required: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Role" {...editForm.register('role')}>
              {['ADMIN', 'MANAGER', 'DEVELOPER', 'CLIENT', 'GUEST'].map((r) => (
                <option key={r} value={r}>
                  {humanize(r)}
                </option>
              ))}
            </Select>
            <Input label="Job title" {...editForm.register('jobTitle')} />
          </div>
          <Select label="Company" {...editForm.register('companyId')}>
            <option value="">None</option>
            {(companies?.items ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button type="submit" className="w-full" loading={editForm.formState.isSubmitting}>
            Save changes
          </Button>
        </form>
      </Modal>
    </>
  );
}
