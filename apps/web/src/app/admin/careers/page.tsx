'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { JobPosting } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { Tabs } from '@/components/ui/tabs';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatDate, humanize } from '@/lib/utils';

interface Application {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  coverLetter?: string | null;
  status: string;
  createdAt: string;
  posting: { id: string; title: string };
}

const APP_STATUSES = ['RECEIVED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

export default function AdminCareersPage() {
  const [tab, setTab] = useState('postings');
  return (
    <>
      <PageHeader title="Careers" description="Job postings and applications." />
      <Tabs
        tabs={[
          { id: 'postings', label: 'Postings' },
          { id: 'applications', label: 'Applications' },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />
      {tab === 'postings' ? <Postings /> : <Applications />}
    </>
  );
}

interface PostingFormValues {
  title: string;
  department: string;
  location: string;
  type: string;
  salaryRange?: string;
  description: string;
  requirements: string;
  isOpen: boolean;
}

function Postings() {
  const [editing, setEditing] = useState<JobPosting | 'new' | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const form = useForm<PostingFormValues>();

  const { data: postings, isLoading } = useApiQuery<JobPosting[]>(['admin-postings'], '/careers/postings/all');

  function openEditor(posting: JobPosting | 'new') {
    setEditing(posting);
    form.reset(
      posting === 'new'
        ? { title: '', department: '', location: '', type: 'FULL_TIME', description: '', requirements: '', isOpen: true }
        : {
            title: posting.title,
            department: posting.department,
            location: posting.location,
            type: posting.type,
            salaryRange: posting.salaryRange ?? '',
            description: posting.description ?? '',
            requirements: (posting.requirements ?? []).join('\n'),
            isOpen: posting.isOpen ?? true,
          },
    );
  }

  async function onSave(values: PostingFormValues) {
    const payload = {
      title: values.title,
      department: values.department,
      location: values.location,
      type: values.type,
      salaryRange: values.salaryRange || undefined,
      description: values.description,
      requirements: values.requirements.split('\n').map((r) => r.trim()).filter(Boolean),
      isOpen: values.isOpen,
    };
    try {
      if (editing === 'new') await api.post('/careers/postings', payload);
      else if (editing) await api.patch(`/careers/postings/${editing.id}`, payload);
      success('Posting saved');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-postings'] });
    } catch (err) {
      error('Save failed', (err as Error).message);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => openEditor('new')}>+ New posting</Button>
      </div>
      {isLoading ? (
        <TableSkeleton />
      ) : (postings?.length ?? 0) === 0 ? (
        <EmptyState title="No postings yet" />
      ) : (
        <div className="space-y-2">
          {postings!.map((posting) => (
            <div key={posting.id} className="card flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{posting.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {posting.department} · {posting.location} · {humanize(posting.type)} ·{' '}
                  {posting._count?.applications ?? 0} applications
                </p>
              </div>
              <Badge tone={posting.isOpen ? 'success' : 'neutral'}>
                {posting.isOpen ? 'Open' : 'Closed'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => openEditor(posting)}>
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New posting' : 'Edit posting'}
        className="max-w-2xl"
      >
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          <Input label="Title" {...form.register('title', { required: true })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Department" {...form.register('department', { required: true })} />
            <Input label="Location" {...form.register('location', { required: true })} />
            <Select label="Type" {...form.register('type')}>
              {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'].map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </Select>
          </div>
          <Input label="Salary range (optional)" placeholder="€60k–€80k" {...form.register('salaryRange')} />
          <Textarea
            label="Description (markdown)"
            className="min-h-40 font-mono text-xs"
            {...form.register('description', { required: true })}
          />
          <Textarea
            label="Requirements (one per line)"
            className="min-h-28"
            {...form.register('requirements')}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-brand-500" {...form.register('isOpen')} />
            Accepting applications
          </label>
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Save posting
          </Button>
        </form>
      </Modal>
    </>
  );
}

function Applications() {
  const queryClient = useQueryClient();
  const { data: applications, isLoading } = useApiQuery<Application[]>(
    ['applications'],
    '/careers/applications',
  );

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/careers/applications/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  if (isLoading) return <TableSkeleton />;
  if ((applications?.length ?? 0) === 0) return <EmptyState title="No applications yet" />;

  return (
    <div className="space-y-3">
      {applications!.map((app) => (
        <div key={app.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{app.name}</p>
              <p className="text-sm text-[rgb(var(--muted))]">
                {app.posting.title} ·{' '}
                <a href={`mailto:${app.email}`} className="text-brand-500 hover:underline">
                  {app.email}
                </a>
                {app.phone && ` · ${app.phone}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={app.status} />
              <Select
                aria-label="Change application status"
                value={app.status}
                onChange={(e) => updateStatus.mutate({ id: app.id, status: e.target.value })}
                className="!h-8 !w-36 !py-1 text-xs"
              >
                {APP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {humanize(s)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {app.coverLetter && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-[rgb(var(--muted))]">{app.coverLetter}</p>
          )}
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">Applied {formatDate(app.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}
