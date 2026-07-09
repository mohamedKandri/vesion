'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery } from '@/lib/hooks';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Select } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';

interface Submission {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  service?: string | null;
  budget?: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const STATUSES = ['NEW', 'IN_REVIEW', 'CONTACTED', 'CLOSED'];

export default function CrmPage() {
  const [tab, setTab] = useState('NEW');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = usePagedQuery<Submission>(['crm'], '/contact/submissions', {
    page,
    limit: 15,
    status: tab === 'ALL' ? undefined : tab,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/contact/submissions/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm'] }),
  });

  return (
    <>
      <PageHeader title="CRM inbox" description="Enquiries from the website contact form." />
      <Tabs
        tabs={[...STATUSES.map((s) => ({ id: s, label: s.replace('_', ' ').toLowerCase() })), { id: 'ALL', label: 'all' }]}
        active={tab}
        onChange={(id) => {
          setTab(id);
          setPage(1);
        }}
        className="mb-6"
      />

      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState icon="📥" title="Inbox zero" description="No enquiries in this state." />
      ) : (
        <>
          <div className="space-y-4">
            {data!.items.map((submission) => (
              <div key={submission.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {submission.name}
                      {submission.company && (
                        <span className="text-[rgb(var(--muted))]"> · {submission.company}</span>
                      )}
                    </p>
                    <a href={`mailto:${submission.email}`} className="text-sm text-brand-500 hover:underline">
                      {submission.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={submission.status} />
                    <Select
                      aria-label="Change status"
                      value={submission.status}
                      onChange={(e) => updateStatus.mutate({ id: submission.id, status: e.target.value })}
                      className="!h-8 !w-36 !py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ')}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {submission.service && (
                    <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 font-semibold text-brand-500">
                      {submission.service}
                    </span>
                  )}
                  {submission.budget && (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-500">
                      {submission.budget}
                    </span>
                  )}
                  <span className="text-[rgb(var(--muted))]">{formatDateTime(submission.createdAt)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {submission.message}
                </p>
              </div>
            ))}
          </div>
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
