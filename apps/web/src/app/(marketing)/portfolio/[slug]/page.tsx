import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/api';
import type { PortfolioItem } from '@/lib/types';
import { Markdown } from '@/components/markdown';
import { Cta } from '@/components/marketing/cta';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await serverFetch<PortfolioItem>(`/portfolio/${params.slug}`, 300);
  if (!item) return { title: 'Project not found' };
  return { title: item.title, description: item.summary };
}

export default async function PortfolioDetailPage({ params }: Props) {
  const item = await serverFetch<PortfolioItem>(`/portfolio/${params.slug}`, 300);
  if (!item) notFound();

  return (
    <>
      <article className="container-page max-w-4xl py-24">
        <Link href="/portfolio" className="text-sm font-medium text-brand-500 hover:underline">
          ← Back to portfolio
        </Link>
        {item.industry && (
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-500">
            {item.industry}
          </p>
        )}
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          {item.title}
        </h1>
        <p className="mt-4 text-lg text-[rgb(var(--muted))]">{item.summary}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {item.technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500"
            >
              {tech}
            </span>
          ))}
        </div>

        {item.metrics && item.metrics.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {item.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-5 text-center"
              >
                <p className="font-display text-xl font-bold text-gradient">{metric.value}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {item.content && <div className="mt-10"><Markdown content={item.content} /></div>}
      </article>
      <Cta />
    </>
  );
}
