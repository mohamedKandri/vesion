'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePagedQuery, useApiQuery } from '@/lib/hooks';
import type { KbArticle, KbCategory } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { Input } from '@/components/ui/input';
import { CardGridSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data: categories } = useApiQuery<KbCategory[]>(['kb-categories'], '/knowledge-base/categories');
  const { data, isLoading } = usePagedQuery<KbArticle>(['kb-articles'], '/knowledge-base/articles', {
    page,
    limit: 12,
    search: search || undefined,
    category: category || undefined,
  });

  return (
    <>
      <PageHeader title="Knowledge base" description="Guides and answers for everything Vesion." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search articles…"
            aria-label="Search knowledge base"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            onClick={() => setCategory('')}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
              category === ''
                ? 'bg-brand-500/15 text-brand-500'
                : 'border border-[rgb(var(--card-border))] text-[rgb(var(--muted))]',
            )}
          >
            All
          </button>
          {(categories ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategory(c.slug);
                setPage(1);
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                category === c.slug
                  ? 'bg-brand-500/15 text-brand-500'
                  : 'border border-[rgb(var(--card-border))] text-[rgb(var(--muted))]',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No articles found" description="Try a different search term or category." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data!.items.map((article) => (
              <Link
                key={article.id}
                href={`/dashboard/knowledge-base/${article.slug}`}
                className="card flex h-full flex-col p-5 transition hover:border-brand-500/50"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                  {article.category.name}
                </span>
                <h2 className="mt-2 font-display font-semibold leading-snug">{article.title}</h2>
                <p className="mt-2 flex-1 text-sm text-[rgb(var(--muted))]">{article.excerpt}</p>
                <p className="mt-3 text-xs text-[rgb(var(--muted))]">{article.views} views</p>
              </Link>
            ))}
          </div>
          <Pagination meta={data!.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
