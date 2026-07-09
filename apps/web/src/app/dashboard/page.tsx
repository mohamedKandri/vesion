'use client';

import Link from 'next/link';
import { useApiQuery } from '@/lib/hooks';
import type { ClientOverview } from '@/lib/types';
import { useAuth } from '@/lib/auth-store';
import { PageHeader, StatCard } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney, formatDate, timeAgo } from '@/lib/utils';

export default function ClientOverviewPage() {
  const user = useAuth((s) => s.user);
  const { data, isLoading } = useApiQuery<ClientOverview>(['client-overview'], '/analytics/client');

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ''} 👋`}
        description="Here's what's happening across your projects."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Active projects"
                value={data.projects.filter((p) => !['COMPLETED', 'CANCELLED'].includes(p.status)).length}
                icon="▤"
              />
              <StatCard
                label="Outstanding balance"
                value={formatMoney(data.billing.outstandingAmount)}
                hint={`${data.billing.openInvoices} open invoice${data.billing.openInvoices === 1 ? '' : 's'}`}
                icon="⬚"
              />
              <StatCard label="Open support tickets" value={data.openTickets} icon="☎" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader
                  title="Your projects"
                  action={
                    <Link href="/dashboard/projects" className="text-sm font-medium text-brand-500 hover:underline">
                      View all →
                    </Link>
                  }
                />
                {data.projects.length === 0 ? (
                  <EmptyState
                    title="No projects yet"
                    description="Once we kick off your first project, it will appear here."
                  />
                ) : (
                  <div className="space-y-4">
                    {data.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className="block rounded-xl border border-[rgb(var(--card-border))] p-4 transition hover:border-brand-500/50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{project.name}</p>
                          <StatusBadge status={project.status} />
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <Progress value={project.progress} label={`${project.name} progress`} className="flex-1" />
                          <span className="text-sm font-semibold">{project.progress}%</span>
                        </div>
                        {project.dueDate && (
                          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                            Target: {formatDate(project.dueDate)}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader
                  title="Recent activity"
                  action={
                    <Link href="/dashboard/notifications" className="text-sm font-medium text-brand-500 hover:underline">
                      All →
                    </Link>
                  }
                />
                {data.recentNotifications.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--muted))]">Nothing new yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {data.recentNotifications.map((n) => (
                      <li key={n.id} className="flex gap-3">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug">{n.title}</p>
                          <p className="text-xs text-[rgb(var(--muted))]">{timeAgo(n.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )
      )}
    </>
  );
}
