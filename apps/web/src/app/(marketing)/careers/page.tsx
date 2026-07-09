import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/api';
import type { JobPosting } from '@/lib/types';
import { SectionHeading, Reveal } from '@/components/marketing/section';
import { EmptyState } from '@/components/ui/empty-state';
import { humanize } from '@/lib/utils';
import { COMPANY_VALUES } from '@/content/site';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join VESION — a remote-first senior engineering studio. Open positions in engineering and design.',
};

export default async function CareersPage() {
  const postings = (await serverFetch<JobPosting[]>('/careers/postings', 120)) ?? [];

  return (
    <>
      <section className="container-page py-24">
        <SectionHeading
          eyebrow="Careers"
          title="Do the best work of your career"
          description="Remote-first, senior-only, and allergic to bureaucracy. We hire people we'd trust with our own product."
        />

        {postings.length === 0 ? (
          <EmptyState
            title="No open positions right now"
            description="We're always happy to hear from great people — send an open application to hello@vesion.dev."
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {postings.map((posting, i) => (
              <Reveal key={posting.id} delay={i * 0.06}>
                <Link
                  href={`/careers/${posting.slug}`}
                  className="group flex flex-col justify-between gap-3 rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-6 transition hover:border-brand-500/50 hover:shadow-glow-sm sm:flex-row sm:items-center"
                >
                  <div>
                    <h2 className="font-display text-lg font-semibold group-hover:text-brand-500">
                      {posting.title}
                    </h2>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                      {posting.department} · {posting.location} · {humanize(posting.type)}
                      {posting.salaryRange && ` · ${posting.salaryRange}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-500">Apply →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="container-page pb-24">
        <SectionHeading eyebrow="Why VESION" title="How we treat our people" />
        <div className="grid gap-6 md:grid-cols-2">
          {COMPANY_VALUES.map((value, i) => (
            <Reveal key={value.title} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-6">
                <h3 className="font-display font-semibold text-brand-500">{value.title}</h3>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{value.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
