'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApiQuery } from '@/lib/hooks';
import type { AdminAnalytics } from '@/lib/types';
import { PageHeader, StatCard } from '@/components/dashboard/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, humanize, timeAgo } from '@/lib/utils';

const STATUS_COLORS = ['#6366f1', '#8b5cf6', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#64748b'];

export default function AdminOverviewPage() {
  const { data, isLoading } = useApiQuery<AdminAnalytics>(['admin-analytics'], '/analytics/admin');

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="Overview" description="Business at a glance." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="mt-6 h-80" />
      </>
    );
  }

  const { kpis } = data;

  return (
    <>
      <PageHeader title="Overview" description="Business at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue this month" value={formatMoney(kpis.revenueThisMonth)} icon="◆" />
        <StatCard
          label="Outstanding receivables"
          value={formatMoney(kpis.outstandingReceivables)}
          hint={`${kpis.overdueInvoices} overdue invoice${kpis.overdueInvoices === 1 ? '' : 's'}`}
          icon="⬚"
        />
        <StatCard
          label="Active projects"
          value={kpis.activeProjects}
          hint={`${kpis.completedProjects} completed all-time`}
          icon="▤"
        />
        <StatCard label="Open tickets" value={kpis.openTickets} hint={`${kpis.clients} client companies`} icon="☎" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue" description="Completed payments over the last 12 months." />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByMonth} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,160,0.15)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m: string) => m.slice(5)}
                  tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value: number) => [formatMoney(value), 'Revenue']}
                  contentStyle={{
                    background: 'rgb(var(--card))',
                    border: '1px solid rgb(var(--card-border))',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Projects by status" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.projectsByStatus}
                  dataKey="count"
                  nameKey="status"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={3}
                >
                  {data.projectsByStatus.map((entry, i) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, humanize(name)]}
                  contentStyle={{
                    background: 'rgb(var(--card))',
                    border: '1px solid rgb(var(--card-border))',
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {data.projectsByStatus.map((entry, i) => (
              <li key={entry.status} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }}
                />
                <span className="flex-1 text-[rgb(var(--muted))]">{humanize(entry.status)}</span>
                <span className="font-semibold">{entry.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent activity" description="Latest entries from the audit trail." />
        <ul className="divide-y divide-[rgb(var(--card-border))]">
          {data.recentActivity.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="rounded-lg bg-brand-500/10 px-2 py-0.5 font-mono text-xs text-brand-500">
                {entry.action}
              </span>
              <span className="flex-1 truncate text-[rgb(var(--muted))]">
                {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : 'System'}
                {entry.entityId ? ` · ${entry.entityType} ${entry.entityId.slice(0, 8)}` : ''}
              </span>
              <span className="text-xs text-[rgb(var(--muted))]">{timeAgo(entry.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
