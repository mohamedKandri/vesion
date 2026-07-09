'use client';

import { useApiQuery } from '@/lib/hooks';
import type { AuditLog } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/utils';

const ACTION_ICONS: Record<string, string> = {
  auth: '🔐',
  invoices: '⬚',
  payments: '◇',
  tickets: '☎',
  projects: '▤',
  tasks: '☑',
};

export default function ActivityPage() {
  const { data: activity, isLoading } = useApiQuery<AuditLog[]>(['my-activity'], '/users/me/activity');

  return (
    <>
      <PageHeader title="Activity history" description="A trail of actions performed with your account." />

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (activity?.length ?? 0) === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <ol className="relative max-w-2xl space-y-0 border-l-2 border-[rgb(var(--card-border))] pl-6">
          {activity!.map((entry) => {
            const prefix = entry.action.split('.')[0];
            return (
              <li key={entry.id} className="relative pb-6">
                <span
                  aria-hidden="true"
                  className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] text-[10px]"
                >
                  {ACTION_ICONS[prefix] ?? '·'}
                </span>
                <p className="text-sm font-medium">
                  {entry.action.replace(/\./g, ' → ').replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {formatDateTime(entry.createdAt)}
                  {entry.ip && ` · ${entry.ip}`}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
