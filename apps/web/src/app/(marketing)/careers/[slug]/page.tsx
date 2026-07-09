import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/api';
import type { JobPosting } from '@/lib/types';
import { Markdown } from '@/components/markdown';
import { humanize } from '@/lib/utils';
import { ApplyForm } from './apply-form';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const posting = await serverFetch<JobPosting>(`/careers/postings/${params.slug}`, 120);
  if (!posting) return { title: 'Position not found' };
  return { title: `${posting.title} — Careers` };
}

export default async function JobPostingPage({ params }: Props) {
  const posting = await serverFetch<JobPosting>(`/careers/postings/${params.slug}`, 120);
  if (!posting) notFound();

  return (
    <div className="container-page grid max-w-6xl gap-12 py-24 lg:grid-cols-[1fr_400px]">
      <article>
        <Link href="/careers" className="text-sm font-medium text-brand-500 hover:underline">
          ← All positions
        </Link>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {posting.title}
        </h1>
        <p className="mt-3 text-[rgb(var(--muted))]">
          {posting.department} · {posting.location} · {humanize(posting.type)}
          {posting.salaryRange && ` · ${posting.salaryRange}`}
        </p>

        {posting.description && (
          <div className="mt-8">
            <Markdown content={posting.description} />
          </div>
        )}

        {posting.requirements && posting.requirements.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold">What we're looking for</h2>
            <ul className="mt-4 space-y-2.5">
              {posting.requirements.map((req) => (
                <li key={req} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span aria-hidden="true" className="mt-0.5 text-brand-500">
                    ✓
                  </span>
                  {req}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <ApplyForm slug={posting.slug} title={posting.title} />
      </aside>
    </div>
  );
}
