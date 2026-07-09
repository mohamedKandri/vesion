import Link from 'next/link';
import type { PortfolioItem } from '@/lib/types';

const INDUSTRY_GRADIENTS: Record<string, string> = {
  Logistics: 'from-brand-600 to-sky-600',
  Healthcare: 'from-emerald-600 to-teal-600',
  'E-commerce': 'from-accent-600 to-pink-600',
  Manufacturing: 'from-amber-600 to-orange-600',
};

export function PortfolioCard({ item }: { item: PortfolioItem }) {
  const gradient = INDUSTRY_GRADIENTS[item.industry ?? ''] ?? 'from-brand-600 to-accent-600';
  const href = item.isCaseStudy ? `/case-studies/${item.slug}` : `/portfolio/${item.slug}`;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-sm"
    >
      <div
        aria-hidden="true"
        className={`relative flex h-44 items-end bg-gradient-to-br ${gradient} p-5`}
      >
        <span className="font-display text-2xl font-bold text-white/95 transition group-hover:scale-[1.02]">
          {item.title.split('—')[0].trim()}
        </span>
        {item.isCaseStudy && (
          <span className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            Case study
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {item.industry && (
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
            {item.industry}
          </span>
        )}
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[rgb(var(--muted))]">{item.summary}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium dark:bg-white/10"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
