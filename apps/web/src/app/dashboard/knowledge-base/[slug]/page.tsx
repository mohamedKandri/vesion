'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { KbArticle } from '@/lib/types';
import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function KbArticlePage() {
  const params = useParams<{ slug: string }>();
  const [voted, setVoted] = useState(false);
  const { data: article, isLoading } = useApiQuery<KbArticle>(
    ['kb-article', params.slug],
    `/knowledge-base/articles/${params.slug}`,
  );

  async function vote(helpful: boolean) {
    setVoted(true);
    try {
      await api.post(`/knowledge-base/articles/${params.slug}/feedback`, { helpful }, { anonymous: true });
    } catch {
      // feedback is best-effort
    }
  }

  if (isLoading || !article) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/knowledge-base"
        className="text-sm font-medium text-brand-500 hover:underline"
      >
        ← Knowledge base
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-500">
        {article.category.name}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{article.title}</h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        Updated {formatDate(article.updatedAt)} · {article.views} views
      </p>

      {article.body && (
        <div className="mt-8">
          <Markdown content={article.body} />
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-[rgb(var(--card-border))] p-6 text-center">
        {voted ? (
          <p className="text-sm font-medium">Thanks for the feedback! 🙌</p>
        ) : (
          <>
            <p className="text-sm font-medium">Was this article helpful?</p>
            <div className="mt-3 flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => vote(true)}>
                👍 Yes
              </Button>
              <Button variant="outline" size="sm" onClick={() => vote(false)}>
                👎 Not really
              </Button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
