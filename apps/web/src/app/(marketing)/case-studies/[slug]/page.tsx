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
  if (!item) return { title: 'Case study not found' };
  return { title: `${item.title} — Case Study`, description: item.summary };
}

const SECTIONS = [
  { key: 'challenge', label: 'The challenge', icon: '⚡' },
  { key: 'solution', label: 'Our solution', icon: '🛠️' },
  { key: 'results', label: 'The results', icon: '📈' },
] as const;

export default async function CaseStudyPage({ params }: Props) {
  const item = await serverFetch<PortfolioItem>(`/portfolio/${params.slug}`, 300);
  if (!item || !item.isCaseStudy) notFound();

  return (
    <>
      <article className="container-page max-w-4xl py-24">
        <Link href="/case-studies" className="text-sm font-medium text-brand-500 hover:underline">
          ← All case studies
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-500">
          Case study · {item.industry}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          {item.title}
        </h1>
        <p className="mt-4 text-lg text-[rgb(var(--muted))]">{item.summary}</p>

        {item.metrics && item.metrics.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {item.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl bg-brand-gradient p-[1px]"
              >
                <div className="h-full rounded-2xl bg-[rgb(var(--card))] p-5 text-center">
                  <p className="font-display text-xl font-bold text-gradient">{metric.value}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">{metric.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 space-y-8">
          {SECTIONS.map(({ key, label, icon }) => {
            const content = item[key];
            if (!content) return null;
            return (
              <section
                key={key}
                className="rounded-3xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-8"
              >
                <h2 className="font-display text-xl font-bold">
                  <span aria-hidden="true" className="mr-2">
                    {icon}
                  </span>
                  {label}
                </h2>
                <p className="mt-3 leading-relaxed text-[rgb(var(--muted))]">{content}</p>
              </section>
            );
          })}
        </div>

        {item.content && <div className="mt-12"><Markdown content={item.content} /></div>}

        <div className="mt-8 flex flex-wrap gap-2">
          {item.technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500"
            >
              {tech}
            </span>
          ))}
        </div>
      </article>
      <Cta />
    </>
  );
}
