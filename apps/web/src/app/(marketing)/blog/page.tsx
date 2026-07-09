import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/api';
import type { BlogPost, Paginated } from '@/lib/types';
import { SectionHeading } from '@/components/marketing/section';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Engineering, design, and business insights from the VESION team.',
};

export default async function BlogPage() {
  const posts = await serverFetch<Paginated<BlogPost>>('/blog/posts?limit=24', 120);
  const items = posts?.items ?? [];

  return (
    <section className="container-page py-24">
      <SectionHeading
        eyebrow="Blog"
        title="Notes from the workshop"
        description="What we learn building software, written down so you don't repeat our mistakes."
      />

      {items.length === 0 ? (
        <EmptyState title="No posts yet" description="The first articles are on their way." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-sm"
            >
              <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                {post.category && (
                  <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 font-semibold text-brand-500">
                    {post.category.name}
                  </span>
                )}
                <span>{formatDate(post.publishedAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{post.readingMinutes} min read</span>
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold leading-snug group-hover:text-brand-500">
                {post.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {post.excerpt}
              </p>
              {post.author && (
                <p className="mt-4 text-xs text-[rgb(var(--muted))]">
                  By {post.author.firstName} {post.author.lastName}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
