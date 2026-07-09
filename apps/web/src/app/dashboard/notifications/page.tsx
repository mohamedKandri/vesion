'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery } from '@/lib/hooks';
import type { Notification } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/table';
import { cn, timeAgo, humanize } from '@/lib/utils';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { data, isLoading } = usePagedQuery<Notification>(['notifications', 'page'], '/notifications', {
    page,
    limit: 20,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything that happened across your account."
        action={
          <Button variant="outline" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
            Mark all read
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up." />
      ) : (
        <>
          <div className="space-y-2">
            {data!.items.map((n) => {
              const inner = (
                <div
                  className={cn(
                    'card flex items-start gap-4 p-4 transition hover:border-brand-500/40',
                    !n.readAt && 'border-brand-500/30 bg-brand-500/[0.04]',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                      n.readAt ? 'bg-[rgb(var(--card-border))]' : 'bg-brand-500',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-sm text-[rgb(var(--muted))]">{n.body}</p>}
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {humanize(n.type)} · {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => !n.readAt && markRead.mutate(n.id)} className="block">
                  {inner}
                </Link>
              ) : (
                <button
                  key={n.id}
                  onClick={() => !n.readAt && markRead.mutate(n.id)}
                  className="block w-full text-left"
                >
                  {inner}
                </button>
              );
            })}
          </div>
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
