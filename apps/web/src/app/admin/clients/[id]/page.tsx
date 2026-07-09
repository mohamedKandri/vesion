'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApiQuery } from '@/lib/hooks';
import type { Company } from '@/lib/types';
import { PageHeader, StatCard } from '@/components/dashboard/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function AdminClientDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: company, isLoading } = useApiQuery<Company>(['company', params.id], `/companies/${params.id}`);

  if (isLoading || !company) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={company.name}
        description={[company.industry, company.city, company.country].filter(Boolean).join(' · ') || undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Projects" value={company._count?.projects ?? 0} icon="▤" />
        <StatCard label="Invoices" value={company._count?.invoices ?? 0} icon="⬚" />
        <StatCard label="Tickets" value={company._count?.tickets ?? 0} icon="☎" />
        <StatCard label="Subscriptions" value={company._count?.subscriptions ?? 0} icon="↻" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="People" description="Users with access to this company's dashboard." />
          {(company.users?.length ?? 0) === 0 ? (
            <p className="text-sm text-[rgb(var(--muted))]">No user accounts linked yet.</p>
          ) : (
            <ul className="space-y-3">
              {company.users!.map((user) => (
                <li key={user.id} className="flex items-center gap-3">
                  <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      {user.jobTitle ? `${user.jobTitle} · ` : ''}
                      {user.email}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Details" />
          <dl className="space-y-3 text-sm">
            {[
              ['Website', company.website],
              ['Tax / VAT ID', company.taxId],
              ['Address', company.address],
              ['Client since', formatDate(company.createdAt)],
              ['Notes', company.notes],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">{label}</dt>
                <dd className="mt-0.5">{value || '—'}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex gap-4 border-t border-[rgb(var(--card-border))] pt-4 text-sm">
            <Link href={`/admin/projects?companyId=${company.id}`} className="font-medium text-brand-500 hover:underline">
              View projects →
            </Link>
            <Link href={`/admin/invoices?companyId=${company.id}`} className="font-medium text-brand-500 hover:underline">
              View invoices →
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
